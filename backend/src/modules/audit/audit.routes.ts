import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { listAuditLogs } from './audit.service';
import { evidenceAuditService } from './evidence.service';
import { BadRequestError, ForbiddenError } from '../../common/errors';

const router = Router();

router.use(authenticate);
router.use(tenantContext);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER'));

/**
 * GET /api/v1/audit/
 * Filtered audit logs.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const entity = req.query.entity ? String(req.query.entity) : undefined;
    const entityId = req.query.entityId ? String(req.query.entityId) : undefined;
    const result = await listAuditLogs(params, entity, entityId);
    res.json(success(result.data, result.pagination));
  })
);

/**
 * GET /api/v1/audit/evidence-package/:entityType/:entityId
 * Generates an immutable evidence package for an application, loan, or customer.
 */
router.get(
  '/evidence-package/:entityType/:entityId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const entityType = req.params.entityType.toUpperCase() as 'APPLICATION' | 'LOAN' | 'CUSTOMER';
      const entityId = req.params.entityId;

      const pkg = evidenceAuditService.generateEvidencePackage(tenantId, entityType, entityId, req.user as any);

      res.json({
        success: true,
        message: `Evidence package '${pkg.packageId}' generated with ${pkg.totalEventsCount} verified events.`,
        data: pkg,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/audit/verify-chain
 * Validates cryptographic SHA-256 hash chaining integrity.
 */
router.post(
  '/verify-chain',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const { entityId } = req.body;
      if (!entityId) {
        throw new BadRequestError('entityId is required to verify hash chain.');
      }

      const result = evidenceAuditService.verifyChainIntegrity(tenantId, entityId);

      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/audit/export
 * Controlled, PII-masked audit log export.
 */
router.post(
  '/export',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const exportResult = evidenceAuditService.exportAuditTrail(tenantId, req.body, req.user as any);

      res.json({
        success: true,
        data: exportResult,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
