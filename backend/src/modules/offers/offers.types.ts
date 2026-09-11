/**
 * Adyapan Lending OS — Phase 4: Offer Engine Domain Types
 */

import { RiskGrade, DecisionOutcome } from '../bre/decision-engine.types';
import { AmortizationRow } from '../finance/emi';
import { KfsDocument } from '../contracts/contracts.types';

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

export interface PricingRiskAdjustment {
  riskGrade: RiskGrade;
  spreadBps: number; // e.g. -50 for A (-0.5%), +150 for C (+1.5%)
  maxTenureMonths?: number;
  maxAmountCap?: number;
  isOfferable: boolean;
}

export interface AmountSlabPricing {
  minAmount: number;
  maxAmount: number;
  rateSpreadBps: number;
  processingFeePctOverride?: number;
}

export interface TenureSlabPricing {
  minTenureMonths: number;
  maxTenureMonths: number;
  rateSpreadBps: number;
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
  amountSlabs?: AmountSlabPricing[];
  tenureSlabs?: TenureSlabPricing[];
  feeOverrides?: {
    processingFeePct?: number;
    processingFeeMinInr?: number;
    documentationChargesInr?: number;
    platformFeeInr?: number;
    gstRatePct?: number; // default 18.0
  };
  maxValidityHours: number; // e.g. 48 hours
  allowMultipleActiveOffers: boolean;
  allowCounterOffer: boolean;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
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
  amountSlabs?: AmountSlabPricing[];
  tenureSlabs?: TenureSlabPricing[];
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
  
  // Traceability & Snapshot Bindings
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
  
  // Authoritative Amounts
  requestedAmount: number;
  breEligibleAmount: number;
  approvedAmount: number;
  offeredAmount: number;
  tenureMonths: number;
  
  // Pricing & Financial Breakdown
  interestModel: InterestModelType;
  annualInterestRatePct: number;
  baseInterestRatePct: number;
  riskSpreadPct: number;
  monthlyEmi: number;
  totalInterest: number;
  totalRepayment: number;
  
  // Transparent Fee & Statutory Tax Breakdown
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
  
  // Validity & Dates
  validUntil: string;
  isExpired: boolean;
  
  conditions: OfferConditionItem[];
  kfsDocument?: KfsDocument;
  schedulePreview: AmortizationRow[];
  
  // Acceptance & Audit Trails
  acceptedAt?: string;
  acceptedBy?: string;
  acceptedByName?: string;
  acceptanceMethod?: 'CUSTOMER_PORTAL_OTP' | 'BORROWER_APP' | 'ESIGN_ASSISTED' | 'OPERATIONS_OVERRIDE';
  acceptanceMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
    acknowledgedKfsVersion?: string;
  };
  
  declinedAt?: string;
  declinedBy?: string;
  declineReason?: string;
  
  cancelledAt?: string;
  cancelledBy?: string;
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

export interface OfferActorContext {
  id?: string;
  email?: string;
  roles?: string[];
  tenantId?: string;
  branchId?: string;
  firstName?: string;
  lastName?: string;
}
