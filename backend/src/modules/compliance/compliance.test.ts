import { describe, it, expect, beforeEach } from 'vitest';
import { complianceService } from './compliance.service';

describe('Step 29: Regulatory & Compliance Framework', () => {
  beforeEach(() => {
    complianceService.clearForTesting();
  });

  describe('1. Rule Registry & Institutional Policies', () => {
    it('seeds and lists default RBI digital lending and platform compliance rules', () => {
      const rules = complianceService.listRules('tenant-adyapan-default');
      expect(rules.length).toBeGreaterThanOrEqual(6);

      const ruleIds = rules.map((r) => r.id);
      expect(ruleIds).toContain('RULE-KYC-PAN-01');
      expect(ruleIds).toContain('RULE-KFS-CONSENT-02');
      expect(ruleIds).toContain('RULE-DIRECT-DISB-03');
      expect(ruleIds).toContain('RULE-UNDERWRITING-SOD-04');
    });

    it('allows admins to upsert custom tenant compliance rules', async () => {
      const customRule = await complianceService.upsertRule(
        'tenant-apex-nbfc',
        {
          name: 'Apex Custom Prepayment Waiver Period',
          description: 'Zero penalty prepayment permitted after 3 EMIs.',
          category: 'DISBURSEMENT_CONTROLS',
          severity: 'MEDIUM',
          status: 'ACTIVE',
          evidenceRequirement: 'REPAYMENT_LEDGER_3_MONTHS',
          responsibleRole: 'LOAN_OFFICER',
          escalationBehavior: 'FLAG_FOR_REVIEW',
        },
        { id: 'admin-1', email: 'admin@apex.dev', roles: ['ADMIN'] }
      );

      expect(customRule.id).toBeDefined();
      const apexRules = complianceService.listRules('tenant-apex-nbfc');
      expect(apexRules.some((r) => r.name === 'Apex Custom Prepayment Waiver Period')).toBe(true);

      // Other tenant should not see tenant-apex-nbfc specific rule
      const otherRules = complianceService.listRules('tenant-other-bank');
      expect(otherRules.some((r) => r.id === customRule.id)).toBe(false);
    });
  });

  describe('2. Deterministic Compliance Evaluation Engine', () => {
    it('evaluates fully compliant loan application with 100% score', async () => {
      const result = await complianceService.evaluateApplicationCompliance('tenant-adyapan-default', {
        id: 'app-comp-100',
        requestedAmount: 250000,
        kycVerified: true,
        panVerified: true,
        kfsConsented: true,
        bankAccountValidated: true,
        hasIncomeDocuments: true,
        distinctApproverRoles: ['UNDERWRITER'],
      });

      expect(result.complianceScore).toBe(100);
      expect(result.overallStatus).toBe('COMPLIANT');
      expect(result.failedRulesCount).toBe(0);
      expect(result.exceptionsCreated.length).toBe(0);
    });

    it('detects missing PAN/KYC and missing KFS consent, raising tracked exceptions', async () => {
      const result = await complianceService.evaluateApplicationCompliance('tenant-adyapan-default', {
        id: 'app-non-comp-01',
        requestedAmount: 150000,
        kycVerified: false,
        panVerified: false,
        kfsConsented: false,
        bankAccountValidated: true,
        hasIncomeDocuments: true,
      });

      expect(result.complianceScore).toBeLessThan(100);
      expect(result.overallStatus).toBe('NON_COMPLIANT');
      expect(result.failedRulesCount).toBeGreaterThanOrEqual(2);
      expect(result.exceptionsCreated.length).toBeGreaterThanOrEqual(2);

      const kycEval = result.evaluations.find((e) => e.ruleId === 'RULE-KYC-PAN-01');
      expect(kycEval?.status).toBe('NON_COMPLIANT');
      expect(kycEval?.finding).toContain('PAN or KYC verification incomplete');
    });

    it('enforces segregation-of-duties (SoD) dual-signoff rule for high-value credit > ₹500,000', async () => {
      const highValApp = {
        id: 'app-high-val-99',
        requestedAmount: 750000,
        kycVerified: true,
        panVerified: true,
        kfsConsented: true,
        bankAccountValidated: true,
        hasIncomeDocuments: true,
        distinctApproverRoles: ['UNDERWRITER'], // Only 1 approver, needs 2
      };

      const result = await complianceService.evaluateApplicationCompliance('tenant-adyapan-default', highValApp);

      const sodEval = result.evaluations.find((e) => e.ruleId === 'RULE-UNDERWRITING-SOD-04');
      expect(sodEval?.status).toBe('NON_COMPLIANT');
      expect(sodEval?.finding).toContain('requires 2 distinct staff role signoffs');
    });
  });

  describe('3. Compliance Exception Lifecycle & Audit Evidence', () => {
    it('manages exception state transitions through complete remediation lifecycle', async () => {
      // Trigger evaluation to create exception
      const evalRes = await complianceService.evaluateApplicationCompliance('tenant-adyapan-default', {
        id: 'app-exc-test',
        requestedAmount: 200000,
        kycVerified: false,
        panVerified: false,
        kfsConsented: true,
        bankAccountValidated: true,
        hasIncomeDocuments: true,
      });

      const excId = evalRes.exceptionsCreated[0];
      expect(excId).toBeDefined();

      const exc = complianceService.getException(excId)!;
      expect(exc.status).toBe('OPEN');

      // 1. Acknowledge
      const acked = await complianceService.transitionException(
        excId,
        'ACKNOWLEDGED',
        { id: 'officer-1', email: 'officer@adyapan.dev', roles: ['LOAN_OFFICER'] },
        { remediationNotes: 'Contacting customer to re-upload clear PAN image' }
      );
      expect(acked.status).toBe('ACKNOWLEDGED');

      // 2. Under Review
      const underReview = await complianceService.transitionException(
        excId,
        'UNDER_REVIEW',
        { id: 'auditor-1', email: 'auditor@adyapan.dev', roles: ['AUDITOR'] }
      );
      expect(underReview.status).toBe('UNDER_REVIEW');

      // 3. Resolve
      const resolved = await complianceService.transitionException(
        excId,
        'RESOLVED',
        { id: 'auditor-1', email: 'auditor@adyapan.dev', roles: ['AUDITOR'] },
        { remediationPlan: 'PAN successfully verified via Digilocker NSDL API' }
      );
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedBy).toBe('auditor@adyapan.dev');
    });

    it('rejects borrower attempts to modify compliance configurations or exceptions', async () => {
      await expect(
        complianceService.upsertRule(
          'tenant-adyapan-default',
          {
            name: 'Malicious Bypass',
            description: 'Disable KYC',
            category: 'KYC_AML',
            severity: 'CRITICAL',
            status: 'INACTIVE',
            evidenceRequirement: 'NONE',
            responsibleRole: 'NONE',
            escalationBehavior: 'NONE',
          },
          { id: 'borrower-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] }
        )
      ).rejects.toThrow('Borrowers cannot manage compliance rules.');
    });
  });

  describe('4. Compliance Overview & Dashboard Aggregation', () => {
    it('aggregates category scores, active rules, and open exceptions for executive review', async () => {
      // Create 1 failure to populate overview
      await complianceService.evaluateApplicationCompliance('tenant-adyapan-default', {
        id: 'app-overview-test',
        requestedAmount: 50000,
        kycVerified: false,
        panVerified: false,
        kfsConsented: true,
        bankAccountValidated: true,
        hasIncomeDocuments: true,
      });

      const overview = complianceService.getComplianceOverview('tenant-adyapan-default');

      expect(overview.tenantId).toBe('tenant-adyapan-default');
      expect(overview.activeRulesCount).toBeGreaterThanOrEqual(6);
      expect(overview.openExceptionsCount).toBeGreaterThanOrEqual(1);
      expect(overview.categoryScores.KYC_AML).toBeDefined();
      expect(overview.categoryScores.KYC_AML.activeExceptions).toBeGreaterThanOrEqual(1);
    });
  });
});
