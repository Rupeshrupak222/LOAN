// Phase 1: Lending OS Product Engine Domain Types

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
  processingFeePct: number; // e.g. 2.0%
  processingFeeMinInr: number; // e.g. ₹1000
  documentationChargesInr: number; // e.g. ₹500
  platformFeeInr?: number; // e.g. ₹250
  foreclosurePenaltyPct: number; // e.g. 3.0%
  lockInMonths: number; // e.g. 6 months
  latePaymentPenaltyMonthlyPct: number; // e.g. 2.0% per month
  gracePeriodDays: number; // e.g. 3 days
  bounceChargeInr?: number; // e.g. ₹500
}

export interface EligibilityConfig {
  minAge: number; // e.g. 21
  maxAge: number; // e.g. 60
  minMonthlyIncome: number; // e.g. ₹25,000
  allowedEmploymentTypes: Array<'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL'>;
  allowedSegments?: string[]; // e.g. ['PRIME', 'GROWTH', 'MASS']
  residenceRequirement?: string; // e.g. 'INDIAN_RESIDENT'
}

export interface DocumentRequirement {
  category: 'IDENTITY' | 'ADDRESS' | 'INCOME' | 'BANK_STATEMENT' | 'BUSINESS' | 'AGREEMENT';
  documentType: string; // e.g. 'PAN', 'AADHAAR', 'SALARY_SLIP', 'BANK_STATEMENT_6M'
  mandatory: boolean;
  description: string;
}

export interface CreditPolicyConfig {
  minCibilScore: number; // e.g. 650
  maxFoirPct: number; // e.g. 50%
  maxDtiPct?: number; // e.g. 45%
  bureauProvider?: 'CIBIL' | 'EXPERIAN' | 'CRIF' | 'EQUIFAX';
}

export interface RiskPolicyConfig {
  riskGrade: 'LOW' | 'MEDIUM' | 'HIGH';
  maxFraudScore: number; // e.g. 40
  manualReviewThresholdScore?: number; // e.g. 60
  pennyDropRequired: boolean;
  livenessCheckRequired: boolean;
}

export interface ApprovalAuthorityConfig {
  branchManagerLimitInr: number; // e.g. ₹5,00,000
  creditAnalystLimitInr: number; // e.g. ₹15,00,000
  underwriterLimitInr: number; // e.g. ₹50,00,000
  requiresCommitteeApprovalAboveInr: number; // e.g. ₹50,00,000
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
  baseInterestRateAnnualPct: number; // e.g. 13.5%
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
  annualPercentageRateApr: number; // Statutory APR under RBI KFS guidelines
  keyFactStatement: KeyFactStatement;
  eligibilityCheck: {
    eligible: boolean;
    reasons: string[];
    computedFoirPct?: number;
  };
}
