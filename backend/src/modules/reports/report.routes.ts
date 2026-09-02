import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { getPortfolioOverview, generateCsvReport } from './report.service';

const router = Router();

router.use(authenticate);
router.use(
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER', 'AUDITOR', 'UNDERWRITER')
);

router.get(
  '/portfolio',
  asyncHandler(async (_req, res) => {
    const data = await getPortfolioOverview();
    res.json(success(data));
  })
);

router.get(
  '/export/:type',
  asyncHandler(async (req, res) => {
    const type = req.params.type as any;
    const csvData = await generateCsvReport(type);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_report_${Date.now()}.csv"`);
    res.send(csvData);
  })
);

export default router;
