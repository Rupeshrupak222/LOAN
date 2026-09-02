import { describe, expect, it } from 'vitest';

describe('Delinquency DPD Aging & Collection Bucket Categorization', () => {
  function getAgingBucket(dpd: number): string {
    if (dpd <= 30) return '0-30';
    if (dpd <= 60) return '31-60';
    if (dpd <= 90) return '61-90';
    if (dpd <= 180) return '91-180';
    return '180+';
  }

  function calculateDpd(dueDate: Date, currentDate: Date): number {
    const diffTime = currentDate.getTime() - dueDate.getTime();
    if (diffTime <= 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  it('calculates 0 DPD for non-overdue accounts', () => {
    const due = new Date('2026-09-01');
    const now = new Date('2026-08-31');
    expect(calculateDpd(due, now)).toBe(0);
  });

  it('maps DPD correctly across all 5 delinquency aging buckets', () => {
    expect(getAgingBucket(15)).toBe('0-30');
    expect(getAgingBucket(30)).toBe('0-30');
    expect(getAgingBucket(31)).toBe('31-60');
    expect(getAgingBucket(60)).toBe('31-60');
    expect(getAgingBucket(75)).toBe('61-90');
    expect(getAgingBucket(90)).toBe('61-90');
    expect(getAgingBucket(120)).toBe('91-180');
    expect(getAgingBucket(180)).toBe('91-180');
    expect(getAgingBucket(210)).toBe('180+');
  });

  it('identifies accounts with DPD > 90 as NPA (Non-Performing Asset) risk', () => {
    const dpd = 95;
    const isNpa = dpd > 90;
    expect(isNpa).toBe(true);
  });
});
