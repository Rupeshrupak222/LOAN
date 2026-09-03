import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../../config/prisma';
import { decisionSimulatorService } from './decision-simulator.service';
import { ForbiddenError, NotFoundError } from '../../common/errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-sim-1' }),
}));

vi.mock('../ai/gemini.service', () => ({
  generateGeminiContent: vi.fn().mockResolvedValue({
    text: JSON.stringify({
      summary: 'Reducing requested loan amount by INR 30,000 enhances monthly affordability and drops FOIR into safe territory.',
      tradeoffs: ['Monthly EMI drops by INR 1,450.', 'Borrower retains higher disposable cash cushion.'],
      underwriterTakeaway: 'Recommend sanctioning the application at simulated lower amount.',
    }),
    model: 'gemma-4-31b-it',
  }),
}));

describe('Step 16: Decision Simulator (What-If Engine)', () => {
  const mockApplication = {
    id: 'app-sim-test-1',
    applicationNo: 'APP-SIM-001',
    requestedAmount: 100000,
    tenureMonths: 12,
    customerId: 'cust-sim-1',
    customer: {
      firstName: 'Vikram',
      lastName: 'Malhotra',
      monthlyIncome: 60000,
      existingObligations: 10000,
      employmentType: 'SALARIED',
      employmentDetails: [{ workExperienceYears: 4 }],
      documents: [],
      kycStatus: 'VERIFIED',
      loans: [],
    },
    product: {
      name: 'Personal Prime',
      interestRate: 14.5,
      productType: 'PERSONAL',
      maxAmount: 500000,
    },
    eligibilityAssessment: {
      result: 'ELIGIBLE',
      factors: [],
    },
    riskAssessment: {
      score: 78,
      category: 'LOW',
    },
  };

  beforeEach(() => {
    decisionSimulatorService.clearForTesting();
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);
  });

  describe('1. Non-Destructive Simulation Execution', () => {
    it('executes simulation without mutating actual application records', async () => {
      const staffActor = { id: 'staff-1', email: 'analyst@adyapan.dev', roles: ['CREDIT_ANALYST'] };

      const result = await decisionSimulatorService.runSimulation(
        {
          applicationId: 'app-sim-test-1',
          hypotheticalInputs: {
            requestedAmount: 70000, // Reduced from 100k
            tenureMonths: 24, // Extended from 12
          },
        },
        staffActor
      );

      expect(result.simulationId).toBeDefined();
      expect(result.isHypothetical).toBe(true);

      // Verify Actual State preserved
      expect(result.metrics.requestedAmount.actual).toBe(100000);
      expect(result.metrics.tenureMonths.actual).toBe(12);

      // Verify Simulated State reflects hypothetical input
      expect(result.metrics.requestedAmount.simulated).toBe(70000);
      expect(result.metrics.tenureMonths.simulated).toBe(24);

      // Verify Delta math
      expect(result.metrics.requestedAmount.delta).toBe(-30000);
      expect(result.metrics.requestedAmount.improved).toBe(true);
      expect(result.metrics.emi.simulated).toBeLessThan(result.metrics.emi.actual);
      expect(result.metrics.foirPercent.simulated).toBeLessThan(result.metrics.foirPercent.actual);

      // Database mock findUnique should have been called read-only; no update calls
      expect(prisma.loanApplication.findUnique).toHaveBeenCalledWith({
        where: { id: 'app-sim-test-1' },
        include: expect.any(Object),
      });
    });

    it('generates advisory tradeoffs and condition impacts', async () => {
      const staffActor = { id: 'staff-1', email: 'analyst@adyapan.dev', roles: ['UNDERWRITER'] };

      const result = await decisionSimulatorService.runSimulation(
        {
          applicationId: 'app-sim-test-1',
          hypotheticalInputs: {
            requestedAmount: 80000,
            tenureMonths: 18,
          },
        },
        staffActor
      );

      expect(result.changedConditions.length).toBeGreaterThan(0);
      expect(result.aiExplanation).toBeDefined();
      expect(result.aiExplanation?.summary).toContain('FOIR');
      expect(result.aiExplanation?.tradeoffs.length).toBeGreaterThanOrEqual(2);
    });

    it('flags warnings when hypothetical scenario violates policy thresholds', async () => {
      const staffActor = { id: 'staff-1', email: 'analyst@adyapan.dev', roles: ['UNDERWRITER'] };

      // Request massive amount that spikes FOIR
      const result = await decisionSimulatorService.runSimulation(
        {
          applicationId: 'app-sim-test-1',
          hypotheticalInputs: {
            requestedAmount: 450000,
            existingObligations: 25000,
          },
        },
        staffActor
      );

      expect(result.metrics.foirPercent.simulated).toBeGreaterThan(55);
      expect(result.warnings.some((w) => w.includes('55% policy ceiling'))).toBe(true);
    });
  });

  describe('2. Snapshot Persistence & Retrieval', () => {
    it('saves a simulation snapshot and allows retrieval by application', async () => {
      const staffActor = { id: 'staff-1', email: 'underwriter@adyapan.dev', roles: ['UNDERWRITER'] };

      const simResult = await decisionSimulatorService.runSimulation(
        {
          applicationId: 'app-sim-test-1',
          hypotheticalInputs: { requestedAmount: 75000 },
        },
        staffActor
      );

      const snapshot = await decisionSimulatorService.saveSimulation(
        simResult.simulationId,
        'Conservative Scenario 75k',
        staffActor
      );

      expect(snapshot.id).toBeDefined();
      expect(snapshot.name).toBe('Conservative Scenario 75k');
      expect(snapshot.createdBy).toBe('underwriter@adyapan.dev');
      expect(snapshot.assumptions.requestedAmount).toBe(75000);

      // List snapshots for application
      const list = decisionSimulatorService.listSavedSimulations('app-sim-test-1', staffActor);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(snapshot.id);

      // Get single snapshot
      const retrieved = decisionSimulatorService.getSavedSimulation(snapshot.id, staffActor);
      expect(retrieved.id).toBe(snapshot.id);
    });
  });

  describe('3. Strict Borrower Isolation', () => {
    const borrowerActor = { id: 'borrower-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] };

    it('forbids borrower role from executing simulations', async () => {
      await expect(
        decisionSimulatorService.runSimulation(
          { applicationId: 'app-sim-test-1', hypotheticalInputs: {} },
          borrowerActor
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('forbids borrower role from saving simulations', async () => {
      await expect(
        decisionSimulatorService.saveSimulation('sim-123', 'Test', borrowerActor)
      ).rejects.toThrow(ForbiddenError);
    });

    it('forbids borrower role from listing saved simulations', () => {
      expect(() =>
        decisionSimulatorService.listSavedSimulations('app-sim-test-1', borrowerActor)
      ).toThrow(ForbiddenError);
    });
  });
});
