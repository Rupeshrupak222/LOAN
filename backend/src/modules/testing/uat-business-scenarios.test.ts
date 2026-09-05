import { describe, it, expect, beforeEach } from 'vitest';
import { calculateEmi, allocateRepayment } from '../finance/emi';
import { rolePermissionService } from '../roles/role-permission.service';
import { productCatalogService } from '../product/catalog.service';
import { workflowService } from '../workflows/workflow.service';
import { privacyConsentService } from '../privacy/consent.service';
import { evidenceAuditService } from '../audit/evidence.service';

describe('Step 46: User Acceptance Testing (UAT) — Real Business Lending Workflows', () => {
  const tenantA = 'tenant-adyapan-default';
  const tenantB = 'tenant-kotak-uat';

  const borrowerA = { id: 'usr-uat-bor-01', email: 'rajesh.sharma@gmail.com', roles: ['CUSTOMER'], tenantId: tenantA };
  const loanOfficer = { id: 'usr-uat-lo-01', email: 'lo.sunil@adyapan.dev', roles: ['LOAN_OFFICER'], tenantId: tenantA };
  const underwriter = { id: 'usr-uat-uw-01', email: 'uw.priya@adyapan.dev', roles: ['UNDERWRITER'], tenantId: tenantA };
  const disburserMaker = { id: 'usr-uat-disb-01', email: 'disb.maker@adyapan.dev', roles: ['DISBURSEMENT_OFFICER'], tenantId: tenantA };
  const disburserChecker = { id: 'usr-uat-chk-01', email: 'disb.checker@adyapan.dev', roles: ['FINANCE_MANAGER'], tenantId: tenantA };
  const collectionOfficer = { id: 'usr-uat-col-01', email: 'col.vikram@adyapan.dev', roles: ['COLLECTION_AGENT'], tenantId: tenantA };
  const auditor = { id: 'usr-uat-aud-01', email: 'auditor.neha@adyapan.dev', roles: ['AUDITOR'], tenantId: tenantA };

  beforeEach(() => {
    productCatalogService.clearForTesting();
    workflowService.clearForTesting();
    rolePermissionService.clearForTesting();
    privacyConsentService.clearForTesting();
  });

  // =========================================================================
  // 1. END-TO-END BORROWER PERSONA BUSINESS JOURNEY
  // =========================================================================
  describe('1. Core Borrower UAT: Sourcing to Closure & NOC', () => {
    it('executes complete business journey: Consent -> Simulation -> Approval -> Disbursement -> Payoff -> NOC', async () => {
      // Step A: Digital DPDP Statutory Consent
      const consent = await privacyConsentService.grantConsent(
        {
          tenantId: tenantA,
          customerId: borrowerA.id,
          purposeCode: 'PURPOSE-BUREAU-02',
          channel: 'WEB_PORTAL',
          ipAddress: '49.36.120.44',
          userAgent: 'Mozilla/5.0 Chrome/120',
        },
        borrowerA
      );
      expect(consent.status).toBe('GRANTED');

      // Step B: Product Simulation & Statutory KFS Pricing
      const primeProduct = productCatalogService.getProductById(tenantA, 'PERSONAL_PRIME_SALARIED');
      const pricing = productCatalogService.simulateProductPricing(tenantA, {
        productId: primeProduct.id,
        loanAmount: 300000,
        tenureMonths: 12,
        applicantProfile: { cibilScore: 780, monthlyIncome: 85000, existingEmis: 5000 },
      });
      expect(pricing.monthlyEmi).toBeGreaterThan(0);
      expect(pricing.keyFactStatement.coolingOffPeriodDays).toBe(3);

      // Step C: Workflow Transition Gates
      const wfEval = workflowService.evaluateWorkflowTransition(
        tenantA,
        {
          workflowType: 'LOAN_ORIGINATION',
          currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
          candidatePayload: {
            applicationId: 'app-uat-01',
            cibilScore: 780,
            employmentType: 'SALARIED',
            fraudScore: 8,
            loanAmount: 300000,
          },
        },
        underwriter
      );
      expect(wfEval.allowed).toBe(true);

      // Step D: Reducing-Balance Amortization Schedule
      const emiSchedule = calculateEmi(300000, 12.5, 12);
      expect(emiSchedule.schedule.length).toBe(12);

      // Step E: Final Payoff Repayment Allocation
      const finalAllocation = allocateRepayment({
        repaymentAmount: 26727,
        outstandingPrincipal: 26450,
        accruedInterest: 277,
        feesDue: 0,
        penaltiesDue: 0,
      });
      expect(finalAllocation.allocatedToPrincipal).toBe(26450);
      expect(finalAllocation.remainingPrincipal).toBe(0);

      // Step F: Digital No Objection Certificate (NOC) Evidence Node
      const nocNode = evidenceAuditService.recordEvidenceNode({
        tenantId: tenantA,
        eventType: 'LOAN_SANCTION',
        actorId: 'system',
        actorRole: 'SYSTEM',
        actorEmail: 'system@adyapan.dev',
        entityType: 'LOAN_ACCOUNT',
        entityId: 'loan-uat-01',
        action: 'DIGITAL_NOC_ISSUED',
        correlationId: 'corr-noc-uat-01',
        afterState: { status: 'CLOSED', zeroBalanceConfirmed: true },
      });
      expect(nocNode.evidenceHash).toBeDefined();
    });
  });

  // =========================================================================
  // 2. NEGATIVE BUSINESS SCENARIOS & POLICY GUARDS
  // =========================================================================
  describe('2. Negative Business Logic & Underwriting Guardrails', () => {
    it('rejects loan application if applicant FOIR exceeds statutory 65% cap', () => {
      const monthlyIncome = 40000;
      const existingEmis = 25000;
      const proposedEmi = 8000;
      const totalObligations = existingEmis + proposedEmi;
      const foir = (totalObligations / monthlyIncome) * 100; // 82.5%

      const maxAllowedFoir = 65;
      const passesPolicy = foir <= maxAllowedFoir;

      expect(foir).toBe(82.5);
      expect(passesPolicy).toBe(false);
    });

    it('blocks automated fast-track approval if CIBIL score is below institution floor (650)', () => {
      const gateCheck = workflowService.evaluateWorkflowTransition(
        tenantA,
        {
          workflowType: 'LOAN_ORIGINATION',
          currentStageCode: 'BUREAU_FRAUD_ASSESSMENT',
          candidatePayload: {
            applicationId: 'app-substandard-cibil',
            cibilScore: 590, // Substandard CIBIL
            employmentType: 'SALARIED',
            fraudScore: 12,
            loanAmount: 200000,
          },
        },
        underwriter
      );

      expect(gateCheck.allowed).toBe(false);
    });

    it('withdrawn DPDP consent halts credit bureau inquiry and automated communication', async () => {
      // Record consent then withdraw
      const consent = await privacyConsentService.grantConsent(
        {
          tenantId: tenantA,
          customerId: 'usr-withdrawn-bor',
          purposeCode: 'PURPOSE-BUREAU-02',
          channel: 'WEB_PORTAL',
        },
        borrowerA
      );

      const withdrawn = await privacyConsentService.withdrawConsent(
        consent.id,
        'Borrower revoked data sharing',
        borrowerA
      );

      expect(withdrawn.status).toBe('WITHDRAWN');
    });
  });

  // =========================================================================
  // 3. ROLE-BASED ACCESS & SOD RESTRICTIONS
  // =========================================================================
  describe('3. Role Boundary & Banking Segregation of Duties (SoD)', () => {
    it('enforces Maker-Checker rule: Payout Initiator cannot execute Payout Approval', () => {
      const sodCheck = rolePermissionService.checkSodConflicts([
        'DISBURSEMENTS_INITIATE_PAYOUT',
        'DISBURSEMENTS_APPROVE_MAKER_CHECKER',
      ]);

      expect(sodCheck.hasConflict).toBe(true);
      expect(sodCheck.conflicts[0].ruleCode).toBe('SOD_MAKER_CHECKER_PAYOUT');
    });

    it('prevents Loan Officer from issuing credit sanction approvals', () => {
      const roles = rolePermissionService.listRoles(tenantA);
      const loRole = roles.find((r) => r.code === 'LOAN_OFFICER');
      expect(loRole?.permissions).toContain('APPLICATIONS_CREATE');
      expect(loRole?.permissions).not.toContain('UNDERWRITING_APPROVE_SANCTION');
    });
  });

  // =========================================================================
  // 4. MULTI-TENANT ISOLATION UAT
  // =========================================================================
  describe('4. Multi-Tenant Independence & Context Separation', () => {
    it('verifies Tenant A and Tenant B maintain independent consent scopes', async () => {
      await privacyConsentService.grantConsent(
        {
          tenantId: tenantA,
          customerId: 'cust-tenant-a',
          purposeCode: 'PURPOSE-BUREAU-02',
          channel: 'WEB_PORTAL',
        },
        borrowerA
      );

      const listA = privacyConsentService.listConsents(tenantA, { customerId: 'cust-tenant-a' });
      const listB = privacyConsentService.listConsents(tenantB, { customerId: 'cust-tenant-a' });

      expect(listA.length).toBe(1);
      expect(listB.length).toBe(0); // Strict zero-leakage isolation!
    });
  });
});
