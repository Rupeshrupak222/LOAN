import {
  NormalizedBankTransaction,
  BankAnomalySignal,
  IncomeIntelligence,
  CashFlowIntelligence,
} from './bank-intelligence.types';

export class AnomalyIntelligenceService {
  /**
   * Evaluates deterministic financial anomaly signals and suspicious behavioral patterns.
   */
  public static evaluate(
    transactions: NormalizedBankTransaction[],
    incomeIntel: IncomeIntelligence,
    cashFlowIntel: CashFlowIntelligence,
    customerDeclaredIncome: number = 0
  ): BankAnomalySignal[] {
    const signals: BankAnomalySignal[] = [];

    // 1. Pre-Application Sudden Balance Spike (Window Dressing)
    if (transactions.length > 5) {
      const recentTransactions = transactions.slice(-10);
      const benchmarkIncome =
        incomeIntel.estimatedRecurringSalary > 0
          ? incomeIntel.estimatedRecurringSalary
          : incomeIntel.averageMonthlyIncome > 0
          ? incomeIntel.averageMonthlyIncome * 0.5
          : 30000;

      const largeRecentCredits = recentTransactions.filter(
        (t) =>
          t.transactionType === 'CREDIT' &&
          t.amount >= 50000 &&
          t.amount >= benchmarkIncome * 1.8 &&
          t.category !== 'SALARY'
      );

      for (const credit of largeRecentCredits) {
        signals.push({
          signalId: `ANOM-SPIKE-${credit.transactionId}`,
          severity: 'HIGH',
          category: 'BALANCE_INFLATION',
          title: 'Sudden Unexplained Balance Spike Pre-Application',
          fact: `Credit of INR ${credit.amount.toLocaleString('en-IN')} on ${credit.transactionDate} (${credit.description}) represents ${Math.round(
            (credit.amount / (incomeIntel.averageMonthlyIncome || 1)) * 100
          )}% of normal monthly inflow.`,
          anomaly: 'Large one-off credit received shortly before statement generation without payroll correlation.',
          interpretation: 'Potential artificial balance inflation (window dressing) to qualify for higher loan amount.',
          possibleExplanations: [
            'Legitimate one-time asset sale, inheritance, or maturity of fixed deposit.',
            'Short-term loan from friends/relatives to temporarily inflate account balance.',
            'Genuine business milestone payment or quarterly incentive.',
          ],
          recommendedHumanAction: [
            'Obtain source of funds documentation for transaction ' + credit.transactionId,
            'Request 3 additional months of prior statements to confirm long-term balance stability.',
          ],
          supportingTransactionIds: [credit.transactionId],
        });
      }
    }

    // 2. Rapid Round-Trip / Circular Transfers (Pass-through Funds)
    for (let i = 0; i < transactions.length - 1; i++) {
      const t1 = transactions[i];
      if (t1.transactionType === 'CREDIT' && t1.amount >= 25000 && t1.category !== 'SALARY') {
        // Look for matching debit within next 3 transactions or 48 hours
        for (let j = i + 1; j < Math.min(i + 4, transactions.length); j++) {
          const t2 = transactions[j];
          if (
            t2.transactionType === 'DEBIT' &&
            Math.abs(t2.amount - t1.amount) <= t1.amount * 0.05 // within 5% variance
          ) {
            signals.push({
              signalId: `ANOM-CIRCULAR-${t1.transactionId}`,
              severity: 'HIGH',
              category: 'CIRCULAR_ROUTING',
              title: 'Rapid Pass-Through / Round-Trip Funds Routing',
              fact: `Inbound credit of INR ${t1.amount.toLocaleString('en-IN')} on ${t1.transactionDate} was immediately followed by an outflow of INR ${t2.amount.toLocaleString(
                'en-IN'
              )} on ${t2.transactionDate}.`,
              anomaly: 'Funds routed in and out of account with zero retention duration.',
              interpretation: 'Account may be utilized as an intermediary routing conduit rather than primary operational account.',
              possibleExplanations: [
                'Borrower acted as payment intermediary for family member or acquaintance.',
                'Pass-through business reimbursement.',
                'Artificial transaction velocity inflation.',
              ],
              recommendedHumanAction: [
                'Inquire with borrower regarding counterparty identity and relationship for both legs.',
                'Verify purpose of high-value round-trip transfers.',
              ],
              supportingTransactionIds: [t1.transactionId, t2.transactionId],
            });
            break;
          }
        }
      }
    }

    // 3. Salary Day Rapid Depletion (Cash Burn Stress)
    const salaryCredits = transactions.filter((t) => t.category === 'SALARY');
    for (const sc of salaryCredits) {
      const scIdx = transactions.findIndex((t) => t.transactionId === sc.transactionId);
      if (scIdx >= 0 && scIdx < transactions.length - 2) {
        // Look at balance 2-3 transactions later
        const subsequent = transactions.slice(scIdx + 1, scIdx + 5);
        const lowestSubsequentBal = Math.min(...subsequent.map((t) => t.balanceAfterTransaction));
        if (lowestSubsequentBal < sc.amount * 0.15 && sc.balanceAfterTransaction > sc.amount * 0.8) {
          signals.push({
            signalId: `ANOM-BURN-${sc.transactionId}`,
            severity: 'MEDIUM',
            category: 'LIQUIDITY_STRESS',
            title: 'Immediate Salary Exhaustion (>85% within 72 hours)',
            fact: `Salary credit of INR ${sc.amount.toLocaleString('en-IN')} on ${sc.transactionDate} was depleted to INR ${lowestSubsequentBal.toLocaleString(
              'en-IN'
            )} within subsequent transactions.`,
            anomaly: 'Extremely high immediate cash burn velocity following monthly payroll credit.',
            interpretation: 'Borrower operates on very tight liquidity margin with high immediate cash demands or debt commitments.',
            possibleExplanations: [
              'Scheduled payment of rent, family support, or manual loan settlements.',
              'Immediate withdrawal to savings instrument in secondary bank account.',
              'Excessive debt service burden not captured on bureau.',
            ],
            recommendedHumanAction: [
              'Cross-check secondary savings accounts for savings accumulation.',
              'Verify monthly fixed expenses to ensure sufficient surplus for proposed loan EMI.',
            ],
            supportingTransactionIds: [sc.transactionId],
          });
          break; // Flag once per analysis
        }
      }
    }

    // 4. Declared Income Inconsistency
    if (customerDeclaredIncome > 0 && incomeIntel.averageMonthlyIncome > 0) {
      const discrepancyRatio = customerDeclaredIncome / incomeIntel.averageMonthlyIncome;
      if (discrepancyRatio >= 1.75 && customerDeclaredIncome - incomeIntel.averageMonthlyIncome > 20000) {
        signals.push({
          signalId: 'ANOM-INCOME-DISCREPANCY',
          severity: 'CRITICAL',
          category: 'INCOME_DISCREPANCY',
          title: 'Declared Income Substantially Exceeds Documented Bank Credits',
          fact: `Customer declared monthly income of INR ${customerDeclaredIncome.toLocaleString(
            'en-IN'
          )}, but average documented bank credits across statement period total INR ${incomeIntel.averageMonthlyIncome.toLocaleString(
            'en-IN'
          )} (discrepancy ratio: ${Math.round(discrepancyRatio * 10) / 10}x).`,
          anomaly: 'Material variance between self-declared income and verifiable bank account turnover.',
          interpretation: 'Risk of overstated income on loan application, affecting actual debt servicing capacity.',
          possibleExplanations: [
            'Borrower operates secondary active bank account where additional income is credited.',
            'Cash compensation components or cash business turnover.',
            'Borrower submitted net income vs gross income mismatch.',
          ],
          recommendedHumanAction: [
            'Require borrower to submit statements for all operational bank accounts.',
            'Request official salary slip or Form 16 / ITR to verify gross taxable earnings.',
          ],
          supportingTransactionIds: [],
        });
      }
    }

    // 5. High Cash Withdrawal Intensity
    const cashWithdrawals = transactions.filter((t) => t.category === 'CASH_WITHDRAWAL');
    const totalCashWithdrawals = cashWithdrawals.reduce((sum, t) => sum + t.amount, 0);
    if (cashFlowIntel.totalOutflows > 0) {
      const cashRatio = totalCashWithdrawals / cashFlowIntel.totalOutflows;
      if (cashRatio >= 0.45 && totalCashWithdrawals >= 30000) {
        signals.push({
          signalId: 'ANOM-CASH-INTENSITY',
          severity: 'MEDIUM',
          category: 'CASH_INTENSITY',
          title: 'High Cash Withdrawal Intensity (>45% of Outflows)',
          fact: `Physical cash withdrawals total INR ${totalCashWithdrawals.toLocaleString(
            'en-IN'
          )} (${Math.round(cashRatio * 100)}% of total debit outflows) across ${cashWithdrawals.length} ATM/teller transaction(s).`,
          anomaly: 'Unusually high proportion of funds liquidated into unmonitored physical cash.',
          interpretation: 'Difficult to ascertain true expense breakdown and debt servicing habits due to cash disintermediation.',
          possibleExplanations: [
            'Household operating primarily in local cash economy for rent and domestic expenses.',
            'Business petty cash management.',
          ],
          recommendedHumanAction: [
            'Ascertain local business/household expense profile during field verification.',
          ],
          supportingTransactionIds: cashWithdrawals.slice(0, 5).map((t) => t.transactionId),
        });
      }
    }

    return signals;
  }
}
