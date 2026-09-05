import { v4 as uuid } from 'uuid';
import {
  PermissionCategory,
  PermissionCode,
  PermissionDefinition,
  CustomRole,
  CreateCustomRoleDto,
  UpdateRoleDto,
  SodRule,
  SodConflictCheckResult,
  ResourceScope,
} from './permission.types';
import { AuthUser } from '../../middleware/auth';
import { evidenceAuditService } from '../audit/evidence.service';
import { logAudit } from '../audit/audit.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';

export class RolePermissionService {
  private static instance: RolePermissionService;

  // Granular Permission Catalog
  private readonly permissions: PermissionDefinition[] = [
    // Applications
    { code: 'APPLICATIONS_CREATE', category: 'APPLICATIONS', name: 'Create Loan Application', description: 'Initiate and submit new borrower loan applications', riskLevel: 'LOW' },
    { code: 'APPLICATIONS_VIEW', category: 'APPLICATIONS', name: 'View Loan Applications', description: 'Read loan applications within authorized branch/tenant scope', riskLevel: 'LOW' },
    { code: 'APPLICATIONS_ASSIGN', category: 'APPLICATIONS', name: 'Assign Loan Application', description: 'Assign application to underwriters or field officers', riskLevel: 'MEDIUM' },
    { code: 'APPLICATIONS_REVIEW', category: 'APPLICATIONS', name: 'Review Application Data', description: 'Analyze applicant financials, bureau, and fraud signals', riskLevel: 'MEDIUM' },
    { code: 'APPLICATIONS_APPROVE', category: 'APPLICATIONS', name: 'Sanction Loan Application', description: 'Issue final credit sanction within sign-off limits', riskLevel: 'HIGH' },
    { code: 'APPLICATIONS_REJECT', category: 'APPLICATIONS', name: 'Reject Application', description: 'Formally reject application with adverse action notice', riskLevel: 'MEDIUM' },

    // Underwriting
    { code: 'UNDERWRITING_VIEW_BUREAU', category: 'UNDERWRITING', name: 'Pull & View Credit Bureau', description: 'View CIBIL/Experian reports and score factors', riskLevel: 'MEDIUM' },
    { code: 'UNDERWRITING_RUN_AI_ASSIST', category: 'UNDERWRITING', name: 'Run AI Underwriting Copilot', description: 'Invoke advisory AI underwriting synthesis', riskLevel: 'LOW' },
    { code: 'UNDERWRITING_APPROVE_EXCEPTION', category: 'UNDERWRITING', name: 'Approve Policy Exception', description: 'Authorize FOIR or risk score exception deviations', riskLevel: 'HIGH' },
    { code: 'UNDERWRITING_COMMITTEE_VOTE', category: 'UNDERWRITING', name: 'Credit Committee Vote', description: 'Cast vote in high-value loan approval committees', riskLevel: 'HIGH' },

    // Disbursements
    { code: 'DISBURSEMENTS_INITIATE_PAYOUT', category: 'DISBURSEMENTS', name: 'Initiate Payout Batch (Maker)', description: 'Create disbursement payment order to bank account', riskLevel: 'HIGH' },
    { code: 'DISBURSEMENTS_APPROVE_MAKER_CHECKER', category: 'DISBURSEMENTS', name: 'Approve Payout Batch (Checker)', description: 'Secondary authorization of disbursement batches', riskLevel: 'CRITICAL' },
    { code: 'DISBURSEMENTS_EXECUTE_TRANSFER', category: 'DISBURSEMENTS', name: 'Execute Fund Transfer Gateway', description: 'Trigger live IMPS/NEFT fund transfer via Cashfree/RazorpayX', riskLevel: 'CRITICAL' },
    { code: 'DISBURSEMENTS_RECONCILE', category: 'DISBURSEMENTS', name: 'Reconcile Bank Payouts', description: 'Match settlement statements against ledger balances', riskLevel: 'MEDIUM' },

    // Collections
    { code: 'COLLECTIONS_VIEW_DPD', category: 'COLLECTIONS', name: 'View Overdue & DPD Portfolios', description: 'Monitor delinquency aging and default queues', riskLevel: 'LOW' },
    { code: 'COLLECTIONS_RECORD_PTP', category: 'COLLECTIONS', name: 'Record Promise-to-Pay', description: 'Log borrower repayment commitments and interaction notes', riskLevel: 'LOW' },
    { code: 'COLLECTIONS_INITIATE_RECOVERY', category: 'COLLECTIONS', name: 'Initiate Legal / Field Recovery', description: 'Trigger legal notices and assign field recovery agents', riskLevel: 'MEDIUM' },
    { code: 'COLLECTIONS_WAIVE_PENALTY', category: 'COLLECTIONS', name: 'Waive Overdue Charges & Penalty', description: 'Authorize penalty interest fee waivers', riskLevel: 'HIGH' },
    { code: 'COLLECTIONS_SETTLE_LOAN', category: 'COLLECTIONS', name: 'Authorize One-Time Settlement (OTS)', description: 'Execute principal write-off and debt settlement agreements', riskLevel: 'CRITICAL' },

    // Configuration
    { code: 'CONFIGURATION_VIEW_POLICIES', category: 'CONFIGURATION', name: 'View Lending Policies', description: 'Read active FOIR, interest, and credit policies', riskLevel: 'LOW' },
    { code: 'CONFIGURATION_DRAFT_POLICY', category: 'CONFIGURATION', name: 'Draft Lending Policy', description: 'Create draft policy versions without activating', riskLevel: 'MEDIUM' },
    { code: 'CONFIGURATION_PUBLISH_POLICY', category: 'CONFIGURATION', name: 'Publish Institutional Policy', description: 'Activate new underwriting parameters across institution', riskLevel: 'HIGH' },
    { code: 'CONFIGURATION_CONFIGURE_INTEGRATIONS', category: 'CONFIGURATION', name: 'Configure Integration Gateways', description: 'Update API keys, endpoints, and failover routes', riskLevel: 'HIGH' },

    // Privacy & Audit
    { code: 'PRIVACY_VIEW_CONSENT_REGISTRY', category: 'PRIVACY_AUDIT', name: 'View Statutory Consent Registry', description: 'Inspect borrower DPDP consent artifacts and versions', riskLevel: 'LOW' },
    { code: 'AUDIT_EXPORT_EVIDENCE_PACKAGE', category: 'PRIVACY_AUDIT', name: 'Export Institutional Evidence Package', description: 'Download chronological execution logs and audit packages', riskLevel: 'HIGH' },
    { code: 'AUDIT_VERIFY_CHAIN', category: 'PRIVACY_AUDIT', name: 'Verify Cryptographic Audit Chain', description: 'Execute continuous SHA-256 ledger tamper verification', riskLevel: 'LOW' },
    { code: 'PRIVACY_PURGE_PII', category: 'PRIVACY_AUDIT', name: 'Execute Statutory PII Erasure', description: 'Execute right to be forgotten under DPDP statutory rules', riskLevel: 'CRITICAL' },

    // Tenant Administration
    { code: 'TENANT_MANAGE_USERS', category: 'TENANT_ADMIN', name: 'Manage Staff Users', description: 'Create, update, and deactivate lender employee accounts', riskLevel: 'HIGH' },
    { code: 'TENANT_ASSIGN_ROLES', category: 'TENANT_ADMIN', name: 'Assign User Roles', description: 'Grant custom roles and scopes to employees', riskLevel: 'HIGH' },
    { code: 'TENANT_VIEW_OPERATIONS_CENTER', category: 'TENANT_ADMIN', name: 'View Tenant Operations Center', description: 'Access enterprise portfolio health and quotas', riskLevel: 'MEDIUM' },
    { code: 'TENANT_CONFIGURE_BRANDING', category: 'TENANT_ADMIN', name: 'Configure White-Label Portal', description: 'Update institution logo, brand colors, and portal domain', riskLevel: 'MEDIUM' },
  ];

  // Banking Segregation of Duties (SoD) Rules
  private readonly sodRules: SodRule[] = [
    {
      id: 'sod-01',
      code: 'SOD_MAKER_CHECKER_PAYOUT',
      name: 'Disbursement Maker-Checker Separation',
      description: 'A single user cannot both initiate a payout batch and approve/sign off on that batch.',
      conflictingPermissions: ['DISBURSEMENTS_INITIATE_PAYOUT', 'DISBURSEMENTS_APPROVE_MAKER_CHECKER'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-02',
      code: 'SOD_SANCTION_DISBURSER',
      name: 'Credit Sanction vs Fund Execution Separation',
      description: 'Underwriters who approve loan sanctions cannot directly execute gateway fund transfers.',
      conflictingPermissions: ['APPLICATIONS_APPROVE', 'DISBURSEMENTS_EXECUTE_TRANSFER'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-03',
      code: 'SOD_AUDITOR_POLICY_MAKER',
      name: 'Independent Auditor vs Policy Publisher Separation',
      description: 'Internal and external compliance auditors cannot publish credit policies.',
      conflictingPermissions: ['AUDIT_EXPORT_EVIDENCE_PACKAGE', 'CONFIGURATION_PUBLISH_POLICY'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-04',
      code: 'SOD_AUDITOR_DISBURSER',
      name: 'Independent Auditor vs Payout Operator Separation',
      description: 'Auditors verifying the cryptographic audit chain cannot originate disbursements.',
      conflictingPermissions: ['AUDIT_VERIFY_CHAIN', 'DISBURSEMENTS_INITIATE_PAYOUT'],
      severity: 'CRITICAL_BLOCK',
    },
    {
      id: 'sod-05',
      code: 'SOD_UNDERWRITER_SETTLEMENT',
      name: 'Underwriter vs Loan Debt Settlement Separation',
      description: 'Credit sanctioning underwriters cannot author one-time loan debt settlements (OTS).',
      conflictingPermissions: ['APPLICATIONS_APPROVE', 'COLLECTIONS_SETTLE_LOAN'],
      severity: 'CRITICAL_BLOCK',
    },
  ];

  // In-memory tenant role registry: Map<`${tenantId}:${roleCode}`, CustomRole>
  private readonly roles = new Map<string, CustomRole>();

  private constructor() {
    this.seedSystemRoles('tenant-adyapan-default');
    this.seedSystemRoles('tenant-apex-nbfc');
  }

  public static getInstance(): RolePermissionService {
    if (!RolePermissionService.instance) {
      RolePermissionService.instance = new RolePermissionService();
    }
    return RolePermissionService.instance;
  }

  public seedSystemRoles(tenantId: string): void {
    const now = new Date().toISOString();

    const allPerms = this.permissions.map((p) => p.code);

    const systemRoleTemplates: Array<{
      code: string;
      name: string;
      description: string;
      permissions: PermissionCode[];
      scope: ResourceScope;
      sanctionLimit?: number;
      payoutLimit?: number;
    }> = [
      {
        code: 'SUPER_ADMIN',
        name: 'Platform Super Administrator',
        description: 'Unrestricted system governance and institutional administration',
        permissions: allPerms,
        scope: 'GLOBAL',
        sanctionLimit: 100000000,
        payoutLimit: 100000000,
      },
      {
        code: 'ADMIN',
        name: 'Institutional Administrator',
        description: 'Tenant management, user provisioning, policy and integration management',
        permissions: [
          'APPLICATIONS_VIEW',
          'APPLICATIONS_ASSIGN',
          'CONFIGURATION_VIEW_POLICIES',
          'CONFIGURATION_DRAFT_POLICY',
          'CONFIGURATION_PUBLISH_POLICY',
          'CONFIGURATION_CONFIGURE_INTEGRATIONS',
          'PRIVACY_VIEW_CONSENT_REGISTRY',
          'AUDIT_VERIFY_CHAIN',
          'TENANT_MANAGE_USERS',
          'TENANT_ASSIGN_ROLES',
          'TENANT_VIEW_OPERATIONS_CENTER',
          'TENANT_CONFIGURE_BRANDING',
        ],
        scope: 'TENANT',
        sanctionLimit: 50000000,
        payoutLimit: 50000000,
      },
      {
        code: 'BRANCH_MANAGER',
        name: 'Branch Manager',
        description: 'Branch-level operational oversight, staff management, and pipeline orchestration',
        permissions: [
          'APPLICATIONS_CREATE',
          'APPLICATIONS_VIEW',
          'APPLICATIONS_ASSIGN',
          'APPLICATIONS_REVIEW',
          'CONFIGURATION_VIEW_POLICIES',
          'CONFIGURATION_DRAFT_POLICY',
          'PRIVACY_VIEW_CONSENT_REGISTRY',
          'TENANT_VIEW_OPERATIONS_CENTER',
        ],
        scope: 'BRANCH',
        sanctionLimit: 2500000,
        payoutLimit: 2500000,
      },
      {
        code: 'CREDIT_ANALYST',
        name: 'Credit & Risk Analyst',
        description: 'Financial statement analysis, bureau review, and initial risk assessment',
        permissions: [
          'APPLICATIONS_VIEW',
          'APPLICATIONS_REVIEW',
          'UNDERWRITING_VIEW_BUREAU',
          'UNDERWRITING_RUN_AI_ASSIST',
          'CONFIGURATION_VIEW_POLICIES',
          'PRIVACY_VIEW_CONSENT_REGISTRY',
        ],
        scope: 'BRANCH',
        sanctionLimit: 1000000,
      },
      {
        code: 'UNDERWRITER',
        name: 'Credit Underwriter',
        description: 'Credit assessment, bureau analysis, and loan application sanctioning',
        permissions: [
          'APPLICATIONS_VIEW',
          'APPLICATIONS_REVIEW',
          'APPLICATIONS_APPROVE',
          'APPLICATIONS_REJECT',
          'UNDERWRITING_VIEW_BUREAU',
          'UNDERWRITING_RUN_AI_ASSIST',
          'UNDERWRITING_APPROVE_EXCEPTION',
          'UNDERWRITING_COMMITTEE_VOTE',
          'CONFIGURATION_VIEW_POLICIES',
          'PRIVACY_VIEW_CONSENT_REGISTRY',
        ],
        scope: 'BRANCH',
        sanctionLimit: 5000000, // ₹50 Lakh single officer sanction limit
      },
      {
        code: 'FINANCE_OFFICER',
        name: 'Finance & Accounts Officer',
        description: 'Payment batch processing, disbursements, reconciliation, and accounting',
        permissions: [
          'APPLICATIONS_VIEW',
          'DISBURSEMENTS_INITIATE_PAYOUT',
          'DISBURSEMENTS_RECONCILE',
          'PRIVACY_VIEW_CONSENT_REGISTRY',
        ],
        scope: 'BRANCH',
        payoutLimit: 10000000,
      },
      {
        code: 'DISBURSEMENT_OFFICER',
        name: 'Disbursement Maker Officer',
        description: 'Prepares loan payout batches and initiates bank disbursements',
        permissions: [
          'APPLICATIONS_VIEW',
          'DISBURSEMENTS_INITIATE_PAYOUT',
          'DISBURSEMENTS_RECONCILE',
          'PRIVACY_VIEW_CONSENT_REGISTRY',
        ],
        scope: 'BRANCH',
        payoutLimit: 5000000,
      },
      {
        code: 'FINANCE_CONTROLLER',
        name: 'Finance Checker & Gateway Officer',
        description: 'Authorizes maker disbursement batches and triggers payment gateway transfers',
        permissions: [
          'APPLICATIONS_VIEW',
          'DISBURSEMENTS_APPROVE_MAKER_CHECKER',
          'DISBURSEMENTS_EXECUTE_TRANSFER',
          'DISBURSEMENTS_RECONCILE',
        ],
        scope: 'TENANT',
        payoutLimit: 50000000,
      },
      {
        code: 'COLLECTION_OFFICER',
        name: 'Collections Officer',
        description: 'Branch collections portfolio oversight, delinquent borrower engagement, and PTP logging',
        permissions: [
          'APPLICATIONS_VIEW',
          'COLLECTIONS_VIEW_DPD',
          'COLLECTIONS_RECORD_PTP',
          'COLLECTIONS_INITIATE_RECOVERY',
          'COLLECTIONS_WAIVE_PENALTY',
        ],
        scope: 'BRANCH',
      },
      {
        code: 'COLLECTION_AGENT',
        name: 'Collections & Recovery Agent',
        description: 'Manages overdue accounts, records promises to pay, and initiates recovery actions',
        permissions: [
          'APPLICATIONS_VIEW',
          'COLLECTIONS_VIEW_DPD',
          'COLLECTIONS_RECORD_PTP',
          'COLLECTIONS_INITIATE_RECOVERY',
          'COLLECTIONS_WAIVE_PENALTY',
        ],
        scope: 'REGION',
      },
      {
        code: 'AUDITOR',
        name: 'Compliance & Regulatory Auditor',
        description: 'Read-only evidence auditing, consent verification, and hash ledger checks',
        permissions: [
          'APPLICATIONS_VIEW',
          'CONFIGURATION_VIEW_POLICIES',
          'PRIVACY_VIEW_CONSENT_REGISTRY',
          'AUDIT_EXPORT_EVIDENCE_PACKAGE',
          'AUDIT_VERIFY_CHAIN',
        ],
        scope: 'TENANT',
      },
      {
        code: 'LOAN_OFFICER',
        name: 'Field Loan Sourcing Officer',
        description: 'Sources applications, submits borrower KYC documents, and tracks status',
        permissions: [
          'APPLICATIONS_CREATE',
          'APPLICATIONS_VIEW',
          'PRIVACY_VIEW_CONSENT_REGISTRY',
        ],
        scope: 'BRANCH',
      },
      {
        code: 'CUSTOMER',
        name: 'Borrower',
        description: 'Self-service loan application submission, eKYC, and EMI payment',
        permissions: [
          'APPLICATIONS_CREATE',
          'APPLICATIONS_VIEW',
        ],
        scope: 'GLOBAL',
      },
    ];

    for (const tpl of systemRoleTemplates) {
      const key = `${tenantId}:${tpl.code}`;
      this.roles.set(key, {
        id: `role-${tpl.code.toLowerCase()}-${tenantId.replace('tenant-', '')}`,
        tenantId,
        code: tpl.code,
        name: tpl.name,
        description: tpl.description,
        isSystemRole: true,
        permissions: tpl.permissions,
        scope: tpl.scope,
        sanctionLimitAmount: tpl.sanctionLimit,
        payoutLimitAmount: tpl.payoutLimit,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // --- 1. PERMISSION CATALOG & SOD MATRIX ---

  public getPermissionCatalog(): PermissionDefinition[] {
    return [...this.permissions];
  }

  public getSodRules(): SodRule[] {
    return [...this.sodRules];
  }

  public checkSodConflicts(permissions: PermissionCode[]): SodConflictCheckResult {
    const conflicts: Array<{
      ruleCode: string;
      ruleName: string;
      description: string;
      conflictingPair: [PermissionCode, PermissionCode];
      severity: 'CRITICAL_BLOCK' | 'WARNING';
    }> = [];

    const permSet = new Set(permissions);

    for (const rule of this.sodRules) {
      const [p1, p2] = rule.conflictingPermissions;
      if (permSet.has(p1) && permSet.has(p2)) {
        conflicts.push({
          ruleCode: rule.code,
          ruleName: rule.name,
          description: rule.description,
          conflictingPair: rule.conflictingPermissions,
          severity: rule.severity,
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      hasCriticalBlock: conflicts.some((c) => c.severity === 'CRITICAL_BLOCK'),
      conflicts,
    };
  }

  // --- 2. CUSTOM ROLE BUILDER & HIERARCHY ---

  public listRoles(tenantId: string): CustomRole[] {
    const result: CustomRole[] = [];
    for (const role of this.roles.values()) {
      if (role.tenantId === tenantId) {
        result.push(role);
      }
    }
    return result;
  }

  public getRole(tenantId: string, roleCode: string): CustomRole {
    const key = `${tenantId}:${roleCode.toUpperCase()}`;
    const role = this.roles.get(key);
    if (!role) {
      throw new NotFoundError(`Role '${roleCode}' not found for tenant '${tenantId}'.`);
    }
    return role;
  }

  public async createCustomRole(
    tenantId: string,
    dto: CreateCustomRoleDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<CustomRole> {
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN')) {
      throw new ForbiddenError('Access forbidden: Only Administrators can create custom roles.');
    }

    const cleanCode = dto.code.toUpperCase().replace(/\s+/g, '_');
    const key = `${tenantId}:${cleanCode}`;

    if (this.roles.has(key)) {
      throw new BadRequestError(`Role '${cleanCode}' already exists for this institution.`);
    }

    // Resolve inherited permissions from parent role if specified
    let finalPermissions = [...dto.permissions];
    if (dto.parentRoleCode) {
      const parentRole = this.getRole(tenantId, dto.parentRoleCode);
      finalPermissions = Array.from(new Set([...parentRole.permissions, ...finalPermissions]));
    }

    // Check Segregation of Duties conflicts
    const sodCheck = this.checkSodConflicts(finalPermissions);
    if (sodCheck.hasCriticalBlock && !dto.allowSodOverride) {
      const conflictNames = sodCheck.conflicts.map((c) => c.ruleName).join(', ');
      throw new BadRequestError(
        `Segregation of Duties (SoD) Conflict Detected: [${conflictNames}]. Banking regulations prohibit combining these permissions in a single role without dual Super Admin authorization.`
      );
    }

    const now = new Date().toISOString();
    const newRole: CustomRole = {
      id: `role-custom-${uuid().slice(0, 8)}`,
      tenantId,
      code: cleanCode,
      name: dto.name.trim(),
      description: dto.description.trim(),
      isSystemRole: false,
      parentRoleCode: dto.parentRoleCode,
      permissions: finalPermissions,
      scope: dto.scope || 'BRANCH',
      sanctionLimitAmount: dto.sanctionLimitAmount,
      payoutLimitAmount: dto.payoutLimitAmount,
      createdAt: now,
      updatedAt: now,
    };

    this.roles.set(key, newRole);

    // Record SHA-256 evidence node
    evidenceAuditService.recordEvidenceNode({
      tenantId,
      eventType: 'PERMISSION_CHANGE',
      actorId: actor.id,
      actorRole: actor.roles[0],
      actorEmail: actor.email,
      entityType: 'CUSTOM_ROLE',
      entityId: newRole.id,
      action: 'CUSTOM_ROLE_CREATED',
      correlationId: `corr-role-${newRole.id}`,
      beforeState: {},
      afterState: {
        code: cleanCode,
        name: newRole.name,
        permissionsCount: finalPermissions.length,
        sodOverride: Boolean(dto.allowSodOverride),
      },
      timestamp: now,
    });

    logAudit({
      userId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(actor.id) ? actor.id : undefined,
      role: actor.roles[0],
      action: 'CUSTOM_ROLE_CREATED',
      entity: 'CustomRole',
      entityId: newRole.id,
      newValue: { code: cleanCode, permissions: finalPermissions },
    }).catch(() => {});

    return newRole;
  }

  public async updateRole(
    tenantId: string,
    roleId: string,
    dto: UpdateRoleDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<CustomRole> {
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN')) {
      throw new ForbiddenError('Access forbidden: Only Administrators can modify roles.');
    }

    let targetRole: CustomRole | undefined;
    for (const r of this.roles.values()) {
      if (r.id === roleId && r.tenantId === tenantId) {
        targetRole = r;
        break;
      }
    }

    if (!targetRole) {
      throw new NotFoundError(`Role '${roleId}' not found.`);
    }

    if (targetRole.isSystemRole && targetRole.code === 'SUPER_ADMIN') {
      throw new BadRequestError('Cannot modify platform Super Administrator system role.');
    }

    if (dto.permissions) {
      const sodCheck = this.checkSodConflicts(dto.permissions);
      if (sodCheck.hasCriticalBlock) {
        throw new BadRequestError(
          `Segregation of Duties (SoD) Conflict Detected: [${sodCheck.conflicts.map((c) => c.ruleName).join(', ')}].`
        );
      }
      targetRole.permissions = dto.permissions;
    }

    if (dto.name) targetRole.name = dto.name;
    if (dto.description) targetRole.description = dto.description;
    if (dto.scope) targetRole.scope = dto.scope;
    if (dto.sanctionLimitAmount !== undefined) targetRole.sanctionLimitAmount = dto.sanctionLimitAmount;
    if (dto.payoutLimitAmount !== undefined) targetRole.payoutLimitAmount = dto.payoutLimitAmount;
    targetRole.updatedAt = new Date().toISOString();

    return targetRole;
  }

  // --- 3. DYNAMIC RBAC EVALUATION ENGINE ---

  public getEffectivePermissions(userRoles: string[], tenantId: string): PermissionCode[] {
    const effectiveSet = new Set<PermissionCode>();

    for (const roleCode of userRoles) {
      const key = `${tenantId}:${roleCode.toUpperCase()}`;
      let role = this.roles.get(key);

      // Fallback to default tenant if not found in specific tenant
      if (!role) {
        role = this.roles.get(`tenant-adyapan-default:${roleCode.toUpperCase()}`);
      }

      if (role) {
        for (const perm of role.permissions) {
          effectiveSet.add(perm);
        }
      }
    }

    return Array.from(effectiveSet);
  }

  public hasPermission(
    user: AuthUser,
    requiredPermission: PermissionCode,
    options?: { requiredSanctionAmount?: number }
  ): boolean {
    if (user.roles.includes('SUPER_ADMIN')) {
      return true; // Super Admin has universal permission bypass
    }

    const tenantId = user.tenantId || 'tenant-adyapan-default';
    const effectivePermissions = this.getEffectivePermissions(user.roles, tenantId);

    if (!effectivePermissions.includes(requiredPermission)) {
      return false;
    }

    // Check financial sanction limit if required
    if (options?.requiredSanctionAmount !== undefined) {
      let maxSanctionLimit = 0;
      for (const roleCode of user.roles) {
        const key = `${tenantId}:${roleCode.toUpperCase()}`;
        const role = this.roles.get(key) || this.roles.get(`tenant-adyapan-default:${roleCode.toUpperCase()}`);
        if (role?.sanctionLimitAmount && role.sanctionLimitAmount > maxSanctionLimit) {
          maxSanctionLimit = role.sanctionLimitAmount;
        }
      }

      if (maxSanctionLimit < options.requiredSanctionAmount) {
        return false;
      }
    }

    return true;
  }

  public clearForTesting(): void {
    this.roles.clear();
    this.seedSystemRoles('tenant-adyapan-default');
    this.seedSystemRoles('tenant-apex-nbfc');
  }
}

export const rolePermissionService = RolePermissionService.getInstance();
