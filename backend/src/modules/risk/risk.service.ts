import { RiskCategory } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export interface RiskEvaluationResult {
  score: number;
  category: RiskCategory;
  factors: {
    name: string;
    weight: number;
    score: number;
    remarks: string;
  }[];
  recommendation: string;
}

export async function evaluateApplicationRisk(
  applicationId: string,
  actorUserId?: string
): Promise<RiskEvaluationResult> {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: {
        include: {
          employmentDetails: true,
          documents: true,
          loans: { include: { schedule: true } },
        },
      },
      product: true,
    },
  });
  if (!app) throw new NotFoundError('Loan application not found');

  const { customer, product } = app;
  const factors: RiskEvaluationResult['factors'] = [];

  // Fetch dynamic weights from SystemSetting
  const weightsSetting = await prisma.systemSetting.findUnique({
    where: { key: 'risk_model_weights' },
  });
  const weights = (weightsSetting?.value as any) || {
    employmentVintage: 25,
    debtServiceCapacity: 30,
    documentCompleteness: 20,
    creditHistory: 25,
  };

  // 1. Employment Stability
  const expYears = customer.employmentDetails[0]?.workExperienceYears || 2;
  let empScore = 60;
  if (expYears >= 5) empScore = 95;
  else if (expYears >= 2) empScore = 80;
  else empScore = 50;

  factors.push({
    name: 'Employment Vintage & Stability',
    weight: Number(weights.employmentVintage ?? 25),
    score: empScore,
    remarks: `${expYears} years in ${customer.employmentType || 'current role'}`,
  });

  // 2. Financial Buffer & DTI
  const income = Number(customer.monthlyIncome || 0);
  const obligations = Number(customer.existingObligations || 0);
  const dti = income > 0 ? obligations / income : 1;
  let dtiScore = 60;
  if (dti <= 0.25) dtiScore = 95;
  else if (dti <= 0.45) dtiScore = 75;
  else if (dti <= 0.6) dtiScore = 55;
  else dtiScore = 30;

  factors.push({
    name: 'Debt Service Capacity & Cash Flow',
    weight: Number(weights.debtServiceCapacity ?? 30),
    score: dtiScore,
    remarks: `Fixed obligation ratio of ${(dti * 100).toFixed(0)}%`,
  });

  // 3. Document Verification Completeness
  const verifiedDocs = customer.documents.filter((d) => d.verified).length;
  let docScore = verifiedDocs >= 2 ? 90 : verifiedDocs === 1 ? 65 : 40;

  factors.push({
    name: 'KYC & Document Authenticity',
    weight: Number(weights.documentCompleteness ?? 20),
    score: docScore,
    remarks: `${verifiedDocs} verified compliance document(s) on record`,
  });

  // 4. Repayment History & Bureau Performance
  const overdueCount = customer.loans.filter((l) => l.status === 'OVERDUE').length;
  let historyScore = overdueCount === 0 ? 90 : 25;

  factors.push({
    name: 'Credit History & Default Risk',
    weight: Number(weights.creditHistory ?? 25),
    score: historyScore,
    remarks: overdueCount === 0 ? 'Flawless track record with no past default' : `${overdueCount} delinquent account(s)`,
  });

  // Weighted total score
  const totalScore = Math.round(
    factors.reduce((acc, f) => acc + (f.score * f.weight) / 100, 0)
  );

  let category: RiskCategory = 'LOW';
  let recommendation = 'Low risk profile. Recommend standard approval.';
  if (totalScore < 55) {
    category = 'HIGH';
    recommendation = 'High risk profile. Recommend collateral, guarantor or reduction in loan amount.';
  } else if (totalScore < 75) {
    category = 'MEDIUM';
    recommendation = 'Moderate risk profile. Recommend standard verification of income docs.';
  }

  // Update customer risk category & save risk assessment
  await prisma.$transaction([
    prisma.riskAssessment.upsert({
      where: { applicationId },
      update: {
        score: totalScore,
        category,
        factors: factors as any,
      },
      create: {
        applicationId,
        score: totalScore,
        category,
        factors: factors as any,
      },
    }),
    prisma.customer.update({
      where: { id: customer.id },
      data: { riskCategory: category },
    }),
  ]);

  await logAudit({
    userId: actorUserId,
    action: 'RISK_ASSESSED',
    entity: 'LoanApplication',
    entityId: applicationId,
    newValue: { score: totalScore, category },
  });

  return {
    score: totalScore,
    category,
    factors,
    recommendation,
  };
}
