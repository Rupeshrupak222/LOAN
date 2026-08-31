import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { calculateEmi } from '../finance/emi';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';

export interface EligibilityEvaluationResult {
  result: 'ELIGIBLE' | 'CONDITIONALLY_ELIGIBLE' | 'NOT_ELIGIBLE';
  score: number;
  factors: {
    factor: string;
    status: 'PASS' | 'WARNING' | 'FAIL';
    detail: string;
  }[];
  maxEligibleAmount: string;
  estimatedEmi: string;
}

export async function evaluateApplicationEligibility(
  applicationId: string,
  actorUserId?: string
): Promise<EligibilityEvaluationResult> {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: {
        include: { loans: true },
      },
      product: true,
    },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  const { customer, product } = app;
  const requestedAmount = Number(app.requestedAmount);
  const tenure = app.tenureMonths;
  const interestRate = Number(product.interestRate);
  const monthlyIncome = customer.monthlyIncome ? Number(customer.monthlyIncome) : 0;
  const existingObligations = customer.existingObligations ? Number(customer.existingObligations) : 0;

  // Calculate estimated EMI
  const emiCalc = calculateEmi(requestedAmount, interestRate, tenure);
  const estimatedEmiNum = Number(emiCalc.emi);

  const factors: EligibilityEvaluationResult['factors'] = [];
  let fails = 0;
  let warnings = 0;

  // 1. Age Factor
  if (customer.dateOfBirth) {
    const age = Math.floor(
      (Date.now() - new Date(customer.dateOfBirth).getTime()) / (365.25 * 86400000)
    );
    if (age >= 21 && age <= 60) {
      factors.push({ factor: 'Age Requirement', status: 'PASS', detail: `Age is ${age} years (Policy: 21-60 years)` });
    } else {
      factors.push({ factor: 'Age Requirement', status: 'FAIL', detail: `Age is ${age} years (Outside allowed 21-60 range)` });
      fails++;
    }
  } else {
    factors.push({ factor: 'Age Requirement', status: 'WARNING', detail: 'Date of birth not verified' });
    warnings++;
  }

  // 2. Minimum Income Factor
  const minRequiredIncome = product.productType === 'BUSINESS' ? 50000 : 25000;
  if (monthlyIncome >= minRequiredIncome) {
    factors.push({
      factor: 'Minimum Monthly Income',
      status: 'PASS',
      detail: `Monthly income ₹${monthlyIncome.toLocaleString('en-IN')} meets min threshold of ₹${minRequiredIncome.toLocaleString('en-IN')}`,
    });
  } else {
    factors.push({
      factor: 'Minimum Monthly Income',
      status: 'FAIL',
      detail: `Monthly income ₹${monthlyIncome.toLocaleString('en-IN')} below required ₹${minRequiredIncome.toLocaleString('en-IN')}`,
    });
    fails++;
  }

  // 3. Debt-To-Income (DTI / FOIR) Ratio
  const totalMonthlyDebt = existingObligations + estimatedEmiNum;
  const dtiRatio = monthlyIncome > 0 ? totalMonthlyDebt / monthlyIncome : 1;
  const maxAllowedDti = 0.55;

  if (dtiRatio <= 0.45) {
    factors.push({
      factor: 'Debt-To-Income (DTI) Ratio',
      status: 'PASS',
      detail: `DTI ratio is ${(dtiRatio * 100).toFixed(1)}% (Healthy capacity under 45%)`,
    });
  } else if (dtiRatio <= maxAllowedDti) {
    factors.push({
      factor: 'Debt-To-Income (DTI) Ratio',
      status: 'WARNING',
      detail: `DTI ratio is ${(dtiRatio * 100).toFixed(1)}% (Approaching threshold limit 55%)`,
    });
    warnings++;
  } else {
    factors.push({
      factor: 'Debt-To-Income (DTI) Ratio',
      status: 'FAIL',
      detail: `DTI ratio is ${(dtiRatio * 100).toFixed(1)}% (Exceeds maximum allowable 55% threshold)`,
    });
    fails++;
  }

  // 4. KYC Status
  if (customer.kycStatus === 'VERIFIED') {
    factors.push({ factor: 'KYC Compliance', status: 'PASS', detail: 'Borrower identity and address fully verified' });
  } else if (customer.kycStatus === 'SUBMITTED' || customer.kycStatus === 'UNDER_REVIEW') {
    factors.push({ factor: 'KYC Compliance', status: 'WARNING', detail: 'KYC documents under review' });
    warnings++;
  } else {
    factors.push({ factor: 'KYC Compliance', status: 'FAIL', detail: 'KYC verification pending' });
    fails++;
  }

  // 5. Historical Repayment Track Record
  const overdueLoans = customer.loans.filter((l) => l.status === 'OVERDUE');
  if (overdueLoans.length === 0) {
    factors.push({ factor: 'Internal Repayment Track Record', status: 'PASS', detail: 'Zero delinquent or defaulted accounts' });
  } else {
    factors.push({
      factor: 'Internal Repayment Track Record',
      status: 'FAIL',
      detail: `${overdueLoans.length} active account(s) in overdue status`,
    });
    fails++;
  }

  // Final Decision Synthesis
  let result: EligibilityEvaluationResult['result'] = 'ELIGIBLE';
  if (fails > 0) result = 'NOT_ELIGIBLE';
  else if (warnings > 0) result = 'CONDITIONALLY_ELIGIBLE';

  // Calculate Max Eligible Loan Amount based on 50% DTI
  const availableEmiCapacity = Math.max(0, monthlyIncome * 0.5 - existingObligations);
  const maxEligible = availableEmiCapacity * tenure * 0.85; // approx principal capacity

  const assessment = {
    result,
    score: Math.max(10, 100 - fails * 35 - warnings * 15),
    factors,
    maxEligibleAmount: Money.toDb(Math.min(maxEligible, Number(product.maxAmount))),
    estimatedEmi: emiCalc.emi,
  };

  // Upsert into database
  await prisma.eligibilityAssessment.upsert({
    where: { applicationId },
    update: {
      result,
      factors: assessment.factors as any,
    },
    create: {
      applicationId,
      result,
      factors: assessment.factors as any,
    },
  });

  await logAudit({
    userId: actorUserId,
    action: 'ELIGIBILITY_ASSESSED',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: { result, score: assessment.score },
  });

  return assessment;
}
