import {
  CommunicationService,
  defaultCommunicationService,
} from '../modules/communications/communication.service';
import {
  SandboxSmsProvider,
  SandboxEmailProvider,
  SandboxWhatsAppProvider,
  SandboxPushProvider,
  SandboxInAppProvider,
  SandboxInternalNotificationProvider,
} from '../modules/communications/sandbox-providers';
import { CommunicationEventCode } from '../modules/communications/communication.types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

async function runPhase13TestSuites() {
  console.log('========================================================================');
  console.log('  ADYAPAN LENDING OS — PHASE 13 AUTOMATED INTEGRATION TEST SUITE');
  console.log('  Centralized Communication, Notifications & Customer Support Engine');
  console.log('========================================================================\n');

  const svc = defaultCommunicationService;
  let passedSuites = 0;
  const totalSuites = 12;

  // -------------------------------------------------------------------------
  // SUITE 1: Sandbox Multi-Channel Providers
  // -------------------------------------------------------------------------
  console.log('▶ [Suite 1/12] Testing Sandbox Multi-Channel Providers...');
  {
    const sms = new SandboxSmsProvider();
    const smsRes = await sms.send({
      tenantId: 'TEST_TENANT',
      recipient: { identifier: '+919876543210', phone: '+919876543210' },
      content: { body: 'Test SMS' },
    });
    assert(smsRes.success === true, 'SMS provider should deliver valid number');
    assert(smsRes.status === 'DELIVERED', 'SMS provider status should be DELIVERED');

    const email = new SandboxEmailProvider();
    const emailRes = await email.send({
      tenantId: 'TEST_TENANT',
      recipient: { identifier: 'borrower@example.com', email: 'borrower@example.com' },
      content: { subject: 'Test Subject', body: 'Test Email Body' },
    });
    assert(emailRes.success === true, 'Email provider should deliver valid email');

    const wa = new SandboxWhatsAppProvider();
    const waRes = await wa.send({
      tenantId: 'TEST_TENANT',
      recipient: { identifier: '+919876543210', phone: '+919876543210' },
      content: { body: 'Test WhatsApp message' },
    });
    assert(waRes.success === true, 'WhatsApp provider should deliver');

    const push = new SandboxPushProvider();
    const pushRes = await push.send({
      tenantId: 'TEST_TENANT',
      recipient: { identifier: 'FCM_DEVICE_TOKEN_84920' },
      content: { body: 'Push Alert' },
    });
    assert(pushRes.success === true, 'Push provider should deliver');

    const inApp = new SandboxInAppProvider();
    const inAppRes = await inApp.send({
      tenantId: 'TEST_TENANT',
      recipient: { identifier: 'CUST-001' },
      content: { body: 'In App Notice' },
    });
    assert(inAppRes.success === true, 'InApp provider should deliver');

    const staffNotif = new SandboxInternalNotificationProvider();
    const staffRes = await staffNotif.send({
      tenantId: 'TEST_TENANT',
      recipient: { identifier: 'STAFF_USER_001' },
      content: { body: 'Internal Task Assigned' },
    });
    assert(staffRes.success === true, 'Internal notification provider should deliver');

    console.log('  ✔ Sandbox providers (SMS, Email, WA, Push, In-App, Staff) functional.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 2: Template Registry, Seeds & Versioning
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 2/12] Testing Template Registry, Seeds & Versioning Immutability...');
  {
    const templates = svc.templates.listTemplates();
    assert(templates.length >= 10, 'Should seed at least 10 core templates');

    const appApproved = svc.templates.findActiveTemplate({
      tenantId: 'DEFAULT',
      eventCode: 'APPLICATION_APPROVED',
      channel: 'WHATSAPP',
    });
    assert(appApproved !== undefined, 'APPLICATION_APPROVED WhatsApp template should be seeded');
    assert(appApproved?.version === 1, 'Initial template version should be 1');

    // Create a new template and update to test immutable version bump
    const custom = svc.templates.createTemplate({
      tenantId: 'TEST_TENANT',
      name: 'Custom KYC Alert',
      code: 'KYC_CUSTOM_V1',
      eventCode: 'KYC_COMPLETED',
      channel: 'SMS',
      body: 'Hi {{customerName}}, your KYC is ready!',
    });
    assert(custom.version === 1, 'New template should start at version 1');

    // Update body of active template -> must bump version to 2
    const updated = svc.templates.updateTemplate(custom.id, {
      body: 'Hi {{customerName}}, your KYC has been verified successfully on {{date}}!',
    });
    assert(updated.version === 2, 'Updating active template body should bump version to 2');
    assert(updated.variables.includes('date'), 'New variable {{date}} should be parsed');

    // Previous version must be ARCHIVED
    const oldVersion = svc.templates.getTemplateById(custom.id);
    assert(oldVersion?.status === 'ARCHIVED', 'Previous version should be archived');

    console.log('  ✔ Template versioning immutability (v1 -> v2) and placeholder extraction passed.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 3: Template Rendering & Variable Validation
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 3/12] Testing Template Rendering & Variable Substitution...');
  {
    const template = svc.templates.createTemplate({
      tenantId: 'TEST_TENANT',
      name: 'Disbursement Notice',
      code: 'DISB_NOTIF_TEST',
      eventCode: 'DISBURSEMENT_COMPLETED',
      channel: 'SMS',
      body: 'Hello {{customerName}}, INR {{amount}} credited to account {{accountNumber}}.',
    });

    const renderedHappy = svc.templates.renderTemplate(template, {
      customerName: 'Rohit Sharma',
      amount: '50,000',
      accountNumber: 'XXXX4829',
    });
    assert(renderedHappy.body.includes('Rohit Sharma'), 'Should substitute customerName');
    assert(renderedHappy.body.includes('INR 50,000'), 'Should substitute amount');
    assert(renderedHappy.missingPlaceholders.length === 0, 'No placeholders should be missing');

    const renderedMissing = svc.templates.renderTemplate(template, {
      customerName: 'Rohit Sharma',
      // Missing amount and accountNumber
    });
    assert(renderedMissing.missingPlaceholders.includes('amount'), 'Should detect missing amount variable');
    assert(renderedMissing.missingPlaceholders.includes('accountNumber'), 'Should detect missing accountNumber variable');

    console.log('  ✔ Template rendering and missing placeholder validation passed.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 4: Customer Preferences & Non-Bypassable Transactional Guards
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 4/12] Testing Customer Preferences & Non-Bypassable Guardrails...');
  {
    const customerId = 'CUST_PREF_TEST_001';
    const tenantId = 'DEFAULT';

    // Set customer preferences with SMS disabled and Marketing disabled
    svc.preferences.updatePreference(tenantId, customerId, {
      channels: { SMS: false, WHATSAPP: true },
      categories: { MARKETING: false },
      optedOutChannels: ['SMS'],
    });

    // 1. Check Marketing message on SMS -> Should be blocked
    const mktCheck = svc.preferences.canSend({
      tenantId,
      customerId,
      channel: 'SMS',
      category: 'MARKETING',
    });
    assert(mktCheck.allowed === false, 'Marketing on opted-out SMS must be disallowed');

    // 2. Check TRANSACTIONAL message on SMS -> MUST BE ALLOWED (Non-Bypassable!)
    const transCheck = svc.preferences.canSend({
      tenantId,
      customerId,
      channel: 'SMS',
      category: 'TRANSACTIONAL',
    });
    assert(transCheck.allowed === true, 'Transactional message on SMS MUST be allowed despite opt-out');

    // 3. Check SECURITY message on SMS -> MUST BE ALLOWED (Non-Bypassable!)
    const secCheck = svc.preferences.canSend({
      tenantId,
      customerId,
      channel: 'SMS',
      category: 'SECURITY',
    });
    assert(secCheck.allowed === true, 'Security alert on SMS MUST be allowed');

    console.log('  ✔ Non-bypassable transactional & security guardrails successfully enforced.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 5: Fair Practice Quiet Hours Engine & Bypass Rules
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 5/12] Testing Fair Practice Quiet Hours & Bypass Evaluation...');
  {
    const pol = svc.policies.getPolicyForEvent('DEFAULT', 'UPCOMING_DUE_REMINDER');
    assert(pol.quietHoursEnabled === true, 'Collection reminder must have quiet hours enabled');

    // Critical disbursement notice bypasses quiet hours
    const bypassDisb = svc.policies.canBypassQuietHours('DISBURSEMENT_COMPLETED', 'TRANSACTIONAL', 'CRITICAL');
    assert(bypassDisb === true, 'Critical disbursement receipt must bypass quiet hours');

    // Security alert bypasses quiet hours
    const bypassSec = svc.policies.canBypassQuietHours('SECURITY_ALERT', 'SECURITY', 'HIGH');
    assert(bypassSec === true, 'Security alert must bypass quiet hours');

    // Marketing reminder does NOT bypass quiet hours
    const bypassMkt = svc.policies.canBypassQuietHours('WELCOME_MESSAGE', 'MARKETING', 'NORMAL');
    assert(bypassMkt === false, 'Marketing message must respect quiet hours');

    console.log('  ✔ Quiet hours engine and critical bypass evaluator verified.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 6: Idempotency & Deduplication Engine
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 6/12] Testing Idempotency & Deduplication Hashing...');
  {
    const key = svc.policies.generateIdempotencyKey({
      tenantId: 'TENANT_A',
      eventCode: 'APPLICATION_APPROVED',
      sourceEntityId: 'APP_91823',
      channel: 'SMS',
      version: 1,
    });
    assert(typeof key === 'string' && key.length === 64, 'Idempotency key should be 64-char SHA256 hex');

    // Check idempotency before recording
    const check1 = svc.policies.checkIdempotency(key, 30);
    assert(check1.isDuplicate === false, 'Fresh key should not be duplicate');

    // Record idempotency
    svc.policies.recordIdempotency(key, 'MSG_12345');

    // Check idempotency after recording
    const check2 = svc.policies.checkIdempotency(key, 30);
    assert(check2.isDuplicate === true, 'Recorded key must be flagged duplicate within window');
    assert(check2.existingMessageId === 'MSG_12345', 'Should reference original message ID');

    console.log('  ✔ SHA256 idempotency deduplication verified.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 7: Transactional Outbox & Delivery Dispatch
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 7/12] Testing Transactional Outbox & PII Sanitization...');
  {
    const rawBody = 'Dear customer, PAN ABCDE1234F verified. Aadhaar 1234 5678 9012 linked. A/C 98765432101234 active.';
    const sanitized = svc.delivery.sanitizePii(rawBody);
    assert(!sanitized.includes('ABCDE1234F'), 'PAN must be masked');
    assert(sanitized.includes('XXXXX1234F'), 'PAN last 4 must be preserved');
    assert(!sanitized.includes('1234 5678 9012'), 'Aadhaar must be masked');

    const msg = await svc.delivery.dispatchMessage({
      tenantId: 'DEFAULT',
      customerId: 'CUST_DISP_001',
      recipientIdentifier: '+919876543210',
      recipientName: 'Vikram Singh',
      channel: 'SMS',
      eventCode: 'WELCOME_MESSAGE',
      body: rawBody,
    });
    assert(msg.status === 'DELIVERED', 'Message should be delivered by sandbox provider');
    assert(msg.body.includes('XXXXX1234F'), 'Outbox body must be PII sanitized');

    console.log('  ✔ Transactional outbox dispatch and PII scrubbing verified.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 8: Domain Event Consuming & Multi-Channel Routing
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 8/12] Testing Business Domain Event Ingestion & Routing...');
  {
    // Trigger DISBURSEMENT_COMPLETED event
    const eventRes = await svc.emitDomainEvent({
      tenantId: 'DEFAULT',
      customerId: 'CUST_EVT_001',
      customerName: 'Ananya Roy',
      customerPhone: '+919876543210',
      customerEmail: 'ananya.roy@example.com',
      eventCode: 'DISBURSEMENT_COMPLETED',
      sourceEntityType: 'LOAN',
      sourceEntityId: 'LOAN_99182',
      data: {
        disbursedAmount: '75,000',
        bankAccountLast4: '5512',
        utrNumber: 'HDFC00918273645',
        loanId: 'LOAN_99182',
        firstEmiDate: '10-Oct-2026',
      },
    });

    assert(eventRes.success === true, 'Domain event processing should succeed');
    assert(eventRes.messages.length > 0, 'Should dispatch messages from event');
    assert(eventRes.messages[0].status === 'DELIVERED', 'Primary channel message should be DELIVERED');

    console.log('  ✔ Domain event processing and multi-channel routing verified.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 9: Borrower In-App Notifications & Internal Staff Tasks
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 9/12] Testing Borrower In-App Notifications & Staff Tasks...');
  {
    const customerId = 'CUST_NOTIF_001';

    // 1. Create borrower notification
    const bNotif = svc.notifications.createBorrowerNotification({
      tenantId: 'DEFAULT',
      customerId,
      title: 'Loan Approved!',
      body: 'Your loan application has been approved for INR 50,000.',
      eventCode: 'APPLICATION_APPROVED',
      actionUrl: '/offers',
    });
    assert(bNotif.isRead === false, 'New notification should be unread');

    const inbox1 = svc.notifications.getBorrowerNotifications('DEFAULT', customerId);
    assert(inbox1.unreadCount === 1, 'Unread count should be 1');

    // 2. Mark read
    svc.notifications.markBorrowerNotificationRead('DEFAULT', customerId, bNotif.id);
    const inbox2 = svc.notifications.getBorrowerNotifications('DEFAULT', customerId);
    assert(inbox2.unreadCount === 0, 'Unread count should be 0 after marking read');

    // 3. Create staff task notification
    const staffNotif = svc.notifications.createStaffNotification({
      tenantId: 'DEFAULT',
      userId: 'USR_CREDIT_001',
      roleTarget: 'CREDIT_ANALYST',
      title: 'Manual Review Required: App #84910',
      body: 'Application requires FOIR deviation check.',
      eventCode: 'UNDERWRITING_STARTED',
      priority: 'HIGH',
    });
    assert(staffNotif.isActioned === false, 'New staff task should not be actioned');

    svc.notifications.markStaffNotificationActioned(staffNotif.id);
    const staffFeed = svc.notifications.getStaffNotifications({ tenantId: 'DEFAULT', userId: 'USR_CREDIT_001' });
    const foundTask = staffFeed.notifications.find((n) => n.id === staffNotif.id);
    assert(foundTask?.isActioned === true, 'Staff task should be marked actioned');

    console.log('  ✔ Borrower notification inbox and staff task feed verified.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 10: Support Ticket Lifecycle & Dual Visibility Conversations
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 10/12] Testing Support Tickets & Dual Visibility Conversations...');
  {
    const { ticket } = svc.tickets.createTicket({
      tenantId: 'DEFAULT',
      customerId: 'CUST_TKT_001',
      customerName: 'Karan Patel',
      customerEmail: 'karan.p@example.com',
      subject: 'EMI Payment Deducted but not updated on portal',
      description: 'I paid via UPI ref #91823948 but portal still shows overdue.',
      category: 'PAYMENT_DISPUTE',
      priority: 'HIGH',
      loanId: 'LOAN_88123',
    });
    assert(ticket.status === 'OPEN', 'New ticket status should be OPEN');
    assert(ticket.ticketNumber.startsWith('TKT-'), 'Ticket number should follow format');

    // Agent adds public reply
    svc.tickets.addMessage({
      ticketId: ticket.id,
      senderType: 'AGENT',
      senderId: 'USR_OPS_002',
      senderName: 'Sanjay Kumar (Ops Agent)',
      messageType: 'CUSTOMER_MESSAGE',
      body: 'Dear Karan, we have received your UPI reference. Checking with razorpay settlement gateway.',
      isInternalOnly: false,
    });

    // Agent adds internal note (Sensitive bank log)
    svc.tickets.addMessage({
      ticketId: ticket.id,
      senderType: 'AGENT',
      senderId: 'USR_OPS_002',
      senderName: 'Sanjay Kumar (Ops Agent)',
      messageType: 'INTERNAL_NOTE',
      body: 'INTERNAL NOTE: PG transaction id RAZ_91823 is currently in gateway reconciliation suspense.',
      isInternalOnly: true,
    });

    // Customer View: Internal notes MUST be stripped
    const customerView = svc.tickets.getTicketWithThread(ticket.id, true);
    assert(customerView !== undefined, 'Customer view should exist');
    const customerInternalNotes = customerView?.messages.filter((m) => m.isInternalOnly || m.messageType === 'INTERNAL_NOTE');
    assert(customerInternalNotes?.length === 0, 'Customer view MUST NOT contain internal notes');

    // Staff View: Complete audit history including internal notes
    const staffView = svc.tickets.getTicketWithThread(ticket.id, false);
    assert(staffView?.messages.length === 3, 'Staff view should show all 3 messages');

    console.log('  ✔ Dual visibility conversations (Customer vs Internal Notes) verified.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 11: SLA Tracking, Due Date Calculation & Auto-Escalation
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 11/12] Testing SLA Due Dates, Response Targets & Escalation...');
  {
    const dueDates = svc.sla.calculateDueDates('DEFAULT', 'PAYMENT_DISPUTE', 'HIGH', new Date());
    assert(dueDates.firstResponseTargetHours === 2, 'High priority dispute should have 2h response SLA');
    assert(dueDates.resolutionTargetHours === 12, 'High priority dispute should have 12h resolution SLA');

    // Create ticket and escalate
    const { ticket } = svc.tickets.createTicket({
      tenantId: 'DEFAULT',
      customerId: 'CUST_TKT_002',
      customerName: 'Deepa Sen',
      subject: 'Critical Foreclosure Delay',
      description: 'NOC pending for 10 days.',
      category: 'FORECLOSURE_REQUEST',
      priority: 'URGENT',
    });

    const escalated = svc.tickets.escalateTicket({
      ticketId: ticket.id,
      reason: 'Exceeded turnaround SLA threshold',
      escalatedBy: 'Supervisor Auto-Engine',
      targetLevel: 2,
    });
    assert(escalated.status === 'ESCALATED', 'Ticket status should be ESCALATED');
    assert(escalated.escalationLevel === 2, 'Escalation level should be 2');

    console.log('  ✔ SLA calculations and multi-tier escalation verified.');
    passedSuites++;
  }

  // -------------------------------------------------------------------------
  // SUITE 12: Grievance Redressal / Regulatory Desk & Telemetry
  // -------------------------------------------------------------------------
  console.log('\n▶ [Suite 12/12] Testing RBI Grievance Redressal Desk & Operations Telemetry...');
  {
    // Register formal grievance complaint
    const complaint = svc.support.registerComplaint({
      tenantId: 'DEFAULT',
      customerId: 'CUST_GRV_001',
      customerName: 'Vikram Mehta',
      customerEmail: 'vikram.m@example.com',
      loanId: 'LOAN_55192',
      complaintType: 'Wrongful Late Fee Assessment',
      rootCauseCategory: 'INTEREST_CALCULATION_DISCREPANCY',
      details: 'Late fees were levied despite payment completed on 4th before due date.',
      demandedRemedy: 'Waiver of INR 750 penal charge.',
      registeredBy: 'Grievance Officer',
    });
    assert(complaint.complaintNumber.startsWith('GRV-'), 'Complaint number should start with GRV-');
    assert(complaint.status === 'INVESTIGATING', 'Initial complaint status should be INVESTIGATING');

    // Resolve complaint with concession
    const resolvedComplaint = svc.support.resolveComplaint({
      complaintId: complaint.id,
      status: 'SETTLED_WITH_CONCESSION',
      resolutionDetails: 'Penal charge of INR 750 refunded to customer loan ledger.',
      resolutionDecision: 'SETTLED',
      compensationAmount: 750,
      resolvedBy: 'Principal Nodal Officer',
    });
    assert(resolvedComplaint.status === 'SETTLED_WITH_CONCESSION', 'Complaint should be settled with concession');
    assert(resolvedComplaint.compensationAmount === 750, 'Compensation amount should be 750');

    // Overview Telemetry Dashboard
    const overview = svc.getDashboardOverview('DEFAULT');
    assert(overview.communications.totalMessagesSent >= 0, 'Communications total messages should be computed');
    assert(overview.support.totalTickets >= 0, 'Support total tickets should be computed');
    assert(typeof overview.support.csatScore === 'number', 'CSAT score should be a number');

    console.log('  ✔ Grievance redressal register and dashboard telemetry verified.');
    passedSuites++;
  }

  console.log('\n========================================================================');
  console.log(`  PHASE 13 TEST SUMMARY: ${passedSuites}/${totalSuites} TEST SUITES PASSED (100%)`);
  console.log('  Centralized Communication, Notifications & Customer Support Engine Ready!');
  console.log('========================================================================\n');
}

runPhase13TestSuites().catch((err) => {
  console.error('❌ Phase 13 Integration Test Failed:', err);
  process.exit(1);
});
