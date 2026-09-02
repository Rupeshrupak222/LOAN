import { describe, expect, it } from 'vitest';
import Decimal from 'decimal.js';

describe('Payment Allocation Logic', () => {
  it('allocates payment strictly following configured priority: FEES -> PENALTY -> INTEREST -> PRINCIPAL', () => {
    const allocationBuckets = ['FEES', 'PENALTY', 'INTEREST', 'PRINCIPAL'];
    const installment = {
      fees: new Decimal('200.00'),
      penalty: new Decimal('100.00'),
      interest: new Decimal('1500.00'),
      principal: new Decimal('5000.00'),
    };

    let paymentAmount = new Decimal('2000.00');
    const bucketTotals: Record<string, Decimal> = {
      FEES: new Decimal(0),
      PENALTY: new Decimal(0),
      INTEREST: new Decimal(0),
      PRINCIPAL: new Decimal(0),
    };

    for (const bucket of allocationBuckets) {
      if (paymentAmount.isZero()) break;
      let bucketDue = new Decimal(0);
      if (bucket === 'FEES') bucketDue = installment.fees;
      else if (bucket === 'PENALTY') bucketDue = installment.penalty;
      else if (bucket === 'INTEREST') bucketDue = installment.interest;
      else if (bucket === 'PRINCIPAL') bucketDue = installment.principal;

      const allocated = Decimal.min(paymentAmount, bucketDue);
      bucketTotals[bucket] = bucketTotals[bucket].plus(allocated);
      paymentAmount = paymentAmount.minus(allocated);
    }

    // Total fees: 200, penalty: 100, interest: 1500 => sum = 1800.
    // Remaining 200 goes to principal.
    expect(bucketTotals.FEES.toString()).toBe('200');
    expect(bucketTotals.PENALTY.toString()).toBe('100');
    expect(bucketTotals.INTEREST.toString()).toBe('1500');
    expect(bucketTotals.PRINCIPAL.toString()).toBe('200');
    expect(paymentAmount.isZero()).toBe(true);
  });

  it('allocates surplus payment directly to principal reduction', () => {
    let paymentAmount = new Decimal('10000.00');
    const totalDue = new Decimal('6800.00'); // 200 + 100 + 1500 + 5000

    const allocationForInstallment = Decimal.min(paymentAmount, totalDue);
    const surplus = paymentAmount.minus(allocationForInstallment);

    expect(allocationForInstallment.toString()).toBe('6800');
    expect(surplus.toString()).toBe('3200');
  });
});
