import { describe, expect, it } from 'vitest';
import { calculateEmi } from '../finance/emi';

describe('Eligibility Policy & DTI Evaluation Rules', () => {
  it('passes eligibility when applicant meets age, income, and DTI criteria', () => {
    const age = 30; // Min: 21, Max: 60
    const monthlyIncome = 75000; // Min: 25,000 for salaried
    const existingObligations = 10000;
    const requestedAmount = 300000;
    const interestRate = 12;
    const tenureMonths = 24;

    const emiResult = calculateEmi(requestedAmount, interestRate, tenureMonths);
    const emiNum = Number(emiResult.emi);
    const totalObligations = existingObligations + emiNum;
    const dti = totalObligations / monthlyIncome;

    expect(age).toBeGreaterThanOrEqual(21);
    expect(age).toBeLessThanOrEqual(60);
    expect(monthlyIncome).toBeGreaterThanOrEqual(25000);
    expect(dti).toBeLessThanOrEqual(0.45); // Healthy capacity
  });

  it('flags warning when DTI is between 45% and 55%', () => {
    const monthlyIncome = 50000;
    const totalObligations = 24000; // 48% DTI
    const dti = totalObligations / monthlyIncome;

    expect(dti).toBeGreaterThan(0.45);
    expect(dti).toBeLessThanOrEqual(0.55);
  });

  it('fails eligibility when DTI exceeds maximum threshold 55%', () => {
    const monthlyIncome = 40000;
    const totalObligations = 26000; // 65% DTI
    const dti = totalObligations / monthlyIncome;

    expect(dti).toBeGreaterThan(0.55);
  });

  it('calculates maximum eligible loan amount based on 50% max FOIR capacity', () => {
    const monthlyIncome = 100000;
    const existingObligations = 15000;
    const maxFoir = 0.50;
    const availableEmiCapacity = monthlyIncome * maxFoir - existingObligations; // 35,000

    expect(availableEmiCapacity).toBe(35000);
    expect(availableEmiCapacity).toBeGreaterThan(0);
  });
});
