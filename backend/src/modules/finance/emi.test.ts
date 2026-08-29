import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';
import { calculateEmi } from './emi';

describe('calculateEmi', () => {
  it('computes a standard reducing-balance EMI', () => {
    // 100000 @ 12% for 12 months -> ~8884.88/month
    const result = calculateEmi(100000, 12, 12);
    expect(Number(result.emi)).toBeCloseTo(8884.88, 2);
    expect(result.schedule).toHaveLength(12);
  });

  it('fully amortizes to a zero closing balance', () => {
    const result = calculateEmi(500000, 10.5, 24);
    const last = result.schedule[result.schedule.length - 1];
    expect(Number(last.balance)).toBe(0);
  });

  it('sum of principal equals the original principal', () => {
    const result = calculateEmi(250000, 14, 36);
    const totalPrincipal = result.schedule.reduce(
      (acc, r) => acc.plus(r.principal),
      new Decimal(0),
    );
    expect(totalPrincipal.toFixed(2)).toBe('250000.00');
  });

  it('handles zero-interest loans', () => {
    const result = calculateEmi(12000, 0, 12);
    expect(result.emi).toBe('1000.00');
    expect(result.totalInterest).toBe('0.00');
    expect(result.totalRepayment).toBe('12000.00');
  });

  it('throws on invalid tenure', () => {
    expect(() => calculateEmi(1000, 10, 0)).toThrow();
  });
});
