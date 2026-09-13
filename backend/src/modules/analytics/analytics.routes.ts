// Phase 14: Analytics, MIS & Enterprise Command Center API Routes

import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { BadRequestError } from '../../common/errors';
import { authenticate } from '../../middleware/auth';
import { analyticsService } from './analytics.service';
import { snapshotService } from './snapshot.service';
import { reportBuilderService } from './report-builder.service';
import { exportService } from './export.service';
import { dashboardService } from './dashboard.service';
import { AnalyticsFilterOptions, TimeRangePreset } from './analytics.types';

const router = Router();

router.use(authenticate);

function extractActor(req: any) {
  return {
    id: req.user?.id,
    email: req.user?.email,
    roles: req.user?.roles || [],
    tenantId: req.user?.tenantId,
    branchId: req.user?.branchId,
    partnerId: req.user?.partnerId,
  };
}

function extractFilters(req: any): AnalyticsFilterOptions {
  return {
    timeRange: (req.query.timeRange as TimeRangePreset) || 'all_time',
    startDate: req.query.startDate as string,
    endDate: req.query.endDate as string,
    tenantId: req.query.tenantId as string,
    branchId: req.query.branchId as string,
    productId: req.query.productId as string,
    channel: req.query.channel as string,
    partnerId: req.query.partnerId as string,
    riskGrade: req.query.riskGrade as string,
    dpdBucket: req.query.dpdBucket as string,
    loanStatus: req.query.loanStatus as string,
    limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
  };
}

/**
 * GET /api/v1/analytics/overview
 */
router.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getOverview(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/funnel
 */
router.get(
  '/funnel',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getFunnel(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/credit
 */
router.get(
  '/credit',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getCreditBre(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/risk-fraud
 */
router.get(
  '/risk-fraud',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getRiskFraud(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/disbursements
 */
router.get(
  '/disbursements',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getDisbursements(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/portfolio
 */
router.get(
  '/portfolio',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getPortfolio(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/delinquency
 */
router.get(
  '/delinquency',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getDelinquency(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/collections
 */
router.get(
  '/collections',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getCollections(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/finance
 */
router.get(
  '/finance',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getFinance(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/partners
 */
router.get(
  '/partners',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getPartners(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/products
 */
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getProducts(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/branches
 */
router.get(
  '/branches',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getBranches(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/operations
 */
router.get(
  '/operations',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getOperationsSla(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/support
 */
router.get(
  '/support',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getSupport(actor, filters);
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/command-center
 */
router.get(
  '/command-center',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const filters = extractFilters(req);
    const data = await analyticsService.getCommandCenterTelemetry(actor, filters);
    res.json(success(data));
  })
);

/**
 * POST /api/v1/analytics/drilldown
 */
router.post(
  '/drilldown',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const { dimension, filters, page, pageSize } = req.body;
    if (!dimension) {
      throw new BadRequestError('Dimension is required for drilldown queries.');
    }
    const data = await analyticsService.getDrilldown(actor, {
      dimension,
      filters: filters || {},
      page,
      pageSize,
    });
    res.json(success(data));
  })
);

/**
 * GET /api/v1/analytics/snapshots
 */
router.get(
  '/snapshots',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;
    const data = await snapshotService.listSnapshots(actor, limit);
    res.json(success(data));
  })
);

/**
 * POST /api/v1/analytics/snapshots/generate
 */
router.post(
  '/snapshots/generate',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const snapshot = await snapshotService.generateDailySnapshot(req.body.tenantId, actor);
    res.json(success(snapshot));
  })
);

/**
 * GET /api/v1/analytics/saved-reports
 */
router.get(
  '/saved-reports',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const reports = await reportBuilderService.listSavedReports(actor);
    res.json(success(reports));
  })
);

/**
 * POST /api/v1/analytics/saved-reports
 */
router.post(
  '/saved-reports',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const report = await reportBuilderService.createSavedReport(actor, req.body);
    res.json(success(report));
  })
);

/**
 * GET /api/v1/analytics/saved-reports/:id
 */
router.get(
  '/saved-reports/:id',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const report = await reportBuilderService.getSavedReportById(req.params.id, actor);
    res.json(success(report));
  })
);

/**
 * PUT /api/v1/analytics/saved-reports/:id
 */
router.put(
  '/saved-reports/:id',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const updated = await reportBuilderService.updateSavedReport(req.params.id, actor, req.body);
    res.json(success(updated));
  })
);

/**
 * DELETE /api/v1/analytics/saved-reports/:id
 */
router.delete(
  '/saved-reports/:id',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const result = await reportBuilderService.deleteSavedReport(req.params.id, actor);
    res.json(success(result));
  })
);

/**
 * POST /api/v1/analytics/saved-reports/:id/run
 */
router.post(
  '/saved-reports/:id/run',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const result = await reportBuilderService.runSavedReport(req.params.id, actor, req.body.runtimeFilters);
    res.json(success(result));
  })
);

/**
 * POST /api/v1/analytics/export
 */
router.post(
  '/export',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const { reportType, format, filters, selectedColumns, maskPii } = req.body;

    if (!reportType) {
      throw new BadRequestError('reportType is required for export.');
    }

    const { csv, filename } = await exportService.exportToCsv(actor, {
      reportType,
      format: format || 'CSV',
      filters: filters || {},
      selectedColumns,
      maskPii,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  })
);

/**
 * GET /api/v1/analytics/dashboard-layout
 */
router.get(
  '/dashboard-layout',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const layout = await dashboardService.getDashboardLayout(actor);
    res.json(success(layout));
  })
);

/**
 * POST /api/v1/analytics/dashboard-layout
 */
router.post(
  '/dashboard-layout',
  asyncHandler(async (req, res) => {
    const actor = extractActor(req);
    const { layoutConfig, layoutName } = req.body;
    const result = await dashboardService.saveDashboardLayout(actor, layoutConfig, layoutName);
    res.json(success(result));
  })
);

export const analyticsRoutes = router;
export default router;
