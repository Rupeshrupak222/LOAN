import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { branchManagerDecisionSchema } from './branch-manager.schema';
import {
  getBranchManagerQueue,
  submitBranchManagerDecision,
} from './branch-manager.service';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/branch-manager/queue
 * Returns Branch Applications Queue with live management metrics.
 */
router.get(
  '/queue',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const queue = await getBranchManagerQueue(req.user as any, (req.query as any)?.tab);
    res.json(success(queue));
  })
);

/**
 * POST /api/v1/branch-manager/applications/:id/decision
 * Submits Branch Manager decision (APPROVE within limit, SEND_BACK, or ESCALATE).
 */
router.post(
  '/applications/:id/decision',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  validate(branchManagerDecisionSchema),
  asyncHandler(async (req, res) => {
    const result = await submitBranchManagerDecision(
      req.params.id,
      req.body,
      req.user as any
    );
    res.json(success(result));
  })
);

export default router;
