import { NormalizedBankTransaction, IncomeIntelligence } from './bank-intelligence.types';

export class IncomeIntelligenceService {
  /**
   * Analyzes credit transactions to extract income consistency, recurring salary, and stability metrics.
   */
  public static analyze(
    transactions: NormalizedBankTransaction[],
    totalMonthsInPeriod: number
  ): IncomeIntelligence {
    const credits = transactions.filter((t) => t.transactionType === 'CREDIT');
    const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
    const totalCreditsCount = credits.length;

    // Group credits by month (YYYY-MM)
    const monthlyCreditsMap = new Map<string, number>();
    for (const c of credits) {
      const month = c.transactionDate.slice(0, 7);
      monthlyCreditsMap.set(month, (monthlyCreditsMap.get(month) || 0) + c.amount);
    }

    const monthsCount = Math.max(monthlyCreditsMap.size, totalMonthsInPeriod, 1);
    const monthlyInflows = Array.from(monthlyCreditsMap.values());

    // Average & Median Monthly Income
    const averageMonthlyIncome = Math.round(totalCredits / monthsCount);
    const sortedInflows = [...monthlyInflows].sort((a, b) => a - b);
    const medianMonthlyIncome =
      sortedInflows.length === 0
        ? 0
        : sortedInflows.length % 2 === 1
        ? sortedInflows[Math.floor(sortedInflows.length / 2)]
        : Math.round(
            (sortedInflows[sortedInflows.length / 2 - 1] + sortedInflows[sortedInflows.length / 2]) / 2
          );

    // Identify Salary Credits strictly by category or salary keywords
    const salaryCredits = credits.filter((t) => {
      if (t.category === 'SALARY') return true;
      const text = t.description.toUpperCase();
      return (
        text.includes('SALARY') ||
        text.includes('PAYROLL') ||
        text.includes('CMS/SAL') ||
        text.includes('SAL CR')
      );
    });

    const detectedSalaryCreditsCount = salaryCredits.length;
    const estimatedRecurringSalary =
      detectedSalaryCreditsCount > 0
        ? Math.round(salaryCredits.reduce((s, c) => s + c.amount, 0) / detectedSalaryCreditsCount)
        : 0;

    // Salary Frequency
    let salaryFrequency: 'MONTHLY' | 'BI_WEEKLY' | 'IRREGULAR' | 'NONE_DETECTED' = 'NONE_DETECTED';
    if (detectedSalaryCreditsCount >= monthsCount * 1.8) {
      salaryFrequency = 'BI_WEEKLY';
    } else if (detectedSalaryCreditsCount >= Math.max(monthsCount * 0.7, 1)) {
      salaryFrequency = 'MONTHLY';
    } else if (detectedSalaryCreditsCount > 0) {
      salaryFrequency = 'IRREGULAR';
    }

    // Volatility (Coefficient of Variation: stdDev / mean)
    let incomeVolatilityCoV = 0;
    if (monthlyInflows.length > 1 && averageMonthlyIncome > 0) {
      const variance =
        monthlyInflows.reduce((sum, val) => sum + Math.pow(val - averageMonthlyIncome, 2), 0) /
        monthlyInflows.length;
      const stdDev = Math.sqrt(variance);
      incomeVolatilityCoV = Math.round((stdDev / averageMonthlyIncome) * 100) / 100;
    }

    // Stability Score (0-100)
    let stabilityScore = 80;
    if (salaryFrequency === 'MONTHLY') stabilityScore += 15;
    else if (salaryFrequency === 'BI_WEEKLY') stabilityScore += 10;
    else if (salaryFrequency === 'NONE_DETECTED') stabilityScore -= 30;

    stabilityScore -= Math.min(Math.round(incomeVolatilityCoV * 40), 50);
    const incomeStabilityScore = Math.max(10, Math.min(100, stabilityScore));

    // Income Trajectory (First half vs Second half)
    let incomeTrajectory: 'GROWING' | 'STABLE' | 'DECLINING' | 'VOLATILE' = 'STABLE';
    if (incomeVolatilityCoV > 0.45) {
      incomeTrajectory = 'VOLATILE';
    } else if (monthlyInflows.length >= 4) {
      const half = Math.floor(monthlyInflows.length / 2);
      const firstHalfAvg = monthlyInflows.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const secondHalfAvg =
        monthlyInflows.slice(half).reduce((a, b) => a + b, 0) / (monthlyInflows.length - half);

      if (secondHalfAvg > firstHalfAvg * 1.12) {
        incomeTrajectory = 'GROWING';
      } else if (secondHalfAvg < firstHalfAvg * 0.88) {
        incomeTrajectory = 'DECLINING';
      }
    }

    // Primary Employer Detection
    let isPrimaryEmployerIdentified = false;
    let primaryEmployerName: string | undefined;

    if (salaryCredits.length > 0) {
      const employerFrequency = new Map<string, number>();
      for (const sc of salaryCredits) {
        // Look for company keywords in narration
        const cleaned = sc.description
          .replace(/^(SALARY|PAYROLL|CMS\/|ACH CR|NEFT|RTGS|IMPS|BY TRANSFER|DIR DEP)[\s\/:_-]*/i, '')
          .split(/[\/\-_]/)[0]
          .trim();

        if (cleaned.length > 3) {
          employerFrequency.set(cleaned, (employerFrequency.get(cleaned) || 0) + 1);
        }
      }

      let topEmployer = '';
      let maxCount = 0;
      for (const [emp, count] of employerFrequency.entries()) {
        if (count > maxCount) {
          maxCount = count;
          topEmployer = emp;
        }
      }

      if (topEmployer && maxCount >= 2) {
        isPrimaryEmployerIdentified = true;
        primaryEmployerName = topEmployer;
      }
    }

    // Structured Observations (Separating FACT from INFERENCE)
    const observations: string[] = [];
    observations.push(
      `[FACT] Recorded total inflows of INR ${totalCredits.toLocaleString(
        'en-IN'
      )} across ${monthsCount} month(s) with an average monthly credit of INR ${averageMonthlyIncome.toLocaleString(
        'en-IN'
      )}.`
    );

    if (detectedSalaryCreditsCount > 0) {
      observations.push(
        `[FACT] Identified ${detectedSalaryCreditsCount} recurring payroll credits with estimated salary of INR ${estimatedRecurringSalary.toLocaleString(
          'en-IN'
        )}.`
      );
    } else {
      observations.push(
        `[INFERENCE] No formal corporate payroll narration patterns identified. Inflows consist primarily of general credits or business/P2P transfers.`
      );
    }

    if (isPrimaryEmployerIdentified && primaryEmployerName) {
      observations.push(
        `[INFERENCE] Primary corporate remitters match employer pattern '${primaryEmployerName}'.`
      );
    }

    if (incomeTrajectory === 'GROWING') {
      observations.push(`[INFERENCE] Income trajectory is growing (+12% or greater between periods).`);
    } else if (incomeTrajectory === 'DECLINING') {
      observations.push(`[INFERENCE] Warning: Income trajectory indicates a declining inflow trend.`);
    }

    return {
      totalCredits,
      totalCreditsCount,
      detectedSalaryCreditsCount,
      salaryFrequency,
      averageMonthlyIncome,
      medianMonthlyIncome,
      estimatedRecurringSalary,
      incomeStabilityScore,
      incomeVolatilityCoV,
      incomeTrajectory,
      isPrimaryEmployerIdentified,
      primaryEmployerName,
      salaryDatesWindow: detectedSalaryCreditsCount > 0 ? '28th - 5th of each month' : 'Not Detected',
      observations,
    };
  }
}
