import Decimal from 'decimal.js';

// Centralized money service. All monetary math goes through here.
// Rounding: half-up to 2 decimals for currency amounts.
Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

export type MoneyInput = string | number | Decimal;

export const Money = {
  of(value: MoneyInput): Decimal {
    return new Decimal(value ?? 0);
  },

  add(a: MoneyInput, b: MoneyInput): Decimal {
    return new Decimal(a).plus(b);
  },

  subtract(a: MoneyInput, b: MoneyInput): Decimal {
    return new Decimal(a).minus(b);
  },

  multiply(a: MoneyInput, b: MoneyInput): Decimal {
    return new Decimal(a).times(b);
  },

  divide(a: MoneyInput, b: MoneyInput): Decimal {
    return new Decimal(a).dividedBy(b);
  },

  /** Round to currency (2 dp). */
  round(value: MoneyInput): Decimal {
    return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  },

  /** String suitable for Prisma Decimal columns. */
  toDb(value: MoneyInput): string {
    return Money.round(value).toFixed(2);
  },

  isZero(value: MoneyInput): boolean {
    return new Decimal(value).isZero();
  },

  isNegative(value: MoneyInput): boolean {
    return new Decimal(value).isNegative();
  },

  max(a: MoneyInput, b: MoneyInput): Decimal {
    return Decimal.max(new Decimal(a), new Decimal(b));
  },
};
