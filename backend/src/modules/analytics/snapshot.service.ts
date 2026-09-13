// Phase 14: Analytics Snapshot & Historical Projection Service

import { prisma } from '../../config/prisma';
import { analyticsService } from './analytics.service';
import { AnalyticsActorContext } from './analytics.types';
import { ForbiddenError, NotFoundError } from '../../common/errors';

export class SnapshotService {
  private static instance: SnapshotService;

  private constructor() {}

  public static getInstance(): SnapshotService {
    if (!SnapshotService.instance) {
      SnapshotService.instance = new SnapshotService();
    }
    return SnapshotService.instance;
  }

  /**
   * Generates and stores an immutable daily snapshot of portfolio and operational metrics.
   */
  public async generateDailySnapshot(tenantId?: string, actor?: AnalyticsActorContext) {
    const targetTenantId = tenantId || actor?.tenantId || null;

    const actorContext: AnalyticsActorContext = {
      id: actor?.id || 'system-job',
      roles: ['SUPER_ADMIN'],
      tenantId: targetTenantId || undefined,
    };

    const [portfolio, delinquency, disbursements, creditBre] = await Promise.all([
      analyticsService.getPortfolio(actorContext),
      analyticsService.getDelinquency(actorContext),
      analyticsService.getDisbursements(actorContext),
      analyticsService.getCreditBre(actorContext),
    ]);

    const snapshotData = {
      portfolio,
      delinquency,
      disbursements,
      creditBre,
      capturedAt: new Date().toISOString(),
    };

    const snapshot = await prisma.analyticsSnapshot.create({
      data: {
        snapshotType: 'DAILY_PORTFOLIO',
        tenantId: targetTenantId,
        metrics: snapshotData as any,
        dimensions: {
          totalActiveLoans: portfolio.totalActiveLoans,
          totalPrincipalOutstanding: portfolio.totalPrincipalOutstanding,
          par30RatePct: delinquency.par30RatePct,
          approvalRatePct: creditBre.approvalRatePct,
        },
      },
    });

    return snapshot;
  }

  /**
   * Lists historical snapshots for vintage and trend analysis.
   */
  public async listSnapshots(actor: AnalyticsActorContext, limit = 30) {
    const roles = actor.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');

    if (roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access Forbidden: Borrowers cannot access portfolio snapshots.');
    }

    const where: any = {};
    if (!isSuperAdmin && actor.tenantId) {
      where.tenantId = actor.tenantId;
    }

    const snapshots = await prisma.analyticsSnapshot.findMany({
      where,
      orderBy: { snapshotDate: 'desc' },
      take: limit,
    });

    return snapshots;
  }

  /**
   * Retrieves a specific historical snapshot by ID.
   */
  public async getSnapshotById(id: string, actor: AnalyticsActorContext) {
    const snapshot = await prisma.analyticsSnapshot.findUnique({
      where: { id },
    });

    if (!snapshot) {
      throw new NotFoundError(`Analytics snapshot with ID '${id}' not found.`);
    }

    const roles = actor.roles || [];
    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    if (!isSuperAdmin && actor.tenantId && snapshot.tenantId && snapshot.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access Forbidden: You cannot access snapshots for another tenant.');
    }

    return snapshot;
  }
}

export const snapshotService = SnapshotService.getInstance();
