import { describe, it, expect, beforeEach, vi } from 'vitest';
import { communicationService } from './communication.service';
import { maskBankAccount, maskPan, maskAadhaar, renderTemplate, TEMPLATE_REGISTRY } from './template.registry';
import { ForbiddenError, BadRequestError } from '../../common/errors';

vi.mock('../audit/audit.service', () => ({
  logAudit: vi.fn().mockResolvedValue({ id: 'audit-comm-1' }),
}));

describe('Step 19: Omnichannel Communication & Privacy', () => {
  const staffActor = { id: 'staff-1', email: 'officer@adyapan.dev', roles: ['LOAN_OFFICER'] };
  const borrowerActor = { id: 'borrower-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] };

  beforeEach(() => {
    communicationService.clearForTesting();
  });

  describe('1. PII Masking & Template Registry', () => {
    it('masks bank accounts, PANs, and Aadhaar numbers per privacy standards', () => {
      expect(maskBankAccount('123456789012')).toBe('XXXX-XXXX-9012');
      expect(maskPan('ABCDE1234F')).toBe('XXXXX1234X');
      expect(maskAadhaar('123456789901')).toBe('XXXX-XXXX-9901');
    });

    it('renders all 9 standardized templates with token substitution and PII sanitization', () => {
      const templateCodes = Object.keys(TEMPLATE_REGISTRY) as any[];
      expect(templateCodes.length).toBe(9);

      const sampleVars = {
        customerName: 'Anil Ambani',
        applicationNo: 'APP-9988',
        requestedAmount: '500000',
        productName: 'Personal Express',
        missingDocuments: 'Income Proof',
        expiryDate: '10-Sep-2026',
        uploadUrl: 'https://adyapan.dev/upload',
        loanNo: 'LN-7766',
        sanctionedAmount: '450000',
        tenureMonths: '24',
        interestRate: '12.5',
        emiAmount: '21300',
        rejectionReason: 'FOIR ceiling exceeded',
        coolingPeriodMonths: '3',
        netDisbursedAmount: '445000',
        bankAccount: '987654321098', // Sensitive PII
        utrNumber: 'UTR-HDFC-9911',
        firstDueDate: '05-Oct-2026',
        dueDate: '05-Oct-2026',
        paymentUrl: 'https://adyapan.dev/pay',
        overdueAmount: '21300',
        dpd: '35',
        lateCharges: '500',
        officerName: 'Sanjay',
        officerPhone: '+91 99999 00000',
        paidAmount: '21300',
        receiptNo: 'RCP-5544',
        outstandingPrincipal: '428700',
        closureDate: '01-Sep-2026',
        nocReference: 'NOC-2026-001',
      };

      for (const code of templateCodes) {
        const rendered = renderTemplate(code, sampleVars, 'EMAIL');
        expect(rendered.subject).toBeDefined();
        expect(rendered.body).toBeDefined();
        // Check that raw sensitive bank account was masked
        if (code === 'DISBURSEMENT_NOTICE') {
          expect(rendered.body).toContain('XXXX-XXXX-1098');
          expect(rendered.body).not.toContain('987654321098');
        }
      }
    });
  });

  describe('2. Multi-Channel Dispatch & Delivery Tracking', () => {
    it('dispatches transactional notices successfully across Email and SMS', async () => {
      const emailRecord = await communicationService.sendMessage(
        {
          templateCode: 'DISBURSEMENT_NOTICE',
          channel: 'EMAIL',
          recipient: 'borrower@adyapan.dev',
          recipientName: 'Vikram Malhotra',
          variables: {
            customerName: 'Vikram Malhotra',
            loanNo: 'LN-DISB-01',
            netDisbursedAmount: '100000',
            bankAccount: '112233445566',
            utrNumber: 'UTR-YES-8877',
            firstDueDate: '01-Oct-2026',
            emiAmount: '4730',
          },
        },
        staffActor
      );

      expect(emailRecord.id).toBeDefined();
      expect(emailRecord.channel).toBe('EMAIL');
      expect(emailRecord.deliveryStatus).toMatch(/SENT|MOCKED/);
      expect(emailRecord.renderedBody).toContain('XXXX-XXXX-5566');

      // Test SMS channel
      const smsRecord = await communicationService.sendMessage(
        {
          templateCode: 'UPCOMING_EMI_REMINDER',
          channel: 'SMS',
          recipient: '+91 98200 12345',
          variables: {
            customerName: 'Vikram Malhotra',
            loanNo: 'LN-DISB-01',
            emiAmount: '4730',
            dueDate: '01-Oct-2026',
            paymentUrl: 'https://adyapan.dev/pay',
          },
        },
        staffActor
      );

      expect(smsRecord.channel).toBe('SMS');
      expect(smsRecord.deliveryStatus).toMatch(/SENT|MOCKED/);
    });
  });

  describe('3. Regulatory Compliance: RBI Collection Window & DND', () => {
    it('blocks collection notice when dispatched outside 8 AM - 7 PM window', async () => {
      // Mock collection window check to return false (outside 8 AM - 7 PM)
      vi.spyOn(communicationService, 'isCollectionWindowOpen').mockReturnValue(false);

      const record = await communicationService.sendMessage(
        {
          templateCode: 'OVERDUE_NOTICE',
          channel: 'EMAIL',
          recipient: 'delinquent@adyapan.dev',
          variables: {
            customerName: 'Suresh Kumar',
            loanNo: 'LN-DUE-01',
            overdueAmount: '12000',
            dpd: '45',
            lateCharges: '600',
            paymentUrl: 'https://pay.dev',
            officerName: 'Rahul',
            officerPhone: '9988776655',
          },
        },
        staffActor
      );

      expect(record.deliveryStatus).toBe('BLOCKED_WINDOW');
      expect(record.errorMessage).toContain('8:00 AM – 7:00 PM IST');
    });

    it('blocks non-regulatory communication if customer has opted into DND', async () => {
      const record = await communicationService.sendMessage(
        {
          templateCode: 'APPLICATION_SUBMITTED',
          channel: 'SMS',
          recipient: '+91 98000 00000',
          variables: {
            customerName: 'Pooja',
            applicationNo: 'APP-100',
            requestedAmount: '50000',
            productName: 'Personal Loan',
            trackingUrl: 'https://track.dev',
          },
          isDndOpted: true, // DND Opted
        },
        staffActor
      );

      expect(record.deliveryStatus).toBe('BLOCKED_DND');
      expect(record.errorMessage).toContain('Do-Not-Disturb');
    });

    it('allows mandatory regulatory notices to bypass DND', async () => {
      const record = await communicationService.sendMessage(
        {
          templateCode: 'APPROVAL_SANCTION_LETTER',
          channel: 'EMAIL',
          recipient: 'dndcustomer@adyapan.dev',
          variables: {
            customerName: 'Pooja',
            loanNo: 'LN-SANCTION-01',
            sanctionedAmount: '100000',
            tenureMonths: '12',
            interestRate: '14.0',
            emiAmount: '8978',
          },
          isDndOpted: true, // DND Opted, but Regulatory Sanction letter!
        },
        staffActor
      );

      expect(record.deliveryStatus).toMatch(/SENT|MOCKED/);
    });
  });

  describe('4. Strict Borrower Isolation', () => {
    it('strictly forbids borrower role from triggering manual staff communications', async () => {
      await expect(
        communicationService.sendMessage(
          {
            templateCode: 'APPLICATION_SUBMITTED',
            channel: 'EMAIL',
            recipient: 'any@dev.com',
            variables: {},
          },
          borrowerActor
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('scopes communications list so borrowers only see notices sent to their email', async () => {
      // Dispatch 1 to borrower, 1 to admin
      await communicationService.sendMessage(
        {
          templateCode: 'APPLICATION_SUBMITTED',
          channel: 'EMAIL',
          recipient: 'borrower@adyapan.dev',
          variables: { customerName: 'Borrower', applicationNo: '1', requestedAmount: '1', productName: 'P', trackingUrl: 'u' },
        },
        staffActor
      );

      await communicationService.sendMessage(
        {
          templateCode: 'APPLICATION_SUBMITTED',
          channel: 'EMAIL',
          recipient: 'other@adyapan.dev',
          variables: { customerName: 'Other', applicationNo: '2', requestedAmount: '1', productName: 'P', trackingUrl: 'u' },
        },
        staffActor
      );

      const borrowerLogs = communicationService.listCommunications({}, borrowerActor);
      expect(borrowerLogs.length).toBe(1);
      expect(borrowerLogs[0].recipient).toBe('borrower@adyapan.dev');
    });
  });
});
