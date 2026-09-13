import { v4 as uuid } from 'uuid';
import { ReportingSnapshotRecord, AnalyticsActorContext } from './analytics.types';
import { analyticsMetricsService } from './analytics-metrics.service';
import { ForbiddenError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

export class ReportingSnapshotService {
  private static instance: ReportingSnapshotService;

  // In-memory persistent snapshot store: Map<snapshotId, ReportingSnapshotRecord>
  private readonly snapshots = new Map<string, ReportingSnapshotRecord>();

  private constructor() {
    this.seedInitialSnapshots('tenant-adyapan-default');
  }

  public static getInstance(): ReportingSnapshotService {
    if (!ReportingSnapshotService.instance) {
      ReportingSnapshotService.instance = new ReportingSnapshotService();
    }
    return ReportingSnapshotService.instance;
  }

  private seedInitialSnapshots(tenantId: string) {
    const s1: ReportingSnapshotRecord = {
      id: 'snap-2026-06-30-m',
      snapshotDate: '2026-06-30',
      snapshotType: 'MONTHLY',
      tenantId,
      totalAum: 44200000,
      activeLoansCount: 78,
      totalDisbursedMonth: 11500000,
      totalCollectedMonth: 4800000,
      totalOverdue: 340000,
      par30Amount: 760000,
      par90Amount: 220000,
      totalRevenueMonth: 3024000,
      isImmutable: true,
      generatedAt: '2026-06-30T23:59:59.000Z',
      metadata: { closedBy: 'system-batch-job', fiscalPeriod: 'FY2026-Q1' },
    };

    const s2: ReportingSnapshotRecord = {
      id: 'snap-2026-07-31-m',
      snapshotDate: '2026-07-31',
      snapshotType: 'MONTHLY',
      tenantId,
      totalAum: 49800000,
      activeLoansCount: 86,
      totalDisbursedMonth: 14200000,
      totalCollectedMonth: 5400000,
      totalOverdue: 410000,
      par30Amount: 840000,
      par90Amount: 260000,
      totalRevenueMonth: 3188000,
      isImmutable: true,
      generatedAt: '2026-07-31T23:59:59.000Z',
      metadata: { closedBy: 'system-batch-job', fiscalPeriod: 'FY2026-Q2-M1' },
    };

    const s3: ReportingSnapshotRecord = {
      id: 'snap-2026-08-31-m',
      snapshotDate: '2026-08-31',
      snapshotType: 'MONTHLY',
      tenantId,
      totalAum: 52400000,
      activeLoansCount: 92,
      totalDisbursedMonth: 17800000,
      totalCollectedMonth: 5900000,
      totalOverdue: 480000,
      par30Amount: 920000,
      par90Amount: 290000,
      totalRevenueMonth: 3281000,
      isImmutable: true,
      generatedAt: '2026-08-31T23:59:59.000Z',
      metadata: { closedBy: 'system-batch-job', fiscalPeriod: 'FY2026-Q2-M2' },
    };

    this.snapshots.set(s1.id, s1);
    this.snapshots.set(s2.id, s2);
    this.snapshots.set(s3.id, s3);
  }

  public listSnapshots(actor: AnalyticsActorContext, tenantId?: string): ReportingSnapshotRecord[] {
    const effectiveTenantId = actor.roles.includes('SUPER_ADMIN')
      ? tenantId || actor.tenantId || 'tenant-adyapan-default'
      : actor.tenantId || 'tenant-adyapan-default';

    return Array.from(this.snapshots.values())
      .filter((s) => s.tenantId === effectiveTenantId)
      .sort((a, b) => new Date(b.snapshotDate).getTime() - new Date(a.snapshotDate).getTime());
  }

  public getSnapshotById(actor: AnalyticsActorContext, snapshotId: string): ReportingSnapshotRecord {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new NotFoundError(`Reporting snapshot '${snapshotId}' not found.`);
    }

    if (!actor.roles.includes('SUPER_ADMIN') && snapshot.tenantId !== actor.tenantId) {
      throw new ForbiddenError('Access forbidden: Snapshot belongs to another tenant.');
    }

    return snapshot;
  }

  public async generateSnapshot(
    actor: AnalyticsActorContext,
    params: {
      snapshotDate: string;
      snapshotType: 'DAILY' | 'MONTHLY' | 'QUARTERLY';
      tenantId?: string;
    }
  ): Promise<ReportingSnapshotRecord> {
    if (!actor.roles.some((r) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))) {
      throw new ForbiddenError('Access forbidden: Only administrators can trigger reporting snapshot generation.');
    }

    const tenantId = actor.roles.includes('SUPER_ADMIN')
      ? params.tenantId || actor.tenantId || 'tenant-adyapan-default'
      : actor.tenantId || 'tenant-adyapan-default';

    const [portfolio, delinq, disb, fin] = await Promise.all([
      analyticsMetricsService.getPortfolioAnalytics(actor, { tenantId }),
      analyticsMetricsService.getDelinquencyAnalytics(actor, { tenantId }),
      analyticsMetricsService.getDisbursementAnalytics(actor, { tenantId }),
      analyticsMetricsService.getFinancialAnalytics(actor, { tenantId }),
    ]);

    const snapshotId = `snap-${params.snapshotDate}-${params.snapshotType.toLowerCase().charAt(0)}-${uuid().slice(0, 8)}`;

    const newSnapshot: ReportingSnapshotRecord = {
      id: snapshotId,
      snapshotDate: params.snapshotDate,
      snapshotType: params.snapshotType,
      tenantId,
      totalAum: portfolio.totalPrincipalOutstanding,
      activeLoansCount: portfolio.activeLoansCount,
      totalDisbursedMonth: disb.totalDisbursedVolume,
      totalCollectedMonth: fin.repaymentInflow,
      totalOverdue: portfolio.totalOverdueAmount,
      par30Amount: Math.round((portfolio.totalPrincipalOutstanding * delinq.par30Pct) / 100),
      par90Amount: Math.round((portfolio.totalPrincipalOutstanding * delinq.par90Pct) / 100),
      totalRevenueMonth: fin.totalOperatingRevenue,
      isImmutable: true,
      generatedAt: new Date().toISOString(),
      metadata: {
        triggeredBy: actor.id || actor.userId || 'system-admin',
        generatedVia: 'Analytics Snapshot Engine',
      },
    };

    this.snapshots.set(newSnapshot.id, newSnapshot);

    await logAudit({
      userId: actor.id || actor.userId || 'admin',
      tenantId,
      action: 'GENERATE_REPORTING_SNAPSHOT',
      entity: 'REPORTING_SNAPSHOT',
      entityId: newSnapshot.id,
      newValue: { snapshotDate: params.snapshotDate, snapshotType: params.snapshotType },
    });

    return newSnapshot;
  }
}

export const reportingSnapshotService = ReportingSnapshotService.getInstance();
