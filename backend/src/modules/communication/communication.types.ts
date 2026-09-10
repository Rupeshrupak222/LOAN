export type CommunicationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';

export type CommunicationCategory = 'TRANSACTIONAL' | 'COLLECTION' | 'REGULATORY' | 'MARKETING';

export type TemplateCode =
  // Onboarding
  | 'WELCOME_MESSAGE'
  | 'PROFILE_CREATED'
  | 'KYC_PENDING'
  | 'KYC_REQUESTED'
  | 'KYC_COMPLETED'
  | 'DOCUMENT_REQUIRED'
  // Loan Application
  | 'APPLICATION_RECEIVED'
  | 'APPLICATION_SUBMITTED'
  | 'CREDIT_ASSESSMENT_STARTED'
  | 'APPLICATION_FORWARDED_TO_CREDIT'
  | 'UNDERWRITING_STARTED'
  | 'APPROVAL_SANCTION_LETTER'
  | 'LOAN_APPROVED'
  | 'REJECTION_EXPLANATION'
  | 'LOAN_REJECTED'
  // Disbursement
  | 'DISBURSEMENT_INITIATED'
  | 'DISBURSEMENT_NOTICE'
  | 'DISBURSEMENT_SUCCESSFUL'
  | 'DISBURSEMENT_FAILED'
  // Payments
  | 'UPCOMING_EMI_REMINDER'
  | 'EMI_DUE_TODAY'
  | 'PAYMENT_RECEIPT'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  // Collections
  | 'OVERDUE_NOTICE'
  | 'COLLECTION_PAYMENT_REMINDER'
  | 'PTP_REMINDER'
  | 'PTP_BROKEN'
  | 'RECOVERY_NOTICE'
  // Loan Closure
  | 'LOAN_CLOSED'
  | 'SETTLEMENT_NOC_LETTER'
  | 'NOC_GENERATED';

export type DeliveryStatus =
  | 'QUEUED'
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'BLOCKED_DND'
  | 'BLOCKED_WINDOW'
  | 'MOCKED';

export interface CommunicationTemplate {
  code: TemplateCode;
  name: string;
  category: CommunicationCategory;
  supportedChannels: CommunicationChannel[];
  subjectTemplate: string;
  bodyTemplate: string;
  description: string;
  requiredVariables: string[];
}

export interface CommunicationRecord {
  id: string;
  tenantId?: string;
  branchId?: string;
  recipient: string; // email, mobile, or userId
  recipientName?: string;
  customerId?: string;
  loanId?: string;
  applicationId?: string;
  channel: CommunicationChannel;
  category: CommunicationCategory;
  templateCode: TemplateCode;
  subject: string;
  renderedBody: string;
  deliveryStatus: DeliveryStatus;
  provider: string;
  providerMessageId?: string;
  errorMessage?: string;
  retryCount?: number;
  lastRetryAt?: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  dispatchedBy: string;
}

export interface SendCommunicationRequest {
  templateCode: TemplateCode;
  channel: CommunicationChannel;
  recipient: string;
  recipientName?: string;
  customerId?: string;
  loanId?: string;
  applicationId?: string;
  variables: Record<string, any>;
  metadata?: Record<string, any>;
  isDndOpted?: boolean;
  bypassWindowCheck?: boolean; // For automated tests / testing
  idempotencyKey?: string;
}

export interface ProviderHealthStatus {
  channel: CommunicationChannel;
  providerName: string;
  isConfigured: boolean;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'DEGRADED';
  lastHealthCheck: string;
  failureRatePercent: number;
  totalProcessed: number;
  lastError?: string;
}

export interface CustomerCommunicationPreference {
  customerId: string;
  tenantId: string;
  whatsappOptIn: boolean;
  smsOptIn: boolean;
  emailOptIn: boolean;
  inAppOptIn: boolean;
  allowMarketing: boolean;
  allowTransactional: boolean;
  isDndOpted: boolean;
  preferredChannel: CommunicationChannel;
  updatedAt: string;
  updatedBy?: string;
}

export interface DeliveryWebhookPayload {
  provider: string;
  providerMessageId: string;
  event: 'delivered' | 'failed' | 'read' | 'bounced' | 'sent';
  timestamp?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export interface CommunicationDashboardMetrics {
  totalMessages: number;
  totalSent: number;
  totalDelivered: number;
  totalPending: number;
  totalFailed: number;
  totalRead: number;
  deliveryRatePercent: number;
  activeChannelsCount: number;
  byChannel: Record<CommunicationChannel, number>;
  byCategory: Record<CommunicationCategory, number>;
  byStatus: Record<DeliveryStatus, number>;
  collectionWindowActive: boolean;
  recentActivity: CommunicationRecord[];
}
