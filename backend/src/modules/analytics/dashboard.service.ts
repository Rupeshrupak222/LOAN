// Phase 14: Analytics Dashboard & Widget Configuration Service

import { prisma } from '../../config/prisma';
import { AnalyticsActorContext } from './analytics.types';

export interface WidgetConfig {
  id: string;
  title: string;
  metricDomain: string;
  chartType: 'KPI' | 'LINE' | 'BAR' | 'STACKED_BAR' | 'DONUT' | 'FUNNEL' | 'TABLE';
  gridSpan: { cols: number; rows: number };
  refreshIntervalSeconds?: number;
  drilldownTarget?: string;
  description?: string;
}

export class DashboardService {
  private static instance: DashboardService;

  private constructor() {}

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  /**
   * Returns standard default widgets depending on role scope.
   */
  public getDefaultLayoutForRole(role: string): WidgetConfig[] {
    switch (role) {
      case 'BRANCH_MANAGER':
        return [
          { id: 'w-br-apps', title: 'Branch Origination Volume', metricDomain: 'BRANCHES', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 }, drilldownTarget: 'APPLICATIONS' },
          { id: 'w-br-tat', title: 'Average Turnaround Time (TAT)', metricDomain: 'OPERATIONS_SLA', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 } },
          { id: 'w-br-dpd', title: 'Branch Delinquency Rate', metricDomain: 'DELINQUENCY', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 }, drilldownTarget: 'COLLECTIONS' },
          { id: 'w-br-funnel', title: 'Branch Loan Conversion Funnel', metricDomain: 'FUNNEL', chartType: 'FUNNEL', gridSpan: { cols: 2, rows: 2 } },
          { id: 'w-br-staff', title: 'Loan Officer Productivity', metricDomain: 'BRANCHES', chartType: 'BAR', gridSpan: { cols: 2, rows: 2 } },
        ];

      case 'CREDIT_ANALYST':
      case 'UNDERWRITER':
        return [
          { id: 'w-uw-decisions', title: 'Credit Decision Breakdown', metricDomain: 'CREDIT_BRE', chartType: 'DONUT', gridSpan: { cols: 2, rows: 2 } },
          { id: 'w-uw-risk', title: 'Portfolio Risk Distribution (A-E)', metricDomain: 'RISK_FRAUD', chartType: 'BAR', gridSpan: { cols: 2, rows: 2 } },
          { id: 'w-uw-tat', title: 'Underwriting Queue Aging & SLA', metricDomain: 'OPERATIONS_SLA', chartType: 'TABLE', gridSpan: { cols: 4, rows: 2 } },
        ];

      case 'COLLECTION_OFFICER':
      case 'COLLECTION_MANAGER':
        return [
          { id: 'w-col-eff', title: 'Collection Efficiency Rate', metricDomain: 'COLLECTIONS', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 } },
          { id: 'w-col-ptp', title: 'PTP Fulfillment (%)', metricDomain: 'COLLECTIONS', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 } },
          { id: 'w-col-aging', title: 'DPD Aging Bucket Distribution', metricDomain: 'DELINQUENCY', chartType: 'BAR', gridSpan: { cols: 2, rows: 2 }, drilldownTarget: 'COLLECTIONS' },
          { id: 'w-col-scorecard', title: 'Collector Performance Scorecard', metricDomain: 'COLLECTIONS', chartType: 'TABLE', gridSpan: { cols: 4, rows: 2 } },
        ];

      case 'FINANCE_OFFICER':
        return [
          { id: 'w-fin-outflow', title: 'Disbursement Cash Outflow', metricDomain: 'FINANCE', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 } },
          { id: 'w-fin-inflow', title: 'Repayment Cash Inflow', metricDomain: 'FINANCE', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 } },
          { id: 'w-fin-gl', title: 'Key General Ledger Balances', metricDomain: 'FINANCE', chartType: 'TABLE', gridSpan: { cols: 4, rows: 2 } },
        ];

      default:
        // SUPER_ADMIN / Executive Enterprise Default
        return [
          { id: 'w-exec-aum', title: 'Total Portfolio AUM', metricDomain: 'PORTFOLIO', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 }, drilldownTarget: 'LOANS' },
          { id: 'w-exec-disb', title: 'Today Disbursements', metricDomain: 'DISBURSEMENTS', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 }, drilldownTarget: 'DISBURSEMENTS' },
          { id: 'w-exec-appr', title: 'Approval Rate (%)', metricDomain: 'CREDIT_BRE', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 }, drilldownTarget: 'APPLICATIONS' },
          { id: 'w-exec-par30', title: 'PAR 30 Delinquency', metricDomain: 'DELINQUENCY', chartType: 'KPI', gridSpan: { cols: 1, rows: 1 }, drilldownTarget: 'COLLECTIONS' },
          { id: 'w-exec-trend', title: 'Originations & Disbursement Trajectory', metricDomain: 'DISBURSEMENTS', chartType: 'LINE', gridSpan: { cols: 2, rows: 2 } },
          { id: 'w-exec-risk', title: 'Portfolio Risk Grade Matrix', metricDomain: 'RISK_FRAUD', chartType: 'DONUT', gridSpan: { cols: 2, rows: 2 } },
          { id: 'w-exec-funnel', title: 'End-to-End Origination Funnel', metricDomain: 'FUNNEL', chartType: 'FUNNEL', gridSpan: { cols: 4, rows: 2 } },
        ];
    }
  }

  /**
   * Retrieves user-saved layout or fallback default layout.
   */
  public async getDashboardLayout(actor: AnalyticsActorContext) {
    const role = actor.roles?.[0] || 'SUPER_ADMIN';

    if (actor.id) {
      const savedUserLayout = await prisma.analyticsDashboardLayout.findFirst({
        where: { userId: actor.id },
      });
      if (savedUserLayout && savedUserLayout.layoutConfig) {
        return {
          source: 'USER_CUSTOMIZED',
          layout: savedUserLayout.layoutConfig,
        };
      }
    }

    return {
      source: 'ROLE_DEFAULT',
      layout: this.getDefaultLayoutForRole(role),
    };
  }

  /**
   * Saves custom widget layout configuration for current user.
   */
  public async saveDashboardLayout(actor: AnalyticsActorContext, layoutConfig: WidgetConfig[], layoutName = 'Custom Layout') {
    if (!actor.id) {
      return { success: false, message: 'Anonymous users cannot persist dashboard layouts.' };
    }

    const existing = await prisma.analyticsDashboardLayout.findFirst({
      where: { userId: actor.id },
    });

    if (existing) {
      const updated = await prisma.analyticsDashboardLayout.update({
        where: { id: existing.id },
        data: {
          layoutConfig: layoutConfig as any,
          name: layoutName,
        },
      });
      return { success: true, layout: updated.layoutConfig };
    }

    const created = await prisma.analyticsDashboardLayout.create({
      data: {
        userId: actor.id,
        role: actor.roles?.[0] || 'USER',
        tenantId: actor.tenantId || null,
        name: layoutName,
        layoutConfig: layoutConfig as any,
        isDefault: true,
      },
    });

    return { success: true, layout: created.layoutConfig };
  }
}

export const dashboardService = DashboardService.getInstance();
