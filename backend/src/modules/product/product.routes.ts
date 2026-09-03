import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { created, ok, paginated } from '../../common/response';
import { getPageParams } from '../../common/pagination';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { validate } from '../../middleware/validate';
import { createProductSchema, updateProductSchema } from './product.schema';
import * as service from './product.service';
import { productCatalogService } from './catalog.service';

const router = Router();
router.use(authenticate);
router.use(tenantContext);

// --- 1. DYNAMIC PRODUCT CATALOG & PRICING SIMULATOR (STEP 36) ---

/**
 * GET /api/v1/loan-products/catalog
 * Lists dynamic products for current tenant.
 */
router.get(
  '/catalog',
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const products = productCatalogService.listProducts(tenantId);
    return ok(res, products);
  })
);

/**
 * POST /api/v1/loan-products/simulate-pricing
 * Simulates monthly EMI, statutory APR, and Key Fact Statement (KFS) breakdown.
 */
router.post(
  '/simulate-pricing',
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const result = productCatalogService.simulateProductPricing(tenantId, req.body);
    return ok(res, result);
  })
);

/**
 * GET /api/v1/loan-products/catalog/:id
 * Fetches dynamic product detail.
 */
router.get(
  '/catalog/:id',
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const product = productCatalogService.getProductById(tenantId, req.params.id);
    return ok(res, product);
  })
);

/**
 * POST /api/v1/loan-products/catalog
 * Creates a new dynamic loan product.
 */
router.post(
  '/catalog',
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const product = await productCatalogService.createProduct(tenantId, req.body, req.user as any);
    return created(res, product);
  })
);

/**
 * PUT /api/v1/loan-products/catalog/:id
 * Modifies loan product with immutable version increment.
 */
router.put(
  '/catalog/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const product = await productCatalogService.updateProductWithVersioning(
      tenantId,
      req.params.id,
      req.body,
      req.user as any
    );
    return ok(res, product);
  })
);

// --- 2. LEGACY COMPATIBILITY ENDPOINTS ---

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
