/**
 * Adyapan Lending OS — Phase 8: Partner, LSP & Embedded Lending Platform Types
 */

export type PartnerType =
  | 'LSP'
  | 'FINTECH'
  | 'BANK'
  | 'NBFC'
  | 'MERCHANT_PLATFORM'
  | 'EMBEDDED_FINANCE'
  | 'API_PARTNER'
  | 'DISTRIBUTION_PARTNER'
  | 'DSA'
  | 'AGGREGATOR'
  | 'SOURCING_CHANNEL';

export type PartnerStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DEACTIVATED'
  | 'ARCHIVED'
  | 'TERMINATED'
  | 'ONBOARDING';

export type PartnerEnvironment = 'SANDBOX' | 'PRODUCTION';

export type PartnerScope =
  | 'partner.customer.read'
  | 'partner.customer.create'
  | 'partner.application.create'
  | 'partner.application.read'
  | 'partner.application.update'
  | 'partner.application.submit'
  | 'partner.offer.read'
  | 'partner.offer.accept'
  | 'partner.loan.read'
  | 'partner.repayment.read'
  | 'partner.credit_limit.read'
  | 'partner.drawdown.create'
  | 'partner.webhook.manage'
  | 'partner.reporting.read';

export const ALL_PARTNER_SCOPES: PartnerScope[] = [
  'partner.customer.read',
  'partner.customer.create',
  'partner.application.create',
  'partner.application.read',
  'partner.application.update',
  'partner.application.submit',
  'partner.offer.read',
  'partner.offer.accept',
  'partner.loan.read',
  'partner.repayment.read',
  'partner.credit_limit.read',
  'partner.drawdown.create',
  'partner.webhook.manage',
  'partner.reporting.read',
];

export interface PartnerRateLimits {
  requestsPerMinute: number; // default 120
  requestsPerHour: number;   // default 5000
  burstLimit: number;        // default 30
}

export interface PartnerApiCredential {
  id: string;
  partnerId: string;
  tenantId: string;
  name: string;
  clientId: string;
  apiKey: string;
  keyPrefix: string;
  secretHash: string;
  plainSecretOnce?: string; // only returned upon generation
  environment: PartnerEnvironment;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  scopes: PartnerScope[];
  rateLimits: PartnerRateLimits;
  allowedIps?: string[];
  expiresAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerProductAssignment {
  productId: string;
  productCode: string;
  productName: string;
  customMinAmount?: number;
  customMaxAmount?: number;
  customMinTenure?: number;
  customMaxTenure?: number;
  isActive: boolean;
}

export interface PartnerConsentRecord {
  id: string;
  customerId: string;
  partnerId: string;
  tenantId: string;
  purpose: 'LOAN_APPLICATION' | 'CREDIT_EVALUATION' | 'ACCOUNT_SERVICING' | 'MARKETING_OFFERS';
  dataCategories: ('IDENTITY' | 'FINANCIAL' | 'CONTACT' | 'CREDIT_BUREAU' | 'EMPLOYMENT')[];
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  sourceChannel: string;
  consentReference: string;
  consentArtifactHash: string;
  ipAddress?: string;
  userAgent?: string;
  validFrom: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
}

export interface PartnerApplicationMapping {
  id: string;
  partnerApplicationId: string;
  adyapanApplicationId: string;
  partnerId: string;
  tenantId: string;
  customerId: string;
  productId: string;
  channel: string;
  environment: PartnerEnvironment;
  status: string;
  customerSafeStatus: string;
  currentStage: string;
  completedStages: string[];
  pendingStage?: string;
  nextAction?: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  createdAt: string;
  updatedAt: string;
}

export type WebhookEventType =
  | 'application.created'
  | 'application.submitted'
  | 'application.status_changed'
  | 'kyc.completed'
  | 'decision.completed'
  | 'offer.generated'
  | 'offer.accepted'
  | 'offer.declined'
  | 'agreement.completed'
  | 'mandate.completed'
  | 'disbursement.completed'
  | 'repayment.completed'
  | 'loan.closed'
  | 'credit_limit.updated'
  | 'drawdown.completed'
  | 'test.ping';

export interface PartnerWebhookSubscription {
  id: string;
  partnerId: string;
  tenantId: string;
  url: string;
  secret: string; // HMAC signing secret
  subscribedEvents: WebhookEventType[];
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
  environment: PartnerEnvironment;
  maxRetries: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerWebhookDelivery {
  id: string;
  subscriptionId: string;
  partnerId: string;
  tenantId: string;
  eventId: string;
  eventType: WebhookEventType;
  environment: PartnerEnvironment;
  payload: Record<string, any>;
  signature: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
  attempts: number;
  maxAttempts: number;
  lastAttemptAt?: string;
  responseStatusCode?: number;
  responseBody?: string;
  error?: string;
  createdAt: string;
}

export interface PartnerCommercialPolicy {
  id: string;
  partnerId: string;
  tenantId: string;
  version: number;
  modelType: 'PERCENTAGE' | 'FLAT' | 'HYBRID' | 'REVENUE_SHARE' | 'SLAB_BASED';
  sourcingFeePct: number;
  disbursementCommissionPct: number;
  flatFee: number;
  platformFee: number;
  clawbackPeriodDays: number;
  clawbackRatePct: number;
  effectiveFrom: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceAgreements {
  dlaSigned: boolean;
  rbiDigitalLendingCompliant: boolean;
  kfsFormatAccepted: boolean;
  aprDisclosureAcknowledged: boolean;
  dlaSignedAt?: string;
  dlaReference?: string;
}

export interface PartnerBranding {
  logoUrl?: string;
  primaryColor?: string;
  portalDomain?: string;
  cobrandedHeader?: string;
}

export interface CommissionModel {
  type: 'PERCENTAGE' | 'FLAT' | 'HYBRID';
  ratePct: number;
  flatFee: number;
  clawbackPeriodDays: number;
  clawbackRatePct: number;
}

export interface PartnerEntity {
  id: string;
  code: string;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  tenantId: string;
  contactPerson: string;
  email: string;
  phone: string;
  pan: string;
  gstin?: string;
  branchId?: string;
  allowedProducts: PartnerProductAssignment[];
  allowedBranches?: string[];
  allowedChannels?: string[];
  maxDailyApplications?: number;
  maxApplicationAmount?: number;
  customerSegments?: string[];
  branding?: PartnerBranding;
  webhookCallbackUrl?: string;
  rateLimits: PartnerRateLimits;
  allowedIps?: string[];
  environment: PartnerEnvironment;
  complianceAgreements: ComplianceAgreements;
  commercialPolicy?: PartnerCommercialPolicy;
  commissionModel?: CommissionModel;
  credentialsCount?: number;
  webhooksCount?: number;
  activeApplicationsCount?: number;
  totalDisbursedVolume?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PartnerContext {
  partnerId: string;
  partnerCode: string;
  partnerName: string;
  tenantId: string;
  environment: PartnerEnvironment;
  credentialId?: string;
  scopes: PartnerScope[];
  allowedProducts?: string[];
}

export interface PartnerCustomerCreateDto {
  partnerCustomerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  pan?: string;
  aadhaarLast4?: string;
  dateOfBirth?: string;
  monthlyIncome?: number;
  employmentType?: string;
  consent: {
    purpose: 'LOAN_APPLICATION' | 'CREDIT_EVALUATION';
    dataCategories: ('IDENTITY' | 'FINANCIAL' | 'CONTACT' | 'CREDIT_BUREAU' | 'EMPLOYMENT')[];
    consentReference: string;
    ipAddress?: string;
  };
}

export interface PartnerApplicationCreateDto {
  partnerApplicationId: string;
  partnerCustomerId?: string;
  customerId?: string;
  productId: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  purpose?: string;
  channel?: string;
  employmentType?: 'SALARIED' | 'SELF_EMPLOYED';
  monthlyIncome?: number;
  metadata?: Record<string, any>;
  bankAccount?: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
}

export interface PartnerApplicationUpdateDto {
  requestedAmount?: number;
  requestedTenureMonths?: number;
  purpose?: string;
  monthlyIncome?: number;
  draftData?: Record<string, any>;
}

export interface PartnerDrawdownRequestDto {
  partnerDrawdownId?: string;
  amount: number;
  tenureMonths?: number;
  purpose?: string;
  bankAccountId?: string;
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
