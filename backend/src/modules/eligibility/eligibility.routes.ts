import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { evaluateApplicationEligibility } from './eligibility.service';

const router = Router();

router.use(authenticate);

router.post(
  '/evaluate/:applicationId',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await evaluateApplicationEligibility(req.params.applicationId, req.user?.id);
    res.json(success(result));
  })
);

export default router;
