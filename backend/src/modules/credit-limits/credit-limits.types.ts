/**
 * Adyapan Lending OS — Phase 5: Credit Limit Engine Domain Types
 */

import { RiskGrade, DecisionOutcome } from '../bre/decision-engine.types';

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
  maxLimitCap: number; // e.g. 200000 for A, 25000 for D
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
  
  // Exposure Governance
  maxCustomerExposure: number; // e.g. ₹5,00,000 max total exposure across all facilities
  maxActiveFacilitiesPerCustomer: number; // e.g. 2
  maxConcurrentDrawdowns: number; // e.g. 5
  
  // Risk Bounds
  riskLimitCaps: RiskLimitCap[];
  
  // Drawdown Rules
  minDrawdownAmount: number; // e.g. ₹1,000
  maxDrawdownAmount?: number; // e.g. ₹1,00,000 or up to available
  drawdownFeePct: number; // e.g. 0.5%
  drawdownFeeMinInr: number; // e.g. ₹100
  gstRatePct: number; // default 18.0%
  
  // Lifecycle & Restorations
  repaymentRestoresLimit: boolean; // default true for revolving
  excessExposurePolicy: 'BLOCK_DRAWDOWN' | 'ACCELERATE_REPAYMENT' | 'ALLOW_SERVICING_ONLY';
  validityMonths: number; // default 12 or 24 months
  
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
  
  // Financial terms
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
  
  // Linked LMS records
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
  
  // Authoritative Balances (Money Decimal.js based)
  approvedLimit: number;
  currentLimit: number; // same as approvedLimit unless temporary override
  utilizedAmount: number;
  availableAmount: number;
  excessExposure: number; // if utilized > approvedLimit during decrease
  
  status: CreditFacilityStatus;
  statusReason?: string;
  
  riskGrade: RiskGrade;
  riskScore: number;
  
  // Governance & Lineage Bindings
  decisionId?: string;
  decisionVersion?: number;
  approvalTaskId?: string;
  approvalPolicyVersion?: number;
  offerId?: string;
  offerVersion?: number;
  policyId: string;
  policyVersion: number;
  limitVersion: number;
  
  // Drawdown limits
  minDrawdownAmount: number;
  maxDrawdownAmount: number;
  annualInterestRatePct: number;
  
  effectiveFrom: string;
  expiresAt: string;
  isExpired: boolean;
  
  // Related lists (in-memory or joined)
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
  
  totalExposure: number; // termLoansOutstanding + creditLinesUtilized
  maxExposureCap: number;
  remainingExposureCapacity: number; // maxExposureCap - totalExposure
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
  amount?: number;
  requestedAmount?: number;
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

export interface CreditActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
  firstName?: string;
  lastName?: string;
}
