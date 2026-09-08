import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ForbiddenError } from '../../common/errors';
import { created, ok, paginated } from '../../common/response';
import { getPageParams } from '../../common/pagination';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { validate } from '../../middleware/validate';
import { createApplicationSchema, transitionSchema } from './application.schema';
import * as service from './application.service';

const router = Router();
router.use(authenticate);
router.use(tenantContext);

const INTAKE_STAFF = ['LOAN_OFFICER', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = getPageParams(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const userIdFilter = isStaff ? undefined : req.user?.id;
    const result = await service.listApplications(params, status, userIdFilter, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    return paginated(res, result.data, result.pagination);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const app = await service.getApplication(req.params.id, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && app.customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower loan application');
    }
    return ok(res, app);
  }),
);

router.post(
  '/',
  authorize(...INTAKE_STAFF),
  validate({ body: createApplicationSchema }),
  asyncHandler(async (req, res) =>
    created(
      res,
      await service.createApplication(req.body, {
        id: req.user?.id,
        roles: req.user?.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      })
    )
  ),
);

router.post(
  '/:id/transition',
  authorize('LOAN_OFFICER', 'BRANCH_MANAGER', 'CREDIT_ANALYST', 'UNDERWRITER'),
  validate({ body: transitionSchema }),
  asyncHandler(async (req, res) =>
    ok(
      res,
      await service.transition(
        req.params.id,
        req.body.toStatus,
        req.user!.id,
        req.body.reason,
        {
          id: req.user?.id,
          roles: req.user?.roles,
          tenantId: req.tenantId || req.user?.tenantId,
          branchId: req.user?.branchId,
        }
      )
    )
  ),
);

export default router;
