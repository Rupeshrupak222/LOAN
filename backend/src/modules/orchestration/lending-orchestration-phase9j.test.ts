import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lendingOrchestrationService } from './lending-orchestration.service';
import { approvalAuthorityService } from '../approval-authority/approval-authority.service';
import { prisma } from '../../config/prisma';

// Mock prisma for isolated deterministic testing
vi.mock('../../config/prisma', () => ({
  prisma: {
    loanApplication: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    approvalRequest: {
      create: vi.fn(),
    },
    applicationStatusHistory: {
      create: vi.fn(),
    },
    underwritingDecision: {
      upsert: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

describe('Phase 9J: End-to-End Lending Orchestration & Cross-Domain Control Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseMockApp = {
    id: 'app-9j-001',
    applicationNo: 'APP-9J-2026-001',
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-south-01',
    customerId: 'cust-9j-001',
    status: 'SUBMITTED',
    requestedAmount: 300000,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'cust-9j-001',
      firstName: 'Aarav',
      lastName: 'Sharma',
      kycStatus: 'VERIFIED',
      branchId: 'branch-south-01',
      bankAccounts: [{ id: 'bank-1', isVerified: true }],
      documents: [],
    },
    product: {
      id: 'prod-1',
      name: 'Personal Prime Loan',
      code: 'PL-PRIME',
    },
    eligibility: {
      id: 'elig-1',
      result: 'ELIGIBLE',
      recommendation: 'RECOMMEND_APPROVAL',
      factors: { creditScore: 780, foirPct: 35 },
    },
    riskAssessment: {
      id: 'risk-1',
      score: 82,
      category: 'A',
      factors: { fraudHold: false },
    },
    underwriting: null,
    approvals: [],
    statusHistory: [
      {
        id: 'hist-1',
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED',
        changedBy: 'aarav@customer.internal',
        reason: 'Application submitted',
        createdAt: new Date(),
      },
    ],
    documents: [],
  };

  // ─── 1. Canonical State Projection ───
  describe('1. Canonical Lifecycle Projection', () => {
    it('should derive APPLICATION_SUBMITTED when status is SUBMITTED and KYC is verified', async () => {
      (prisma.loanApplication.findUnique as any).mockResolvedValue(baseMockApp);

      const projection = await lendingOrchestrationService.getCanonicalLifecycle('app-9j-001', {
        id: 'user-ca',
        roles: ['CREDIT_ANALYST'],
        tenantId: 'tenant-adyapan-default',
        branchId: 'branch-south-01',
      });

      expect(projection.applicationId).toBe('app-9j-001');
      expect(projection.currentState).toBe('APPLICATION_SUBMITTED');
      expect(projection.stageGroup).toBe('INTAKE_KYC');
      expect(projection.currentAssigneeRole).toBe('LOAN_OFFICER');
    });

    it('should derive BRANCH_MANAGER_REVIEW when status is UNDER_REVIEW', async () => {
      const underReviewApp = { ...baseMockApp, status: 'UNDER_REVIEW' };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(underReviewApp);

      const projection = await lendingOrchestrationService.getCanonicalLifecycle('app-9j-001');
      expect(projection.currentState).toBe('BRANCH_MANAGER_REVIEW');
      expect(projection.stageGroup).toBe('CREDIT_BRANCH_REVIEW');
      expect(projection.currentAssigneeRole).toBe('BRANCH_MANAGER');
    });

    it('should derive BRANCH_MANAGER_APPROVED when Branch Manager approved within limit', async () => {
      const bmApprovedApp = {
        ...baseMockApp,
        status: 'APPROVED',
        approvals: [
          {
            id: 'appr-1',
            approverRole: 'BRANCH_MANAGER',
            status: 'APPROVED',
            createdAt: new Date(),
          },
        ],
      };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(bmApprovedApp);

      const projection = await lendingOrchestrationService.getCanonicalLifecycle('app-9j-001');
      expect(projection.currentState).toBe('BRANCH_MANAGER_APPROVED');
      expect(projection.stageGroup).toBe('CREDIT_BRANCH_REVIEW');
    });

    it('should derive SANCTIONED when Underwriter approved proposal', async () => {
      const uwSanctionedApp = {
        ...baseMockApp,
        status: 'APPROVED',
        underwriting: {
          id: 'uw-1',
          decision: 'APPROVE',
          underwriterId: 'uw-user-1',
          createdAt: new Date(),
        },
      };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(uwSanctionedApp);

      const projection = await lendingOrchestrationService.getCanonicalLifecycle('app-9j-001');
      expect(projection.currentState).toBe('SANCTIONED');
      expect(projection.stageGroup).toBe('UNDERWRITING_SANCTION');
    });
  });

  // ─── 2. Credit Analyst -> Branch Manager Routing ───
  describe('2. Credit Analyst -> Branch Manager Handoff & Routing Mandate', () => {
    it('should allow Credit Analyst to submit proposal to Branch Manager review', async () => {
      (prisma.loanApplication.findUnique as any).mockResolvedValue(baseMockApp);
      (prisma.loanApplication.update as any).mockResolvedValue({ ...baseMockApp, status: 'UNDER_REVIEW' });
      (prisma.applicationStatusHistory.create as any).mockResolvedValue({});

      const res = await lendingOrchestrationService.executeTransition(
        {
          applicationId: 'app-9j-001',
          action: 'CREDIT_SUBMIT_TO_BRANCH_MANAGER',
          remarks: 'Credit analysis completed with FOIR 35%. Forwarding to BM.',
        },
        { id: 'user-ca', email: 'ca@adyapan.com', roles: ['CREDIT_ANALYST'] }
      );

      expect(res.success).toBe(true);
      expect(prisma.loanApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'UNDER_REVIEW' },
        })
      );
    });

    it('should block direct Credit Analyst to Underwriter transition without BM review', async () => {
      const directApp = { ...baseMockApp, status: 'SUBMITTED', approvals: [] };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(directApp);

      const gateStatus = await lendingOrchestrationService.evaluateCrossDomainGate(
        'app-9j-001',
        'UNDERWRITING'
      );

      expect(gateStatus.allowed).toBe(false);
      expect(gateStatus.blockingReasons.some((r) => r.includes('Branch Manager review is required'))).toBe(true);
    });
  });

  // ─── 3. Branch Manager Authority Decisions ───
  describe('3. Branch Manager Authority-Based Decisions', () => {
    it('should permit Branch Manager approval when loan amount is within Level 1 limit (<= ₹5,00,000)', async () => {
      const bmApp = { ...baseMockApp, requestedAmount: 400000, status: 'UNDER_REVIEW' };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(bmApp);
      (prisma.loanApplication.update as any).mockResolvedValue({ ...bmApp, status: 'APPROVED' });
      (prisma.approvalRequest.create as any).mockResolvedValue({ id: 'appr-req-1' });
      (prisma.applicationStatusHistory.create as any).mockResolvedValue({});

      const res = await lendingOrchestrationService.executeTransition(
        {
          applicationId: 'app-9j-001',
          action: 'BRANCH_MANAGER_APPROVE',
          remarks: 'Proposal verified. Approved within ₹5 Lakhs delegated limit.',
        },
        { id: 'bm-1', email: 'bm@adyapan.com', roles: ['BRANCH_MANAGER'] }
      );

      expect(res.success).toBe(true);
      expect(prisma.approvalRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            approverRole: 'BRANCH_MANAGER',
            level: 1,
            status: 'APPROVED',
          }),
        })
      );
    });

    it('should block Branch Manager approval and require Underwriter escalation when amount exceeds Level 1 limit (> ₹5,00,000)', async () => {
      const highValueApp = { ...baseMockApp, requestedAmount: 1200000, status: 'UNDER_REVIEW' };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(highValueApp);

      await expect(
        lendingOrchestrationService.executeTransition(
          {
            applicationId: 'app-9j-001',
            action: 'BRANCH_MANAGER_APPROVE',
            remarks: 'Attempting BM approval on high value loan.',
          },
          { id: 'bm-1', email: 'bm@adyapan.com', roles: ['BRANCH_MANAGER'] }
        )
      ).rejects.toThrowError(/exceeds Level 1 Branch Manager authority/);
    });

    it('should allow Branch Manager to forward high-value proposal to Underwriting', async () => {
      const highValueApp = { ...baseMockApp, requestedAmount: 1200000, status: 'UNDER_REVIEW' };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(highValueApp);
      (prisma.loanApplication.update as any).mockResolvedValue({ ...highValueApp, status: 'UNDERWRITING' });
      (prisma.approvalRequest.create as any).mockResolvedValue({ id: 'appr-req-2' });
      (prisma.applicationStatusHistory.create as any).mockResolvedValue({});

      const res = await lendingOrchestrationService.executeTransition(
        {
          applicationId: 'app-9j-001',
          action: 'BRANCH_MANAGER_FORWARD_TO_UNDERWRITER',
          remarks: 'Proposal is ₹12 Lakhs; escalating to Level 2 Underwriting authority.',
        },
        { id: 'bm-1', email: 'bm@adyapan.com', roles: ['BRANCH_MANAGER'] }
      );

      expect(res.success).toBe(true);
      expect(prisma.loanApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'UNDERWRITING' },
        })
      );
    });

    it('should support Branch Manager SEND_BACK for remediation with mandatory reason', async () => {
      const underReviewApp = { ...baseMockApp, status: 'UNDER_REVIEW' };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(underReviewApp);
      (prisma.loanApplication.update as any).mockResolvedValue({ ...underReviewApp, status: 'SUBMITTED' });
      (prisma.approvalRequest.create as any).mockResolvedValue({});
      (prisma.applicationStatusHistory.create as any).mockResolvedValue({});

      const res = await lendingOrchestrationService.executeTransition(
        {
          applicationId: 'app-9j-001',
          action: 'BRANCH_MANAGER_SEND_BACK',
          remarks: 'Please obtain updated 6-month bank statement from customer.',
        },
        { id: 'bm-1', email: 'bm@adyapan.com', roles: ['BRANCH_MANAGER'] }
      );

      expect(res.success).toBe(true);
      expect(prisma.loanApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'SUBMITTED' },
        })
      );
    });
  });

  // ─── 4. Underwriter Sanction ───
  describe('4. Underwriting Sanction', () => {
    it('should allow Underwriter to record sanction on escalated proposal', async () => {
      const uwApp = { ...baseMockApp, status: 'UNDERWRITING', requestedAmount: 1500000 };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(uwApp);
      (prisma.loanApplication.update as any).mockResolvedValue({ ...uwApp, status: 'APPROVED' });
      ((prisma as any).underwritingDecision.upsert as any).mockResolvedValue({ id: 'uw-decision-1' });
      (prisma.applicationStatusHistory.create as any).mockResolvedValue({});

      const res = await lendingOrchestrationService.executeTransition(
        {
          applicationId: 'app-9j-001',
          action: 'UNDERWRITER_SANCTION',
          remarks: 'Detailed risk assessment passed. Sanction approved at 12.5% p.a.',
        },
        { id: 'uw-1', email: 'uw@adyapan.com', roles: ['UNDERWRITER'] }
      );

      expect(res.success).toBe(true);
      expect((prisma as any).underwritingDecision.upsert).toHaveBeenCalled();
      expect(prisma.loanApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: 'APPROVED' },
        })
      );
    });
  });

  // ─── 5. Cross-Domain Gate Checks ───
  describe('5. Cross-Domain Gatekeeper Enforcement', () => {
    it('should block Offer generation if proposal has not been sanctioned or approved', async () => {
      const unsanctionedApp = { ...baseMockApp, status: 'UNDER_REVIEW', approvals: [] };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(unsanctionedApp);

      const gateStatus = await lendingOrchestrationService.evaluateCrossDomainGate(
        'app-9j-001',
        'OFFER_PENDING'
      );

      expect(gateStatus.allowed).toBe(false);
      expect(gateStatus.blockingReasons).toContain('Cannot generate offer without valid loan sanction.');
    });

    it('should block Agreement generation if offer is not accepted', async () => {
      const pendingOfferApp = { ...baseMockApp, status: 'SUBMITTED', offers: [{ status: 'PENDING' }] };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(pendingOfferApp);

      const gateStatus = await lendingOrchestrationService.evaluateCrossDomainGate(
        'app-9j-001',
        'AGREEMENT_PENDING'
      );

      expect(gateStatus.allowed).toBe(false);
      expect(gateStatus.blockingReasons).toContain('Offer must be accepted by borrower before agreement generation.');
    });

    it('should block Loan Closure if outstanding balance remains', async () => {
      const activeLoanApp = {
        ...baseMockApp,
        status: 'DISBURSED',
        loans: [{ id: 'loan-1', outstandingPrincipal: 50000, outstandingInterest: 1200 }],
      };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(activeLoanApp);

      const gateStatus = await lendingOrchestrationService.evaluateCrossDomainGate(
        'app-9j-001',
        'CLOSED'
      );

      expect(gateStatus.allowed).toBe(false);
      expect(gateStatus.blockingReasons.some((r) => r.includes('Outstanding balance remaining'))).toBe(true);
    });
  });

  // ─── 6. Idempotency & Terminal State Protection ───
  describe('6. Idempotency & Terminal State Protection', () => {
    it('should reject transitions on terminal CLOSED or CANCELLED states', async () => {
      const closedApp = { ...baseMockApp, status: 'CANCELLED' };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(closedApp);

      await expect(
        lendingOrchestrationService.executeTransition(
          {
            applicationId: 'app-9j-001',
            action: 'CREDIT_SUBMIT_TO_BRANCH_MANAGER',
          },
          { id: 'ca-1', roles: ['CREDIT_ANALYST'] }
        )
      ).rejects.toThrowError(/is in terminal state/);
    });

    it('should return cached response for duplicate request with same idempotency key', async () => {
      (prisma.loanApplication.findUnique as any).mockResolvedValue(baseMockApp);
      (prisma.loanApplication.update as any).mockResolvedValue({ ...baseMockApp, status: 'UNDER_REVIEW' });

      const firstCall = await lendingOrchestrationService.executeTransition(
        {
          applicationId: 'app-9j-001',
          action: 'CREDIT_SUBMIT_TO_BRANCH_MANAGER',
          idempotencyKey: 'idem-key-12345',
        },
        { id: 'ca-1', roles: ['CREDIT_ANALYST'] }
      );

      const secondCall = await lendingOrchestrationService.executeTransition(
        {
          applicationId: 'app-9j-001',
          action: 'CREDIT_SUBMIT_TO_BRANCH_MANAGER',
          idempotencyKey: 'idem-key-12345',
        },
        { id: 'ca-1', roles: ['CREDIT_ANALYST'] }
      );

      expect(secondCall).toEqual(firstCall);
    });
  });

  // ─── 7. Unified Timeline Aggregation ───
  describe('7. Unified Timeline Aggregator', () => {
    it('should aggregate chronological events from status history, approvals, and documents', async () => {
      const appWithHistory = {
        ...baseMockApp,
        approvals: [
          {
            id: 'appr-bm-1',
            approverRole: 'BRANCH_MANAGER',
            approverUserId: 'bm-user-1',
            status: 'APPROVED',
            decisionReason: 'BM approved',
            createdAt: new Date(),
          },
        ],
        documents: [
          {
            id: 'doc-pan-1',
            category: 'IDENTITY',
            documentType: 'PAN_CARD',
            status: 'VERIFIED',
            createdAt: new Date(),
          },
        ],
      };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(appWithHistory);

      const timeline = await lendingOrchestrationService.getUnifiedTimeline('app-9j-001', {
        id: 'user-admin',
        roles: ['ADMIN'],
      });

      expect(timeline.length).toBeGreaterThanOrEqual(3);
      expect(timeline.some((e) => e.domain === 'APPLICATION_LIFECYCLE')).toBe(true);
      expect(timeline.some((e) => e.domain === 'APPROVAL_AUTHORITY')).toBe(true);
      expect(timeline.some((e) => e.domain === 'DOCUMENT_KYC')).toBe(true);
    });

    it('should mask internal approval notes and risk scores for borrower actors', async () => {
      const appWithHistory = {
        ...baseMockApp,
        approvals: [
          {
            id: 'appr-bm-1',
            approverRole: 'BRANCH_MANAGER',
            status: 'APPROVED',
            decisionReason: 'Internal BM note',
            createdAt: new Date(),
          },
        ],
      };
      (prisma.loanApplication.findUnique as any).mockResolvedValue(appWithHistory);

      const timeline = await lendingOrchestrationService.getUnifiedTimeline('app-9j-001', {
        id: 'borrower-1',
        roles: ['BORROWER'],
      });

      // Internal approval event should be masked
      expect(timeline.some((e) => e.domain === 'APPROVAL_AUTHORITY')).toBe(false);
      expect(timeline.some((e) => e.domain === 'APPLICATION_LIFECYCLE')).toBe(true);
    });
  });

  // ─── 8. Borrower-Safe Journey Projection ───
  describe('8. Borrower-Safe Journey Projection', () => {
    it('should generate simplified 7-step customer progression', async () => {
      (prisma.loanApplication.findUnique as any).mockResolvedValue(baseMockApp);

      const journey = await lendingOrchestrationService.getBorrowerSafeJourney('app-9j-001');

      expect(journey.steps.length).toBe(7);
      expect(journey.steps[0].key).toBe('SUBMITTED');
      expect(journey.overallProgressPercent).toBeGreaterThan(0);
    });
  });

  // ─── 9. Stuck Workflow & SLA Monitoring ───
  describe('9. Stuck Workflow & SLA Tracking', () => {
    it('should detect workflow tasks breaching configured 8-hour stage SLA', async () => {
      const staleDate = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12 hours ago
      (prisma.loanApplication.findMany as any).mockResolvedValue([
        {
          id: 'app-stuck-1',
          applicationNo: 'APP-STUCK-001',
          status: 'UNDER_REVIEW',
          updatedAt: staleDate,
          customer: { firstName: 'Rohan', lastName: 'Verma' },
          statusHistory: [{ createdAt: staleDate }],
        },
      ]);

      const stuckWorkflows = await lendingOrchestrationService.getStuckWorkflows('tenant-adyapan-default');

      expect(stuckWorkflows.length).toBe(1);
      expect(stuckWorkflows[0].isBreached).toBe(true);
      expect(stuckWorkflows[0].elapsedHours).toBeGreaterThanOrEqual(12);
      expect(stuckWorkflows[0].assigneeRole).toBe('BRANCH_MANAGER');
    });
  });

  // ─── 10. Cross-Domain Reconciliation ───
  describe('10. Cross-Domain Reconciliation & Controlled Repair', () => {
    it('should detect unauthorized direct Underwriting routing anomalies', async () => {
      (prisma.loanApplication.findMany as any).mockResolvedValue([
        {
          id: 'app-anom-1',
          applicationNo: 'APP-ANOM-001',
          status: 'UNDERWRITING',
          tenantId: 'tenant-adyapan-default',
          approvals: [], // No BM approval!
        },
      ]);

      const anomalies = await lendingOrchestrationService.detectReconciliationAnomalies('tenant-adyapan-default');

      expect(anomalies.length).toBe(1);
      expect(anomalies[0].anomalyType).toBe('UNAUTHORIZED_DIRECT_UW_ROUTING');
      expect(anomalies[0].severity).toBe('CRITICAL');
      expect(anomalies[0].repairable).toBe(true);
    });

    it('should execute controlled reconciliation repair with audit trail', async () => {
      const repairRes = await lendingOrchestrationService.executeControlledRepair(
        'anom-uw-direct-app-1',
        'REVERT_TO_BRANCH_MANAGER_QUEUE',
        { id: 'super-admin-1', roles: ['SUPER_ADMIN'] }
      );

      expect(repairRes.success).toBe(true);
      expect(repairRes.status).toBe('RESOLVED');
    });
  });
});
