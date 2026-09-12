// Credit Assessment Domain
export interface CreditAssessmentSummary {
  applicationId: string;
  applicationNo: string;
  customerId: string;
  customerName: string;
  cibilScore: number;
  foirPct: number;
  dtiPct: number;
  declaredMonthlyIncome: number;
  verifiedMonthlyIncome: number;
  isEligible: boolean;
  maxSanctionLimit: number;
}
