import {
  CommunicationChannel,
  CommunicationEventCode,
  CommunicationTemplate,
  LanguageCode,
  TemplateStatus,
  MessageCategory,
} from './communication.types';

export class TemplateService {
  private templates: Map<string, CommunicationTemplate> = new Map();

  constructor() {
    this.seedDefaultTemplates();
  }

  /**
   * Helper to extract placeholders from template text (e.g. {{customerName}})
   */
  public extractPlaceholders(text: string): string[] {
    const matches = text.match(/\{\{([a-zA-Z0-9_]+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map((m) => m.replace(/[\{\}]/g, '').trim())));
  }

  /**
   * Render template with provided data dictionary
   */
  public renderTemplate(
    template: CommunicationTemplate,
    data: Record<string, any> = {}
  ): { subject?: string; body: string; missingPlaceholders: string[] } {
    const missingPlaceholders: string[] = [];

    // Check all required variables
    for (const reqVar of template.variables) {
      if (data[reqVar] === undefined || data[reqVar] === null) {
        missingPlaceholders.push(reqVar);
      }
    }

    const replaceVariables = (str: string): string => {
      return str.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
        if (data[key] !== undefined && data[key] !== null) {
          return String(data[key]);
        }
        return `[MISSING: ${key}]`;
      });
    };

    const renderedSubject = template.subject ? replaceVariables(template.subject) : undefined;
    const renderedBody = replaceVariables(template.body);

    return {
      subject: renderedSubject,
      body: renderedBody,
      missingPlaceholders,
    };
  }

  /**
   * Create a new template (starts at version 1)
   */
  public createTemplate(params: {
    tenantId: string;
    name: string;
    code: string;
    eventCode: CommunicationEventCode;
    channel: CommunicationChannel;
    language?: LanguageCode;
    category?: MessageCategory;
    subject?: string;
    body: string;
    dltTemplateId?: string;
    dltSenderId?: string;
    ctaUrl?: string;
    status?: TemplateStatus;
    createdBy?: string;
  }): CommunicationTemplate {
    const id = `TMPL_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const now = new Date().toISOString();

    const placeholders = Array.from(
      new Set([
        ...this.extractPlaceholders(params.body),
        ...(params.subject ? this.extractPlaceholders(params.subject) : []),
      ])
    );

    const template: CommunicationTemplate = {
      id,
      tenantId: params.tenantId || 'DEFAULT',
      name: params.name,
      code: params.code,
      eventCode: params.eventCode,
      channel: params.channel,
      language: params.language || 'en-IN',
      category: params.category || 'TRANSACTIONAL',
      version: 1,
      subject: params.subject,
      body: params.body,
      variables: placeholders,
      dltTemplateId: params.dltTemplateId,
      dltSenderId: params.dltSenderId,
      ctaUrl: params.ctaUrl,
      status: params.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      createdBy: params.createdBy || 'SYSTEM',
    };

    this.templates.set(template.id, template);
    return template;
  }

  /**
   * Update template. If active, increments version immutable history.
   */
  public updateTemplate(
    templateId: string,
    updates: Partial<{
      name: string;
      subject: string;
      body: string;
      language: LanguageCode;
      category: MessageCategory;
      dltTemplateId: string;
      dltSenderId: string;
      ctaUrl: string;
      status: TemplateStatus;
      updatedBy: string;
    }>
  ): CommunicationTemplate {
    const existing = this.templates.get(templateId);
    if (!existing) {
      throw new Error(`Template with id '${templateId}' not found`);
    }

    const now = new Date().toISOString();

    // If changing content of an ACTIVE template, create a new version to preserve immutability
    if (
      existing.status === 'ACTIVE' &&
      (updates.body !== undefined || updates.subject !== undefined)
    ) {
      // Mark old as ARCHIVED
      existing.status = 'ARCHIVED';
      existing.updatedAt = now;
      this.templates.set(existing.id, existing);

      // Create new version
      const newVersionId = `TMPL_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const newBody = updates.body ?? existing.body;
      const newSubject = updates.subject ?? existing.subject;
      const placeholders = Array.from(
        new Set([
          ...this.extractPlaceholders(newBody),
          ...(newSubject ? this.extractPlaceholders(newSubject) : []),
        ])
      );

      const newTemplate: CommunicationTemplate = {
        ...existing,
        id: newVersionId,
        name: updates.name ?? existing.name,
        subject: newSubject,
        body: newBody,
        language: updates.language ?? existing.language,
        category: updates.category ?? existing.category,
        dltTemplateId: updates.dltTemplateId ?? existing.dltTemplateId,
        dltSenderId: updates.dltSenderId ?? existing.dltSenderId,
        ctaUrl: updates.ctaUrl ?? existing.ctaUrl,
        version: existing.version + 1,
        variables: placeholders,
        status: updates.status ?? 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        createdBy: updates.updatedBy || existing.createdBy,
        updatedBy: updates.updatedBy,
      };

      this.templates.set(newTemplate.id, newTemplate);
      return newTemplate;
    }

    // Otherwise apply in-place updates
    const updatedBody = updates.body ?? existing.body;
    const updatedSubject = updates.subject ?? existing.subject;
    const placeholders = Array.from(
      new Set([
        ...this.extractPlaceholders(updatedBody),
        ...(updatedSubject ? this.extractPlaceholders(updatedSubject) : []),
      ])
    );

    const updated: CommunicationTemplate = {
      ...existing,
      ...updates,
      variables: placeholders,
      updatedAt: now,
    };

    this.templates.set(updated.id, updated);
    return updated;
  }

  public getTemplateById(id: string): CommunicationTemplate | undefined {
    return this.templates.get(id);
  }

  public findActiveTemplate(params: {
    tenantId: string;
    eventCode: CommunicationEventCode;
    channel: CommunicationChannel;
    language?: LanguageCode;
  }): CommunicationTemplate | undefined {
    const lang = params.language || 'en-IN';

    // 1. Try exact tenant + event + channel + language
    for (const t of this.templates.values()) {
      if (
        t.status === 'ACTIVE' &&
        t.tenantId === params.tenantId &&
        t.eventCode === params.eventCode &&
        t.channel === params.channel &&
        t.language === lang
      ) {
        return t;
      }
    }

    // 2. Try default tenant + event + channel + language
    for (const t of this.templates.values()) {
      if (
        t.status === 'ACTIVE' &&
        t.tenantId === 'DEFAULT' &&
        t.eventCode === params.eventCode &&
        t.channel === params.channel &&
        t.language === lang
      ) {
        return t;
      }
    }

    // 3. Fallback to English (en-IN)
    for (const t of this.templates.values()) {
      if (
        t.status === 'ACTIVE' &&
        (t.tenantId === params.tenantId || t.tenantId === 'DEFAULT') &&
        t.eventCode === params.eventCode &&
        t.channel === params.channel &&
        t.language === 'en-IN'
      ) {
        return t;
      }
    }

    return undefined;
  }

  public listTemplates(params?: {
    tenantId?: string;
    channel?: CommunicationChannel;
    eventCode?: CommunicationEventCode;
    status?: TemplateStatus;
    language?: LanguageCode;
  }): CommunicationTemplate[] {
    let list = Array.from(this.templates.values());

    if (params?.tenantId && params.tenantId !== 'ALL') {
      list = list.filter((t) => t.tenantId === params.tenantId || t.tenantId === 'DEFAULT');
    }
    if (params?.channel) {
      list = list.filter((t) => t.channel === params.channel);
    }
    if (params?.eventCode) {
      list = list.filter((t) => t.eventCode === params.eventCode);
    }
    if (params?.status) {
      list = list.filter((t) => t.status === params.status);
    }
    if (params?.language) {
      list = list.filter((t) => t.language === params.language);
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Seeds enterprise default templates for all 30+ domain events
   */
  private seedDefaultTemplates(): void {
    const defaultTemplates: Array<Omit<CommunicationTemplate, 'id' | 'createdAt' | 'updatedAt'>> = [
      // 1. WELCOME_MESSAGE (SMS)
      {
        tenantId: 'DEFAULT',
        name: 'Welcome Message SMS',
        code: 'SMS_WELCOME_V1',
        eventCode: 'WELCOME_MESSAGE',
        channel: 'SMS',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: 'Welcome to Adyapan, {{customerName}}! Your registration is successful. Download the app to explore your instant credit limit.',
        variables: ['customerName'],
        dltTemplateId: 'DLT_1107161234567890',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 2. KYC_COMPLETED (SMS & Push & In-App)
      {
        tenantId: 'DEFAULT',
        name: 'KYC Verified SMS',
        code: 'SMS_KYC_COMPLETED_V1',
        eventCode: 'KYC_COMPLETED',
        channel: 'SMS',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: 'Dear {{customerName}}, your KYC verification is complete! You can now proceed to select your credit offer.',
        variables: ['customerName'],
        dltTemplateId: 'DLT_1107161234567891',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      {
        tenantId: 'DEFAULT',
        name: 'KYC Verified Push',
        code: 'PUSH_KYC_COMPLETED_V1',
        eventCode: 'KYC_COMPLETED',
        channel: 'PUSH',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        subject: 'KYC Verification Successful!',
        body: 'Hi {{customerName}}, your documents have been verified. View your approved loan offers now.',
        variables: ['customerName'],
        ctaUrl: '/offers',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      {
        tenantId: 'DEFAULT',
        name: 'KYC Failed SMS',
        code: 'SMS_KYC_FAILED_V1',
        eventCode: 'KYC_FAILED',
        channel: 'SMS',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: 'Dear {{customerName}}, your KYC could not be verified due to {{reason}}. Please re-upload clear documents in the app.',
        variables: ['customerName', 'reason'],
        dltTemplateId: 'DLT_1107161234567892',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 3. APPLICATION_SUBMITTED (SMS & Email)
      {
        tenantId: 'DEFAULT',
        name: 'Application Submitted Email',
        code: 'EMAIL_APP_SUBMITTED_V1',
        eventCode: 'APPLICATION_SUBMITTED',
        channel: 'EMAIL',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        subject: 'Loan Application #{{applicationId}} Received',
        body: 'Hello {{customerName}},\n\nWe have received your loan application for INR {{amount}}. Our automated underwriting engine is reviewing your details. We will notify you shortly.',
        variables: ['customerName', 'applicationId', 'amount'],
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 4. APPLICATION_APPROVED (SMS, Push, WhatsApp, In-App)
      {
        tenantId: 'DEFAULT',
        name: 'Application Approved SMS',
        code: 'SMS_APP_APPROVED_V1',
        eventCode: 'APPLICATION_APPROVED',
        channel: 'SMS',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: 'Congratulations {{customerName}}! Your loan application #{{applicationId}} for INR {{amount}} has been approved. Open app to accept your offer: {{ctaUrl}}',
        variables: ['customerName', 'applicationId', 'amount', 'ctaUrl'],
        dltTemplateId: 'DLT_1107161234567893',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      {
        tenantId: 'DEFAULT',
        name: 'Application Approved WhatsApp',
        code: 'WA_APP_APPROVED_V1',
        eventCode: 'APPLICATION_APPROVED',
        channel: 'WHATSAPP',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: '🎉 *Congratulations {{customerName}}!*\n\nYour loan of *₹{{amount}}* (Application #{{applicationId}}) is approved.\n\n👉 Complete agreement signing now: {{ctaUrl}}',
        variables: ['customerName', 'amount', 'applicationId', 'ctaUrl'],
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 5. APPLICATION_REJECTED (SMS & Email)
      {
        tenantId: 'DEFAULT',
        name: 'Application Rejected SMS',
        code: 'SMS_APP_REJECTED_V1',
        eventCode: 'APPLICATION_REJECTED',
        channel: 'SMS',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: 'Dear {{customerName}}, after evaluating application #{{applicationId}}, we are unable to approve your loan at this time based on credit policy criteria.',
        variables: ['customerName', 'applicationId'],
        dltTemplateId: 'DLT_1107161234567894',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 6. OFFER_GENERATED (SMS & Push)
      {
        tenantId: 'DEFAULT',
        name: 'Offer Ready SMS',
        code: 'SMS_OFFER_READY_V1',
        eventCode: 'OFFER_GENERATED',
        channel: 'SMS',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: 'Dear {{customerName}}, your personalized loan offer of INR {{offeredAmount}} @ {{roi}}% is ready. Valid until {{expiryDate}}.',
        variables: ['customerName', 'offeredAmount', 'roi', 'expiryDate'],
        dltTemplateId: 'DLT_1107161234567895',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 7. AGREEMENT_SIGNING_REQUIRED (SMS & WhatsApp)
      {
        tenantId: 'DEFAULT',
        name: 'Agreement eSign SMS',
        code: 'SMS_ESIGN_REQ_V1',
        eventCode: 'AGREEMENT_SIGNING_REQUIRED',
        channel: 'SMS',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: 'Dear {{customerName}}, please complete your Aadhaar e-Sign for Loan #{{loanId}} to enable instant disbursement: {{signingUrl}}',
        variables: ['customerName', 'loanId', 'signingUrl'],
        dltTemplateId: 'DLT_1107161234567896',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 8. DISBURSEMENT_COMPLETED (SMS, Email, WhatsApp, Push)
      {
        tenantId: 'DEFAULT',
        name: 'Disbursement Success SMS',
        code: 'SMS_DISB_SUCCESS_V1',
        eventCode: 'DISBURSEMENT_COMPLETED',
        channel: 'SMS',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: 'INR {{disbursedAmount}} has been credited to your bank account ending in {{bankAccountLast4}} (Ref: {{utrNumber}}). Loan ID: {{loanId}}. EMI starts on {{firstEmiDate}}.',
        variables: ['disbursedAmount', 'bankAccountLast4', 'utrNumber', 'loanId', 'firstEmiDate'],
        dltTemplateId: 'DLT_1107161234567897',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      {
        tenantId: 'DEFAULT',
        name: 'Disbursement Success WhatsApp',
        code: 'WA_DISB_SUCCESS_V1',
        eventCode: 'DISBURSEMENT_COMPLETED',
        channel: 'WHATSAPP',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: '✅ *Money Transferred!*\n\n₹{{disbursedAmount}} credited to your Bank A/C ending with {{bankAccountLast4}}.\n\n• *UTR*: {{utrNumber}}\n• *Loan ID*: {{loanId}}\n• *First EMI Date*: {{firstEmiDate}}',
        variables: ['disbursedAmount', 'bankAccountLast4', 'utrNumber', 'loanId', 'firstEmiDate'],
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 9. UPCOMING_DUE_REMINDER (SMS, Push, WhatsApp)
      {
        tenantId: 'DEFAULT',
        name: 'EMI Due Reminder SMS',
        code: 'SMS_EMI_DUE_V1',
        eventCode: 'UPCOMING_DUE_REMINDER',
        channel: 'SMS',
        language: 'en-IN',
        category: 'COLLECTION',
        version: 1,
        body: 'Dear {{customerName}}, EMI of INR {{emiAmount}} for Loan {{loanId}} is due on {{dueDate}}. Please maintain sufficient balance in your bank account for auto-debit.',
        variables: ['customerName', 'emiAmount', 'loanId', 'dueDate'],
        dltTemplateId: 'DLT_1107161234567898',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 10. PAYMENT_COMPLETED (SMS & Push & Email)
      {
        tenantId: 'DEFAULT',
        name: 'Payment Receipt SMS',
        code: 'SMS_PAYMENT_RCVD_V1',
        eventCode: 'PAYMENT_COMPLETED',
        channel: 'SMS',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: 'We have received your payment of INR {{amountPaid}} for Loan {{loanId}} (Ref: {{paymentRef}}). Outstanding balance is INR {{remainingPrincipal}}.',
        variables: ['amountPaid', 'loanId', 'paymentRef', 'remainingPrincipal'],
        dltTemplateId: 'DLT_1107161234567899',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 11. PAYMENT_OVERDUE (SMS, WhatsApp, Push)
      {
        tenantId: 'DEFAULT',
        name: 'Payment Overdue Notice SMS',
        code: 'SMS_PAYMENT_OVERDUE_V1',
        eventCode: 'PAYMENT_OVERDUE',
        channel: 'SMS',
        language: 'en-IN',
        category: 'COLLECTION',
        version: 1,
        body: 'Urgent: Your EMI of INR {{overdueAmount}} for Loan {{loanId}} is overdue by {{dpd}} days. Pay immediately to avoid penal charges and credit score impact: {{payLink}}',
        variables: ['overdueAmount', 'loanId', 'dpd', 'payLink'],
        dltTemplateId: 'DLT_1107161234567800',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 12. TICKET_CREATED & TICKET_REPLIED (Email & In-App)
      {
        tenantId: 'DEFAULT',
        name: 'Support Ticket Created Email',
        code: 'EMAIL_TICKET_CREATED_V1',
        eventCode: 'TICKET_CREATED',
        channel: 'EMAIL',
        language: 'en-IN',
        category: 'SUPPORT',
        version: 1,
        subject: 'Support Ticket #{{ticketNumber}}: {{subject}}',
        body: 'Dear {{customerName}},\n\nYour support ticket #{{ticketNumber}} has been logged under {{category}}.\nOur support team will respond within {{slaResponseHours}} hours.\n\nSummary:\n{{description}}',
        variables: ['customerName', 'ticketNumber', 'subject', 'category', 'slaResponseHours', 'description'],
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      {
        tenantId: 'DEFAULT',
        name: 'Support Agent Replied InApp',
        code: 'INAPP_TICKET_REPLIED_V1',
        eventCode: 'TICKET_REPLIED',
        channel: 'IN_APP',
        language: 'en-IN',
        category: 'SUPPORT',
        version: 1,
        subject: 'Reply received for Ticket #{{ticketNumber}}',
        body: 'A support agent has responded to your ticket: "{{agentReplyPreview}}". Click to view full conversation.',
        variables: ['ticketNumber', 'agentReplyPreview'],
        ctaUrl: '/support/tickets',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 13. COMPLAINT_REGISTERED (Email & SMS - Regulatory compliance)
      {
        tenantId: 'DEFAULT',
        name: 'Grievance Complaint Acknowledged SMS',
        code: 'SMS_COMPLAINT_ACK_V1',
        eventCode: 'COMPLAINT_REGISTERED',
        channel: 'SMS',
        language: 'en-IN',
        category: 'REGULATORY',
        version: 1,
        body: 'Your formal grievance Complaint #{{complaintNumber}} has been registered with Grievance Officer {{officerName}}. Resolution target: {{targetDate}} as per RBI guidelines.',
        variables: ['complaintNumber', 'officerName', 'targetDate'],
        dltTemplateId: 'DLT_1107161234567801',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 14. INTERNAL_NOTIFICATION (Staff Alert: UNDERWRITING_STARTED / MANUAL_REVIEW)
      {
        tenantId: 'DEFAULT',
        name: 'Staff Underwriting Task Alert',
        code: 'STAFF_UW_ASSIGNED_V1',
        eventCode: 'UNDERWRITING_STARTED',
        channel: 'INTERNAL_NOTIFICATION',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        subject: 'Underwriting Review Required: App #{{applicationId}}',
        body: 'Application #{{applicationId}} for INR {{amount}} (Applicant: {{applicantName}}) requires manual underwriting review. Assigned Level: {{approvalLevel}}.',
        variables: ['applicationId', 'amount', 'applicantName', 'approvalLevel'],
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
      // 15. Hindi (hi-IN) SMS Welcome
      {
        tenantId: 'DEFAULT',
        name: 'Welcome Message SMS (Hindi)',
        code: 'SMS_WELCOME_HI_V1',
        eventCode: 'WELCOME_MESSAGE',
        channel: 'SMS',
        language: 'hi-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        body: 'अद्यापन में आपका स्वागत है, {{customerName}}! आपका पंजीकरण सफल हुआ। अपनी क्रेडिट सीमा देखने के लिए ऐप डाउनलोड करें।',
        variables: ['customerName'],
        dltTemplateId: 'DLT_1107161234567802',
        dltSenderId: 'ADYAPN',
        status: 'ACTIVE',
        createdBy: 'SYSTEM_SEED',
      },
    ];

    for (const dt of defaultTemplates) {
      const id = `TMPL_${dt.code}`;
      const now = new Date().toISOString();
      this.templates.set(id, {
        ...dt,
        id,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

export const defaultTemplateService = new TemplateService();
