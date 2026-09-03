import { describe, it, expect, beforeEach, vi } from 'vitest';
import { partnerService } from './partner.service';
import { ForbiddenError, BadRequestError, NotFoundError } from '../../common/errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-partner-1' }),
}));

describe('Step 18: Partner / DSA / LSP Platform', () => {
  const staffActor = { id: 'staff-1', email: 'admin@adyapan.dev', roles: ['ADMIN'] };
  const borrowerActor = { id: 'borrower-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] };

  beforeEach(() => {
    partnerService.clearForTesting();
  });

  describe('1. Partner Onboarding & Governance', () => {
    it('registers a new DSA partner with commission model and DLA agreements', async () => {
      const partner = await partnerService.registerPartner(
        {
          code: 'DSA-NORTH-01',
          name: 'Northstar Financial Services',
          type: 'DSA',
          contactPerson: 'Karan Kapoor',
          email: 'karan@northstar.dev',
          phone: '+91 99999 11111',
          pan: 'AABCN8888K',
          commissionModel: {
            ratePct: 1.5,
            flatFee: 250,
            clawbackPeriodDays: 90,
            clawbackRatePct: 100,
          },
          dlaSigned: true,
        },
        staffActor
      );

      expect(partner.id).toBeDefined();
      expect(partner.code).toBe('DSA-NORTH-01');
      expect(partner.status).toBe('ACTIVE');
      expect(partner.commissionModel.ratePct).toBe(1.5);
      expect(partner.complianceAgreements.dlaSigned).toBe(true);
    });

    it('rejects duplicate partner registration with identical code or email', async () => {
      await partnerService.registerPartner(
        {
          code: 'DSA-DUP',
          name: 'Unique Partners',
          type: 'DSA',
          contactPerson: 'Amit',
          email: 'unique@partners.dev',
          phone: '9999999999',
          pan: 'ABCDE1234F',
        },
        staffActor
      );

      await expect(
        partnerService.registerPartner(
          {
            code: 'DSA-DUP',
            name: 'Duplicate Partner',
            type: 'DSA',
            contactPerson: 'Amit',
            email: 'other@partners.dev',
            phone: '9999999999',
            pan: 'ABCDE1234F',
          },
          staffActor
        )
      ).rejects.toThrow(BadRequestError);
    });

    it('updates partner status to SUSPENDED', async () => {
      const partner = await partnerService.registerPartner(
        {
          code: 'LSP-STATUS',
          name: 'Status Test LSP',
          type: 'LSP',
          contactPerson: 'Pooja',
          email: 'pooja@lsp.dev',
          phone: '9876543210',
          pan: 'AABCP9999L',
        },
        staffActor
      );

      const updated = await partnerService.updatePartnerStatus(partner.id, 'SUSPENDED', staffActor);
      expect(updated.status).toBe('SUSPENDED');
    });
  });

  describe('2. Sourcing Pipeline & Strict Isolation', () => {
    let partnerA: any;
    let partnerB: any;

    beforeEach(async () => {
      partnerA = await partnerService.registerPartner(
        {
          code: 'PARTNER-A',
          name: 'Alpha Partners',
          type: 'DSA',
          contactPerson: 'Agent A',
          email: 'agent-a@alpha.dev',
          phone: '9000000001',
          pan: 'AAAAA1111A',
        },
        staffActor
      );

      partnerB = await partnerService.registerPartner(
        {
          code: 'PARTNER-B',
          name: 'Beta Partners',
          type: 'DSA',
          contactPerson: 'Agent B',
          email: 'agent-b@beta.dev',
          phone: '9000000002',
          pan: 'BBBBB2222B',
        },
        staffActor
      );
    });

    it('submits a lead with mandatory borrower consent proof', async () => {
      const lead = await partnerService.submitLead(
        {
          partnerId: partnerA.id,
          customerName: 'Rohit Verma',
          customerPhone: '+91 98222 33445',
          requestedAmount: 150000,
          productCode: 'PERSONAL',
          consentReference: 'AADHAAR-OTP-883921',
        },
        staffActor
      );

      expect(lead.id).toBeDefined();
      expect(lead.status).toBe('SUBMITTED');
      expect(lead.partnerId).toBe(partnerA.id);
      expect(lead.consentReference).toBe('AADHAAR-OTP-883921');
    });

    it('enforces strict partner isolation: Partner B cannot view Partner A applications', async () => {
      const leadA = await partnerService.submitLead(
        {
          partnerId: partnerA.id,
          customerName: 'Confidential Client A',
          customerPhone: '9800000001',
          requestedAmount: 200000,
          productCode: 'PERSONAL',
          consentReference: 'OTP-CONSENT-A',
        },
        staffActor
      );

      // Partner A user accessing -> success
      const partnerAActor = { id: 'user-a', email: 'agent-a@alpha.dev', roles: ['PARTNER_DSA'] };
      const appByA = partnerService.getSourcedApplication(leadA.id, partnerAActor);
      expect(appByA.id).toBe(leadA.id);

      // Partner B user accessing Partner A lead -> Forbidden
      const partnerBActor = { id: 'user-b', email: 'agent-b@beta.dev', roles: ['PARTNER_DSA'] };
      expect(() => partnerService.getSourcedApplication(leadA.id, partnerBActor)).toThrow(ForbiddenError);

      // Listing as Partner B returns zero of Partner A's leads
      const listForB = partnerService.listSourcedApplications(undefined, partnerBActor);
      expect(listForB.some((s) => s.partnerId === partnerA.id)).toBe(false);
    });
  });

  describe('3. Automated Commissions & Clawbacks Engine', () => {
    it('calculates upfront and percentage commission upon loan disbursement', async () => {
      const partner = await partnerService.registerPartner(
        {
          code: 'DSA-COMM',
          name: 'Commission Test Partner',
          type: 'DSA',
          contactPerson: 'Manish',
          email: 'manish@comm.dev',
          phone: '9123456780',
          pan: 'CCCCC3333C',
          commissionModel: {
            ratePct: 2.0, // 2%
            flatFee: 500, // ₹500 upfront
            clawbackPeriodDays: 90,
            clawbackRatePct: 100,
          },
        },
        staffActor
      );

      // Loan of ₹100,000 disbursed
      const commRecords = partnerService.calculateCommissionOnDisbursement({
        partnerId: partner.id,
        applicationNo: 'APP-SRC-101',
        loanId: 'loan-comm-1',
        loanNo: 'LN-COMM-001',
        disbursedAmount: 100000,
      });

      expect(commRecords.length).toBe(2);
      const flat = commRecords.find((c) => c.commissionType === 'SOURCING_FEE');
      const percentage = commRecords.find((c) => c.commissionType === 'DISBURSEMENT_COMMISSION');

      expect(flat?.amount).toBe(500);
      expect(percentage?.amount).toBe(2000); // 2% of 100k
      expect(percentage?.status).toBe('ACCRUED');

      // Check Payout Summary
      const summary = partnerService.getPayoutSummary(partner.id, staffActor);
      expect(summary.totalEarnedCommission).toBe(2500);
      expect(summary.pendingPayoutAmount).toBe(2500);
      expect(summary.netPayable).toBe(2500);
    });

    it('evaluates early delinquency clawback for defaulted loan within 90 days', async () => {
      const partner = await partnerService.registerPartner(
        {
          code: 'DSA-CLAW',
          name: 'Clawback Test Partner',
          type: 'DSA',
          contactPerson: 'Suresh',
          email: 'suresh@claw.dev',
          phone: '9234567890',
          pan: 'DDDDD4444D',
          commissionModel: {
            ratePct: 2.0,
            flatFee: 0,
            clawbackPeriodDays: 90,
            clawbackRatePct: 100,
          },
        },
        staffActor
      );

      partnerService.calculateCommissionOnDisbursement({
        partnerId: partner.id,
        loanId: 'loan-claw-1',
        disbursedAmount: 100000,
      });

      // Default at day 45 with 60 DPD -> Trigger clawback
      const clawback = partnerService.evaluateClawback({
        partnerId: partner.id,
        loanId: 'loan-claw-1',
        daysSinceDisbursement: 45,
        dpd: 65,
        reason: 'Early 60+ DPD default within 90-day clawback window.',
      });

      expect(clawback).toBeDefined();
      expect(clawback?.commissionType).toBe('CLAWBACK');
      expect(clawback?.amount).toBe(-2000);

      // Payout summary should reflect clawback deduction
      const summary = partnerService.getPayoutSummary(partner.id, staffActor);
      expect(summary.clawbackAmount).toBe(2000);
      expect(summary.netPayable).toBe(0);
    });

    it('processes payout batch transitioning accrued commissions to PAID', async () => {
      const partner = await partnerService.registerPartner(
        {
          code: 'LSP-PAYOUT',
          name: 'Payout Test LSP',
          type: 'LSP',
          contactPerson: 'Deepak',
          email: 'deepak@payout.dev',
          phone: '9345678901',
          pan: 'EEEEE5555E',
          commissionModel: { ratePct: 1.0, flatFee: 1000, clawbackPeriodDays: 90, clawbackRatePct: 100 },
        },
        staffActor
      );

      partnerService.calculateCommissionOnDisbursement({
        partnerId: partner.id,
        loanId: 'loan-pay-1',
        disbursedAmount: 50000,
      });

      const batchResult = await partnerService.processPayoutBatch(partner.id, staffActor);
      expect(batchResult.batchId).toBeDefined();
      expect(batchResult.paidAmount).toBe(1500); // 500 (1%) + 1000 flat

      const comms = partnerService.listCommissions(partner.id);
      expect(comms.every((c) => c.status === 'PAID')).toBe(true);
    });
  });

  describe('4. Strict Borrower Isolation', () => {
    it('strictly forbids borrower role from accessing partner management', async () => {
      await expect(
        partnerService.registerPartner(
          { code: 'HACK', name: 'Hack', type: 'DSA', contactPerson: 'X', email: 'x@x.com', phone: '1', pan: '1' },
          borrowerActor
        )
      ).rejects.toThrow(ForbiddenError);

      expect(() => partnerService.listPartners(borrowerActor)).toThrow(ForbiddenError);
      expect(() => partnerService.listSourcedApplications(undefined, borrowerActor)).toThrow(ForbiddenError);
      expect(() => partnerService.getPayoutSummary('p-1', borrowerActor)).toThrow(ForbiddenError);
    });
  });
});
