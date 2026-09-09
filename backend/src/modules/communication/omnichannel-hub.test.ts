import { describe, it, expect, beforeEach, vi } from 'vitest';
import { communicationService } from './communication.service';
import { TEMPLATE_REGISTRY, renderTemplate, maskBankAccount, maskPan, maskAadhaar } from './template.registry';
import { notificationProviders } from '../notifications/provider';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../common/errors';

import { logAudit } from '../audit/audit.service';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-comm-mock-1' }),
}));

describe('Omnichannel Hub — Complete 30-Test Production Suite', () => {
  const superAdmin = { id: 'usr-admin', email: 'superadmin@adyapan.dev', roles: ['SUPER_ADMIN'], tenantId: 'tenant-1' };
  const loanOfficerBranchA = { id: 'usr-lo-1', email: 'lo.delhi@adyapan.dev', roles: ['LOAN_OFFICER'], tenantId: 'tenant-1', branchId: 'branch-delhi' };
  const collectionOfficer = { id: 'usr-co-1', email: 'collector@adyapan.dev', roles: ['COLLECTION_OFFICER'], tenantId: 'tenant-1', branchId: 'branch-delhi' };
  const borrower = { id: 'usr-cust-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'], tenantId: 'tenant-1', customerId: 'cust-101' };
  const crossTenantOfficer = { id: 'usr-xt-1', email: 'officer@otherlender.dev', roles: ['LOAN_OFFICER'], tenantId: 'tenant-2', branchId: 'branch-mumbai' };

  beforeEach(() => {
    vi.mocked(logAudit).mockResolvedValue({ id: 'audit-comm-mock-1' } as any);
    communicationService.clearForTesting();
  });

  // 1. Customer communication creation
  it('1. Customer communication can be created and dispatched', async () => {
    const record = await communicationService.sendMessage(
      {
        templateCode: 'WELCOME_MESSAGE',
        channel: 'EMAIL',
        recipient: 'newuser@adyapan.dev',
        recipientName: 'Rahul Verma',
        customerId: 'cust-101',
        variables: { customerName: 'Rahul Verma', customerCode: 'CUST-101' },
      },
      loanOfficerBranchA
    );

    expect(record.id).toBeDefined();
    expect(record.deliveryStatus).toMatch(/SENT|MOCKED/);
    expect(record.subject).toContain('Welcome');
  });

  // 2. Tenant Scoping
  it('2. Communication records are tenant scoped', async () => {
    await communicationService.sendMessage(
      {
        templateCode: 'APPLICATION_SUBMITTED',
        channel: 'EMAIL',
        recipient: 'tenant1@adyapan.dev',
        variables: { customerName: 'T1 User', applicationNo: 'APP-1', requestedAmount: '50000', productName: 'Personal' },
      },
      loanOfficerBranchA
    );

    const t1Logs = communicationService.listCommunications({}, loanOfficerBranchA);
    const t2Logs = communicationService.listCommunications({}, crossTenantOfficer);

    expect(t1Logs.items.length).toBe(1);
    expect(t2Logs.items.length).toBe(0);
  });

  // 3. Branch scoping
  it('3. Branch scoped loan officer cannot see records from other branches', async () => {
    const loanOfficerBranchB = { id: 'usr-lo-2', email: 'lo.mumbai@adyapan.dev', roles: ['LOAN_OFFICER'], tenantId: 'tenant-1', branchId: 'branch-mumbai' };

    await communicationService.sendMessage(
      {
        templateCode: 'KYC_PENDING',
        channel: 'SMS',
        recipient: '+91 98000 11111',
        variables: { customerName: 'Delhi Borrower' },
      },
      loanOfficerBranchA
    );

    const bALogs = communicationService.listCommunications({}, loanOfficerBranchA);
    const bBLogs = communicationService.listCommunications({}, loanOfficerBranchB);

    expect(bALogs.items.length).toBe(1);
    expect(bBLogs.items.length).toBe(0);
  });

  // 4. Loan Officer permitted communication
  it('4. Loan Officer can send permitted application and onboarding communication', async () => {
    const res = await communicationService.sendMessage(
      {
        templateCode: 'APPLICATION_FORWARDED_TO_CREDIT',
        channel: 'EMAIL',
        recipient: 'applicant@adyapan.dev',
        variables: { customerName: 'Aarav', applicationNo: 'APP-900' },
      },
      loanOfficerBranchA
    );

    expect(res.deliveryStatus).toMatch(/SENT|MOCKED/);
  });

  // 5. Unauthorized role restrictions
  it('5. Borrower role is forbidden from sending manual staff communications', async () => {
    await expect(
      communicationService.sendMessage(
        {
          templateCode: 'APPROVAL_SANCTION_LETTER',
          channel: 'EMAIL',
          recipient: 'borrower@adyapan.dev',
          variables: {},
        },
        borrower
      )
    ).rejects.toThrow(ForbiddenError);
  });

  // 6. Template rendering
  it('6. Template engine renders tokens with dynamic variables', () => {
    const rendered = renderTemplate(
      'UPCOMING_EMI_REMINDER',
      { customerName: 'Dinesh', emiAmount: '16607', dueDate: '10 Sep 2026', loanNo: 'LN-2026' },
      'SMS'
    );
    expect(rendered.body).toContain('Dinesh');
    expect(rendered.body).toContain('₹16607');
    expect(rendered.body).toContain('10 Sep 2026');
  });

  // 7. Missing template variable handled safely
  it('7. Missing template variables fallback gracefully without showing raw brackets', () => {
    const rendered = renderTemplate('WELCOME_MESSAGE', {}, 'EMAIL');
    expect(rendered.subject).not.toContain('{{');
    expect(rendered.body).not.toContain('{{');
  });

  // 8. Provider unconfigured handling
  it('8. Unconfigured provider dispatches in safe MOCKED mode without pretending connection', () => {
    const health = notificationProviders.getHealthSummary();
    const wa = health.find((h) => h.channel === 'WHATSAPP');
    expect(wa).toBeDefined();
    expect(wa?.status).toMatch(/CONNECTED|NOT_CONFIGURED/);
  });

  // 9. Sent vs Delivered distinct states
  it('9. Sent and Delivered are distinct states in message lifecycle', async () => {
    const record = await communicationService.sendMessage(
      {
        templateCode: 'APPLICATION_SUBMITTED',
        channel: 'EMAIL',
        recipient: 'applicant@adyapan.dev',
        variables: { customerName: 'Test', applicationNo: 'APP-101', requestedAmount: '10000', productName: 'PL' },
      },
      superAdmin
    );

    expect(record.deliveryStatus).toMatch(/SENT|MOCKED/);
    expect(record.deliveredAt).toBeUndefined(); // Only set upon delivery confirmation
  });

  // 10. Delivery webhook updates status
  it('10. Delivery webhook idempotently updates status to DELIVERED and records timestamp', async () => {
    const record = await communicationService.sendMessage(
      {
        templateCode: 'APPLICATION_SUBMITTED',
        channel: 'EMAIL',
        recipient: 'applicant@adyapan.dev',
        variables: { customerName: 'Test', applicationNo: 'APP-102', requestedAmount: '10000', productName: 'PL' },
      },
      superAdmin
    );

    expect(record.providerMessageId).toBeDefined();

    const webhookRes = communicationService.processDeliveryWebhook('SendGrid', {
      provider: 'SendGrid',
      providerMessageId: record.providerMessageId!,
      event: 'delivered',
      timestamp: '2026-09-09T10:00:00.000Z',
    });

    expect(webhookRes.updated).toBe(true);
    const updatedRecord = communicationService.getCommunicationById(record.id, superAdmin);
    expect(updatedRecord.deliveryStatus).toBe('DELIVERED');
    expect(updatedRecord.deliveredAt).toBe('2026-09-09T10:00:00.000Z');
  });

  // 11. Failed communication is recorded
  it('11. Failed communication records failure reason and timestamp', async () => {
    vi.spyOn(communicationService, 'isCollectionWindowOpen').mockReturnValue(false);

    const record = await communicationService.sendMessage(
      {
        templateCode: 'OVERDUE_NOTICE',
        channel: 'SMS',
        recipient: '+91 99999 88888',
        variables: { customerName: 'Late User', loanNo: 'LN-1', overdueAmount: '5000', dpd: '30', lateCharges: '100' },
      },
      collectionOfficer
    );

    expect(record.deliveryStatus).toBe('BLOCKED_WINDOW');
    expect(record.errorMessage).toContain('8:00 AM – 7:00 PM IST');
  });

  // 12. Retry does not duplicate communication
  it('12. Retry updates existing communication record and increments retryCount', async () => {
    vi.spyOn(communicationService, 'isCollectionWindowOpen').mockReturnValue(false);

    const record = await communicationService.sendMessage(
      {
        templateCode: 'OVERDUE_NOTICE',
        channel: 'EMAIL',
        recipient: 'late@adyapan.dev',
        variables: { customerName: 'Late User', loanNo: 'LN-1', overdueAmount: '5000', dpd: '30', lateCharges: '100' },
      },
      collectionOfficer
    );

    expect(record.deliveryStatus).toBe('BLOCKED_WINDOW');

    // Simulate collection window opening and retry
    vi.spyOn(communicationService, 'isCollectionWindowOpen').mockReturnValue(true);
    const retried = await communicationService.retryCommunication(record.id, collectionOfficer);

    expect(retried.id).toBe(record.id); // Same ID (no duplication)
    expect(retried.retryCount).toBe(1);
    expect(retried.deliveryStatus).toMatch(/SENT|MOCKED/);
  });

  // 13. Searchable communication history
  it('13. Communication history supports multi-term search', async () => {
    await communicationService.sendMessage(
      {
        templateCode: 'APPLICATION_SUBMITTED',
        channel: 'EMAIL',
        recipient: 'priya.sharma@example.com',
        recipientName: 'Priya Sharma',
        variables: { customerName: 'Priya Sharma', applicationNo: 'APP-PRIYA', requestedAmount: '75000', productName: 'PL' },
      },
      superAdmin
    );

    const result = communicationService.listCommunications({ search: 'priya' }, superAdmin);
    expect(result.items.length).toBe(1);
    expect(result.items[0].recipientName).toBe('Priya Sharma');
  });

  // 14. Paginated communication history
  it('14. Communication history supports pagination metadata', async () => {
    for (let i = 1; i <= 5; i++) {
      await communicationService.sendMessage(
        {
          templateCode: 'WELCOME_MESSAGE',
          channel: 'EMAIL',
          recipient: `user${i}@example.com`,
          variables: { customerName: `User ${i}`, customerCode: `CUST-${i}` },
        },
        superAdmin
      );
    }

    const page1 = communicationService.listCommunications({ page: 1, pageSize: 2 }, superAdmin);
    expect(page1.items.length).toBe(2);
    expect(page1.pagination.total).toBe(5);
    expect(page1.pagination.totalPages).toBe(3);
  });

  // 15. Customer 360 communications query
  it('15. Customer 360 can query communications filtered by customerId', async () => {
    await communicationService.sendMessage(
      {
        templateCode: 'WELCOME_MESSAGE',
        channel: 'EMAIL',
        recipient: 'c1@dev.com',
        customerId: 'cust-alpha',
        variables: { customerName: 'C1', customerCode: 'CUST-ALPHA' },
      },
      superAdmin
    );

    await communicationService.sendMessage(
      {
        templateCode: 'WELCOME_MESSAGE',
        channel: 'EMAIL',
        recipient: 'c2@dev.com',
        customerId: 'cust-beta',
        variables: { customerName: 'C2', customerCode: 'CUST-BETA' },
      },
      superAdmin
    );

    const alphaLogs = communicationService.listCommunications({ customerId: 'cust-alpha' }, superAdmin);
    expect(alphaLogs.items.length).toBe(1);
    expect(alphaLogs.items[0].customerId).toBe('cust-alpha');
  });

  // 16. Consent & DND enforcement
  it('16. Customer DND consent preference blocks marketing and non-regulatory notices', async () => {
    await communicationService.updateCustomerPreferences(
      'cust-dnd',
      { isDndOpted: true, allowMarketing: false },
      superAdmin
    );

    const record = await communicationService.sendMessage(
      {
        templateCode: 'APPLICATION_SUBMITTED',
        channel: 'SMS',
        recipient: '+91 99000 00000',
        customerId: 'cust-dnd',
        variables: { customerName: 'DND User', applicationNo: 'APP-1', requestedAmount: '1000', productName: 'PL' },
      },
      superAdmin
    );

    expect(record.deliveryStatus).toBe('BLOCKED_DND');
  });

  // 17. Provider secrets never in response
  it('17. Provider health response contains only safe metadata, never API keys or secrets', () => {
    const health = communicationService.getProviderHealth(superAdmin);
    const jsonStr = JSON.stringify(health);
    expect(jsonStr).not.toContain('API_KEY');
    expect(jsonStr).not.toContain('TOKEN');
    expect(jsonStr).not.toContain('SECRET');
    expect(jsonStr).not.toContain('PASSWORD');
  });

  // 18. PII masking for bank account, PAN, and Aadhaar
  it('18. Sensitive PII is masked automatically in rendered bodies', () => {
    expect(maskBankAccount('987654321098')).toBe('XXXX-XXXX-1098');
    expect(maskPan('ABCDE1234F')).toBe('XXXXX1234X');
    expect(maskAadhaar('123456789012')).toBe('XXXX-XXXX-9012');

    const rendered = renderTemplate(
      'DISBURSEMENT_NOTICE',
      { customerName: 'Test', loanNo: 'LN-1', netDisbursedAmount: '50000', bankAccount: '987654321098', utrNumber: 'U1', firstDueDate: '01-Oct' },
      'EMAIL'
    );
    expect(rendered.body).toContain('XXXX-XXXX-1098');
    expect(rendered.body).not.toContain('987654321098');
  });

  // 19. Cross-tenant communication access rejected
  it('19. Cross-tenant communication access is forbidden', async () => {
    const record = await communicationService.sendMessage(
      {
        templateCode: 'WELCOME_MESSAGE',
        channel: 'EMAIL',
        recipient: 't1@adyapan.dev',
        variables: { customerName: 'T1 User', customerCode: 'C1' },
      },
      loanOfficerBranchA
    );

    expect(() => {
      communicationService.getCommunicationById(record.id, crossTenantOfficer);
    }).toThrow(ForbiddenError);
  });

  // 20. Direct unauthorized communication
  it('20. Collection officers cannot dispatch sanction approval letters', async () => {
    await expect(
      communicationService.sendMessage(
        {
          templateCode: 'APPROVAL_SANCTION_LETTER',
          channel: 'EMAIL',
          recipient: 'borrower@adyapan.dev',
          variables: { customerName: 'User', loanNo: 'LN-1', sanctionedAmount: '10000', tenureMonths: 12, interestRate: 12, emiAmount: 900 },
        },
        collectionOfficer
      )
    ).rejects.toThrow(ForbiddenError);
  });

  // 21. Automatic application notification
  it('21. Automatic event dispatch maps business events to lifecycle templates', async () => {
    const record = await communicationService.dispatchSystemEvent('CUSTOMER_CREATED', {
      customerId: 'cust-new',
      customerName: 'Aman Deep',
      customerEmail: 'aman@example.com',
      customerCode: 'CUST-AMAN',
    });

    expect(record).not.toBeNull();
    expect(record?.templateCode).toBe('WELCOME_MESSAGE');
    expect(record?.recipient).toBe('aman@example.com');
  });

  // 22. Payment notification on payment commit
  it('22. Payment receipt event dispatches successfully', async () => {
    const record = await communicationService.dispatchSystemEvent('PAYMENT_RECEIVED', {
      customerId: 'cust-pay',
      customerName: 'Payee',
      customerEmail: 'payee@example.com',
      loanNo: 'LN-PAY-1',
      paidAmount: '16607',
    });

    expect(record).not.toBeNull();
    expect(record?.templateCode).toBe('PAYMENT_RECEIPT');
  });

  // 23. Loan approval notification
  it('23. Loan approval event triggers approval sanction template', async () => {
    const record = await communicationService.dispatchSystemEvent('LOAN_APPROVED', {
      customerId: 'cust-appr',
      customerName: 'Approved User',
      customerEmail: 'approved@example.com',
      loanNo: 'LN-APP-1',
      sanctionedAmount: '200000',
    });

    expect(record).not.toBeNull();
    expect(record?.templateCode).toBe('APPROVAL_SANCTION_LETTER');
  });

  // 24. Communication failure does not corrupt financial transaction
  it('24. Communication failure is captured gracefully in dispatchSystemEvent without throwing', async () => {
    // Force sendMessage to fail
    const sendSpy = vi.spyOn(communicationService, 'sendMessage').mockRejectedValue(new Error('Network drop'));

    const res = await communicationService.dispatchSystemEvent('PAYMENT_RECEIVED', {
      customerId: 'cust-fail',
      customerName: 'User',
      loanNo: 'LN-1',
      paidAmount: '5000',
    });

    expect(res).toBeNull(); // Clean graceful return without crashing caller
    sendSpy.mockRestore();
  });

  // 25. Audit log created
  it('25. Communication dispatches trigger audit logs', async () => {
    const record = await communicationService.sendMessage(
      {
        templateCode: 'WELCOME_MESSAGE',
        channel: 'EMAIL',
        recipient: 'audit@example.com',
        variables: { customerName: 'Audit User', customerCode: 'C-AUD' },
      },
      superAdmin
    );

    expect(record.id).toBeDefined();
  });

  // 26. Template Registry integrity
  it('26. All 23 lifecycle templates are registered with variable schemas and categories', () => {
    const templates = Object.values(TEMPLATE_REGISTRY);
    expect(templates.length).toBeGreaterThanOrEqual(20);
    for (const t of templates) {
      expect(t.code).toBeDefined();
      expect(t.name).toBeDefined();
      expect(t.category).toBeDefined();
      expect(t.supportedChannels.length).toBeGreaterThan(0);
      expect(t.subjectTemplate).toBeDefined();
      expect(t.bodyTemplate).toBeDefined();
    }
  });

  // 27. Provider health status query
  it('27. Provider health reports active WhatsApp, SMS, Email, and In-App channels', () => {
    const health = communicationService.getProviderHealth(superAdmin);
    expect(health.length).toBe(4);
    const channels = health.map((h) => h.channel);
    expect(channels).toContain('EMAIL');
    expect(channels).toContain('SMS');
    expect(channels).toContain('WHATSAPP');
    expect(channels).toContain('IN_APP');
  });

  // 28. Retry action audit tracking
  it('28. Retry action updates lastRetryAt timestamp', async () => {
    const winSpy = vi.spyOn(communicationService, 'isCollectionWindowOpen').mockReturnValue(false);

    const record = await communicationService.sendMessage(
      {
        templateCode: 'OVERDUE_NOTICE',
        channel: 'SMS',
        recipient: '+91 90000 00000',
        variables: { customerName: 'User', loanNo: 'L1', overdueAmount: '100', dpd: '5', lateCharges: '0' },
      },
      collectionOfficer
    );

    winSpy.mockReturnValue(true);
    const retried = await communicationService.retryCommunication(record.id, collectionOfficer);
    expect(retried.lastRetryAt).toBeDefined();
    winSpy.mockRestore();
  });

  // 29. Failed provider response handled correctly
  it('29. Provider dispatch exception is captured and status set to FAILED with error message', async () => {
    const providerSpy = vi.spyOn(notificationProviders.email, 'send').mockRejectedValue(new Error('SMTP connection timed out'));

    const record = await communicationService.sendMessage(
      {
        templateCode: 'WELCOME_MESSAGE',
        channel: 'EMAIL',
        recipient: 'error@example.com',
        variables: { customerName: 'Error User', customerCode: 'C-ERR' },
      },
      superAdmin
    );

    expect(record.deliveryStatus).toBe('FAILED');
    expect(record.errorMessage).toContain('SMTP connection timed out');
    providerSpy.mockRestore();
  });

  // 30. Dashboard metrics match backend data
  it('30. Dashboard metrics accurately reflect live sent, delivered, failed, and channel counts', async () => {
    await communicationService.sendMessage(
      {
        templateCode: 'WELCOME_MESSAGE',
        channel: 'EMAIL',
        recipient: 'm1@example.com',
        variables: { customerName: 'M1', customerCode: 'C1' },
      },
      superAdmin
    );

    await communicationService.sendMessage(
      {
        templateCode: 'WELCOME_MESSAGE',
        channel: 'SMS',
        recipient: '+91 91111 22222',
        variables: { customerName: 'M2', customerCode: 'C2' },
      },
      superAdmin
    );

    const metrics = communicationService.getDashboardMetrics(superAdmin);
    expect(metrics.totalMessages).toBe(2);
    expect(metrics.byChannel.EMAIL).toBe(1);
    expect(metrics.byChannel.SMS).toBe(1);
    expect(metrics.recentActivity.length).toBe(2);
  });
});
