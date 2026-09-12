// Product Domain Types for Lending OS

export type ProductType =
  | 'PERSONAL_LOAN'
  | 'INSTANT_PERSONAL_LOAN'
  | 'SALARY_LOAN'
  | 'BUSINESS_LOAN'
  | 'EDUCATION_LOAN'
  | 'MERCHANT_LOAN'
  | 'CREDIT_LINE'
  | 'BNPL'
  | 'OTHER';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type InterestCalculationModel =
  | 'FIXED_FLAT'
  | 'REDUCING_BALANCE'
  | 'FLOATING_MCLR_LINKED';

export type LendingChannel =
  | 'DIRECT_BORROWER'
  | 'LOAN_OFFICER'
  | 'BRANCH'
  | 'PARTNER'
  | 'API';

export interface FeeScheduleConfig {
  processingFeePct: number;
  processingFeeMinInr: number;
  documentationChargesInr: number;
  platformFeeInr?: number;
  foreclosurePenaltyPct: number;
  lockInMonths: number;
  latePaymentPenaltyMonthlyPct: number;
  gracePeriodDays: number;
  bounceChargeInr?: number;
}

export interface EligibilityConfig {
  minAge: number;
  maxAge: number;
  minMonthlyIncome: number;
  allowedEmploymentTypes: Array<'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL'>;
  allowedSegments?: string[];
  residenceRequirement?: string;
}

export interface DocumentRequirement {
  category: 'IDENTITY' | 'ADDRESS' | 'INCOME' | 'BANK_STATEMENT' | 'BUSINESS' | 'AGREEMENT';
  documentType: string;
  mandatory: boolean;
  description: string;
}

export interface CreditPolicyConfig {
  minCibilScore: number;
  maxFoirPct: number;
  maxDtiPct?: number;
  bureauProvider?: 'CIBIL' | 'EXPERIAN' | 'CRIF' | 'EQUIFAX';
}

export interface RiskPolicyConfig {
  riskGrade: 'LOW' | 'MEDIUM' | 'HIGH';
  maxFraudScore: number;
  manualReviewThresholdScore?: number;
  pennyDropRequired: boolean;
  livenessCheckRequired: boolean;
}

export interface ApprovalAuthorityConfig {
  branchManagerLimitInr: number;
  creditAnalystLimitInr: number;
  underwriterLimitInr: number;
  requiresCommitteeApprovalAboveInr: number;
}

export interface LendingProduct {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  productType: ProductType;
  status: ProductStatus;
  version: number;
  isDefault: boolean;

  // Amount Configuration
  minAmount: number;
  maxAmount: number;
  defaultAmount?: number;
  amountIncrement?: number;

  // Tenure Configuration
  minTenureMonths: number;
  maxTenureMonths: number;
  allowedTenures?: number[];

  // Interest Configuration
  interestModel: InterestCalculationModel;
  baseInterestRateAnnualPct: number;
  mclrSpreadAnnualPct?: number;

  // Configuration Domains
  feeSchedule: FeeScheduleConfig;
  eligibility: EligibilityConfig;
  documents: DocumentRequirement[];
  creditPolicy: CreditPolicyConfig;
  riskPolicy: RiskPolicyConfig;
  approvalConfig?: ApprovalAuthorityConfig;

  // Workflow & Channel Binding
  workflowId: string;
  workflowCode?: string;
  allowedChannels: LendingChannel[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  code: string;
  name: string;
  description: string;
  productType: ProductType;
  minAmount: number;
  maxAmount: number;
  defaultAmount?: number;
  amountIncrement?: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  allowedTenures?: number[];
  interestModel: InterestCalculationModel;
  baseInterestRateAnnualPct: number;
  mclrSpreadAnnualPct?: number;
  feeSchedule: FeeScheduleConfig;
  eligibility: EligibilityConfig;
  documents?: DocumentRequirement[];
  creditPolicy: CreditPolicyConfig;
  riskPolicy: RiskPolicyConfig;
  approvalConfig?: ApprovalAuthorityConfig;
  workflowId?: string;
  allowedChannels?: LendingChannel[];
  isDefault?: boolean;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: ProductStatus;
}

export interface ProductPricingSimulationInput {
  productId: string;
  loanAmount: number;
  tenureMonths: number;
  applicantProfile?: {
    cibilScore?: number;
    monthlyIncome?: number;
    existingEmis?: number;
    employmentType?: string;
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
  annualPercentageRateApr: number;
  keyFactStatement: KeyFactStatement;
  eligibilityCheck: {
    eligible: boolean;
    reasons: string[];
    computedFoirPct?: number;
  };
}
