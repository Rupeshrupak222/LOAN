import Decimal from 'decimal.js';
import { Money } from './money';

export interface AmortizationRow {
  emiNumber: number;
  principal: string;
  interest: string;
  emi: string;
  balance: string;
}

export interface EmiResult {
  emi: string;
  totalInterest: string;
  totalRepayment: string;
  schedule: AmortizationRow[];
}

/**
 * Reducing-balance EMI.
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)   where r = annualRate/12/100
 * Zero-interest loans fall back to straight principal division.
 */
export function calculateEmi(
  principalInput: number | string,
  annualRatePct: number | string,
  tenureMonths: number,
): EmiResult {
  if (tenureMonths <= 0) throw new Error('Tenure must be greater than 0');

  const principal = new Decimal(principalInput);
  const annualRate = new Decimal(annualRatePct);

  if (annualRate.isZero()) {
    const emi = Money.round(principal.dividedBy(tenureMonths));
    return buildZeroInterest(principal, emi, tenureMonths);
  }

  const monthlyRate = annualRate.dividedBy(12).dividedBy(100);
  const onePlusR = monthlyRate.plus(1);
  const pow = onePlusR.pow(tenureMonths);
  const emiExact = principal.times(monthlyRate).times(pow).dividedBy(pow.minus(1));
  const emi = Money.round(emiExact);

  const schedule: AmortizationRow[] = [];
  let balance = principal;
  let totalInterest = new Decimal(0);

  for (let i = 1; i <= tenureMonths; i++) {
    const interest = Money.round(balance.times(monthlyRate));
    let principalPart = Money.round(emi.minus(interest));
    // Final installment absorbs rounding remainder.
    if (i === tenureMonths) {
      principalPart = balance;
    }
    balance = Money.round(balance.minus(principalPart));
    if (balance.isNegative()) balance = new Decimal(0);
    totalInterest = totalInterest.plus(interest);

    schedule.push({
      emiNumber: i,
      principal: principalPart.toFixed(2),
      interest: interest.toFixed(2),
      emi: Money.round(principalPart.plus(interest)).toFixed(2),
      balance: balance.toFixed(2),
    });
  }

  const totalRepayment = principal.plus(totalInterest);
  return {
    emi: emi.toFixed(2),
    totalInterest: Money.round(totalInterest).toFixed(2),
    totalRepayment: Money.round(totalRepayment).toFixed(2),
    schedule,
  };
}

function buildZeroInterest(principal: Decimal, emi: Decimal, tenureMonths: number): EmiResult {
  const schedule: AmortizationRow[] = [];
  let balance = principal;
  for (let i = 1; i <= tenureMonths; i++) {
    let principalPart = emi;
    if (i === tenureMonths) principalPart = balance;
    balance = Money.round(balance.minus(principalPart));
    if (balance.isNegative()) balance = new Decimal(0);
    schedule.push({
      emiNumber: i,
      principal: principalPart.toFixed(2),
      interest: '0.00',
      emi: principalPart.toFixed(2),
      balance: balance.toFixed(2),
    });
  }
  return {
    emi: emi.toFixed(2),
    totalInterest: '0.00',
    totalRepayment: principal.toFixed(2),
    schedule,
  };
}
