import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { earlyWarningService } from './early-warning.service';
import { eventBus } from './event-bus.service';

const router = Router();

// Require authentication for all early warning routes
router.use(authenticate);

const STAFF_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'UNDERWRITER',
  'CREDIT_ANALYST',
  'LOAN_OFFICER',
  'FINANCE_OFFICER',
  'COLLECTION_OFFICER',
  'BRANCH_MANAGER',
  'AUDITOR',
];

/**
 * GET /api/v1/early-warnings
 * Lists active and historical early warning alerts with filtering.
 */
router.get(
  '/',
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const { domain, priority, status, customerId, applicationId, loanId } = req.query;

    const alerts = earlyWarningService.listAlerts(
      {
        domain: domain as any,
        priority: priority as any,
        status: status as any,
        customerId: customerId as string,
        applicationId: applicationId as string,
        loanId: loanId as string,
      },
      {
        id: req.user!.id,
        roles: req.user!.roles,
      }
    );

    res.json(success(alerts));
  })
);

/**
 * GET /api/v1/early-warnings/stats
 * Aggregated summary statistics across risk domains and priorities.
 */
router.get(
  '/stats',
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const stats = earlyWarningService.getStats({
      id: req.user!.id,
      roles: req.user!.roles,
    });

    res.json(success(stats));
  })
);

/**
 * GET /api/v1/early-warnings/:warningId
 * Retrieves detailed alert data with Gemini advisory briefing.
 */
router.get(
  '/:warningId',
  authorize(...STAFF_ROLES),
  asyncHandler(async (req, res) => {
    const { warningId } = req.params;

    const alert = await earlyWarningService.getAlertById(warningId, {
      id: req.user!.id,
      roles: req.user!.roles,
    });

    res.json(success(alert));
  })
);

/**
 * POST /api/v1/early-warnings/:warningId/acknowledge
 * Marks alert status as ACKNOWLEDGED.
 */
router.post(
  '/:warningId/acknowledge',
  authorize(
    'SUPER_ADMIN',
    'ADMIN',
    'UNDERWRITER',
    'CREDIT_ANALYST',
    'LOAN_OFFICER',
    'FINANCE_OFFICER',
    'COLLECTION_OFFICER',
    'BRANCH_MANAGER'
  ),
  asyncHandler(async (req, res) => {
    const { warningId } = req.params;

    const updated = await earlyWarningService.acknowledgeAlert(warningId, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });

    res.json(success(updated));
  })
);

/**
 * POST /api/v1/early-warnings/:warningId/resolve
 * Resolves an active alert with mandatory resolution rationale.
 */
router.post(
  '/:warningId/resolve',
  authorize(
    'SUPER_ADMIN',
    'ADMIN',
    'BRANCH_MANAGER',
    'UNDERWRITER',
    'COLLECTION_OFFICER',
    'FINANCE_OFFICER'
  ),
  asyncHandler(async (req, res) => {
    const { warningId } = req.params;
    const { resolutionNotes } = req.body || {};

    const updated = await earlyWarningService.resolveAlert(
      warningId,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
      },
      resolutionNotes
    );

    res.json(success(updated));
  })
);

/**
 * POST /api/v1/early-warnings/:warningId/dismiss
 * Dismisses an alert with mandatory justification.
 */
router.post(
  '/:warningId/dismiss',
  authorize(
    'SUPER_ADMIN',
    'ADMIN',
    'BRANCH_MANAGER',
    'UNDERWRITER',
    'COLLECTION_OFFICER',
    'FINANCE_OFFICER'
  ),
  asyncHandler(async (req, res) => {
    const { warningId } = req.params;
    const { dismissalReason } = req.body || {};

    const updated = await earlyWarningService.dismissAlert(
      warningId,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
      },
      dismissalReason
    );

    res.json(success(updated));
  })
);

/**
 * POST /api/v1/early-warnings/scan
 * Triggers on-demand portfolio-wide state scan.
 */
router.post(
  '/scan',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await earlyWarningService.runSystemScan();
    res.json(success(result));
  })
);

/**
 * POST /api/v1/early-warnings/publish-event
 * Publishes a system event to trigger real-time early warning evaluation.
 */
router.post(
  '/publish-event',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const event = await eventBus.publish({
      eventType: req.body.eventType,
      entityType: req.body.entityType,
      entityId: req.body.entityId,
      customerId: req.body.customerId,
      applicationId: req.body.applicationId,
      loanId: req.body.loanId,
      source: req.body.source || 'Manual/API',
      correlationId: req.body.correlationId || `INT-${Date.now()}`,
      severity: req.body.severity || 'MEDIUM',
      previousValue: req.body.previousValue,
      currentValue: req.body.currentValue,
      metadata: req.body.metadata,
    });

    res.json(success({ status: 'EVENT_PUBLISHED', event }));
  })
);

export const earlyWarningRoutes = router;
