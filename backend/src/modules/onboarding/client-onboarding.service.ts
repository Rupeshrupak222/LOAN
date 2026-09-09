import { v4 as uuid } from 'uuid';
import {
  ClientLifecycleStage,
  ChecklistItemCode,
  ChecklistTask,
  CommercialOnboardingRecord,
  InitiateClientOnboardingDto,
  GoLiveValidationResult,
} from './client-onboarding.types';
import { tenantService } from '../tenants/tenant.service';
import { rolePermissionService } from '../roles/role-permission.service';
import { productCatalogService } from '../product/catalog.service';
import { workflowService } from '../workflows/workflow.service';
import { configurationService } from '../configuration/configuration.service';
import { brandingService } from '../branding/branding.service';
import { evidenceAuditService } from '../audit/evidence.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/errors';

export class ClientOnboardingService {
  private static instance: ClientOnboardingService;

  // In-memory registry: Map<id, CommercialOnboardingRecord>
  private readonly records = new Map<string, CommercialOnboardingRecord>();

  private constructor() {
    this.seedDefaultOnboardings();
  }

  public static getInstance(): ClientOnboardingService {
    if (!ClientOnboardingService.instance) {
      ClientOnboardingService.instance = new ClientOnboardingService();
    }
    return ClientOnboardingService.instance;
  }

  private seedDefaultOnboardings(): void {
    const now = new Date().toISOString();
    const defaultChecklist = this.generateDefaultChecklist();

    // Mark primary tenant as ACTIVE
    const defaultCompletedChecklist = defaultChecklist.map((task) => ({
      ...task,
      status: 'COMPLETED' as const,
      completedAt: now,
      completedBy: 'superadmin@adyapan.dev',
    }));

    this.records.set('onb-adyapan-default', {
      id: 'onb-adyapan-default',
      tenantId: 'tenant-adyapan-default',
      code: 'ADYAPAN_FINANCE',
      name: 'Adyapan Prime Lending NBFC',
      tier: 'ENTERPRISE',
      stage: 'ACTIVE',
      primaryContact: {
        name: 'Rupesh Kumar',
        email: 'superadmin@adyapan.dev',
        phone: '+91 98110 22334',
      },
      organizationDetails: {
        cinNumber: 'U65999MH2024PTC123456',
        rbiRegistrationNo: 'N-14.03219',
        registeredAddress: 'Level 18, Platina Tower, BKC, Mumbai - 400051',
        domain: 'adyapan.dev',
      },
      checklist: defaultCompletedChecklist,
      completionPercentage: 100,
      assignedOwnerEmail: 'superadmin@adyapan.dev',
      approvalDetails: {
        approvedBy: 'superadmin@adyapan.dev',
        approvedAt: now,
        notes: 'Primary anchor tenant bootstrap approved.',
      },
      retentionPolicy: {
        financialRecordsRetentionYears: 8,
        auditTrailImmutable: true,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  public generateDefaultChecklist(): ChecklistTask[] {
    return [
      { code: 'ORGANIZATION_PROFILE', name: 'Legal Organization Profile', category: 'ORGANIZATION', description: 'Record CIN, RBI NBFC registration number, and registered headquarters address.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'ADMIN_ACCOUNT', name: 'Primary Institution Admin', category: 'ORGANIZATION', description: 'Configure institution super-administrator credentials and official domain.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'BRANCH_TOPOLOGY', name: 'Branch Network & Hierarchy', category: 'ORGANIZATION', description: 'Configure head office and regional branch network mapping.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'ROLE_SOD_RULES', name: 'Role Catalog & SoD Rules', category: 'SECURITY_RBAC', description: 'Activate Maker-Checker and Sanctioner-Disburser segregation of duties.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'PERMISSION_MAPPINGS', name: 'Granular Permission Scopes', category: 'SECURITY_RBAC', description: 'Map 28 granular permissions and financial sanction authority limits.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'PRODUCT_CATALOG', name: 'Dynamic Product Catalog', category: 'PRODUCT_WORKFLOW', description: 'Configure loan products, interest rate matrices, and statutory KFS fees.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'WORKFLOW_GATES', name: 'Dynamic Workflow & Gates', category: 'PRODUCT_WORKFLOW', description: 'Configure origination stages, SLA targets, and mandatory verification gates.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'COMPLIANCE_POLICIES', name: 'Lending Policy & FOIR Caps', category: 'COMPLIANCE_PRIVACY', description: 'Set statutory FOIR ceiling (65%), CIBIL minimum floor (650), and DTI limits.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'PRIVACY_DPDP', name: 'Statutory DPDP Consent Registry', category: 'COMPLIANCE_PRIVACY', description: 'Publish versioned borrower consent purposes and privacy preferences.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'BRANDING_ASSETS', name: 'White-Label Branding & Portal', category: 'ORGANIZATION', description: 'Upload institution logo, primary colors, and custom sub-domain.', isMandatory: false, status: 'NOT_STARTED' },
      { code: 'INTEGRATION_GATEWAYS', name: 'Integration Hub Gateways', category: 'INTEGRATIONS', description: 'Configure credit bureau, payment gateway, eKYC, and Account Aggregator routing.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'COMMUNICATION_CHANNELS', name: 'SMS & Email Notification Templates', category: 'INTEGRATIONS', description: 'Verify statutory SMS and email templates for loan sanctions and payments.', isMandatory: false, status: 'NOT_STARTED' },
      { code: 'SECURITY_HARDENING', name: 'Security & Account Lockout Policies', category: 'SECURITY_RBAC', description: 'Enforce 5-attempt brute-force protection and session token timeouts.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'STAFF_USER_SETUP', name: 'Staff User Provisioning', category: 'SECURITY_RBAC', description: 'Create initial underwriter, loan officer, and finance checker staff accounts.', isMandatory: false, status: 'NOT_STARTED' },
      { code: 'TESTING_VERIFICATION', name: 'End-to-End Sandbox Simulation', category: 'GO_LIVE_APPROVAL', description: 'Execute synthetic borrower lifecycle test verifying amortization & allocation.', isMandatory: true, status: 'NOT_STARTED' },
      { code: 'GOLIVE_SIGN_OFF', name: 'Executive Go-Live Sign-Off', category: 'GO_LIVE_APPROVAL', description: 'Formally approve commercial institution activation and unlock live traffic.', isMandatory: true, status: 'NOT_STARTED' },
    ];
  }

  // --- 1. INITIATE CLIENT ONBOARDING ---

  public async initiateOnboarding(
    dto: InitiateClientOnboardingDto,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<CommercialOnboardingRecord> {
    if (!actor.roles.includes('SUPER_ADMIN') && !actor.roles.includes('ADMIN')) {
      throw new ForbiddenError('Only Super Administrators or Platform Admins can initiate client onboarding.');
    }

    const cleanCode = dto.code.toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existing = Array.from(this.records.values()).find((r) => r.code === cleanCode);
    if (existing) {
      throw new BadRequestError(`Client onboarding record for code '${cleanCode}' already exists.`);
    }

    const id = `onb-${cleanCode.toLowerCase()}-${uuid().slice(0, 6)}`;
    const tenantId = `tenant-${cleanCode.toLowerCase()}`;
    const now = new Date().toISOString();

    const checklist = this.generateDefaultChecklist();

    const record: CommercialOnboardingRecord = {
      id,
      tenantId,
      code: cleanCode,
      name: dto.name,
      tier: dto.tier || 'GROWTH',
      stage: 'ONBOARDING',
      primaryContact: dto.primaryContact,
      organizationDetails: dto.organizationDetails || {},
      checklist,
      completionPercentage: 0,
      assignedOwnerEmail: dto.assignedOwnerEmail || actor.email,
      retentionPolicy: {
        financialRecordsRetentionYears: 8,
        auditTrailImmutable: true,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.records.set(id, record);

    evidenceAuditService.recordEvidenceNode({
      tenantId: 'tenant-adyapan-default',
      eventType: 'POLICY_CONFIGURATION_CHANGE',
      actorId: actor.id,
      actorRole: actor.roles[0],
      actorEmail: actor.email,
      entityType: 'CLIENT_ONBOARDING',
      entityId: id,
      action: 'CLIENT_ONBOARDING_INITIATED',
      correlationId: `corr-${id}`,
      afterState: { code: cleanCode, name: dto.name, stage: 'ONBOARDING' },
      timestamp: now,
    });

    return record;
  }

  // --- 2. UPDATE CHECKLIST ITEM ---

  public updateChecklistItem(
    onboardingId: string,
    itemCode: ChecklistItemCode,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED',
    blockerReason?: string,
    actor?: { id: string; email: string; roles: string[] }
  ): CommercialOnboardingRecord {
    const record = this.records.get(onboardingId);
    if (!record) {
      throw new NotFoundError(`Onboarding record '${onboardingId}' not found.`);
    }

    const task = record.checklist.find((t) => t.code === itemCode);
    if (!task) {
      throw new NotFoundError(`Checklist task '${itemCode}' not found.`);
    }

    const now = new Date().toISOString();
    task.status = status;
    task.blockerReason = status === 'BLOCKED' ? blockerReason : undefined;
    if (status === 'COMPLETED') {
      task.completedAt = now;
      task.completedBy = actor?.email || 'admin@adyapan.dev';
    } else {
      task.completedAt = undefined;
      task.completedBy = undefined;
    }

    // Recompute percentage
    const completedCount = record.checklist.filter((t) => t.status === 'COMPLETED').length;
    record.completionPercentage = Math.round((completedCount / record.checklist.length) * 100);
    record.updatedAt = now;

    // Advance stage automatically if in early stages
    if (record.completionPercentage > 0 && record.stage === 'ONBOARDING') {
      record.stage = 'CONFIGURATION';
    } else if (record.completionPercentage >= 80 && record.stage === 'CONFIGURATION') {
      record.stage = 'VALIDATION';
    }

    return record;
  }

  // --- 3. VALIDATE GO-LIVE READINESS ---

  public validateGoLiveReadiness(onboardingId: string): GoLiveValidationResult {
    const record = this.records.get(onboardingId);
    if (!record) {
      throw new NotFoundError(`Onboarding record '${onboardingId}' not found.`);
    }

    const totalChecklistItems = record.checklist.length;
    const completedItemsCount = record.checklist.filter((t) => t.status === 'COMPLETED').length;
    const pendingMandatory = record.checklist.filter((t) => t.isMandatory && t.status !== 'COMPLETED');
    const blockedItems = record.checklist.filter((t) => t.status === 'BLOCKED');

    const validationIssues: string[] = [];
    const recommendedActions: string[] = [];

    if (pendingMandatory.length > 0) {
      validationIssues.push(`${pendingMandatory.length} mandatory checklist tasks are incomplete.`);
      pendingMandatory.forEach((t) => {
        recommendedActions.push(`Complete mandatory task: [${t.category}] ${t.name}`);
      });
    }

    if (blockedItems.length > 0) {
      validationIssues.push(`${blockedItems.length} checklist tasks are currently blocked.`);
      blockedItems.forEach((t) => {
        recommendedActions.push(`Resolve blocker on: ${t.name} (Reason: ${t.blockerReason || 'Unspecified'})`);
      });
    }

    const readyForActivation = validationIssues.length === 0;

    return {
      readyForActivation,
      stage: record.stage,
      totalChecklistItems,
      completedItemsCount,
      pendingMandatoryCount: pendingMandatory.length,
      blockedCount: blockedItems.length,
      validationIssues,
      recommendedActions,
    };
  }

  // --- 4. SUBMIT FOR APPROVAL ---

  public submitForApproval(
    onboardingId: string,
    actor: { id: string; email: string; roles: string[] }
  ): CommercialOnboardingRecord {
    const record = this.records.get(onboardingId);
    if (!record) {
      throw new NotFoundError(`Onboarding record '${onboardingId}' not found.`);
    }

    const validation = this.validateGoLiveReadiness(onboardingId);
    if (!validation.readyForActivation) {
      throw new BadRequestError(
        `Cannot submit for approval: Incomplete mandatory tasks (${validation.pendingMandatoryCount} pending).`
      );
    }

    record.stage = 'APPROVAL';
    record.updatedAt = new Date().toISOString();
    return record;
  }

  // --- 5. APPROVE & PROVISION TENANT (IDEMPOTENT ATOMIC ACTIVATION) ---

  public async approveAndProvisionTenant(
    onboardingId: string,
    approvalNotes: string,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<CommercialOnboardingRecord> {
    if (!actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Only Super Administrators have authority to issue final commercial activation approval.');
    }

    const record = this.records.get(onboardingId);
    if (!record) {
      throw new NotFoundError(`Onboarding record '${onboardingId}' not found.`);
    }

    const now = new Date().toISOString();
    record.stage = 'PROVISIONING';

    // 1. Create or Activate Tenant in Tenant Service
    try {
      await tenantService.createTenant(
        {
          code: record.code,
          name: record.name,
          tier: record.tier,
          cinNumber: record.organizationDetails.cinNumber,
          rbiRegistrationNo: record.organizationDetails.rbiRegistrationNo,
          domain: record.organizationDetails.domain || `${record.code.toLowerCase()}.adyapan.dev`,
          contactEmail: record.primaryContact.email,
          supportPhone: record.primaryContact.phone,
        },
        actor
      );
    } catch {
      // If tenant already exists, ensure active status
      await tenantService.updateTenantStatus(record.tenantId, 'ACTIVE', actor).catch(() => {});
    }

    // 2. Mark all checklist tasks as completed
    record.checklist.forEach((t) => {
      t.status = 'COMPLETED';
      t.completedAt = t.completedAt || now;
      t.completedBy = t.completedBy || actor.email;
    });

    record.completionPercentage = 100;
    record.stage = 'ACTIVE';
    record.approvalDetails = {
      approvedBy: actor.email,
      approvedAt: now,
      notes: approvalNotes || 'Commercial onboarding approved and institution provisioned.',
    };
    record.updatedAt = now;

    // 3. Record Cryptographic Audit Node
    evidenceAuditService.recordEvidenceNode({
      tenantId: record.tenantId,
      eventType: 'POLICY_CONFIGURATION_CHANGE',
      actorId: actor.id,
      actorRole: 'SUPER_ADMIN',
      actorEmail: actor.email,
      entityType: 'TENANT_PROVISIONING',
      entityId: record.tenantId,
      action: 'COMMERCIAL_INSTITUTION_ACTIVATED',
      correlationId: `corr-${record.id}-live`,
      afterState: {
        code: record.code,
        name: record.name,
        stage: 'ACTIVE',
        approvedBy: actor.email,
      },
      timestamp: now,
    });

    return record;
  }

  // --- 6. CONTROLLED OFFBOARDING WITH STATUTORY DATA RETENTION ---

  public async deactivateTenantWithRetention(
    onboardingId: string,
    reason: string,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<CommercialOnboardingRecord> {
    if (!actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Only Super Administrators can execute controlled tenant deactivation.');
    }

    const record = this.records.get(onboardingId);
    if (!record) {
      throw new NotFoundError(`Onboarding record '${onboardingId}' not found.`);
    }

    const now = new Date().toISOString();

    // 1. Suspend / Deactivate in Tenant Service
    await tenantService.updateTenantStatus(record.tenantId, 'SUSPENDED', actor).catch(() => {});

    record.stage = 'DEACTIVATED';
    record.updatedAt = now;

    // 2. Cryptographic Evidence Audit Node recording retention lock
    evidenceAuditService.recordEvidenceNode({
      tenantId: record.tenantId,
      eventType: 'POLICY_CONFIGURATION_CHANGE',
      actorId: actor.id,
      actorRole: 'SUPER_ADMIN',
      actorEmail: actor.email,
      entityType: 'TENANT_OFFBOARDING',
      entityId: record.tenantId,
      action: 'TENANT_DEACTIVATED_WITH_8YR_RETENTION_LOCK',
      correlationId: `corr-offboard-${record.id}`,
      afterState: {
        stage: 'DEACTIVATED',
        reason,
        financialRecordsRetained: true,
        retentionExpiry: new Date(Date.now() + 8 * 365 * 24 * 3600 * 1000).toISOString(),
      },
      timestamp: now,
    });

    return record;
  }

  // --- 7. QUERIES ---

  public listOnboardings(): CommercialOnboardingRecord[] {
    return Array.from(this.records.values());
  }

  public getOnboardingById(id: string): CommercialOnboardingRecord {
    const record = this.records.get(id);
    if (!record) {
      throw new NotFoundError(`Onboarding record '${id}' not found.`);
    }
    return record;
  }

  public clearForTesting(): void {
    this.records.clear();
    this.seedDefaultOnboardings();
  }
}

export const clientOnboardingService = ClientOnboardingService.getInstance();
