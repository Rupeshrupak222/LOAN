// Phase 13: Centralized Communication, Notifications & Customer Support Domain Types

export type CommunicationChannel =
  | 'IN_APP'
  | 'PUSH'
  | 'SMS'
  | 'EMAIL'
  | 'WHATSAPP'
  | 'INTERNAL_NOTIFICATION';

export type CommunicationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type MessageCategory =
  | 'TRANSACTIONAL'
  | 'SECURITY'
  | 'COLLECTION'
  | 'MARKETING'
  | 'REMINDERS'
  | 'SUPPORT'
  | 'REGULATORY';

export type DeliveryStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED'
  | 'BLOCKED_QUIET_HOURS'
  | 'SUPPRESSED_PREFERENCE'
  | 'SUPPRESSED_DUPLICATE';

export type TemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type LanguageCode = 'en-IN' | 'hi-IN' | 'kn-IN' | 'ta-IN' | 'te-IN' | 'mr-IN';

export type CommunicationEventCode =
  // Onboarding & Customer
  | 'WELCOME_MESSAGE'
  | 'PROFILE_CREATED'
  | 'KYC_PENDING'
  | 'KYC_REQUESTED'
  | 'KYC_COMPLETED'
  | 'KYC_FAILED'
  | 'DOCUMENT_REQUIRED'
  // Loan Application & Underwriting
  | 'APPLICATION_CREATED'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_FORWARDED_TO_CREDIT'
  | 'CREDIT_ASSESSMENT_STARTED'
  | 'UNDERWRITING_STARTED'
  | 'APPLICATION_APPROVED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_RETURNED'
  // Offers & Facility
  | 'OFFER_GENERATED'
  | 'OFFER_EXPIRING'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'CREDIT_LIMIT_UPDATED'
  | 'CREDIT_LIMIT_FROZEN'
  // Contracts & Mandate
  | 'AGREEMENT_PENDING'
  | 'AGREEMENT_SIGNING_REQUIRED'
  | 'AGREEMENT_COMPLETED'
  | 'MANDATE_PENDING'
  | 'MANDATE_ACTIVE'
  // Disbursements
  | 'DISBURSEMENT_INITIATED'
  | 'DISBURSEMENT_COMPLETED'
  | 'DISBURSEMENT_SUCCESS'
  | 'DISBURSEMENT_FAILED'
  // Servicing, EMI & Payments
  | 'UPCOMING_DUE_REMINDER'
  | 'EMI_UPCOMING'
  | 'EMI_DUE'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_SUCCESSFUL'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REVERSED'
  | 'REFUND_PROCESSED'
  // Delinquency & Collections
  | 'PAYMENT_OVERDUE'
  | 'LOAN_OVERDUE'
  | 'DPD_BUCKET_CHANGED'
  | 'PTP_CREATED'
  | 'PTP_DUE'
  | 'PTP_BROKEN'
  | 'PTP_KEPT'
  | 'COLLECTION_ESCALATED'
  | 'RECOVERY_NOTICE'
  | 'RECOVERY_RECEIPT_ISSUED'
  // Loan Closure
  | 'LOAN_CLOSED'
  | 'NOC_AVAILABLE'
  | 'NOC_ISSUED'
  // Risk & Fraud Alerts
  | 'FRAUD_REVIEW_REQUIRED'
  | 'SECURITY_ALERT'
  | 'OTP_REQUESTED'
  // Support & Complaints
  | 'TICKET_CREATED'
  | 'TICKET_UPDATED'
  | 'TICKET_ASSIGNED'
  | 'TICKET_REPLIED'
  | 'TICKET_RESOLVED'
  | 'SUPPORT_TICKET_CREATED'
  | 'SUPPORT_TICKET_UPDATED'
  | 'SUPPORT_TICKET_ASSIGNED'
  | 'SUPPORT_TICKET_REPLIED'
  | 'SUPPORT_TICKET_RESOLVED'
  | 'SUPPORT_TICKET_REOPENED'
  | 'SUPPORT_TICKET_ESCALATED'
  | 'COMPLAINT_REGISTERED'
  | 'COMPLAINT_RESOLVED'
  // Internal Operations Tasks
  | 'INTERNAL_TASK_ASSIGNED'
  | 'INTERNAL_TASK_OVERDUE'
  | 'INTERNAL_RECON_EXCEPTION'
  | 'INTERNAL_SLA_BREACH';

// ---------------------------------------------------------------------------
// Template Registry & Versioning
// ---------------------------------------------------------------------------

export interface CommunicationTemplate {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  eventCode: CommunicationEventCode;
  channel: CommunicationChannel;
  language: LanguageCode;
  category: MessageCategory;
  version: number;
  subject?: string;
  body: string;
  variables: string[];
  dltTemplateId?: string;
  dltSenderId?: string;
  ctaUrl?: string;
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export type CommunicationTemplateRecord = CommunicationTemplate;

// ---------------------------------------------------------------------------
// Policy Engine
// ---------------------------------------------------------------------------

export interface CommunicationPolicy {
  id: string;
  tenantId: string;
  eventCode: CommunicationEventCode;
  primaryChannel: CommunicationChannel;
  fallbackChannels: CommunicationChannel[];
  priority: CommunicationPriority;
  category: MessageCategory;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm e.g. '22:00'
  quietHoursEnd?: string;   // HH:mm e.g. '08:00'
  timezone?: string;
  retryLimit: number;
  retryBackoffSec: number;
  dedupWindowMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CommunicationPolicyRecord = CommunicationPolicy;

// ---------------------------------------------------------------------------
// Customer Preferences
// ---------------------------------------------------------------------------

export interface CustomerCommunicationPreference {
  id: string;
  tenantId: string;
  customerId: string;
  preferredLanguage: LanguageCode;
  channels: Partial<Record<CommunicationChannel, boolean>>;
  categories: Partial<Record<MessageCategory, boolean>>;
  optedOutChannels?: CommunicationChannel[];
  quietHoursCustom?: {
    enabled: boolean;
    start: string;
    end: string;
  };
  updatedAt: string;
}

export type CustomerPreferenceRecord = CustomerCommunicationPreference;

// ---------------------------------------------------------------------------
// Outbox Messages & History
// ---------------------------------------------------------------------------

export interface CommunicationMessage {
  id: string;
  tenantId: string;
  customerId: string;
  recipientIdentifier: string;
  recipientName?: string;
  channel: CommunicationChannel;
  eventCode: CommunicationEventCode;
  category: MessageCategory;
  priority: CommunicationPriority;
  status: DeliveryStatus;
  subject?: string;
  body: string;
  templateId?: string;
  templateVersion?: number;
  externalMessageId?: string;
  sentAt?: string;
  deliveredAt?: string;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type CommunicationMessageRecord = CommunicationMessage;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface BorrowerNotification {
  id: string;
  tenantId: string;
  customerId: string;
  title: string;
  body: string;
  eventCode: CommunicationEventCode;
  category: MessageCategory;
  priority: CommunicationPriority;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type BorrowerNotificationRecord = BorrowerNotification;

export interface StaffTaskNotification {
  id: string;
  tenantId: string;
  userId?: string;
  roleTarget?: string;
  title: string;
  body: string;
  eventCode: CommunicationEventCode;
  priority: CommunicationPriority;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  isActioned: boolean;
  actionedAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Support Tickets & SLAs
// ---------------------------------------------------------------------------

export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_CUSTOMER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED';

export type SupportPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketPriority = SupportPriority;

export type SupportCategory =
  | 'LOAN_INQUIRY'
  | 'PAYMENT_DISPUTE'
  | 'KYC_ISSUE'
  | 'DISBURSEMENT_QUERY'
  | 'APP_TECHNICAL_ERROR'
  | 'FORECLOSURE_REQUEST'
  | 'FRAUD_REPORT'
  | 'GRIEVANCE_COMPLAINT'
  | 'GENERAL_INQUIRY';

export type TicketCategory = SupportCategory;

export type TicketMessageType = 'CUSTOMER_MESSAGE' | 'INTERNAL_NOTE';

export interface SupportMessage {
  id: string;
  ticketId: string;
  tenantId: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'SYSTEM';
  senderId: string;
  senderName: string;
  messageType: TicketMessageType;
  body: string;
  attachments?: Array<{ name: string; url: string; sizeBytes: number }>;
  isInternalOnly: boolean;
  createdAt: string;
}

export interface SupportTicketSla {
  firstResponseDueAt: string;
  resolutionDueAt: string;
  firstResponseTargetHours: number;
  resolutionTargetHours: number;
  isResponseBreached: boolean;
  isResolutionBreached: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  subject: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: TicketStatus;
  assignedAgentId?: string;
  assignedAgentName?: string;
  assignedTeam?: string;
  escalationLevel?: number;
  escalationReason?: string;
  escalatedAt?: string;
  applicationId?: string;
  loanId?: string;
  tags?: string[];
  sla: SupportTicketSla;
  firstResponseAt?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  csatScore?: number;
  csatFeedback?: string;
  sourceChannel: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PORTAL' | 'PHONE';
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SupportTicketRecord = SupportTicket;

export interface SupportSlaConfig {
  id: string;
  tenantId: string;
  category: SupportCategory;
  priority: SupportPriority;
  firstResponseTargetHours: number;
  resolutionTargetHours: number;
  autoEscalateOnBreach: boolean;
  businessHoursOnly?: boolean;
}

export interface GrievanceComplaint {
  id: string;
  complaintNumber: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  ticketId?: string;
  loanId?: string;
  applicationId?: string;
  complaintType: string;
  rootCauseCategory: string;
  status: 'REGISTERED' | 'INVESTIGATING' | 'RESOLVED_SATISFIED' | 'RESOLVED_REJECTED' | 'SETTLED_WITH_CONCESSION' | 'ESCALATED_TO_RBI';
  escalationTier: 'NODAL_OFFICER' | 'PRINCIPAL_NODAL_OFFICER' | 'OMBUDSMAN';
  details: string;
  demandedRemedy?: string;
  resolutionDetails?: string;
  resolutionDecision?: 'UPHELD' | 'PARTIALLY_UPHELD' | 'REJECTED' | 'SETTLED';
  compensationAmount?: number;
  targetResolutionDate: string;
  registeredAt: string;
  resolvedAt?: string;
  updatedAt: string;
}

export type ComplaintRecord = GrievanceComplaint;

// ---------------------------------------------------------------------------
// Domain Event Payloads & Metrics
// ---------------------------------------------------------------------------

export interface CommunicationEventPayload {
  tenantId?: string;
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  eventCode: CommunicationEventCode;
  sourceEntityType?: string;
  sourceEntityId: string;
  preferredLanguage?: LanguageCode;
  data: Record<string, any>;
  metadata?: Record<string, any>;
  actionUrl?: string;
  staffTargetUserId?: string;
}

export interface CommunicationDashboardMetrics {
  totalMessagesSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalSuppressed: number;
  overallDeliveryRate: number;
  activeTemplatesCount: number;
  channelStats: Record<CommunicationChannel, { sent: number; delivered: number; failed: number }>;
}

export interface SupportDashboardMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  escalatedTickets: number;
  breachedTickets: number;
  avgFirstResponseTimeHours: number;
  avgResolutionTimeHours: number;
  csatScore: number;
  openComplaints: number;
  ticketsByCategory: Record<SupportCategory, number>;
  ticketsByPriority: Record<SupportPriority, number>;
}
