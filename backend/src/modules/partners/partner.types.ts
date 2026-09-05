export type PartnerType = 'DSA' | 'LSP' | 'FINTECH' | 'AGGREGATOR' | 'SOURCING_CHANNEL';
export type PartnerStatus = 'ACTIVE' | 'SUSPENDED' | 'TERMINATED' | 'ONBOARDING';

export interface CommissionModel {
  type: 'PERCENTAGE' | 'FLAT' | 'HYBRID';
  ratePct: number; // e.g. 1.5%
  flatFee: number; // e.g. ₹500
  clawbackPeriodDays: number; // e.g. 90 days
  clawbackRatePct: number; // e.g. 100%
}

export interface ComplianceAgreements {
  dlaSigned: boolean;
  rbiDigitalLendingCompliant: boolean;
  kfsFormatAccepted: boolean;
  aprDisclosureAcknowledged: boolean;
  dlaSignedAt?: string;
  dlaReference?: string;
}

export interface PartnerEntity {
  id: string;
  code: string;
  name: string;
  type: PartnerType;
  contactPerson: string;
  email: string;
  phone: string;
  status: PartnerStatus;
  pan: string;
  gstin?: string;
  branchId?: string;
  commissionModel: CommissionModel;
  complianceAgreements: ComplianceAgreements;
  createdAt: string;
  updatedAt: string;
}

export interface SourcedApplication {
  id: string;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  applicationId?: string;
  applicationNo?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  requestedAmount: number;
  productCode: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISBURSED';
  disbursedAmount?: number;
  consentReference: string;
  consentVerifiedAt: string;
  sourcedAt: string;
  notes?: string;
}

export type CommissionType = 'SOURCING_FEE' | 'DISBURSEMENT_COMMISSION' | 'CLAWBACK';
export type CommissionStatus = 'ACCRUED' | 'PAID' | 'CLAWED_BACK';

export interface PartnerCommissionRecord {
  id: string;
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  applicationId?: string;
  applicationNo?: string;
  loanId?: string;
  loanNo?: string;
  disbursedAmount: number;
  commissionType: CommissionType;
  amount: number;
  status: CommissionStatus;
  payoutBatchId?: string;
  clawbackReason?: string;
  createdAt: string;
  paidAt?: string;
}

export interface PartnerPayoutSummary {
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  totalSourcedCount: number;
  totalDisbursedVolume: number;
  totalEarnedCommission: number;
  pendingPayoutAmount: number;
  clawbackAmount: number;
  netPayable: number;
}
