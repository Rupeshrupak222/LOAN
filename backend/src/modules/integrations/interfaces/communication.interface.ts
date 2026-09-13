// Unified Communication Interfaces & Contracts (SMS, WhatsApp, Email, Push)

export type MessageDeliveryStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'REJECTED';

export interface SendSmsRequest {
  to: string; // E.164 phone
  templateId?: string;
  messageText: string;
  dltTemplateId?: string;
}

export interface SendWhatsAppRequest {
  to: string;
  templateName: string;
  languageCode: string;
  variables: Record<string, string>;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  fromName?: string;
  replyTo?: string;
}

export interface SendPushRequest {
  deviceToken: string;
  title: string;
  body: string;
  dataPayload?: Record<string, string>;
}

export interface MessageDeliveryResult {
  messageId: string;
  status: MessageDeliveryStatus;
  channel: 'SMS' | 'WHATSAPP' | 'EMAIL' | 'PUSH';
  providerReference: string;
  timestamp: string;
  error?: string;
}

export interface SmsProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';
  sendSms(req: SendSmsRequest, correlationId: string): Promise<MessageDeliveryResult>;
}

export interface WhatsAppProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';
  sendWhatsApp(req: SendWhatsAppRequest, correlationId: string): Promise<MessageDeliveryResult>;
}

export interface EmailProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';
  sendEmail(req: SendEmailRequest, correlationId: string): Promise<MessageDeliveryResult>;
}

export interface PushProvider {
  readonly providerId: string;
  readonly name: string;
  readonly environment: 'SANDBOX' | 'PRODUCTION';
  sendPush(req: SendPushRequest, correlationId: string): Promise<MessageDeliveryResult>;
}
