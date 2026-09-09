import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { getPortfolioOverview, generateCsvReport } from './report.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);
router.use(
  authorize(
    'SUPER_ADMIN',
    'COMPANY_ADMIN',
    'ADMIN',
    'BRANCH_MANAGER',
    'LOAN_OFFICER',
    'CREDIT_ANALYST',
    'UNDERWRITER',
    'FINANCE_OFFICER',
    'COLLECTION_OFFICER',
    'AUDITOR'
  )
);

async function resolveActor(req: any) {
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
    id: req.user!.id,
    email: req.user!.email,
    roles: req.user!.roles,
    tenantId: req.tenantId || req.user?.tenantId,
    branchId,
  };
}

router.get(
  '/portfolio',
  asyncHandler(async (req, res) => {
    const actor = await resolveActor(req);
    const { filter, start, end, range } = req.query as any;
    const data = await getPortfolioOverview(actor, { filter, start, end, range });
    res.json(success(data));
  })
);

router.get(
  '/export/:type',
  asyncHandler(async (req, res) => {
    const type = req.params.type as any;
    const actor = await resolveActor(req);
    const options = {
      dateFilter: req.query.dateFilter as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
    };
    const csvData = await generateCsvReport(type, actor, options);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.csv"`);
    res.send(csvData);
  })
);

export default router;
