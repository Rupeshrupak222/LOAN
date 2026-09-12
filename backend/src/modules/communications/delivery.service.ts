import {
  CommunicationChannel,
  CommunicationEventCode,
  CommunicationMessage,
  CommunicationPriority,
  DeliveryStatus,
  MessageCategory,
} from './communication.types';
import {
  CommunicationProviderRegistry,
  defaultProviderRegistry,
} from './sandbox-providers';
import {
  CommunicationPolicyService,
  defaultCommunicationPolicyService,
} from './communication-policy.service';
import {
  CustomerPreferenceService,
  defaultCustomerPreferenceService,
} from './preference.service';
import {
  NotificationService,
  defaultNotificationService,
} from './notification.service';

export class DeliveryService {
  private messages: Map<string, CommunicationMessage> = new Map();

  constructor(
    private providerRegistry: CommunicationProviderRegistry = defaultProviderRegistry,
    private policyService: CommunicationPolicyService = defaultCommunicationPolicyService,
    private preferenceService: CustomerPreferenceService = defaultCustomerPreferenceService,
    private notificationService: NotificationService = defaultNotificationService
  ) {}

  /**
   * Masks sensitive PII in strings (e.g. PAN: ABCDE1234F -> XXXXX1234F, Aadhaar: 123456789012 -> XXXXXXXX9012)
   */
  public sanitizePii(text: string): string {
    // Mask PAN
    let sanitized = text.replace(/\b([A-Z]{5})([0-9]{4})([A-Z]{1})\b/g, 'XXXXX$2$3');
    // Mask 12 digit Aadhaar
    sanitized = sanitized.replace(/\b(\d{4})\s?(\d{4})\s?(\d{4})\b/g, 'XXXX-XXXX-$3');
    // Mask Bank Account (keep last 4)
    sanitized = sanitized.replace(/\b(\d{6,14})(\d{4})\b/g, 'XXXXXX$2');
    return sanitized;
  }

  /**
   * Dispatches a single message through policy checks, preferences, and provider gateway
   */
  public async dispatchMessage(params: {
    tenantId: string;
    customerId: string;
    recipientIdentifier: string;
    recipientName?: string;
    channel: CommunicationChannel;
    eventCode: CommunicationEventCode;
    category?: MessageCategory;
    priority?: CommunicationPriority;
    subject?: string;
    body: string;
    templateId?: string;
    templateVersion?: number;
    metadata?: Record<string, any>;
    sourceEntityId?: string;
    actionUrl?: string;
  }): Promise<CommunicationMessage> {
    const messageId = `MSG_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const category = params.category || 'TRANSACTIONAL';
    const priority = params.priority || 'NORMAL';
    const policy = this.policyService.getPolicyForEvent(params.tenantId, params.eventCode);

    // 1. Check Idempotency Key
    const idempotencyKey = this.policyService.generateIdempotencyKey({
      tenantId: params.tenantId,
      eventCode: params.eventCode,
      sourceEntityId: params.sourceEntityId || params.customerId,
      channel: params.channel,
      version: params.templateVersion,
    });

    const dedupCheck = this.policyService.checkIdempotency(
      idempotencyKey,
      policy.dedupWindowMinutes || 30
    );

    if (dedupCheck.isDuplicate) {
      const msg: CommunicationMessage = {
        id: messageId,
        tenantId: params.tenantId,
        customerId: params.customerId,
        recipientIdentifier: params.recipientIdentifier,
        recipientName: params.recipientName,
        channel: params.channel,
        eventCode: params.eventCode,
        category,
        priority,
        status: 'SUPPRESSED_DUPLICATE',
        subject: params.subject,
        body: this.sanitizePii(params.body),
        templateId: params.templateId,
        templateVersion: params.templateVersion,
        idempotencyKey,
        retryCount: 0,
        maxRetries: policy.retryLimit || 3,
        metadata: { ...params.metadata, suppressedReason: 'DUPLICATE_WITHIN_WINDOW', originalMsgId: dedupCheck.existingMessageId },
        createdAt: now,
        updatedAt: now,
      };
      this.messages.set(msg.id, msg);
      return msg;
    }

    // 2. Check Customer Preferences (with non-bypassable guard)
    const prefCheck = this.preferenceService.canSend({
      tenantId: params.tenantId,
      customerId: params.customerId,
      channel: params.channel,
      category,
    });

    if (!prefCheck.allowed) {
      const msg: CommunicationMessage = {
        id: messageId,
        tenantId: params.tenantId,
        customerId: params.customerId,
        recipientIdentifier: params.recipientIdentifier,
        recipientName: params.recipientName,
        channel: params.channel,
        eventCode: params.eventCode,
        category,
        priority,
        status: 'SUPPRESSED_PREFERENCE',
        subject: params.subject,
        body: this.sanitizePii(params.body),
        templateId: params.templateId,
        templateVersion: params.templateVersion,
        idempotencyKey,
        retryCount: 0,
        maxRetries: policy.retryLimit || 3,
        metadata: { ...params.metadata, suppressedReason: prefCheck.reason },
        createdAt: now,
        updatedAt: now,
      };
      this.messages.set(msg.id, msg);
      return msg;
    }

    // 3. Check Quiet Hours
    const isQuiet = this.policyService.isQuietHours(policy, new Date());
    const bypassQuiet = this.policyService.canBypassQuietHours(params.eventCode, category, priority);

    if (isQuiet && !bypassQuiet) {
      const msg: CommunicationMessage = {
        id: messageId,
        tenantId: params.tenantId,
        customerId: params.customerId,
        recipientIdentifier: params.recipientIdentifier,
        recipientName: params.recipientName,
        channel: params.channel,
        eventCode: params.eventCode,
        category,
        priority,
        status: 'BLOCKED_QUIET_HOURS',
        subject: params.subject,
        body: this.sanitizePii(params.body),
        templateId: params.templateId,
        templateVersion: params.templateVersion,
        idempotencyKey,
        retryCount: 0,
        maxRetries: policy.retryLimit || 3,
        metadata: { ...params.metadata, holdReason: 'QUIET_HOURS_ACTIVE' },
        createdAt: now,
        updatedAt: now,
      };
      this.messages.set(msg.id, msg);
      return msg;
    }

    // 4. In-App and Internal Notifications routing directly
    if (params.channel === 'IN_APP') {
      this.notificationService.createBorrowerNotification({
        tenantId: params.tenantId,
        customerId: params.customerId,
        title: params.subject || 'Adyapan Notification',
        body: this.sanitizePii(params.body),
        eventCode: params.eventCode,
        category,
        priority,
        actionUrl: params.actionUrl,
        metadata: params.metadata,
      });
    }

    if (params.channel === 'INTERNAL_NOTIFICATION') {
      this.notificationService.createStaffNotification({
        tenantId: params.tenantId,
        title: params.subject || 'Operational Alert',
        body: params.body,
        eventCode: params.eventCode,
        priority,
        actionUrl: params.actionUrl,
        metadata: params.metadata,
      });
    }

    // 5. Send via Provider
    const provider = this.providerRegistry.getPrimaryProvider(params.channel);
    let deliveryStatus: DeliveryStatus = 'SENT';
    let externalMsgId: string = `EXT_${Date.now()}`;
    let sentAtStr: string | undefined = now;
    let deliveredAtStr: string | undefined = now;
    let errorMsg: string | undefined;

    if (provider) {
      const result = await provider.send({
        tenantId: params.tenantId,
        recipient: {
          identifier: params.recipientIdentifier,
          name: params.recipientName,
          customerId: params.customerId,
          phone: params.channel === 'SMS' || params.channel === 'WHATSAPP' ? params.recipientIdentifier : undefined,
          email: params.channel === 'EMAIL' ? params.recipientIdentifier : undefined,
        },
        content: {
          subject: params.subject,
          body: params.body,
          actionUrl: params.actionUrl,
        },
        metadata: params.metadata,
        priority,
      });

      deliveryStatus = result.status;
      externalMsgId = result.externalMessageId;
      sentAtStr = result.sentAt;
      deliveredAtStr = result.deliveredAt;
      errorMsg = result.errorMessage;
    }

    // 6. Record in Message Store
    const message: CommunicationMessage = {
      id: messageId,
      tenantId: params.tenantId,
      customerId: params.customerId,
      recipientIdentifier: params.recipientIdentifier,
      recipientName: params.recipientName,
      channel: params.channel,
      eventCode: params.eventCode,
      category,
      priority,
      status: deliveryStatus,
      subject: params.subject,
      body: this.sanitizePii(params.body),
      templateId: params.templateId,
      templateVersion: params.templateVersion,
      externalMessageId: externalMsgId,
      sentAt: sentAtStr,
      deliveredAt: deliveredAtStr,
      retryCount: 0,
      maxRetries: policy.retryLimit || 3,
      errorMessage: errorMsg,
      idempotencyKey,
      metadata: params.metadata,
      createdAt: now,
      updatedAt: now,
    };

    // Record idempotency on successful dispatch
    this.policyService.recordIdempotency(idempotencyKey, message.id);
    this.messages.set(message.id, message);

    return message;
  }

  /**
   * Retry a failed message with backoff
   */
  public async retryMessage(messageId: string): Promise<CommunicationMessage> {
    const message = this.messages.get(messageId);
    if (!message) {
      throw new Error(`Message '${messageId}' not found`);
    }

    if (message.retryCount >= message.maxRetries) {
      message.status = 'FAILED';
      message.errorMessage = `Max retry limit (${message.maxRetries}) exceeded`;
      message.updatedAt = new Date().toISOString();
      this.messages.set(message.id, message);
      return message;
    }

    message.retryCount++;
    message.status = 'PROCESSING';
    message.updatedAt = new Date().toISOString();

    const provider = this.providerRegistry.getPrimaryProvider(message.channel);
    if (provider) {
      const result = await provider.send({
        tenantId: message.tenantId,
        recipient: {
          identifier: message.recipientIdentifier,
          name: message.recipientName,
          customerId: message.customerId,
        },
        content: {
          subject: message.subject,
          body: message.body,
        },
        metadata: message.metadata,
        priority: message.priority,
      });

      message.status = result.status;
      message.externalMessageId = result.externalMessageId;
      message.sentAt = result.sentAt;
      message.deliveredAt = result.deliveredAt;
      message.errorMessage = result.errorMessage;
    } else {
      message.status = 'SENT';
      message.sentAt = new Date().toISOString();
    }

    message.updatedAt = new Date().toISOString();
    this.messages.set(message.id, message);
    return message;
  }

  public getMessageById(id: string): CommunicationMessage | undefined {
    return this.messages.get(id);
  }

  public listMessages(params?: {
    tenantId?: string;
    customerId?: string;
    channel?: CommunicationChannel;
    status?: DeliveryStatus;
    eventCode?: CommunicationEventCode;
  }): CommunicationMessage[] {
    let list = Array.from(this.messages.values());

    if (params?.tenantId && params.tenantId !== 'ALL') {
      list = list.filter((m) => m.tenantId === params.tenantId || m.tenantId === 'DEFAULT');
    }
    if (params?.customerId) {
      list = list.filter((m) => m.customerId === params.customerId);
    }
    if (params?.channel) {
      list = list.filter((m) => m.channel === params.channel);
    }
    if (params?.status) {
      list = list.filter((m) => m.status === params.status);
    }
    if (params?.eventCode) {
      list = list.filter((m) => m.eventCode === params.eventCode);
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export const defaultDeliveryService = new DeliveryService();
