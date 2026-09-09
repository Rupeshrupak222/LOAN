import { v4 as uuid } from 'uuid';
import {
  ComplianceRule,
  ComplianceException,
  ComplianceCategory,
  ComplianceSeverity,
  ComplianceStatus,
  ComplianceExceptionStatus,
  ComplianceEvaluationResult,
  RuleEvaluationDetail,
  ComplianceOverview,
} from './compliance.types';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { logger } from '../../config/logger';

export class ComplianceService {
  private static instance: ComplianceService;

  // Rules Store: Map<ruleId, ComplianceRule>
  private readonly rules = new Map<string, ComplianceRule>();

  // Exceptions Store: Map<exceptionId, ComplianceException>
  private readonly exceptions = new Map<string, ComplianceException>();

  private constructor() {
    this.seedDefaultInstitutionalRules();
  }

  public static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  private seedDefaultInstitutionalRules(): void {
    const now = new Date().toISOString();

    const initialRules: ComplianceRule[] = [
      {
        id: 'RULE-KYC-PAN-01',
        tenantId: '*',
        name: 'Authoritative Customer Identity & PAN Verification',
        description: 'Mandates verified PAN with NSDL/Income Tax database and complete KYC prior to credit sanction.',
        category: 'KYC_AML',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        evidenceRequirement: 'VERIFIED_PAN_MATCH_AND_AADHAAR_XML',
        responsibleRole: 'LOAN_OFFICER',
        escalationBehavior: 'BLOCK_UNDERWRITING_SANCTION',
        effectiveDate: now,
      },
      {
        id: 'RULE-KFS-CONSENT-02',
        tenantId: '*',
        name: 'Key Fact Statement (KFS) Explicit Consent & Disclosure',
        description: 'Requires borrower digital consent on standardized Key Fact Statement (APR, fees, cooling-off) before disbursement.',
        category: 'CONSENT_DISCLOSURE',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        evidenceRequirement: 'DIGITALLY_SIGNED_KFS_WITH_TIMESTAMP',
        responsibleRole: 'UNDERWRITER',
        escalationBehavior: 'BLOCK_DISBURSEMENT_INITIATION',
        effectiveDate: now,
      },
      {
        id: 'RULE-DIRECT-DISB-03',
        tenantId: '*',
        name: 'Direct Borrower Account Disbursement (No Intermediaries)',
        description: 'Enforces disbursement directly to the validated bank account of the borrower; third-party pass-through prohibited.',
        category: 'DISBURSEMENT_CONTROLS',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        evidenceRequirement: 'PENNY_DROP_NAME_MATCHED_ACCOUNT',
        responsibleRole: 'FINANCE_OFFICER',
        escalationBehavior: 'REJECT_DISBURSEMENT_BATCH',
        effectiveDate: now,
      },
      {
        id: 'RULE-UNDERWRITING-SOD-04',
        tenantId: '*',
        name: 'Dual-Signoff Segregation of Duties (> ₹500,000)',
        description: 'High-value loans exceeding ₹500,000 require two distinct staff role approvals (Maker-Checker / Committee signoff).',
        category: 'AUDIT_SOD',
        severity: 'HIGH',
        status: 'ACTIVE',
        evidenceRequirement: 'TWO_DISTINCT_OFFICER_SIGNATURES',
        responsibleRole: 'BRANCH_MANAGER',
        escalationBehavior: 'ROUTE_TO_CREDIT_COMMITTEE',
        effectiveDate: now,
        parameters: { thresholdAmount: 500000 },
      },
      {
        id: 'RULE-DOC-PROOF-07',
        tenantId: '*',
        name: 'Mandatory Income Proof & Bank Statement (> ₹100,000)',
        description: 'Unsecured credit exceeding ₹100,000 requires verified 3-month bank statement or verified salary slips.',
        category: 'DOCUMENTATION',
        severity: 'HIGH',
        status: 'ACTIVE',
        evidenceRequirement: 'VERIFIED_BANK_STATEMENT_AA_OR_PDF',
        responsibleRole: 'CREDIT_ANALYST',
        escalationBehavior: 'FLAG_INCOMPLETE_EVIDENCE',
        effectiveDate: now,
        parameters: { thresholdAmount: 100000 },
      },
      {
        id: 'RULE-COLLECTION-HOURS-06',
        tenantId: '*',
        name: 'Fair Practice Code: Repayment Communications Restricted to 08:00–19:00',
        description: 'Collections contacts and reminders must strictly occur between 08:00 and 19:00 IST.',
        category: 'COLLECTIONS_FAIR_PRACTICE',
        severity: 'HIGH',
        status: 'ACTIVE',
        evidenceRequirement: 'COMMUNICATION_TIMESTAMP_LOG',
        responsibleRole: 'COLLECTION_OFFICER',
        escalationBehavior: 'BLOCK_OUTBOUND_DISPATCH',
        effectiveDate: now,
      },
    ];

    for (const rule of initialRules) {
      this.rules.set(rule.id, rule);
    }
  }

  // --- 1. RULE REGISTRY ---

  public listRules(tenantId: string): ComplianceRule[] {
    return Array.from(this.rules.values()).filter((r) => r.tenantId === '*' || r.tenantId === tenantId);
  }

  public async upsertRule(
    tenantId: string,
    ruleDto: Omit<ComplianceRule, 'id' | 'effectiveDate' | 'tenantId'> & { id?: string; tenantId?: string },
    actor: { id: string; email: string; roles: string[] }
  ): Promise<ComplianceRule> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Borrowers cannot manage compliance rules.');
    }

    const ruleId = ruleDto.id || `RULE-CUSTOM-${uuid().slice(0, 6).toUpperCase()}`;
    const now = new Date().toISOString();

    const rule: ComplianceRule = {
      ...ruleDto,
      id: ruleId,
      tenantId: ruleDto.tenantId || tenantId,
      effectiveDate: now,
    };

    this.rules.set(ruleId, rule);

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      role: actor.roles[0],
      action: 'COMPLIANCE_RULE_UPSERTED',
      entity: 'ComplianceRule',
      entityId: ruleId,
      newValue: { ...rule, updatedBy: actor.email },
    }).catch(() => {});

    return rule;
  }

  // --- 2. DETERMINISTIC COMPLIANCE EVALUATION ENGINE ---

  public async evaluateApplicationCompliance(
    tenantId: string,
    application: {
      id: string;
      requestedAmount: number;
      kycVerified?: boolean;
      panVerified?: boolean;
      kfsConsented?: boolean;
      bankAccountValidated?: boolean;
      hasIncomeDocuments?: boolean;
      approvalsCount?: number;
      distinctApproverRoles?: string[];
    }
  ): Promise<ComplianceEvaluationResult> {
    const activeRules = this.listRules(tenantId).filter((r) => r.status === 'ACTIVE');
    const evaluations: RuleEvaluationDetail[] = [];
    const exceptionsCreated: string[] = [];

    let passedCount = 0;
    let failedCount = 0;

    for (const rule of activeRules) {
      let isCompliant = true;
      let finding = 'Rule criteria satisfied.';
      const evidenceRefs = [
        { type: 'APPLICATION', id: application.id, description: `Application evaluated against ${rule.id}` },
      ];

      switch (rule.id) {
        case 'RULE-KYC-PAN-01':
          if (!application.panVerified || !application.kycVerified) {
            isCompliant = false;
            finding = 'PAN or KYC verification incomplete. Authoritative identity match required prior to sanction.';
          }
          break;

        case 'RULE-KFS-CONSENT-02':
          if (!application.kfsConsented) {
            isCompliant = false;
            finding = 'Key Fact Statement (KFS) digital consent not recorded from borrower.';
          }
          break;

        case 'RULE-DIRECT-DISB-03':
          if (application.bankAccountValidated === false) {
            isCompliant = false;
            finding = 'Borrower bank account penny-drop / name-match validation not confirmed.';
          }
          break;

        case 'RULE-UNDERWRITING-SOD-04':
          const threshold = rule.parameters?.thresholdAmount || 500000;
          if (application.requestedAmount >= threshold) {
            const approvers = application.distinctApproverRoles || [];
            if (approvers.length < 2) {
              isCompliant = false;
              finding = `High-value credit of ₹${application.requestedAmount.toLocaleString()} requires 2 distinct staff role signoffs (Maker-Checker / Committee). Currently has ${approvers.length}.`;
            }
          }
          break;

        case 'RULE-DOC-PROOF-07':
          const docThreshold = rule.parameters?.thresholdAmount || 100000;
          if (application.requestedAmount >= docThreshold && !application.hasIncomeDocuments) {
            isCompliant = false;
            finding = `Credit amount ₹${application.requestedAmount.toLocaleString()} requires verified bank statement or income proof documents.`;
          }
          break;

        default:
          isCompliant = true;
          break;
      }

      const status: ComplianceStatus = isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT';

      evaluations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        severity: rule.severity,
        status,
        finding,
        evidenceReferences: evidenceRefs as any,
      });

      if (isCompliant) {
        passedCount += 1;
      } else {
        failedCount += 1;
        // Raise tracked exception
        const exception = this.createException({
          tenantId,
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          entityType: 'APPLICATION',
          entityId: application.id,
          finding,
          evidenceReferences: evidenceRefs as any,
          assignedToRole: rule.responsibleRole,
        });
        exceptionsCreated.push(exception.id);
      }
    }

    const evaluatedRulesCount = evaluations.length;
    const complianceScore = evaluatedRulesCount > 0 ? Math.round((passedCount / evaluatedRulesCount) * 100) : 100;

    const overallStatus: ComplianceStatus =
      complianceScore === 100 ? 'COMPLIANT' : complianceScore >= 70 ? 'PARTIALLY_COMPLIANT' : 'NON_COMPLIANT';

    const result: ComplianceEvaluationResult = {
      tenantId,
      entityType: 'APPLICATION',
      entityId: application.id,
      overallStatus,
      complianceScore,
      evaluatedRulesCount,
      passedRulesCount: passedCount,
      failedRulesCount: failedCount,
      evaluations,
      exceptionsCreated,
      evaluatedAt: new Date().toISOString(),
    };

    return result;
  }

  // --- 3. EXCEPTION LIFECYCLE MANAGEMENT ---

  private createException(dto: {
    tenantId: string;
    ruleId: string;
    ruleName: string;
    category: ComplianceCategory;
    severity: ComplianceSeverity;
    entityType: 'CUSTOMER' | 'APPLICATION' | 'LOAN' | 'DISBURSEMENT' | 'COLLECTION';
    entityId: string;
    finding: string;
    evidenceReferences: any[];
    assignedToRole: string;
  }): ComplianceException {
    const id = `cmp-exc-${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();

    const exception: ComplianceException = {
      id,
      tenantId: dto.tenantId,
      ruleId: dto.ruleId,
      ruleName: dto.ruleName,
      category: dto.category,
      severity: dto.severity,
      status: 'OPEN',
      entityType: dto.entityType,
      entityId: dto.entityId,
      finding: dto.finding,
      evidenceReferences: dto.evidenceReferences,
      assignedToRole: dto.assignedToRole,
      createdAt: now,
      updatedAt: now,
    };

    this.exceptions.set(id, exception);
    return exception;
  }

  public listExceptions(tenantId: string, filter?: { status?: ComplianceExceptionStatus; category?: ComplianceCategory }): ComplianceException[] {
    return Array.from(this.exceptions.values()).filter((e) => {
      if (tenantId !== '*' && e.tenantId !== tenantId) return false;
      if (filter?.status && e.status !== filter.status) return false;
      if (filter?.category && e.category !== filter.category) return false;
      return true;
    });
  }

  public getException(exceptionId: string): ComplianceException | undefined {
    return this.exceptions.get(exceptionId);
  }

  public async transitionException(
    exceptionId: string,
    targetStatus: ComplianceExceptionStatus,
    actor: { id: string; email: string; roles: string[] },
    details?: { remediationPlan?: string; remediationNotes?: string }
  ): Promise<ComplianceException> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Borrowers cannot manage compliance exceptions.');
    }

    const exception = this.exceptions.get(exceptionId);
    if (!exception) {
      throw new NotFoundError(`Compliance exception '${exceptionId}' not found.`);
    }

    // Allowed transition lifecycle:
    // OPEN -> ACKNOWLEDGED -> UNDER_REVIEW -> REMEDIATION_REQUIRED -> RESOLVED -> CLOSED
    const validTransitions: Record<ComplianceExceptionStatus, ComplianceExceptionStatus[]> = {
      OPEN: ['ACKNOWLEDGED', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
      ACKNOWLEDGED: ['UNDER_REVIEW', 'REMEDIATION_REQUIRED', 'RESOLVED', 'CLOSED'],
      UNDER_REVIEW: ['REMEDIATION_REQUIRED', 'RESOLVED', 'CLOSED'],
      REMEDIATION_REQUIRED: ['UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
      RESOLVED: ['CLOSED', 'UNDER_REVIEW'], // Can be reopened by auditor
      CLOSED: ['UNDER_REVIEW'],
    };

    if (!validTransitions[exception.status].includes(targetStatus)) {
      throw new BadRequestError(`Invalid transition from '${exception.status}' to '${targetStatus}'.`);
    }

    const now = new Date().toISOString();
    const prevStatus = exception.status;

    exception.status = targetStatus;
    exception.updatedAt = now;

    if (details?.remediationPlan) exception.remediationPlan = details.remediationPlan;
    if (details?.remediationNotes) exception.remediationNotes = details.remediationNotes;

    if (targetStatus === 'RESOLVED' || targetStatus === 'CLOSED') {
      exception.resolvedAt = now;
      exception.resolvedBy = actor.email;
    }

    await logAudit({
      userId: actor.id?.startsWith('usr-') ? actor.id : undefined,
      role: actor.roles[0],
      action: 'COMPLIANCE_EXCEPTION_TRANSITIONED',
      entity: 'ComplianceException',
      entityId: exceptionId,
      previousValue: { status: prevStatus },
      newValue: {
        status: targetStatus,
        remediationPlan: exception.remediationPlan,
        resolvedBy: exception.resolvedBy,
        actorEmail: actor.email,
      },
    }).catch(() => {});

    return exception;
  }

  // --- 4. COMPLIANCE DASHBOARD & OVERVIEW ---

  public getComplianceOverview(tenantId: string): ComplianceOverview {
    const rules = this.listRules(tenantId).filter((r) => r.status === 'ACTIVE');
    const exceptions = this.listExceptions(tenantId);

    const openExceptions = exceptions.filter((e) => e.status !== 'RESOLVED' && e.status !== 'CLOSED');
    const criticalExceptions = openExceptions.filter((e) => e.severity === 'CRITICAL');

    const totalRules = rules.length;
    const failedRuleIds = new Set(openExceptions.map((e) => e.ruleId));
    const passedRulesCount = Math.max(0, totalRules - failedRuleIds.size);

    const complianceScore = totalRules > 0 ? Math.round((passedRulesCount / totalRules) * 100) : 100;
    const overallStatus: ComplianceStatus =
      complianceScore === 100 ? 'COMPLIANT' : complianceScore >= 70 ? 'PARTIALLY_COMPLIANT' : 'NON_COMPLIANT';

    // Category Breakdown
    const categoryScores: any = {};
    const categories: ComplianceCategory[] = [
      'KYC_AML',
      'DOCUMENTATION',
      'CONSENT_DISCLOSURE',
      'UNDERWRITING_EVIDENCE',
      'DISBURSEMENT_CONTROLS',
      'COLLECTIONS_FAIR_PRACTICE',
      'DATA_PRIVACY_RETENTION',
      'AUDIT_SOD',
    ];

    for (const cat of categories) {
      const catRules = rules.filter((r) => r.category === cat);
      const catExceptions = openExceptions.filter((e) => e.category === cat);
      const catPassed = Math.max(0, catRules.length - catExceptions.length);
      const catScore = catRules.length > 0 ? Math.round((catPassed / catRules.length) * 100) : 100;

      categoryScores[cat] = {
        score: catScore,
        status: catScore === 100 ? 'COMPLIANT' : catScore >= 70 ? 'PARTIALLY_COMPLIANT' : 'NON_COMPLIANT',
        activeExceptions: catExceptions.length,
      };
    }

    return {
      tenantId,
      complianceScore,
      overallStatus,
      activeRulesCount: rules.length,
      openExceptionsCount: openExceptions.length,
      criticalExceptionsCount: criticalExceptions.length,
      overdueRemediationCount: 0,
      categoryScores,
      recentExceptions: exceptions.slice(0, 10),
      lastEvaluatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public clearForTesting(): void {
    this.exceptions.clear();
    this.rules.clear();
    this.seedDefaultInstitutionalRules();
  }
}

export const complianceService = ComplianceService.getInstance();
