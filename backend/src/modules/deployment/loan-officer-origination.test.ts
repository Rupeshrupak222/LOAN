import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rolePermissionService } from '../roles/role-permission.service';
import { ScopeResolver } from '../roles/scope-resolver';
import { SodValidator } from '../roles/sod-validator';
import { workflowTransitionService } from '../workflows/workflow-transition.service';
import { calculateApplicableDocuments, validateCustomerDocumentFulfillment, normalizeEmploymentType } from '../documents/document-rules';
import { leadService } from '../origination/lead.service';
import { ForbiddenError, BadRequestError, ConflictError, NotFoundError } from '../../common/errors';

// Mocks for DB operations in unit test
vi.mock('../../config/prisma', () => {
  const mockCustomer = {
    id: 'cust-101',
    customerCode: 'CUST-2026-00101',
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-south-mumbai',
    firstName: 'Aarav',
    lastName: 'Patel',
    mobile: '9876543210',
    email: 'aarav.patel@example.com',
    employmentType: 'SALARIED',
    monthlyIncome: 75000,
    kycStatus: 'VERIFIED',
    status: 'ACTIVE',
    documents: [
      { id: 'doc-pan', category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: true, status: 'VERIFIED' },
      { id: 'doc-aadhaar', category: 'ADDRESS_PROOF', documentType: 'AADHAAR', verified: true, status: 'VERIFIED' },
      { id: 'doc-selfie', category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', verified: true, status: 'VERIFIED' },
      { id: 'doc-sal', category: 'INCOME_PROOF', documentType: 'SALARY_SLIP', verified: true, status: 'VERIFIED' },
      { id: 'doc-bank', category: 'INCOME_PROOF', documentType: 'BANK_STATEMENT', verified: true, status: 'VERIFIED' },
    ],
    bankAccounts: [
      { id: 'bank-01', bankName: 'HDFC Bank', accountNumber: '50100234567890', ifscCode: 'HDFC0001234', isVerified: true, isPrimary: true },
    ],
    employmentDetails: [
      { id: 'emp-01', employerName: 'Infosys Limited', employmentType: 'SALARIED', monthlyIncome: 75000 },
    ],
    addresses: [
      { id: 'addr-01', addressLine: 'Flat 402, Palm Heights', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', isPrimary: true },
    ],
    consents: [
      { id: 'consent-01', consentType: 'CREDIT_BUREAU', status: 'GRANTED' },
    ],
  };

  const mockApp = {
    id: 'app-101',
    applicationNo: 'APP-2026-00001',
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-south-mumbai',
    customerId: 'cust-101',
    customer: mockCustomer,
    productId: 'prod-personal-01',
    product: {
      id: 'prod-personal-01',
      name: 'Personal Prime Loan',
      code: 'PERS-PRIME',
      productType: 'PERSONAL',
      interestRate: 12.5,
      minAmount: 50000,
      maxAmount: 1000000,
      minTenureMonths: 6,
      maxTenureMonths: 60,
    },
    requestedAmount: 300000,
    tenureMonths: 24,
    status: 'DRAFT',
    statusHistory: [
      { id: 'h-01', fromStatus: null, toStatus: 'DRAFT', changedBy: 'loan-officer-1', createdAt: new Date() },
    ],
    documents: [],
    eligibility: null,
    riskAssessment: null,
    underwriting: null,
    approvals: [],
  };

  const mockKycVerifiedApp = {
    ...mockApp,
    id: 'app-kyc-verified-101',
    status: 'KYC_VERIFIED',
  };

  return {
    prisma: {
      loanApplication: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'app-101') return Promise.resolve(mockApp);
          if (where.id === 'app-kyc-verified-101') return Promise.resolve(mockKycVerifiedApp);
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([mockApp]),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockApp, ...data, id: 'app-new-102' })),
        update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ ...mockApp, ...data })),
      },
      customer: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'cust-101') return Promise.resolve(mockCustomer);
          return Promise.resolve(null);
        }),
        findFirst: vi.fn().mockImplementation(({ where }) => {
          if (where.mobile === '9876543210') return Promise.resolve(mockCustomer);
          return Promise.resolve(null);
        }),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...mockCustomer, ...data, id: 'cust-new-102' })),
        update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ ...mockCustomer, ...data })),
      },
      loanProduct: {
        findUnique: vi.fn().mockResolvedValue(mockApp.product),
        findFirst: vi.fn().mockResolvedValue(mockApp.product),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-01' }),
      },
      $transaction: vi.fn().mockImplementation((cb) => cb({
        loanApplication: {
          findUnique: vi.fn().mockResolvedValue(mockApp),
          update: vi.fn().mockResolvedValue({ ...mockApp, status: 'SUBMITTED' }),
        },
      })),
    },
  };
});

describe('Loan Officer Portal & Origination Workspace Productization Phase', () => {
  const loanOfficerActor = {
    id: 'user-lo-1',
    email: 'rohan.lo@adyapan.com',
    roles: ['LOAN_OFFICER'],
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-south-mumbai',
  };

  const otherBranchActor = {
    id: 'user-lo-2',
    email: 'priya.lo@adyapan.com',
    roles: ['LOAN_OFFICER'],
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-north-delhi',
  };

  const otherTenantActor = {
    id: 'user-lo-3',
    email: 'vikas.lo@apex.com',
    roles: ['LOAN_OFFICER'],
    tenantId: 'tenant-apex-nbfc',
    branchId: 'branch-apex-pune',
  };

  const creditAnalystActor = {
    id: 'user-ca-1',
    email: 'ananya.ca@adyapan.com',
    roles: ['CREDIT_ANALYST'],
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-south-mumbai',
  };

  const underwriterActor = {
    id: 'user-uw-1',
    email: 'manish.uw@adyapan.com',
    roles: ['UNDERWRITER'],
    tenantId: 'tenant-adyapan-default',
    branchId: 'branch-south-mumbai',
  };

  beforeEach(() => {
    rolePermissionService.seedSystemRoles('tenant-adyapan-default');
    rolePermissionService.seedSystemRoles('tenant-apex-nbfc');
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Role & Permission Boundaries
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Loan Officer Role & Permission Matrix', () => {
    it('grants all canonical origination capabilities to LOAN_OFFICER', () => {
      const allowedPermissions = [
        'application.create',
        'application.view',
        'application.submit',
        'customer.view',
        'customer.create',
        'customer.update',
        'customer.kyc.initiate',
        'customer.kyc.view',
        'application.documents.view',
        'application.documents.upload',
        'lead.view',
        'lead.create',
        'task.view',
        'support.create',
        'support.view',
      ];

      for (const perm of allowedPermissions) {
        expect(
          rolePermissionService.hasPermission(loanOfficerActor as any, perm as any),
          `Expected LOAN_OFFICER to have permission: ${perm}`
        ).toBe(true);
      }
    });

    it('strictly forbids credit assessment, underwriting, approval, and financial disbursement to LOAN_OFFICER', () => {
      const forbiddenPermissions = [
        'credit.assess',
        'credit.recommend',
        'underwriting.view',
        'underwriting.decide',
        'underwriting.override',
        'approval.approve',
        'disbursement.execute',
        'payout.initiate',
        'payout.approve',
        'finance.gl.post',
        'accounting.journal.approve',
        'risk.override',
        'fraud.override',
        'collection.settle',
        'collection.writeoff',
        'tenants.manage',
      ];

      for (const perm of forbiddenPermissions) {
        expect(
          rolePermissionService.hasPermission(loanOfficerActor as any, perm as any),
          `LOAN_OFFICER must NOT possess forbidden permission: ${perm}`
        ).toBe(false);
      }
    });

    it('verifies that LOAN_OFFICER sanction and payout limits are zero', () => {
      const role = rolePermissionService.getRole('tenant-adyapan-default', 'LOAN_OFFICER');
      expect(role).toBeDefined();
      expect(role?.sanctionLimitAmount).toBe(0);
      expect(role?.payoutLimitAmount).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Scope Resolution & Zero-Trust IDOR Protection
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Scope Resolution & Multi-Tenant / Branch Data Isolation', () => {
    it('binds Loan Officer strictly to their assigned branch and tenant', () => {
      const scope = ScopeResolver.resolveAuthorizedScope(loanOfficerActor as any, {
        requestedTenantId: 'tenant-adyapan-default',
        requestedBranchId: 'branch-south-mumbai',
      });
      expect(scope.tenantId).toBe('tenant-adyapan-default');
      expect(scope.branchId).toBe('branch-south-mumbai');
    });

    it('blocks cross-tenant resource access attempts by Loan Officer', () => {
      expect(() => {
        ScopeResolver.resolveAuthorizedScope(loanOfficerActor as any, {
          requestedTenantId: 'tenant-apex-nbfc',
        });
      }).toThrowError(ForbiddenError);
    });

    it('blocks cross-branch resource manipulation attempts by branch Loan Officer', () => {
      expect(() => {
        ScopeResolver.resolveAuthorizedScope(loanOfficerActor as any, {
          requestedBranchId: 'branch-north-delhi',
        });
      }).toThrowError(ForbiddenError);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Dynamic Document Requirements per Customer Type
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Customer Types & Dynamic Document Policy Engine', () => {
    it('evaluates Salaried customer document requirements correctly', () => {
      const checklist = calculateApplicableDocuments('SALARIED', 'PERSONAL', { monthlyIncome: 80000 });
      const mandatoryCodes = checklist.mandatory.map((d) => d.code);
      const notApplicableCodes = checklist.notApplicable.map((d) => d.code);

      expect(mandatoryCodes).toContain('IDENTITY_PROOF');
      expect(mandatoryCodes).toContain('ADDRESS_PROOF');
      expect(mandatoryCodes).toContain('APPLICANT_PHOTO');
      expect(mandatoryCodes).toContain('SALARY_SLIPS');
      expect(mandatoryCodes).toContain('BANK_STATEMENTS');

      // Business documents should NOT be applicable for Salaried
      expect(notApplicableCodes).toContain('BUSINESS_ITR');
      expect(notApplicableCodes).toContain('BUSINESS_REGISTRATION');
    });

    it('evaluates Self-Employed / Business customer document requirements correctly', () => {
      const checklist = calculateApplicableDocuments('SELF_EMPLOYED', 'PERSONAL', { monthlyIncome: 120000 });
      const mandatoryCodes = checklist.mandatory.map((d) => d.code);
      const notApplicableCodes = checklist.notApplicable.map((d) => d.code);

      expect(mandatoryCodes).toContain('IDENTITY_PROOF');
      expect(mandatoryCodes).toContain('ADDRESS_PROOF');
      expect(mandatoryCodes).toContain('APPLICANT_PHOTO');
      expect(mandatoryCodes).toContain('BUSINESS_ITR');
      expect(mandatoryCodes).toContain('BUSINESS_BANK_STATEMENTS');

      // Salary Slips should NOT be applicable for Self-Employed
      expect(notApplicableCodes).toContain('SALARY_SLIPS');
    });

    it('evaluates Student customer document requirements correctly without forcing salaried income slips', () => {
      const checklist = calculateApplicableDocuments('STUDENT', 'EDUCATION', {});
      const mandatoryCodes = checklist.mandatory.map((d) => d.code);
      const notApplicableCodes = checklist.notApplicable.map((d) => d.code);

      expect(mandatoryCodes).toContain('IDENTITY_PROOF');
      expect(mandatoryCodes).toContain('ADDRESS_PROOF');
      expect(mandatoryCodes).toContain('APPLICANT_PHOTO');
      expect(mandatoryCodes).toContain('STUDENT_ID_PROOF');

      // Salary Slips and Business ITR must NEVER be mandatory or forced on Students
      expect(notApplicableCodes).toContain('SALARY_SLIPS');
      expect(notApplicableCodes).toContain('BUSINESS_REGISTRATION');
    });

    it('validates customer document fulfillment and reports missing mandatory documents', () => {
      const incompleteDocs = [
        { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', status: 'VERIFIED' },
      ];

      const validation = validateCustomerDocumentFulfillment(incompleteDocs, 'SALARIED', 'PERSONAL', { monthlyIncome: 50000 });
      expect(validation.isComplete).toBe(false);
      expect(validation.missingCodes).toContain('ADDRESS_PROOF');
      expect(validation.missingCodes).toContain('APPLICANT_PHOTO');
      expect(validation.missingCodes).toContain('SALARY_SLIPS');
      expect(validation.missingCodes).toContain('BANK_STATEMENTS');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Lead Sourcing & Conversion Engine
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Lead Sourcing, Tracking & Conversion', () => {
    it('creates a new lead with branch and tenant scope isolation', async () => {
      const lead = await leadService.createLead(
        {
          firstName: 'Siddharth',
          lastName: 'Joshi',
          mobile: '9820011223',
          email: 'siddharth.joshi@example.com',
          employmentType: 'SALARIED',
          employerName: 'L&T Infotech',
          monthlyIncome: 95000,
          requestedAmount: 600000,
          source: 'BRANCH',
          notes: 'Customer visited branch seeking home renovation personal loan.',
        },
        loanOfficerActor
      );

      expect(lead).toBeDefined();
      expect(lead.leadCode).toMatch(/^LEAD-2026-\d+$/);
      expect(lead.tenantId).toBe('tenant-adyapan-default');
      expect(lead.branchId).toBe('branch-south-mumbai');
      expect(lead.status).toBe('NEW');
    });

    it('converts a lead into a formal Customer profile and Loan Application', async () => {
      const lead = await leadService.createLead(
        {
          firstName: 'Neha',
          lastName: 'Kapoor',
          mobile: '9811122334',
          email: 'neha.kapoor@example.com',
          employmentType: 'SELF_EMPLOYED',
          employerName: 'Kapoor & Associates',
          monthlyIncome: 150000,
          requestedAmount: 800000,
          source: 'DIGITAL',
        },
        loanOfficerActor
      );

      const result = await leadService.convertLeadToApplication(
        lead.id,
        { requestedAmount: 800000, tenureMonths: 36, purpose: 'Working capital expansion' },
        loanOfficerActor
      );

      expect(result.customer).toBeDefined();
      expect(result.application).toBeDefined();
      expect(result.application.status).toBe('DRAFT');
      expect(result.application.requestedAmount).toBeDefined();

      const updatedLead = await leadService.getLead(lead.id, loanOfficerActor);
      expect(updatedLead.status).toBe('CONVERTED');
      expect(updatedLead.convertedApplicationId).toBe(result.application.id);
    });

    it('blocks duplicate conversion of an already converted lead', async () => {
      const lead = await leadService.createLead(
        {
          firstName: 'Tarun',
          lastName: 'Bansal',
          mobile: '9833344556',
          employmentType: 'SALARIED',
          requestedAmount: 400000,
          source: 'DIRECT',
        },
        loanOfficerActor
      );

      await leadService.convertLeadToApplication(lead.id, {}, loanOfficerActor);

      await expect(
        leadService.convertLeadToApplication(lead.id, {}, loanOfficerActor)
      ).rejects.toThrowError(BadRequestError);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Authoritative Workflow Gates & Strict Handoff to Credit Analyst
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Authoritative Workflow Gates & Handoff to Credit Analyst', () => {
    it('evaluates transition eligibility for DRAFT to SUBMITTED by Loan Officer', async () => {
      const evaluation = await workflowTransitionService.evaluateTransitionEligibility(
        'app-101',
        'SUBMITTED',
        loanOfficerActor
      );

      expect(evaluation.allowed).toBe(true);
      expect(evaluation.currentStatus).toBe('DRAFT');
      expect(evaluation.targetStatus).toBe('SUBMITTED');
    });

    it('blocks Loan Officer from directly transitioning an application to UNDERWRITING or APPROVED', async () => {
      const uwEvaluation = await workflowTransitionService.evaluateTransitionEligibility(
        'app-101',
        'UNDERWRITING',
        loanOfficerActor
      );
      expect(uwEvaluation.allowed).toBe(false);
      expect(uwEvaluation.blockingReasons.some((r) => r.includes('lacks required permission'))).toBe(true);

      const approveEvaluation = await workflowTransitionService.evaluateTransitionEligibility(
        'app-101',
        'APPROVED',
        loanOfficerActor
      );
      expect(approveEvaluation.allowed).toBe(false);
    });

    it('confirms that upon SUBMITTED stage, the authoritative next operational role is CREDIT_ANALYST', async () => {
      const evaluation = await workflowTransitionService.evaluateTransitionEligibility(
        'app-kyc-verified-101',
        'CREDIT_ASSESSMENT',
        creditAnalystActor
      );

      expect(evaluation.nextValidAction.requiredRole).toBe('CREDIT_ANALYST');
      expect(evaluation.nextValidAction.actionKey).toBe('EVALUATE_CREDIT');
      expect(evaluation.nextValidAction.targetRoute).toBe('/credit-assessment');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Segregation of Duties (SoD) & Anti-Bypass Enforcement
  // ──────────────────────────────────────────────────────────────────────────
  describe('6. Segregation of Duties (SoD) & Anti-Bypass Verification', () => {
    it('prohibits the Loan Officer who created the application from approving loan sanction (Maker-Checker)', () => {
      expect(() => {
        SodValidator.assertMakerCheckerSeparation(
          'user-lo-1', // Maker / Sourcing Loan Officer
          'user-lo-1', // Checker / Approving Actor
          'LOAN_SANCTION_APPROVAL'
        );
      }).toThrowError(ForbiddenError);
    });

    it('prohibits the Loan Officer who originated the application from executing disbursement', () => {
      expect(() => {
        SodValidator.assertLoanOfficerSeparation(
          'user-lo-1', // Sourcing Loan Officer
          'user-lo-1', // Disbursement Release Actor
          'DISBURSEMENT_PAYOUT_EXECUTION'
        );
      }).toThrowError(ForbiddenError);
    });

    it('allows distinct Credit Analyst and Underwriter to act downstream', () => {
      expect(() => {
        SodValidator.assertMakerCheckerSeparation(
          'user-lo-1', // Sourcing Loan Officer
          'user-uw-1', // Underwriting Approver
          'LOAN_SANCTION_APPROVAL'
        );
      }).not.toThrow();
    });
  });
});
