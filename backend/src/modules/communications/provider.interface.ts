import { CommunicationChannel, DeliveryStatus } from './communication.types';

export interface ProviderRecipient {
  identifier: string; // Customer ID, User ID, phone number, email address, or device token
  name?: string;
  email?: string;
  phone?: string;
  deviceToken?: string;
  userId?: string;
  customerId?: string;
}

export interface ProviderContent {
  subject?: string;
  body: string;
  data?: Record<string, any>;
  actionUrl?: string;
  attachments?: Array<{
    name: string;
    url?: string;
    mimeType?: string;
    sizeBytes?: number;
  }>;
}

export interface ProviderSendPayload {
  tenantId: string;
  recipient: ProviderRecipient;
  content: ProviderContent;
  metadata?: Record<string, any>;
  correlationId?: string;
  priority?: string;
}

export interface ProviderSendResult {
  success: boolean;
  externalMessageId: string;
  status: DeliveryStatus;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  errorCode?: string;
  errorMessage?: string;
  rawResponse?: Record<string, any>;
}

export interface ICommunicationProvider {
  readonly channel: CommunicationChannel;
  readonly providerName: string;
  readonly isSandbox: boolean;

  send(payload: ProviderSendPayload): Promise<ProviderSendResult>;
  checkStatus?(externalMessageId: string): Promise<ProviderSendResult>;
}
