import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  evaluateCustomerOnboardingStatus,
  validateLoanOfficerOriginationEligibility,
} from './customer.service';
import {
  transition,
} from '../application/application.service';
import { verifyDocument } from '../documents/document.service';
import { prisma } from '../../config/prisma';
import { ForbiddenError, BadRequestError } from '../../common/errors';

describe('Customer 360 Onboarding & Loan Officer Workflow Test Suite', () => {
  const tenantId = 'tenant-adyapan-test';
  const branchId = 'branch-delhi-01';

  const loanOfficerUser = {
    id: 'usr-lo-101',
    email: 'lo.delhi@adyapan.com',
    name: 'Rupesh Loan Officer',
    roles: ['LOAN_OFFICER'],
    tenantId,
    branchId,
  };

  const creditAnalystUser = {
    id: 'usr-ca-202',
    email: 'ca.delhi@adyapan.com',
    name: 'Anjali Credit Analyst',
    roles: ['CREDIT_ANALYST'],
    tenantId,
    branchId,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Customer Onboarding Stepper & Stage Status Calculation', () => {
    it('calculates Step 1 completed when core profile fields are present', () => {
      const minimalCustomer = {
        firstName: 'Rajesh',
        lastName: 'Sharma',
        mobile: '9876543210',
        kycStatus: 'PENDING',
        documents: [],
        bankAccounts: [],
        employmentDetails: [],
      };

      const status = evaluateCustomerOnboardingStatus(minimalCustomer);
      expect(status.steps.profileComplete).toBe(true);
      expect(status.steps.kycDocsComplete).toBe(false);
      expect(status.steps.employmentComplete).toBe(false);
      expect(status.steps.bankComplete).toBe(false);
      expect(status.eligible).toBe(false);
      expect(status.missing.length).toBeGreaterThan(0);
    });

    it('calculates Step 2 completed when identity proof and photo documents are uploaded & verified', () => {
      const customerWithKycDocs = {
        firstName: 'Rajesh',
        lastName: 'Sharma',
        mobile: '9876543210',
        kycStatus: 'PENDING',
        documents: [
          { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: true, status: 'VERIFIED' },
          { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', verified: true, status: 'VERIFIED' },
        ],
        bankAccounts: [],
        employmentDetails: [],
      };

      const status = evaluateCustomerOnboardingStatus(customerWithKycDocs);
      expect(status.steps.profileComplete).toBe(true);
      expect(status.steps.kycDocsComplete).toBe(true);
      expect(status.steps.employmentComplete).toBe(false);
      expect(status.steps.bankComplete).toBe(false);
    });

    it('calculates Step 3 & 4 completed when employment income and registered bank accounts exist', () => {
      const customerWithBankAndIncome = {
        firstName: 'Rajesh',
        lastName: 'Sharma',
        mobile: '9876543210',
        kycStatus: 'VERIFIED',
        employmentType: 'SALARIED',
        employerName: 'Tech Services Ltd',
        monthlyIncome: 65000,
        documents: [
          { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: true, status: 'VERIFIED' },
          { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', verified: true, status: 'VERIFIED' },
        ],
        bankAccounts: [
          {
            id: 'bank-acc-1',
            bankName: 'HDFC Bank',
            accountNumber: '50100234567890',
            ifscCode: 'HDFC0001234',
            accountHolderName: 'Rajesh Sharma',
            isPrimary: true,
            isVerified: true,
          },
        ],
        employmentDetails: [
          { employerName: 'Tech Services Ltd', monthlyIncome: 65000 },
        ],
      };

      const status = evaluateCustomerOnboardingStatus(customerWithBankAndIncome);
      expect(status.steps.profileComplete).toBe(true);
      expect(status.steps.kycDocsComplete).toBe(true);
      expect(status.steps.employmentComplete).toBe(true);
      expect(status.steps.bankComplete).toBe(true);
      expect(status.eligible).toBe(true);
      expect(status.missing.length).toBe(0);
    });
  });

  describe('2. Loan Officer Origination Eligibility Verification', () => {
    it('blocks loan origination if customer has no verified documents or bank account', async () => {
      vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue({
        id: 'cust-incomplete-1',
        tenantId,
        branchId,
        firstName: 'Amit',
        lastName: 'Verma',
        mobile: '9811122233',
        kycStatus: 'PENDING',
        monthlyIncome: null,
        employmentType: null,
        documents: [],
        bankAccounts: [],
        employmentDetails: [],
        addresses: [],
      } as any);

      const eligibility = await validateLoanOfficerOriginationEligibility(
        'cust-incomplete-1',
        tenantId,
        loanOfficerUser
      );

      expect(eligibility.eligible).toBe(false);
      expect(eligibility.missing.length).toBeGreaterThan(0);
      expect(eligibility.reasons.some((r) => r.includes('identity') || r.includes('proof') || r.includes('Bank'))).toBe(true);
    });

    it('allows loan origination when customer satisfies all onboarding prerequisites', async () => {
      vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue({
        id: 'cust-ready-1',
        tenantId,
        branchId,
        firstName: 'Priya',
        lastName: 'Nair',
        mobile: '9822233344',
        kycStatus: 'VERIFIED',
        monthlyIncome: 85000,
        employmentType: 'SALARIED',
        employerName: 'Global Solutions',
        documents: [
          { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: true, status: 'VERIFIED' },
          { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', verified: true, status: 'VERIFIED' },
        ],
        bankAccounts: [
          { id: 'bank-acc-1', bankName: 'ICICI Bank', accountNumber: '0011223344', ifscCode: 'ICIC0001234', isPrimary: true, isVerified: true },
        ],
        employmentDetails: [{ employerName: 'Global Solutions', monthlyIncome: 85000 }],
        addresses: [],
      } as any);

      const eligibility = await validateLoanOfficerOriginationEligibility(
        'cust-ready-1',
        tenantId,
        loanOfficerUser
      );

      expect(eligibility.eligible).toBe(true);
      expect(eligibility.missing.length).toBe(0);
    });
  });

  describe('3. Document Verification Access Control & Segregation', () => {
    it('strictly forbids Loan Officer from verifying borrower documents', async () => {
      await expect(
        verifyDocument(
          'doc-pan-1',
          { status: 'VERIFIED', rejectionReason: undefined },
          loanOfficerUser.email,
          loanOfficerUser.id,
          loanOfficerUser
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows Credit Analyst / Underwriter to verify documents and persists verification metadata', async () => {
      const mockDoc = {
        id: 'doc-pan-1',
        customerId: 'cust-1',
        tenantId,
        fileName: 'pan_card.jpg',
        category: 'IDENTITY_PROOF',
        documentType: 'PAN_CARD',
        status: 'PENDING',
        verified: false,
        verifiedBy: null,
        verifiedAt: null,
        customer: {
          id: 'cust-1',
          tenantId,
          branchId,
          firstName: 'Priya',
          lastName: 'Nair',
        },
      };

      vi.spyOn(prisma.document, 'findUnique').mockResolvedValue(mockDoc as any);
      (vi.spyOn(prisma.document, 'update') as any).mockImplementation(async ({ data }: any) => ({
        ...mockDoc,
        ...data,
      }));
      vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const updated = await verifyDocument(
        'doc-pan-1',
        { status: 'VERIFIED', rejectionReason: undefined },
        creditAnalystUser.email,
        creditAnalystUser.id,
        creditAnalystUser
      );

      expect(updated.status).toBe('VERIFIED');
      expect(updated.verified).toBe(true);
      expect(updated.verifiedBy).toBe(creditAnalystUser.email);
      expect(updated.verifiedAt).toBeDefined();
    });
  });

  describe('4. Segregation of Duties & State Transitions', () => {
    it('allows Loan Officer to forward DRAFT application to Credit Analyst (SUBMITTED)', async () => {
      const draftApp = {
        id: 'app-draft-1',
        applicationNo: 'APP-2026-999',
        status: 'DRAFT',
        customerId: 'cust-ready-1',
        tenantId,
        branchId,
        customer: {
          id: 'cust-ready-1',
          tenantId,
          branchId,
          firstName: 'Priya',
          lastName: 'Nair',
          mobile: '9822233344',
          kycStatus: 'VERIFIED',
          monthlyIncome: 85000,
          employmentType: 'SALARIED',
          employerName: 'Global Solutions',
          documents: [
            { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: true, status: 'VERIFIED' },
            { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', verified: true, status: 'VERIFIED' },
          ],
          bankAccounts: [
            { id: 'bank-acc-1', bankName: 'ICICI Bank', accountNumber: '0011223344', ifscCode: 'ICIC0001234', isPrimary: true },
          ],
        },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(draftApp as any);
      vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue(draftApp.customer as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        if (typeof cb === 'function') {
          return cb(prisma);
        }
        return cb;
      });
      vi.spyOn(prisma.loanApplication, 'update').mockResolvedValue({ ...draftApp, status: 'SUBMITTED' } as any);
      vi.spyOn(prisma.applicationStatusHistory, 'create').mockResolvedValue({} as any);

      const transitioned = await transition(
        'app-draft-1',
        'SUBMITTED',
        loanOfficerUser.email,
        'Field verification completed',
        loanOfficerUser
      );

      expect(transitioned.status).toBe('SUBMITTED');
    });

    it('allows Loan Officer to re-forward an application that is already in SUBMITTED state', async () => {
      const submittedApp = {
        id: 'app-submitted-1',
        applicationNo: 'APP-2026-999',
        status: 'SUBMITTED',
        customerId: 'cust-ready-1',
        tenantId,
        branchId,
        customer: {
          id: 'cust-ready-1',
          tenantId,
          branchId,
          firstName: 'Priya',
          lastName: 'Nair',
          mobile: '9822233344',
          kycStatus: 'VERIFIED',
          monthlyIncome: 85000,
          employmentType: 'SALARIED',
          employerName: 'Global Solutions',
          documents: [
            { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: true, status: 'VERIFIED' },
            { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', verified: true, status: 'VERIFIED' },
          ],
          bankAccounts: [
            { id: 'bank-acc-1', bankName: 'ICICI Bank', accountNumber: '0011223344', ifscCode: 'ICIC0001234', isPrimary: true },
          ],
        },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(submittedApp as any);
      vi.spyOn(prisma.customer, 'findUnique').mockResolvedValue(submittedApp.customer as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        if (typeof cb === 'function') {
          return cb(prisma);
        }
        return cb;
      });
      vi.spyOn(prisma.loanApplication, 'update').mockResolvedValue({ ...submittedApp, status: 'SUBMITTED' } as any);
      vi.spyOn(prisma.applicationStatusHistory, 'create').mockResolvedValue({} as any);

      const reforwarded = await transition(
        'app-submitted-1',
        'SUBMITTED',
        loanOfficerUser.email,
        'Application re-forwarded to Credit Analyst queue',
        loanOfficerUser
      );

      expect(reforwarded.status).toBe('SUBMITTED');
    });

    it('strictly forbids Loan Officer from transitioning directly to UNDERWRITING or APPROVED', async () => {
      const draftApp = {
        id: 'app-draft-2',
        applicationNo: 'APP-2026-998',
        status: 'DRAFT',
        customerId: 'cust-ready-1',
        tenantId,
        branchId,
        customer: {
          id: 'cust-ready-1',
          tenantId,
          branchId,
          firstName: 'Priya',
          lastName: 'Nair',
          mobile: '9822233344',
          kycStatus: 'VERIFIED',
          monthlyIncome: 85000,
          documents: [],
          bankAccounts: [],
        },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(draftApp as any);

      await expect(
        transition(
          'app-draft-2',
          'UNDERWRITING',
          loanOfficerUser.email,
          'Attempt bypass',
          loanOfficerUser
        )
      ).rejects.toThrow(ForbiddenError);

      await expect(
        transition(
          'app-draft-2',
          'APPROVED',
          loanOfficerUser.email,
          'Attempt direct approval',
          loanOfficerUser
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows Credit Analyst to transition SUBMITTED application to UNDERWRITING', async () => {
      const submittedApp = {
        id: 'app-submitted-1',
        applicationNo: 'APP-2026-997',
        status: 'SUBMITTED',
        customerId: 'cust-ready-1',
        tenantId,
        branchId,
        customer: {
          id: 'cust-ready-1',
          tenantId,
          branchId,
          firstName: 'Priya',
          lastName: 'Nair',
          mobile: '9822233344',
          kycStatus: 'VERIFIED',
          monthlyIncome: 85000,
          documents: [
            { category: 'IDENTITY_PROOF', documentType: 'PAN_CARD', verified: true, status: 'VERIFIED' },
            { category: 'APPLICANT_PHOTO', documentType: 'CUSTOMER_SELFIE_PHOTO', verified: true, status: 'VERIFIED' },
          ],
          bankAccounts: [
            { id: 'bank-acc-1', bankName: 'ICICI Bank', accountNumber: '0011223344', ifscCode: 'ICIC0001234', isPrimary: true },
          ],
        },
        riskAssessment: { score: 78, category: 'LOW' },
      };

      vi.spyOn(prisma.loanApplication, 'findUnique').mockResolvedValue(submittedApp as any);
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        if (typeof cb === 'function') {
          return cb(prisma);
        }
        return cb;
      });
      vi.spyOn(prisma.loanApplication, 'update').mockResolvedValue({ ...submittedApp, status: 'UNDERWRITING' } as any);
      vi.spyOn(prisma.applicationStatusHistory, 'create').mockResolvedValue({} as any);

      const transitioned = await transition(
        'app-submitted-1',
        'UNDERWRITING',
        creditAnalystUser.email,
        'Credit profile appraised and verified',
        creditAnalystUser
      );

      expect(transitioned.status).toBe('UNDERWRITING');
    });
  });
});
