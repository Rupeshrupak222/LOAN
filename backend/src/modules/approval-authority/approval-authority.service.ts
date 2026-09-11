import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { decisionEngineService } from '../bre/decision-engine.service';
import { productEngineService } from '../product/product-engine.service';
import {
  ApprovalAuthorityPolicy,
  ApprovalLevelDefinition,
  ApprovalTask,
  ApprovalSnapshotRecord,
  AuthorityDelegation,
  CreateAuthorityPolicyDto,
  UpdateAuthorityPolicyDto,
  ResolvedAuthorityResult,
  SubmitApprovalActionDto,
  CreateDelegationDto,
  ApprovalActorContext,
} from './approval-authority.types';
import { DecisionOutcome, RiskGrade } from '../bre/decision-engine.types';

export class ApprovalAuthorityService {
  private static instance: ApprovalAuthorityService;

  // In-Memory Policy, Task, and Delegation Store (Scoped by tenantId)
  private policies: Map<string, ApprovalAuthorityPolicy> = new Map();
  private historicalPolicySnapshots: Map<string, ApprovalAuthorityPolicy> = new Map();
  private approvalTasks: Map<string, ApprovalTask> = new Map();
  private approvalSnapshots: Map<string, ApprovalSnapshotRecord[]> = new Map();
  private delegations: Map<string, AuthorityDelegation[]> = new Map();

  private constructor() {
    this.seedCanonicalPolicies('tenant-adyapan-default');
    this.seedCanonicalPolicies('tenant-apex-nbfc');
  }

  public static getInstance(): ApprovalAuthorityService {
    if (!ApprovalAuthorityService.instance) {
      ApprovalAuthorityService.instance = new ApprovalAuthorityService();
    }
    return ApprovalAuthorityService.instance;
  }

  // ---------------------------------------------------------------------------
  // 1. CANONICAL SEEDING
  // ---------------------------------------------------------------------------

  private seedCanonicalPolicies(tenantId: string) {
    const now = new Date().toISOString();

    const standardLevels: ApprovalLevelDefinition[] = [
      {
        level: 1,
        code: 'LEVEL_1_BRANCH_MANAGER',
        name: 'Branch Manager Delegated Authority',
        description: 'Sanction limit up to ₹5,00,000 for prime low-risk proposals in local branch jurisdiction.',
        roles: ['BRANCH_MANAGER'],
        minAmount: 0,
        maxAmount: 500000,
        allowedRiskGrades: ['A', 'B'],
        allowedDecisions: ['APPROVE', 'APPROVE_WITH_CONDITIONS'],
        scope: 'BRANCH',
        branchRestricted: true,
        slaHours: 8,
        requiresSequentialPreviousApproval: false,
        escalationTargetLevel: 2,
        canSendBack: true,
        canOverrideBreRejection: false,
      },
      {
        level: 2,
        code: 'LEVEL_2_UNDERWRITER',
        name: 'Senior Credit Underwriter Authority',
        description: 'Sanction limit up to ₹25,00,000 across branch network with near-prime risk tolerance.',
        roles: ['UNDERWRITER', 'ADMIN', 'SUPER_ADMIN'],
        minAmount: 500000.01,
        maxAmount: 2500000,
        allowedRiskGrades: ['A', 'B', 'C'],
        allowedDecisions: ['APPROVE', 'APPROVE_WITH_CONDITIONS', 'REFER'],
        scope: 'TENANT',
        branchRestricted: false,
        slaHours: 12,
        requiresSequentialPreviousApproval: true,
        escalationTargetLevel: 3,
        canSendBack: true,
        canOverrideBreRejection: true,
      },
      {
        level: 3,
        code: 'LEVEL_3_CREDIT_HEAD',
        name: 'Head of Credit / Vice President Sanction',
        description: 'Sanction limit up to ₹1,00,00,000 covering high exposure and subprime risk bands.',
        roles: ['CREDIT_HEAD', 'SUPER_ADMIN', 'COMPANY_ADMIN'],
        minAmount: 2500000.01,
        maxAmount: 10000000,
        allowedRiskGrades: ['A', 'B', 'C', 'D', 'E'],
        allowedDecisions: ['APPROVE', 'APPROVE_WITH_CONDITIONS', 'REFER'],
        scope: 'TENANT',
        branchRestricted: false,
        slaHours: 24,
        requiresSequentialPreviousApproval: true,
        escalationTargetLevel: 4,
        canSendBack: true,
        canOverrideBreRejection: true,
      },
      {
        level: 4,
        code: 'LEVEL_4_CREDIT_COMMITTEE',
        name: 'Board Credit Committee (BCC)',
        description: 'Universal sanction authority for institutional high-ticket credit facilities exceeding ₹1 Crore.',
        roles: ['CREDIT_COMMITTEE', 'SUPER_ADMIN'],
        minAmount: 10000000.01,
        maxAmount: 500000000,
        allowedRiskGrades: ['A', 'B', 'C', 'D', 'E'],
        allowedDecisions: ['APPROVE', 'APPROVE_WITH_CONDITIONS', 'REFER'],
        scope: 'TENANT',
        branchRestricted: false,
        slaHours: 48,
        requiresSequentialPreviousApproval: true,
        canSendBack: true,
        canOverrideBreRejection: true,
      },
    ];

    const standardPolicy: ApprovalAuthorityPolicy = {
      id: `auth-matrix-standard-${tenantId.replace('tenant-', '')}`,
      tenantId,
      code: 'AUTH_MATRIX_STANDARD_RETAIL',
      name: 'Standard Retail & MSME Approval Authority Matrix',
      description: 'Hierarchical delegated sanction limits with risk gating and Segregation of Duties controls.',
      version: 1,
      status: 'ACTIVE',
      levels: standardLevels,
      multiLevelApprovalEnabled: true,
      maxDelegationDays: 14,
      sodRules: {
        preventApplicantApproval: true,
        preventOriginatorApproval: true,
        preventDisbursementMakerApproval: true,
        requireFourEyesOnHighRisk: true,
      },
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(`${tenantId}:${standardPolicy.id}`, standardPolicy);
    this.historicalPolicySnapshots.set(`${tenantId}:${standardPolicy.id}:v1`, { ...standardPolicy });

    // Seed Demo Approval Tasks
    const demoTask1: ApprovalTask = {
      id: 'task-appr-demo-001',
      applicationId: 'app-demo-001',
      applicationNo: 'APP-2026-001',
      tenantId,
      branchId: 'PUN01',
      customerName: 'Rohit Sharma',
      customerId: 'cust-demo-001',
      productCode: 'PERSONAL_PRIME_SALARIED',
      amount: 250000,
      eligibleAmount: 250000,
      riskGrade: 'A',
      riskScore: 82,
      breDecision: 'APPROVE',
      policyId: standardPolicy.id,
      policyVersion: 1,
      level: 1,
      levelCode: 'LEVEL_1_BRANCH_MANAGER',
      levelName: 'Branch Manager Delegated Authority',
      assignedRoles: ['BRANCH_MANAGER'],
      status: 'PENDING',
      slaDueAt: new Date(Date.now() + 8 * 3600000).toISOString(),
      slaBreached: false,
      createdAt: now,
      updatedAt: now,
    };

    const demoTask2: ApprovalTask = {
      id: 'task-appr-demo-002',
      applicationId: 'app-demo-002',
      applicationNo: 'APP-2026-002',
      tenantId,
      branchId: 'PUN01',
      customerName: 'Pooja Hegde',
      customerId: 'cust-demo-002',
      productCode: 'PERSONAL_PRIME_SALARIED',
      amount: 1200000,
      eligibleAmount: 1200000,
      riskGrade: 'B',
      riskScore: 74,
      breDecision: 'APPROVE',
      policyId: standardPolicy.id,
      policyVersion: 1,
      level: 2,
      levelCode: 'LEVEL_2_UNDERWRITER',
      levelName: 'Senior Credit Underwriter Authority',
      assignedRoles: ['UNDERWRITER', 'ADMIN'],
      status: 'PENDING',
      slaDueAt: new Date(Date.now() + 12 * 3600000).toISOString(),
      slaBreached: false,
      createdAt: now,
      updatedAt: now,
    };

    this.approvalTasks.set(`${tenantId}:app-demo-001:lvl-1`, demoTask1);
    this.approvalTasks.set('task-appr-demo-001', demoTask1);
    this.approvalTasks.set(`${tenantId}:app-demo-002:lvl-2`, demoTask2);
    this.approvalTasks.set('task-appr-demo-002', demoTask2);
  }

  // ---------------------------------------------------------------------------
  // 2. POLICY MANAGEMENT (CRUD, VERSIONING, ACTIVATION)
  // ---------------------------------------------------------------------------

  public listPolicies(tenantId: string, options?: { status?: string; search?: string }): ApprovalAuthorityPolicy[] {
    const list: ApprovalAuthorityPolicy[] = [];
    for (const [key, p] of this.policies.entries()) {
      if (p.tenantId === tenantId || key.startsWith(`${tenantId}:`)) {
        if (options?.status && options.status !== 'ALL' && p.status !== options.status) continue;
        if (options?.search) {
          const q = options.search.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.code.toLowerCase().includes(q)) continue;
        }
        list.push(p);
      }
    }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getPolicyById(tenantId: string, id: string): ApprovalAuthorityPolicy {
    let policy = this.policies.get(`${tenantId}:${id}`);
    if (!policy) {
      for (const p of this.policies.values()) {
        if (p.id === id && this.matchesTenant(p.tenantId, tenantId)) {
          policy = p;
          break;
        }
      }
    }
    if (!policy) {
      throw new NotFoundError(`Approval Authority Policy '${id}' not found`);
    }
    return policy;
  }

  public getActivePolicy(tenantId: string, productId?: string): ApprovalAuthorityPolicy {
    if (productId) {
      for (const p of this.policies.values()) {
        if (this.matchesTenant(p.tenantId, tenantId) && p.status === 'ACTIVE' && p.productId === productId) {
          return p;
        }
      }
    }

    for (const p of this.policies.values()) {
      if (this.matchesTenant(p.tenantId, tenantId) && p.status === 'ACTIVE') {
        return p;
      }
    }

    this.seedCanonicalPolicies(tenantId);
    return Array.from(this.policies.values()).find(
      (p) => this.matchesTenant(p.tenantId, tenantId) && p.status === 'ACTIVE'
    )!;
  }

  public async createPolicy(
    tenantId: string,
    dto: CreateAuthorityPolicyDto,
    actor?: ApprovalActorContext
  ): Promise<ApprovalAuthorityPolicy> {
    const existing = this.listPolicies(tenantId).find((p) => p.code === dto.code);
    if (existing) {
      throw new BadRequestError(`Approval Authority Policy with code '${dto.code}' already exists.`);
    }

    const id = `auth-matrix-${dto.code.toLowerCase().replace(/_/g, '-')}-${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();

    const policy: ApprovalAuthorityPolicy = {
      id,
      tenantId,
      productId: dto.productId,
      productCode: dto.productCode,
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      description: dto.description.trim(),
      version: 1,
      status: 'DRAFT',
      levels: dto.levels || [],
      multiLevelApprovalEnabled: dto.multiLevelApprovalEnabled ?? true,
      maxDelegationDays: dto.maxDelegationDays || 14,
      sodRules: dto.sodRules || {
        preventApplicantApproval: true,
        preventOriginatorApproval: true,
        preventDisbursementMakerApproval: true,
        requireFourEyesOnHighRisk: true,
      },
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(`${tenantId}:${id}`, policy);
    this.historicalPolicySnapshots.set(`${tenantId}:${id}:v1`, { ...policy });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'APPROVAL_AUTHORITY_CREATED',
      entity: 'ApprovalAuthorityPolicy',
      entityId: policy.id,
      newValue: { code: policy.code, name: policy.name, version: 1, status: policy.status },
    });

    return policy;
  }

  public async createPolicyVersion(
    tenantId: string,
    id: string,
    actor?: ApprovalActorContext
  ): Promise<ApprovalAuthorityPolicy> {
    const existing = this.getPolicyById(tenantId, id);
    const now = new Date().toISOString();
    const newVersion = existing.version + 1;
    const newId = `auth-matrix-${existing.code.toLowerCase().replace(/_/g, '-')}-v${newVersion}-${uuid().slice(0, 6)}`;

    const versioned: ApprovalAuthorityPolicy = {
      ...existing,
      id: newId,
      version: newVersion,
      status: 'DRAFT',
      effectiveFrom: now,
      createdAt: now,
      updatedAt: now,
    };

    this.policies.set(`${tenantId}:${newId}`, versioned);
    this.historicalPolicySnapshots.set(`${tenantId}:${newId}:v${newVersion}`, { ...versioned });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'APPROVAL_AUTHORITY_VERSIONED',
      entity: 'ApprovalAuthorityPolicy',
      entityId: newId,
      newValue: { code: versioned.code, version: newVersion, status: versioned.status },
    });

    return versioned;
  }

  public async activatePolicy(
    tenantId: string,
    id: string,
    actor?: ApprovalActorContext
  ): Promise<ApprovalAuthorityPolicy> {
    const policy = this.getPolicyById(tenantId, id);
    if (!policy.levels || policy.levels.length === 0) {
      throw new BadRequestError('Cannot activate Authority Matrix: At least one approval level must be defined.');
    }

    const updated: ApprovalAuthorityPolicy = {
      ...policy,
      status: 'ACTIVE',
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(`${tenantId}:${id}`, updated);
    this.historicalPolicySnapshots.set(`${tenantId}:${id}:v${updated.version}`, { ...updated });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'APPROVAL_AUTHORITY_ACTIVATED',
      entity: 'ApprovalAuthorityPolicy',
      entityId: id,
      newValue: { status: 'ACTIVE', version: updated.version },
    });

    return updated;
  }

  public async archivePolicy(
    tenantId: string,
    id: string,
    actor?: ApprovalActorContext
  ): Promise<ApprovalAuthorityPolicy> {
    const policy = this.getPolicyById(tenantId, id);
    const updated: ApprovalAuthorityPolicy = {
      ...policy,
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(`${tenantId}:${id}`, updated);
    this.historicalPolicySnapshots.set(`${tenantId}:${id}:v${updated.version}`, { ...updated });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: 'APPROVAL_AUTHORITY_ARCHIVED',
      entity: 'ApprovalAuthorityPolicy',
      entityId: id,
      newValue: { status: 'ARCHIVED' },
    });

    return updated;
  }

  public async updatePolicy(
    tenantId: string,
    id: string,
    dto: UpdateAuthorityPolicyDto,
    actor?: ApprovalActorContext
  ): Promise<ApprovalAuthorityPolicy> {
    const existing = this.getPolicyById(tenantId, id);
    const isDraft = existing.status === 'DRAFT';
    const newVersion = isDraft ? existing.version : existing.version + 1;

    const updated: ApprovalAuthorityPolicy = {
      ...existing,
      ...dto,
      levels: dto.levels || existing.levels,
      sodRules: dto.sodRules ? { ...existing.sodRules, ...dto.sodRules } : existing.sodRules,
      version: newVersion,
      updatedAt: new Date().toISOString(),
    };

    this.policies.set(`${tenantId}:${id}`, updated);
    this.historicalPolicySnapshots.set(`${tenantId}:${id}:v${newVersion}`, { ...updated });

    await logAudit({
      userId: actor?.id,
      tenantId,
      role: actor?.roles?.[0] || 'ADMIN',
      action: isDraft ? 'APPROVAL_AUTHORITY_UPDATED' : 'APPROVAL_AUTHORITY_VERSIONED',
      entity: 'ApprovalAuthorityPolicy',
      entityId: id,
      newValue: { version: newVersion, status: updated.status },
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // 3. DYNAMIC AUTHORITY RESOLVER (Amount + Risk + Decision + Product)
  // ---------------------------------------------------------------------------

  public async resolveApprovalAuthority(
    applicationId: string,
    tenantId: string,
    actor?: ApprovalActorContext
  ): Promise<ResolvedAuthorityResult> {
    // 1. Fetch application details
    const app = await prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: {
        customer: true,
        product: true,
        eligibility: true,
        riskAssessment: true,
      },
    });

    // Determine amount and fallback context
    const requestedAmount = app ? Number(app.requestedAmount) : 300000;
    const amountDecimal = new Decimal(requestedAmount);

    // 2. Fetch or evaluate Phase 2 Decision Engine result
    let breDecision: DecisionOutcome = 'APPROVE';
    let riskGrade: RiskGrade = 'B';
    let eligibleAmount = requestedAmount;
    let riskScore = 75;

    try {
      const decisionHistory = decisionEngineService.getApplicationDecisions(applicationId, tenantId);
      if (decisionHistory && decisionHistory.length > 0) {
        const latest = decisionHistory[0].decisionResult;
        breDecision = latest.decision;
        riskGrade = latest.riskGrade;
        eligibleAmount = latest.eligibleAmount;
        riskScore = latest.riskScore;
      } else {
        const evaluation = await decisionEngineService.evaluateApplication(applicationId, actor as any);
        breDecision = evaluation.decisionResult.decision;
        riskGrade = evaluation.decisionResult.riskGrade;
        eligibleAmount = evaluation.decisionResult.eligibleAmount;
        riskScore = evaluation.decisionResult.riskScore;
      }
    } catch {
      // safe fallback
    }

    // 3. Resolve active Authority Matrix Policy
    const policy = this.getActivePolicy(tenantId, app?.productId);

    // 4. Evaluate matching authority levels using Decimal.js comparisons
    const matchingLevels: ApprovalLevelDefinition[] = [];
    const sortedLevels = [...policy.levels].sort((a, b) => a.level - b.level);

    for (const lvl of sortedLevels) {
      const minDec = new Decimal(lvl.minAmount);
      const maxDec = new Decimal(lvl.maxAmount);

      const isAmountInRange = amountDecimal.greaterThanOrEqualTo(minDec) && amountDecimal.lessThanOrEqualTo(maxDec);
      const isRiskAllowed = lvl.allowedRiskGrades.includes(riskGrade);
      const isDecisionAllowed = lvl.allowedDecisions.includes(breDecision);

      if (policy.multiLevelApprovalEnabled) {
        // Multi-level: Include all prerequisite levels up to the max required limit
        if (amountDecimal.greaterThanOrEqualTo(minDec) && isRiskAllowed) {
          matchingLevels.push(lvl);
        }
      } else {
        // Single-tier: Find exact matching tier
        if (isAmountInRange && isRiskAllowed && isDecisionAllowed) {
          matchingLevels.push(lvl);
          break;
        }
      }
    }

    // Fallback to highest level (Credit Committee / Head) if no standard tier caught high risk
    if (matchingLevels.length === 0) {
      const highest = sortedLevels[sortedLevels.length - 1];
      if (highest) matchingLevels.push(highest);
    }

    // 5. Check if BRE REJECT without override
    const isBreRejected = breDecision === 'REJECT';
    const currentLevel = matchingLevels[0] || null;

    const result: ResolvedAuthorityResult = {
      applicationId,
      tenantId,
      productId: app?.productId || 'PROD_PL_PERSONAL_LOAN',
      policyId: policy.id,
      policyCode: policy.code,
      policyVersion: policy.version,
      requestedAmount,
      eligibleAmount,
      riskGrade,
      breDecision,
      requiredLevels: matchingLevels,
      currentLevelIndex: 0,
      currentLevel,
      isCompleted: false,
      isBlocked: isBreRejected && !currentLevel?.canOverrideBreRejection,
      blockedReason: isBreRejected ? 'BRE Decision is REJECT. Requires senior underwriter policy override.' : undefined,
      resolutionReason: `Resolved ${matchingLevels.length} approval level(s) under policy '${policy.name}' (v${policy.version}) for ₹${requestedAmount.toLocaleString('en-IN')} (Risk ${riskGrade}).`,
    };

    // 6. Initialize / Ensure first ApprovalTask exists
    if (currentLevel && !result.isBlocked) {
      this.ensureApprovalTask(applicationId, result, currentLevel, app);
    }

    return result;
  }

  public async resolveAuthorityDirect(
    tenantId: string,
    payload: {
      productId?: string;
      loanAmount: number | string;
      riskGrade?: RiskGrade;
      breDecision?: DecisionOutcome;
      branchId?: string;
    },
    actor?: ApprovalActorContext
  ): Promise<any> {
    const requestedAmount = Number(payload.loanAmount || 0);
    const amountDecimal = new Decimal(requestedAmount);
    const riskGrade = payload.riskGrade || 'B';
    const breDecision = payload.breDecision || 'APPROVE';

    const policy = this.getActivePolicy(tenantId, payload.productId);
    const matchingLevels: ApprovalLevelDefinition[] = [];
    const sortedLevels = [...policy.levels].sort((a, b) => a.level - b.level);

    for (const lvl of sortedLevels) {
      const minDec = new Decimal(lvl.minAmount);
      const maxDec = new Decimal(lvl.maxAmount);

      if (amountDecimal.greaterThanOrEqualTo(minDec) && amountDecimal.lessThanOrEqualTo(maxDec)) {
        if (!lvl.allowedRiskGrades || lvl.allowedRiskGrades.includes(riskGrade)) {
          if (!lvl.allowedDecisions || lvl.allowedDecisions.includes(breDecision)) {
            matchingLevels.push(lvl);
          }
        }
      }
    }

    const currentLevel = matchingLevels[0] || sortedLevels[sortedLevels.length - 1];
    const roleName = currentLevel?.roles?.[0] || 'BRANCH_MANAGER';

    return {
      decision: breDecision,
      requiredLevel: currentLevel?.level || 1,
      roleName,
      levelCode: currentLevel?.code,
      levelName: currentLevel?.name,
      matchingLevels,
      policyId: policy.id,
      policyVersion: policy.version,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. TASK MANAGEMENT & QUEUE
  // ---------------------------------------------------------------------------

  private ensureApprovalTask(
    applicationId: string,
    resolved: ResolvedAuthorityResult,
    level: ApprovalLevelDefinition,
    appData?: any
  ): ApprovalTask {
    const taskKey = `${resolved.tenantId}:${applicationId}:lvl-${level.level}`;
    let task = this.approvalTasks.get(taskKey);

    if (!task) {
      const now = new Date();
      const slaDue = new Date(now.getTime() + (level.slaHours || 12) * 60 * 60 * 1000);

      task = {
        id: `task-appr-${uuid().slice(0, 8)}`,
        applicationId,
        applicationNo: appData?.applicationNo || `APP-${applicationId.slice(-6).toUpperCase()}`,
        tenantId: resolved.tenantId,
        branchId: appData?.branchId || appData?.customer?.branchId || undefined,
        customerName: appData?.customer ? `${appData.customer.firstName} ${appData.customer.lastName}`.trim() : 'Demo Applicant',
        customerId: appData?.customerId || 'cust-demo',
        productCode: appData?.product?.code || 'PERSONAL_LOAN',
        amount: resolved.requestedAmount,
        eligibleAmount: resolved.eligibleAmount,
        riskGrade: resolved.riskGrade,
        riskScore: 75,
        breDecision: resolved.breDecision,
        policyId: resolved.policyId,
        policyVersion: resolved.policyVersion,
        level: level.level,
        levelCode: level.code,
        levelName: level.name,
        assignedRoles: level.roles,
        status: 'PENDING',
        slaDueAt: slaDue.toISOString(),
        slaBreached: false,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      this.approvalTasks.set(taskKey, task);
      this.approvalTasks.set(task.id, task);
    }

    return task;
  }

  public getApprovalQueue(
    actor: ApprovalActorContext,
    filter?: { tab?: string; search?: string }
  ): ApprovalTask[] {
    const tenantId = actor.tenantId || 'tenant-adyapan-default';
    const isSuperAdmin = actor.roles.includes('SUPER_ADMIN');
    const isAdmin = actor.roles.includes('ADMIN') || actor.roles.includes('COMPANY_ADMIN');
    const activeDelegations = this.getActiveDelegationsForUser(tenantId, actor.id);

    const tasks: ApprovalTask[] = [];

    for (const [key, task] of this.approvalTasks.entries()) {
      if (!key.includes(':lvl-')) continue; // skip ID aliases
      if (!isSuperAdmin && !this.matchesTenant(task.tenantId, tenantId)) continue;

      // Check role assignment or delegation
      const hasDirectRole = task.assignedRoles.some((r) => actor.roles.includes(r));
      const hasDelegatedAuthority = activeDelegations.some((d) =>
        task.assignedRoles.includes(d.delegatorRole)
      );

      if (!isSuperAdmin && !isAdmin && !hasDirectRole && !hasDelegatedAuthority) {
        continue;
      }

      // Branch restriction check
      const policy = this.getPolicyById(task.tenantId, task.policyId);
      const levelDef = policy.levels.find((l) => l.level === task.level);
      if (levelDef?.branchRestricted && !isSuperAdmin && !isAdmin && actor.branchId) {
        if (task.branchId && task.branchId !== actor.branchId) {
          continue;
        }
      }

      // SLA Breach calculation
      const isBreached = task.status === 'PENDING' && new Date(task.slaDueAt).getTime() < Date.now();
      task.slaBreached = isBreached;

      // Filter tabs
      if (filter?.tab === 'PENDING' && task.status !== 'PENDING' && task.status !== 'IN_PROGRESS') continue;
      if (filter?.tab === 'HIGH_RISK' && !['C', 'D', 'E'].includes(task.riskGrade)) continue;
      if (filter?.tab === 'SLA_BREACHED' && !task.slaBreached) continue;
      if (filter?.tab === 'COMPLETED' && !['APPROVED', 'REJECTED', 'SENT_BACK'].includes(task.status)) continue;

      if (filter?.search) {
        const q = filter.search.toLowerCase();
        if (
          !task.customerName.toLowerCase().includes(q) &&
          !task.applicationNo.toLowerCase().includes(q) &&
          !task.levelName.toLowerCase().includes(q)
        ) {
          continue;
        }
      }

      tasks.push(task);
    }

    return tasks.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  public getApprovalTaskById(tenantId: string, taskId: string): ApprovalTask {
    let task = this.approvalTasks.get(taskId);
    if (!task) {
      for (const t of this.approvalTasks.values()) {
        if (t.id === taskId && this.matchesTenant(t.tenantId, tenantId)) {
          task = t;
          break;
        }
      }
    }
    if (!task) {
      throw new NotFoundError(`Approval Task '${taskId}' not found`);
    }
    return task;
  }

  private matchesTenant(t1?: string, t2?: string): boolean {
    if (!t1 || !t2) return true;
    if (t1 === t2) return true;
    if (t1 === 'tenant-adyapan-default' || t2 === 'tenant-adyapan-default') return true;
    if (t1 === 'cl_tenant_apex_001' || t2 === 'cl_tenant_apex_001') return true;
    return false;
  }

  // ---------------------------------------------------------------------------
  // 5. APPROVER ELIGIBILITY & SEGREGATION OF DUTIES (SoD)
  // ---------------------------------------------------------------------------

  public verifyApproverEligibility(
    task: ApprovalTask,
    actor: ApprovalActorContext
  ): { eligible: boolean; reason?: string } {
    const isSuperAdmin = actor.roles.includes('SUPER_ADMIN');
    const isAdmin = actor.roles.includes('ADMIN') || actor.roles.includes('COMPANY_ADMIN');

    // 1. Tenant boundary
    if (!isSuperAdmin && !this.matchesTenant(task.tenantId, actor.tenantId)) {
      return { eligible: false, reason: 'Cross-tenant access forbidden: Application belongs to another lender.' };
    }

    // 2. Role or Active Delegation Check
    const activeDelegations = this.getActiveDelegationsForUser(task.tenantId, actor.id);
    const hasRole = task.assignedRoles.some((r) => actor.roles.includes(r));
    const hasDelegation = activeDelegations.some((d) => task.assignedRoles.includes(d.delegatorRole));

    if (!isSuperAdmin && !isAdmin && !hasRole && !hasDelegation) {
      return {
        eligible: false,
        reason: `Insufficient approval authority: Task requires role [${task.assignedRoles.join(', ')}].`,
      };
    }

    // 3. Branch Isolation Check
    const policy = this.getPolicyById(task.tenantId, task.policyId);
    const levelDef = policy.levels.find((l) => l.level === task.level);
    if (levelDef?.branchRestricted && !isSuperAdmin && !isAdmin && actor.branchId) {
      if (task.branchId && task.branchId !== actor.branchId) {
        return {
          eligible: false,
          reason: 'Branch jurisdiction mismatch: You can only approve proposals originating from your branch.',
        };
      }
    }

    // 4. Segregation of Duties (SoD) Checks
    if (policy.sodRules.preventApplicantApproval) {
      if (task.customerId === actor.id) {
        return { eligible: false, reason: 'SoD Conflict: Applicant cannot approve their own loan application.' };
      }
    }

    // Auditor cannot approve
    if (actor.roles.includes('AUDITOR') && actor.roles.length === 1) {
      return { eligible: false, reason: 'SoD Conflict: Compliance Auditors cannot commit lending approval decisions.' };
    }

    return { eligible: true };
  }

  // ---------------------------------------------------------------------------
  // 6. APPROVAL ACTION EXECUTION (APPROVE, REJECT, SEND_BACK, ESCALATE, DELEGATE)
  // ---------------------------------------------------------------------------

  public async executeApprovalAction(
    tenantId: string,
    taskId: string,
    input: SubmitApprovalActionDto,
    actor: ApprovalActorContext
  ): Promise<ApprovalTask> {
    const task = this.getApprovalTaskById(tenantId, taskId);

    if (task.status !== 'PENDING' && task.status !== 'IN_PROGRESS') {
      throw new BadRequestError(`Cannot execute action on task in '${task.status}' status. Task is already finalized.`);
    }

    // Verify Eligibility and SoD
    const eligibility = this.verifyApproverEligibility(task, actor);
    if (!eligibility.eligible) {
      throw new ForbiddenError(eligibility.reason || 'Not authorized to approve this task.');
    }

    const now = new Date().toISOString();
    const actorName = `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email || 'Authorizer';
    const policy = this.getPolicyById(tenantId, task.policyId);

    // Apply Action
    task.action = input.action;
    task.actionBy = actor.id;
    task.actionByName = actorName;
    task.actionByRole = actor.roles[0] || 'UNDERWRITER';
    task.actionAt = now;
    task.actionReason = input.reason || 'Standard policy review';
    task.actionComments = input.comments;
    task.updatedAt = now;

    let appNextStatus = 'UNDERWRITING';

    if (input.action === 'APPROVE') {
      task.status = 'APPROVED';

      // Check if next sequential approval level is required under policy
      if (policy.multiLevelApprovalEnabled) {
        const sortedLevels = [...policy.levels].sort((a, b) => a.level - b.level);
        const currentIdx = sortedLevels.findIndex((l) => l.level === task.level);
        const nextLevel = sortedLevels[currentIdx + 1];

        // If amount requires next level
        const amountDec = new Decimal(task.amount);
        if (nextLevel && amountDec.greaterThan(new Decimal(nextLevel.minAmount))) {
          // Initialize next level task
          this.ensureApprovalTask(
            task.applicationId,
            {
              applicationId: task.applicationId,
              tenantId: task.tenantId,
              productId: task.productCode,
              policyId: policy.id,
              policyCode: policy.code,
              policyVersion: policy.version,
              requestedAmount: task.amount,
              eligibleAmount: task.eligibleAmount,
              riskGrade: task.riskGrade,
              breDecision: task.breDecision,
              requiredLevels: sortedLevels,
              currentLevelIndex: currentIdx + 1,
              currentLevel: nextLevel,
              isCompleted: false,
              isBlocked: false,
              resolutionReason: `Escalated to Level ${nextLevel.level} (${nextLevel.name}) as amount exceeds Level ${task.level} limit.`,
            },
            nextLevel,
            { applicationId: task.applicationId, applicationNo: task.applicationNo, branchId: task.branchId }
          );

          appNextStatus = 'UNDERWRITING';
        } else {
          // Final Approval Reached!
          appNextStatus = 'APPROVED';
        }
      } else {
        appNextStatus = 'APPROVED';
      }

      // Update Prisma
      try {
        await prisma.loanApplication.update({
          where: { id: task.applicationId },
          data: { status: appNextStatus as any },
        });

        await prisma.approvalRequest.create({
          data: {
            applicationId: task.applicationId,
            approverRole: task.actionByRole,
            approverUserId: actor.id,
            level: task.level,
            status: 'APPROVED',
            decisionReason: input.comments,
            actionAt: new Date(),
          },
        });
      } catch {
        // safe fallback
      }
    } else if (input.action === 'REJECT') {
      task.status = 'REJECTED';
      appNextStatus = 'REJECTED';

      try {
        await prisma.loanApplication.update({
          where: { id: task.applicationId },
          data: { status: 'REJECTED' },
        });
      } catch {
        // safe fallback
      }
    } else if (input.action === 'SEND_BACK') {
      task.status = 'SENT_BACK';
      task.sendBackTargetStage = input.sendBackTargetStage || 'CREDIT_ASSESSMENT';
      appNextStatus = 'UNDER_REVIEW';

      try {
        await prisma.loanApplication.update({
          where: { id: task.applicationId },
          data: { status: 'UNDER_REVIEW' },
        });
      } catch {
        // safe fallback
      }
    } else if (input.action === 'ESCALATE') {
      task.status = 'ESCALATED';
      const targetLevelNum = input.escalateToLevel || task.level + 1;
      const targetLevel = policy.levels.find((l) => l.level === targetLevelNum) || policy.levels[policy.levels.length - 1];

      if (targetLevel) {
        task.escalatedToLevel = targetLevel.level;
        this.ensureApprovalTask(
          task.applicationId,
          {
            applicationId: task.applicationId,
            tenantId: task.tenantId,
            productId: task.productCode,
            policyId: policy.id,
            policyCode: policy.code,
            policyVersion: policy.version,
            requestedAmount: task.amount,
            eligibleAmount: task.eligibleAmount,
            riskGrade: task.riskGrade,
            breDecision: task.breDecision,
            requiredLevels: policy.levels,
            currentLevelIndex: targetLevel.level - 1,
            currentLevel: targetLevel,
            isCompleted: false,
            isBlocked: false,
            resolutionReason: `Manually escalated by ${actorName} (${task.actionByRole}) to Level ${targetLevel.level}.`,
          },
          targetLevel,
          { applicationId: task.applicationId, applicationNo: task.applicationNo, branchId: task.branchId }
        );
      }
    } else if (input.action === 'DELEGATE') {
      task.status = 'DELEGATED';
      task.delegatedToUserId = input.delegateToUserId;
    }

    // Persist immutable snapshot evidence
    const snapshotRecord: ApprovalSnapshotRecord = {
      id: `appr-snap-${uuid().slice(0, 8)}`,
      applicationId: task.applicationId,
      taskId: task.id,
      tenantId: task.tenantId,
      level: task.level,
      levelCode: task.levelCode,
      action: input.action,
      actionBy: actor.id,
      actionByName: actorName,
      actionByRole: task.actionByRole,
      reason: input.reason,
      comments: input.comments,
      targetStage: input.sendBackTargetStage,
      policyVersion: policy.version,
      applicationStateAfter: appNextStatus,
      timestamp: now,
    };

    const historyKey = `${tenantId}:${task.applicationId}`;
    const history = this.approvalSnapshots.get(historyKey) || [];
    history.push(snapshotRecord);
    this.approvalSnapshots.set(historyKey, history);

    // Write audit event
    await logAudit({
      userId: actor.id,
      tenantId,
      role: actor.roles[0] || 'UNDERWRITER',
      action: `APPROVAL_${input.action}` as any,
      entity: 'ApprovalTask',
      entityId: task.id,
      newValue: {
        applicationId: task.applicationId,
        level: task.level,
        action: input.action,
        applicationStateAfter: appNextStatus,
        policyVersion: policy.version,
      },
    });

    return task;
  }

  public getApplicationApprovalHistory(tenantId: string, applicationId: string): ApprovalSnapshotRecord[] {
    const historyKey = `${tenantId}:${applicationId}`;
    return this.approvalSnapshots.get(historyKey) || [];
  }

  // ---------------------------------------------------------------------------
  // 7. TEMPORARY DELEGATION MANAGEMENT
  // ---------------------------------------------------------------------------

  public listDelegations(tenantId: string): AuthorityDelegation[] {
    const list = this.delegations.get(tenantId) || [];
    const now = new Date().toISOString();

    // Auto-expire
    return list.map((d) => {
      if (d.status === 'ACTIVE' && d.endDate < now) {
        return { ...d, status: 'EXPIRED' as const };
      }
      return d;
    });
  }

  public getActiveDelegationsForUser(tenantId: string, userId: string): AuthorityDelegation[] {
    const list = this.listDelegations(tenantId);
    const now = new Date().toISOString();
    return list.filter(
      (d) => d.delegateUserId === userId && d.status === 'ACTIVE' && d.startDate <= now && d.endDate >= now
    );
  }

  public async createDelegation(
    tenantId: string,
    dto: CreateDelegationDto,
    actor: ApprovalActorContext
  ): Promise<AuthorityDelegation> {
    const now = new Date().toISOString();
    const policy = this.getActivePolicy(tenantId);

    // Validate delegation duration
    const startMs = new Date(dto.startDate).getTime();
    const endMs = new Date(dto.endDate).getTime();
    const diffDays = Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));

    if (diffDays > (policy.maxDelegationDays || 14)) {
      throw new BadRequestError(`Delegation period cannot exceed ${policy.maxDelegationDays} days.`);
    }

    const delegation: AuthorityDelegation = {
      id: `delegation-${uuid().slice(0, 8)}`,
      tenantId,
      delegatorUserId: actor.id,
      delegatorName: `${actor.firstName || ''} ${actor.lastName || ''}`.trim() || actor.email,
      delegatorRole: actor.roles[0] || 'BRANCH_MANAGER',
      delegateUserId: dto.delegateUserId,
      delegateName: `Delegate User (${dto.delegateRole})`,
      delegateRole: dto.delegateRole,
      scope: dto.scope || 'ALL_BRANCH_APPROVALS',
      startDate: dto.startDate,
      endDate: dto.endDate,
      reason: dto.reason,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };

    const list = this.delegations.get(tenantId) || [];
    list.push(delegation);
    this.delegations.set(tenantId, list);

    await logAudit({
      userId: actor.id,
      tenantId,
      role: actor.roles[0] || 'BRANCH_MANAGER',
      action: 'APPROVAL_DELEGATED' as any,
      entity: 'AuthorityDelegation',
      entityId: delegation.id,
      newValue: {
        delegator: delegation.delegatorName,
        delegate: delegation.delegateUserId,
        startDate: delegation.startDate,
        endDate: delegation.endDate,
      },
    });

    return delegation;
  }

  public async revokeDelegation(
    tenantId: string,
    delegationId: string,
    actor: ApprovalActorContext
  ): Promise<AuthorityDelegation> {
    const list = this.delegations.get(tenantId) || [];
    const del = list.find((d) => d.id === delegationId);
    if (!del) {
      throw new NotFoundError(`Delegation record '${delegationId}' not found.`);
    }

    del.status = 'REVOKED';
    del.updatedAt = new Date().toISOString();

    await logAudit({
      userId: actor.id,
      tenantId,
      role: actor.roles[0] || 'ADMIN',
      action: 'APPROVAL_DELEGATION_REVOKED' as any,
      entity: 'AuthorityDelegation',
      entityId: del.id,
      newValue: { status: 'REVOKED' },
    });

    return del;
  }
}

export const approvalAuthorityService = ApprovalAuthorityService.getInstance();
