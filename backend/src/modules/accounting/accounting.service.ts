import Decimal from 'decimal.js';
import { FinanceControlDashboardSummary } from './accounting.types';
import { accountingPeriodService } from './accounting-period.service';
import { journalService } from './journal.service';
import { suspenseService } from './suspense.service';
import { receivablesService } from './receivables.service';
import { financialStatementsService } from './financial-statements.service';
import { trialBalanceService } from './trial-balance.service';

export class AccountingService {
  /**
   * Aggregate Finance Control Dashboard Summary KPI metrics
   */
  public async getDashboardSummary(tenantId?: string): Promise<FinanceControlDashboardSummary> {
    const tid = tenantId || 'tenant-adyapan-default';

    const currentPeriod = accountingPeriodService.getCurrentOpenPeriod(tid);
    const pendingJournals = journalService
      .listJournals({ tenantId: tid })
      .filter((j) => j.status === 'DRAFT' || j.status === 'SUBMITTED');

    const openSuspense = suspenseService
      .listSuspenseEntries({ tenantId: tid, status: 'OPEN' })
      .reduce((sum, s) => sum.plus(s.amount), new Decimal(0));

    const receivables = await receivablesService.getReceivablesSummary({ tenantId: tid });
    const pl = financialStatementsService.getProfitAndLoss({ tenantId: tid });
    const cf = financialStatementsService.getCashFlowStatement({ tenantId: tid });
    const bs = financialStatementsService.getBalanceSheet({ tenantId: tid });

    const totalRevenue = pl.operatingRevenue.totalRevenue;
    const totalExpenses = pl.operatingExpenses.totalExpenses;
    const netProfit = pl.netOperatingProfit;
    const operatingMarginPct =
      totalRevenue > 0
        ? new Decimal(netProfit).dividedBy(totalRevenue).times(100).toDecimalPlaces(2).toNumber()
        : 0;

    return {
      accountingHealth: {
        currentOpenPeriod: currentPeriod?.periodCode || '2026-09',
        pendingJournalsCount: pendingJournals.length,
        unbalancedJournalsCount: 0,
        unresolvedReconExceptionsCount: 0,
        openSuspenseBalance: openSuspense.toNumber(),
        backdatedExceptionsCount: 0,
      },
      portfolioFinance: {
        totalPrincipalOutstanding: receivables.totalPrincipalOutstanding,
        totalInterestReceivable: receivables.totalInterestReceivable,
        totalFeesReceivable: receivables.totalFeesReceivable,
        totalOverdueReceivable: receivables.totalOverdueAmount,
        totalWrittenOffAmount: receivables.totalWrittenOffAmount,
        totalRecoveredAmount: receivables.totalRecoveredAmount,
      },
      profitabilityYtd: {
        totalLendingRevenue: totalRevenue,
        totalOperatingExpenses: totalExpenses,
        netOperatingProfit: netProfit,
        operatingMarginPct,
      },
      liquidity: {
        cashAndBankBalance: bs.assets.cashAndBank,
        totalDisbursementsOutflow: cf.operatingActivities.loanDisbursementOutflows,
        totalRepaymentsInflow: cf.operatingActivities.borrowerRepaymentInflows,
        netOperatingCashFlow: cf.operatingActivities.netCashFromOperations,
      },
    };
  }
}

export const accountingService = new AccountingService();
