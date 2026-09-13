/**
 * ADYAPAN LENDING OS — CREDIT ANALYST PORTAL & CREDIT ASSESSMENT WORKSPACE
 *
 * Dedicated Verification Suite:
 * 1. RBAC: Canonical permissions granted vs strictly denied (sanction, disbursement, accounting, GL, configurations)
 * 2. Scope & IDOR: Multi-tenant and cross-branch isolation with zero-trust resolution
 * 3. P4 Workflow State Machine: Handoff from Loan Officer to Credit Analyst and forward to Underwriting
 * 4. Dynamic Document Evaluation: Salaried, Self-Employed, and Student policy rules
 * 5. Segregation of Duties (SoD): Maker-Checker separation and prohibition of self-approval
 */

import { describe, it, expect, vi } from 'vitest';
import { rolePermissionService } from '../roles/role-permission.service';
import { ScopeResolver } from '../roles/scope-resolver';
import { SodValidator } from '../roles/sod-validator';
import { workflowTransitionService } from '../workflows/workflow-transition.service';
import { calculateApplicableDocuments, validateCustomerDocumentFulfillment } from '../documents/document-rules';
import { ForbiddenError, BadRequestError } from '../../common/errors';

// Mocks for database operations
vi.mock('../../config/prisma', () => {
  const mockCustomerSalaried = {
    id: 'cust-salaried-01',
    customerCode: 'CUST-2026-SAL01',
    tenantId: 'tenant-adyapan-alpha',
    branchId: 'branch-mumbai-central',
    firstName: 'Rohan',
    lastName: 'Sharma',
    mobile: '9820112233',
    email: 'rohan.sharma@example.com',
    employmentType: 'SALARIED',
    monthlyIncome: 85000,
    kycStatus: 'VERIFIED',
    status: 'ACTIVE',
    documents: [
      { id: 'doc-pan', category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: true, status: 'VERIFIED' },
      { id: 'doc-aadhaar', category: 'ADDRESS_PROOF', documentType: 'AADHAAR', verified: true, status: 'VERIFIED' },
      { id: 'doc-photo', category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', verified: true, status: 'VERIFIED' },
      { id: 'doc-sal', category: 'INCOME_PROOF', documentType: 'SALARY_SLIP', verified: true, status: 'VERIFIED' },
      { id: 'doc-bank', category: 'INCOME_PROOF', documentType: 'BANK_STATEMENT', verified: true, status: 'VERIFIED' },
    ],
    bankAccounts: [
      { id: 'bank-01', bankName: 'ICICI Bank', accountNumber: '001102003344', ifscCode: 'ICIC0000011', isVerified: true, isPrimary: true },
    ],
    employmentDetails: [
      { id: 'emp-01', employerName: 'Tata Consultancy Services', employmentType: 'SALARIED', monthlyIncome: 85000 },
    ],
    addresses: [
      { id: 'addr-01', addressLine: '12B Nariman Point', city: 'Mumbai', state: 'Maharashtra', pincode: '400021', isPrimary: true },
    ],
    consents: [
      { id: 'consent-01', consentType: 'CREDIT_BUREAU', status: 'GRANTED' },
    ],
  };

  const mockAppSalaried = {
    id: 'app-salaried-101',
    applicationNo: 'APP-2026-SAL01',
    tenantId: 'tenant-adyapan-alpha',
    branchId: 'branch-mumbai-central',
    customerId: 'cust-salaried-01',
    customer: mockCustomerSalaried,
    productId: 'prod-personal-01',
    product: {
      id: 'prod-personal-01',
      name: 'Personal Prime Loan',
      code: 'PERS-PRIME',
      productType: 'PERSONAL',
      interestRate: 11.5,
      minAmount: 50000,
      maxAmount: 1500000,
      minTenureMonths: 6,
      maxTenureMonths: 60,
    },
    requestedAmount: 400000,
    tenureMonths: 24,
    status: 'CREDIT_ASSESSMENT',
    statusHistory: [
      { id: 'h-01', fromStatus: 'SUBMITTED', toStatus: 'CREDIT_ASSESSMENT', changedBy: 'lo-officer-1', createdAt: new Date() },
    ],
    documents: [],
    eligibility: {
      id: 'elig-01',
      applicationId: 'app-salaried-101',
      result: 'ELIGIBLE',
      factors: {
        foir: 38.5,
        disposableIncome: 52000,
        recommendation: {
          recommendation: 'RECOMMEND',
          notes: 'Strong repayment capacity, clean bureau, stable employment.',
          recommendedBy: 'ca-analyst-1@adyapan.com',
          recommendedAt: new Date().toISOString(),
        },
      },
    },
    riskAssessment: {
      id: 'risk-01',
      applicationId: 'app-salaried-101',
      score: 790,
      category: 'LOW',
      factors: { fraudHold: false },
    },
    underwriting: null,
    approvals: [],
  };

  const mockAppFraudHeld = {
    ...mockAppSalaried,
    id: 'app-fraud-held-102',
    applicationNo: 'APP-2026-FRAUD02',
    fraudHoldActive: true,
    riskAssessment: {
      id: 'risk-02',
      applicationId: 'app-fraud-held-102',
      score: 410,
      category: 'HIGH',
      factors: { fraudHold: true },
    },
  };

  return {
    prisma: {
      loanApplication: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'app-salaried-101') return Promise.resolve(mockAppSalaried);
          if (where.id === 'app-fraud-held-102') return Promise.resolve(mockAppFraudHeld);
          return Promise.resolve(null);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          return Promise.resolve({ ...mockAppSalaried, ...data });
        }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-log-01' }),
      },
      applicationStatusHistory: {
        create: vi.fn().mockResolvedValue({ id: 'h-new-01' }),
      },
      $transaction: vi.fn().mockImplementation(async (callback) => {
        return callback({
          loanApplication: {
            findUnique: vi.fn().mockResolvedValue(mockAppSalaried),
            update: vi.fn().mockResolvedValue({ ...mockAppSalaried, status: 'UNDERWRITING' }),
          },
          customer: {
            update: vi.fn().mockResolvedValue(mockCustomerSalaried),
          },
          applicationStatusHistory: {
            create: vi.fn().mockResolvedValue({ id: 'h-new-01' }),
          },
          eligibilityAssessment: {
            upsert: vi.fn().mockResolvedValue({ id: 'elig-upserted' }),
          },
        });
      }),
    },
  };
});

describe('ADYAPAN Lending OS: Credit Analyst Portal & Credit Assessment Workspace Verification', () => {
  const tenantAlpha = 'tenant-adyapan-alpha';
  const tenantBeta = 'tenant-adyapan-beta';
  const branchMumbai = 'branch-mumbai-central';
  const branchDelhi = 'branch-delhi-connaught';

  const creditAnalystActor = {
    id: 'usr-ca-01',
    email: 'ca01@adyapan.com',
    roles: ['CREDIT_ANALYST'],
    tenantId: tenantAlpha,
    branchId: branchMumbai,
  };

  // ---------------------------------------------------------------------------
  // 1. RBAC & Canonical Permission Boundaries
  // ---------------------------------------------------------------------------
  describe('1. RBAC & Canonical Permission Boundaries', () => {
    it('grants Credit Analyst credit assessment, document review, and bureau view permissions', () => {
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'credit.view')).toBe(true);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'credit.assess')).toBe(true);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'credit.recommend')).toBe(true);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'application.review')).toBe(true);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'underwriting.bureau_view')).toBe(true);
    });

    it('strictly DENIES final loan sanction, underwriter decision, and approval override to Credit Analyst', () => {
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'underwriting.decide')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'underwriting.override')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'application.approve')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'approval.approve')).toBe(false);
    });

    it('strictly DENIES financial payout, disbursement execution, and GL posting to Credit Analyst', () => {
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'disbursement.view')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'disbursement.execute')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'payout.approve')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'accounting.journal.post')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'accounting.journal.approve')).toBe(false);
    });

    it('strictly DENIES platform configuration, policy authoring, and tenant administration to Credit Analyst', () => {
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'tenant.manage')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'user.manage')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'config.manage')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalystActor, 'risk.manage_policies')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Scope & Zero-Trust IDOR Protection
  // ---------------------------------------------------------------------------
  describe('2. Scope & Zero-Trust IDOR Protection', () => {
    it('allows Credit Analyst within permitted tenant and branch scope', () => {
      const resolved = ScopeResolver.resolveAuthorizedScope(creditAnalystActor, {
        requestedTenantId: tenantAlpha,
        requestedBranchId: branchMumbai,
      });

      expect(resolved.tenantId).toBe(tenantAlpha);
      expect(resolved.branchId).toBe(branchMumbai);
    });

    it('rejects cross-tenant access attempts (Tenant Alpha analyst on Tenant Beta application)', () => {
      expect(() => {
        ScopeResolver.resolveAuthorizedScope(creditAnalystActor, {
          requestedTenantId: tenantBeta,
        });
      }).toThrowError(ForbiddenError);
    });

    it('rejects client payload tampering for forged tenantId or analyst identity', () => {
      const forgedPayload = {
        tenantId: 'tenant-tampered-hacker',
        analystId: 'usr-ca-999',
      };

      expect(() => {
        ScopeResolver.resolveAuthorizedScope(creditAnalystActor, {
          requestedTenantId: forgedPayload.tenantId,
        });
      }).toThrowError(ForbiddenError);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Dynamic Document Policy Verification (Salaried, Self-Employed, Student)
  // ---------------------------------------------------------------------------
  describe('3. Dynamic Document Policy Engine Verification', () => {
    it('requires Salary Slips + Bank Statement for SALARIED applicants, rejecting business ITR as mandatory', () => {
      const salariedChecklist = calculateApplicableDocuments('SALARIED', 'PERSONAL');
      const mandatoryCodes = salariedChecklist.mandatory.map((r) => r.code);

      expect(mandatoryCodes).toContain('IDENTITY_PROOF');
      expect(mandatoryCodes).toContain('ADDRESS_PROOF');
      expect(mandatoryCodes).toContain('APPLICANT_PHOTO');
      expect(mandatoryCodes).toContain('SALARY_SLIPS');
      expect(mandatoryCodes).toContain('BANK_STATEMENTS');
      expect(mandatoryCodes).not.toContain('BUSINESS_ITR');
      expect(mandatoryCodes).not.toContain('STUDENT_ID_PROOF');
    });

    it('requires Business ITR + Current Bank Statement for SELF_EMPLOYED applicants, making Salary Slip not applicable', () => {
      const seChecklist = calculateApplicableDocuments('SELF_EMPLOYED', 'BUSINESS');
      const mandatoryCodes = seChecklist.mandatory.map((r) => r.code);
      const naCodes = seChecklist.notApplicable.map((r) => r.code);

      expect(mandatoryCodes).toContain('BUSINESS_ITR');
      expect(mandatoryCodes).toContain('BUSINESS_BANK_STATEMENTS');
      expect(naCodes).toContain('SALARY_SLIPS');
      expect(naCodes).toContain('FORM_16');
    });

    it('requires Student ID & Admission Letter for STUDENT applicants without forcing salaried/business documents', () => {
      const studentChecklist = calculateApplicableDocuments('STUDENT', 'EDUCATION');
      const mandatoryCodes = studentChecklist.mandatory.map((r) => r.code);

      expect(mandatoryCodes).toContain('STUDENT_ID_PROOF');
      expect(mandatoryCodes).not.toContain('SALARY_SLIPS');
      expect(mandatoryCodes).not.toContain('BUSINESS_ITR');
    });

    it('validates document fulfillment correctly when all required documents are verified', () => {
      const uploadedDocs = [
        { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: true },
        { category: 'ADDRESS_PROOF', documentType: 'AADHAAR', verified: true },
        { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', verified: true },
        { category: 'INCOME_PROOF', documentType: 'SALARY_SLIP', verified: true },
        { category: 'INCOME_PROOF', documentType: 'BANK_STATEMENT', verified: true },
      ];

      const fulfillment = validateCustomerDocumentFulfillment(uploadedDocs, 'SALARIED', 'PERSONAL');
      expect(fulfillment.isComplete).toBe(true);
      expect(fulfillment.missingCodes.length).toBe(0);
    });

    it('flags missing mandatory documents when income proof is omitted', () => {
      const uploadedDocsWithoutIncome = [
        { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: true },
        { category: 'ADDRESS_PROOF', documentType: 'AADHAAR', verified: true },
        { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', verified: true },
      ];

      const fulfillment = validateCustomerDocumentFulfillment(uploadedDocsWithoutIncome, 'SALARIED', 'PERSONAL');
      expect(fulfillment.isComplete).toBe(false);
      expect(fulfillment.missingCodes).toContain('SALARY_SLIPS');
      expect(fulfillment.missingCodes).toContain('BANK_STATEMENTS');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. P4 State Machine Handoff & Stage Gate Anti-Bypass
  // ---------------------------------------------------------------------------
  describe('4. P4 State Machine Handoff & Stage Gate Anti-Bypass', () => {
    it('allows Credit Analyst to advance application from CREDIT_ASSESSMENT to UNDERWRITING when gates pass', async () => {
      const evaluation = await workflowTransitionService.evaluateTransitionEligibility(
        'app-salaried-101',
        'UNDERWRITING',
        creditAnalystActor
      );

      expect(evaluation.allowed).toBe(true);
      expect(evaluation.currentStatus).toBe('CREDIT_ASSESSMENT');
      expect(evaluation.targetStatus).toBe('UNDERWRITING');
      expect(evaluation.blockingReasons.length).toBe(0);
    });

    it('blocks Credit Analyst from directly advancing application to APPROVED (Sanction Bypass Block)', async () => {
      const evaluation = await workflowTransitionService.evaluateTransitionEligibility(
        'app-salaried-101',
        'APPROVED',
        creditAnalystActor
      );

      expect(evaluation.allowed).toBe(false);
      expect(evaluation.blockingReasons.some((r) => r.includes('lacks required permission'))).toBe(true);
    });

    it('blocks Credit Analyst from directly advancing application to READY_FOR_DISBURSEMENT (Disbursement Bypass Block)', async () => {
      const evaluation = await workflowTransitionService.evaluateTransitionEligibility(
        'app-salaried-101',
        'READY_FOR_DISBURSEMENT',
        creditAnalystActor
      );

      expect(evaluation.allowed).toBe(false);
    });

    it('blocks forward to Underwriting when an active Fraud Hold is present', async () => {
      const evaluation = await workflowTransitionService.evaluateTransitionEligibility(
        'app-fraud-held-102',
        'UNDERWRITING',
        creditAnalystActor
      );

      expect(evaluation.allowed).toBe(false);
      expect(evaluation.blockingReasons.some((r) => r.toLowerCase().includes('fraud'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Segregation of Duties (SoD) & Maker-Checker Integrity
  // ---------------------------------------------------------------------------
  describe('5. Segregation of Duties (SoD) & Maker-Checker Integrity', () => {
    it('prohibits Credit Analyst from approving or sanctioning their own recommended application', () => {
      expect(() => {
        SodValidator.assertMakerCheckerSeparation(
          'usr-ca-01', // Recommending Credit Analyst
          'usr-ca-01', // Sanctioning Approver (Self-Approval attempt)
          'LOAN_SANCTION_APPROVAL'
        );
      }).toThrowError(ForbiddenError);
    });

    it('prohibits Credit Analyst from executing financial payout release', () => {
      expect(() => {
        SodValidator.assertLoanOfficerSeparation(
          'usr-ca-01', // Credit Analyst
          'usr-ca-01', // Disbursement Release Actor
          'DISBURSEMENT_PAYOUT_EXECUTION'
        );
      }).toThrowError(ForbiddenError);
    });

    it('allows distinct Credit Analyst and Underwriter to act across sequential workflow stages', () => {
      expect(() => {
        SodValidator.assertMakerCheckerSeparation(
          'usr-ca-01', // Recommending Credit Analyst
          'usr-uw-02', // Independent Underwriting Authority
          'LOAN_SANCTION_APPROVAL'
        );
      }).not.toThrow();
    });
  });
});
