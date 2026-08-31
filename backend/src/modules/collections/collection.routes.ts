import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
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
router.use(
  authorize('SUPER_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER')
);

router.get(
  '/dashboard',
  asyncHandler(async (_req, res) => {
    const data = await getCollectionDashboard();
    res.json(success(data));
  })
);

router.get(
  '/cases',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const bucket = req.query.bucket ? String(req.query.bucket) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const result = await listCollectionCases(params, bucket, status);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/cases/:id',
  asyncHandler(async (req, res) => {
    const colCase = await getCollectionCaseDetail(req.params.id);
    res.json(success(colCase));
  })
);

router.post(
  '/activities',
  validate(logActivitySchema),
  asyncHandler(async (req, res) => {
    const activity = await logCollectionActivity(req.body, req.user as any);
    res.status(201).json(success(activity));
  })
);

router.post(
  '/ptp',
  validate(recordPtpSchema),
  asyncHandler(async (req, res) => {
    const ptp = await recordPromiseToPay(req.body, req.user as any);
    res.status(201).json(success(ptp));
  })
);

export default router;
