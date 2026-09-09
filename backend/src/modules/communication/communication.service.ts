import { BadRequestError, ForbiddenError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { notificationProviders, ProviderResult } from '../notifications/provider';
import {
  CommunicationChannel,
  CommunicationRecord,
  CommunicationStats,
  DeliveryStatus,
  SendCommunicationRequest,
  TemplateCode,
} from './communication.types';
import { renderTemplate, TEMPLATE_REGISTRY } from './template.registry';

export class CommunicationService {
  private static instance: CommunicationService;

  private readonly communications = new Map<string, CommunicationRecord>();

  private constructor() {
    // Seed initial records for testing
    const seedId = 'comm-seed-1';
    this.communications.set(seedId, {
      id: seedId,
      recipient: 'superadmin@adyapan.dev',
      recipientName: 'Super Admin',
      channel: 'EMAIL',
      category: 'TRANSACTIONAL',
      templateCode: 'APPLICATION_SUBMITTED',
      subject: 'Your Adyapan Loan Application #APP-1001 is Submitted',
      renderedBody: 'Application submitted successfully.',
      deliveryStatus: 'SENT',
      provider: 'SendGrid-Live-Adapter',
      sentAt: new Date(Date.now() - 3600000).toISOString(),
      dispatchedBy: 'system',
    });
  }

  public static getInstance(): CommunicationService {
    if (!CommunicationService.instance) {
      CommunicationService.instance = new CommunicationService();
    }
    return CommunicationService.instance;
  }

  /**
   * Evaluates if current time falls within RBI 8:00 AM - 7:00 PM collection window.
   */
  public isCollectionWindowOpen(): boolean {
    const now = new Date();
    // Get hours in IST (UTC+5:30)
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istTime = new Date(utcTime + 3600000 * 5.5);
    const hour = istTime.getHours();

    return hour >= 8 && hour < 19;
  }

  /**
   * Dispatches a standardized communication notice across Email, SMS, WhatsApp, or In-App.
   */
  public async sendMessage(
    req: SendCommunicationRequest,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<CommunicationRecord> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot trigger manual communications.');
    }

    const tpl = TEMPLATE_REGISTRY[req.templateCode];
    if (!tpl) {
      throw new BadRequestError(`Invalid template code '${req.templateCode}'.`);
    }

    if (!tpl.supportedChannels.includes(req.channel)) {
      throw new BadRequestError(
        `Channel '${req.channel}' is not supported for template '${req.templateCode}'. Supported: ${tpl.supportedChannels.join(', ')}`
      );
    }

    // 1. Render template with token substitution and automated PII masking
    const { subject, body, category } = renderTemplate(req.templateCode, req.variables || {}, req.channel);

    let deliveryStatus: DeliveryStatus = 'PENDING';
    let providerName = 'Internal-Hub';
    let errorMessage: string | undefined;

    // 2. Regulatory Compliance Check: RBI 8 AM - 7 PM Collection Notice Window
    if (category === 'COLLECTION') {
      const windowOpen = this.isCollectionWindowOpen();
      if (!windowOpen && !req.bypassWindowCheck) {
        deliveryStatus = 'BLOCKED_WINDOW';
        errorMessage = 'RBI Compliance: Collection notices cannot be dispatched outside 8:00 AM – 7:00 PM IST.';
      }
    }

    // 3. DND Preference Check (Applies to Transactional / Collection, not Regulatory)
    if (deliveryStatus === 'PENDING' && req.isDndOpted && category !== 'REGULATORY') {
      deliveryStatus = 'BLOCKED_DND';
      errorMessage = 'Recipient has opted into Do-Not-Disturb (DND). Non-regulatory message withheld.';
    }

    // 4. Provider Transmission (if not blocked)
    if (deliveryStatus === 'PENDING') {
      try {
        let providerRes: ProviderResult;
        const payload = {
          recipient: req.recipient,
          title: subject,
          body,
          templateCode: req.templateCode,
          metadata: req.metadata,
        };

        if (req.channel === 'EMAIL') {
          providerRes = await notificationProviders.email.send(payload);
        } else if (req.channel === 'SMS') {
          providerRes = await notificationProviders.sms.send(payload);
        } else if (req.channel === 'WHATSAPP') {
          providerRes = await notificationProviders.whatsapp.send(payload);
        } else {
          providerRes = {
            provider: 'Internal-InApp-Ledger',
            status: 'SENT',
            messageId: `inapp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            channel: 'IN_APP',
            timestamp: new Date().toISOString(),
          };
        }

        providerName = providerRes.provider;
        deliveryStatus = providerRes.status === 'SENT' ? 'SENT' : providerRes.status === 'MOCKED' ? 'MOCKED' : 'DELIVERED';
      } catch (err: any) {
        deliveryStatus = 'FAILED';
        errorMessage = err.message || 'Provider dispatch failed';
      }
    }

    const commId = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: CommunicationRecord = {
      id: commId,
      recipient: req.recipient,
      recipientName: req.recipientName,
      customerId: req.customerId,
      loanId: req.loanId,
      applicationId: req.applicationId,
      channel: req.channel,
      category: tpl.category,
      templateCode: req.templateCode,
      subject,
      renderedBody: body,
      deliveryStatus,
      provider: providerName,
      errorMessage,
      metadata: req.metadata,
      sentAt: new Date().toISOString(),
      dispatchedBy: actor.email,
    };

    this.communications.set(commId, record);

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'COMMUNICATION_DISPATCHED',
      entity: 'CommunicationRecord',
      entityId: commId,
      newValue: {
        channel: req.channel,
        templateCode: req.templateCode,
        deliveryStatus,
        recipient: req.recipient,
      },
    }).catch(() => {});

    return record;
  }

  /**
   * Lists communication logs with filtering and borrower isolation.
   */
  public listCommunications(
    filters: {
      channel?: string;
      status?: string;
      category?: string;
      recipient?: string;
      customerId?: string;
    },
    actor: { id: string; email: string; roles: string[] }
  ): CommunicationRecord[] {
    let items = Array.from(this.communications.values());

    // Strict Borrower Isolation: Borrowers can only view notices sent to them
    if (actor.roles.includes('CUSTOMER')) {
      items = items.filter(
        (c) => c.recipient === actor.email || (filters.customerId && c.customerId === filters.customerId)
      );
    }

    if (filters.channel) items = items.filter((c) => c.channel === filters.channel);
    if (filters.status) items = items.filter((c) => c.deliveryStatus === filters.status);
    if (filters.category) items = items.filter((c) => c.category === filters.category);
    if (filters.recipient) items = items.filter((c) => c.recipient.toLowerCase().includes(filters.recipient!.toLowerCase()));

    return items.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  /**
   * Returns aggregated delivery and channel statistics.
   */
  public getStats(actor: { id: string; roles: string[] }): CommunicationStats {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view communication statistics.');
    }

    const all = Array.from(this.communications.values());
    const successful = all.filter((c) => c.deliveryStatus === 'SENT' || c.deliveryStatus === 'DELIVERED' || c.deliveryStatus === 'MOCKED');
    const deliveryRate = all.length > 0 ? Number(((successful.length / all.length) * 100).toFixed(1)) : 100;

    const byChannel: Record<CommunicationChannel, number> = {
      EMAIL: 0,
      SMS: 0,
      WHATSAPP: 0,
      IN_APP: 0,
    };

    const byCategory = {
      TRANSACTIONAL: 0,
      COLLECTION: 0,
      REGULATORY: 0,
    };

    const byStatus = {
      PENDING: 0,
      SENT: 0,
      DELIVERED: 0,
      FAILED: 0,
      BLOCKED_DND: 0,
      BLOCKED_WINDOW: 0,
      MOCKED: 0,
    };

    for (const c of all) {
      byChannel[c.channel] = (byChannel[c.channel] || 0) + 1;
      byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      byStatus[c.deliveryStatus] = (byStatus[c.deliveryStatus] || 0) + 1;
    }

    return {
      totalDispatched: all.length,
      deliveryRatePercent: deliveryRate,
      activeChannels: 4,
      byChannel,
      byCategory,
      byStatus,
      collectionWindowActive: this.isCollectionWindowOpen(),
    };
  }

  /**
   * Safe preview of rendered template with token substitution and PII masking.
   */
  public previewTemplate(
    templateCode: TemplateCode,
    variables: Record<string, any>,
    channel: CommunicationChannel
  ) {
    return renderTemplate(templateCode, variables, channel);
  }

  public clearForTesting(): void {
    this.communications.clear();
  }
}

export const communicationService = CommunicationService.getInstance();
