import { describe, it, expect, beforeEach } from 'vitest';
import { evidenceAuditService } from './evidence.service';

describe('Step 31: Audit & Compliance Evidence Framework', () => {
  beforeEach(() => {
    evidenceAuditService.clearForTesting();
  });

  describe('1. SHA-256 Cryptographic Hash Chaining', () => {
    it('records sequential lifecycle events with continuous hash chaining', () => {
      // Step 1: KYC
      const node1 = evidenceAuditService.recordEvidenceNode({
        tenantId: 'tenant-adyapan-default',
        eventType: 'KYC_VERIFICATION',
        actorEmail: 'officer@adyapan.dev',
        actorRole: 'LOAN_OFFICER',
        entityType: 'APPLICATION',
        entityId: 'APP-CHAIN-001',
        action: 'KYC_VERIFIED_DIGILOCKER',
        correlationId: 'corr-001',
        afterState: { kycStatus: 'VERIFIED' },
      });

      // Step 2: Underwriting
      const node2 = evidenceAuditService.recordEvidenceNode({
        tenantId: 'tenant-adyapan-default',
        eventType: 'CREDIT_UNDERWRITING',
        actorEmail: 'underwriter@adyapan.dev',
        actorRole: 'UNDERWRITER',
        entityType: 'APPLICATION',
        entityId: 'APP-CHAIN-001',
        action: 'FOIR_EVALUATED_APPROVED',
        correlationId: 'corr-002',
        afterState: { foir: 0.42, riskScore: 780 },
      });

      // Step 3: Disbursement
      const node3 = evidenceAuditService.recordEvidenceNode({
        tenantId: 'tenant-adyapan-default',
        eventType: 'DISBURSEMENT_EXECUTION',
        actorEmail: 'finance@adyapan.dev',
        actorRole: 'FINANCE_OFFICER',
        entityType: 'APPLICATION',
        entityId: 'APP-CHAIN-001',
        action: 'DIRECT_BENEFICIARY_DISBURSED',
        correlationId: 'corr-003',
        afterState: { utr: 'AXIS98234710', amount: 200000 },
      });

      expect(node2.previousHash).toBe(node1.evidenceHash);
      expect(node3.previousHash).toBe(node2.evidenceHash);

      const integrity = evidenceAuditService.verifyChainIntegrity('tenant-adyapan-default', 'APP-CHAIN-001');
      expect(integrity.valid).toBe(true);
      expect(integrity.nodesVerified).toBe(3);
    });

    it('detects tampering when an evidence node payload is modified', () => {
      evidenceAuditService.recordEvidenceNode({
        tenantId: 'tenant-adyapan-default',
        eventType: 'LOAN_SANCTION',
        actorEmail: 'admin@adyapan.dev',
        entityType: 'APPLICATION',
        entityId: 'APP-TAMPER-002',
        action: 'SANCTION_LETTER_ISSUED',
        correlationId: 'corr-tamper-1',
        afterState: { sanctionedAmount: 100000 },
      });

      // Illegitimate mutation on internal memory array (tamper attack)
      const nodes = (evidenceAuditService as any).evidenceNodes as any[];
      const target = nodes.find((n) => n.entityId === 'APP-TAMPER-002');
      target.afterState.sanctionedAmount = 900000; // Altered amount

      const integrity = evidenceAuditService.verifyChainIntegrity('tenant-adyapan-default', 'APP-TAMPER-002');
      expect(integrity.valid).toBe(false); // Tamper detected!
    });
  });

  describe('2. Evidence Package Assembler', () => {
    it('generates a verified evidence package with chronological timeline and supporting refs', () => {
      evidenceAuditService.recordEvidenceNode({
        tenantId: 'tenant-adyapan-default',
        eventType: 'KYC_VERIFICATION',
        actorEmail: 'officer@adyapan.dev',
        entityType: 'APPLICATION',
        entityId: 'APP-PKG-003',
        action: 'AADHAAR_XML_MATCHED',
        correlationId: 'corr-pkg-1',
      });

      evidenceAuditService.recordEvidenceNode({
        tenantId: 'tenant-adyapan-default',
        eventType: 'LOAN_SANCTION',
        actorEmail: 'underwriter@adyapan.dev',
        entityType: 'APPLICATION',
        entityId: 'APP-PKG-003',
        action: 'SANCTIONED_BY_COMMITTEE',
        correlationId: 'corr-pkg-2',
      });

      const pkg = evidenceAuditService.generateEvidencePackage(
        'tenant-adyapan-default',
        'APPLICATION',
        'APP-PKG-003',
        { id: 'auditor-1', email: 'auditor@adyapan.dev', roles: ['AUDITOR'] }
      );

      expect(pkg.packageId).toBeDefined();
      expect(pkg.integrityVerified).toBe(true);
      expect(pkg.totalEventsCount).toBe(2);
      expect(pkg.timeline.length).toBe(2);
      expect(pkg.supportingEvidence.length).toBeGreaterThanOrEqual(3);
      expect(pkg.aiSummaryAdvisory).toContain('Complete evidence chain with 2 verified events');
    });
  });

  describe('3. Controlled Audit Export with Automatic PII Redaction', () => {
    it('masks PAN, Aadhaar, and credentials when exporting audit trail to JSON and CSV', () => {
      evidenceAuditService.recordEvidenceNode({
        tenantId: 'tenant-adyapan-default',
        eventType: 'KYC_VERIFICATION',
        actorEmail: 'officer@adyapan.dev',
        entityType: 'APPLICATION',
        entityId: 'APP-EXPORT-004',
        action: 'CUSTOMER_ONBOARDED',
        correlationId: 'corr-exp-1',
        afterState: {
          customerPan: 'ABCDE1234F',
          customerAadhaar: '123456789012',
          bankAccount: '987654321098',
          userPassword: 'SecretPassword123!',
        },
      });

      // 1. JSON Export
      const jsonExport = evidenceAuditService.exportAuditTrail(
        'tenant-adyapan-default',
        { entity: 'APP-EXPORT-004', format: 'JSON' },
        { id: 'admin-1', email: 'admin@adyapan.dev', roles: ['ADMIN'] }
      );

      expect(jsonExport.format).toBe('JSON');
      expect(jsonExport.data).toContain('ABCDE****F');
      expect(jsonExport.data).toContain('**** **** 9012');
      expect(jsonExport.data).toContain('******1098');
      expect(jsonExport.data).not.toContain('SecretPassword123!');

      // 2. CSV Export
      const csvExport = evidenceAuditService.exportAuditTrail(
        'tenant-adyapan-default',
        { entity: 'APP-EXPORT-004', format: 'CSV' },
        { id: 'admin-1', email: 'admin@adyapan.dev', roles: ['ADMIN'] }
      );

      expect(csvExport.format).toBe('CSV');
      expect(csvExport.data).toContain('APP-EXPORT-004');
    });
  });

  describe('4. RBAC & Borrower Isolation', () => {
    it('rejects borrower attempts to generate evidence packages or export audit trails', () => {
      expect(() =>
        evidenceAuditService.generateEvidencePackage(
          'tenant-adyapan-default',
          'APPLICATION',
          'APP-001',
          { id: 'borrower-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] }
        )
      ).toThrow('Borrowers cannot generate internal evidence packages.');

      expect(() =>
        evidenceAuditService.exportAuditTrail(
          'tenant-adyapan-default',
          { format: 'JSON' },
          { id: 'borrower-1', email: 'borrower@adyapan.dev', roles: ['CUSTOMER'] }
        )
      ).toThrow('Borrowers cannot export audit logs.');
    });
  });
});
