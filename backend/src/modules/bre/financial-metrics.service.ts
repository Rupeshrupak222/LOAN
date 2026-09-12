import Decimal from 'decimal.js';

export interface FinancialCalculationResult {
  proposedEmi: number;
  foirPct: number;
  dtiPct: number;
  disposableIncome: number;
  maxEligibleAmountByIncome: number;
  maxEligibleAmountByRisk: number;
  maxEligibleAmountByProduct: number;
  finalEligibleAmount: number;
}

export class FinancialMetricsService {
  /**
   * Calculates monthly EMI using Decimal.js for precision financial accuracy.
   */
  public calculateProposedEmi(
    principal: number,
    annualRatePct: number,
    tenureMonths: number,
    interestModel: string = 'REDUCING_BALANCE'
  ): number {
    if (principal <= 0 || tenureMonths <= 0) return 0;
    if (annualRatePct === 0) {
      return new Decimal(principal).dividedBy(tenureMonths).toDecimalPlaces(2).toNumber();
    }

    const p = new Decimal(principal);
    const n = new Decimal(tenureMonths);

    if (interestModel === 'FIXED_FLAT') {
      const annualRate = new Decimal(annualRatePct).dividedBy(100);
      const tenureYears = n.dividedBy(12);
      const totalInterest = p.times(annualRate).times(tenureYears);
      const totalRepayable = p.plus(totalInterest);
      return totalRepayable.dividedBy(n).toDecimalPlaces(2).toNumber();
    }

    // Standard Reducing Balance Formula: P * r * (1+r)^n / ((1+r)^n - 1)
    const monthlyRate = new Decimal(annualRatePct).dividedBy(12).dividedBy(100);
    const onePlusR = new Decimal(1).plus(monthlyRate);
    const factor = onePlusR.pow(tenureMonths);
    const numerator = p.times(monthlyRate).times(factor);
    const denominator = factor.minus(1);

    if (denominator.isZero()) return 0;
    return numerator.dividedBy(denominator).toDecimalPlaces(2).toNumber();
  }

  /**
   * Calculates Fixed Obligation to Income Ratio (FOIR %).
   * FOIR = (Existing Monthly Obligations + Proposed EMI) / Net Monthly Income * 100
   */
  public calculateFoir(
    existingMonthlyObligations: number,
    proposedEmi: number,
    monthlyIncome: number
  ): number {
    if (monthlyIncome <= 0) return 100;
    const totalObligations = new Decimal(existingMonthlyObligations).plus(proposedEmi);
    const foir = totalObligations.dividedBy(monthlyIncome).times(100);
    return foir.toDecimalPlaces(2).toNumber();
  }

  /**
   * Calculates Debt to Income (DTI) ratio.
   */
  public calculateDti(
    existingMonthlyObligations: number,
    proposedEmi: number,
    monthlyIncome: number
  ): number {
    if (monthlyIncome <= 0) return 1;
    const totalAnnualDebt = new Decimal(existingMonthlyObligations).plus(proposedEmi).times(12);
    const annualIncome = new Decimal(monthlyIncome).times(12);
    return totalAnnualDebt.dividedBy(annualIncome).toDecimalPlaces(3).toNumber();
  }

  /**
   * Calculates Net Disposable Income after debt obligations and living expense allowances.
   */
  public calculateDisposableIncome(
    monthlyIncome: number,
    existingMonthlyObligations: number,
    proposedEmi: number,
    livingExpenseRate: number = 0.25 // Default 25% minimum living cost allocation
  ): number {
    const income = new Decimal(monthlyIncome);
    const existing = new Decimal(existingMonthlyObligations);
    const emi = new Decimal(proposedEmi);
    const livingAllowance = income.times(livingExpenseRate);

    const disposable = income.minus(existing).minus(emi).minus(livingAllowance);
    return disposable.toDecimalPlaces(2).toNumber();
  }

  /**
   * Calculates Multi-Dimensional Maximum Loan Amount Eligibility:
   * 1. Income-based maximum (FOIR cap headroom converted to principal)
   * 2. Product-bound maximum
   * 3. Risk-adjusted maximum
   */
  public calculateAllMetrics(
    requestedAmount: number,
    tenureMonths: number,
    monthlyIncome: number,
    existingObligations: number,
    annualRatePct: number,
    maxFoirPct: number = 55,
    productMinAmount: number = 5000,
    productMaxAmount: number = 2500000,
    riskMultiplier: number = 1.0,
    interestModel: string = 'REDUCING_BALANCE'
  ): FinancialCalculationResult {
    const proposedEmi = this.calculateProposedEmi(
      requestedAmount,
      annualRatePct,
      tenureMonths,
      interestModel
    );

    const foirPct = this.calculateFoir(existingObligations, proposedEmi, monthlyIncome);
    const dtiPct = this.calculateDti(existingObligations, proposedEmi, monthlyIncome);
    const disposableIncome = this.calculateDisposableIncome(
      monthlyIncome,
      existingObligations,
      proposedEmi
    );

    // Calculate maximum allowable EMI under FOIR policy limit
    const maxAllowableObligation = new Decimal(monthlyIncome).times(new Decimal(maxFoirPct).dividedBy(100));
    const maxAllowableEmi = Decimal.max(0, maxAllowableObligation.minus(existingObligations));

    // Convert maximum allowable EMI to maximum principal loan amount
    let maxPrincipalByIncome = requestedAmount;
    if (annualRatePct > 0 && tenureMonths > 0 && maxAllowableEmi.greaterThan(0)) {
      const monthlyRate = new Decimal(annualRatePct).dividedBy(12).dividedBy(100);
      const onePlusR = new Decimal(1).plus(monthlyRate);
      const factor = onePlusR.pow(tenureMonths);
      const denominator = monthlyRate.times(factor);
      const numerator = factor.minus(1);

      if (!denominator.isZero()) {
        maxPrincipalByIncome = maxAllowableEmi.times(numerator).dividedBy(denominator).toDecimalPlaces(0).toNumber();
      }
    }

    const maxEligibleAmountByIncome = Math.max(0, Math.round(maxPrincipalByIncome));
    const maxEligibleAmountByProduct = productMaxAmount;
    const maxEligibleAmountByRisk = Math.round(maxEligibleAmountByIncome * riskMultiplier);

    // Final eligible amount is the minimum of income capacity, product limit, and risk tier ceiling
    let finalEligibleAmount = Math.min(
      maxEligibleAmountByIncome,
      maxEligibleAmountByProduct,
      maxEligibleAmountByRisk
    );

    // Round to nearest 1,000 INR
    finalEligibleAmount = Math.max(0, Math.floor(finalEligibleAmount / 1000) * 1000);

    return {
      proposedEmi,
      foirPct,
      dtiPct,
      disposableIncome,
      maxEligibleAmountByIncome,
      maxEligibleAmountByRisk,
      maxEligibleAmountByProduct,
      finalEligibleAmount,
    };
  }
}

export const financialMetricsService = new FinancialMetricsService();
