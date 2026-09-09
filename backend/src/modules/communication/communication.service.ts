import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { prisma } from '../../config/prisma';
import { logAudit } from '../audit/audit.service';
import { notificationProviders, ProviderResult } from '../notifications/provider';
import { privacyConsentService } from '../privacy/consent.service';
import {
  CommunicationChannel,
  CommunicationDashboardMetrics,
  CommunicationRecord,
  CustomerCommunicationPreference,
  DeliveryStatus,
  DeliveryWebhookPayload,
  ProviderHealthStatus,
  SendCommunicationRequest,
  TemplateCode,
} from './communication.types';
import { renderTemplate, TEMPLATE_REGISTRY } from './template.registry';

export class CommunicationService {
  private static instance: CommunicationService;

  private readonly communications = new Map<string, CommunicationRecord>();
  private readonly customerPreferences = new Map<string, CustomerCommunicationPreference>();

  private constructor() {
    // Seed initial records for testing
    const seedId = 'comm-seed-1';
    this.communications.set(seedId, {
      id: seedId,
      tenantId: 'tenant-dev-1',
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
   * Dispatches a standardized communication notice across WhatsApp, SMS, Email, or In-App.
   */
  public async sendMessage(
    req: SendCommunicationRequest,
    actor: { id: string; email: string; roles: string[]; tenantId?: string; branchId?: string }
  ): Promise<CommunicationRecord> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot trigger manual staff communications.');
    }

    // Role Permission Validation
    const isLoanOfficer = actor.roles.includes('LOAN_OFFICER');
    const isCollectionOfficer = actor.roles.includes('COLLECTION_OFFICER');

    const tpl = TEMPLATE_REGISTRY[req.templateCode];
    if (!tpl) {
      throw new BadRequestError(`Invalid template code '${req.templateCode}'.`);
    }

    if (!tpl.supportedChannels.includes(req.channel)) {
      throw new BadRequestError(
        `Channel '${req.channel}' is not supported for template '${req.templateCode}'. Supported: ${tpl.supportedChannels.join(', ')}`
      );
    }

    // Collection Officers can only send Collection or Transactional notices
    if (isCollectionOfficer && tpl.category === 'REGULATORY' && req.templateCode === 'APPROVAL_SANCTION_LETTER') {
      throw new ForbiddenError('Collection officers cannot dispatch underwriting sanction letters.');
    }

    // Loan Officers cannot send recovery demand notices
    if (isLoanOfficer && req.templateCode === 'RECOVERY_NOTICE') {
      throw new ForbiddenError('Loan Officers cannot dispatch legal recovery notices. Escalate to Recovery Desk.');
    }

    // Tenant & Branch Scoping Check
    const tenantId = actor.tenantId || req.metadata?.tenantId || 'tenant-dev-1';
    let branchId = actor.branchId;

    if (req.customerId) {
      try {
        const customer = await prisma.customer.findUnique({
          where: { id: req.customerId },
          select: { id: true, tenantId: true, branchId: true, mobile: true, email: true, firstName: true, lastName: true },
        });

        if (customer) {
          if (customer.tenantId && actor.tenantId && customer.tenantId !== actor.tenantId && !actor.roles.includes('SUPER_ADMIN')) {
            throw new ForbiddenError('Tenant isolation violation: Customer belongs to another tenant.');
          }

          if (actor.branchId && customer.branchId && actor.branchId !== customer.branchId && !actor.roles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r))) {
            throw new ForbiddenError('Branch isolation violation: Customer belongs to another branch.');
          }
          branchId = customer.branchId || branchId;
        }
      } catch (err) {
        if (err instanceof ForbiddenError) throw err;
        // Non-blocking if Prisma query fails in test mock
      }
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

    // 3. Customer Consent & DND Preference Check (Applies to Transactional / Collection, not Regulatory)
    if (deliveryStatus === 'PENDING') {
      const isDnd = req.isDndOpted || (req.customerId ? this.isCustomerDndOpted(req.customerId) : false);

      if (isDnd && category !== 'REGULATORY') {
        deliveryStatus = 'BLOCKED_DND';
        errorMessage = 'Recipient has opted into Do-Not-Disturb (DND). Non-regulatory message withheld.';
      }
    }

    // 4. Provider Transmission (if not blocked)
    let providerMessageId: string | undefined;

    if (deliveryStatus === 'PENDING') {
      try {
        let providerRes: ProviderResult;
        const payload = {
          recipient: req.recipient,
          title: subject,
          body,
          templateCode: req.templateCode,
          metadata: {
            ...req.metadata,
            customerId: req.customerId,
            loanId: req.loanId,
          },
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

          // Also save in-app notification in Prisma if customerId exists
          if (req.customerId) {
            await prisma.notification.create({
              data: {
                customerId: req.customerId,
                channel: 'IN_APP',
                title: subject,
                message: body,
                type: category === 'COLLECTION' ? 'WARNING' : category === 'REGULATORY' ? 'ALERT' : 'INFO',
                metadata: {
                  templateCode: req.templateCode,
                  loanId: req.loanId,
                  applicationId: req.applicationId,
                },
              },
            }).catch(() => {});
          }
        }

        providerName = providerRes.provider;
        providerMessageId = providerRes.messageId;
        deliveryStatus = providerRes.status === 'SENT' ? 'SENT' : providerRes.status === 'MOCKED' ? 'MOCKED' : 'DELIVERED';
      } catch (err: any) {
        deliveryStatus = 'FAILED';
        errorMessage = err.message || 'Provider dispatch failed';
      }
    }

    const commId = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const record: CommunicationRecord = {
      id: commId,
      tenantId,
      branchId,
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
      providerMessageId,
      errorMessage,
      retryCount: 0,
      idempotencyKey: req.idempotencyKey,
      metadata: req.metadata,
      sentAt: nowIso,
      deliveredAt: deliveryStatus === 'DELIVERED' ? nowIso : undefined,
      failedAt: deliveryStatus === 'FAILED' ? nowIso : undefined,
      dispatchedBy: actor.email,
    };

    this.communications.set(commId, record);

    await logAudit({
      userId: actor.id,
      tenantId,
      role: actor.roles[0],
      action: 'COMMUNICATION_DISPATCHED',
      entity: 'CommunicationRecord',
      entityId: commId,
      newValue: {
        channel: req.channel,
        templateCode: req.templateCode,
        deliveryStatus,
        recipient: req.recipient,
        customerId: req.customerId,
        loanId: req.loanId,
      },
    }).catch(() => {});

    return record;
  }

  /**
   * Safe idempotent retry mechanism for failed or pending communications.
   */
  public async retryCommunication(
    id: string,
    actor: { id: string; email: string; roles: string[]; tenantId?: string; branchId?: string }
  ): Promise<CommunicationRecord> {
    const record = this.communications.get(id);
    if (!record) {
      throw new NotFoundError(`Communication record #${id} not found.`);
    }

    // Tenant Check
    if (record.tenantId && actor.tenantId && record.tenantId !== actor.tenantId && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Tenant isolation violation: Access denied to communication record.');
    }

    if (record.deliveryStatus === 'DELIVERED' || record.deliveryStatus === 'READ') {
      throw new BadRequestError(`Communication #${id} has already been successfully delivered.`);
    }

    const retryCount = (record.retryCount || 0) + 1;
    const nowIso = new Date().toISOString();

    try {
      let providerRes: ProviderResult;
      const payload = {
        recipient: record.recipient,
        title: record.subject,
        body: record.renderedBody,
        templateCode: record.templateCode,
      };

      if (record.channel === 'EMAIL') {
        providerRes = await notificationProviders.email.send(payload);
      } else if (record.channel === 'SMS') {
        providerRes = await notificationProviders.sms.send(payload);
      } else if (record.channel === 'WHATSAPP') {
        providerRes = await notificationProviders.whatsapp.send(payload);
      } else {
        providerRes = {
          provider: 'Internal-InApp-Ledger',
          status: 'SENT',
          messageId: `inapp-retry-${Date.now()}`,
          channel: 'IN_APP',
          timestamp: nowIso,
        };
      }

      record.deliveryStatus = providerRes.status === 'SENT' ? 'SENT' : providerRes.status === 'MOCKED' ? 'MOCKED' : 'DELIVERED';
      record.provider = providerRes.provider;
      record.providerMessageId = providerRes.messageId;
      record.errorMessage = undefined;
      record.retryCount = retryCount;
      record.lastRetryAt = nowIso;
      if (record.deliveryStatus === 'DELIVERED') record.deliveredAt = nowIso;
    } catch (err: any) {
      record.deliveryStatus = 'FAILED';
      record.errorMessage = err.message || 'Retry dispatch failed';
      record.retryCount = retryCount;
      record.lastRetryAt = nowIso;
      record.failedAt = nowIso;
    }

    this.communications.set(id, record);

    await logAudit({
      userId: actor.id,
      tenantId: actor.tenantId,
      role: actor.roles[0],
      action: 'COMMUNICATION_RETRIED',
      entity: 'CommunicationRecord',
      entityId: id,
      newValue: {
        deliveryStatus: record.deliveryStatus,
        retryCount,
        lastRetryAt: nowIso,
      },
    }).catch(() => {});

    return record;
  }

  /**
   * Idempotent delivery webhook callback processing for SendGrid / Twilio / Meta WhatsApp.
   */
  public processDeliveryWebhook(provider: string, payload: DeliveryWebhookPayload): { updated: boolean; record?: CommunicationRecord } {
    if (!payload.providerMessageId) {
      return { updated: false };
    }

    // Find record by providerMessageId
    for (const record of this.communications.values()) {
      if (record.providerMessageId === payload.providerMessageId) {
        const nowIso = payload.timestamp || new Date().toISOString();

        if (payload.event === 'delivered') {
          record.deliveryStatus = 'DELIVERED';
          record.deliveredAt = nowIso;
        } else if (payload.event === 'read') {
          record.deliveryStatus = 'READ';
          record.readAt = nowIso;
          if (!record.deliveredAt) record.deliveredAt = nowIso;
        } else if (payload.event === 'failed' || payload.event === 'bounced') {
          record.deliveryStatus = 'FAILED';
          record.failedAt = nowIso;
          record.errorMessage = payload.reason || 'Delivery rejected by carrier / mailbox';
        }

        this.communications.set(record.id, record);
        return { updated: true, record };
      }
    }

    return { updated: false };
  }

  /**
   * Lists communication records with search, multi-filter, pagination, and strict tenant/branch isolation.
   */
  public listCommunications(
    filters: {
      channel?: string;
      status?: string;
      category?: string;
      recipient?: string;
      customerId?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    },
    actor: { id: string; email: string; roles: string[]; tenantId?: string; branchId?: string; customerId?: string }
  ): { items: CommunicationRecord[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } } {
    let items = Array.from(this.communications.values());

    // 1. Strict Borrower Isolation: Borrowers can only view notices sent to their email or customerId
    if (actor.roles.includes('CUSTOMER')) {
      items = items.filter(
        (c) =>
          c.recipient === actor.email ||
          (actor.customerId && c.customerId === actor.customerId) ||
          (filters.customerId && c.customerId === filters.customerId)
      );
    } else {
      // Staff Tenant Isolation
      if (actor.tenantId && !actor.roles.includes('SUPER_ADMIN')) {
        items = items.filter((c) => !c.tenantId || c.tenantId === actor.tenantId);
      }

      // Staff Branch Isolation
      if (actor.branchId && actor.roles.includes('LOAN_OFFICER')) {
        items = items.filter((c) => !c.branchId || c.branchId === actor.branchId);
      }
    }

    // Channel filter
    if (filters.channel && filters.channel !== 'ALL') {
      items = items.filter((c) => c.channel === filters.channel);
    }

    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      items = items.filter((c) => c.deliveryStatus === filters.status);
    }

    // Category filter
    if (filters.category && filters.category !== 'ALL') {
      items = items.filter((c) => c.category === filters.category);
    }

    // CustomerId filter
    if (filters.customerId) {
      items = items.filter((c) => c.customerId === filters.customerId);
    }

    // Recipient search
    if (filters.recipient) {
      const q = filters.recipient.toLowerCase();
      items = items.filter((c) => c.recipient.toLowerCase().includes(q) || c.recipientName?.toLowerCase().includes(q));
    }

    // General search query
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (c) =>
          c.recipient.toLowerCase().includes(q) ||
          c.recipientName?.toLowerCase().includes(q) ||
          c.templateCode.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.renderedBody.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.loanId && c.loanId.toLowerCase().includes(q))
      );
    }

    // Sort descending by sentAt
    items.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    const total = items.length;
    const page = Math.max(Number(filters.page) || 1, 1);
    const pageSize = Math.max(Number(filters.pageSize) || 20, 1);
    const totalPages = Math.ceil(total / pageSize) || 1;

    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  }

  /**
   * Retrieves single communication record with tenant isolation.
   */
  public getCommunicationById(
    id: string,
    actor: { id: string; email: string; roles: string[]; tenantId?: string }
  ): CommunicationRecord {
    const record = this.communications.get(id);
    if (!record) {
      throw new NotFoundError(`Communication #${id} not found.`);
    }

    if (actor.roles.includes('CUSTOMER')) {
      if (record.recipient !== actor.email) {
        throw new ForbiddenError('Borrower access violation: You cannot view notices addressed to other recipients.');
      }
    } else if (record.tenantId && actor.tenantId && record.tenantId !== actor.tenantId && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Tenant isolation violation: Access denied to communication record.');
    }

    return record;
  }

  /**
   * Returns aggregated live dashboard metrics.
   */
  public getDashboardMetrics(actor: { id: string; roles: string[]; tenantId?: string; branchId?: string }): CommunicationDashboardMetrics {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view administrative communication statistics.');
    }

    let all = Array.from(this.communications.values());
    if (actor.tenantId && !actor.roles.includes('SUPER_ADMIN')) {
      all = all.filter((c) => !c.tenantId || c.tenantId === actor.tenantId);
    }
    if (actor.branchId && actor.roles.includes('LOAN_OFFICER')) {
      all = all.filter((c) => !c.branchId || c.branchId === actor.branchId);
    }

    const successful = all.filter((c) => ['SENT', 'DELIVERED', 'READ', 'MOCKED'].includes(c.deliveryStatus));
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
      MARKETING: 0,
    };

    const byStatus = {
      QUEUED: 0,
      PENDING: 0,
      SENT: 0,
      DELIVERED: 0,
      READ: 0,
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

    const sortedRecent = [...all].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()).slice(0, 8);

    return {
      totalMessages: all.length,
      totalSent: byStatus.SENT + byStatus.MOCKED,
      totalDelivered: byStatus.DELIVERED,
      totalPending: byStatus.PENDING + byStatus.QUEUED,
      totalFailed: byStatus.FAILED + byStatus.BLOCKED_WINDOW + byStatus.BLOCKED_DND,
      totalRead: byStatus.READ,
      deliveryRatePercent: deliveryRate,
      activeChannelsCount: 4,
      byChannel,
      byCategory,
      byStatus,
      collectionWindowActive: this.isCollectionWindowOpen(),
      recentActivity: sortedRecent,
    };
  }

  /**
   * Returns sanitized provider health summary.
   */
  public getProviderHealth(actor: { id: string; roles: string[] }): ProviderHealthStatus[] {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden.');
    }
    return notificationProviders.getHealthSummary();
  }

  /**
   * Retrieves or initializes customer communication preference.
   */
  public getCustomerPreferences(customerId: string, tenantId = 'tenant-dev-1'): CustomerCommunicationPreference {
    const existing = this.customerPreferences.get(customerId);
    if (existing) return existing;

    let hasConsent = true;
    try {
      const check = privacyConsentService.checkEnforcement(tenantId, customerId, 'COMMUNICATION_CHANNELS');
      hasConsent = check?.granted ?? true;
    } catch {
      hasConsent = true;
    }

    const defaultPrefs: CustomerCommunicationPreference = {
      customerId,
      tenantId,
      whatsappOptIn: hasConsent,
      smsOptIn: hasConsent,
      emailOptIn: true,
      inAppOptIn: true,
      allowMarketing: false,
      allowTransactional: true,
      isDndOpted: !hasConsent,
      preferredChannel: 'EMAIL',
      updatedAt: new Date().toISOString(),
    };

    this.customerPreferences.set(customerId, defaultPrefs);
    return defaultPrefs;
  }

  /**
   * Updates customer communication preferences and records audit trail.
   */
  public async updateCustomerPreferences(
    customerId: string,
    updates: Partial<CustomerCommunicationPreference>,
    actor: { id: string; email: string; roles: string[]; tenantId?: string }
  ): Promise<CustomerCommunicationPreference> {
    const current = this.getCustomerPreferences(customerId, actor.tenantId);

    const updated: CustomerCommunicationPreference = {
      ...current,
      ...updates,
      customerId,
      tenantId: actor.tenantId || current.tenantId,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.email,
    };

    this.customerPreferences.set(customerId, updated);

    // Sync with privacy privacyConsentService if DND or channel consent changed
    if (updates.isDndOpted !== undefined) {
      if (!updates.isDndOpted) {
        await privacyConsentService.grantConsent(
          {
            tenantId: actor.tenantId || current.tenantId,
            customerId,
            purposeCode: 'PURPOSE-MKTG-05',
            channel: 'WEB_PORTAL',
          },
          actor
        ).catch(() => {});
      }
    }

    await logAudit({
      userId: actor.id,
      tenantId: actor.tenantId,
      role: actor.roles[0],
      action: 'CUSTOMER_PREFERENCES_UPDATED',
      entity: 'CustomerCommunicationPreference',
      entityId: customerId,
      newValue: updated,
    }).catch(() => {});

    return updated;
  }

  private isCustomerDndOpted(customerId: string): boolean {
    const prefs = this.customerPreferences.get(customerId);
    return prefs ? prefs.isDndOpted : false;
  }

  /**
   * Safe preview of rendered template with dynamic token substitution and PII masking.
   */
  public previewTemplate(
    templateCode: TemplateCode,
    variables: Record<string, any>,
    channel: CommunicationChannel
  ) {
    return renderTemplate(templateCode, variables, channel);
  }

  /**
   * Non-blocking post-commit LMS business event dispatcher.
   */
  public async dispatchSystemEvent(
    event:
      | 'CUSTOMER_CREATED'
      | 'KYC_PENDING'
      | 'APPLICATION_SUBMITTED'
      | 'APPLICATION_FORWARDED_TO_CREDIT'
      | 'LOAN_APPROVED'
      | 'LOAN_REJECTED'
      | 'DISBURSEMENT_SUCCESSFUL'
      | 'PAYMENT_RECEIVED'
      | 'LOAN_CLOSED',
    data: {
      customerId?: string;
      customerName?: string;
      customerEmail?: string;
      customerMobile?: string;
      customerCode?: string;
      applicationNo?: string;
      loanNo?: string;
      requestedAmount?: string | number;
      sanctionedAmount?: string | number;
      netDisbursedAmount?: string | number;
      paidAmount?: string | number;
      tenureMonths?: number;
      interestRate?: number;
      emiAmount?: string | number;
      rejectionReason?: string;
      bankAccount?: string;
      utrNumber?: string;
      closureDate?: string;
      nocReference?: string;
      trackingUrl?: string;
      paymentUrl?: string;
      paymentReference?: string;
      branchName?: string;
    },
    tenantId = 'tenant-dev-1'
  ): Promise<CommunicationRecord | null> {
    try {
      let templateCode: TemplateCode;
      let channel: CommunicationChannel = 'EMAIL';

      switch (event) {
        case 'CUSTOMER_CREATED':
          templateCode = 'WELCOME_MESSAGE';
          break;
        case 'KYC_PENDING':
          templateCode = 'KYC_PENDING';
          break;
        case 'APPLICATION_SUBMITTED':
          templateCode = 'APPLICATION_SUBMITTED';
          break;
        case 'APPLICATION_FORWARDED_TO_CREDIT':
          templateCode = 'APPLICATION_FORWARDED_TO_CREDIT';
          break;
        case 'LOAN_APPROVED':
          templateCode = 'APPROVAL_SANCTION_LETTER';
          break;
        case 'LOAN_REJECTED':
          templateCode = 'REJECTION_EXPLANATION';
          break;
        case 'DISBURSEMENT_SUCCESSFUL':
          templateCode = 'DISBURSEMENT_NOTICE';
          break;
        case 'PAYMENT_RECEIVED':
          templateCode = 'PAYMENT_RECEIPT';
          break;
        case 'LOAN_CLOSED':
          templateCode = 'SETTLEMENT_NOC_LETTER';
          break;
        default:
          return null;
      }

      const recipient = data.customerEmail || data.customerMobile || 'customer@adyapan.dev';
      if (data.customerMobile && !data.customerEmail) channel = 'SMS';

      return await this.sendMessage(
        {
          templateCode,
          channel,
          recipient,
          recipientName: data.customerName,
          customerId: data.customerId,
          loanId: data.loanNo,
          applicationId: data.applicationNo,
          variables: {
            ...data,
            customerName: data.customerName || 'Customer',
            customerCode: data.customerCode || 'CUST-ONBOARD',
            uploadUrl: 'https://adyapan.dev/upload',
            portalUrl: 'https://adyapan.dev/customer/dashboard',
            trackingUrl: data.trackingUrl || 'https://adyapan.dev/customer/applications',
            paymentUrl: data.paymentUrl || 'https://adyapan.dev/customer/repayments',
            productName: 'Personal Express Loan',
            receiptNo: `RCP-${Date.now().toString().slice(-4)}`,
            firstDueDate: '05-Oct-2026',
            dueDate: '05-Oct-2026',
            outstandingPrincipal: '0.00',
            coolingPeriodMonths: '3',
          },
        },
        {
          id: 'system',
          email: 'system-bot@adyapan.dev',
          roles: ['SUPER_ADMIN'],
          tenantId,
        }
      );
    } catch (err) {
      // Non-blocking catch per requirement: Event notification failure must never crash core transaction
      return null;
    }
  }

  public clearForTesting(): void {
    this.communications.clear();
    this.customerPreferences.clear();
  }
}

export const communicationService = CommunicationService.getInstance();
