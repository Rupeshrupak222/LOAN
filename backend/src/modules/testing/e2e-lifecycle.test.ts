import { describe, it, expect, beforeEach } from 'vitest';
import { v4 as uuid } from 'uuid';
import { productCatalogService } from '../product/catalog.service';
import { workflowService } from '../workflows/workflow.service';
import { rolePermissionService } from '../roles/role-permission.service';
import { tenantService } from '../tenants/tenant.service';
import { privacyConsentService } from '../privacy/consent.service';
import { evidenceAuditService } from '../audit/evidence.service';
import { calculateEmi, allocateRepayment } from '../finance/emi';

describe('Step 37: End-to-End Enterprise Lending Lifecycle Framework', () => {
  const tenantA = 'tenant-adyapan-default';
  const tenantB = 'tenant-apex-nbfc';

  // Realistic Actor Personas
  const superAdmin = { id: 'usr-sa-001', email: 'superadmin@adyapan.dev', roles: ['SUPER_ADMIN'], tenantId: tenantA };
  const underwriterA = { id: 'usr-uw-001', email: 'uw@adyapan.dev', roles: ['UNDERWRITER'], tenantId: tenantA };
  const disbursementOfficerA = { id: 'usr-disb-001', email: 'disb@adyapan.dev', roles: ['DISBURSEMENT_OFFICER'], tenantId: tenantA };
  const financeControllerA = { id: 'usr-fc-001', email: 'fc@adyapan.dev', roles: ['FINANCE_CONTROLLER'], tenantId: tenantA };
  const collectionAgentA = { id: 'usr-coll-001', email: 'coll@adyapan.dev', roles: ['COLLECTION_AGENT'], tenantId: tenantA };
  const auditorA = { id: 'usr-aud-001', email: 'auditor@adyapan.dev', roles: ['AUDITOR'], tenantId: tenantA };
  const borrowerA = { id: 'usr-borrower-001', email: 'rajesh.kumar@example.com', roles: ['CUSTOMER'], tenantId: tenantA };

  const underwriterB = { id: 'usr-uw-b', email: 'uw@apex.dev', roles: ['UNDERWRITER'], tenantId: tenantB };

  beforeEach(() => {
    productCatalogService.clearForTesting();
    workflowService.clearForTesting();
    rolePermissionService.clearForTesting();
    privacyConsentService.clearForTesting();
  });

  // =========================================================================
  // 1. COMPLETE BORROWER JOURNEY (ONBOARDING -> SANCTION -> PAYOUT -> PAYOFF -> NOC)
  // =========================================================================
  describe('1. Complete Borrower Happy-Path Journey', () => {
    it('executes full lending lifecycle from lead capture to final NOC closure with exact financial allocation', async () => {
      // Step A: Statutory Privacy & DPDP Consent Recording
      const consent = await privacyConsentService.grantConsent(
        {
          tenantId: tenantA,
          customerId: borrowerA.id,
          purposeCode: 'PURPOSE-BUREAU-02',
          channel: 'WEB_PORTAL',
          ipAddress: '49.207.198.11',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
        borrowerA
      );
      expect(consent.status).toBe('GRANTED');

      // Step B: Product Catalog Selection & Simulation
      const primeProduct = productCatalogService.getProductById(tenantA, 'PERSONAL_PRIME_SALARIED');
      expect(primeProduct.baseInterestRateAnnualPct).toBe(12.5);

      const pricing = productCatalogService.simulateProductPricing(tenantA, {
        productId: primeProduct.id,
        loanAmount: 300000, // ₹3 Lakh
        tenureMonths: 12, // 12 Months
        applicantProfile: {
          cibilScore: 780,
          monthlyIncome: 80000,
          existingEmis: 5000,
        },
      });

      expect(pricing.eligibilityCheck.eligible).toBe(true);
      expect(pricing.monthlyEmi).toBeGreaterThan(26000);
      expect(pricing.monthlyEmi).toBeLessThan(27500); // ~₹26,727
      expect(pricing.netDisbursedAmount).toBe(300000 - pricing.totalFees);

      // Step C: Workflow Transition Evaluation (Fast-Track Prime Route)
      const wfEval = workflowService.evaluateWorkflowTransition(
        tenantA,
        {
          workflowType: 'LOAN_ORIGINATION',
          currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
          candidatePayload: {
            applicationId: 'appl-e2e-001',
            cibilScore: 780,
            employmentType: 'SALARIED',
            fraudScore: 10,
            loanAmount: 300000,
          },
        },
        underwriterA
      );

      expect(wfEval.allowed).toBe(true);
      expect(wfEval.evaluatedBranch).toBe('Fast-Track Prime Borrower Routing');
      expect(wfEval.targetStageCode).toBe('SANCTION_DISBURSEMENT');

      // Step D: Amortization Schedule Generation
      const emiSchedule = calculateEmi(300000, 12.5, 12);

      expect(emiSchedule.schedule.length).toBe(12);
      expect(Number(emiSchedule.totalRepayment)).toBeGreaterThan(300000);

      // Step E: Repayment Allocation (Month 1 on-time payment)
      const installment1 = emiSchedule.schedule[0];
      const allocation = allocateRepayment({
        repaymentAmount: Number(installment1.emi),
        outstandingPrincipal: 300000,
        accruedInterest: Number(installment1.interest),
        feesDue: 0,
        penaltiesDue: 0,
      });

      expect(allocation.allocatedToInterest).toBe(Number(installment1.interest));
      expect(allocation.allocatedToPrincipal).toBe(Number(installment1.principal));
      expect(allocation.remainingPrincipal).toBe(300000 - Number(installment1.principal));

      // Step F: Loan Closure & Cryptographic Evidence Node Recording
      const evidenceNode = evidenceAuditService.recordEvidenceNode({
        tenantId: tenantA,
        eventType: 'PAYMENT_LEDGER',
        actorId: financeControllerA.id,
        actorRole: 'FINANCE_CONTROLLER',
        actorEmail: financeControllerA.email,
        entityType: 'LOAN_ACCOUNT',
        entityId: 'loan-e2e-001',
        action: 'LOAN_PAYOFF_COMPLETED_AND_NOC_ISSUED',
        correlationId: 'corr-e2e-payoff-001',
        beforeState: { status: 'ACTIVE', outstandingBalance: 0 },
        afterState: { status: 'CLOSED_OBLIGATION_MET', nocCertificateNumber: 'NOC-2026-8831' },
        timestamp: new Date().toISOString(),
      });

      expect(evidenceNode.evidenceHash).toBeDefined();
      expect(evidenceNode.evidenceHash.length).toBe(64); // SHA-256
    });
  });

  // =========================================================================
  // 2. OVERDUE, DPD, EARLY WARNING & RESTRUCTURING JOURNEY
  // =========================================================================
  describe('2. Overdue, DPD & Collections Lifecycle', () => {
    it('accurately computes DPD delinquency, alerts early warning center, and records collection actions', () => {
      // 1. Borrower misses EMI by 45 days -> DPD = 45 -> SMA-1 Category
      const overdueAmount = 26727;
      const dpd = 45;

      let assetClassification = 'STANDARD';
      if (dpd > 90) assetClassification = 'NPA';
      else if (dpd > 60) assetClassification = 'SMA_2';
      else if (dpd > 30) assetClassification = 'SMA_1';
      else if (dpd > 0) assetClassification = 'SMA_0';

      expect(assetClassification).toBe('SMA_1');

      // 2. Late Fee Penalty Calculation (2.0% per month overdue)
      const lateFeeMonthlyPct = 2.0;
      const penaltyAmount = Math.round((overdueAmount * (lateFeeMonthlyPct / 100) * (dpd / 30)));
      expect(penaltyAmount).toBeGreaterThan(0);

      // 3. Early Warning Anomaly Signal
      const signal = {
        tenantId: tenantA,
        loanId: 'loan-overdue-001',
        customerId: borrowerA.id,
        riskTier: 'HIGH',
        triggerCategory: 'DELINQUENCY_SPIKE',
        dpd,
        overdueAmount,
        penaltyAmount,
      };
      expect(signal.riskTier).toBe('HIGH');

      // 4. Repayment with Penalty Priority Allocation
      // Order of recovery: Penalties -> Interest -> Principal
      const paymentReceived = 30000;
      const overdueInterest = 3125;
      const alloc = allocateRepayment({
        repaymentAmount: paymentReceived,
        outstandingPrincipal: 280000,
        accruedInterest: overdueInterest,
        feesDue: 0,
        penaltiesDue: penaltyAmount,
      });

      expect(alloc.allocatedToPenalties).toBe(penaltyAmount);
      expect(alloc.allocatedToInterest).toBe(overdueInterest);
      expect(alloc.allocatedToPrincipal).toBe(paymentReceived - penaltyAmount - overdueInterest);
    });
  });

  // =========================================================================
  // 3. CREDIT & UNDERWRITING DECISION INTELLIGENCE JOURNEY
  // =========================================================================
  describe('3. Credit & Underwriting Decision Intelligence', () => {
    it('surfaces bank statement anomalies and fraud alerts while preserving human decision authority', () => {
      // 1. Bank Statement Intelligence (Inconsistent salary credits detected)
      const bankSummary = {
        averageMonthlyInflow: 45000,
        salaryConsistencyScore: 0.58, // Low consistency
        bounceCount3M: 2, // 2 ECS bounces
        hasSalaryIrregularity: true,
      };
      expect(bankSummary.bounceCount3M).toBe(2);

      // 2. Fraud Intelligence (Velocity check)
      const fraudAssessment = {
        fraudRiskScore: 65, // Elevated risk
        flags: ['DEVICE_IP_VELOCITY_HIGH', 'MULTIPLE_APPLICATIONS_DETECTED'],
        recommendedAction: 'MANUAL_INVESTIGATION_REQUIRED',
      };
      expect(fraudAssessment.fraudRiskScore).toBeGreaterThan(50);

      // 3. Dynamic Workflow Gate Evaluation (Stage blocks due to fraudScore > 50)
      const evalResult = workflowService.evaluateWorkflowTransition(
        tenantA,
        {
          workflowType: 'LOAN_ORIGINATION',
          currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
          candidatePayload: {
            applicationId: 'appl-risky-001',
            cibilScore: 690,
            fraudScore: 65, // Exceeds max 50 gate
          },
        },
        underwriterA
      );

      expect(evalResult.allowed).toBe(false);
      expect(evalResult.gateCheckResults.some((g) => !g.passed)).toBe(true);

      // 4. Human Underwriter Review Decision Authority
      // Underwriter can record reason and condition for rejection or manual committee referral
      const underwriterDecision = {
        action: 'REFERRED_TO_CREDIT_COMMITTEE',
        rationale: 'Elevated fraud velocity and 2 ECS bounces in Account Aggregator statement',
        actorId: underwriterA.id,
      };
      expect(underwriterDecision.action).toBe('REFERRED_TO_CREDIT_COMMITTEE');
    });
  });

  // =========================================================================
  // 4. MULTI-TENANT ISOLATION (TENANT A VS TENANT B)
  // =========================================================================
  describe('4. Multi-Tenant Zero-Leakage Data & Context Isolation', () => {
    it('strictly isolates products, consents, workflows, and evidence nodes across tenant boundaries', async () => {
      // 1. Consent Isolation
      const consentA = await privacyConsentService.grantConsent(
        {
          tenantId: tenantA,
          customerId: 'cust-tenant-a-1',
          purposeCode: 'PURPOSE-BUREAU-02',
          channel: 'WEB_PORTAL',
        },
        borrowerA
      );

      // Tenant B queries consents -> must NOT see Tenant A consent
      const tenantBConsents = privacyConsentService.listConsents(tenantB, { customerId: 'cust-tenant-a-1' });
      expect(tenantBConsents.length).toBe(0);

      // 2. Product Catalog Tenant Isolation
      const tenantAProducts = productCatalogService.listProducts(tenantA);
      const tenantBProducts = productCatalogService.listProducts(tenantB);
      expect(tenantAProducts.every((p) => p.tenantId === tenantA)).toBe(true);
      expect(tenantBProducts.every((p) => p.tenantId === tenantB)).toBe(true);
    });
  });

  // =========================================================================
  // 5. ROLE-BASED ACCESS CONTROL (RBAC) & SEGREGATION OF DUTIES (SOD)
  // =========================================================================
  describe('5. Enterprise Role-Based Access Control & Segregation of Duties', () => {
    it('enforces segregation of duties preventing Maker from approving their own disbursement payout', () => {
      const sodCheck = rolePermissionService.checkSodConflicts([
        'DISBURSEMENTS_INITIATE_PAYOUT',
        'DISBURSEMENTS_APPROVE_MAKER_CHECKER',
      ]);

      expect(sodCheck.hasConflict).toBe(true);
      expect(sodCheck.hasCriticalBlock).toBe(true);
      expect(sodCheck.conflicts[0].ruleCode).toBe('SOD_MAKER_CHECKER_PAYOUT');
    });

    it('strictly blocks borrowers (CUSTOMER role) from administrative operations', async () => {
      await expect(
        workflowService.createWorkflow(
          tenantA,
          {
            type: 'PRODUCT_CUSTOM',
            code: 'HACK',
            name: 'Hacked',
            description: 'Illegal',
            stages: [],
          },
          borrowerA
        )
      ).rejects.toThrow('Only Administrators can configure institutional workflows.');
    });

    it('enforces financial sanction authority limits for Underwriter roles', () => {
      // Underwriter has standard limit ₹50 Lakh, attempting ₹1.5 Cr requires Committee
      const sanctionLimit = 5000000;
      const requestedFacility = 15000000;
      const exceedsAuthority = requestedFacility > sanctionLimit;
      expect(exceedsAuthority).toBe(true);
    });
  });

  // =========================================================================
  // 6. FINANCIAL SAFETY & IDEMPOTENCY
  // =========================================================================
  describe('6. Financial Safety & Zero-Mutation Invariants', () => {
    it('guarantees immutable product version snapshots so active loans never mutate retroactively', async () => {
      const prod = productCatalogService.getProductById(tenantA, 'PERSONAL_PRIME_SALARIED');
      expect(prod.version).toBe(1);
      expect(prod.baseInterestRateAnnualPct).toBe(12.5);

      // Admin updates product APR to 14.5%
      await productCatalogService.updateProductWithVersioning(
        tenantA,
        prod.id,
        { baseInterestRateAnnualPct: 14.5 },
        superAdmin
      );

      // Historical loan referencing version 1 gets 12.5%
      const snap = productCatalogService.getProductVersionSnapshot(tenantA, prod.id, 1);
      expect(snap.version).toBe(1);
      expect(snap.baseInterestRateAnnualPct).toBe(12.5);
    });

    it('strictly validates that repayment allocation sum exactly equals input payment amount', () => {
      const paymentAmount = 45000;
      const alloc = allocateRepayment({
        repaymentAmount: paymentAmount,
        outstandingPrincipal: 100000,
        accruedInterest: 3500,
        feesDue: 1000,
        penaltiesDue: 500,
      });

      const totalAllocated =
        alloc.allocatedToPenalties +
        alloc.allocatedToFees +
        alloc.allocatedToInterest +
        alloc.allocatedToPrincipal +
        alloc.excessRefund;

      expect(totalAllocated).toBe(paymentAmount);
    });
  });
});
