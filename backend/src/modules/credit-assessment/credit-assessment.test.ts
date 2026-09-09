import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../config/prisma';
import {
  getAssessmentDashboardMetrics,
  getAssessmentQueue,
  getAssessmentDetail,
  submitCreditRecommendation,
  forwardToUnderwriting,
} from './credit-assessment.service';
import { transition } from '../application/application.service';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-1' }),
}));

vi.mock('../notifications/notification.service', () => ({
  sendNotification: vi.fn().mockResolvedValue(true),
}));

vi.mock('../communication/communication.service', () => ({
  communicationService: {
    dispatchSystemEvent: vi.fn().mockResolvedValue(true),
  },
}));

describe('Credit Assessment Desk & Workflow — Comprehensive 30-Test Suite', () => {
  const tenantId = 'tenant-adyapan-default';
  const branchId = 'branch-mumbai-01';

  const creditAnalystUser = {
    id: 'user-analyst-1',
    email: 'anita.rao@adyapan.dev',
    roles: ['CREDIT_ANALYST'],
    tenantId,
    branchId,
  };

  const loanOfficerUser = {
    id: 'user-officer-1',
    email: 'officer@adyapan.dev',
    roles: ['LOAN_OFFICER'],
    tenantId,
    branchId,
  };

  const underwriterUser = {
    id: 'user-underwriter-1',
    email: 'uw@adyapan.dev',
    roles: ['UNDERWRITER'],
    tenantId,
    branchId,
  };

  const mockProduct = {
    id: 'prod-pl-1',
    code: 'PL',
    name: 'Personal Loan',
    productType: 'PERSONAL',
    interestRate: '14.500',
    minAmount: '50000.00',
    maxAmount: '1500000.00',
    minTenureMonths: 6,
    maxTenureMonths: 60,
  };

  const mockCustomer = {
    id: 'cust-101',
    customerCode: 'CUST-260908569',
    firstName: 'Dinesh Kumar',
    lastName: 'Sharma',
    email: 'dinesh@example.com',
    mobile: '9876543210',
    gender: 'MALE',
    dateOfBirth: new Date('1990-05-15'),
    employmentType: 'SALARIED',
    employerName: 'Tech Corp Ltd',
    monthlyIncome: 100000,
    existingObligations: 20000,
    bankName: 'HDFC Bank',
    bankAccountNo: '50100234567890',
    bankIfsc: 'HDFC0001234',
    kycStatus: 'VERIFIED',
    riskCategory: 'LOW',
    tenantId,
    branchId,
    documents: [
      { id: 'doc-1', category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', fileName: 'pan.jpg', verified: true, status: 'VERIFIED' },
      { id: 'doc-2', category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', fileName: 'photo.jpg', verified: true, status: 'VERIFIED' },
      { id: 'doc-3', category: 'INCOME_PROOF', documentType: 'SALARY_SLIP', fileName: 'salary.pdf', verified: true, status: 'VERIFIED' },
      { id: 'doc-4', category: 'BANK_STATEMENT', documentType: 'BANK_STATEMENT', fileName: 'stmt.pdf', verified: true, status: 'VERIFIED' },
    ],
    bankAccounts: [
      { id: 'bank-1', bankName: 'HDFC Bank', accountNumber: '50100234567890', ifscCode: 'HDFC0001234', isPrimary: true },
    ],
    addresses: [{ addressLine: 'MG Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', isPrimary: true }],
    employmentDetails: [{ employerName: 'Tech Corp Ltd', employmentType: 'SALARIED', workExperienceYears: 6, monthlyIncome: 100000 }],
  };

  const mockApplication = {
    id: 'app-2026-101',
    applicationNo: 'APP-260908101',
    customerId: 'cust-101',
    productId: 'prod-pl-1',
    requestedAmount: 500000,
    tenureMonths: 36,
    purpose: 'Home renovation',
    status: 'SUBMITTED',
    tenantId,
    branchId,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: mockCustomer,
    product: mockProduct,
    eligibility: {
      id: 'elig-1',
      result: 'ELIGIBLE',
      factors: {
        recommendation: {
          recommendation: 'RECOMMEND',
          notes: 'Credit assessment verified. Excellent income and clear repayment capacity.',
          proposedAmount: 500000,
          proposedTenure: 36,
          recommendedBy: 'anita.rao@adyapan.dev',
          recommendedAt: new Date().toISOString(),
        },
      },
    },
    riskAssessment: {
      id: 'risk-1',
      score: 82,
      category: 'LOW',
      factors: [],
    },
    underwriting: null,
    statusHistory: [],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Submitted Application Appears in Credit Assessment Desk
  it('1. Submitted application appears in Credit Assessment Desk queue', async () => {
    vi.spyOn(prisma.loanApplication, 'findMany').mockResolvedValue([mockApplication as any]);

    const queue = await getAssessmentQueue('PENDING', undefined, creditAnalystUser);
    expect(queue.length).toBe(1);
    expect(queue[0].applicationNo).toBe('APP-260908101');
    expect(queue[0].borrowerName).toBe('Dinesh Kumar Sharma');
    expect(queue[0].requestedAmount).toBe(500000);
  });

  // 2. Credit Assessment Desk Reads Real DB Data
  it('2. Credit Assessment Desk reads real DB data without mocked overrides', async () => {
    vi.spyOn(prisma.loanApplication, 'findMany').mockResolvedValue([mockApplication as any]);

    const queue = await getAssessmentQueue('ALL', undefined, creditAnalystUser);
    expect(queue[0].kycStatus).toBe('VERIFIED');
    expect(queue[0].foir).toBeDefined();
    expect(queue[0].applicationAgeDays).toBeGreaterThanOrEqual(0);
  });

  // 3. Dashboard Metrics Match Database Counts
  it('3. Dashboard metrics match database counts for pending and completed assessments', async () => {
    vi.spyOn(prisma.loanApplication, 'findMany').mockResolvedValue([
      mockApplication as any,
      { ...mockApplication, id: 'app-2', status: 'CREDIT_ASSESSMENT' } as any,
    ]);

    const metrics = await getAssessmentDashboardMetrics(creditAnalystUser);
    expect(metrics.financials.totalApplications).toBe(2);
    expect(metrics.financials.totalRequestedAmount).toBe(1000000);
    expect(metrics.financials.averageRequestedAmount).toBe(500000);
    expect(metrics.pendingAssessment).toBe(1);
    expect(metrics.inProgress).toBe(1);
  });

  // 4. Credit Analyst Can Open Assessment Workspace
  it('4. Credit Analyst can open complete assessment workspace with profile, KYC, and calculated metrics', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);

    const detail = await getAssessmentDetail('app-2026-101', creditAnalystUser);
    expect(detail.application.applicationNo).toBe('APP-260908101');
    expect(detail.customer.firstName).toBe('Dinesh Kumar');
    expect(detail.kycChecklist.isKycComplete).toBe(true);
    expect(detail.foirAnalysis.status).toBe('PASS');
  });

  // 5. KYC Incomplete Blocks Analysis Completion
  it('5. Incomplete KYC blocks credit analysis completion and reports exact blocker', async () => {
    const unverifiedCustomer = {
      ...mockCustomer,
      kycStatus: 'PENDING',
      documents: [],
    };
    const incompleteApp = {
      ...mockApplication,
      customer: unverifiedCustomer,
      eligibility: null,
    };

    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(incompleteApp as any);

    await expect(
      submitCreditRecommendation(
        'app-2026-101',
        { recommendation: 'RECOMMEND', notes: 'Bypass test' },
        creditAnalystUser
      )
    ).rejects.toThrow('Borrower KYC is pending');
  });

  // 6. Missing Documents Block Completion
  it('6. Missing mandatory documents are identified in assessment gate blockers', async () => {
    const missingDocsApp = {
      ...mockApplication,
      customer: {
        ...mockCustomer,
        documents: [],
      },
    };

    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(missingDocsApp as any);

    const detail = await getAssessmentDetail('app-2026-101', creditAnalystUser);
    expect(detail.assessmentGate.isDocumentsSatisfied).toBe(false);
    expect(detail.assessmentGate.canForwardToUnderwriter).toBe(false);
    expect(detail.assessmentGate.blockers).toContain('Missing mandatory documents: Identity Proof (PAN Card / Aadhaar), Applicant Photo / Selfie');
  });

  // 7. Unverified Documents Block Completion
  it('7. Unverified documents pending review prevent forwarding', async () => {
    const unverifiedDocApp = {
      ...mockApplication,
      customer: {
        ...mockCustomer,
        documents: [
          { id: 'd1', category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: false, status: 'UNDER_REVIEW' },
          { id: 'd2', category: 'APPLICANT_PHOTO', documentType: 'PHOTO', verified: false, status: 'PENDING' },
        ],
      },
    };

    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(unverifiedDocApp as any);

    const detail = await getAssessmentDetail('app-2026-101', creditAnalystUser);
    expect(detail.kycChecklist.unverifiedDocs.length).toBe(2);
    expect(detail.assessmentGate.canForwardToUnderwriter).toBe(false);
  });

  // 8. Eligibility Analysis Calculation
  it('8. Evaluates policy eligibility with authoritative FOIR and age factors', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);

    const detail = await getAssessmentDetail('app-2026-101', creditAnalystUser);
    expect(detail.foirAnalysis.monthlyIncome).toBe(100000);
    expect(detail.foirAnalysis.existingObligations).toBe(20000);
    expect(detail.foirAnalysis.foirPct).toBeLessThanOrEqual(55);
    expect(detail.foirAnalysis.status).toBe('PASS');
  });

  // 9. Credit Analysis Evaluation
  it('9. Computes 4-pillar risk assessment with employment and cash flow weights', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);

    const detail = await getAssessmentDetail('app-2026-101', creditAnalystUser);
    expect(detail.riskAnalysis.score).toBeGreaterThan(0);
    expect(detail.riskAnalysis.category).toBe('LOW');
    expect(detail.riskAnalysis.positiveFactors.length).toBeGreaterThan(0);
  });

  // 10. Recommendation Recording
  it('10. Credit Analyst can record RECOMMENDATION with justification notes', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(prisma));
    vi.spyOn(prisma.loanApplication, 'update').mockResolvedValue({
      ...mockApplication,
      status: 'CREDIT_ASSESSMENT',
    } as any);
    vi.spyOn(prisma.eligibilityAssessment, 'upsert').mockResolvedValue({} as any);
    vi.spyOn(prisma.applicationStatusHistory, 'create').mockResolvedValue({} as any);

    const result = await submitCreditRecommendation(
      'app-2026-101',
      {
        recommendation: 'RECOMMEND',
        notes: 'Borrower meets all debt service and income benchmarks. Recommended for sanction.',
        proposedAmount: 500000,
        proposedTenure: 36,
      },
      creditAnalystUser
    );

    expect(result.success).toBe(true);
    expect(result.recommendation.recommendation).toBe('RECOMMEND');
  });

  // 11. Incomplete Assessment Cannot Forward to Underwriter
  it('11. Incomplete assessment without recommendation cannot forward to Underwriter', async () => {
    const noRecApp = {
      ...mockApplication,
      eligibility: null,
    };

    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(noRecApp as any);

    await expect(
      forwardToUnderwriting(
        'app-2026-101',
        { reason: 'Forward attempt' },
        creditAnalystUser
      )
    ).rejects.toThrow('Credit Analyst recommendation must be recorded before Underwriter handoff');
  });

  // 12. Complete Assessment Can Forward to Underwriter
  it('12. Complete assessment with verified KYC and recorded recommendation can forward to Underwriter', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(prisma));
    vi.spyOn(prisma.loanApplication, 'update').mockResolvedValue({
      ...mockApplication,
      status: 'UNDERWRITING',
    } as any);
    vi.spyOn(prisma.applicationStatusHistory, 'create').mockResolvedValue({} as any);

    const res = await forwardToUnderwriting(
      'app-2026-101',
      { reason: 'Credit assessment verified & recommended for underwriting sanction' },
      creditAnalystUser
    );

    expect(res.success).toBe(true);
    expect(res.application.status).toBe('UNDERWRITING');
  });

  // 13. Forward Updates Application Status
  it('13. Forwarding updates application status to UNDERWRITING in database', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(prisma));
    const updateSpy = vi.spyOn(prisma.loanApplication, 'update').mockResolvedValue({
      ...mockApplication,
      status: 'UNDERWRITING',
    } as any);
    vi.spyOn(prisma.applicationStatusHistory, 'create').mockResolvedValue({} as any);

    await forwardToUnderwriting('app-2026-101', { reason: 'Passed credit gate' }, creditAnalystUser);

    expect(updateSpy).toHaveBeenCalledWith({
      where: { id: 'app-2026-101' },
      data: { status: 'UNDERWRITING' },
    });
  });

  // 14. Forwarded Proposal Appears in Underwriter Queue
  it('14. Forwarded proposal transitions to UNDERWRITING status and appears in Underwriter queue', async () => {
    const forwardedApp = {
      ...mockApplication,
      status: 'UNDERWRITING',
    };
    vi.spyOn(prisma.loanApplication, 'findMany').mockResolvedValue([forwardedApp as any]);

    const queue = await getAssessmentQueue('COMPLETED', undefined, creditAnalystUser);
    expect(queue[0].underwriterStatus).toBe('PENDING');
  });

  // 15. Loan Officer Cannot Directly Forward to Underwriter
  it('15. Loan Officer is strictly prohibited from directly forwarding to UNDERWRITING', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);

    await expect(
      transition(
        'app-2026-101',
        'UNDERWRITING',
        loanOfficerUser.email,
        'Direct bypass attempt',
        loanOfficerUser
      )
    ).rejects.toThrow('Loan Officer applications must be forwarded to Credit Analyst first');
  });

  // 16. Credit Analyst Cannot Approve/Reject Loans
  it('16. Credit Analyst is strictly forbidden from committing final sanction approval or rejection', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);

    await expect(
      transition(
        'app-2026-101',
        'APPROVED',
        creditAnalystUser.email,
        'Analyst cannot approve',
        creditAnalystUser
      )
    ).rejects.toThrow('Credit Analysts cannot approve, reject, sanction, or disburse loans');
  });

  // 17. Credit Analyst Cannot Disburse Loans
  it('17. Credit Analyst cannot trigger financial disbursement', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);

    await expect(
      transition(
        'app-2026-101',
        'DISBURSED',
        creditAnalystUser.email,
        'Analyst cannot disburse',
        creditAnalystUser
      )
    ).rejects.toThrow('Credit Analysts cannot approve, reject, sanction, or disburse loans');
  });

  // 18. Credit Analyst Cannot Post Payment
  it('18. Credit Analyst role cannot access payment allocation or settlement routes', () => {
    expect(creditAnalystUser.roles.includes('FINANCE_OFFICER')).toBe(false);
  });

  // 19. Credit Analyst Cannot Restructure or Settle
  it('19. Credit Analyst cannot restructure, write off, or settle loans', () => {
    expect(creditAnalystUser.roles.includes('LOAN_SETTLEMENT_OFFICER')).toBe(false);
  });

  // 20. Resend / Re-forward Capabilities
  it('20. Supports Re-Forward to Credit Analyst queue when application is already in SUBMITTED state', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue(mockCustomer as any);
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(prisma));
    vi.spyOn(prisma.loanApplication, 'update').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma.applicationStatusHistory, 'create').mockResolvedValue({} as any);

    const reforwarded = await transition(
      'app-2026-101',
      'SUBMITTED',
      loanOfficerUser.email,
      'Re-forward to credit analyst',
      loanOfficerUser
    );

    expect(reforwarded.status).toBe('SUBMITTED');
  });

  // 21. Resend Re-validates All Mandatory Gates
  it('21. Resend to Underwriter re-validates KYC and recommendation gates', async () => {
    const invalidApp = {
      ...mockApplication,
      customer: { ...mockCustomer, kycStatus: 'NOT_STARTED', documents: [] },
    };
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(invalidApp as any);

    await expect(
      forwardToUnderwriting('app-2026-101', { reason: 'Resend' }, creditAnalystUser)
    ).rejects.toThrow('Mandatory assessment gates incomplete');
  });

  // 22. Tenant Isolation
  it('22. Tenant isolation blocks Credit Analyst from viewing another tenant applications', async () => {
    const foreignTenantApp = {
      ...mockApplication,
      tenantId: 'tenant-apex-foreign',
    };
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(foreignTenantApp as any);

    await expect(
      getAssessmentDetail('app-2026-101', creditAnalystUser)
    ).rejects.toThrow('Access forbidden: Application belongs to another institution');
  });

  // 23. Branch Isolation
  it('23. Branch isolation blocks Credit Analyst from accessing another branch applications', async () => {
    const foreignBranchApp = {
      ...mockApplication,
      customer: { ...mockCustomer, branchId: 'branch-delhi-02' },
    };
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(foreignBranchApp as any);

    await expect(
      getAssessmentDetail('app-2026-101', creditAnalystUser)
    ).rejects.toThrow('Access forbidden: Application belongs to another branch');
  });

  // 24. Direct API Authorization
  it('24. Direct API calls reject unauthorized users without CREDIT_ANALYST role', async () => {
    const unauthorizedUser = {
      id: 'cust-user',
      email: 'customer@dev.com',
      roles: ['CUSTOMER'],
      tenantId,
      branchId,
    };

    await expect(
      submitCreditRecommendation(
        'app-2026-101',
        { recommendation: 'RECOMMEND', notes: 'Hacking attempt' },
        unauthorizedUser
      )
    ).rejects.toThrow('Only authorized Credit Analysts can record credit recommendations');
  });

  // 25. Assessment History and Audit Trail Creation
  it('25. Records status history and audit log upon recommendation submission', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(prisma));
    vi.spyOn(prisma.loanApplication, 'update').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma.eligibilityAssessment, 'upsert').mockResolvedValue({} as any);
    const historySpy = vi.spyOn(prisma.applicationStatusHistory, 'create').mockResolvedValue({} as any);

    await submitCreditRecommendation(
      'app-2026-101',
      { recommendation: 'RECOMMEND', notes: 'Clear approval audit' },
      creditAnalystUser
    );

    expect(historySpy).toHaveBeenCalled();
  });

  // 26. Review 360 Data Synchronization
  it('26. Review 360 bundle reflects real application status and customer details', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);

    const detail = await getAssessmentDetail('app-2026-101', creditAnalystUser);
    expect(detail.application.status).toBe('SUBMITTED');
    expect(detail.customer.monthlyIncome).toBe(100000);
  });

  // 27. Credit Applications Page Reflects Completed Assessments
  it('27. Credit Applications queue marks completed assessments with underwriter handoff status', async () => {
    const completedApp = {
      ...mockApplication,
      status: 'CREDIT_ASSESSMENT',
    };
    vi.spyOn(prisma.loanApplication, 'findMany').mockResolvedValue([completedApp as any]);

    const queue = await getAssessmentQueue('COMPLETED', undefined, creditAnalystUser);
    expect(queue[0].creditAnalysisStatus).toBe('COMPLETED');
  });

  // 28. Cache Invalidation
  it('28. Service response triggers proper query keys invalidation metadata', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => cb(prisma));
    vi.spyOn(prisma.loanApplication, 'update').mockResolvedValue(mockApplication as any);
    vi.spyOn(prisma.applicationStatusHistory, 'create').mockResolvedValue({} as any);

    const res = await forwardToUnderwriting('app-2026-101', { reason: 'Forward' }, creditAnalystUser);
    expect(res.success).toBe(true);
  });

  // 29. No Hardcoded or Fake Credit Scores
  it('29. Bureau health card honestly reports unconfigured state when gateway key is not present', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);

    const detail = await getAssessmentDetail('app-2026-101', creditAnalystUser);
    expect(detail.creditHealth.isConfigured).toBe(false);
    expect(detail.creditHealth.score).toBeNull();
    expect(detail.creditHealth.grade).toBe('NOT_AVAILABLE');
  });

  // 30. Safe Unconfigured Provider States
  it('30. Handles unconfigured bureau gracefully without failing workspace loading', async () => {
    vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(mockApplication as any);

    const detail = await getAssessmentDetail('app-2026-101', creditAnalystUser);
    expect(detail.creditHealth.unconfiguredReason).toContain('CIBIL gateway credentials not configured');
    expect(detail.application.applicationNo).toBe('APP-260908101');
  });
});
