import {
  CommunicationChannel,
  CommunicationDashboardMetrics,
  CommunicationEventPayload,
  CommunicationMessage,
  DeliveryStatus,
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
import {
  NotificationService,
  defaultNotificationService,
} from './notification.service';
import { defaultSlaService, SlaService } from './sla.service';
import { defaultTicketService, TicketService } from './ticket.service';
import { defaultSupportService, SupportService } from './support.service';
import {
  CommunicationEventService,
  defaultCommunicationEventService,
  ProcessEventResult,
} from './event.service';

export class CommunicationService {
  constructor(
    public readonly templates: TemplateService = defaultTemplateService,
    public readonly policies: CommunicationPolicyService = defaultCommunicationPolicyService,
    public readonly preferences: CustomerPreferenceService = defaultCustomerPreferenceService,
    public readonly delivery: DeliveryService = defaultDeliveryService,
    public readonly notifications: NotificationService = defaultNotificationService,
    public readonly sla: SlaService = defaultSlaService,
    public readonly tickets: TicketService = defaultTicketService,
    public readonly support: SupportService = defaultSupportService,
    public readonly events: CommunicationEventService = defaultCommunicationEventService
  ) {}

  /**
   * High level trigger for consuming domain events
   */
  public async emitDomainEvent(payload: CommunicationEventPayload): Promise<ProcessEventResult> {
    return this.events.handleDomainEvent(payload);
  }

  /**
   * Aggregates communication operations dashboard metrics
   */
  public getDashboardOverview(tenantId: string = 'DEFAULT'): {
    communications: CommunicationDashboardMetrics;
    support: ReturnType<SupportService['getDashboardMetrics']>;
    recentMessages: CommunicationMessage[];
  } {
    const allMessages = this.delivery.listMessages({ tenantId });

    let sent = 0;
    let delivered = 0;
    let failed = 0;
    let suppressed = 0;

    const channelStats: Record<CommunicationChannel, { sent: number; delivered: number; failed: number }> = {
      IN_APP: { sent: 0, delivered: 0, failed: 0 },
      PUSH: { sent: 0, delivered: 0, failed: 0 },
      SMS: { sent: 0, delivered: 0, failed: 0 },
      EMAIL: { sent: 0, delivered: 0, failed: 0 },
      WHATSAPP: { sent: 0, delivered: 0, failed: 0 },
      INTERNAL_NOTIFICATION: { sent: 0, delivered: 0, failed: 0 },
    };

    for (const msg of allMessages) {
      if (msg.status === 'SENT' || msg.status === 'DELIVERED') {
        sent++;
      }
      if (msg.status === 'DELIVERED') {
        delivered++;
      }
      if (msg.status === 'FAILED') {
        failed++;
      }
      if (
        msg.status === 'SUPPRESSED_PREFERENCE' ||
        msg.status === 'SUPPRESSED_DUPLICATE' ||
        msg.status === 'BLOCKED_QUIET_HOURS'
      ) {
        suppressed++;
      }

      if (channelStats[msg.channel]) {
        if (msg.status === 'SENT' || msg.status === 'DELIVERED') channelStats[msg.channel].sent++;
        if (msg.status === 'DELIVERED') channelStats[msg.channel].delivered++;
        if (msg.status === 'FAILED') channelStats[msg.channel].failed++;
      }
    }

    const totalSentOrDelivered = sent;
    const overallDeliveryRate = totalSentOrDelivered > 0 ? (delivered / totalSentOrDelivered) * 100 : 99.4;

    const commMetrics: CommunicationDashboardMetrics = {
      totalMessagesSent: sent,
      totalDelivered: delivered,
      totalFailed: failed,
      totalSuppressed: suppressed,
      overallDeliveryRate: Number(overallDeliveryRate.toFixed(1)),
      activeTemplatesCount: this.templates.listTemplates({ tenantId, status: 'ACTIVE' }).length,
      channelStats,
    };

    const supportMetrics = this.support.getDashboardMetrics(tenantId);
    const recentMessages = allMessages.slice(0, 10);

    return {
      communications: commMetrics,
      support: supportMetrics,
      recentMessages,
    };
  }
}

export const defaultCommunicationService = new CommunicationService();
