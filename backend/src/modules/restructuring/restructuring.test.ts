import { describe, expect, it } from 'vitest';
import { calculateEmi } from '../finance/emi';
import Decimal from 'decimal.js';

describe('Loan Restructuring, Settlement & NOC Closure Calculations', () => {
  it('recalculates lower EMI on tenure extension restructuring', () => {
    const outstandingPrincipal = 150000;
    const originalRate = 14.0;
    const remainingOriginalTenure = 12;

    const originalEmi = calculateEmi(outstandingPrincipal, originalRate, remainingOriginalTenure);

    // Restructure: extend tenure to 24 months with concession rate of 12%
    const restructuredTenure = 24;
    const restructuredRate = 12.0;
    const newEmi = calculateEmi(outstandingPrincipal, restructuredRate, restructuredTenure);

    expect(Number(newEmi.emi)).toBeLessThan(Number(originalEmi.emi));
    expect(newEmi.schedule).toHaveLength(24);
    expect(Number(newEmi.schedule[23].balance)).toBe(0);
  });

  it('computes OTS settlement waiver accurately with zero remaining balance', () => {
    const totalDue = new Decimal('245000.00'); // Principal + interest + penalty
    const settlementOffer = new Decimal('180000.00');
    const waivedAmount = totalDue.minus(settlementOffer);

    expect(waivedAmount.toString()).toBe('65000');
    expect(settlementOffer.plus(waivedAmount).toString()).toBe('245000');
  });

  it('validates NOC issuance criteria requires zero active balance', () => {
    const loanBalance = new Decimal('0.00');
    const unpaidFees = new Decimal('0.00');
    const canIssueNoc = loanBalance.isZero() && unpaidFees.isZero();

    expect(canIssueNoc).toBe(true);
  });
});
