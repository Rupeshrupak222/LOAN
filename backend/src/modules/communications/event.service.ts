import {
  CommunicationChannel,
  CommunicationEventCode,
  CommunicationEventPayload,
  CommunicationMessage,
  LanguageCode,
} from './communication.types';
import { defaultTemplateService, TemplateService } from './template.service';
import {
  CommunicationPolicyService,
  defaultCommunicationPolicyService,
} from './communication-policy.service';
import {
  CustomerPreferenceService,
  defaultCustomerPreferenceService,
} from './preference.service';
import { defaultDeliveryService, DeliveryService } from './delivery.service';

export interface ProcessEventResult {
  success: boolean;
  eventCode: CommunicationEventCode;
  primaryChannel: CommunicationChannel;
  messages: CommunicationMessage[];
  errors?: string[];
}

export class CommunicationEventService {
  constructor(
    private templateService: TemplateService = defaultTemplateService,
    private policyService: CommunicationPolicyService = defaultCommunicationPolicyService,
    private preferenceService: CustomerPreferenceService = defaultCustomerPreferenceService,
    private deliveryService: DeliveryService = defaultDeliveryService
  ) {}

  /**
   * Central processor for incoming business domain events
   */
  public async handleDomainEvent(
    event: CommunicationEventPayload
  ): Promise<ProcessEventResult> {
    const tenantId = event.tenantId || 'DEFAULT';
    const policy = this.policyService.getPolicyForEvent(tenantId, event.eventCode);
    const pref = this.preferenceService.getOrCreatePreference(tenantId, event.customerId);

    const language: LanguageCode = (event.preferredLanguage || pref.preferredLanguage || 'en-IN') as LanguageCode;

    const channelsToTry: CommunicationChannel[] = [
      policy.primaryChannel,
      ...(policy.fallbackChannels || []),
    ];

    const messages: CommunicationMessage[] = [];
    const errors: string[] = [];

    // Helper to extract recipient identifier based on channel
    const getRecipientId = (channel: CommunicationChannel): string => {
      if (channel === 'EMAIL') return event.customerEmail || 'no-email@adyapan.finance';
      if (channel === 'SMS' || channel === 'WHATSAPP') return event.customerPhone || '+919876543210';
      if (channel === 'IN_APP') return event.customerId;
      if (channel === 'INTERNAL_NOTIFICATION') return event.staffTargetUserId || 'ALL_STAFF';
      return event.customerId;
    };

    let deliveredSuccessfully = false;

    for (const channel of channelsToTry) {
      // Find template for this channel
      const template = this.templateService.findActiveTemplate({
        tenantId,
        eventCode: event.eventCode,
        channel,
        language,
      });

      if (!template) {
        // If no template for this channel, continue to next fallback
        continue;
      }

      // Render template
      const renderResult = this.templateService.renderTemplate(template, event.data || {});

      // Dispatch via delivery engine
      const message = await this.deliveryService.dispatchMessage({
        tenantId,
        customerId: event.customerId,
        recipientIdentifier: getRecipientId(channel),
        recipientName: event.customerName,
        channel,
        eventCode: event.eventCode,
        category: template.category || policy.category,
        priority: policy.priority,
        subject: renderResult.subject,
        body: renderResult.body,
        templateId: template.id,
        templateVersion: template.version,
        metadata: {
          ...event.metadata,
          sourceEntityId: event.sourceEntityId,
          sourceEntityType: event.sourceEntityType,
          missingPlaceholders: renderResult.missingPlaceholders,
        },
        sourceEntityId: event.sourceEntityId,
        actionUrl: template.ctaUrl || event.actionUrl,
      });

      messages.push(message);

      if (message.status === 'DELIVERED' || message.status === 'SENT') {
        deliveredSuccessfully = true;
        // Primary or first functioning channel succeeded; we stop unless internal notifications need to be delivered in parallel
        break;
      } else if (
        message.status === 'SUPPRESSED_PREFERENCE' ||
        message.status === 'SUPPRESSED_DUPLICATE' ||
        message.status === 'BLOCKED_QUIET_HOURS'
      ) {
        // If suppressed by policy, try fallback only if not duplicate
        if (message.status === 'SUPPRESSED_DUPLICATE') {
          break;
        }
      }
    }

    // Always dispatch internal staff alert if the event is an internal operational trigger
    if (
      event.eventCode === 'UNDERWRITING_STARTED' ||
      event.eventCode === 'CREDIT_ASSESSMENT_STARTED' ||
      event.eventCode === 'APPLICATION_FORWARDED_TO_CREDIT'
    ) {
      const internalTemplate = this.templateService.findActiveTemplate({
        tenantId,
        eventCode: event.eventCode,
        channel: 'INTERNAL_NOTIFICATION',
        language: 'en-IN',
      });

      if (internalTemplate) {
        const renderResult = this.templateService.renderTemplate(internalTemplate, event.data || {});
        const staffMsg = await this.deliveryService.dispatchMessage({
          tenantId,
          customerId: event.customerId,
          recipientIdentifier: event.staffTargetUserId || 'CREDIT_OPS',
          recipientName: 'Credit Operations Team',
          channel: 'INTERNAL_NOTIFICATION',
          eventCode: event.eventCode,
          category: 'TRANSACTIONAL',
          priority: 'HIGH',
          subject: renderResult.subject,
          body: renderResult.body,
          templateId: internalTemplate.id,
          templateVersion: internalTemplate.version,
          metadata: event.metadata,
          sourceEntityId: event.sourceEntityId,
        });
        messages.push(staffMsg);
      }
    }

    return {
      success: deliveredSuccessfully || messages.length > 0,
      eventCode: event.eventCode,
      primaryChannel: policy.primaryChannel,
      messages,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

export const defaultCommunicationEventService = new CommunicationEventService();
