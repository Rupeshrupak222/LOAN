import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { listAuditLogs } from './audit.service';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER'));

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

export default router;
