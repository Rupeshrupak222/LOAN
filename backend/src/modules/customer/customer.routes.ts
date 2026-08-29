import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { created, ok, paginated } from '../../common/response';
import { getPageParams } from '../../common/pagination';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createCustomerSchema, updateCustomerSchema } from './customer.schema';
import * as service from './customer.service';

const router = Router();
router.use(authenticate);

const STAFF = ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'];

router.get(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'CREDIT_ANALYST', 'UNDERWRITER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const params = getPageParams(req);
    const result = await service.listCustomers(params);
    return paginated(res, result.data, result.pagination);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => ok(res, await service.getCustomer(req.params.id))),
);

router.post(
  '/',
  authorize(...STAFF),
  validate({ body: createCustomerSchema }),
  asyncHandler(async (req, res) => created(res, await service.createCustomer(req.body))),
);

router.patch(
  '/:id',
  authorize(...STAFF),
  validate({ body: updateCustomerSchema }),
  asyncHandler(async (req, res) => ok(res, await service.updateCustomer(req.params.id, req.body))),
);

export default router;
