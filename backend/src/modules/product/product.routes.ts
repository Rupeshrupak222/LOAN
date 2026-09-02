import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { created, ok, paginated } from '../../common/response';
import { getPageParams } from '../../common/pagination';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './product.schema';
import * as service from './product.service';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = getPageParams(req);
    const activeOnly = req.query.active === 'true';
    const result = await service.listProducts(params, activeOnly);
    return paginated(res, result.data, result.pagination);
  }),
);

router.get('/:id', asyncHandler(async (req, res) => ok(res, await service.getProduct(req.params.id))));

router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ body: createProductSchema }),
  asyncHandler(async (req, res) => created(res, await service.createProduct(req.body))),
);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  validate({ body: updateProductSchema }),
  asyncHandler(async (req, res) => ok(res, await service.updateProduct(req.params.id, req.body))),
);

router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER'),
  asyncHandler(async (req, res) => {
    await service.deleteProduct(req.params.id);
    return ok(res, { message: 'Product deleted successfully' });
  }),
);

export default router;
