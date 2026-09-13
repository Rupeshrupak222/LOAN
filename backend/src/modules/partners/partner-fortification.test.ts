import { describe, it, expect, beforeEach } from 'vitest';
import Decimal from 'decimal.js';
import {
  partnerFortificationService,
  maskPan,
  maskAadhaar,
  maskPhone,
  maskEmail,
  maskBankAccount,
} from './partner-fortification.service';
import { partnerService } from './partner.service';
import { ScopeResolver } from '../roles/scope-resolver';
import { financialControlService } from '../finance/financial-control.service';
import { ForbiddenError, UnauthorizedError } from '../../common/errors';
import { PartnerContext } from './partner.types';

describe('Phase P7: Partner & Co-Lending Portal Fortification', () => {
  const tenantDefault = 'tenant-adyapan-default';
  const tenantExternal = 'tenant-other-corp';

  const partnerAlphaId = 'part-alpha-fintech';
  const partnerBetaId = 'part-beta-embedded';

  const partnerActorAlpha = {
    id: 'user-partner-alpha-001',
    email: 'ops@alphafintech.in',
    roles: ['PARTNER_ADMIN'],
    tenantId: tenantDefault,
    partnerId: partnerAlphaId,
  };

  const partnerActorBeta = {
    id: 'user-partner-beta-002',
    email: 'agent@betaembedded.in',
    roles: ['PARTNER_AGENT'],
    tenantId: tenantDefault,
    partnerId: partnerBetaId,
  };

  const lenderSuperAdmin = {
    id: 'user-superadmin-001',
    email: 'admin@adyapan.internal',
    roles: ['SUPER_ADMIN'],
    tenantId: tenantDefault,
  };

  const lenderFinanceOfficer = {
    id: 'user-finance-001',
    email: 'finance@adyapan.internal',
    roles: ['FINANCE_OFFICER'],
    tenantId: tenantDefault,
  };

  const partnerContextAlpha: PartnerContext = {
    partnerId: partnerAlphaId,
    partnerCode: 'ALPHA_FINTECH',
    partnerName: 'Alpha Fintech Solutions',
    tenantId: tenantDefault,
    environment: 'PRODUCTION',
    scopes: [
      'partner.customer.create',
      'partner.customer.read',
      'partner.application.create',
      'partner.application.read',
      'partner.application.update',
      'partner.application.submit',
      'partner.document.read',
      'partner.document.upload',
      'partner.offer.read',
      'partner.offer.accept',
      'partner.loan.read',
      'partner.repayment.read',
      'partner.webhook.manage',
      'partner.reporting.read',
    ],
    credentialId: 'cred-alpha-live',
  };

  // ---------------------------------------------------------------------------
  // 1. ZERO-TRUST SCOPE DERIVATION & CROSS-PARTNER IDOR PREVENTION
  // ---------------------------------------------------------------------------
  describe('1. Zero-Trust Scope Derivation & Cross-Partner IDOR Defense', () => {
    it('should permit partner accessing their own partner resource scope', () => {
      expect(() => {
        ScopeResolver.validatePartnerAccess(partnerActorAlpha, partnerAlphaId);
      }).not.toThrow();
    });

    it('should strictly block Partner Alpha from accessing Partner Beta resources (Anti-IDOR)', () => {
      expect(() => {
        ScopeResolver.validatePartnerAccess(partnerActorAlpha, partnerBetaId);
      }).toThrow(ForbiddenError);
    });

    it('should strictly block Partner Beta from accessing Partner Alpha resources', () => {
      expect(() => {
        ScopeResolver.validatePartnerAccess(partnerActorBeta, partnerAlphaId);
      }).toThrow(ForbiddenError);
    });

    it('should permit internal SUPER_ADMIN to inspect any partner scope', () => {
      expect(() => {
        ScopeResolver.validatePartnerAccess(lenderSuperAdmin, partnerAlphaId);
        ScopeResolver.validatePartnerAccess(lenderSuperAdmin, partnerBetaId);
      }).not.toThrow();
    });

    it('should automatically derive partnerId from authenticated context and reject client spoofing', () => {
      const resolved = ScopeResolver.resolveAuthorizedScope(partnerActorAlpha, {
        partnerId: 'spoofed-partner-999',
      });
      // Zero-trust rule: Bound partnerId cannot be overwritten by client param
      expect(resolved.partnerId).toBe(partnerAlphaId);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. AUTHORITATIVE PII MASKING UTILITIES
  // ---------------------------------------------------------------------------
  describe('2. Authoritative PII Masking Utilities', () => {
    it('should mask PAN displaying only first 2 and last 2 characters', () => {
      expect(maskPan('ABCDE1234F')).toBe('ABXXXXXX4F');
      expect(maskPan('')).toBe('XXXXX0000X');
    });

    it('should mask Aadhaar displaying only the last 4 digits', () => {
      expect(maskAadhaar('123456789012')).toBe('XXXXXXXX9012');
      expect(maskAadhaar('9012')).toBe('XXXXXXXX9012');
    });

    it('should mask mobile phone numbers displaying only the last 4 digits', () => {
      expect(maskPhone('9876543210')).toBe('******3210');
      expect(maskPhone('+919876543210')).toBe('******3210');
    });

    it('should mask email addresses preserving minimal prefix and full domain', () => {
      expect(maskEmail('john.doe@fintechpartner.com')).toBe('jo***@fintechpartner.com');
      expect(maskEmail('a@test.org')).toBe('a***@test.org');
    });

    it('should mask bank account numbers displaying only the last 4 digits', () => {
      expect(maskBankAccount('9876543211234')).toBe('********1234');
      expect(maskBankAccount('')).toBe('********0000');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. INTERNAL DATA LEAKAGE DEFENSE (ZERO EXPOSURE OF INTERNAL LOGIC)
  // ---------------------------------------------------------------------------
  describe('3. Internal Data Leakage Defense (Zero Internal Logic Exposure)', () => {
    it('should strip internal BRE rules, risk scores, fraud signals, and maker-checker IDs from application projection', () => {
      const rawApplicationWithInternalData = {
        id: 'app-int-777',
        partnerApplicationId: 'PART_APP_777',
        adyapanApplicationId: 'APP-ADYAPAN-777',
        partnerId: partnerAlphaId,
        productId: 'prod-personal-instant',
        productName: 'Prime Personal Loan',
        status: 'UNDER_REVIEW',
        currentStage: 'DECISION',
        completedStages: ['INTAKE', 'KYC_AND_DOCUMENTS'],
        requestedAmount: 250000,
        requestedTenureMonths: 24,
        customerName: 'Aarav Sharma',
        customerPhone: '9876543210',
        customerEmail: 'aarav.sharma@example.com',
        pan: 'ABCDE1234F',
        // INTERNAL SENSITIVE FIELDS THAT MUST BE PURGED
        breRuleResults: [{ ruleId: 'RULE_FOIR_MAX_50', result: 'PASS' }],
        breEvaluationTrace: { foir: 42.5, dti: 35.0, internalGrade: 'A+' },
        internalRiskScore: 785,
        fraudRiskScore: 15,
        fraudSyndicateSignals: ['DEVICE_VELOCITY_NORMAL', 'NO_SIM_SWAP'],
        underwriterRemarks: 'Excellent applicant banking balance. Approved under policy exception B.',
        makerUserId: 'usr-underwriter-01',
        checkerUserId: 'usr-credit-committee-02',
        glDebitAccount: 'GL-1002-DISBURSEMENT-CLEARING',
        glCreditAccount: 'GL-2001-PARTNER-PAYABLE',
        rawBureauReportXml: '<bureau><score>790</score></bureau>',
      };

      const projected = partnerFortificationService.sanitizeApplicationForPartner(
        rawApplicationWithInternalData,
        partnerContextAlpha
      );

      // Verify clean partner projection
      expect(projected.partnerApplicationId).toBe('PART_APP_777');
      expect(projected.adyapanApplicationId).toBe('APP-ADYAPAN-777');
      expect(projected.partnerSafeStatus).toBe('APPLICATION_UNDER_REVIEW');
      expect(projected.requestedAmount).toBe(250000);

      // Assert PII is masked
      expect(projected.applicant.maskedPhone).toBe('******3210');
      expect(projected.applicant.maskedEmail).toBe('aa***@example.com');
      expect(projected.applicant.maskedPan).toBe('ABXXXXXX4F');

      // ASSERT ZERO LEAKAGE: Internal fields must not exist on projection
      const keys = Object.keys(projected);
      expect(keys).not.toContain('breRuleResults');
      expect(keys).not.toContain('breEvaluationTrace');
      expect(keys).not.toContain('internalRiskScore');
      expect(keys).not.toContain('fraudRiskScore');
      expect(keys).not.toContain('fraudSyndicateSignals');
      expect(keys).not.toContain('underwriterRemarks');
      expect(keys).not.toContain('makerUserId');
      expect(keys).not.toContain('checkerUserId');
      expect(keys).not.toContain('glDebitAccount');
      expect(keys).not.toContain('glCreditAccount');
      expect(keys).not.toContain('rawBureauReportXml');
    });

    it('should reject application projection if requested partner does not own the application', () => {
      const foreignApp = {
        id: 'app-beta-999',
        partnerId: partnerBetaId,
        status: 'SUBMITTED',
      };

      expect(() => {
        partnerFortificationService.sanitizeApplicationForPartner(foreignApp, partnerContextAlpha);
      }).toThrow(ForbiddenError);
    });

    it('should project clean customer record with masked PII and zero credit score leakage', () => {
      const rawCustomer = {
        id: 'cust-ady-101',
        firstName: 'Priya',
        lastName: 'Nair',
        mobile: '9123456789',
        email: 'priya.nair@gmail.com',
        pan: 'FGHIJ5678K',
        aadhaarLast4: '5678',
        bankAccountNo: '50100234567890',
        bankName: 'HDFC Bank',
        employmentType: 'SALARIED',
        kycStatus: 'VERIFIED',
        // Internal fields
        cibilScore: 780,
        riskClassification: 'LOW_RISK',
        internalNotes: 'VIP customer with verified employer',
      };

      const projected = partnerFortificationService.sanitizeCustomerForPartner(
        rawCustomer,
        partnerContextAlpha,
        'PART_CUST_101'
      );

      expect(projected.partnerCustomerId).toBe('PART_CUST_101');
      expect(projected.fullName).toBe('Priya Nair');
      expect(projected.maskedPhone).toBe('******6789');
      expect(projected.maskedEmail).toBe('pr***@gmail.com');
      expect(projected.maskedPan).toBe('FGXXXXXX8K');
      expect(projected.maskedAadhaar).toBe('XXXXXXXX5678');
      expect(projected.maskedBankAccount).toBe('********7890');
      expect(projected.kycSafeStatus).toBe('VERIFIED');

      const keys = Object.keys(projected);
      expect(keys).not.toContain('cibilScore');
      expect(keys).not.toContain('riskClassification');
      expect(keys).not.toContain('internalNotes');
    });

    it('should project standardized Key Fact Statement (KFS) offer without internal margin details', () => {
      const rawOffer = {
        id: 'off-555',
        offerNo: 'OFF-2026-555',
        productName: 'Instant Personal Loan',
        offeredAmount: 150000,
        tenureMonths: 18,
        annualInterestRatePct: 15.0,
        monthlyEmi: 9350,
        processingFee: 3000,
        feeGst: 540,
        totalFeesAndTaxes: 3540,
        totalInterest: 18300,
        annualPercentageRateApr: 16.25,
        status: 'OFFERED',
        // Internal fields that MUST NOT leak
        internalCostOfFundsPct: 8.5,
        lenderGrossMarginPct: 6.5,
        partnerRevenueCutPct: 1.5,
        minimumApprovalThreshold: 'TIER_1',
      };

      const projected = partnerFortificationService.sanitizeOfferForPartner(rawOffer, 'PART_APP_777');

      expect(projected.offeredAmount).toBe(150000);
      expect(projected.netDisbursedAmount).toBe(146460); // 150000 - 3540
      expect(projected.totalDeductions).toBe(3540);
      expect(projected.kfsSnapshot.coolingOffPeriodDays).toBe(3);
      expect(projected.kfsSnapshot.apr).toBe(16.25);

      const keys = Object.keys(projected);
      expect(keys).not.toContain('internalCostOfFundsPct');
      expect(keys).not.toContain('lenderGrossMarginPct');
      expect(keys).not.toContain('partnerRevenueCutPct');
      expect(keys).not.toContain('minimumApprovalThreshold');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. WORKFLOW STAGE-GATING (P4 INTEGRATION)
  // ---------------------------------------------------------------------------
  describe('4. Workflow Stage-Gating & Prohibited Transition Enforcement', () => {
    it('should permit partner to perform legitimate sourcing transitions', () => {
      expect(() => {
        partnerFortificationService.validatePartnerAllowedStageTransition('DRAFT', 'SUBMIT_APPLICATION');
        partnerFortificationService.validatePartnerAllowedStageTransition('KYC_AND_DOCUMENTS', 'UPLOAD_DOCUMENT');
        partnerFortificationService.validatePartnerAllowedStageTransition('OFFER_REVIEW', 'ACCEPT_OFFER');
      }).not.toThrow();
    });

    it('should strictly block partner users from triggering internal underwriting transitions', () => {
      expect(() => {
        partnerFortificationService.validatePartnerAllowedStageTransition('UNDER_REVIEW', 'APPROVE_CREDIT');
      }).toThrow(ForbiddenError);

      expect(() => {
        partnerFortificationService.validatePartnerAllowedStageTransition('DECISION', 'BYPASS_UNDERWRITING');
      }).toThrow(ForbiddenError);
    });

    it('should strictly block partner users from overriding fraud checks or executing disbursements', () => {
      expect(() => {
        partnerFortificationService.validatePartnerAllowedStageTransition('DECISION', 'OVERRIDE_FRAUD_SCORE');
      }).toThrow(ForbiddenError);

      expect(() => {
        partnerFortificationService.validatePartnerAllowedStageTransition('DISBURSEMENT', 'EXECUTE_DISBURSEMENT');
      }).toThrow(ForbiddenError);

      expect(() => {
        partnerFortificationService.validatePartnerAllowedStageTransition('DISBURSEMENT', 'POST_GL_JOURNAL');
      }).toThrow(ForbiddenError);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. FINANCIAL CONTROLS & MAKER-CHECKER PAYOUT ROUTING (P5 INTEGRATION)
  // ---------------------------------------------------------------------------
  describe('5. Financial Controls & Maker-Checker Payout Dual-Control', () => {
    it('should block partner users from drafting or initiating payout batches directly', async () => {
      await expect(
        partnerFortificationService.submitPartnerPayoutForMakerChecker(
          partnerAlphaId,
          'batch-payout-001',
          50000,
          '98765432101234',
          partnerActorAlpha
        )
      ).rejects.toThrow(ForbiddenError);
    });

    it('should allow authorized FINANCE_OFFICER to submit a payout batch into P5 PENDING_CHECKER queue', async () => {
      const result = await partnerFortificationService.submitPartnerPayoutForMakerChecker(
        partnerAlphaId,
        'batch-payout-101',
        75000,
        '50100987654321',
        {
          id: lenderFinanceOfficer.id,
          email: lenderFinanceOfficer.email,
          roles: lenderFinanceOfficer.roles,
          tenantId: tenantDefault,
        }
      );

      expect(result.taskId).toBeDefined();
      expect(result.status).toBe('PENDING_CHECKER');
    });

    it('should enforce Segregation of Duties: maker cannot approve their own partner payout task', async () => {
      // 1. Submit task by finance officer
      const taskSubmission = await partnerFortificationService.submitPartnerPayoutForMakerChecker(
        partnerAlphaId,
        'batch-payout-102',
        120000,
        '50100987654321',
        {
          id: lenderFinanceOfficer.id,
          email: lenderFinanceOfficer.email,
          roles: lenderFinanceOfficer.roles,
          tenantId: tenantDefault,
        }
      );

      // 2. Maker attempts to approve their own task
      await expect(
        financialControlService.approveFinancialTask(
          taskSubmission.taskId,
          {
            id: lenderFinanceOfficer.id,
            email: lenderFinanceOfficer.email,
            roles: ['FINANCE_OFFICER', 'ADMIN'],
            tenantId: tenantDefault,
          },
          { overrideNotes: 'Self-approving my payout batch' }
        )
      ).rejects.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // 6. DECIMAL.JS COMMERCIALS & COMMISSION ACCURACY
  // ---------------------------------------------------------------------------
  describe('6. Decimal.js Commercials & Zero Floating-Point Drift', () => {
    it('should calculate standard sourcing and disbursement commission accurately with GST', () => {
      // Loan Amount = 1,000,000
      // Sourcing Fee = 0.5% (5,000)
      // Disbursement Commission = 1.0% (10,000)
      // Pre-tax Commission = 15,000
      // GST (18%) = 2,700
      // Net Payable = 17,700
      const result = partnerFortificationService.calculateCommissionWithDecimal(
        1000000,
        0.5,
        1.0,
        0,
        18.0
      );

      expect(result.calculatedAmount).toBe(15000);
      expect(result.taxAmount).toBe(2700);
      expect(result.netPayableAmount).toBe(17700);
      expect(result.effectiveRatePct).toBe(1.5);
    });

    it('should prevent floating point inaccuracies on fractional currency amounts', () => {
      // In standard JS: 123456.78 * 0.015 = 1851.8517000000002
      // With Decimal.js: 1851.85 (rounded to 2 decimal places)
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
  // 7. CO-LENDING BOUNDARY ALLOCATION (80:20 NBFC:BANK MODEL)
  // ---------------------------------------------------------------------------
  describe('7. Co-Lending Boundary Allocation (RBI CLM Model)', () => {
    it('should allocate 80:20 institutional lender vs partner shares with exact reconciliation', () => {
      const loanAmount = 5000000; // 50 Lakhs
      const allocation = partnerFortificationService.calculateCoLendingAllocation(loanAmount, 80);

      expect(allocation.lenderSharePct).toBe(80);
      expect(allocation.partnerSharePct).toBe(20);
      expect(allocation.sanctionedAmount).toBe(5000000);
      expect(allocation.lenderSanctionedShare).toBe(4000000); // 80% of 50L
      expect(allocation.partnerSanctionedShare).toBe(1000000); // 20% of 50L

      // Exact sum guarantee: lenderShare + partnerShare === totalSanctioned
      const totalAllocated = new Decimal(allocation.lenderSanctionedShare).plus(
        allocation.partnerSanctionedShare
      );
      expect(totalAllocated.toNumber()).toBe(loanAmount);
    });

    it('should maintain exact penny parity on odd sanction amounts', () => {
      const oddAmount = 333333.33;
      const allocation = partnerFortificationService.calculateCoLendingAllocation(oddAmount, 80);

      expect(allocation.lenderSanctionedShare).toBe(266666.66);
      expect(allocation.partnerSanctionedShare).toBe(66666.67);
      expect(
        new Decimal(allocation.lenderSanctionedShare)
          .plus(allocation.partnerSanctionedShare)
          .toNumber()
      ).toBe(oddAmount);
    });
  });

  // ---------------------------------------------------------------------------
  // 8. OUTBOUND WEBHOOK SECURITY & ANTI-REPLAY DEFENSE
  // ---------------------------------------------------------------------------
  describe('8. Outbound Webhook Security & Anti-Replay Defense', () => {
    const webhookSecret = 'sec_live_partner_alpha_webhook_secret_999';
    const payload = {
      event: 'application.status_changed',
      partnerApplicationId: 'PART_APP_777',
      status: 'APPROVED',
      timestamp: Date.now(),
    };

    it('should generate a valid HMAC-SHA256 signature prefixed with t= and v1=', () => {
      const signed = partnerFortificationService.signWebhookPayload(payload, webhookSecret);
      expect(signed.signature).toMatch(/^t=\d+,v1=[a-f0-9]{64}$/);
      expect(signed.timestamp).toBeDefined();
    });

    it('should verify legitimate webhook signatures and accept valid payloads', () => {
      const { signature } = partnerFortificationService.signWebhookPayload(payload, webhookSecret);
      const isValid = partnerFortificationService.verifyWebhookSignature(payload, signature, webhookSecret);
      expect(isValid).toBe(true);
    });

    it('should reject tampered payloads with altered data', () => {
      const { signature } = partnerFortificationService.signWebhookPayload(payload, webhookSecret);
      const tamperedPayload = { ...payload, status: 'DISBURSED' }; // Tampered!
      const isValid = partnerFortificationService.verifyWebhookSignature(tamperedPayload, signature, webhookSecret);
      expect(isValid).toBe(false);
    });

    it('should reject signatures generated with an incorrect secret', () => {
      const { signature } = partnerFortificationService.signWebhookPayload(payload, 'wrong-secret-xyz');
      const isValid = partnerFortificationService.verifyWebhookSignature(payload, signature, webhookSecret);
      expect(isValid).toBe(false);
    });

    it('should reject replayed webhooks when timestamp exceeds the 5-minute tolerance window', () => {
      // Craft a header with timestamp 10 minutes in the past
      const pastTime = Math.floor(Date.now() / 1000) - 600;
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(`${pastTime}.${JSON.stringify(payload)}`)
        .digest('hex');
      const staleHeader = `t=${pastTime},v1=${hash}`;

      const isValid = partnerFortificationService.verifyWebhookSignature(
        payload,
        staleHeader,
        webhookSecret,
        300 // 5 minutes tolerance
      );
      expect(isValid).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. API CREDENTIAL LIFECYCLE & SCOPE ISOLATION
  // ---------------------------------------------------------------------------
  describe('9. API Credential Lifecycle & Scope Isolation', () => {
    it('should securely hash credential secret keys upon creation', async () => {
      const partner = await partnerService.registerPartner(
        {
          name: 'Cred Test Fintech',
          type: 'FINTECH',
          allowedChannels: ['API_EMBEDDED'],
          email: 'contact@credtest.in',
          phone: '9888877777',
          pan: 'AAACB1234D',
        },
        lenderSuperAdmin
      );

      const cred = partnerService.createApiCredential(
        partner.id,
        {
          name: 'Sandbox Key',
          environment: 'SANDBOX',
          scopes: ['partner.application.create', 'partner.application.read'],
        },
        lenderSuperAdmin
      );

      expect(cred.apiKey).toMatch(/^pk_test_/);
      // Raw secret only shown once during issuance
      expect(cred.plainSecretOnce).toBeDefined();
      // Stored hashed secret must not equal raw secret
      expect(cred.secretHash).toBeDefined();
      expect(cred.secretHash).not.toBe(cred.plainSecretOnce);
      expect(cred.status).toBe('ACTIVE');
    });

    it('should handle secret rotation: retains ACTIVE status with new hashed secret and updated timestamp', async () => {
      const partner = await partnerService.registerPartner(
        {
          name: 'Rotation Test Partner',
          type: 'LSP',
          allowedChannels: ['EMBEDDED_SDK'],
          email: 'security@rotationpartner.in',
          phone: '9888866666',
          pan: 'AAALB5678E',
        },
        lenderSuperAdmin
      );

      const cred = partnerService.createApiCredential(
        partner.id,
        {
          name: 'Initial credential',
          environment: 'SANDBOX',
          scopes: ['partner.application.read'],
        },
        lenderSuperAdmin
      );

      const originalHash = cred.secretHash;
      const rotated = partnerService.rotateSecret(partner.id, cred.id, lenderSuperAdmin);
      expect(rotated.status).toBe('ACTIVE');
      expect(rotated.plainSecretOnce).toBeDefined();
      expect(rotated.secretHash).toBeDefined();
      expect(rotated.secretHash).not.toBe(originalHash);
      expect(rotated.updatedAt).toBeDefined();
    });

    it('should revoke credentials: revoked credentials are fully deactivated', async () => {
      const partner = await partnerService.registerPartner(
        {
          name: 'Revoke Test Partner',
          type: 'MERCHANT_PLATFORM',
          allowedChannels: ['MERCHANT_POS'],
          email: 'ops@revokepartner.in',
          phone: '9888855555',
          pan: 'AAAMP9012F',
        },
        lenderSuperAdmin
      );

      const cred = partnerService.createApiCredential(
        partner.id,
        {
          name: 'Key to revoke',
          environment: 'SANDBOX',
          scopes: ['partner.customer.create'],
        },
        lenderSuperAdmin
      );

      const revoked = partnerService.revokeCredential(partner.id, cred.id, lenderSuperAdmin);
      expect(revoked.status).toBe('REVOKED');
      expect(revoked.revokedAt).toBeDefined();
    });
  });
});
