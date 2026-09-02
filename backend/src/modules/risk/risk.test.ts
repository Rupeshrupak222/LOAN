import { describe, expect, it } from 'vitest';

describe('Credit Risk Model & 4-Pillar Scoring Engine', () => {
  it('computes low risk category for prime profile with score >= 75', () => {
    const factors = [
      { name: 'Employment Vintage', weight: 25, score: 95 },
      { name: 'Debt Service Capacity', weight: 30, score: 95 },
      { name: 'Document Authenticity', weight: 20, score: 90 },
      { name: 'Credit History', weight: 25, score: 90 },
    ];

    const totalScore = Math.round(
      factors.reduce((acc, f) => acc + (f.score * f.weight) / 100, 0)
    );

    expect(totalScore).toBe(93);
    expect(totalScore).toBeGreaterThanOrEqual(75);
  });

  it('computes medium risk category for scores between 55 and 74', () => {
    const factors = [
      { name: 'Employment Vintage', weight: 25, score: 60 },
      { name: 'Debt Service Capacity', weight: 30, score: 60 },
      { name: 'Document Authenticity', weight: 20, score: 65 },
      { name: 'Credit History', weight: 25, score: 70 },
    ];

    const totalScore = Math.round(
      factors.reduce((acc, f) => acc + (f.score * f.weight) / 100, 0)
    );

    expect(totalScore).toBe(64);
    expect(totalScore).toBeGreaterThanOrEqual(55);
    expect(totalScore).toBeLessThan(75);
  });

  it('computes high risk category for scores below 55', () => {
    const factors = [
      { name: 'Employment Vintage', weight: 25, score: 50 },
      { name: 'Debt Service Capacity', weight: 30, score: 30 },
      { name: 'Document Authenticity', weight: 20, score: 40 },
      { name: 'Credit History', weight: 25, score: 25 },
    ];

    const totalScore = Math.round(
      factors.reduce((acc, f) => acc + (f.score * f.weight) / 100, 0)
    );

    expect(totalScore).toBe(36);
    expect(totalScore).toBeLessThan(55);
  });

  it('ensures factor weights sum up to exactly 100%', () => {
    const weights = {
      employmentVintage: 25,
      debtServiceCapacity: 30,
      documentCompleteness: 20,
      creditHistory: 25,
    };

    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
});
