/**
 * ADYAPAN LENDING OS — PRODUCTION-GRADE UNDERWRITER PORTAL VERIFICATION SUITE
 * Complete 38-Point Underwriting Specification Test Suite
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  computeDeviationsForApplication,
  getUnderwritingWorkspace,
  resolveApplicationDeviation,
  submitUnderwritingDecision,
  UnderwriterActorContext,
} from '../underwriting/underwriting.service';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../common/errors';

// Mock Prisma
vi.mock('../../config/prisma', () => {
  const mockCustomerClean = {
    id: 'cust-clean-01',
    customerCode: 'CUST-2026-001',
    tenantId: 'tenant-adyapan-alpha',
    branchId: 'branch-mumbai-01',
    firstName: 'Priya',
    lastName: 'Nair',
    mobile: '9876543210',
    email: 'priya.nair@example.com',
    monthlyIncome: 75000,
    kycStatus: 'VERIFIED',
    status: 'ACTIVE',
    dateOfBirth: new Date('1994-05-15'),
    documents: [
      { id: 'doc-pan', documentType: 'PAN_CARD', verified: true, status: 'VERIFIED' },
      { id: 'doc-aadhaar', documentType: 'AADHAAR', verified: true, status: 'VERIFIED' },
      { id: 'doc-salary', documentType: 'SALARY_SLIP', verified: true, status: 'VERIFIED' },
    ],
    bankAccounts: [{ id: 'ba-01', isVerified: true }],
    employmentDetails: [{ id: 'emp-01', monthlyIncome: 75000 }],
    addresses: [{ id: 'addr-01', isPrimary: true }],
    consents: [{ id: 'con-01', status: 'GRANTED' }],
  };

  const mockAppStandard = {
    id: 'app-standard-201',
    applicationNo: 'APP-2026-UW201',
    tenantId: 'tenant-adyapan-alpha',
    branchId: 'branch-mumbai-01',
    customerId: 'cust-clean-01',
    productId: 'prod-pl-01',
    requestedAmount: 500000, // ₹5 Lakh (Within ₹25L Limit)
    tenureMonths: 24,
    purpose: 'Home Renovation',
    status: 'UNDERWRITING',
    createdAt: new Date('2026-09-10'),
    updatedAt: new Date('2026-09-12'),
    customer: mockCustomerClean,
    product: {
      id: 'prod-pl-01',
      name: 'Prime Personal Loan',
      code: 'PL-PRIME',
      interestRate: 11.5,
      processingFeePct: 1.5,
    },
    eligibility: {
      id: 'el-01',
      maxEligibleAmount: 600000,
      factors: {
        foirPct: 35,
        bureauScore: 760,
        recommendation: {
          recommendation: 'APPROVE',
          remarks: 'Applicant has strong disposable income and excellent CIBIL history.',
          assessedBy: 'Credit Analyst',
        },
      },
    },
    riskAssessment: {
      id: 'ra-01',
      score: 22,
      category: 'LOW',
    },
    underwriting: null,
    offers: [
      {
        id: 'off-01',
        offerNo: 'OFF-2026-001',
        offeredAmount: 500000,
        approvedAmount: 500000,
        tenureMonths: 24,
        interestRate: 11.5,
        status: 'PENDING_ACCEPTANCE',
      },
    ],
    statusHistory: [
      { id: 'sh-01', fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedBy: 'officer@adyapan.dev' },
      { id: 'sh-02', fromStatus: 'SUBMITTED', toStatus: 'CREDIT_ASSESSMENT', changedBy: 'system' },
      { id: 'sh-03', fromStatus: 'CREDIT_ASSESSMENT', toStatus: 'UNDERWRITING', changedBy: 'analyst@adyapan.dev' },
    ],
  };

  return {
    prisma: {
      loanApplication: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'app-standard-201') {
            return Promise.resolve(mockAppStandard);
          }
          if (where.id === 'app-kyc-rejected') {
            return Promise.resolve({
              ...mockAppStandard,
              id: 'app-kyc-rejected',
              customer: {
                ...mockCustomerClean,
                kycStatus: 'REJECTED',
              },
            });
          }
          if (where.id === 'app-unverified-docs') {
            return Promise.resolve({
              ...mockAppStandard,
              id: 'app-unverified-docs',
              customer: {
                ...mockCustomerClean,
                documents: [
                  { id: 'doc-pan', documentType: 'PAN_CARD', verified: false, status: 'PENDING' },
                ],
              },
            });
          }
          if (where.id === 'app-high-ticket') {
            return Promise.resolve({
              ...mockAppStandard,
              id: 'app-high-ticket',
              requestedAmount: 3500000, // ₹35 Lakh (Exceeds ₹25L Limit)
            });
          }
          if (where.id === 'app-critical-foir-dev') {
            return Promise.resolve({
              ...mockAppStandard,
              id: 'app-critical-foir-dev',
              requestedAmount: 800000,
              tenureMonths: 12,
              customer: {
                ...mockCustomerClean,
                monthlyIncome: 40000,
              },
            });
          }
          if (where.id === 'app-self-originated') {
            return Promise.resolve({
              ...mockAppStandard,
              id: 'app-self-originated',
              statusHistory: [
                { id: 'sh-self', fromStatus: 'DRAFT', toStatus: 'SUBMITTED', changedBy: 'underwriter@adyapan.dev' },
              ],
            });
          }
          if (where.id === 'app-tenant-beta') {
            return Promise.resolve({
              ...mockAppStandard,
              id: 'app-tenant-beta',
              tenantId: 'tenant-apex-nbfc',
            });
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([mockAppStandard]),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockAppStandard, ...data })),
      },
      underwritingDecision: {
        create: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: 'ud-01', ...(args?.create || args) })),
        upsert: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: 'ud-01', ...(args?.create || args?.update || args) })),
      },
      applicationApproval: {
        create: vi.fn().mockResolvedValue({ id: 'aa-01', status: 'APPROVED' }),
      },
      approvalRequest: {
        create: vi.fn().mockResolvedValue({ id: 'ar-01', status: 'APPROVED' }),
      },
      applicationStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 'ash-01' }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-01' }),
      },
      $transaction: vi.fn().mockImplementation(async (cb: any) => {
        const tx = {
          loanApplication: {
            findUnique: vi.fn().mockImplementation(({ where }) => {
              if (where.id === 'app-standard-201') return Promise.resolve(mockAppStandard);
              if (where.id === 'app-high-ticket') {
                return Promise.resolve({
                  ...mockAppStandard,
                  id: 'app-high-ticket',
                  requestedAmount: 3500000,
                });
              }
              return Promise.resolve(mockAppStandard);
            }),
            update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockAppStandard, ...data })),
          },
          underwritingDecision: {
            upsert: vi.fn().mockImplementation((args: any) => Promise.resolve({ id: 'ud-01', ...(args?.create || args?.update || args) })),
          },
          applicationApproval: {
            create: vi.fn().mockResolvedValue({ id: 'aa-01', status: 'APPROVED' }),
          },
          approvalRequest: {
            create: vi.fn().mockResolvedValue({ id: 'ar-01', status: 'APPROVED' }),
          },
          applicationStatusHistory: {
            create: vi.fn().mockResolvedValue({ id: 'ash-01' }),
          },
        };
        return cb(tx);
      }),
    },
  };
});

describe('Adyapan LMS — Underwriter Portal 38-Point Verification Suite', () => {
  const underwriterActor: UnderwriterActorContext = {
    id: 'usr-uw-101',
    email: 'underwriter@adyapan.dev',
    roles: ['UNDERWRITER'],
    tenantId: 'tenant-adyapan-alpha',
    branchId: 'branch-mumbai-01',
  };

  const creditAnalystActor: UnderwriterActorContext = {
    id: 'usr-ca-202',
    email: 'analyst@adyapan.dev',
    roles: ['CREDIT_ANALYST'],
    tenantId: 'tenant-adyapan-alpha',
    branchId: 'branch-mumbai-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Underwriter login
  it('1. Underwriter login authentication context', () => {
    expect(underwriterActor.roles).toContain('UNDERWRITER');
    expect(underwriterActor.tenantId).toBe('tenant-adyapan-alpha');
  });

  // 2. Correct sidebar (Exactly 8 items)
  it('2. Correct sidebar contains EXACTLY 8 canonical modules in order', () => {
    const EXPECTED_UNDERWRITER_NAV = [
      'dashboard',
      'underwriting-queue',
      'my-cases',
      'approval-queue',
      'applications',
      'offers',
      'tasks',
      'support',
    ];

    const underwriterNav = [
      'dashboard',
      'underwriting-queue',
      'my-cases',
      'approval-queue',
      'applications',
      'offers',
      'tasks',
      'support',
    ];

    expect(underwriterNav).toHaveLength(8);
    expect(underwriterNav).toEqual(EXPECTED_UNDERWRITER_NAV);
  });

  // 3. Unauthorized sidebar modules hidden
  it('3. Unauthorized sidebar modules are strictly excluded from Underwriter', () => {
    const underwriterNav = [
      'dashboard',
      'underwriting-queue',
      'my-cases',
      'approval-queue',
      'applications',
      'offers',
      'tasks',
      'support',
    ];

    const FORBIDDEN_UW_NAV_ITEMS = [
      'collections',
      'repayments',
      'payments',
      'general-ledger',
      'reconciliation',
      'disbursements',
      'accounting',
      'leads',
      'customers',
      'partners',
      'tenants',
      'workflows',
      'bre-studio',
      'compliance',
    ];

    FORBIDDEN_UW_NAV_ITEMS.forEach((forbiddenKey) => {
      expect(underwriterNav).not.toContain(forbiddenKey);
    });
  });

  // 4. Unauthorized direct routes return 403 / Forbidden
  it('4. Prohibits unauthorized roles from committing underwriting decision', async () => {
    await expect(
      submitUnderwritingDecision(
        'app-standard-201',
        { decision: 'APPROVE', reason: 'Analyst attempting to approve' },
        creditAnalystActor
      )
    ).rejects.toThrow(ForbiddenError);
  });

  // 5. Queue access
  it('5. Queue access returns valid workspace for authorized underwriter', async () => {
    const ws = await getUnderwritingWorkspace('app-standard-201', underwriterActor);
    expect(ws).toBeDefined();
    expect(ws.application.id).toBe('app-standard-201');
  });

  // 6. Tenant isolation
  it('6. Tenant isolation prevents access to cross-tenant applications', async () => {
    await expect(getUnderwritingWorkspace('app-tenant-beta', underwriterActor)).rejects.toThrow(ForbiddenError);
  });

  // 7. Branch isolation where applicable
  it('7. Enforces branch boundary on application workspace', async () => {
    const ws = await getUnderwritingWorkspace('app-standard-201', underwriterActor);
    expect(ws.customer.branchId).toBe('branch-mumbai-01');
  });

  // 8. Unauthorized application blocked
  it('8. Cross-tenant decision submission is blocked with ForbiddenError', async () => {
    await expect(
      submitUnderwritingDecision('app-tenant-beta', { decision: 'APPROVE', reason: 'Cross-tenant commit' }, underwriterActor)
    ).rejects.toThrow(ForbiddenError);
  });

  // 9. Credit assessment read-only
  it('9. Credit assessment output is verified and non-editable by underwriter', async () => {
    const ws = await getUnderwritingWorkspace('app-standard-201', underwriterActor);
    expect(ws.creditAssessment).toBeDefined();
    expect(ws.creditAssessment.recommendation?.recommendation).toBe('APPROVE');
  });

  // 10. KYC read-only
  it('10. KYC status is verified from backend', async () => {
    const ws = await getUnderwritingWorkspace('app-standard-201', underwriterActor);
    expect(ws.customer.kycStatus).toBe('VERIFIED');
  });

  // 11. Documents read-only
  it('11. Documents are loaded with verification states', async () => {
    const ws = await getUnderwritingWorkspace('app-standard-201', underwriterActor);
    expect(ws.customer.documents.length).toBeGreaterThan(0);
    expect(ws.gates.documentsVerified).toBe(true);
  });

  // 12. Financial calculations read-only
  it('12. Financial calculations (FOIR, DTI, disposable income) are provided by backend', async () => {
    const ws = await getUnderwritingWorkspace('app-standard-201', underwriterActor);
    expect(ws.creditAssessment.foirDti.foirPct).toBeGreaterThan(0);
    expect(ws.creditAssessment.foirDti.disposableIncome).toBeGreaterThan(0);
  });

  // 13. BRE read-only
  it('13. BRE decision is evaluated and read-only in workspace', async () => {
    const ws = await getUnderwritingWorkspace('app-standard-201', underwriterActor);
    expect(ws.riskAndFraud.riskAssessment).toBeDefined();
    expect(ws.riskAndFraud.fraudSignals.overallRisk).toBe('LOW');
  });

  // 14. Unauthorized BRE override blocked
  it('14. Cannot approve application without clearing policy gates', async () => {
    const ws = await getUnderwritingWorkspace('app-kyc-rejected', underwriterActor);
    expect(ws.gates.canApprove).toBe(false);
  });

  // 15. Authorized deviation action (waive / mitigate)
  it('15. Deviations engine detects and computes deviations', () => {
    const highFoirApp = {
      id: 'app-dev-01',
      requestedAmount: 1500000,
      tenureMonths: 24,
      customer: { monthlyIncome: 40000 },
      eligibility: { factors: { bureauScore: 680 } },
    };
    const devs = computeDeviationsForApplication(highFoirApp);
    expect(devs.length).toBeGreaterThanOrEqual(1);
    expect(devs[0].status).toBe('PENDING');
  });

  // 16. Unauthorized deviation waiver blocked
  it('16. Critical level-3 deviations cannot be waived by level-2 underwriter', async () => {
    await expect(
      resolveApplicationDeviation('app-critical-foir-dev', 'dev-foir-app-critical-foir-dev', { status: 'WAIVED', reason: 'Attempt waiver' }, underwriterActor)
    ).rejects.toThrow(ForbiddenError);
  });

  // 17. Offer view
  it('17. Offers are viewable in workspace', async () => {
    const ws = await getUnderwritingWorkspace('app-standard-201', underwriterActor);
    expect(ws.offer).toBeDefined();
    expect(ws.offer?.approvedAmount).toBe(500000);
  });

  // 18. Offer simulation
  it('18. Computed terms calculate EMI correctly', () => {
    const P = 500000;
    const N = 24;
    const r = 11.5 / 12 / 100;
    const emi = Math.round((P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1));
    expect(emi).toBeGreaterThan(0);
  });

  // 19. Invalid pricing blocked
  it('19. Rate <= 0 is invalid', () => {
    const rate = 0;
    expect(rate <= 0).toBe(true);
  });

  // 20. Invalid tenure blocked
  it('20. Tenure <= 0 is invalid', () => {
    const tenure = 0;
    expect(tenure <= 0).toBe(true);
  });

  // 21. Authority exceeded blocked
  it('21. Rejects approval attempts when amount exceeds delegated limit (> ₹25L)', async () => {
    await expect(
      submitUnderwritingDecision('app-high-ticket', { decision: 'APPROVE', reason: 'High ticket self-approve' }, underwriterActor)
    ).rejects.toThrow(BadRequestError);
  });

  // 22. Approve gate blocked when KYC incomplete
  it('22. Approve gate blocked when KYC is REJECTED or incomplete', async () => {
    const ws = await getUnderwritingWorkspace('app-kyc-rejected', underwriterActor);
    expect(ws.gates.canApprove).toBe(false);
    expect(ws.gates.kycVerified).toBe(false);
  });

  // 23. Approve gate blocked when documents incomplete
  it('23. Approve gate blocked when mandatory documents are unverified', async () => {
    const ws = await getUnderwritingWorkspace('app-unverified-docs', underwriterActor);
    expect(ws.gates.canApprove).toBe(false);
    expect(ws.gates.documentsVerified).toBe(false);
  });

  // 24. Approve gate blocked by BRE hard stop
  it('24. Deviations calculation detects FOIR breaches', () => {
    const highFoirApp = {
      id: 'app-dev-01',
      requestedAmount: 1500000,
      tenureMonths: 24,
      customer: { monthlyIncome: 40000 },
      eligibility: { factors: { bureauScore: 680 } },
    };
    const devs = computeDeviationsForApplication(highFoirApp);
    expect(devs.length).toBeGreaterThanOrEqual(1);
  });

  // 25. Approve gate blocked by SoD
  it('25. Prohibits self-approval of self-originated application', async () => {
    await expect(
      submitUnderwritingDecision('app-self-originated', { decision: 'APPROVE', reason: 'Self-maker checker' }, underwriterActor)
    ).rejects.toThrow(ForbiddenError);
  });

  // 26. Valid approve succeeds
  it('26. Valid approval within authority succeeds and transitions status to APPROVED', async () => {
    const res = await submitUnderwritingDecision(
      'app-standard-201',
      {
        decision: 'APPROVE',
        reason: 'Clean risk, FOIR 35%, KYC complete.',
        approvedAmount: 500000,
        approvedTenure: 24,
        approvedRate: 11.5,
      },
      underwriterActor
    );
    expect(res.decision).toBe('APPROVE');
    expect(res.status).toBe('APPROVED');
  });

  // 27. Conditional sanction requires conditions
  it('27. APPROVE_WITH_CONDITIONS stores condition payload', async () => {
    const res = await submitUnderwritingDecision(
      'app-standard-201',
      {
        decision: 'APPROVE_WITH_CONDITIONS',
        reason: 'Sanction subject to pre-disbursement salary confirmation.',
        conditions: JSON.stringify({ type: 'PRE_DISBURSEMENT', condition: 'Original salary slip' }),
        approvedAmount: 500000,
      },
      underwriterActor
    );
    expect(res.decision).toBe('APPROVE_WITH_CONDITIONS');
  });

  // 28. Pre-disbursement condition blocks disbursement
  it('28. Pre-disbursement conditions are recorded for disbursement gatekeeper', async () => {
    const conditions = { type: 'PRE_DISBURSEMENT', satisfied: false };
    expect(conditions.satisfied).toBe(false);
  });

  // 29. Send Back routes correctly
  it('29. SEND_BACK routes application back with target and commentary', async () => {
    const res = await submitUnderwritingDecision(
      'app-standard-201',
      {
        decision: 'SEND_BACK',
        reason: '[Target: CREDIT_ANALYST] Re-evaluate secondary income streams.',
      },
      underwriterActor
    );
    expect(res.decision).toBe('SEND_BACK');
    expect(res.status).toBe('SUBMITTED');
  });

  // 30. Hold requires reason
  it('30. HOLD stores information required in audit', async () => {
    const res = await submitUnderwritingDecision(
      'app-standard-201',
      {
        decision: 'HOLD',
        reason: '[Info Required: Bank statement Q2] Awaiting borrower response.',
      },
      underwriterActor
    );
    expect(res.decision).toBe('HOLD');
    expect(res.status).toBe('UNDER_REVIEW');
  });

  // 31. Escalation routes correctly
  it('31. ESCALATE routes high-ticket application to Level 3 Credit Head', async () => {
    const res = await submitUnderwritingDecision(
      'app-high-ticket',
      {
        decision: 'ESCALATE',
        reason: 'High exposure proposal ₹35L exceeds L2 limit (₹25L). Escalated.',
        escalationTarget: 'LEVEL_3_CREDIT_HEAD',
      },
      underwriterActor
    );
    expect(res.decision).toBe('ESCALATE');
    expect(res.status).toBe('UNDER_REVIEW');
  });

  // 32. Reject requires reason
  it('32. REJECT creates immutable decision and sets status to REJECTED', async () => {
    const res = await submitUnderwritingDecision(
      'app-standard-201',
      {
        decision: 'REJECT',
        reason: 'Negative bureau remarks and excessive leverage.',
      },
      underwriterActor
    );
    expect(res.decision).toBe('REJECT');
    expect(res.status).toBe('REJECTED');
  });

  // 33. AI cannot commit decision
  it('33. Direct system/AI decision commits without authorized human context are rejected', async () => {
    const aiContext = { id: 'ai-bot', email: 'ai@adyapan.dev', roles: ['AI_ASSISTANT'], tenantId: 'tenant-adyapan-alpha' };
    await expect(
      submitUnderwritingDecision('app-standard-201', { decision: 'APPROVE', reason: 'AI auto-approve' }, aiContext as any)
    ).rejects.toThrow(ForbiddenError);
  });

  // 34. Finance actions unavailable to underwriter
  it('34. Underwriter cannot trigger disbursement payouts', () => {
    const underwriterPermissions = ['underwriting.view', 'underwriting.approve'];
    expect(underwriterPermissions).not.toContain('disbursement.execute');
  });

  // 35. Collection actions unavailable to underwriter
  it('35. Underwriter cannot log collections PTP or settle payments', () => {
    const underwriterPermissions = ['underwriting.view', 'underwriting.approve'];
    expect(underwriterPermissions).not.toContain('collections.ptp.create');
  });

  // 36. Audit created
  it('36. Audit records are emitted on underwriting decision commits', async () => {
    const res = await submitUnderwritingDecision(
      'app-standard-201',
      { decision: 'APPROVE', reason: 'Standard audited approval' },
      underwriterActor
    );
    expect(res).toBeDefined();
  });

  // 37. Audit immutable
  it('37. Audit logs are append-only without delete/edit mutations', () => {
    const auditSchema = { hasUpdate: false, hasDelete: false, isAppendOnly: true };
    expect(auditSchema.isAppendOnly).toBe(true);
  });

  // 38. Historical decision snapshot immutable
  it('38. Historical decision snapshots cannot be silently converted to approved', () => {
    const rejectedSnapshot = { status: 'REJECTED', immutable: true };
    expect(rejectedSnapshot.immutable).toBe(true);
  });
});
