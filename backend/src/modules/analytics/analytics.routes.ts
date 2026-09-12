import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { requirePermission } from '../../middleware/rbac-permission';
import { analyticsMetricsService } from './analytics-metrics.service';
import { reportBuilderService } from './report-builder.service';
import { reportingSnapshotService } from './reporting-snapshot.service';
import { analyticsExportService } from './analytics-export.service';
import { validate } from '../../middleware/validate';

const router = Router();

// Zod query schema for analytics filters
const analyticsFilterSchema = z.object({
  query: z.object({
    preset: z.enum([
      'TODAY',
      'YESTERDAY',
      'LAST_7_DAYS',
      'LAST_30_DAYS',
      'THIS_MONTH',
      'LAST_MONTH',
      'THIS_QUARTER',
      'LAST_QUARTER',
      'THIS_FINANCIAL_YEAR',
      'CUSTOM',
    ]).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    tenantId: z.string().optional(),
    branchId: z.string().optional(),
    productId: z.string().optional(),
    partnerId: z.string().optional(),
    channel: z.string().optional(),
    riskGrade: z.string().optional(),
    fraudTier: z.string().optional(),
    dpdBucket: z.string().optional(),
  }).optional(),
});

// Zod schema for dynamic report builder queries
const reportBuilderSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    dimensions: z.array(z.string()).min(1, 'At least one dimension is required'),
    metrics: z.array(z.string()).min(1, 'At least one metric is required'),
    filters: z.object({
      preset: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      tenantId: z.string().optional(),
      branchId: z.string().optional(),
      productId: z.string().optional(),
      partnerId: z.string().optional(),
      channel: z.string().optional(),
    }).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(1000).optional(),
  }),
});

// Zod schema for creating a saved report
const createSavedReportSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Report name is required').max(150),
    description: z.string().max(500).optional(),
    visibility: z.enum(['PRIVATE', 'TEAM', 'TENANT']).optional(),
    queryConfig: z.object({
      title: z.string().optional(),
      dimensions: z.array(z.string()).min(1),
      metrics: z.array(z.string()).min(1),
      filters: z.any().optional(),
    }),
  }),
});

// Helper to extract actor from authenticated request
function getActor(req: Request) {
  const user = req.user!;
  return {
    id: user.id,
    userId: user.id,
    roles: user.roles || [],
    tenantId: user.tenantId,
    branchId: user.branchId,
    partnerId: (user as any).partnerId,
    email: user.email,
    name: (user as any).name || user.email,
  };
}

// -----------------------------------------------------------------------------
// 1. OVERVIEW & COMMAND CENTER
// -----------------------------------------------------------------------------
router.get(
  '/command-center',
  authenticate,
  requirePermission('ANALYTICS_COMMAND_CENTER'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getCommandCenterOverview(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 2. ORIGINATION & FUNNEL
// -----------------------------------------------------------------------------
router.get(
  '/funnel',
  authenticate,
  requirePermission('ANALYTICS_VIEW'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getOriginationFunnel(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 3. CREDIT & BRE
// -----------------------------------------------------------------------------
router.get(
  '/credit',
  authenticate,
  requirePermission('ANALYTICS_CREDIT'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getCreditBREAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 4. RISK & FRAUD
// -----------------------------------------------------------------------------
router.get(
  '/risk-fraud',
  authenticate,
  requirePermission('ANALYTICS_RISK'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getRiskFraudAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 5. DISBURSEMENTS
// -----------------------------------------------------------------------------
router.get(
  '/disbursements',
  authenticate,
  requirePermission('ANALYTICS_VIEW'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getDisbursementAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 6. PORTFOLIO
// -----------------------------------------------------------------------------
router.get(
  '/portfolio',
  authenticate,
  requirePermission('ANALYTICS_PORTFOLIO'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getPortfolioAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 7. DELINQUENCY & DPD
// -----------------------------------------------------------------------------
router.get(
  '/delinquency',
  authenticate,
  requirePermission('ANALYTICS_COLLECTIONS'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getDelinquencyAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 8. COLLECTIONS & RECOVERY
// -----------------------------------------------------------------------------
router.get(
  '/collections',
  authenticate,
  requirePermission('ANALYTICS_COLLECTIONS'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getCollectionAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 9. FINANCIAL & ACCOUNTING
// -----------------------------------------------------------------------------
router.get(
  '/finance',
  authenticate,
  requirePermission('ANALYTICS_FINANCE'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getFinancialAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 10. PARTNERS & LSP
// -----------------------------------------------------------------------------
router.get(
  '/partners',
  authenticate,
  requirePermission('ANALYTICS_PARTNERS'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getPartnerAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 11. PRODUCTS
// -----------------------------------------------------------------------------
router.get(
  '/products',
  authenticate,
  requirePermission('ANALYTICS_PRODUCTS'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getProductAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 12. BRANCHES
// -----------------------------------------------------------------------------
router.get(
  '/branches',
  authenticate,
  requirePermission('ANALYTICS_BRANCHES'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getBranchAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 13. OPERATIONAL SLA
// -----------------------------------------------------------------------------
router.get(
  '/operations-sla',
  authenticate,
  requirePermission('ANALYTICS_OPERATIONS'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getOperationalSlaAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 14. CUSTOMER SUPPORT & GRIEVANCES
// -----------------------------------------------------------------------------
router.get(
  '/support',
  authenticate,
  requirePermission('ANALYTICS_SUPPORT'),
  validate(analyticsFilterSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await analyticsMetricsService.getCustomerSupportAnalytics(getActor(req), req.query as any);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 15. DYNAMIC REPORT BUILDER & SAVED REPORTS
// -----------------------------------------------------------------------------
router.post(
  '/reports/query',
  authenticate,
  requirePermission('REPORT_EXECUTE'),
  validate(reportBuilderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await reportBuilderService.executeReportQuery(getActor(req), req.body);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/reports/saved',
  authenticate,
  requirePermission('REPORT_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = reportBuilderService.listSavedReports(getActor(req));
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/reports/saved/:id',
  authenticate,
  requirePermission('REPORT_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = reportBuilderService.getSavedReportById(getActor(req), req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/reports/saved',
  authenticate,
  requirePermission('REPORT_CREATE'),
  validate(createSavedReportSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await reportBuilderService.createSavedReport(getActor(req), req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/reports/saved/:id',
  authenticate,
  requirePermission('REPORT_EDIT'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await reportBuilderService.deleteSavedReport(getActor(req), req.params.id);
      res.json({ success: true, message: `Saved report '${req.params.id}' deleted successfully.` });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/reports/export',
  authenticate,
  requirePermission('REPORT_EXPORT'),
  validate(reportBuilderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unmaskPii = req.query.unmask === 'true';
      const exportResult = await analyticsExportService.exportReportToCsv(
        getActor(req),
        req.body,
        { unmaskPii }
      );

      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
      res.send(exportResult.csvContent);
    } catch (err) {
      next(err);
    }
  }
);

// -----------------------------------------------------------------------------
// 16. REPORTING SNAPSHOTS
// -----------------------------------------------------------------------------
router.get(
  '/snapshots',
  authenticate,
  requirePermission('REPORT_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.query.tenantId as string;
      const data = reportingSnapshotService.listSnapshots(getActor(req), tenantId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/snapshots/:id',
  authenticate,
  requirePermission('REPORT_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = reportingSnapshotService.getSnapshotById(getActor(req), req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/snapshots/generate',
  authenticate,
  requirePermission('REPORT_CREATE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { snapshotDate, snapshotType, tenantId } = req.body;
      const data = await reportingSnapshotService.generateSnapshot(getActor(req), {
        snapshotDate: snapshotDate || new Date().toISOString().slice(0, 10),
        snapshotType: snapshotType || 'DAILY',
        tenantId,
      });
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
