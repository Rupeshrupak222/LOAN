import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ok, created } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { requirePermission } from '../../middleware/rbac-permission';
import { defaultCommunicationService, CommunicationService } from './communication.service';
import {
  CommunicationChannel,
  CommunicationEventCode,
  LanguageCode,
  MessageCategory,
  SupportCategory,
  SupportPriority,
  TemplateStatus,
  TicketStatus,
} from './communication.types';

const router = Router();

// Apply auth & tenant context to all routes
router.use(authenticate);
router.use(tenantContext);

const commService: CommunicationService = defaultCommunicationService;

// ===========================================================================
// 1. Communications & Operations Dashboard
// ===========================================================================

router.get(
  '/dashboard',
  requirePermission('COMMUNICATIONS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const overview = commService.getDashboardOverview(tenantId);
    return ok(res, overview);
  })
);

// ===========================================================================
// 2. Template Studio
// ===========================================================================

router.get(
  '/templates',
  requirePermission('COMMUNICATIONS_TEMPLATE_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const channel = req.query.channel as CommunicationChannel;
    const eventCode = req.query.eventCode as CommunicationEventCode;
    const status = req.query.status as TemplateStatus;
    const language = req.query.language as LanguageCode;

    const list = commService.templates.listTemplates({
      tenantId,
      channel,
      eventCode,
      status,
      language,
    });
    return ok(res, list);
  })
);

router.get(
  '/templates/:id',
  requirePermission('COMMUNICATIONS_TEMPLATE_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const template = commService.templates.getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    return ok(res, template);
  })
);

router.post(
  '/templates',
  requirePermission('COMMUNICATIONS_TEMPLATE_CREATE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const template = commService.templates.createTemplate({
      ...req.body,
      tenantId,
      createdBy: req.user?.id || req.user?.email || 'STAFF',
    });
    return created(res, template);
  })
);

router.put(
  '/templates/:id',
  requirePermission('COMMUNICATIONS_TEMPLATE_EDIT'),
  asyncHandler(async (req: Request, res: Response) => {
    const updated = commService.templates.updateTemplate(req.params.id, {
      ...req.body,
      updatedBy: req.user?.id || req.user?.email || 'STAFF',
    });
    return ok(res, updated);
  })
);

router.post(
  '/templates/preview',
  requirePermission('COMMUNICATIONS_TEMPLATE_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const { templateId, data, rawBody, rawSubject } = req.body;
    let template = templateId ? commService.templates.getTemplateById(templateId) : undefined;

    if (!template && rawBody) {
      template = {
        id: 'PREVIEW_TEMP',
        tenantId: 'DEFAULT',
        name: 'Preview Template',
        code: 'PREVIEW',
        eventCode: 'WELCOME_MESSAGE',
        channel: 'SMS',
        language: 'en-IN',
        category: 'TRANSACTIONAL',
        version: 1,
        subject: rawSubject,
        body: rawBody,
        variables: commService.templates.extractPlaceholders(rawBody + ' ' + (rawSubject || '')),
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!template) {
      return res.status(400).json({ success: false, message: 'Template or raw content required' });
    }

    const rendered = commService.templates.renderTemplate(template, data || {});
    return ok(res, rendered);
  })
);

// ===========================================================================
// 3. Message Delivery Outbox & Dispatches
// ===========================================================================

router.get(
  '/messages',
  requirePermission('COMMUNICATIONS_DELIVERY_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const customerId = req.query.customerId as string;
    const channel = req.query.channel as CommunicationChannel;
    const status = req.query.status as any;
    const eventCode = req.query.eventCode as CommunicationEventCode;

    const list = commService.delivery.listMessages({
      tenantId,
      customerId,
      channel,
      status,
      eventCode,
    });
    return ok(res, list);
  })
);

router.get(
  '/messages/:id',
  requirePermission('COMMUNICATIONS_DELIVERY_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const message = commService.delivery.getMessageById(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    return ok(res, message);
  })
);

router.post(
  '/messages/:id/retry',
  requirePermission('COMMUNICATIONS_SEND'),
  asyncHandler(async (req: Request, res: Response) => {
    const retried = await commService.delivery.retryMessage(req.params.id);
    return ok(res, retried);
  })
);

router.post(
  '/dispatch',
  requirePermission('COMMUNICATIONS_SEND'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const message = await commService.delivery.dispatchMessage({
      ...req.body,
      tenantId,
    });
    return created(res, message);
  })
);

router.post(
  '/events/trigger',
  requirePermission('COMMUNICATIONS_SEND'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const result = await commService.emitDomainEvent({
      ...req.body,
      tenantId,
    });
    return ok(res, result);
  })
);

// ===========================================================================
// 4. Communication Policies
// ===========================================================================

router.get(
  '/policies',
  requirePermission('COMMUNICATIONS_POLICY_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const list = commService.policies.listPolicies(tenantId);
    return ok(res, list);
  })
);

router.post(
  '/policies',
  requirePermission('COMMUNICATIONS_POLICY_CREATE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const policy = commService.policies.savePolicy({
      ...req.body,
      tenantId,
    });
    return ok(res, policy);
  })
);

// ===========================================================================
// 5. Customer Preferences
// ===========================================================================

router.get(
  '/preferences/:customerId',
  requirePermission('COMMUNICATIONS_PREFERENCE_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const pref = commService.preferences.getOrCreatePreference(tenantId, req.params.customerId);
    return ok(res, pref);
  })
);

router.put(
  '/preferences/:customerId',
  requirePermission('COMMUNICATIONS_PREFERENCE_MANAGE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const updated = commService.preferences.updatePreference(tenantId, req.params.customerId, req.body);
    return ok(res, updated);
  })
);

router.get(
  '/preferences',
  requirePermission('COMMUNICATIONS_PREFERENCE_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const list = commService.preferences.listPreferences(tenantId);
    return ok(res, list);
  })
);

// ===========================================================================
// 6. Notifications (Borrower Center & Staff Feed)
// ===========================================================================

router.get(
  '/notifications/borrower/:customerId',
  requirePermission('COMMUNICATIONS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const isRead = req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    const inbox = commService.notifications.getBorrowerNotifications(tenantId, req.params.customerId, {
      isRead,
      limit,
    });
    return ok(res, inbox);
  })
);

router.post(
  '/notifications/borrower/:customerId/read/:notificationId',
  requirePermission('COMMUNICATIONS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const read = commService.notifications.markBorrowerNotificationRead(
      tenantId,
      req.params.customerId,
      req.params.notificationId
    );
    if (!read) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return ok(res, read);
  })
);

router.post(
  '/notifications/borrower/:customerId/read-all',
  requirePermission('COMMUNICATIONS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const count = commService.notifications.markAllBorrowerNotificationsRead(tenantId, req.params.customerId);
    return ok(res, { markedReadCount: count });
  })
);

router.get(
  '/notifications/staff',
  requirePermission('COMMUNICATIONS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const userId = req.user?.id;
    const userRole = (req.user as any)?.role;
    const isActioned = req.query.isActioned !== undefined ? req.query.isActioned === 'true' : undefined;

    const feed = commService.notifications.getStaffNotifications({
      tenantId,
      userId,
      userRole,
      isActioned,
    });
    return ok(res, feed);
  })
);

router.post(
  '/notifications/staff/:id/read',
  requirePermission('COMMUNICATIONS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const notif = commService.notifications.markStaffNotificationRead(req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return ok(res, notif);
  })
);

router.post(
  '/notifications/staff/:id/action',
  requirePermission('COMMUNICATIONS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const notif = commService.notifications.markStaffNotificationActioned(req.params.id);
    if (!notif) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return ok(res, notif);
  })
);

// ===========================================================================
// 7. Support Tickets & Conversations
// ===========================================================================

router.get(
  '/support/tickets',
  requirePermission('SUPPORT_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const customerId = req.query.customerId as string;
    const status = req.query.status as TicketStatus;
    const priority = req.query.priority as SupportPriority;
    const category = req.query.category as SupportCategory;
    const assignedAgentId = req.query.assignedAgentId as string;
    const isBreached = req.query.isBreached !== undefined ? req.query.isBreached === 'true' : undefined;

    const list = commService.tickets.listTickets({
      tenantId,
      customerId,
      status,
      priority,
      category,
      assignedAgentId,
      isBreached,
    });
    return ok(res, list);
  })
);

router.get(
  '/support/tickets/:id',
  requirePermission('SUPPORT_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const isCustomerView = req.query.customerView === 'true';
    const detail = commService.tickets.getTicketWithThread(req.params.id, isCustomerView);
    if (!detail) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    return ok(res, detail);
  })
);

router.post(
  '/support/tickets',
  requirePermission('SUPPORT_TICKET_CREATE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const createdTicket = commService.tickets.createTicket({
      ...req.body,
      tenantId,
      createdBy: req.user?.id || 'PORTAL_USER',
    });
    return created(res, createdTicket);
  })
);

router.post(
  '/support/tickets/:id/messages',
  requirePermission('SUPPORT_TICKET_REPLY'),
  asyncHandler(async (req: Request, res: Response) => {
    const senderType = req.body.senderType || 'AGENT';
    const senderId = req.user?.id || req.body.senderId || 'AGENT_DEFAULT';
    const senderName = req.user?.email || req.body.senderName || 'Support Representative';

    const result = commService.tickets.addMessage({
      ticketId: req.params.id,
      senderType,
      senderId,
      senderName,
      messageType: req.body.messageType || 'CUSTOMER_MESSAGE',
      body: req.body.body,
      isInternalOnly: req.body.isInternalOnly,
      attachments: req.body.attachments,
    });
    return ok(res, result);
  })
);

router.post(
  '/support/tickets/:id/assign',
  requirePermission('SUPPORT_TICKET_ASSIGN'),
  asyncHandler(async (req: Request, res: Response) => {
    const updated = commService.tickets.assignTicket({
      ticketId: req.params.id,
      agentId: req.body.agentId,
      agentName: req.body.agentName,
      team: req.body.team,
      assignedBy: req.user?.email || req.user?.id || 'MANAGER',
    });
    return ok(res, updated);
  })
);

router.post(
  '/support/tickets/:id/escalate',
  requirePermission('SUPPORT_TICKET_ESCALATE'),
  asyncHandler(async (req: Request, res: Response) => {
    const escalated = commService.tickets.escalateTicket({
      ticketId: req.params.id,
      reason: req.body.reason || 'Escalated by supervisor',
      escalatedBy: req.user?.email || req.user?.id || 'SUPERVISOR',
      targetLevel: req.body.targetLevel,
    });
    return ok(res, escalated);
  })
);

router.post(
  '/support/tickets/:id/status',
  requirePermission('SUPPORT_TICKET_RESOLVE'),
  asyncHandler(async (req: Request, res: Response) => {
    const updated = commService.tickets.updateStatus({
      ticketId: req.params.id,
      status: req.body.status,
      resolutionNote: req.body.resolutionNote,
      updatedBy: req.user?.email || req.user?.id || 'AGENT',
      csatScore: req.body.csatScore,
      csatFeedback: req.body.csatFeedback,
    });
    return ok(res, updated);
  })
);

// ===========================================================================
// 8. Complaints & Grievance Redressal Desk
// ===========================================================================

router.get(
  '/support/complaints',
  requirePermission('SUPPORT_COMPLAINT_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const customerId = req.query.customerId as string;
    const status = req.query.status as string;

    const list = commService.support.listComplaints({ tenantId, customerId, status });
    return ok(res, list);
  })
);

router.get(
  '/support/complaints/:id',
  requirePermission('SUPPORT_COMPLAINT_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const complaint = commService.support.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    return ok(res, complaint);
  })
);

router.post(
  '/support/complaints',
  requirePermission('SUPPORT_COMPLAINT_MANAGE'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const complaint = commService.support.registerComplaint({
      ...req.body,
      tenantId,
      registeredBy: req.user?.email || req.user?.id || 'GRIEVANCE_OFFICER',
    });
    return created(res, complaint);
  })
);

router.post(
  '/support/complaints/:id/resolve',
  requirePermission('SUPPORT_COMPLAINT_MANAGE'),
  asyncHandler(async (req: Request, res: Response) => {
    const resolved = commService.support.resolveComplaint({
      complaintId: req.params.id,
      status: req.body.status || 'RESOLVED_SATISFIED',
      resolutionDetails: req.body.resolutionDetails,
      resolutionDecision: req.body.resolutionDecision || 'UPHELD',
      compensationAmount: req.body.compensationAmount,
      resolvedBy: req.user?.email || req.user?.id || 'GRIEVANCE_OFFICER',
    });
    return ok(res, resolved);
  })
);

// ===========================================================================
// 9. SLAs & Analytics
// ===========================================================================

router.get(
  '/support/slas',
  requirePermission('SUPPORT_REPORTS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const list = commService.sla.listSlaConfigs(tenantId);
    return ok(res, list);
  })
);

router.get(
  '/support/dashboard',
  requirePermission('SUPPORT_REPORTS_VIEW'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'DEFAULT';
    const metrics = commService.support.getDashboardMetrics(tenantId);
    return ok(res, metrics);
  })
);

export default router;
