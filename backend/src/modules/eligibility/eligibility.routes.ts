import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { evaluateApplicationEligibility, evaluatePreApplicationEligibility } from './eligibility.service';

const router = Router();

/**
 * POST /api/v1/eligibility/check
 * Instant pre-application eligibility calculation using real risk & DTI policy rules.
 */
router.post(
  '/check',
  asyncHandler(async (req, res) => {
    const tenantId = (req as any).tenantId || 'tenant-adyapan-default';
    const result = await evaluatePreApplicationEligibility(req.body, tenantId);
    res.json(success(result));
  })
);

router.use(authenticate);

router.post(
  '/evaluate/:applicationId',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await evaluateApplicationEligibility(req.params.applicationId, req.user?.id);
    res.json(success(result));
  })
);

export default router;
