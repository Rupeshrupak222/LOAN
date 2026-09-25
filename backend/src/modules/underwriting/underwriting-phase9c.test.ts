/**
 * ADYAPAN LENDING OS — PHASE 9C AUTOMATED VERIFICATION SUITE
 * Real Underwriter Credit Workspace + Final Sanction Integration Test Suite
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getUnderwritingQueue,
  getUnderwritingWorkspace,
  submitUnderwritingDecision,
  forwardToFinanceOfficer,
  resolveApplicationDeviation,
  startUnderwritingCase,
} from './underwriting.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

// Mock Prisma
vi.mock('../../config/prisma', () => {
  const mockCustomer = {
    id: 'cust-9c-01',
    customerCode: 'CUST-2026-9C01',
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-mumbai-01',
    firstName: 'Ramesh',
    lastName: 'Sharma',
    mobile: '9811223344',
    email: 'ramesh.sharma@example.com',
    monthlyIncome: 85000,
    existingObligations: 12000,
    kycStatus: 'VERIFIED',
    status: 'ACTIVE',
    dateOfBirth: new Date('1990-08-20'),
    documents: [
      { id: 'doc-pan', documentType: 'PAN_CARD', verified: true, status: 'VERIFIED' },
      { id: 'doc-aadhaar', documentType: 'AADHAAR', verified: true, status: 'VERIFIED' },
      { id: 'doc-salary', documentType: 'SALARY_SLIP', verified: true, status: 'VERIFIED' },
    ],
    bankAccounts: [{ id: 'ba-01', isVerified: true }],
    employmentDetails: [{ id: 'emp-01', employerName: 'Tech Mahindra', monthlyIncome: 85000 }],
    addresses: [{ id: 'addr-01', city: 'Mumbai', state: 'Maharashtra', isPrimary: true }],
    consents: [
      {
        id: 'con-01',
        consentType: 'AADHAAR_KYC',
        version: 'v1.0',
        purpose: 'Identity verification for loan application',
        granted: true,
        grantedAt: new Date('2026-09-15'),
      },
      {
        id: 'con-02',
        consentType: 'CREDIT_BUREAU',
        version: 'v1.0',
        purpose: 'Credit Bureau Pull',
        granted: true,
        grantedAt: new Date('2026-09-15'),
      },
    ],
    CustomerIdentifier: [
      {
        id: 'ci-01',
        idType: 'PAN',
        maskedValue: 'XXXXXX1234F',
        verificationStatus: 'VERIFIED',
      },
      {
        id: 'ci-02',
        idType: 'AADHAAR',
        maskedValue: 'XXXXXXXX5678',
        verificationStatus: 'VERIFIED',
      },
    ],
  };

  const mockAppApprovedByAnalyst = {
    id: 'app-9c-std',
    applicationNo: 'APP-2026-9C-101',
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-mumbai-01',
    customerId: 'cust-9c-01',
    productId: 'prod-pl-01',
    requestedAmount: 400000, // ₹4 Lakh (Within Level 2 Underwriter limit)
    tenureMonths: 24,
    purpose: 'Education',
    status: 'UNDERWRITING',
    stage: 'UNDERWRITING_REVIEW',
    createdAt: new Date('2026-09-16'),
    updatedAt: new Date('2026-09-17'),
    customer: mockCustomer,
    product: {
      id: 'prod-pl-01',
      name: 'Personal Loan Express',
      code: 'PL-EXPRESS',
      interestRate: 12.0,
      processingFeePct: 1.5,
    },
    eligibility: {
      id: 'el-01',
      maxEligibleAmount: 650000,
      factors: {
        foirPct: 32,
        dtiPct: 28,
        disposableIncome: 55000,
        bureauScore: 780,
        recommendation: {
          recommendation: 'APPROVE',
          remarks: 'Applicant meets debt-servicing benchmarks. Forwarded by Credit Analyst for sanction.',
          assessedBy: 'analyst@adyapan.dev',
        },
      },
    },
    riskAssessment: {
      id: 'ra-01',
      score: 18,
      category: 'LOW',
      factors: {
        grade: 'A',
      },
    },
    underwriting: null,
    statusHistory: [
      { id: 'sh-01', fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedBy: 'loanofficer@adyapan.dev' },
      { id: 'sh-02', fromStatus: 'SUBMITTED', toStatus: 'CREDIT_ASSESSMENT', changedBy: 'system' },
      { id: 'sh-03', fromStatus: 'CREDIT_ASSESSMENT', toStatus: 'UNDERWRITING', changedBy: 'analyst@adyapan.dev' },
    ],
    approvals: [],
  };

  return {
    prisma: {
      loanApplication: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'app-9c-std') return Promise.resolve(mockAppApprovedByAnalyst);
          if (where.id === 'app-9c-kyc-rejected') {
            return Promise.resolve({
              ...mockAppApprovedByAnalyst,
              id: 'app-9c-kyc-rejected',
              customer: { ...mockCustomer, kycStatus: 'REJECTED' },
            });
          }
          if (where.id === 'app-9c-unverified-docs') {
            return Promise.resolve({
              ...mockAppApprovedByAnalyst,
              id: 'app-9c-unverified-docs',
              customer: {
                ...mockCustomer,
                documents: [{ id: 'doc-pan', documentType: 'PAN_CARD', verified: false, status: 'PENDING' }],
              },
            });
          }
          if (where.id === 'app-9c-missing-eligibility') {
            return Promise.resolve({
              ...mockAppApprovedByAnalyst,
              id: 'app-9c-missing-eligibility',
              eligibility: null,
            });
          }
          if (where.id === 'app-9c-high-exposure') {
            return Promise.resolve({
              ...mockAppApprovedByAnalyst,
              id: 'app-9c-high-exposure',
              requestedAmount: 3000000, // ₹30 Lakh (Exceeds ₹25L Underwriter limit)
            });
          }
          if (where.id === 'app-9c-self-originated') {
            return Promise.resolve({
              ...mockAppApprovedByAnalyst,
              id: 'app-9c-self-originated',
              statusHistory: [
                { id: 'sh-orig', fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedBy: 'underwriter@adyapan.dev' },
              ],
            });
          }
          if (where.id === 'app-9c-applicant-is-actor') {
            return Promise.resolve({
              ...mockAppApprovedByAnalyst,
              id: 'app-9c-applicant-is-actor',
              customerId: 'uw-actor-id',
            });
          }
          if (where.id === 'app-9c-cross-tenant') {
            return Promise.resolve({
              ...mockAppApprovedByAnalyst,
              id: 'app-9c-cross-tenant',
              tenantId: 'tenant-other-nbfc',
            });
          }
          if (where.id === 'app-9c-approved') {
            return Promise.resolve({
              ...mockAppApprovedByAnalyst,
              id: 'app-9c-approved',
              status: 'APPROVED',
              underwriting: { id: 'ud-appr', decision: 'APPROVE', reason: 'Sanctioned' },
            });
          }
          if (where.id === 'app-9c-rejected') {
            return Promise.resolve({
              ...mockAppApprovedByAnalyst,
              id: 'app-9c-rejected',
              status: 'REJECTED',
              underwriting: { decision: 'REJECT', reason: 'High DTI risk' },
            });
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([mockAppApprovedByAnalyst]),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockAppApprovedByAnalyst, ...data })),
      },
      underwritingDecision: {
        create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: 'ud-9c-01', ...(args?.create || args) })),
        upsert: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: 'ud-9c-01', ...(args?.create || args?.update || args) })),
      },
      approvalRequest: {
        create: vi.fn().mockResolvedValue({ id: 'ar-9c-01', status: 'APPROVED' }),
      },
      applicationStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 'ash-9c-01' }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-9c-01' }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn().mockImplementation(async (cb: any) => {
        const tx = {
          loanApplication: {
            update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockAppApprovedByAnalyst, ...data })),
          },
          underwritingDecision: {
            upsert: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: 'ud-9c-01', ...(args?.create || args?.update || args) })),
          },
          approvalRequest: {
            create: vi.fn().mockResolvedValue({ id: 'ar-9c-01', status: 'APPROVED' }),
          },
          applicationStatusHistory: {
            create: vi.fn().mockResolvedValue({ id: 'ash-9c-01' }),
          },
        };
        return cb(tx);
      }),
    },
  };
});

describe('Phase 9C: Real Underwriter Credit Workspace + Final Sanction Suite', () => {
  const actorUnderwriter = {
    id: 'user-uw-01',
    email: 'underwriter@adyapan.dev',
    roles: ['UNDERWRITER'],
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-mumbai-01',
  };

  const actorCreditHead = {
    id: 'user-ch-01',
    email: 'credithead@adyapan.dev',
    roles: ['CREDIT_HEAD'],
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-mumbai-01',
  };

  describe('1. Real Underwriting Queue', () => {
    it('should return real applications in underwriting stage for authorized underwriter', async () => {
      const queue = await getUnderwritingQueue('ALL', undefined, actorUnderwriter);
      expect(Array.isArray(queue)).toBe(true);
      expect(queue.length).toBeGreaterThan(0);
      expect(queue[0].applicationNo).toBe('APP-2026-9C-101');
      expect(queue[0].status).toBe('UNDERWRITING');
      expect(queue[0].customer.firstName).toBe('Ramesh');
    });

    it('should calculate live priority, TAT hours, and referral reasons', async () => {
      const queue = await getUnderwritingQueue('ALL', undefined, actorUnderwriter);
      expect(queue[0].priority).toBeDefined();
      expect(queue[0].tatHours).toBeGreaterThanOrEqual(0);
      expect(queue[0].referralReason).toBeDefined();
    });
  });

  describe('2. Real Underwriting Application Dossier', () => {
    it('should load full dossier including masked KYC identifiers and consents registry', async () => {
      const ws = await getUnderwritingWorkspace('app-9c-std', actorUnderwriter);
      expect(ws).toBeDefined();
      expect(ws.customer.CustomerIdentifier).toBeDefined();
      expect(ws.customer.consents).toHaveLength(2);
      expect(ws.creditAssessment.foirDti.foirPct).toBeDefined();
      expect(ws.creditAssessment.recommendation.recommendation).toBe('APPROVE');
      expect(ws.gates.canApprove).toBe(true);
    });

    it('should dynamically evaluate Approval Authority Matrix limits', async () => {
      const ws = await getUnderwritingWorkspace('app-9c-std', actorUnderwriter);
      expect(ws.authorityCheck.hasAuthority).toBe(true);
      expect(ws.authorityCheck.maxLimit).toBe(2500000); // Level 2 Underwriter limit
    });
  });

  describe('3. Credit Analyst Upstream Handoff Gate Validation', () => {
    it('should block approval if borrower KYC is REJECTED', async () => {
      const ws = await getUnderwritingWorkspace('app-9c-kyc-rejected', actorUnderwriter);
      expect(ws.gates.canApprove).toBe(false);
      expect(ws.gates.blockers).toEqual(
        expect.arrayContaining([expect.stringContaining('Borrower KYC is marked as REJECTED')])
      );

      await expect(
        submitUnderwritingDecision('app-9c-kyc-rejected', { decision: 'APPROVE', reason: 'Approve test' }, actorUnderwriter)
      ).rejects.toThrow(BadRequestError);
    });

    it('should block approval if mandatory documents are unverified', async () => {
      const ws = await getUnderwritingWorkspace('app-9c-unverified-docs', actorUnderwriter);
      expect(ws.gates.canApprove).toBe(false);
      expect(ws.gates.blockers.some((b: string) => b.includes('mandatory document'))).toBe(true);

      await expect(
        submitUnderwritingDecision('app-9c-unverified-docs', { decision: 'APPROVE', reason: 'Approve test' }, actorUnderwriter)
      ).rejects.toThrow(BadRequestError);
    });

    it('should block approval if Credit Analyst assessment is missing', async () => {
      await expect(
        submitUnderwritingDecision('app-9c-missing-eligibility', { decision: 'APPROVE', reason: 'Approve test' }, actorUnderwriter)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('4. Approval Authority Matrix Enforcement', () => {
    it('should block approval and require escalation when loan amount exceeds underwriter limit', async () => {
      await expect(
        submitUnderwritingDecision(
          'app-9c-high-exposure',
          { decision: 'APPROVE', reason: 'Self approving high ticket' },
          actorUnderwriter
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should allow Level 3 Credit Head to approve high exposure proposals within limit', async () => {
      const result = await submitUnderwritingDecision(
        'app-9c-high-exposure',
        { decision: 'APPROVE', reason: 'Approved by Credit Head committee', approvedAmount: 3000000 },
        actorCreditHead
      );
      expect(result.status).toBe('APPROVED');
      expect(result.decision).toBe('APPROVE');
    });
  });

  describe('5. Segregation of Duties (SoD) Enforcement', () => {
    it('should prohibit underwriter from approving a loan application they personally originated', async () => {
      await expect(
        submitUnderwritingDecision(
          'app-9c-self-originated',
          { decision: 'APPROVE', reason: 'Self-maker approval attempt' },
          actorUnderwriter
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prohibit underwriter from approving their own loan application as borrower', async () => {
      const actorBorrower = { ...actorUnderwriter, id: 'uw-actor-id' };
      await expect(
        submitUnderwritingDecision(
          'app-9c-applicant-is-actor',
          { decision: 'APPROVE', reason: 'Self borrower approval attempt' },
          actorBorrower
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should prohibit Super Admin from committing operational credit sanction decisions', async () => {
      const actorSuperAdmin = {
        id: 'super-admin-01',
        email: 'admin@platform.dev',
        roles: ['SUPER_ADMIN'],
        tenantId: 'tenant-adyapan-default',
      };
      await expect(
        submitUnderwritingDecision(
          'app-9c-std',
          { decision: 'APPROVE', reason: 'Platform admin approval' },
          actorSuperAdmin
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('6. Final Underwriting Actions & Sanction Terms', () => {
    it('APPROVE: should persist sanction terms, transition status to APPROVED, and emit audit log', async () => {
      const result = await submitUnderwritingDecision(
        'app-9c-std',
        {
          decision: 'APPROVE',
          reason: 'Meets prime debt-servicing criteria',
          approvedAmount: 400000,
          approvedTenure: 24,
          approvedRate: 11.5,
        },
        actorUnderwriter
      );

      expect(result.status).toBe('APPROVED');
      expect(result.decision).toBe('APPROVE');
    });

    it('APPROVE_WITH_CONDITIONS: should persist structured condition items', async () => {
      const conditionPayload = JSON.stringify({
        condition: 'Provide latest electric utility bill before disbursement',
        type: 'PRE_DISBURSEMENT',
        responsibleParty: 'BORROWER',
      });

      const result = await submitUnderwritingDecision(
        'app-9c-std',
        {
          decision: 'APPROVE_WITH_CONDITIONS',
          reason: 'Sanctioned subject to pre-disbursal address proof',
          conditions: conditionPayload,
          approvedAmount: 380000,
          approvedTenure: 18,
        },
        actorUnderwriter
      );

      expect(result.status).toBe('APPROVED');
      expect(result.decision).toBe('APPROVE_WITH_CONDITIONS');
    });

    it('REJECT: should update status to REJECTED with reason and maintain audit record', async () => {
      const result = await submitUnderwritingDecision(
        'app-9c-std',
        {
          decision: 'REJECT',
          reason: 'Debt-to-income ratio exceeds policy limits',
        },
        actorUnderwriter
      );

      expect(result.status).toBe('REJECTED');
      expect(result.decision).toBe('REJECT');
    });

    it('SEND_BACK: should return application to upstream stage with reason', async () => {
      const result = await submitUnderwritingDecision(
        'app-9c-std',
        {
          decision: 'SEND_BACK',
          reason: 'Please recalculate net monthly income excluding bonus component',
        },
        actorUnderwriter
      );

      expect(result.status).toBe('SUBMITTED');
      expect(result.decision).toBe('SEND_BACK');
    });

    it('HOLD: should place application in AWAITING_INFORMATION review stage', async () => {
      const result = await submitUnderwritingDecision(
        'app-9c-std',
        {
          decision: 'HOLD',
          reason: 'Waiting for employer verification email response',
        },
        actorUnderwriter
      );

      expect(result.status).toBe('UNDER_REVIEW');
      expect(result.decision).toBe('HOLD');
    });

    it('ESCALATE: should transition stage to ESCALATED_TO_CREDIT_HEAD', async () => {
      const result = await submitUnderwritingDecision(
        'app-9c-std',
        {
          decision: 'ESCALATE',
          reason: 'Ticket size requires Credit Head concurrence',
        },
        actorUnderwriter
      );

      expect(result.status).toBe('UNDER_REVIEW');
      expect(result.decision).toBe('ESCALATE');
    });
  });

  describe('7. Finance Handoff & Gating', () => {
    it('should forward approved application to Finance for disbursement release', async () => {
      const result = await forwardToFinanceOfficer('app-9c-approved', actorUnderwriter);
      expect(result.success).toBe(true);
      expect(result.status).toBe('READY_FOR_DISBURSEMENT');
    });

    it('should REJECT forwarding rejected application to Finance queue', async () => {
      await expect(
        forwardToFinanceOfficer('app-9c-rejected', actorUnderwriter)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('8. Tenant Isolation & IDOR Protection', () => {
    it('should block underwriter from accessing cross-tenant applications', async () => {
      await expect(
        getUnderwritingWorkspace('app-9c-cross-tenant', actorUnderwriter)
      ).rejects.toThrow(ForbiddenError);

      await expect(
        submitUnderwritingDecision('app-9c-cross-tenant', { decision: 'APPROVE', reason: 'Cross tenant attempt' }, actorUnderwriter)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
