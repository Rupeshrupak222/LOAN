// Step 29: Regulatory & Compliance Framework Types

export type ComplianceCategory =
  | 'KYC_AML'
  | 'DOCUMENTATION'
  | 'CONSENT_DISCLOSURE'
  | 'UNDERWRITING_EVIDENCE'
  | 'DISBURSEMENT_CONTROLS'
  | 'COLLECTIONS_FAIR_PRACTICE'
  | 'DATA_PRIVACY_RETENTION'
  | 'AUDIT_SOD';

export type ComplianceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ComplianceStatus =
  | 'COMPLIANT'
  | 'NON_COMPLIANT'
  | 'PARTIALLY_COMPLIANT'
  | 'REVIEW_REQUIRED'
  | 'NOT_APPLICABLE'
  | 'UNKNOWN';

export type ComplianceRuleStatus = 'ACTIVE' | 'INACTIVE' | 'DRAFT';

export type ComplianceExceptionStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'UNDER_REVIEW'
  | 'REMEDIATION_REQUIRED'
  | 'RESOLVED'
  | 'CLOSED';

export interface EvidenceReference {
  type: 'CUSTOMER' | 'APPLICATION' | 'DOCUMENT' | 'KYC_RECORD' | 'APPROVAL' | 'PAYMENT' | 'DISBURSEMENT' | 'AUDIT_EVENT' | 'CONFIG_VERSION';
  id: string;
  description?: string;
  refUrl?: string;
}

export interface ComplianceRule {
  id: string;
  tenantId: string; // Tenant specific or '*' for platform default
  name: string;
  description: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  status: ComplianceRuleStatus;
  evidenceRequirement: string;
  responsibleRole: string;
  escalationBehavior: string;
  effectiveDate: string;
  expiryDate?: string;
  parameters?: Record<string, any>;
}

export interface ComplianceException {
  id: string;
  tenantId: string;
  ruleId: string;
  ruleName: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  status: ComplianceExceptionStatus;
  entityType: 'CUSTOMER' | 'APPLICATION' | 'LOAN' | 'DISBURSEMENT' | 'COLLECTION';
  entityId: string;
  finding: string;
  evidenceReferences: EvidenceReference[];
  assignedToRole: string;
  remediationPlan?: string;
  remediationNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RuleEvaluationDetail {
  ruleId: string;
  ruleName: string;
  category: ComplianceCategory;
  severity: ComplianceSeverity;
  status: ComplianceStatus;
  finding: string;
  evidenceReferences: EvidenceReference[];
}

export interface ComplianceEvaluationResult {
  tenantId: string;
  entityType: string;
  entityId: string;
  overallStatus: ComplianceStatus;
  complianceScore: number; // 0 - 100
  evaluatedRulesCount: number;
  passedRulesCount: number;
  failedRulesCount: number;
  evaluations: RuleEvaluationDetail[];
  exceptionsCreated: string[];
  evaluatedAt: string;
}

export interface ComplianceOverview {
  tenantId: string;
  complianceScore: number;
  overallStatus: ComplianceStatus;
  activeRulesCount: number;
  openExceptionsCount: number;
  criticalExceptionsCount: number;
  overdueRemediationCount: number;
  categoryScores: Record<ComplianceCategory, { score: number; status: ComplianceStatus; activeExceptions: number }>;
  recentExceptions: ComplianceException[];
  lastEvaluatedAt: string;
  updatedAt: string;
}
