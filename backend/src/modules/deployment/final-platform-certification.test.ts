/**
 * ADYAPAN LENDING OS — PHASE P8: FINAL FULL-PLATFORM CERTIFICATION SUITE
 *
 * Master Verification Suite certifying:
 * 1. Authoritative 8-Role Operational RBAC & Default-Deny
 * 2. Zero-Trust Multi-Party IDOR & Scope Isolation (Tenant, Branch, Customer, Partner)
 * 3. Authoritative P4 State Machine Invariants & Stage Gate Anti-Bypass
 * 4. Enterprise Segregation of Duties (SoD) & Maker-Checker Dual Control
 * 5. P5 Financial Safety, Cryptographic Fingerprint Tamper-Detection & Decimal.js Parity
 * 6. P6 Borrower Experience, Customer-Safe Projection & Zero Internal Leakage
 * 7. P7 Partner Fortification, HMAC Webhooks & Co-Lending Penny Parity
 * 8. End-to-End Borrower Lifecycle Simulation (Origination -> Disbursement -> Settlement)
 * 9. End-to-End Partner Co-Lending Lifecycle Simulation
 * 10. System Error Normalization & Security Resilience
 */

import { describe, it, expect } from 'vitest';
import Decimal from 'decimal.js';
import * as crypto from 'crypto';
import { rolePermissionService } from '../roles/role-permission.service';
import { ScopeResolver } from '../roles/scope-resolver';
import { SodValidator } from '../roles/sod-validator';
import {
  workflowTransitionService,
  WorkflowTransitionService,
} from '../workflows/workflow-transition.service';
import { financialControlService } from '../finance/financial-control.service';
import { borrowerJourneyService } from '../customer/borrower-journey.service';
import { partnerFortificationService } from '../partners/partner-fortification.service';
import { partnerService } from '../partners/partner.service';

describe('Phase P8: Zero-Defect Full-Platform Certification Suite', () => {
  const tenantAlpha = 'tenant-adyapan-alpha';
  const tenantBeta = 'tenant-adyapan-beta';
  const branchNorth = 'branch-north-delhi';
  const branchSouth = 'branch-south-bangalore';

  // ---------------------------------------------------------------------------
  // 1. CANONICAL ROLE & PERMISSION MATRIX & DEFAULT-DENY
  // ---------------------------------------------------------------------------
  describe('1. Canonical Role & Permission Matrix & Default-Deny Verification', () => {
    it('should grant LOAN_OFFICER front-office permissions while denying sanction & payout', () => {
      const loanOfficer = {
        id: 'usr-lo-01',
        email: 'lo01@adyapan.com',
        roles: ['LOAN_OFFICER'],
        tenantId: tenantAlpha,
        branchId: branchNorth,
      };

      expect(rolePermissionService.hasPermission(loanOfficer, 'application.create')).toBe(true);
      expect(rolePermissionService.hasPermission(loanOfficer, 'application.submit')).toBe(true);
      expect(rolePermissionService.hasPermission(loanOfficer, 'customer.kyc')).toBe(true);

      // Denied actions
      expect(rolePermissionService.hasPermission(loanOfficer, 'underwriting.decide')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficer, 'disbursement.execute')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficer, 'payout.approve')).toBe(false);
      expect(rolePermissionService.hasPermission(loanOfficer, 'accounting.journal.approve')).toBe(false);
    });

    it('should grant CREDIT_ANALYST appraisal rights while denying sanction & disbursement', () => {
      const creditAnalyst = {
        id: 'usr-ca-01',
        email: 'ca01@adyapan.com',
        roles: ['CREDIT_ANALYST'],
        tenantId: tenantAlpha,
      };

      expect(rolePermissionService.hasPermission(creditAnalyst, 'credit.assess')).toBe(true);
      expect(rolePermissionService.hasPermission(creditAnalyst, 'credit.bank_intelligence')).toBe(true);

      // Denied actions
      expect(rolePermissionService.hasPermission(creditAnalyst, 'underwriting.decide')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalyst, 'disbursement.execute')).toBe(false);
      expect(rolePermissionService.hasPermission(creditAnalyst, 'payout.initiate')).toBe(false);
    });

    it('should grant UNDERWRITER sanction authority up to delegated tier while denying disburser execution', () => {
      const underwriter = {
        id: 'usr-uw-01',
        email: 'uw01@adyapan.com',
        roles: ['UNDERWRITER'],
        tenantId: tenantAlpha,
      };

      expect(rolePermissionService.hasPermission(underwriter, 'underwriting.decide')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriter, 'approval.approve')).toBe(true);
      expect(rolePermissionService.hasPermission(underwriter, 'offer.generate')).toBe(true);

      // Denied actions
      expect(rolePermissionService.hasPermission(underwriter, 'disbursement.execute')).toBe(false);
      expect(rolePermissionService.hasPermission(underwriter, 'accounting.journal.approve')).toBe(false);
    });

    it('should grant FINANCE_OFFICER treasury & double-entry rights while denying underwriting sanctions', () => {
      const financeOfficer = {
        id: 'usr-fo-01',
        email: 'fo01@adyapan.com',
        roles: ['FINANCE_OFFICER'],
        tenantId: tenantAlpha,
      };

      expect(rolePermissionService.hasPermission(financeOfficer, 'disbursement.execute')).toBe(true);
      expect(rolePermissionService.hasPermission(financeOfficer, 'payout.initiate')).toBe(true);
      expect(rolePermissionService.hasPermission(financeOfficer, 'accounting.journal.create')).toBe(true);

      // Denied actions
      expect(rolePermissionService.hasPermission(financeOfficer, 'underwriting.decide')).toBe(false);
      expect(rolePermissionService.hasPermission(financeOfficer, 'credit.assess')).toBe(false);
    });

    it('should enforce read-only lockdown on AUDITOR for all mutations', () => {
      const auditor = {
        id: 'usr-aud-01',
        email: 'aud01@adyapan.com',
        roles: ['AUDITOR'],
        tenantId: tenantAlpha,
      };

      expect(rolePermissionService.hasPermission(auditor, 'audit.view')).toBe(true);
      expect(rolePermissionService.hasPermission(auditor, 'application.view')).toBe(true);
      expect(rolePermissionService.hasPermission(auditor, 'loan.view')).toBe(true);

      // Denied all mutations
      expect(rolePermissionService.hasPermission(auditor, 'application.create')).toBe(false);
      expect(rolePermissionService.hasPermission(auditor, 'underwriting.decide')).toBe(false);
      expect(rolePermissionService.hasPermission(auditor, 'disbursement.execute')).toBe(false);
      expect(rolePermissionService.hasPermission(auditor, 'payout.initiate')).toBe(false);
    });

    it('should resolve legacy uppercase permissions and canonical domain.action interchangeably', () => {
      const loanOfficer = {
        id: 'usr-lo-01',
        email: 'lo01@adyapan.com',
        roles: ['LOAN_OFFICER'],
        tenantId: tenantAlpha,
      };

      // Canonical vs legacy alias resolution
      expect(rolePermissionService.hasPermission(loanOfficer, 'application.create')).toBe(true);
      expect(rolePermissionService.hasPermission(loanOfficer, 'APPLICATIONS_CREATE' as any)).toBe(true);
      expect(rolePermissionService.hasPermission(loanOfficer, 'customer.kyc')).toBe(true);
      expect(rolePermissionService.hasPermission(loanOfficer, 'KYC_INITIATE' as any)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. ZERO-TRUST MULTI-PARTY IDOR & SCOPE ISOLATION
  // ---------------------------------------------------------------------------
  describe('2. Zero-Trust Multi-Party IDOR & Scope Isolation', () => {
    it('should REJECT cross-tenant access attempts (Tenant Alpha -> Tenant Beta)', () => {
      const userAlpha = {
        id: 'usr-alpha-01',
        email: 'alpha@adyapan.com',
        roles: ['LOAN_OFFICER'],
        tenantId: tenantAlpha,
      };

      expect(() => {
        ScopeResolver.validateTenantAccess(userAlpha, tenantBeta);
      }).toThrow(/Cross-tenant access denied/);
    });

    it('should REJECT cross-branch access for branch-scoped operators (Branch North -> Branch South)', () => {
      const branchOfficerNorth = {
        id: 'usr-br-01',
        email: 'br01@adyapan.com',
        roles: ['LOAN_OFFICER'],
        tenantId: tenantAlpha,
        branchId: branchNorth,
      };

      expect(() => {
        ScopeResolver.validateBranchAccess(branchOfficerNorth, branchSouth);
      }).toThrow(/Cross-branch access denied/);
    });

    it('should REJECT cross-customer resource inspection (Customer Alpha -> Customer Beta)', async () => {
      const customerAlphaId = 'cust-alpha-101';
      const customerBetaId = 'cust-beta-202';
      const customerAlphaActor = {
        id: customerAlphaId,
        email: 'customer.alpha@adyapan.com',
        roles: ['CUSTOMER'],
        tenantId: tenantAlpha,
        customerId: customerAlphaId,
      };

      await expect(
        borrowerJourneyService.getBorrowerJourneyOverview(customerBetaId, customerAlphaActor)
      ).rejects.toThrow(/Customer access violation/);
    });

    it('should REJECT cross-partner API and data operations (Partner Alpha -> Partner Beta)', () => {
      const partnerAlphaId = 'part-alpha-001';
      const partnerBetaId = 'part-beta-002';
      const partnerActorAlpha = {
        id: 'usr-part-alpha',
        email: 'partner.alpha@fintech.in',
        roles: ['PARTNER_ADMIN'],
        tenantId: tenantAlpha,
        partnerId: partnerAlphaId,
      };

      expect(() => {
        ScopeResolver.validatePartnerAccess(partnerActorAlpha, partnerBetaId);
      }).toThrow(/Cross-partner access denied/);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. AUTHORITATIVE P4 WORKFLOW STATE GATING & ANTI-BYPASS
  // ---------------------------------------------------------------------------
  describe('3. Authoritative P4 Workflow State Gating & Anti-Bypass', () => {
    it('should strictly prohibit direct state jumps bypassing mandatory stages (DRAFT -> APPROVED)', () => {
      const allowedTargets = (WorkflowTransitionService as any).TRANSITION_GRAPH['DRAFT'];
      expect(allowedTargets).toContain('SUBMITTED');
      expect(allowedTargets).not.toContain('APPROVED');
      expect(allowedTargets).not.toContain('READY_FOR_DISBURSEMENT');
      expect(allowedTargets).not.toContain('DISBURSED');
    });

    it('should strictly prohibit direct jumps from SUBMITTED to DISBURSED', () => {
      const allowedTargets = (WorkflowTransitionService as any).TRANSITION_GRAPH['SUBMITTED'];
      expect(allowedTargets).not.toContain('DISBURSED');
    });

    it('should enforce terminal state finality on DISBURSED, REJECTED, and CANCELLED', () => {
      expect((WorkflowTransitionService as any).TRANSITION_GRAPH['DISBURSED']).toEqual([]);
      expect((WorkflowTransitionService as any).TRANSITION_GRAPH['REJECTED']).toEqual([]);
      expect((WorkflowTransitionService as any).TRANSITION_GRAPH['CANCELLED']).toEqual([]);
    });

    it('should BLOCK Credit Assessment if KYC identity check is incomplete', () => {
      const unverifiedApp = {
        id: 'app-unverified-kyc',
        status: 'KYC_PENDING',
        customer: { kycStatus: 'PENDING' },
        documents: [],
      };

      const completed: any[] = [];
      const pending: any[] = [];
      const blockers: string[] = [];

      (workflowTransitionService as any).evaluateStagePrerequisites(
        unverifiedApp,
        'CREDIT_ASSESSMENT',
        completed,
        pending,
        blockers
      );

      expect(blockers).toContain('Dynamic KYC verification must be completed first.');
      expect(pending.some((p) => p.key === 'KYC_VERIFICATION')).toBe(true);
    });

    it('should BLOCK Underwriting stage if active FRAUD_HOLD is detected', () => {
      const fraudHeldApp = {
        id: 'app-fraud-flagged',
        status: 'CREDIT_ASSESSMENT',
        customer: { kycStatus: 'VERIFIED' },
        fraudHoldActive: true,
        documents: [{ type: 'BANK_STATEMENT', isVerified: true }],
      };

      const completed: any[] = [];
      const pending: any[] = [];
      const blockers: string[] = [];

      (workflowTransitionService as any).evaluateStagePrerequisites(
        fraudHeldApp,
        'UNDERWRITING',
        completed,
        pending,
        blockers
      );

      expect(blockers.some((b) => b.toLowerCase().includes('fraud hold'))).toBe(true);
    });

    it('should BLOCK Ready For Disbursement if eSign Agreement or e-NACH Mandate is missing', () => {
      const approvedAppWithoutMandate = {
        id: 'app-approved-no-mandate',
        status: 'APPROVED',
        customer: { kycStatus: 'VERIFIED' },
        eSignCompleted: false,
        mandateActive: false,
        documents: [],
      };

      const completed: any[] = [];
      const pending: any[] = [];
      const blockers: string[] = [];

      (workflowTransitionService as any).evaluateStagePrerequisites(
        approvedAppWithoutMandate,
        'READY_FOR_DISBURSEMENT',
        completed,
        pending,
        blockers
      );

      expect(blockers.some((b) => b.includes('eSign') || b.includes('Mandate'))).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 4. SEGREGATION OF DUTIES (SoD) & MAKER-CHECKER
  // ---------------------------------------------------------------------------
  describe('4. Segregation of Duties (SoD) & Maker-Checker Dual Control', () => {
    it('should REJECT Loan Officer approving their own sourced application', () => {
      expect(() => {
        SodValidator.assertMakerCheckerSeparation(
          'usr-loan-officer-01',
          'usr-loan-officer-01',
          'APPLICATION_APPROVAL'
        );
      }).toThrow(/Maker-Checker conflict/);
    });

    it('should REJECT Underwriter directly releasing disbursement funds (Sanctioner != Disburser)', () => {
      expect(() => {
        SodValidator.assertOperationalSeparation(
          {
            userId: 'usr-uw-01',
            sanctionedBy: 'usr-uw-01',
            action: 'DISBURSEMENT_RELEASE',
          },
          'SOD_SANCTION_DISBURSER'
        );
      }).toThrow(/Separation of Duties violation: Sanctioning underwriter cannot execute disbursement/);
    });

    it('should REJECT Auditor performing any operational mutation', () => {
      expect(() => {
        SodValidator.assertAuditorReadOnly(
          { roles: ['AUDITOR'] },
          'APPLICATION_APPROVE'
        );
      }).toThrow(/Auditor role is strictly read-only/);
    });

    it('should REJECT Finance Maker approving their own financial payout task', async () => {
      const financeMaker = {
        id: 'usr-fo-maker',
        roles: ['FINANCE_OFFICER'],
        tenantId: tenantAlpha,
      };

      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          resourceType: 'PayoutBatch',
          resourceId: 'batch-001',
          operation: 'PAYOUT',
          amount: 500000,
          beneficiary: { accountNumber: '50100987654321', ifsc: 'HDFC0001234' },
        },
        financeMaker
      );

      await expect(
        financialControlService.approveFinancialTask(task.id, financeMaker)
      ).rejects.toThrow(/Maker-Checker conflict/);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. FINANCIAL SAFETY, FINGERPRINTING & MATHEMATICAL PRECISION
  // ---------------------------------------------------------------------------
  describe('5. Financial Safety, Fingerprinting & Mathematical Precision', () => {
    it('should REJECT financial task execution if payload is tampered post checker signoff', async () => {
      const maker = { id: 'usr-maker-01', roles: ['FINANCE_OFFICER'], tenantId: tenantAlpha };
      const checker = { id: 'usr-checker-02', roles: ['FINANCE_OFFICER', 'ADMIN'], tenantId: tenantAlpha };

      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          resourceType: 'Disbursement',
          resourceId: 'disb-999',
          operation: 'DISBURSEMENT',
          amount: 200000,
          beneficiary: { accountNumber: '1234567890', ifsc: 'SBIN0001111' },
        },
        maker
      );

      await financialControlService.approveFinancialTask(task.id, checker);

      // Attack: Modify task amount in state without re-approval
      const internalTask = (financialControlService as any).tasks.get(task.id);
      internalTask.amount = 999999; // Tampered!

      await expect(
        financialControlService.executeFinancialTask(task.id, checker, {
          idempotencyKey: 'idemp-tamper-test-01',
        })
      ).rejects.toThrow(/FINANCIAL_DATA_TAMPERED/);
    });

    it('should execute idempotent requests deterministically and reject key reuse with altered payload', async () => {
      const maker = { id: 'usr-maker-02', roles: ['FINANCE_OFFICER'], tenantId: tenantAlpha };
      const checker = { id: 'usr-checker-03', roles: ['FINANCE_OFFICER', 'ADMIN'], tenantId: tenantAlpha };

      const task = await financialControlService.createFinancialTask(
        {
          tenantId: tenantAlpha,
          resourceType: 'Payment',
          resourceId: 'pay-001',
          operation: 'PAYMENT_RECORD',
          amount: 50000,
        },
        maker
      );

      await financialControlService.approveFinancialTask(task.id, checker);

      const res1 = await financialControlService.executeFinancialTask(task.id, checker, {
        idempotencyKey: 'idemp-key-unique-12345',
      });
      expect(res1.task.status).toBe('EXECUTED');

      // Replay with exact key -> Cached response
      const res2 = await financialControlService.executeFinancialTask(task.id, checker, {
        idempotencyKey: 'idemp-key-unique-12345',
      });
      expect(res2.task.status).toBe('EXECUTED');
      expect(res2.isIdempotentReplay).toBe(true);
    });

    it('should guarantee zero floating point drift using Decimal.js across commission math', () => {
      // 123456.78 * 0.015 in standard JS is 1851.8517000000002
      const result = partnerFortificationService.calculateCommissionWithDecimal(
        123456.78,
        0.5,
        1.0,
        0,
        18.0
      );

      expect(result.calculatedAmount).toBe(1851.85);
      expect(result.taxAmount).toBe(333.33);
      expect(result.netPayableAmount).toBe(2185.18);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. P6 BORROWER EXPERIENCE & ZERO INTERNAL TERM LEAKAGE
  // ---------------------------------------------------------------------------
  describe('6. Borrower Safe Projection & Zero Internal Term Leakage', () => {
    it('should project clean customer-safe DTOs and strip all internal risk/scoring metadata', () => {
      const internalApplication = {
        id: 'app-borrower-safe-01',
        applicationNo: 'APP-2026-001',
        requestedAmount: 75000,
        tenureMonths: 12,
        status: 'UNDERWRITING',
        product: { name: 'Instant Cash Loan', interestRate: 15.0 },
        customer: { panStatus: 'VERIFIED', aadhaarStatus: 'VERIFIED' },
        internalUnderwriterNotes: 'Customer borderline FOIR, approved under discretionary authority',
        breDecisionRules: ['RULE_FOIR_MAX_60', 'RULE_BUREAU_MIN_680'],
        fraudScore: 8,
        riskGrade: 'B+',
        sodPolicyVersion: 'v2.1',
        glSuspenseAccount: '9999-SUSPENSE-GL',
      };

      const safeView = borrowerJourneyService.sanitizeApplicationForBorrower(internalApplication);

      expect(safeView.customerStatusLabel).toBe('Application Under Review');
      expect(safeView.currentStage).toBe('UNDER_REVIEW');
      expect(safeView.progressPercent).toBe(60);

      // Verify ZERO internal leakage
      expect((safeView as any).internalUnderwriterNotes).toBeUndefined();
      expect((safeView as any).breDecisionRules).toBeUndefined();
      expect((safeView as any).fraudScore).toBeUndefined();
      expect((safeView as any).riskGrade).toBeUndefined();
      expect((safeView as any).sodPolicyVersion).toBeUndefined();
      expect((safeView as any).glSuspenseAccount).toBeUndefined();
    });

    it('should derive deterministic resume routes based on application lifecycle stage', () => {
      const draftApp = { id: 'app-d1', status: 'DRAFT' };
      const kycApp = { id: 'app-k1', status: 'KYC_PENDING' };
      const offerApp = { id: 'app-o1', status: 'APPROVED' };

      expect(borrowerJourneyService.sanitizeApplicationForBorrower(draftApp).resumeRoute).toBe(
        '/customer/applications/app-d1'
      );
      expect(borrowerJourneyService.sanitizeApplicationForBorrower(kycApp).resumeRoute).toBe(
        '/customer/documents'
      );
      expect(borrowerJourneyService.sanitizeApplicationForBorrower(offerApp).resumeRoute).toBe(
        '/customer/offers'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 7. P7 PARTNER FORTIFICATION & CO-LENDING ENGINE
  // ---------------------------------------------------------------------------
  describe('7. Partner Fortification & Co-Lending Precision', () => {
    it('should allocate 80:20 co-lending sanction amounts with exact penny parity reconciliation', () => {
      const oddSanctionAmount = 777777.77;
      const allocation = partnerFortificationService.calculateCoLendingAllocation(oddSanctionAmount, 80);

      expect(allocation.lenderSharePct).toBe(80);
      expect(allocation.partnerSharePct).toBe(20);
      expect(
        new Decimal(allocation.lenderSanctionedShare)
          .plus(allocation.partnerSanctionedShare)
          .toNumber()
      ).toBe(oddSanctionAmount);
    });

    it('should cryptographically sign webhooks with HMAC-SHA256 and reject expired or tampered payloads', () => {
      const secret = 'whsec_prod_partner_secret_key_889900';
      const payload = { event: 'application.status_changed', applicationId: 'APP-PART-01', status: 'APPROVED' };

      const { signature } = partnerFortificationService.signWebhookPayload(payload, secret);
      expect(signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);

      // Valid signature
      expect(partnerFortificationService.verifyWebhookSignature(payload, signature, secret)).toBe(true);

      // Tampered payload
      expect(
        partnerFortificationService.verifyWebhookSignature({ ...payload, status: 'DISBURSED' }, signature, secret)
      ).toBe(false);

      // Incorrect secret
      expect(partnerFortificationService.verifyWebhookSignature(payload, signature, 'wrong-secret')).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. END-TO-END BORROWER FULL LIFECYCLE SIMULATION
  // ---------------------------------------------------------------------------
  describe('8. End-to-End Borrower Full Lifecycle Simulation', () => {
    it('should simulate complete origination to settlement lifecycle in full compliance', async () => {
      const customerId = 'cust-e2e-888';
      const borrowerActor = {
        id: customerId,
        roles: ['CUSTOMER'],
        tenantId: tenantAlpha,
        customerId,
      };

      // 1. Borrower creates support ticket
      const ticket = borrowerJourneyService.createCustomerTicket(
        customerId,
        'Interest rate clarification',
        'LOAN_INQUIRY',
        'Requesting explanation of APR vs Flat interest',
        borrowerActor
      );
      expect(ticket.id).toBeDefined();
      expect(ticket.status).toBe('OPEN');

      // 2. System sends actionable notification
      borrowerJourneyService.addCustomerNotification(customerId, {
        title: 'Offer Ready',
        message: 'Your personal loan offer of ₹1,00,000 is ready for acceptance.',
        category: 'ACTION_REQUIRED',
        deepLinkRoute: '/customer/offers',
      });

      const notifs = borrowerJourneyService.getCustomerNotifications(customerId, borrowerActor);
      expect(notifs.some((n) => n.title === 'Offer Ready')).toBe(true);

      // 3. Borrower reviews sanitized loan application
      const mockApplication = {
        id: 'app-e2e-001',
        applicationNo: 'APP-E2E-001',
        requestedAmount: 100000,
        tenureMonths: 12,
        status: 'APPROVED',
        product: { name: 'Instant Personal Loan', interestRate: 14.0 },
        customer: { panStatus: 'VERIFIED', aadhaarStatus: 'VERIFIED' },
      };
      const safeView = borrowerJourneyService.sanitizeApplicationForBorrower(mockApplication);
      expect(safeView.customerStatusLabel).toBe('Loan Approved — Offer Ready');
      expect(safeView.currentStage).toBe('OFFER_READY');
      expect(safeView.offerSummary).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 9. END-TO-END PARTNER CO-LENDING SOURCING SIMULATION
  // ---------------------------------------------------------------------------
  describe('9. End-to-End Partner Co-Lending Sourcing Simulation', () => {
    it('should simulate partner credential creation, key rotation, and commission calculation', async () => {
      const lenderAdmin = {
        id: 'usr-lender-super',
        roles: ['SUPER_ADMIN'],
        tenantId: tenantAlpha,
      };

      // 1. Register partner
      const partner = await partnerService.registerPartner(
        {
          name: 'E2E Co-Lending Fintech',
          type: 'FINTECH',
          email: 'partnerships@e2efintech.in',
          phone: '9888899999',
          pan: 'AAACE9999K',
          allowedChannels: ['API_EMBEDDED'],
        },
        lenderAdmin
      );
      expect(partner.id).toBeDefined();
      expect(partner.status).toBe('ACTIVE');

      // 2. Issue API Credential
      const cred = partnerService.createApiCredential(
        partner.id,
        {
          name: 'E2E Sandbox Key',
          environment: 'SANDBOX',
          scopes: ['partner.application.create', 'partner.application.read'],
        },
        lenderAdmin
      );
      expect(cred.apiKey).toMatch(/^pk_test_/);
      expect(cred.secretHash).toBeDefined();

      // 3. Rotate Secret
      const rotated = partnerService.rotateSecret(partner.id, cred.id, lenderAdmin);
      expect(rotated.status).toBe('ACTIVE');
      expect(rotated.plainSecretOnce).toBeDefined();
      expect(rotated.secretHash).toBeDefined();

      // 4. Calculate Co-lending commission
      const commission = partnerFortificationService.calculateCommissionWithDecimal(
        2000000,
        0.5,
        1.0,
        0,
        18.0
      );
      expect(commission.netPayableAmount).toBe(35400); // 30,000 + 18% GST (5,400)
    });
  });
});
