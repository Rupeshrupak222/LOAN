import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { asyncHandler } from '../../common/asyncHandler';
import { lendingOrchestrationService } from './lending-orchestration.service';
import { CanonicalLifecycleState } from './orchestration.types';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/orchestration/lifecycle/:applicationId
 * Returns the canonical lifecycle projection for the given loan application.
 */
router.get(
  '/lifecycle/:applicationId',
  asyncHandler(async (req: Request, res: Response) => {
    const projection = await lendingOrchestrationService.getCanonicalLifecycle(
      req.params.applicationId,
      req.user as any
    );

    res.json({
      success: true,
      data: projection,
    });
  })
);

/**
 * GET /api/v1/orchestration/timeline/:applicationId
 * Returns the unified lifecycle timeline aggregating all authoritative domain events.
 */
router.get(
  '/timeline/:applicationId',
  asyncHandler(async (req: Request, res: Response) => {
    const timeline = await lendingOrchestrationService.getUnifiedTimeline(
      req.params.applicationId,
      req.user as any
    );

    res.json({
      success: true,
      data: timeline,
      total: timeline.length,
    });
  })
);

/**
 * GET /api/v1/orchestration/gate-check/:applicationId
 * Evaluates gate prerequisites for transitioning to target state.
 */
router.get(
  '/gate-check/:applicationId',
  asyncHandler(async (req: Request, res: Response) => {
    const targetState = req.query.targetState as CanonicalLifecycleState;
    if (!targetState) {
      res.status(400).json({ success: false, message: 'Missing query parameter targetState.' });
      return;
    }

    const gateStatus = await lendingOrchestrationService.evaluateCrossDomainGate(
      req.params.applicationId,
      targetState,
      req.user as any
    );

    res.json({
      success: true,
      data: gateStatus,
    });
  })
);

/**
 * POST /api/v1/orchestration/transition
 * Executes an authorized cross-domain transition with atomic state mutation and idempotency.
 */
router.post(
  '/transition',
  asyncHandler(async (req: Request, res: Response) => {
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;
    const result = await lendingOrchestrationService.executeTransition(
      {
        ...req.body,
        idempotencyKey,
      },
      req.user as any
    );

    res.json(result);
  })
);

/**
 * GET /api/v1/orchestration/borrower-journey/:applicationId
 * Returns borrower-safe sanitized journey projection.
 */
router.get(
  '/borrower-journey/:applicationId',
  asyncHandler(async (req: Request, res: Response) => {
    const journey = await lendingOrchestrationService.getBorrowerSafeJourney(
      req.params.applicationId,
      req.user as any
    );

    res.json({
      success: true,
      data: journey,
    });
  })
);

/**
 * GET /api/v1/orchestration/sla-status
 * Returns stuck workflows and SLA monitoring status.
 */
router.get(
  '/sla-status',
  authorize('ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'UNDERWRITER'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const stuckWorkflows = await lendingOrchestrationService.getStuckWorkflows(tenantId);

    res.json({
      success: true,
      data: stuckWorkflows,
      total: stuckWorkflows.length,
    });
  })
);

/**
 * GET /api/v1/orchestration/reconciliation
 * Returns cross-domain anomalies for administrative reconciliation.
 */
router.get(
  '/reconciliation',
  authorize('ADMIN', 'SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const anomalies = await lendingOrchestrationService.detectReconciliationAnomalies(tenantId);

    res.json({
      success: true,
      data: anomalies,
      total: anomalies.length,
    });
  })
);

/**
 * POST /api/v1/orchestration/reconciliation/repair
 * Executes controlled reconciliation repair.
 */
router.post(
  '/reconciliation/repair',
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { anomalyId, repairAction } = req.body;
    const result = await lendingOrchestrationService.executeControlledRepair(
      anomalyId,
      repairAction,
      req.user as any
    );

    res.json(result);
  })
);

export const orchestrationRoutes = router;
