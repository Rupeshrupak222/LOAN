import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ForbiddenError } from '../../common/errors';
import { created, ok, paginated } from '../../common/response';
import { getPageParams } from '../../common/pagination';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createApplicationSchema, transitionSchema } from './application.schema';
import * as service from './application.service';

const router = Router();
router.use(authenticate);

const STAFF = ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = getPageParams(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const userIdFilter = isStaff ? undefined : req.user?.id;
    const result = await service.listApplications(params, status, userIdFilter);
    return paginated(res, result.data, result.pagination);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const app = await service.getApplication(req.params.id);
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && app.customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower loan application');
    }
    return ok(res, app);
  }),
);

router.post(
  '/',
  authorize(...STAFF),
  validate({ body: createApplicationSchema }),
  asyncHandler(async (req, res) => created(res, await service.createApplication(req.body))),
);

router.post(
  '/:id/transition',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'CREDIT_ANALYST', 'UNDERWRITER'),
  validate({ body: transitionSchema }),
  asyncHandler(async (req, res) =>
    ok(res, await service.transition(req.params.id, req.body.toStatus, req.user!.id, req.body.reason)),
  ),
);

export default router;
