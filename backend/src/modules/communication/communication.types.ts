export type CommunicationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';

export type CommunicationCategory = 'TRANSACTIONAL' | 'COLLECTION' | 'REGULATORY';

export type TemplateCode =
  | 'APPLICATION_SUBMITTED'
  | 'KYC_REQUESTED'
  | 'APPROVAL_SANCTION_LETTER'
  | 'REJECTION_EXPLANATION'
  | 'DISBURSEMENT_NOTICE'
  | 'UPCOMING_EMI_REMINDER'
  | 'OVERDUE_NOTICE'
  | 'PAYMENT_RECEIPT'
  | 'SETTLEMENT_NOC_LETTER';

export type DeliveryStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
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
  metadata?: Record<string, any>;
  sentAt: string;
  deliveredAt?: string;
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
  bypassWindowCheck?: boolean; // For testing
}

export interface CommunicationStats {
  totalDispatched: number;
  deliveryRatePercent: number;
  activeChannels: number;
  byChannel: Record<CommunicationChannel, number>;
  byCategory: Record<CommunicationCategory, number>;
  byStatus: Record<DeliveryStatus, number>;
  collectionWindowActive: boolean;
}
