// Phase 14: Report Builder & Saved Reports Service

import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { analyticsService } from './analytics.service';
import { AnalyticsActorContext, ReportDefinitionDto, AnalyticsFilterOptions } from './analytics.types';
import { logAudit } from '../audit/audit.service';

export const WHITELISTED_REPORT_TYPES = [
  'PORTFOLIO',
  'ORIGINATIONS',
  'CREDIT_BRE',
  'RISK_FRAUD',
  'DISBURSEMENTS',
  'COLLECTIONS',
  'FINANCIAL',
  'PARTNERS',
  'PRODUCTS',
  'BRANCHES',
  'OPERATIONS_SLA',
  'SUPPORT',
  'CUSTOM',
] as const;

export class ReportBuilderService {
  private static instance: ReportBuilderService;

  private constructor() {}

  public static getInstance(): ReportBuilderService {
    if (!ReportBuilderService.instance) {
      ReportBuilderService.instance = new ReportBuilderService();
    }
    return ReportBuilderService.instance;
  }

  /**
   * Creates and persists a new custom saved report definition.
   */
  public async createSavedReport(actor: AnalyticsActorContext, dto: ReportDefinitionDto) {
    if (!actor.id) {
      throw new ForbiddenError('Authentication required to save report definitions.');
    }

    if (!dto.name || dto.name.trim() === '') {
      throw new BadRequestError('Report name is required.');
    }

    if (!WHITELISTED_REPORT_TYPES.includes(dto.reportType as any)) {
      throw new BadRequestError(`Invalid report type '${dto.reportType}'.`);
    }

    const report = await prisma.savedReport.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        reportType: dto.reportType,
        metricKeys: dto.metricKeys || [],
        dimensions: (dto.dimensions || []) as any,
        filters: (dto.filters || {}) as any,
        chartType: dto.chartType || 'BAR',
        visibility: dto.visibility || 'PRIVATE',
        ownerId: actor.id,
        tenantId: actor.tenantId || null,
      },
    });

    await logAudit({
      userId: actor.id,
      role: actor.roles?.[0] || 'ANALYST',
      tenantId: actor.tenantId,
      action: 'SAVED_REPORT_CREATED',
      entity: 'SavedReport',
      entityId: report.id,
      newValue: { name: report.name, type: report.reportType },
    }).catch(() => {});

    return report;
  }

  /**
   * Lists saved reports matching visibility and tenant boundaries.
   */
  public async listSavedReports(actor: AnalyticsActorContext) {
    const roles = actor.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');

    const where: any = {
      OR: [
        { ownerId: actor.id },
        { visibility: 'TENANT', ...(actor.tenantId && !isSuperAdmin ? { tenantId: actor.tenantId } : {}) },
        { visibility: 'TEAM', ...(actor.tenantId && !isSuperAdmin ? { tenantId: actor.tenantId } : {}) },
      ],
    };

    if (isSuperAdmin) {
      delete where.OR;
    }

    const reports = await prisma.savedReport.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return reports;
  }

  /**
   * Retrieves a single saved report by ID with authorization.
   */
  public async getSavedReportById(id: string, actor: AnalyticsActorContext) {
    const report = await prisma.savedReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError(`Saved report with ID '${id}' not found.`);
    }

    const roles = actor.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    if (!isSuperAdmin && report.visibility === 'PRIVATE' && report.ownerId !== actor.id) {
      throw new ForbiddenError('Access Forbidden: You do not have permission to view this private report.');
    }

    return report;
  }

  /**
   * Updates an existing saved report.
   */
  public async updateSavedReport(id: string, actor: AnalyticsActorContext, dto: Partial<ReportDefinitionDto>) {
    const existing = await this.getSavedReportById(id, actor);

    const roles = actor.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    if (!isSuperAdmin && existing.ownerId !== actor.id) {
      throw new ForbiddenError('Access Forbidden: Only the report creator or super admin can modify this report.');
    }

    const updated = await prisma.savedReport.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.reportType ? { reportType: dto.reportType } : {}),
        ...(dto.metricKeys ? { metricKeys: dto.metricKeys } : {}),
        ...(dto.dimensions ? { dimensions: dto.dimensions as any } : {}),
        ...(dto.filters ? { filters: dto.filters as any } : {}),
        ...(dto.chartType ? { chartType: dto.chartType } : {}),
        ...(dto.visibility ? { visibility: dto.visibility } : {}),
      },
    });

    return updated;
  }

  /**
   * Deletes a saved report.
   */
  public async deleteSavedReport(id: string, actor: AnalyticsActorContext) {
    const existing = await this.getSavedReportById(id, actor);

    const roles = actor.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    if (!isSuperAdmin && existing.ownerId !== actor.id) {
      throw new ForbiddenError('Access Forbidden: Only the report creator or super admin can delete this report.');
    }

    await prisma.savedReport.delete({ where: { id } });
    return { success: true, id };
  }

  /**
   * Executes a saved report on demand.
   */
  public async runSavedReport(id: string, actor: AnalyticsActorContext, runtimeFilters?: AnalyticsFilterOptions) {
    const report = await this.getSavedReportById(id, actor);

    // Merge saved filters with runtime filters
    const combinedFilters: AnalyticsFilterOptions = {
      ...((report.filters as any) || {}),
      ...(runtimeFilters || {}),
    };

    let reportData: any;
    switch (report.reportType) {
      case 'PORTFOLIO':
        reportData = await analyticsService.getPortfolio(actor, combinedFilters);
        break;
      case 'ORIGINATIONS':
        reportData = await analyticsService.getFunnel(actor, combinedFilters);
        break;
      case 'CREDIT_BRE':
        reportData = await analyticsService.getCreditBre(actor, combinedFilters);
        break;
      case 'RISK_FRAUD':
        reportData = await analyticsService.getRiskFraud(actor, combinedFilters);
        break;
      case 'DISBURSEMENTS':
        reportData = await analyticsService.getDisbursements(actor, combinedFilters);
        break;
      case 'COLLECTIONS':
        reportData = await analyticsService.getCollections(actor, combinedFilters);
        break;
      case 'FINANCIAL':
        reportData = await analyticsService.getFinance(actor, combinedFilters);
        break;
      case 'PARTNERS':
        reportData = await analyticsService.getPartners(actor, combinedFilters);
        break;
      case 'PRODUCTS':
        reportData = await analyticsService.getProducts(actor, combinedFilters);
        break;
      case 'BRANCHES':
        reportData = await analyticsService.getBranches(actor, combinedFilters);
        break;
      case 'OPERATIONS_SLA':
        reportData = await analyticsService.getOperationsSla(actor, combinedFilters);
        break;
      case 'SUPPORT':
        reportData = await analyticsService.getSupport(actor, combinedFilters);
        break;
      default:
        reportData = await analyticsService.getOverview(actor, combinedFilters);
    }

    // Update lastRunAt timestamp
    await prisma.savedReport.update({
      where: { id },
      data: { lastRunAt: new Date() },
    }).catch(() => {});

    await logAudit({
      userId: actor.id,
      role: actor.roles?.[0] || 'USER',
      tenantId: actor.tenantId,
      action: 'SAVED_REPORT_EXECUTED',
      entity: 'SavedReport',
      entityId: id,
      newValue: { reportName: report.name },
    }).catch(() => {});

    return {
      reportId: report.id,
      reportName: report.name,
      reportType: report.reportType,
      executedAt: new Date().toISOString(),
      filtersApplied: combinedFilters,
      data: reportData,
    };
  }
}

export const reportBuilderService = ReportBuilderService.getInstance();
