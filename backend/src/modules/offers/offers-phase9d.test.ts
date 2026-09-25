import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OfferEngineService } from './offers.service';
import { BorrowerService } from '../borrower/borrower.service';
import { ContractsService } from '../contracts/contracts.service';
import { forwardToFinanceOfficer } from '../underwriting/underwriting.service';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

// Mock dependencies
vi.mock('../../config/prisma', () => {
  const mockApplication = {
    id: 'app-phase9d-001',
    applicationNo: 'APP-9D-2026-001',
    customerId: 'cust-9d-001',
    productId: 'prod-pl-instant',
    requestedAmount: 300000,
    tenureMonths: 24,
    status: 'APPROVED',
    tenantId: 'tenant-adyapan-default',
    customer: {
      id: 'cust-9d-001',
      userId: 'user-borrower-001',
      firstName: 'Ananya',
      lastName: 'Iyer',
      customerCode: 'CUST-9D-001',
      email: 'ananya.iyer@example.com',
      mobile: '+91 98765 12345',
      kycStatus: 'VERIFIED',
    },
    product: {
      id: 'prod-pl-instant',
      code: 'PERSONAL_PRIME_SALARIED',
      name: 'Personal Loan - Salaried Prime',
      interestRate: 14.0,
      processingFeePct: 2.0,
      minAmount: 10000,
      maxAmount: 2500000,
    },
    underwriting: {
      decision: 'APPROVE',
      decidedBy: 'underwriter@adyapan.dev',
    },
  };

  return {
    prisma: {
      loanApplication: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'app-phase9d-001') {
            return Promise.resolve(mockApplication);
          }
          if (where.id === 'app-rejected-001') {
            return Promise.resolve({
              ...mockApplication,
              id: 'app-rejected-001',
              status: 'REJECTED',
              underwriting: { decision: 'REJECT' },
            });
          }
          if (where.id === 'app-other-cust') {
            return Promise.resolve({
              ...mockApplication,
              id: 'app-other-cust',
              customerId: 'cust-other-999',
              customer: {
                id: 'cust-other-999',
                userId: 'user-other-999',
                firstName: 'Other',
                lastName: 'Borrower',
                customerCode: 'CUST-OTHER-999',
                email: 'other@example.com',
              },
            });
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockResolvedValue([mockApplication]),
        update: vi.fn().mockResolvedValue({}),
      },
      customer: {
        findFirst: vi.fn().mockImplementation(({ where }) => {
          if (where.userId === 'user-borrower-001') {
            return Promise.resolve(mockApplication.customer);
          }
          if (where.userId === 'user-other-999') {
            return Promise.resolve({
              id: 'cust-other-999',
              userId: 'user-other-999',
              firstName: 'Other',
              lastName: 'Borrower',
              customerCode: 'CUST-OTHER-999',
              email: 'other@example.com',
            });
          }
          return Promise.resolve(mockApplication.customer);
        }),
      },
      applicationStatusHistory: {
        create: vi.fn().mockResolvedValue({}),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
      },
      $transaction: vi.fn().mockImplementation(async (cb) => {
        if (typeof cb === 'function') {
          return cb({
            loanApplication: { update: vi.fn().mockResolvedValue({}) },
            applicationStatusHistory: { create: vi.fn().mockResolvedValue({}) },
          });
        }
        return Promise.resolve([]);
      }),
    },
  };
});

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({}),
}));

describe('Phase 9D: Real Sanctioned Offer -> Borrower Acceptance -> Agreement Workflow', () => {
  let offerService: OfferEngineService;
  let borrowerService: BorrowerService;
  let contractsService: ContractsService;

  const TENANT_ID = 'tenant-adyapan-default';
  const APP_ID = 'app-phase9d-001';
  const BORROWER_USER_ID = 'user-borrower-001';
  const OTHER_USER_ID = 'user-other-999';

  beforeEach(() => {
    offerService = OfferEngineService.getInstance();
    borrowerService = BorrowerService.getInstance();
    contractsService = new ContractsService();
  });

  describe('1. Real Sanction-to-Offer Generation', () => {
    it('should generate an authoritative versioned loan offer for an approved application', async () => {
      const offer = await offerService.generateOffer(
        TENANT_ID,
        APP_ID,
        {
          customOfferedAmount: 300000,
          customTenureMonths: 24,
          overrideRatePct: 14.0,
          notes: 'Phase 9C final sanction',
        },
        {
          id: 'uw-001',
          roles: ['UNDERWRITER'],
          tenantId: TENANT_ID,
        }
      );

      expect(offer).toBeDefined();
      expect(offer.applicationId).toBe(APP_ID);
      expect(offer.offeredAmount).toBe(300000);
      expect(offer.tenureMonths).toBe(24);
      expect(offer.annualInterestRatePct).toBe(14.0);
      expect(offer.monthlyEmi).toBeGreaterThan(0);
      expect(offer.processingFee).toBeGreaterThan(0);
      expect(offer.processingFeeGst).toBe(Math.round(offer.processingFee * 0.18));
      expect(offer.netDisbursedAmount).toBeLessThan(300000);
      expect(offer.annualPercentageRateApr).toBeGreaterThan(14.0);
      expect(offer.status).toBe('PENDING_ACCEPTANCE');
      expect(offer.version).toBeGreaterThanOrEqual(1);
      expect(offer.conditions.length).toBeGreaterThan(0);
    });

    it('should block offer generation if application status is REJECTED', async () => {
      await expect(
        offerService.generateOffer(
          TENANT_ID,
          'app-rejected-001',
          {},
          { id: 'uw-001', roles: ['UNDERWRITER'] }
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('should create immutable sequential versions and mark earlier unaccepted offers as SUPERSEDED', async () => {
      const v1 = await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 200000, customTenureMonths: 12 });
      const v2 = await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 250000, customTenureMonths: 24 });

      expect(v2.version).toBe(v1.version + 1);
      expect(v1.status).toBe('SUPERSEDED');
      expect(v2.status).toBe('PENDING_ACCEPTANCE');
    });
  });

  describe('2. Borrower Portal Review & IDOR Protection', () => {
    it('should allow borrower to view their own active offers', async () => {
      await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 300000, customTenureMonths: 24 });
      const offers = await borrowerService.getBorrowerOffers(BORROWER_USER_ID, TENANT_ID);

      expect(offers).toBeDefined();
      expect(Array.isArray(offers)).toBe(true);
      const appOffer = offers.find((o) => o.applicationId === APP_ID);
      expect(appOffer).toBeDefined();
      expect(appOffer?.offeredAmount).toBe(300000);
    });

    it('should generate statutory Key Fact Statement (KFS) from authoritative offer terms', async () => {
      const offer = await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 300000, customTenureMonths: 24 });
      const kfs = await borrowerService.getBorrowerKfs(BORROWER_USER_ID, offer.id, TENANT_ID);

      expect(kfs).toBeDefined();
      expect(kfs.offerId).toBe(offer.id);
      expect(kfs.loanAmount).toBe(300000);
      expect(kfs.tenureMonths).toBe(24);
      expect(kfs.nominalInterestRate).toBe(offer.annualInterestRatePct);
      expect(kfs.emiAmount).toBe(offer.monthlyEmi);
      expect(kfs.netDisbursementAmount).toBe(offer.netDisbursedAmount);
      expect(kfs.coolingOffDays).toBe(3);
      expect(kfs.repaymentScheduleSummary.length).toBe(24);
    });

    it('should block Borrower B from accessing Borrower A offer (IDOR defense)', async () => {
      const offer = await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 300000 });

      // Attempt to access with different user
      await expect(
        borrowerService.getBorrowerOfferDetails(OTHER_USER_ID, offer.id, TENANT_ID)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('3. Borrower Acceptance & Decline Lifecycle', () => {
    it('should execute explicit offer acceptance, update status to ACCEPTED, and transition application to AGREEMENT_PENDING', async () => {
      const offer = await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 300000, customTenureMonths: 24 });

      const result = await borrowerService.acceptBorrowerOffer(
        BORROWER_USER_ID,
        offer.id,
        {
          acceptanceMethod: 'CUSTOMER_PORTAL_OTP',
          kfsAccepted: true,
          ipAddress: '192.168.1.100',
        },
        TENANT_ID
      );

      expect(result.status).toBe('ACCEPTED');
      expect(result.offerId).toBe(offer.id);

      const updatedOffer = offerService.getOfferById(TENANT_ID, offer.id);
      expect(updatedOffer.status).toBe('ACCEPTED');
      expect(updatedOffer.acceptedAt).toBeDefined();
    });

    it('should block acceptance of an already accepted or expired offer', async () => {
      const offer = await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 300000 });
      await borrowerService.acceptBorrowerOffer(BORROWER_USER_ID, offer.id, { kfsAccepted: true }, TENANT_ID);

      // Attempt to accept again
      await expect(
        borrowerService.acceptBorrowerOffer(BORROWER_USER_ID, offer.id, { kfsAccepted: true }, TENANT_ID)
      ).rejects.toThrow(BadRequestError);
    });

    it('should execute borrower decline, transition offer to DECLINED, and prevent Finance progression', async () => {
      const offer = await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 300000 });

      const declineRes = await borrowerService.declineBorrowerOffer(
        BORROWER_USER_ID,
        offer.id,
        { reason: 'Interest rate higher than competitor' },
        TENANT_ID
      );

      expect(declineRes.status).toBe('DECLINED');

      const updatedOffer = offerService.getOfferById(TENANT_ID, offer.id);
      expect(updatedOffer.status).toBe('DECLINED');
      expect(updatedOffer.declineReason).toBe('Interest rate higher than competitor');
    });
  });

  describe('4. Agreement Workflow & eSign Readiness', () => {
    it('should generate digital loan agreement referencing exact accepted offer commercial terms', async () => {
      const offer = await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 300000, customTenureMonths: 24 });
      await borrowerService.acceptBorrowerOffer(BORROWER_USER_ID, offer.id, { kfsAccepted: true }, TENANT_ID);

      const contractStatus = await borrowerService.getBorrowerAgreement(BORROWER_USER_ID, APP_ID, TENANT_ID);
      expect(contractStatus.hasAgreement).toBe(true);
      expect(contractStatus.agreement?.sanctionAmount).toBe(300000);
      expect(contractStatus.agreement?.tenureMonths).toBe(24);
      expect(contractStatus.agreement?.clauses.length).toBeGreaterThan(0);
    });

    it('should execute simulated Aadhaar OTP eSign and advance application', async () => {
      const esignRes = await borrowerService.executeBorrowerEsign(
        BORROWER_USER_ID,
        APP_ID,
        '123456',
        TENANT_ID
      );

      expect(['SIGNED', 'READY_FOR_DISBURSEMENT']).toContain(esignRes.status);
      expect(esignRes.esignSignatureHash).toBeDefined();
    });

    it('should reject invalid OTP for eSign', async () => {
      await expect(
        borrowerService.executeBorrowerEsign(BORROWER_USER_ID, APP_ID, '999999', TENANT_ID)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('5. Strict Finance Handoff Gate', () => {
    it('should block forwarding to Finance if offer has not been accepted by borrower', async () => {
      // Re-generate a fresh unaccepted offer
      await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 300000 });

      await expect(
        forwardToFinanceOfficer(APP_ID, {
          id: 'uw-001',
          email: 'underwriter@adyapan.dev',
          roles: ['UNDERWRITER'],
          tenantId: TENANT_ID,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should permit forwarding to Finance once offer is accepted and agreement generated', async () => {
      const offer = await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 300000 });
      await borrowerService.acceptBorrowerOffer(BORROWER_USER_ID, offer.id, { kfsAccepted: true }, TENANT_ID);
      await borrowerService.getBorrowerAgreement(BORROWER_USER_ID, APP_ID, TENANT_ID);

      const fwdRes = await forwardToFinanceOfficer(APP_ID, {
        id: 'uw-001',
        email: 'underwriter@adyapan.dev',
        roles: ['UNDERWRITER'],
        tenantId: TENANT_ID,
      });

      expect(fwdRes.success).toBe(true);
      expect(fwdRes.status).toBe('READY_FOR_DISBURSEMENT');
    });

    it('should block forwarding to Finance if proposal was declined by borrower', async () => {
      const offer = await offerService.generateOffer(TENANT_ID, APP_ID, { customOfferedAmount: 300000 });
      await borrowerService.declineBorrowerOffer(BORROWER_USER_ID, offer.id, { reason: 'Opted out' }, TENANT_ID);

      await expect(
        forwardToFinanceOfficer(APP_ID, {
          id: 'uw-001',
          email: 'underwriter@adyapan.dev',
          roles: ['UNDERWRITER'],
          tenantId: TENANT_ID,
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});
