import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { logActivitySchema, recordPtpSchema } from './collection.schema';
import {
  getCollectionDashboard,
  listCollectionCases,
  getCollectionCaseDetail,
  logCollectionActivity,
  recordPromiseToPay,
} from './collection.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

function getActor(req: any) {
  return {
    id: req.user?.id,
    email: req.user?.email,
    roles: req.user?.roles,
    tenantId: req.tenantId || req.user?.tenantId,
    branchId: req.user?.branchId,
  };
}

router.get(
  '/dashboard',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const data = await getCollectionDashboard(getActor(req));
    res.json(success(data));
  })
);

router.get(
  '/cases',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const bucket = req.query.bucket ? String(req.query.bucket) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const result = await listCollectionCases(params, bucket, status, getActor(req));
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/cases/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const colCase = await getCollectionCaseDetail(req.params.id, getActor(req));
    res.json(success(colCase));
  })
);

router.post(
  '/activities',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER'),
  validate(logActivitySchema),
  asyncHandler(async (req, res) => {
    const activity = await logCollectionActivity(req.body, getActor(req));
    res.status(201).json(success(activity));
  })
);

router.post(
  '/ptp',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER'),
  validate(recordPtpSchema),
  asyncHandler(async (req, res) => {
    const ptp = await recordPromiseToPay(req.body, getActor(req));
    res.status(201).json(success(ptp));
  })
);

export default router;
