/**
 * Frontend Domain Types for Phase 4: Offer Engine
 */

export type OfferStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'PENDING_ACCEPTANCE'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'SUPERSEDED';

export type InterestModelType =
  | 'REDUCING_BALANCE'
  | 'FIXED_FLAT'
  | 'FLOATING_MCLR';

export type RepaymentFrequency =
  | 'MONTHLY'
  | 'BI_WEEKLY'
  | 'BULLET_END';

export type RiskGrade = 'A' | 'B' | 'C' | 'D' | 'E';
export type DecisionOutcome = 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REFER' | 'REJECT';

export interface AmortizationRow {
  emiNumber: number;
  principal: string;
  interest: string;
  emi: string;
  balance: string;
}

export interface PricingRiskAdjustment {
  riskGrade: RiskGrade;
  spreadBps: number;
  maxTenureMonths?: number;
  maxAmountCap?: number;
  isOfferable: boolean;
}

export interface CreatePricingPolicyDto {
  productId?: string;
  productCode?: string;
  code: string;
  name: string;
  description: string;
  interestModel?: InterestModelType;
  baseRateAnnualPct: number;
  riskAdjustments?: PricingRiskAdjustment[];
  feeOverrides?: {
    processingFeePct?: number;
    processingFeeMinInr?: number;
    documentationChargesInr?: number;
    platformFeeInr?: number;
    gstRatePct?: number;
  };
  maxValidityHours?: number;
  allowMultipleActiveOffers?: boolean;
  allowCounterOffer?: boolean;
}

export interface PricingPolicy {
  id: string;
  tenantId: string;
  productId?: string;
  productCode?: string;
  code: string;
  name: string;
  description: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  interestModel: InterestModelType;
  baseRateAnnualPct: number;
  riskAdjustments: PricingRiskAdjustment[];
  feeOverrides?: {
    processingFeePct?: number;
    processingFeeMinInr?: number;
    documentationChargesInr?: number;
    platformFeeInr?: number;
    gstRatePct?: number;
  };
  maxValidityHours: number;
  allowMultipleActiveOffers: boolean;
  allowCounterOffer: boolean;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferConditionItem {
  id: string;
  code: string;
  title: string;
  description: string;
  isMandatory: boolean;
  category: 'DOCUMENT' | 'VERIFICATION' | 'BANK_MANDATE' | 'COLLATERAL' | 'SPECIAL';
  status: 'PENDING' | 'SATISFIED' | 'WAIVED';
  verifiedBy?: string;
  verifiedAt?: string;
  comments?: string;
}

export interface LoanOffer {
  id: string;
  offerNo: string;
  applicationId: string;
  applicationNo: string;
  tenantId: string;
  branchId?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerMobile?: string;
  productId: string;
  productCode: string;
  productName: string;
  productVersion: number;
  
  decisionId?: string;
  decisionVersion?: number;
  riskGrade: RiskGrade;
  riskScore: number;
  breDecision: DecisionOutcome;
  approvalTaskId?: string;
  approvalPolicyVersion?: number;
  pricingPolicyId: string;
  pricingPolicyVersion: number;
  
  version: number;
  status: OfferStatus;
  
  requestedAmount: number;
  breEligibleAmount: number;
  approvedAmount: number;
  offeredAmount: number;
  tenureMonths: number;
  
  interestModel: InterestModelType;
  annualInterestRatePct: number;
  baseInterestRatePct: number;
  riskSpreadPct: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  
  processingFee: number;
  processingFeeGst: number;
  documentationCharges: number;
  documentationChargesGst: number;
  platformFee: number;
  platformFeeGst: number;
  otherFees: number;
  totalFeesAndTaxes: number;
  netDisbursedAmount: number;
  
  annualPercentageRateApr: number;
  repaymentFrequency: RepaymentFrequency;
  
  validUntil: string;
  isExpired: boolean;
  
  conditions: OfferConditionItem[];
  schedulePreview: AmortizationRow[];
  
  acceptedAt?: string;
  acceptedBy?: string;
  acceptedByName?: string;
  acceptanceMethod?: string;
  
  declinedAt?: string;
  declinedBy?: string;
  declineReason?: string;
  
  cancelledAt?: string;
  cancelReason?: string;
  
  supersededByOfferId?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface OfferSimulationInput {
  productId?: string;
  loanAmount: number;
  tenureMonths: number;
  riskGrade?: RiskGrade;
  interestModel?: InterestModelType;
  customRatePct?: number;
}

export interface OfferSimulationResult {
  loanAmount: number;
  tenureMonths: number;
  interestModel: InterestModelType;
  annualInterestRatePct: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  processingFee: number;
  processingFeeGst: number;
  documentationCharges: number;
  documentationChargesGst: number;
  platformFee: number;
  totalFeesAndTaxes: number;
  netDisbursedAmount: number;
  annualPercentageRateApr: number;
  schedulePreview: AmortizationRow[];
  kfsSummary: {
    sanctionAmount: number;
    installmentAmount: number;
    aprPct: number;
    totalInterest: number;
    totalDeductions: number;
    netDisbursed: number;
  };
}

export interface GenerateOfferDto {
  customOfferedAmount?: number;
  customTenureMonths?: number;
  overrideRatePct?: number;
  customConditions?: Array<{
    code: string;
    title: string;
    description: string;
    isMandatory?: boolean;
    category?: 'DOCUMENT' | 'VERIFICATION' | 'BANK_MANDATE' | 'COLLATERAL' | 'SPECIAL';
  }>;
  notes?: string;
}

export interface AcceptOfferDto {
  acceptanceMethod?: 'CUSTOMER_PORTAL_OTP' | 'BORROWER_APP' | 'ESIGN_ASSISTED' | 'OPERATIONS_OVERRIDE';
  ipAddress?: string;
  userAgent?: string;
  kfsAccepted: boolean;
  termsAccepted: boolean;
}

export interface DeclineOfferDto {
  reason: string;
  comments?: string;
}
