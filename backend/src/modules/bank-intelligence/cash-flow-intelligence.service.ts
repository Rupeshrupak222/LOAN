import {
  NormalizedBankTransaction,
  CashFlowIntelligence,
  MonthlyCashFlow,
} from './bank-intelligence.types';

export class CashFlowIntelligenceService {
  /**
   * Analyzes daily balances, inflows, outflows, and burn rates to assess customer liquidity.
   */
  public static analyze(transactions: NormalizedBankTransaction[]): CashFlowIntelligence {
    let totalInflows = 0;
    let totalOutflows = 0;
    let minimumBalanceRecorded = Infinity;
    let maximumBalanceRecorded = -Infinity;
    let lowBalanceDaysCount = 0;

    // Monthly aggregates
    const monthMap = new Map<
      string,
      {
        inflow: number;
        outflow: number;
        balances: number[];
        count: number;
      }
    >();

    for (const t of transactions) {
      const month = t.transactionDate.slice(0, 7);
      if (!monthMap.has(month)) {
        monthMap.set(month, { inflow: 0, outflow: 0, balances: [], count: 0 });
      }

      const m = monthMap.get(month)!;
      m.count++;

      if (t.transactionType === 'CREDIT') {
        totalInflows += t.amount;
        m.inflow += t.amount;
      } else {
        totalOutflows += t.amount;
        m.outflow += t.amount;
      }

      const bal = t.balanceAfterTransaction;
      m.balances.push(bal);

      if (bal < minimumBalanceRecorded) minimumBalanceRecorded = bal;
      if (bal > maximumBalanceRecorded) maximumBalanceRecorded = bal;
      if (bal < 1000) lowBalanceDaysCount++;
    }

    if (minimumBalanceRecorded === Infinity) minimumBalanceRecorded = 0;
    if (maximumBalanceRecorded === -Infinity) maximumBalanceRecorded = 0;

    const netCashFlow = Math.round(totalInflows - totalOutflows);
    const cashBurnVelocityRatio =
      totalInflows > 0 ? Math.round((totalOutflows / totalInflows) * 100) / 100 : 1.0;

    // Build monthly breakdown
    const monthlyBreakdown: MonthlyCashFlow[] = [];
    let surplusMonthsCount = 0;
    let deficitMonthsCount = 0;
    let totalAvgBalanceSum = 0;

    const sortedMonths = Array.from(monthMap.keys()).sort();
    for (const month of sortedMonths) {
      const data = monthMap.get(month)!;
      const net = Math.round(data.inflow - data.outflow);
      if (net >= 0) surplusMonthsCount++;
      else deficitMonthsCount++;

      const avgBal =
        data.balances.length > 0
          ? Math.round(data.balances.reduce((a, b) => a + b, 0) / data.balances.length)
          : 0;

      totalAvgBalanceSum += avgBal;

      const minBal = data.balances.length > 0 ? Math.min(...data.balances) : 0;
      const maxBal = data.balances.length > 0 ? Math.max(...data.balances) : 0;

      monthlyBreakdown.push({
        month,
        inflow: Math.round(data.inflow),
        outflow: Math.round(data.outflow),
        netFlow: net,
        avgBalance: avgBal,
        minBalance: minBal,
        maxBalance: maxBal,
        transactionCount: data.count,
      });
    }

    const averageBankBalance =
      monthlyBreakdown.length > 0
        ? Math.round(totalAvgBalanceSum / monthlyBreakdown.length)
        : Math.round(
            transactions.length > 0
              ? transactions.reduce((a, b) => a + b.balanceAfterTransaction, 0) / transactions.length
              : 0
          );

    // Liquidity Risk Assessment
    let liquidityRiskTier: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (cashBurnVelocityRatio > 1.25 || deficitMonthsCount > surplusMonthsCount * 2) {
      liquidityRiskTier = 'CRITICAL';
    } else if (cashBurnVelocityRatio > 1.05 || lowBalanceDaysCount >= 10 || averageBankBalance < 3000) {
      liquidityRiskTier = 'HIGH';
    } else if (cashBurnVelocityRatio > 0.95 || lowBalanceDaysCount >= 4 || averageBankBalance < 10000) {
      liquidityRiskTier = 'MODERATE';
    }

    // Observations
    const observations: string[] = [];
    observations.push(
      `[FACT] Recorded total inflows of INR ${totalInflows.toLocaleString(
        'en-IN'
      )} vs outflows of INR ${totalOutflows.toLocaleString(
        'en-IN'
      )}, yielding a net cash flow of INR ${netCashFlow.toLocaleString('en-IN')}.`
    );

    observations.push(
      `[FACT] Average Bank Balance (ABB) stands at INR ${averageBankBalance.toLocaleString(
        'en-IN'
      )} with ${lowBalanceDaysCount} low-balance instances (< INR 1,000).`
    );

    if (liquidityRiskTier === 'CRITICAL' || liquidityRiskTier === 'HIGH') {
      observations.push(
        `[INFERENCE] Elevated liquidity risk: Outflows exceed or near 100% of inflows (burn velocity: ${cashBurnVelocityRatio}x).`
      );
    } else {
      observations.push(
        `[INFERENCE] Positive liquidity margin: Account maintains consistent surplus across ${surplusMonthsCount} of ${monthlyBreakdown.length} statement months.`
      );
    }

    return {
      totalInflows: Math.round(totalInflows),
      totalOutflows: Math.round(totalOutflows),
      netCashFlow,
      averageBankBalance,
      minimumBalanceRecorded,
      maximumBalanceRecorded,
      lowBalanceDaysCount,
      cashBurnVelocityRatio,
      liquidityRiskTier,
      surplusMonthsCount,
      deficitMonthsCount,
      monthlyBreakdown,
      observations,
    };
  }
}
