/**
 * Adyapan Lending OS — Phase 5: Credit Limit Engine Frontend Domain Types
 */

export type RiskGrade = 'A' | 'B' | 'C' | 'D' | 'E';

export type FacilityType =
  | 'REVOLVING_CREDIT'
  | 'CREDIT_LINE'
  | 'BNPL'
  | 'ONE_TIME_LOAN'
  | 'OVERDRAFT';

export type CreditFacilityStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'FROZEN'
  | 'EXPIRED'
  | 'CLOSED'
  | 'CANCELLED';

export type DrawdownStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'DISBURSED'
  | 'CANCELLED'
  | 'REJECTED';

export type LimitAdjustmentType =
  | 'INITIAL_ASSIGNMENT'
  | 'INCREASE'
  | 'DECREASE'
  | 'OVERRIDE'
  | 'PERIODIC_REVIEW'
  | 'EXPOSURE_REDUCTION';

export type CreditFacilityTxType =
  | 'LIMIT_ASSIGNED'
  | 'LIMIT_INCREASED'
  | 'LIMIT_DECREASED'
  | 'LIMIT_OVERRIDDEN'
  | 'DRAWDOWN'
  | 'REPAYMENT_CREDIT'
  | 'REPAYMENT_REVERSED'
  | 'ADJUSTMENT'
  | 'SUSPENSION'
  | 'RESUMPTION'
  | 'EXPIRY'
  | 'CLOSURE';

export interface RiskLimitCap {
  riskGrade: RiskGrade;
  maxLimitCap: number;
  allowRevolving: boolean;
  minCibilScore: number;
}

export interface CreditLimitPolicy {
  id: string;
  tenantId: string;
  productId?: string;
  productCode?: string;
  code: string;
  name: string;
  description: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  
  maxCustomerExposure: number;
  maxActiveFacilitiesPerCustomer: number;
  maxConcurrentDrawdowns: number;
  
  riskLimitCaps: RiskLimitCap[];
  
  minDrawdownAmount: number;
  maxDrawdownAmount?: number;
  drawdownFeePct: number;
  drawdownFeeMinInr: number;
  gstRatePct: number;
  
  repaymentRestoresLimit: boolean;
  excessExposurePolicy: 'BLOCK_DRAWDOWN' | 'ACCELERATE_REPAYMENT' | 'ALLOW_SERVICING_ONLY';
  validityMonths: number;
  
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreditLimitPolicyDto {
  productId?: string;
  productCode?: string;
  code: string;
  name: string;
  description: string;
  maxCustomerExposure: number;
  maxActiveFacilitiesPerCustomer?: number;
  maxConcurrentDrawdowns?: number;
  riskLimitCaps?: RiskLimitCap[];
  minDrawdownAmount?: number;
  maxDrawdownAmount?: number;
  drawdownFeePct?: number;
  drawdownFeeMinInr?: number;
  gstRatePct?: number;
  repaymentRestoresLimit?: boolean;
  excessExposurePolicy?: 'BLOCK_DRAWDOWN' | 'ACCELERATE_REPAYMENT' | 'ALLOW_SERVICING_ONLY';
  validityMonths?: number;
}

export interface CreditFacilityTransaction {
  id: string;
  facilityId: string;
  facilityNo: string;
  tenantId: string;
  type: CreditFacilityTxType;
  amount: number;
  previousApprovedLimit: number;
  newApprovedLimit: number;
  previousUtilized: number;
  newUtilized: number;
  previousAvailable: number;
  newAvailable: number;
  reference?: string;
  description: string;
  drawdownId?: string;
  loanId?: string;
  paymentId?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  createdAt: string;
}

export interface LimitAdjustmentRecord {
  id: string;
  facilityId: string;
  version: number;
  adjustmentType: LimitAdjustmentType;
  oldLimit: number;
  newLimit: number;
  reasonCode: string;
  comments: string;
  decisionVersion?: number;
  authorityVersion?: number;
  approvedBy: string;
  approvedByRole: string;
  createdAt: string;
}

export interface Drawdown {
  id: string;
  drawdownNo: string;
  facilityId: string;
  facilityNo: string;
  tenantId: string;
  branchId?: string;
  customerId: string;
  customerName: string;
  customerMobile?: string;
  productId: string;
  productCode: string;
  productName: string;
  
  requestedAmount: number;
  feeAmount: number;
  feeGst: number;
  totalDeductions: number;
  netDisbursedAmount: number;
  tenureMonths: number;
  interestRatePct: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  
  status: DrawdownStatus;
  rejectionReason?: string;
  cancellationReason?: string;
  
  loanId?: string;
  loanNo?: string;
  disbursementId?: string;
  
  purpose?: string;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  disbursedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditFacility {
  id: string;
  facilityNo: string;
  tenantId: string;
  branchId?: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  customerEmail?: string;
  customerMobile?: string;
  
  productId: string;
  productCode: string;
  productName: string;
  productVersion: number;
  facilityType: FacilityType;
  
  approvedLimit: number;
  currentLimit: number;
  utilizedAmount: number;
  availableAmount: number;
  excessExposure: number;
  
  status: CreditFacilityStatus;
  statusReason?: string;
  
  riskGrade: RiskGrade;
  riskScore: number;
  
  decisionId?: string;
  decisionVersion?: number;
  approvalTaskId?: string;
  approvalPolicyVersion?: number;
  offerId?: string;
  offerVersion?: number;
  policyId: string;
  policyVersion: number;
  limitVersion: number;
  
  minDrawdownAmount: number;
  maxDrawdownAmount: number;
  annualInterestRatePct: number;
  
  effectiveFrom: string;
  expiresAt: string;
  isExpired: boolean;
  
  drawdowns?: Drawdown[];
  transactions?: CreditFacilityTransaction[];
  adjustments?: LimitAdjustmentRecord[];
  
  createdAt: string;
  updatedAt: string;
}

export interface CustomerExposureSummary {
  customerId: string;
  customerName: string;
  customerCode: string;
  tenantId: string;
  
  termLoansOutstanding: number;
  activeFacilitiesCount: number;
  creditLinesSanctioned: number;
  creditLinesUtilized: number;
  creditLinesAvailable: number;
  
  totalExposure: number;
  maxExposureCap: number;
  remainingExposureCapacity: number;
  utilizationPct: number;
  
  facilities: Array<{
    facilityId: string;
    facilityNo: string;
    productName: string;
    facilityType: FacilityType;
    approvedLimit: number;
    utilizedAmount: number;
    availableAmount: number;
    status: CreditFacilityStatus;
  }>;
}

export interface RequestDrawdownDto {
  amount: number;
  tenureMonths?: number;
  purpose?: string;
  bankAccountId?: string;
}

export interface LimitAdjustmentDto {
  newLimit: number;
  adjustmentType: LimitAdjustmentType;
  reasonCode: string;
  comments: string;
  isManualOverride?: boolean;
}

export interface CreditLimitSimulationInput {
  productId?: string;
  declaredMonthlyIncome: number;
  existingMonthlyObligations: number;
  cibilScore?: number;
  riskGrade?: RiskGrade;
  existingExposure?: number;
  requestedLimit: number;
  facilityType?: FacilityType;
}

export interface CreditLimitSimulationResult {
  requestedLimit: number;
  eligibleLimit: number;
  approvedLimit: number;
  availableLimit: number;
  riskGrade: RiskGrade;
  facilityType: FacilityType;
  
  monthlyDisposableIncome: number;
  maxFoirAllowedPct: number;
  maxAffordabilityLimit: number;
  productMaxCap: number;
  riskGradeCap: number;
  customerExposureCap: number;
  existingExposure: number;
  remainingExposureCapacity: number;
  
  drawdownSimulation: {
    sampleDrawdownAmount: number;
    drawdownFee: number;
    drawdownFeeGst: number;
    netDisbursed: number;
    sampleTenureMonths: number;
    annualInterestRatePct: number;
    estimatedMonthlyEmi: number;
  };
  
  constraintsApplied: Array<{
    constraint: string;
    value: number;
    isBinding: boolean;
  }>;
  isApproved: boolean;
  notes: string[];
}
