import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { reconciliationService } from './reconciliation.service';

const router = Router();

router.use(authenticate);

/**
 * POST /api/v1/reconciliation/run
 * Triggers a comprehensive 5-pillar reconciliation pass across financial ledgers.
 */
router.post(
  '/run',
  asyncHandler(async (req, res) => {
    const result = await reconciliationService.runReconciliation();
    res.json(success(result));
  })
);

/**
 * GET /api/v1/reconciliation/dashboard
 * Retrieves dashboard KPI statistics and reconciliation health metrics.
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const stats = await reconciliationService.getDashboardStats({
      id: req.user!.id,
      roles: req.user!.roles,
    });
    res.json(success(stats));
  })
);

/**
 * GET /api/v1/reconciliation/exceptions
 * Lists all active and historical financial exceptions.
 */
router.get(
  '/exceptions',
  asyncHandler(async (req, res) => {
    const { status, severity, type, loanId } = req.query;

    const exceptions = reconciliationService.listExceptions(
      {
        status: status as string,
        severity: severity as string,
        type: type as string,
        loanId: loanId as string,
      },
      {
        id: req.user!.id,
        roles: req.user!.roles,
      }
    );

    res.json(success(exceptions));
  })
);

/**
 * POST /api/v1/reconciliation/adjustments
 * Proposes a formal ledger adjustment with Maker-Checker controls.
 */
router.post(
  '/adjustments',
  asyncHandler(async (req, res) => {
    const { type, loanId, exceptionId, amount, reason } = req.body || {};

    const adjustment = await reconciliationService.proposeAdjustment(
      {
        type,
        loanId,
        exceptionId,
        amount: Number(amount),
        reason,
      },
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
      }
    );

    res.json(success(adjustment));
  })
);

/**
 * POST /api/v1/reconciliation/adjustments/:id/approve
 * Approves a pending ledger adjustment (Checker action).
 */
router.post(
  '/adjustments/:id/approve',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const approved = await reconciliationService.approveAdjustment(id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });

    res.json(success(approved));
  })
);

/**
 * POST /api/v1/reconciliation/adjustments/:id/reject
 * Rejects a pending ledger adjustment.
 */
router.post(
  '/adjustments/:id/reject',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rejectionReason } = req.body || {};

    const rejected = await reconciliationService.rejectAdjustment(
      id,
      rejectionReason,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
      }
    );

    res.json(success(rejected));
  })
);

/**
 * GET /api/v1/reconciliation/adjustments
 * Lists all proposed, approved, and rejected ledger adjustments.
 */
router.get(
  '/adjustments',
  asyncHandler(async (req, res) => {
    const adjustments = reconciliationService.listAdjustments({
      id: req.user!.id,
      roles: req.user!.roles,
    });

    res.json(success(adjustments));
  })
);

export const reconciliationRoutes = router;
