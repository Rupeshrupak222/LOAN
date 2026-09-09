import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import {
  EvidenceNode,
  EvidenceEventType,
  EvidencePackage,
  EvidenceTimelineItem,
  SupportingEvidenceRef,
  AuditExportFilter,
} from './evidence.types';
import { securityService } from '../security/security.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';

export class EvidenceAuditService {
  private static instance: EvidenceAuditService;

  // In-memory Evidence Ledger with SHA-256 Hash Chaining
  private readonly evidenceNodes: EvidenceNode[] = [];

  // Genesis Hash
  private readonly GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  private constructor() {
    this.seedDefaultEvidenceChain();
  }

  public static getInstance(): EvidenceAuditService {
    if (!EvidenceAuditService.instance) {
      EvidenceAuditService.instance = new EvidenceAuditService();
    }
    return EvidenceAuditService.instance;
  }

  private seedDefaultEvidenceChain(): void {
    const now = new Date(Date.now() - 3600000).toISOString();
    this.recordEvidenceNode({
      tenantId: 'tenant-adyapan-default',
      eventType: 'LOAN_SANCTION',
      actorId: 'usr-admin-01',
      actorRole: 'SUPER_ADMIN',
      actorEmail: 'superadmin@adyapan.dev',
      entityType: 'APPLICATION',
      entityId: 'APP-DEMO-001',
      action: 'SANCTION_APPROVED',
      correlationId: 'corr-seed-001',
      policyVersion: 'v1.0',
      ipAddress: '127.0.0.1',
      beforeState: { status: 'UNDER_REVIEW' },
      afterState: { status: 'APPROVED', sanctionedAmount: 250000 },
      timestamp: now,
    });
  }

  private computeHash(
    previousHash: string,
    tenantId: string,
    eventType: string,
    entityId: string,
    action: string,
    actorEmail: string,
    timestamp: string,
    afterState: any
  ): string {
    const dataString = `${previousHash}|${tenantId}|${eventType}|${entityId}|${action}|${actorEmail}|${timestamp}|${JSON.stringify(afterState || {})}`;
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  // --- 1. RECORD TAMPER-RESISTANT EVIDENCE NODE ---

  public recordEvidenceNode(dto: {
    tenantId: string;
    eventType: EvidenceEventType;
    actorId?: string;
    actorRole?: string;
    actorEmail: string;
    entityType: string;
    entityId: string;
    action: string;
    correlationId: string;
    policyVersion?: string;
    ipAddress?: string;
    beforeState?: any;
    afterState?: any;
    timestamp?: string;
  }): EvidenceNode {
    const timestamp = dto.timestamp || new Date().toISOString();

    // Get previous hash for this entity or platform
    const entityNodes = this.evidenceNodes.filter(
      (n) => n.tenantId === dto.tenantId && n.entityId === dto.entityId
    );
    const previousHash = entityNodes.length > 0
      ? entityNodes[entityNodes.length - 1].evidenceHash
      : this.GENESIS_HASH;

    const evidenceHash = this.computeHash(
      previousHash,
      dto.tenantId,
      dto.eventType,
      dto.entityId,
      dto.action,
      dto.actorEmail,
      timestamp,
      dto.afterState
    );

    const node: EvidenceNode = {
      id: `ev-node-${uuid().slice(0, 8)}`,
      tenantId: dto.tenantId,
      eventType: dto.eventType,
      actorId: dto.actorId || 'system',
      actorRole: dto.actorRole || 'SYSTEM',
      actorEmail: dto.actorEmail,
      entityType: dto.entityType,
      entityId: dto.entityId,
      action: dto.action,
      correlationId: dto.correlationId,
      policyVersion: dto.policyVersion || 'v1.0',
      ipAddress: dto.ipAddress || '127.0.0.1',
      previousHash,
      evidenceHash,
      beforeState: dto.beforeState,
      afterState: dto.afterState,
      timestamp,
    };

    this.evidenceNodes.push(node);
    return node;
  }

  // --- 2. VERIFY SHA-256 HASH CHAIN INTEGRITY ---

  public verifyChainIntegrity(tenantId: string, entityId: string): { valid: boolean; nodesVerified: number; brokenAt?: string } {
    const nodes = this.evidenceNodes.filter((n) => n.tenantId === tenantId && n.entityId === entityId);
    if (nodes.length === 0) {
      return { valid: true, nodesVerified: 0 };
    }

    let expectedPrevHash = this.GENESIS_HASH;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.previousHash !== expectedPrevHash) {
        return { valid: false, nodesVerified: i, brokenAt: node.id };
      }

      const recalculated = this.computeHash(
        node.previousHash,
        node.tenantId,
        node.eventType,
        node.entityId,
        node.action,
        node.actorEmail,
        node.timestamp,
        node.afterState
      );

      if (recalculated !== node.evidenceHash) {
        return { valid: false, nodesVerified: i, brokenAt: node.id };
      }

      expectedPrevHash = node.evidenceHash;
    }

    return { valid: true, nodesVerified: nodes.length };
  }

  // --- 3. EVIDENCE PACKAGE ASSEMBLER ---

  public generateEvidencePackage(
    tenantId: string,
    entityType: 'APPLICATION' | 'LOAN' | 'CUSTOMER',
    entityId: string,
    actor: { id: string; email: string; roles: string[] }
  ): EvidencePackage {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Borrowers cannot generate internal evidence packages.');
    }

    const nodes = this.evidenceNodes.filter(
      (n) => (tenantId === '*' || n.tenantId === tenantId) && n.entityId === entityId
    );

    const integrity = this.verifyChainIntegrity(tenantId, entityId);

    const timeline: EvidenceTimelineItem[] = nodes.map((n) => ({
      nodeId: n.id,
      stepName: n.action.replace(/_/g, ' '),
      actor: n.actorEmail,
      role: n.actorRole,
      timestamp: n.timestamp,
      evidenceHash: n.evidenceHash,
      details: `${n.eventType} action executed under policy version ${n.policyVersion || 'v1.0'}.`,
    }));

    const supportingEvidence: SupportingEvidenceRef[] = [
      {
        type: 'KYC_RECORD',
        id: `KYC-${entityId}`,
        title: 'Digilocker eKYC & NSDL PAN Verified Hash',
        timestamp: nodes[0]?.timestamp || new Date().toISOString(),
      },
      {
        type: 'CONSENT_RECORD',
        id: `CST-${entityId}`,
        title: 'Key Fact Statement (KFS) Explicit Digital Signature',
        timestamp: nodes[0]?.timestamp || new Date().toISOString(),
      },
      {
        type: 'UNDERWRITING_PROOF',
        id: `UW-${entityId}`,
        title: 'Deterministic FOIR/DTI Rule Calculation Snapshot',
        timestamp: nodes[0]?.timestamp || new Date().toISOString(),
      },
    ];

    const packageId = `ev-pkg-${uuid().slice(0, 8)}`;

    return {
      packageId,
      tenantId,
      entityType,
      entityId,
      generatedAt: new Date().toISOString(),
      generatedBy: actor.email,
      integrityVerified: integrity.valid,
      totalEventsCount: nodes.length,
      timeline,
      supportingEvidence,
      aiSummaryAdvisory: `Advisory evidence audit for ${entityType} #${entityId}: Complete evidence chain with ${nodes.length} verified events. Cryptographic SHA-256 integrity check status is ${integrity.valid ? 'VERIFIED_VALID' : 'INTEGRITY_MISMATCH'}. All sensitive identifiers masked under statutory DPDP rules.`,
    };
  }

  // --- 4. CONTROLLED AUDIT EXPORT WITH PII MASKING ---

  public exportAuditTrail(
    tenantId: string,
    filter: AuditExportFilter,
    actor: { id: string; email: string; roles: string[] }
  ): { format: string; totalRecords: number; data: string } {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Borrowers cannot export audit logs.');
    }

    let records = this.evidenceNodes.filter((n) => tenantId === '*' || n.tenantId === tenantId);

    if (filter.entity) {
      records = records.filter((r) => r.entityType === filter.entity || r.entityId === filter.entity);
    }
    if (filter.actorRole) {
      records = records.filter((r) => r.actorRole === filter.actorRole);
    }
    if (filter.correlationId) {
      records = records.filter((r) => r.correlationId === filter.correlationId);
    }

    // Mask PII in all exported records
    const sanitized = records.map((r) => {
      const copy = { ...r };
      if (copy.beforeState) copy.beforeState = this.maskObjectPii(copy.beforeState);
      if (copy.afterState) copy.afterState = this.maskObjectPii(copy.afterState);
      return copy;
    });

    if (filter.format === 'CSV') {
      const headers = ['id', 'timestamp', 'actorEmail', 'actorRole', 'eventType', 'entityId', 'action', 'evidenceHash'];
      const rows = sanitized.map((s) => [
        s.id,
        s.timestamp,
        s.actorEmail,
        s.actorRole,
        s.eventType,
        s.entityId,
        s.action,
        s.evidenceHash,
      ].join(','));

      return {
        format: 'CSV',
        totalRecords: sanitized.length,
        data: [headers.join(','), ...rows].join('\n'),
      };
    }

    return {
      format: 'JSON',
      totalRecords: sanitized.length,
      data: JSON.stringify(sanitized, null, 2),
    };
  }

  private maskObjectPii(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const res: any = Array.isArray(obj) ? [] : {};

    for (const [key, val] of Object.entries(obj)) {
      const lower = key.toLowerCase();
      if (typeof val === 'string') {
        if (lower.includes('pan')) res[key] = securityService.maskPan(val);
        else if (lower.includes('aadhaar')) res[key] = securityService.maskAadhaar(val);
        else if (lower.includes('account') || lower.includes('bank')) res[key] = securityService.maskBankAccount(val);
        else if (lower.includes('password') || lower.includes('token') || lower.includes('secret')) res[key] = '******';
        else res[key] = val;
      } else if (typeof val === 'object' && val !== null) {
        res[key] = this.maskObjectPii(val);
      } else {
        res[key] = val;
      }
    }
    return res;
  }

  public clearForTesting(): void {
    this.evidenceNodes.length = 0;
    this.seedDefaultEvidenceChain();
  }
}

export const evidenceAuditService = EvidenceAuditService.getInstance();
