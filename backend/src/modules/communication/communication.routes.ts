import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { communicationService } from './communication.service';
import { TEMPLATE_REGISTRY } from './template.registry';

const router = Router();

// Delivery Webhook Endpoint (Open for webhook signatures / providers)
router.post(
  '/webhook/:provider',
  asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const result = communicationService.processDeliveryWebhook(provider, req.body);
    res.json(success(result));
  })
);

// All subsequent routes require JWT authentication
router.use(authenticate);

/**
 * GET /api/v1/communications/dashboard
 * Live aggregated message metrics, channel counts, delivery rate %, and recent activity.
 */
router.get(
  '/dashboard',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER', 'UNDERWRITER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const metrics = communicationService.getDashboardMetrics({
      id: req.user!.id,
      roles: req.user!.roles,
      tenantId: (req.user as any).tenantId,
      branchId: (req.user as any).branchId,
    });
    res.json(success(metrics));
  })
);

/**
 * GET /api/v1/communications/stats
 * Alias for backward compatibility.
 */
router.get(
  '/stats',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER', 'UNDERWRITER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const metrics = communicationService.getDashboardMetrics({
      id: req.user!.id,
      roles: req.user!.roles,
      tenantId: (req.user as any).tenantId,
      branchId: (req.user as any).branchId,
    });
    res.json(success(metrics));
  })
);

/**
 * POST /api/v1/communications/send
 * Dispatches a communication notice across WhatsApp, SMS, Email, or In-App.
 */
router.post(
  '/send',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER', 'UNDERWRITER', 'FINANCE_OFFICER'),
  asyncHandler(async (req, res) => {
    const record = await communicationService.sendMessage(req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req.user as any).tenantId,
      branchId: (req.user as any).branchId,
    });
    res.json(success(record));
  })
);

/**
 * POST /api/v1/communications/retry/:id
 * Safe idempotent retry for failed or pending communications.
 */
router.post(
  '/retry/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER', 'UNDERWRITER', 'FINANCE_OFFICER'),
  asyncHandler(async (req, res) => {
    const record = await communicationService.retryCommunication(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req.user as any).tenantId,
      branchId: (req.user as any).branchId,
    });
    res.json(success(record));
  })
);

/**
 * POST /api/v1/communications/preview
 * Previews rendered template with dynamic tokens and automated PII masking.
 */
router.post(
  '/preview',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER', 'UNDERWRITER', 'FINANCE_OFFICER'),
  asyncHandler(async (req, res) => {
    const { templateCode, variables, channel } = req.body;
    const preview = communicationService.previewTemplate(templateCode, variables || {}, channel || 'EMAIL');
    res.json(success(preview));
  })
);

/**
 * GET /api/v1/communications/templates
 * Lists all standardized templates with channel and variable schemas.
 */
router.get(
  '/templates',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER', 'UNDERWRITER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (_req, res) => {
    const templates = Object.values(TEMPLATE_REGISTRY);
    res.json(success(templates));
  })
);

/**
 * GET /api/v1/communications/logs
 * Queries communication delivery logs with filtering, search, and pagination.
 */
router.get(
  '/logs',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER', 'UNDERWRITER', 'FINANCE_OFFICER', 'AUDITOR', 'CUSTOMER'),
  asyncHandler(async (req, res) => {
    const { channel, status, category, recipient, customerId, search, page, pageSize } = req.query;

    const result = communicationService.listCommunications(
      {
        channel: channel as string,
        status: status as string,
        category: category as string,
        recipient: recipient as string,
        customerId: customerId as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      },
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        tenantId: (req.user as any).tenantId,
        branchId: (req.user as any).branchId,
        customerId: (req.user as any).customerId,
      }
    );

    res.json(success(result));
  })
);

/**
 * GET /api/v1/communications/logs/:id
 * Retrieves detail view of a single communication record.
 */
router.get(
  '/logs/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'COLLECTION_OFFICER', 'UNDERWRITER', 'FINANCE_OFFICER', 'AUDITOR', 'CUSTOMER'),
  asyncHandler(async (req, res) => {
    const record = communicationService.getCommunicationById(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req.user as any).tenantId,
    });
    res.json(success(record));
  })
);

/**
 * GET /api/v1/communications/providers
 * Returns sanitized provider integration health and connectivity status.
 */
router.get(
  '/providers',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const health = communicationService.getProviderHealth({
      id: req.user!.id,
      roles: req.user!.roles,
    });
    res.json(success(health));
  })
);

/**
 * GET /api/v1/communications/preferences/:customerId
 * Retrieves customer communication preferences and consent status.
 */
router.get(
  '/preferences/:customerId',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'CUSTOMER'),
  asyncHandler(async (req, res) => {
    const prefs = communicationService.getCustomerPreferences(req.params.customerId, (req.user as any).tenantId);
    res.json(success(prefs));
  })
);

/**
 * PUT /api/v1/communications/preferences/:customerId
 * Updates customer communication preferences and records audit log.
 */
router.put(
  '/preferences/:customerId',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'CUSTOMER'),
  asyncHandler(async (req, res) => {
    const updated = await communicationService.updateCustomerPreferences(req.params.customerId, req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req.user as any).tenantId,
    });
    res.json(success(updated));
  })
);

export const communicationRoutes = router;
