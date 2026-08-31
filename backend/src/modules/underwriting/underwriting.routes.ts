import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { underwritingDecisionSchema } from './underwriting.schema';
import { getUnderwritingQueue, submitUnderwritingDecision } from './underwriting.service';

const router = Router();

router.use(authenticate);

router.get(
  '/queue',
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER'),
  asyncHandler(async (_req, res) => {
    const queue = await getUnderwritingQueue();
    res.json(success(queue));
  })
);

router.post(
  '/:applicationId/decision',
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER'),
  validate(underwritingDecisionSchema),
  asyncHandler(async (req, res) => {
    const result = await submitUnderwritingDecision(
      req.params.applicationId,
      req.body,
      req.user as any
    );
    res.json(success(result));
  })
);

export default router;
