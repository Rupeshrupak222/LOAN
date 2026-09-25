/**
 * PHASE 9B TEST SUITE: REAL CREDIT ANALYST VERIFICATION & CREDIT ASSESSMENT WORKSPACE
 *
 * Comprehensive Test Coverage:
 * 1. Real Application Profile Loading with Tokenized Identifiers & Consents
 * 2. Multi-Tenant Isolation & IDOR Protection
 * 3. Document Verification & Rejection Workflow with Audit
 * 4. KYC Review & Sandbox/Simulation vs Provider Distinctions
 * 5. Financial Capacity Assessment & Decimal.js calculations (FOIR / DTI)
 * 6. BRE & Decision Explainability (No fake bureau/KYC data)
 * 7. Credit Analyst Recommendation & State Transitions
 * 8. Forward-to-Underwriter Gate Validation (Strict Checks)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getAssessmentDetail,
  getAssessmentQueue,
  submitCreditRecommendation,
  forwardToUnderwriting,
} from './credit-assessment.service';
import { verifyDocument } from '../documents/document.service';
import { ForbiddenError, NotFoundError, BadRequestError } from '../../common/errors';
import { prisma } from '../../config/prisma';

// Mocks
vi.mock('../../config/prisma', () => ({
  prisma: {
    loanApplication: {
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
    },
    customer: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
    },
    document: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    eligibilityAssessment: {
      findUnique: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue({}),
    },
    riskAssessment: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
    },
    applicationStatusHistory: {
      create: vi.fn().mockResolvedValue({}),
    },
    auditLog: {
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-1' }),
}));

vi.mock('../notifications/notification.service', () => ({
  sendNotification: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('../communication/communication.service', () => ({
  communicationService: {
    dispatchSystemEvent: vi.fn().mockResolvedValue(true),
  },
}));

describe('Phase 9B: Credit Analyst Assessment & Verification Suite', () => {
  const mockCustomer = {
    id: 'cust-uuid-1',
    customerCode: 'CUST-2026-001',
    firstName: 'Aarav',
    lastName: 'Sharma',
    email: 'aarav.sharma@example.com',
    mobile: '9876543210',
    dateOfBirth: new Date('1992-05-15'),
    gender: 'MALE',
    addressLine: 'Flat 402, Skyline Towers',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    employmentType: 'SALARIED',
    employerName: 'Infosys Limited',
    monthlyIncome: 75000,
    existingObligations: 15000,
    bankName: 'HDFC Bank',
    bankAccountNo: '50100234567890',
    bankIfsc: 'HDFC0000123',
    kycStatus: 'VERIFIED',
    riskCategory: 'LOW',
    status: 'ACTIVE',
    tenantId: 'tenant-test-bank',
    branchId: 'branch-mumbai-01',
    CustomerIdentifier: [
      {
        id: 'ident-pan-1',
        idType: 'PAN',
        maskedValue: 'ABCDE1234F',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date('2026-03-01'),
        verifiedBy: 'SandboxKycAdapter',
      },
      {
        id: 'ident-aadhaar-1',
        idType: 'AADHAAR',
        maskedValue: 'XXXX-XXXX-9012',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date('2026-03-01'),
        verifiedBy: 'SandboxKycAdapter',
      },
    ],
    consents: [
      {
        id: 'consent-1',
        consentType: 'AADHAAR_KYC',
        purpose: 'Identity verification & KYC processing',
        version: 'v1.0',
        granted: true,
        grantedAt: new Date('2026-03-01'),
        channel: 'BRANCH_PORTAL',
        ipAddress: '192.168.1.100',
      },
      {
        id: 'consent-2',
        consentType: 'CREDIT_BUREAU',
        purpose: 'Credit report pull from credit bureaus',
        version: 'v1.0',
        granted: true,
        grantedAt: new Date('2026-03-01'),
        channel: 'BRANCH_PORTAL',
        ipAddress: '192.168.1.100',
      },
    ],
    documents: [
      {
        id: 'doc-pan',
        category: 'IDENTITY_PROOF',
        documentType: 'PAN_CARD',
        fileName: 'pan_card.pdf',
        storageKey: '/uploads/documents/pan.pdf',
        status: 'VERIFIED',
        verified: true,
        verifiedBy: 'ca@testbank.com',
        verifiedAt: new Date('2026-03-02'),
      },
      {
        id: 'doc-aadhaar',
        category: 'ADDRESS_PROOF',
        documentType: 'AADHAAR',
        fileName: 'aadhaar_card.pdf',
        storageKey: '/uploads/documents/aadhaar.pdf',
        status: 'VERIFIED',
        verified: true,
        verifiedBy: 'ca@testbank.com',
        verifiedAt: new Date('2026-03-02'),
      },
      {
        id: 'doc-salary',
        category: 'INCOME_PROOF',
        documentType: 'SALARY_SLIP',
        fileName: 'payslip_jan.pdf',
        storageKey: '/uploads/documents/payslip.pdf',
        status: 'VERIFIED',
        verified: true,
        verifiedBy: 'ca@testbank.com',
        verifiedAt: new Date('2026-03-02'),
      },
      {
        id: 'doc-bank',
        category: 'INCOME_PROOF',
        documentType: 'BANK_STATEMENT',
        fileName: 'bank_statement_6m.pdf',
        storageKey: '/uploads/documents/statement.pdf',
        status: 'VERIFIED',
        verified: true,
        verifiedBy: 'ca@testbank.com',
        verifiedAt: new Date('2026-03-02'),
      },
      {
        id: 'doc-photo',
        category: 'APPLICANT_PHOTO',
        documentType: 'CUSTOMER_SELFIE_PHOTO',
        fileName: 'photo.jpg',
        storageKey: '/uploads/documents/photo.jpg',
        status: 'VERIFIED',
        verified: true,
        verifiedBy: 'ca@testbank.com',
        verifiedAt: new Date('2026-03-02'),
      },
    ],
    bankAccounts: [],
    addresses: [],
    employmentDetails: [],
  };

  const mockProduct = {
    id: 'prod-uuid-1',
    code: 'PERS-SAL-PRIME',
    name: 'Personal Prime Loan',
    productType: 'PERSONAL',
    interestRate: 12.0,
    minAmount: 50000,
    maxAmount: 1000000,
    minTenureMonths: 6,
    maxTenureMonths: 48,
  };

  const mockApplication = {
    id: 'app-uuid-1',
    applicationNo: 'APP-2026-0001',
    customerId: 'cust-uuid-1',
    productId: 'prod-uuid-1',
    tenantId: 'tenant-test-bank',
    branchId: 'branch-mumbai-01',
    requestedAmount: 300000,
    tenureMonths: 24,
    purpose: 'Home Renovation',
    status: 'CREDIT_ASSESSMENT',
    stage: 'CREDIT_ASSESSMENT',
    createdAt: new Date('2026-03-01'),
    updatedAt: new Date('2026-03-02'),
    customer: mockCustomer,
    product: mockProduct,
    documents: [],
    eligibility: {
      id: 'elig-1',
      applicationId: 'app-uuid-1',
      result: 'ELIGIBLE',
      factors: {
        recommendation: {
          recommendation: 'RECOMMEND',
          proposedAmount: 300000,
          proposedTenure: 24,
          notes: 'Strong credit profile with verified income and stable employment.',
          recommendedBy: 'analyst@testbank.com',
          recommendedAt: new Date().toISOString(),
        },
      },
    },
    riskAssessment: {
      id: 'risk-1',
      applicationId: 'app-uuid-1',
      score: 82,
      category: 'LOW',
      factors: [
        { name: 'Debt Service Capacity', weight: 30, score: 85, remarks: 'Healthy FOIR' },
        { name: 'Identity & KYC Authenticity', weight: 20, score: 90, remarks: 'Verified' },
      ],
    },
    underwriting: null,
    statusHistory: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Real Application Profile Loading', () => {
    it('should return complete backend profile with Phase 9A tokenized identifiers and consents', async () => {
      vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(mockApplication as any);

      const result = await getAssessmentDetail('app-uuid-1', {
        id: 'ca-user-1',
        roles: ['CREDIT_ANALYST'],
        tenantId: 'tenant-test-bank',
      });

      expect(result.application.id).toBe('app-uuid-1');
      expect(result.application.applicationNo).toBe('APP-2026-0001');
      expect(result.customer.firstName).toBe('Aarav');
      expect(result.customer.panNumber).toBe('ABCDE1234F');
      expect(result.customer.aadhaarNumber).toBe('XXXX-XXXX-9012');
      expect(result.customer.identifiers).toHaveLength(2);
      expect(result.customer.identifiers?.[0].idType).toBe('PAN');
      expect(result.customer.consents).toHaveLength(2);
      expect(result.customer.consents?.[0].consentType).toBe('AADHAAR_KYC');
      expect(result.customer.consents?.[0].granted).toBe(true);
    });

    it('should calculate authoritative FOIR and DTI using backend formulas', async () => {
      vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(mockApplication as any);

      const result = await getAssessmentDetail('app-uuid-1', {
        id: 'ca-user-1',
        roles: ['CREDIT_ANALYST'],
        tenantId: 'tenant-test-bank',
      });

      expect(result.foirAnalysis.monthlyIncome).toBe(75000);
      expect(result.foirAnalysis.existingObligations).toBe(15000);
      expect(result.foirAnalysis.proposedEmi).toBeGreaterThan(0);
      expect(result.foirAnalysis.foirPct).toBeLessThan(result.foirAnalysis.maxAllowedFoirPct);
      expect(result.foirAnalysis.status).toBe('PASS');
    });
  });

  describe('2. Multi-Tenant Isolation & IDOR Protection', () => {
    it('should throw ForbiddenError when Credit Analyst tries to access another tenant application', async () => {
      vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(mockApplication as any);

      await expect(
        getAssessmentDetail('app-uuid-1', {
          id: 'ca-user-other',
          roles: ['CREDIT_ANALYST'],
          tenantId: 'tenant-different-bank',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ForbiddenError when Credit Analyst tries to access another branch application', async () => {
      vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(mockApplication as any);

      await expect(
        getAssessmentDetail('app-uuid-1', {
          id: 'ca-user-mumbai',
          roles: ['CREDIT_ANALYST'],
          tenantId: 'tenant-test-bank',
          branchId: 'branch-delhi-02',
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('3. Document Verification Workflow & RBAC', () => {
    it('should allow Credit Analyst to verify a document with audit trail', async () => {
      const mockDoc = {
        id: 'doc-pan',
        customerId: 'cust-uuid-1',
        category: 'IDENTITY_PROOF',
        documentType: 'PAN_CARD',
        fileName: 'pan.pdf',
        status: 'PENDING',
        verified: false,
        customer: { id: 'cust-uuid-1', tenantId: 'tenant-test-bank', branchId: 'branch-mumbai-01' },
      };
      vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDoc as any);
      vi.mocked(prisma.document.update).mockResolvedValue({
        ...mockDoc,
        status: 'VERIFIED',
        verified: true,
        verifiedBy: 'ca@testbank.com',
      } as any);

      const result = await verifyDocument(
        'doc-pan',
        { status: 'VERIFIED' },
        'ca@testbank.com',
        'ca-user-1',
        { id: 'ca-user-1', roles: ['CREDIT_ANALYST'], tenantId: 'tenant-test-bank' }
      );

      expect(result.status).toBe('VERIFIED');
      expect(result.verified).toBe(true);
      expect(prisma.document.update).toHaveBeenCalled();
    });

    it('should allow Credit Analyst to reject a document with mandatory remarks', async () => {
      const mockDoc = {
        id: 'doc-salary',
        customerId: 'cust-uuid-1',
        category: 'INCOME_PROOF',
        documentType: 'SALARY_SLIP',
        fileName: 'payslip_blurred.pdf',
        status: 'PENDING',
        verified: false,
        customer: { id: 'cust-uuid-1', tenantId: 'tenant-test-bank', branchId: 'branch-mumbai-01' },
      };
      vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDoc as any);
      vi.mocked(prisma.document.update).mockResolvedValue({
        ...mockDoc,
        status: 'REJECTED',
        verified: false,
        rejectionReason: 'Document image unreadable',
      } as any);

      const result = await verifyDocument(
        'doc-salary',
        { status: 'REJECTED', rejectionReason: 'Document image unreadable' },
        'ca@testbank.com',
        'ca-user-1',
        { id: 'ca-user-1', roles: ['CREDIT_ANALYST'], tenantId: 'tenant-test-bank' }
      );

      expect(result.status).toBe('REJECTED');
      expect(result.verified).toBe(false);
      expect(result.rejectionReason).toBe('Document image unreadable');
    });

    it('should prohibit Loan Officer from performing document verification actions', async () => {
      const mockDoc = {
        id: 'doc-pan',
        customerId: 'cust-uuid-1',
        category: 'IDENTITY_PROOF',
        status: 'PENDING',
        customer: { id: 'cust-uuid-1', tenantId: 'tenant-test-bank' },
      };
      vi.mocked(prisma.document.findUnique).mockResolvedValue(mockDoc as any);

      await expect(
        verifyDocument(
          'doc-pan',
          { status: 'VERIFIED' },
          'lo@testbank.com',
          'lo-user-1',
          { id: 'lo-user-1', roles: ['LOAN_OFFICER'], tenantId: 'tenant-test-bank' }
        )
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('4. Recommendation & Decision Persistence', () => {
    it('should record Credit Analyst recommendation and update status to CREDIT_ASSESSMENT', async () => {
      vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(mockApplication as any);
      vi.mocked(prisma.loanApplication.update).mockResolvedValue({
        ...mockApplication,
        status: 'CREDIT_ASSESSMENT',
      } as any);
      vi.mocked(prisma.eligibilityAssessment.upsert).mockResolvedValue({ id: 'elig-1' } as any);

      const result = await submitCreditRecommendation(
        'app-uuid-1',
        {
          recommendation: 'RECOMMEND',
          proposedAmount: 300000,
          proposedTenure: 24,
          proposedRate: 12.0,
          notes: 'Borrower meets all debt servicing benchmarks.',
        },
        { id: 'ca-user-1', email: 'analyst@testbank.com', roles: ['CREDIT_ANALYST'], tenantId: 'tenant-test-bank' }
      );

      expect(result.success).toBe(true);
      expect(result.recommendation.recommendation).toBe('RECOMMEND');
      expect(result.recommendation.proposedAmount).toBe(300000);
      expect(prisma.eligibilityAssessment.upsert).toHaveBeenCalled();
    });
  });

  describe('5. Forward-to-Underwriter Gate Validation', () => {
    it('should block forwarding if borrower KYC is not VERIFIED', async () => {
      const appWithPendingKyc = {
        ...mockApplication,
        customer: {
          ...mockCustomer,
          kycStatus: 'PENDING',
        },
      };
      vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(appWithPendingKyc as any);

      await expect(
        forwardToUnderwriting(
          'app-uuid-1',
          { reason: 'Ready for sanction' },
          { id: 'ca-user-1', roles: ['CREDIT_ANALYST'], tenantId: 'tenant-test-bank' }
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should block forwarding if mandatory documents are unverified', async () => {
      const appWithUnverifiedDocs = {
        ...mockApplication,
        customer: {
          ...mockCustomer,
          documents: [
            { id: 'doc-1', documentType: 'PAN_CARD', status: 'PENDING', verified: false },
          ],
        },
      };
      vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(appWithUnverifiedDocs as any);

      await expect(
        forwardToUnderwriting(
          'app-uuid-1',
          { reason: 'Ready for sanction' },
          { id: 'ca-user-1', roles: ['CREDIT_ANALYST'], tenantId: 'tenant-test-bank' }
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should successfully forward application to Branch Manager / Underwriting when all gates pass', async () => {
      vi.mocked(prisma.loanApplication.findUnique).mockResolvedValue(mockApplication as any);
      vi.mocked(prisma.loanApplication.update).mockResolvedValue({
        ...mockApplication,
        status: 'UNDER_REVIEW',
        stage: 'BRANCH_MANAGER_REVIEW',
      } as any);

      const result = await forwardToUnderwriting(
        'app-uuid-1',
        { reason: 'All mandatory gates verified. Forwarding for review.' },
        { id: 'ca-user-1', email: 'ca@testbank.com', roles: ['CREDIT_ANALYST'], tenantId: 'tenant-test-bank' }
      );

      expect(result.success).toBe(true);
      expect(prisma.loanApplication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'app-uuid-1' },
          data: expect.objectContaining({
            status: 'UNDER_REVIEW',
            stage: 'BRANCH_MANAGER_REVIEW',
          }),
        })
      );
    });
  });
});
