import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { logActivitySchema, recordPtpSchema } from './collection.schema';
import { prisma } from '../../config/prisma';
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

async function getActor(req: any) {
  let branchId = (req.user as any)?.branchId;
  if (!branchId && req.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { branchId: true, branch: { select: { code: true } } },
    });
    branchId = dbUser?.branch?.code === 'HO' ? undefined : (dbUser?.branchId || undefined);
  } else if (branchId) {
    const dbBranch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { code: true },
    });
    if (dbBranch?.code === 'HO') {
      branchId = undefined;
    }
  }

  return {
    id: req.user?.id,
    email: req.user?.email,
    roles: req.user?.roles,
    tenantId: req.tenantId || req.user?.tenantId,
    branchId,
  };
}

router.get(
  '/dashboard',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const options = {
      dateFilter: req.query.dateFilter as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const data = await getCollectionDashboard(actor, options);
    res.json(success(data));
  })
);

router.get(
  '/cases',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const params = parsePagination(req.query);
    const bucket = req.query.bucket ? String(req.query.bucket) : undefined;
    const status = req.query.status ? String(req.query.status) : undefined;
    const result = await listCollectionCases(params, bucket, status, actor);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/cases/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const colCase = await getCollectionCaseDetail(req.params.id, actor);
    res.json(success(colCase));
  })
);

router.post(
  '/activities',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER'),
  validate(logActivitySchema),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const activity = await logCollectionActivity(req.body, actor);
    res.status(201).json(success(activity));
  })
);

router.post(
  '/ptp',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER'),
  validate(recordPtpSchema),
  asyncHandler(async (req, res) => {
    const actor = await getActor(req);
    const ptp = await recordPromiseToPay(req.body, actor);
    res.status(201).json(success(ptp));
  })
);

export default router;
