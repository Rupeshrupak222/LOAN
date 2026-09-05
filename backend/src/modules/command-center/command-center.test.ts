import { describe, it, expect, vi, beforeEach } from 'vitest';
import { commandCenterService } from './command-center.service';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../common/errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-command-1' }),
}));

vi.mock('../../config/prisma', () => ({
  prisma: {
    loanApplication: {
      findMany: vi.fn().mockResolvedValue([
        { requestedAmount: 50000, status: 'SUBMITTED', createdAt: new Date().toISOString() },
        { requestedAmount: 150000, status: 'UNDER_REVIEW', createdAt: new Date(Date.now() - 200000000).toISOString() },
        {
          requestedAmount: 80000,
          status: 'APPROVED',
          createdAt: new Date().toISOString(),
          applicationNo: 'APP-EXP-01',
          customer: { firstName: 'Ravi', lastName: 'Kumar', phone: '9988776655' },
          loanProduct: { name: 'Personal Express' },
          underwritingData: { notes: 'Approved with committee risk exception sign-off' },
        },
      ]),
    },
    disbursement: {
      count: vi.fn().mockResolvedValue(3),
      findMany: vi.fn().mockResolvedValue([
        { amount: 100000, status: 'COMPLETED' },
        { amount: 250000, status: 'COMPLETED' },
      ]),
    },
    loan: {
      findMany: vi.fn().mockResolvedValue([
        { principal: 100000, outstandingPrincipal: 95000, collectionCases: [{ dpd: 0 }], status: 'ACTIVE' },
        { principal: 200000, outstandingPrincipal: 180000, collectionCases: [{ dpd: 35 }], status: 'ACTIVE' },
        { principal: 50000, outstandingPrincipal: 45000, collectionCases: [{ dpd: 95 }], status: 'ACTIVE' },
      ]),
    },
    payment: {
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 500000 } }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    branch: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'br-1',
          name: 'Delhi NCR Hub',
          code: 'DEL-01',
          loans: [
            { principal: 100000, outstandingPrincipal: 95000 },
            { principal: 200000, outstandingPrincipal: 180000 },
          ],
        },
      ]),
    },
  },
}));

describe('Step 20: AI Command Center & Autonomous Operations Monitor', () => {
  const execActor = { id: 'exec-1', email: 'director@adyapan.dev', roles: ['SUPER_ADMIN'] };
  const borrowerActor = { id: 'borrower-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] };

  describe('1. Operational Health Telemetry Aggregation', () => {
    it('aggregates system-wide operational health across all 6 core pillars deterministically', async () => {
      const health = await commandCenterService.getOperationalHealth(execActor);

      expect(health.timestamp).toBeDefined();
      // Pillar 1: Originations
      expect(health.originationsVelocity.totalApplications).toBe(3);
      expect(health.originationsVelocity.totalRequestedAmount).toBe(280000);
      // Pillar 2: Underwriting
      expect(health.underwritingBottlenecks.pendingReview).toBe(2);
      expect(health.underwritingBottlenecks.staleOver48h).toBe(1);
      // Pillar 3: Disbursements
      expect(health.disbursementsQueue.pendingDisbursements).toBe(3);
      expect(health.disbursementsQueue.totalDisbursedVolume).toBe(350000);
      // Pillar 4: Portfolio PAR
      expect(health.portfolioDelinquency.totalActivePrincipal).toBe(320000);
      expect(health.portfolioDelinquency.par30Amount).toBe(225000); // dpd 35 + 95
      expect(health.portfolioDelinquency.par90Amount).toBe(45000); // dpd 95
      expect(health.portfolioDelinquency.par30RatePct).toBeGreaterThan(0);
      // Pillar 5 & 6: Integration & Recon
      expect(health.integrationHealth.overallUptimePct).toBeDefined();
      expect(health.reconciliationSummary).toBeDefined();
    });
  });

  describe('2. Natural Language Executive Queries', () => {
    it('answers branch disbursement volume queries with live breakdown', async () => {
      const res = await commandCenterService.executeExecutiveQuery(
        'What was our disbursement volume this week by branch?',
        execActor
      );

      expect(res.intent).toBe('DISBURSEMENT_BY_BRANCH');
      expect(res.answerSummary).toContain('Total active loan volume');
      expect(res.structuredMetrics.totalBranchesReporting).toBe(1);
      expect(res.evidenceTable?.length).toBeGreaterThan(0);
    });

    it('answers high-risk loans approved with exceptions queries', async () => {
      const res = await commandCenterService.executeExecutiveQuery(
        'Show me all high-risk loans approved with exceptions.',
        execActor
      );

      expect(res.intent).toBe('HIGH_RISK_EXCEPTIONS');
      expect(res.structuredMetrics.exceptionCount).toBeGreaterThan(0);
      expect(res.evidenceTable?.[0].riskCategory).toBe('HIGH_RISK_EXCEPTION');
    });

    it('answers portfolio PAR 30 and PAR 90 queries with exact delinquency math', async () => {
      const res = await commandCenterService.executeExecutiveQuery(
        'What is our current portfolio PAR 30 and PAR 90?',
        execActor
      );

      expect(res.intent).toBe('PORTFOLIO_PAR_METRICS');
      expect(res.structuredMetrics.totalActivePrincipal).toBe(320000);
      expect(res.structuredMetrics.par30RatePct).toBeDefined();
      expect(res.structuredMetrics.par90RatePct).toBeDefined();
    });
  });

  describe('3. Autonomous Policy Anomaly Detector & Human Oversight', () => {
    it('runs autonomous operational scan and detects explainable anomaly signals', async () => {
      const anomalies = await commandCenterService.runAutonomousScan(execActor);
      expect(anomalies.length).toBeGreaterThanOrEqual(3);

      const clusterAnom = anomalies.find((a) => a.patternType === 'APPROVAL_LIMIT_CLUSTERING');
      expect(clusterAnom).toBeDefined();
      expect(clusterAnom?.severity).toBe('HIGH');
      expect(clusterAnom?.explainableEvidence).toBeDefined();
      expect(clusterAnom?.recommendedAction).toBeDefined();
    });

    it('allows authorized executive to investigate anomaly with mandatory rationale note', async () => {
      const anomalies = commandCenterService.listAnomalies(execActor);
      const targetId = anomalies[0].id;

      const updated = await commandCenterService.handleHumanOversightAction(
        targetId,
        { action: 'INVESTIGATE', note: 'Initiating dual-approval compliance review with branch manager.' },
        execActor
      );

      expect(updated.status).toBe('INVESTIGATING');
      expect(updated.actionTaken?.officerEmail).toBe(execActor.email);
      expect(updated.actionTaken?.actionNote).toContain('dual-approval compliance review');
    });

    it('rejects human oversight action if mandatory rationale note is missing', async () => {
      const anomalies = commandCenterService.listAnomalies(execActor);
      const targetId = anomalies[0].id;

      await expect(
        commandCenterService.handleHumanOversightAction(targetId, { action: 'DISMISS', note: '' }, execActor)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('4. Strict Borrower Isolation', () => {
    it('strictly forbids borrower role from accessing executive health telemetry', async () => {
      await expect(commandCenterService.getOperationalHealth(borrowerActor)).rejects.toThrow(ForbiddenError);
    });

    it('strictly forbids borrower role from executing executive natural language queries', async () => {
      await expect(
        commandCenterService.executeExecutiveQuery('disbursements volume', borrowerActor)
      ).rejects.toThrow(ForbiddenError);
    });

    it('strictly forbids borrower role from viewing or actioning policy anomalies', async () => {
      expect(() => commandCenterService.listAnomalies(borrowerActor)).toThrow(ForbiddenError);

      await expect(
        commandCenterService.handleHumanOversightAction('anom-seed-101', { action: 'DISMISS', note: 'n' }, borrowerActor)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
