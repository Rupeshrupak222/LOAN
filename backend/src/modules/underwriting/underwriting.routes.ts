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
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'CREDIT_ANALYST', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const queue = await getUnderwritingQueue((req.query as any)?.tab, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(queue));
  })
);

router.post(
  '/:applicationId/decision',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'CREDIT_ANALYST', 'BRANCH_MANAGER'),
  validate(underwritingDecisionSchema),
  asyncHandler(async (req, res) => {
    const result = await submitUnderwritingDecision(
      req.params.applicationId,
      req.body,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(result));
  })
);

export default router;
