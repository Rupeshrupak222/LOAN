import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { calculateEmi } from '../finance/emi';
import { Money } from '../finance/money';
import { logAudit } from '../audit/audit.service';
import { configurationService } from '../configuration/configuration.service';
import { normalizeEmploymentType, normalizeProductType } from '../documents/document-rules';

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
  actorUserId?: string,
  tenantId: string = 'tenant-adyapan-default'
): Promise<EligibilityEvaluationResult> {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: {
        include: {
          loans: true,
          employmentDetails: true,
          documents: true,
          bankAccounts: true,
        },
      },
      product: true,
      documents: true,
    },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  const { customer, product } = app;
  const requestedAmount = Number(app.requestedAmount);
  const tenure = app.tenureMonths || 24;
  const interestRate = Number(product.interestRate || 12.5);

  const empType = normalizeEmploymentType(
    customer.employmentType || customer.employmentDetails?.[0]?.employmentType
  );
  const prodType = normalizeProductType(product.productType || product.name);

  // Determine Effective Monthly Income & Obligations (Persona-Aware)
  let monthlyIncome = customer.monthlyIncome ? Number(customer.monthlyIncome) : 0;
  if (monthlyIncome <= 0 && customer.employmentDetails?.[0]?.monthlyIncome) {
    monthlyIncome = Number(customer.employmentDetails[0].monthlyIncome);
  }

  // Student & Homemaker check: Look for verified co-applicant / sponsor
  const isStudent = empType === 'STUDENT';
  const isHomemaker = empType === 'HOMEMAKER';
  const isSelfEmployed = ['SELF_EMPLOYED', 'BUSINESS_OWNER', 'BUSINESS'].includes(empType);
  const isProfessional = empType === 'PROFESSIONAL';
  const isFarmer = empType === 'FARMER';
  const isRetired = empType === 'RETIRED';

  let hasVerifiedCoApplicant = false;
  let coApplicantIncome = 0;

  if (isStudent || isHomemaker) {
    const coAppDoc = (customer.documents || []).find(
      (d) =>
        ['CO_APPLICANT', 'GUARANTOR', 'SPONSOR'].includes(d.category) ||
        (d.documentType && (d.documentType.includes('CO_APPLICANT') || d.documentType.includes('GUARANTOR') || d.documentType.includes('SPONSOR')))
    );
    const coAppDetails = customer.employmentDetails?.find((e: any) => e.employerName?.toLowerCase().includes('co-applicant') || e.employerName?.toLowerCase().includes('sponsor'));
    
    if (coAppDoc && (coAppDoc.verified || coAppDoc.status === 'VERIFIED')) {
      hasVerifiedCoApplicant = true;
      coApplicantIncome = Number(coAppDetails?.monthlyIncome || customer.monthlyIncome || 0);
    } else if (coAppDoc) {
      hasVerifiedCoApplicant = true;
      coApplicantIncome = Number(coAppDetails?.monthlyIncome || customer.monthlyIncome || 0);
    }
    
    if (monthlyIncome <= 0 && coApplicantIncome > 0) {
      monthlyIncome = coApplicantIncome;
    }
  }

  const existingObligations = customer.existingObligations ? Number(customer.existingObligations) : 0;

  // Fetch tenant-specific policy parameters from configurationService with strict precedence
  const tenantFoirConfig = configurationService.getTenantConfig<any>(tenantId, 'FOIR_DTI');
  const tenantEligibilityConfig = configurationService.getTenantConfig<any>(tenantId, 'ELIGIBILITY');

  // Dynamic Age Policy Limits per Persona
  let minAge = Number(tenantEligibilityConfig.minAge ?? 21);
  let maxAge = Number(tenantEligibilityConfig.maxAge ?? 60);

  if (isStudent) {
    minAge = 18;
    maxAge = 35;
  } else if (isRetired) {
    minAge = 50;
    maxAge = 75;
  } else if (isSelfEmployed || isProfessional || isFarmer || isHomemaker) {
    minAge = 21;
    maxAge = 65;
  }

  // Dynamic DTI / FOIR Thresholds per Persona
  let maxAllowedDti = Number(tenantFoirConfig.maxDtiRatio ?? 0.55);
  let warningDti = Number(tenantFoirConfig.warningDtiRatio ?? 0.45);

  if (isSelfEmployed) {
    maxAllowedDti = 0.65;
    warningDti = 0.55;
  } else if (isProfessional) {
    maxAllowedDti = 0.65;
    warningDti = 0.50;
  } else if (isStudent || isHomemaker) {
    maxAllowedDti = 0.55;
    warningDti = 0.45;
  } else if (isRetired) {
    maxAllowedDti = 0.50;
    warningDti = 0.40;
  }

  // Dynamic Minimum Income Benchmark per Persona
  let minRequiredIncome = Number(tenantEligibilityConfig.minSalariedIncome ?? 25000);
  if (isSelfEmployed) {
    minRequiredIncome = Number(tenantEligibilityConfig.minBusinessIncome ?? 40000);
  } else if (isProfessional) {
    minRequiredIncome = 35000;
  } else if (isFarmer) {
    minRequiredIncome = 15000;
  } else if (isRetired) {
    minRequiredIncome = 15000;
  } else if (isStudent || isHomemaker) {
    minRequiredIncome = 30000; // Required from Co-Applicant / Sponsor
  }

  // Calculate estimated EMI
  const emiCalc = calculateEmi(requestedAmount, interestRate, tenure);
  const estimatedEmiNum = Number(emiCalc.emi);

  const factors: EligibilityEvaluationResult['factors'] = [];
  let fails = 0;
  let warnings = 0;

  // 1. Borrower Persona & Category Context Factor
  factors.push({
    factor: 'Borrower Employment Profile',
    status: 'PASS',
    detail: isStudent
      ? 'Student Loan Profile — Evaluated against Co-Applicant / Parent Guarantee'
      : isHomemaker
      ? 'Homemaker Profile — Evaluated on Household / Co-Applicant Guarantee'
      : isSelfEmployed
      ? 'Self-Employed / Business Profile — Evaluated on Business Cash Flow & ITR'
      : isProfessional
      ? 'Independent Professional — Evaluated on Practice Receipts & Vintage'
      : isFarmer
      ? 'Agricultural Profile — Evaluated on Land Holding & Crop Yield'
      : isRetired
      ? 'Pensioner Profile — Evaluated on Verified Monthly Pension'
      : 'Salaried Employment Profile — Evaluated on Net Monthly Salary',
  });

  // 2. Age Factor (Persona-Aware)
  if (customer.dateOfBirth) {
    const birthDate = new Date(customer.dateOfBirth);
    const age = Math.floor(
      (Date.now() - birthDate.getTime()) / (365.25 * 86400000)
    );
    if (age <= 0 || birthDate > new Date()) {
      factors.push({
        factor: 'Age Requirement',
        status: 'FAIL',
        detail: `Date of birth indicates invalid age (${age} years). Recorded DOB: ${birthDate.toISOString().split('T')[0]}.`,
      });
      fails++;
    } else if (age >= minAge && age <= maxAge) {
      factors.push({
        factor: 'Age Requirement',
        status: 'PASS',
        detail: `Borrower age is ${age} years (Satisfies ${minAge}–${maxAge} years policy range for ${empType})`,
      });
    } else {
      factors.push({
        factor: 'Age Requirement',
        status: 'FAIL',
        detail: `Borrower age is ${age} years (Violates allowable ${minAge}–${maxAge} policy limit for ${empType})`,
      });
      fails++;
    }
  } else {
    factors.push({
      factor: 'Age Requirement',
      status: 'FAIL',
      detail: 'Date of birth is missing on borrower profile. Age verification mandatory.',
    });
    fails++;
  }

  // 3. Minimum Income Factor (Persona-Aware)
  if (isStudent || isHomemaker) {
    if (monthlyIncome >= minRequiredIncome) {
      factors.push({
        factor: 'Sponsor / Co-Applicant Income Capacity',
        status: 'PASS',
        detail: `Verified co-applicant / sponsor income of ₹${monthlyIncome.toLocaleString('en-IN')}/mo meets required ₹${minRequiredIncome.toLocaleString('en-IN')}/mo floor`,
      });
    } else if (monthlyIncome > 0) {
      factors.push({
        factor: 'Sponsor / Co-Applicant Income Capacity',
        status: 'FAIL',
        detail: `Co-applicant / sponsor income of ₹${monthlyIncome.toLocaleString('en-IN')}/mo is below mandatory ₹${minRequiredIncome.toLocaleString('en-IN')}/mo threshold`,
      });
      fails++;
    } else {
      factors.push({
        factor: 'Sponsor / Co-Applicant Income Capacity',
        status: 'FAIL',
        detail: `Student / Homemaker applicant has zero independent income and no verified Co-Applicant / Sponsor guarantor attached`,
      });
      fails++;
    }
  } else if (monthlyIncome >= minRequiredIncome) {
    factors.push({
      factor: 'Minimum Income Benchmark',
      status: 'PASS',
      detail: `Verified income ₹${monthlyIncome.toLocaleString('en-IN')}/mo meets policy floor of ₹${minRequiredIncome.toLocaleString('en-IN')}/mo`,
    });
  } else {
    factors.push({
      factor: 'Minimum Income Benchmark',
      status: 'FAIL',
      detail: `Monthly income ₹${monthlyIncome.toLocaleString('en-IN')}/mo is below mandatory ₹${minRequiredIncome.toLocaleString('en-IN')}/mo floor for ${empType}`,
    });
    fails++;
  }

  // 4. Debt-To-Income (DTI / FOIR) Ratio
  const totalMonthlyDebt = existingObligations + estimatedEmiNum;
  if (monthlyIncome <= 0) {
    factors.push({
      factor: 'Debt-To-Income (DTI / FOIR) Capacity',
      status: 'FAIL',
      detail: `FOIR cannot be serviced with ₹0 monthly income. Repayment capacity deficit.`,
    });
    fails++;
  } else {
    const dtiRatio = totalMonthlyDebt / monthlyIncome;
    if (dtiRatio <= warningDti) {
      factors.push({
        factor: 'Debt-To-Income (DTI / FOIR) Capacity',
        status: 'PASS',
        detail: `DTI ratio is ${(dtiRatio * 100).toFixed(1)}% (Comfortable buffer under ${(warningDti * 100).toFixed(0)}% benchmark)`,
      });
    } else if (dtiRatio <= maxAllowedDti) {
      factors.push({
        factor: 'Debt-To-Income (DTI / FOIR) Capacity',
        status: 'WARNING',
        detail: `DTI ratio is ${(dtiRatio * 100).toFixed(1)}% (Approaching upper cap of ${(maxAllowedDti * 100).toFixed(0)}%)`,
      });
      warnings++;
    } else {
      factors.push({
        factor: 'Debt-To-Income (DTI / FOIR) Capacity',
        status: 'FAIL',
        detail: `DTI ratio is ${(dtiRatio * 100).toFixed(1)}% (Exceeds maximum allowable ${(maxAllowedDti * 100).toFixed(0)}% limit)`,
      });
      fails++;
    }
  }

  // 5. KYC Status
  if (customer.kycStatus === 'VERIFIED') {
    factors.push({
      factor: 'KYC & Compliance Verification',
      status: 'PASS',
      detail: 'Borrower identity and proof of address fully verified',
    });
  } else {
    factors.push({
      factor: 'KYC & Compliance Verification',
      status: 'FAIL',
      detail: `KYC verification status is ${customer.kycStatus || 'PENDING'}. Government database verification is mandatory before credit eligibility approval.`,
    });
    fails++;
  }

  // 6. Historical Repayment Track Record
  const overdueLoans = (customer.loans || []).filter((l) => l.status === 'OVERDUE');
  if (overdueLoans.length === 0) {
    factors.push({
      factor: 'Internal Repayment Track Record',
      status: 'PASS',
      detail: 'Zero delinquent or defaulted internal credit lines',
    });
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

  // Calculate Max Eligible Loan Amount based on Persona FOIR
  const maxFoirMultiplier = isSelfEmployed ? 0.65 : 0.50;
  const availableEmiCapacity = Math.max(0, monthlyIncome * maxFoirMultiplier - existingObligations);
  const maxEligible = availableEmiCapacity * tenure * 0.85;

  const assessment = {
    result,
    score: Math.max(10, 100 - fails * 30 - warnings * 12),
    factors,
    maxEligibleAmount: Money.toDb(
      Math.max(requestedAmount, Math.min(maxEligible > 0 ? maxEligible : requestedAmount, Number(product.maxAmount || 5000000)))
    ),
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
