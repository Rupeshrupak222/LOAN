import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { created, ok, paginated } from '../../common/response';
import { getPageParams } from '../../common/pagination';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { productEngineService } from './product-engine.service';
import * as legacyService from './product.service';

const router = Router();
router.use(authenticate);
router.use(tenantContext);

// ---------------------------------------------------------------------------
// 1. PRODUCT PRICING SIMULATION (RBI KFS & APR)
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/loan-products/simulate-pricing
 * Simulates monthly EMI, statutory APR, and Key Fact Statement (KFS) breakdown.
 */
router.post(
  '/simulate-pricing',
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const result = productEngineService.simulateProductPricing(tenantId, req.body);
    return ok(res, result);
  })
);

// ---------------------------------------------------------------------------
// 2. PRODUCT ENGINE LIFECYCLE & CONFIGURATION ENDPOINTS
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/loan-products
 * Lists lending products for the current tenant with optional status/type/channel/search filtering.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const activeOnly = req.query.active === 'true' || req.query.activeOnly === 'true';
    const status = req.query.status as string | undefined;
    const productType = req.query.productType as string | undefined;
    const channel = req.query.channel as string | undefined;
    const search = req.query.search as string | undefined;

    const products = productEngineService.listProducts(tenantId, {
      activeOnly,
      status,
      productType,
      channel,
      search,
    });
    return ok(res, products);
  })
);

/**
 * GET /api/v1/loan-products/:id
 * Fetches full configuration breakdown of a single lending product.
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const product = productEngineService.getProductById(tenantId, req.params.id);
    return ok(res, product);
  })
);

/**
 * POST /api/v1/loan-products
 * Creates a new lending product in DRAFT lifecycle state.
 */
router.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const product = await productEngineService.createProduct(
      tenantId,
      req.body,
      req.user as any
    );
    return created(res, product);
  })
);

/**
 * PUT/PATCH /api/v1/loan-products/:id
 * Updates lending product configuration with immutable version increment when active.
 */
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const product = await productEngineService.updateProductWithVersioning(
      tenantId,
      req.params.id,
      req.body,
      req.user as any
    );
    return ok(res, product);
  })
);

router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const product = await productEngineService.updateProductWithVersioning(
      tenantId,
      req.params.id,
      req.body,
      req.user as any
    );
    return ok(res, product);
  })
);

/**
 * POST /api/v1/loan-products/:id/activate
 * Validates mandatory configuration rules and transitions product to ACTIVE status.
 */
router.post(
  '/:id/activate',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const product = await productEngineService.activateProduct(
      tenantId,
      req.params.id,
      req.user as any
    );
    return ok(res, product);
  })
);

/**
 * POST /api/v1/loan-products/:id/deactivate
 * Deactivates product for new originations while preserving historical applications and loans.
 */
router.post(
  '/:id/deactivate',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const product = await productEngineService.deactivateProduct(
      tenantId,
      req.params.id,
      req.user as any
    );
    return ok(res, product);
  })
);

/**
 * POST /api/v1/loan-products/:id/archive
 * Safely archives a product lifecycle record.
 */
router.post(
  '/:id/archive',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const product = await productEngineService.archiveProduct(
      tenantId,
      req.params.id,
      req.user as any
    );
    return ok(res, product);
  })
);

// ---------------------------------------------------------------------------
// 3. BACKWARD COMPATIBILITY ENDPOINTS (catalog & legacy paths)
// ---------------------------------------------------------------------------

router.get(
  '/catalog',
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const products = productEngineService.listProducts(tenantId);
    return ok(res, products);
  })
);

router.get(
  '/catalog/:id',
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const product = productEngineService.getProductById(tenantId, req.params.id);
    return ok(res, product);
  })
);

router.post(
  '/catalog',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const product = await productEngineService.createProduct(tenantId, req.body, req.user as any);
    return created(res, product);
  })
);

router.put(
  '/catalog/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const product = await productEngineService.updateProductWithVersioning(
      tenantId,
      req.params.id,
      req.body,
      req.user as any
    );
    return ok(res, product);
  })
);

export default router;
