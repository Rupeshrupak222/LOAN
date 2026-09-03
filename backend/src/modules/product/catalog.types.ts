// Step 36: Enterprise Dynamic Loan Product Catalog Types

export type ProductCategory =
  | 'PERSONAL'
  | 'SME_BUSINESS'
  | 'BNPL_LINE'
  | 'EDUCATION'
  | 'VEHICLE'
  | 'GOLD_SECURED'
  | 'HOME_LOAN';

export type InterestCalculationModel =
  | 'FIXED_FLAT'
  | 'REDUCING_BALANCE'
  | 'FLOATING_MCLR_LINKED';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED';

export interface FeeSchedule {
  processingFeePct: number; // e.g. 2.0%
  processingFeeMinInr: number; // e.g. ₹1000
  documentationChargesInr: number; // e.g. ₹500
  foreclosurePenaltyPct: number; // e.g. 3.0% if closed before lockInMonths
  lockInMonths: number; // e.g. 6 months
  latePaymentPenaltyMonthlyPct: number; // e.g. 2.0% per month
  gracePeriodDays: number; // e.g. 3 days
}

export interface UnderwritingPolicyOverrides {
  maxFoirPct?: number; // e.g. 50%
  minCibilScore?: number; // e.g. 680
  minMonthlyIncome?: number; // e.g. 30000
  requiredKycDocs?: string[];
}

export interface DynamicLoanProduct {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  category: ProductCategory;
  version: number;
  status: ProductStatus;
  interestModel: InterestCalculationModel;
  baseInterestRateAnnualPct: number; // e.g. 14.5%
  mclrSpreadAnnualPct?: number; // for floating loans
  minLoanAmountInr: number;
  maxLoanAmountInr: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  feeSchedule: FeeSchedule;
  policyOverrides: UnderwritingPolicyOverrides;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDynamicProductDto {
  code: string;
  name: string;
  description: string;
  category: ProductCategory;
  interestModel: InterestCalculationModel;
  baseInterestRateAnnualPct: number;
  mclrSpreadAnnualPct?: number;
  minLoanAmountInr: number;
  maxLoanAmountInr: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  feeSchedule: FeeSchedule;
  policyOverrides?: UnderwritingPolicyOverrides;
}

export interface UpdateDynamicProductDto {
  name?: string;
  description?: string;
  status?: ProductStatus;
  baseInterestRateAnnualPct?: number;
  mclrSpreadAnnualPct?: number;
  minLoanAmountInr?: number;
  maxLoanAmountInr?: number;
  minTenureMonths?: number;
  maxTenureMonths?: number;
  feeSchedule?: Partial<FeeSchedule>;
  policyOverrides?: Partial<UnderwritingPolicyOverrides>;
}

export interface ProductPricingSimulationInput {
  productId: string;
  loanAmount: number;
  tenureMonths: number;
  applicantProfile?: {
    cibilScore?: number;
    monthlyIncome?: number;
    existingEmis?: number;
  };
}

export interface KeyFactStatement {
  sanctionAmount: number;
  rateOfInterestType: string;
  rateOfInterestPct: number;
  tenureMonths: number;
  installmentAmount: number;
  totalPayableAmount: number;
  processingFeeWithGst: number;
  documentationFee: number;
  foreclosureCharges: string;
  overdueCharges: string;
  coolingOffPeriodDays: number;
}

export interface ProductPricingSimulationResult {
  productId: string;
  productName: string;
  productCode: string;
  version: number;
  loanAmount: number;
  tenureMonths: number;
  interestModel: InterestCalculationModel;
  appliedInterestRateAnnualPct: number;
  monthlyEmi: number;
  totalInterest: number;
  processingFee: number;
  documentationCharges: number;
  totalFees: number;
  netDisbursedAmount: number;
  totalRepaymentAmount: number;
  annualPercentageRateApr: number; // Statutory APR under RBI KFS rules
  keyFactStatement: KeyFactStatement;
  eligibilityCheck: {
    eligible: boolean;
    reasons: string[];
    computedFoirPct?: number;
  };
}
