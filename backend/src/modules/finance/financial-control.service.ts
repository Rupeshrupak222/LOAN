// Phase P5: Authoritative Financial Control & Maker-Checker Dual-Control Service
import Decimal from 'decimal.js';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  UnauthorizedError,
} from '../../common/errors';
import { ScopeResolver } from '../roles/scope-resolver';
import { SodValidator } from '../roles/sod-validator';
import { rolePermissionService } from '../roles/role-permission.service';
import { approvalAuthorityService } from '../approval-authority/approval-authority.service';
import { accountingPeriodService } from '../accounting/accounting-period.service';
import { chartOfAccountsService } from '../accounting/chart-of-accounts.service';
import { logAudit } from '../audit/audit.service';
import { Money } from './money';

export type FinancialRiskClassification =
  | 'READ'
  | 'NON_FINANCIAL_MUTATION'
  | 'LOW_RISK_FINANCIAL_MUTATION'
  | 'SENSITIVE_FINANCIAL_MUTATION'
  | 'HIGH_RISK_FINANCIAL_MUTATION';

export type FinancialOperationType =
  | 'DISBURSEMENT'
  | 'PAYOUT'
  | 'PAYMENT_RECORD'
  | 'PAYMENT_REVERSAL'
  | 'REFUND'
  | 'SETTLEMENT_PROPOSE'
  | 'SETTLEMENT_APPROVE'
  | 'SETTLEMENT_EXECUTE'
  | 'WRITEOFF_PROPOSE'
  | 'WRITEOFF_APPROVE'
  | 'WRITEOFF_EXECUTE'
  | 'MANUAL_JOURNAL_CREATE'
  | 'MANUAL_JOURNAL_APPROVE'
  | 'MANUAL_JOURNAL_POST'
  | 'JOURNAL_REVERSAL'
  | 'RECONCILIATION_ADJUSTMENT'
  | 'FEE_ADJUSTMENT'
  | 'INTEREST_ADJUSTMENT'
  | 'PRINCIPAL_ADJUSTMENT'
  | 'SUSPENSE_CLEARING'
  | 'CREDIT_LIMIT_ADJUSTMENT';

export type FinancialTaskStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_CHECKER'
  | 'APPROVED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'REJECTED'
  | 'SENT_BACK'
  | 'EXPIRED';

export interface FinancialActorContext {
  id: string;
  email?: string;
  roles: string[];
  tenantId?: string;
  branchId?: string;
  customerId?: string;
  partnerId?: string;
  notes?: string;
}

export interface FinancialBeneficiaryInfo {
  accountNumber?: string;
  ifsc?: string;
  upiId?: string;
  accountHolderName?: string;
  bankName?: string;
}

export interface FinancialApprovalSnapshot {
  taskId: string;
  tenantId: string;
  branchId?: string;
  resourceType: string;
  resourceId: string;
  operation: FinancialOperationType;
  amount: number;
  currency: string;
  beneficiary?: FinancialBeneficiaryInfo;
  fees?: number;
  tax?: number;
  netAmount?: number;
  makerId: string;
  makerEmail?: string;
  makerRole?: string;
  checkerId?: string;
  checkerEmail?: string;
  checkerRole?: string;
  authorityLevelRequired: number;
  authorityPolicyVersion: string;
  snapshotTimestamp: string;
  dataHash: string;
}

export interface CreateFinancialTaskInput {
  tenantId: string;
  branchId?: string;
  resourceType: string;
  resourceId: string;
  operation: FinancialOperationType;
  amount: number;
  currency?: string;
  beneficiary?: FinancialBeneficiaryInfo;
  fees?: number;
  tax?: number;
  notes?: string;
  reason?: string;
  metadata?: Record<string, any>;
  expiresInHours?: number;
}

export interface FinancialTaskRecord {
  id: string;
  taskNumber: string;
  tenantId: string;
  branchId?: string;
  resourceType: string;
  resourceId: string;
  operation: FinancialOperationType;
  riskClassification: FinancialRiskClassification;
  amount: number;
  currency: string;
  beneficiary?: FinancialBeneficiaryInfo;
  fees?: number;
  tax?: number;
  netAmount?: number;
  status: FinancialTaskStatus;
  makerId: string;
  makerEmail?: string;
  makerRole?: string;
  submittedAt?: string;
  checkerId?: string;
  checkerEmail?: string;
  checkerRole?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  executedAt?: string;
  executedBy?: string;
  expiresAt: string;
  snapshot?: FinancialApprovalSnapshot;
  approvalDataHash?: string;
  notes?: string;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IdempotencyRecord {
  key: string;
  tenantId: string;
  operation: string;
  resourceId: string;
  requestHash: string;
  responsePayload: any;
  createdAt: string;
}

export interface DoubleEntryLine {
  accountCode: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number | Decimal;
  description?: string;
}

export class FinancialControlService {
  private static instance: FinancialControlService;

  // In-memory store for high-security financial tasks and idempotency keys
  private tasks: Map<string, FinancialTaskRecord> = new Map();
  private idempotencyStore: Map<string, IdempotencyRecord> = new Map();

  private constructor() {}

  public static getInstance(): FinancialControlService {
    if (!FinancialControlService.instance) {
      FinancialControlService.instance = new FinancialControlService();
    }
    return FinancialControlService.instance;
  }

  // ---------------------------------------------------------------------------
  // 1. FINANCIAL ACTION CLASSIFICATION
  // ---------------------------------------------------------------------------

  public classifyOperation(operation: FinancialOperationType): FinancialRiskClassification {
    switch (operation) {
      case 'DISBURSEMENT':
      case 'PAYOUT':
      case 'SETTLEMENT_APPROVE':
      case 'SETTLEMENT_EXECUTE':
      case 'WRITEOFF_APPROVE':
      case 'WRITEOFF_EXECUTE':
      case 'MANUAL_JOURNAL_POST':
      case 'PAYMENT_REVERSAL':
      case 'REFUND':
      case 'SUSPENSE_CLEARING':
      case 'CREDIT_LIMIT_ADJUSTMENT':
        return 'HIGH_RISK_FINANCIAL_MUTATION';

      case 'PAYMENT_RECORD':
      case 'SETTLEMENT_PROPOSE':
      case 'WRITEOFF_PROPOSE':
      case 'MANUAL_JOURNAL_CREATE':
      case 'MANUAL_JOURNAL_APPROVE':
      case 'JOURNAL_REVERSAL':
      case 'RECONCILIATION_ADJUSTMENT':
      case 'FEE_ADJUSTMENT':
      case 'INTEREST_ADJUSTMENT':
      case 'PRINCIPAL_ADJUSTMENT':
        return 'SENSITIVE_FINANCIAL_MUTATION';

      default:
        return 'LOW_RISK_FINANCIAL_MUTATION';
    }
  }

  // ---------------------------------------------------------------------------
  // 2. CRYPTOGRAPHIC APPROVAL FINGERPRINTING
  // ---------------------------------------------------------------------------

  public computeApprovalDataHash(data: {
    tenantId: string;
    branchId?: string;
    resourceType: string;
    resourceId: string;
    operation: FinancialOperationType;
    amount: number;
    currency: string;
    beneficiary?: FinancialBeneficiaryInfo;
    fees?: number;
    tax?: number;
    makerId: string;
    authorityPolicyVersion?: string;
  }): string {
    const normalizedPayload = {
      tenantId: data.tenantId,
      branchId: data.branchId || '',
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      operation: data.operation,
      amount: new Decimal(data.amount).toFixed(2),
      currency: data.currency.toUpperCase(),
      beneficiary: {
        accountNumber: data.beneficiary?.accountNumber || '',
        ifsc: data.beneficiary?.ifsc?.toUpperCase() || '',
        upiId: data.beneficiary?.upiId || '',
      },
      fees: new Decimal(data.fees || 0).toFixed(2),
      tax: new Decimal(data.tax || 0).toFixed(2),
      makerId: data.makerId,
      authorityPolicyVersion: data.authorityPolicyVersion || 'v1.0',
    };

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(normalizedPayload))
      .digest('hex');
  }

  // ---------------------------------------------------------------------------
  // 3. MAKER-CHECKER TASK LIFECYCLE
  // ---------------------------------------------------------------------------

  /**
   * Maker action: Propose a sensitive or high-risk financial transaction
   */
  public async createFinancialTask(
    input: CreateFinancialTaskInput,
    actor: FinancialActorContext
  ): Promise<FinancialTaskRecord> {
    if (!actor || !actor.id) {
      throw new UnauthorizedError('Authentication required to initiate financial transactions.');
    }

    // Tenant Isolation
    ScopeResolver.validateTenantAccess(
      { id: actor.id, email: actor.email || '', roles: actor.roles, tenantId: actor.tenantId },
      input.tenantId
    );

    // Branch Isolation
    if (input.branchId) {
      ScopeResolver.validateBranchAccess(
        { id: actor.id, email: actor.email || '', roles: actor.roles, tenantId: actor.tenantId, branchId: actor.branchId },
        input.branchId
      );
    }

    // Auditor Lockdown
    SodValidator.assertAuditorReadOnly(
      { roles: actor.roles },
      `FINANCIAL_TASK_CREATE_${input.operation}`
    );

    const amountDec = new Decimal(input.amount || 0);
    if (amountDec.lessThanOrEqualTo(0)) {
      throw new BadRequestError(`Financial mutation amount must be strictly positive (received: ₹${input.amount}).`);
    }

    const feesDec = new Decimal(input.fees || 0);
    const taxDec = new Decimal(input.tax || 0);
    const netAmountDec = amountDec.minus(feesDec).minus(taxDec);

    const classification = this.classifyOperation(input.operation);
    const ttlHours = input.expiresInHours || (classification === 'HIGH_RISK_FINANCIAL_MUTATION' ? 24 : 48);
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000).toISOString();
    const taskId = `FTASK-${uuid().slice(0, 8)}`;
    const taskNumber = `FTX-${Date.now().toString().slice(-8)}`;

    const initialHash = this.computeApprovalDataHash({
      tenantId: input.tenantId,
      branchId: input.branchId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      operation: input.operation,
      amount: amountDec.toNumber(),
      currency: input.currency || 'INR',
      beneficiary: input.beneficiary,
      fees: feesDec.toNumber(),
      tax: taxDec.toNumber(),
      makerId: actor.id,
    });

    const task: FinancialTaskRecord = {
      id: taskId,
      taskNumber,
      tenantId: input.tenantId,
      branchId: input.branchId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      operation: input.operation,
      riskClassification: classification,
      amount: amountDec.toNumber(),
      currency: (input.currency || 'INR').toUpperCase(),
      beneficiary: input.beneficiary,
      fees: feesDec.toNumber(),
      tax: taxDec.toNumber(),
      netAmount: netAmountDec.toNumber(),
      status: 'PENDING_CHECKER',
      makerId: actor.id,
      makerEmail: actor.email,
      makerRole: actor.roles[0],
      submittedAt: new Date().toISOString(),
      expiresAt,
      approvalDataHash: initialHash,
      notes: input.notes,
      reason: input.reason,
      metadata: input.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.set(task.id, task);

    await logAudit({
      tenantId: task.tenantId,
      userId: actor.id,
      action: `FINANCIAL_TASK_CREATED_${task.operation}`,
      entity: 'FinancialTask',
      entityId: task.id,
      newValue: {
        taskNumber: task.taskNumber,
        operation: task.operation,
        amount: task.amount,
        classification: task.riskClassification,
        makerId: actor.id,
      },
    });

    return task;
  }

  /**
   * Checker action: Review and approve a financial task with strict SoD and Authority matching
   */
  public async approveFinancialTask(
    taskId: string,
    checker: FinancialActorContext,
    options?: { overrideNotes?: string }
  ): Promise<FinancialTaskRecord> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError(`Financial task ${taskId} not found.`);
    }

    // Tenant Isolation
    ScopeResolver.validateTenantAccess(
      { id: checker.id, email: checker.email || '', roles: checker.roles, tenantId: checker.tenantId },
      task.tenantId
    );

    // Branch Isolation
    if (task.branchId) {
      ScopeResolver.validateBranchAccess(
        { id: checker.id, email: checker.email || '', roles: checker.roles, tenantId: checker.tenantId, branchId: checker.branchId },
        task.branchId
      );
    }

    // Auditor Lockdown
    SodValidator.assertAuditorReadOnly(
      { roles: checker.roles },
      `FINANCIAL_TASK_APPROVE_${task.operation}`
    );

    // Expiration check
    if (new Date(task.expiresAt).getTime() < Date.now()) {
      task.status = 'EXPIRED';
      throw new BadRequestError(`Financial task ${taskId} has expired on ${task.expiresAt}. Re-submission required.`);
    }

    if (task.status !== 'PENDING_CHECKER' && task.status !== 'SUBMITTED') {
      throw new BadRequestError(`Cannot approve task in status ${task.status}. Must be PENDING_CHECKER.`);
    }

    // 1. Strict Segregation of Duties (Maker != Checker)
    SodValidator.assertMakerCheckerSeparation(
      task.makerId,
      checker.id,
      `FINANCIAL_CHECKER_APPROVAL_${task.operation}`
    );

    // 2. Authority Matrix Limit Verification
    const authorityTier = this.resolveRequiredAuthorityLevel(task.amount);
    this.assertCheckerAuthority(checker, task.amount, task.operation);

    // 3. Generate Immutable Approval Snapshot & Cryptographic Fingerprint
    const now = new Date().toISOString();
    const dataHash = this.computeApprovalDataHash({
      tenantId: task.tenantId,
      branchId: task.branchId,
      resourceType: task.resourceType,
      resourceId: task.resourceId,
      operation: task.operation,
      amount: task.amount,
      currency: task.currency,
      beneficiary: task.beneficiary,
      fees: task.fees,
      tax: task.tax,
      makerId: task.makerId,
      authorityPolicyVersion: 'v1.0',
    });

    const snapshot: FinancialApprovalSnapshot = {
      taskId: task.id,
      tenantId: task.tenantId,
      branchId: task.branchId,
      resourceType: task.resourceType,
      resourceId: task.resourceId,
      operation: task.operation,
      amount: task.amount,
      currency: task.currency,
      beneficiary: task.beneficiary,
      fees: task.fees,
      tax: task.tax,
      netAmount: task.netAmount,
      makerId: task.makerId,
      makerEmail: task.makerEmail,
      makerRole: task.makerRole,
      checkerId: checker.id,
      checkerEmail: checker.email,
      checkerRole: checker.roles[0],
      authorityLevelRequired: authorityTier,
      authorityPolicyVersion: 'v1.0',
      snapshotTimestamp: now,
      dataHash,
    };

    task.status = 'APPROVED';
    task.checkerId = checker.id;
    task.checkerEmail = checker.email;
    task.checkerRole = checker.roles[0];
    task.approvedAt = now;
    task.snapshot = snapshot;
    task.approvalDataHash = dataHash;
    task.updatedAt = now;

    await logAudit({
      tenantId: task.tenantId,
      userId: checker.id,
      action: `FINANCIAL_TASK_APPROVED_${task.operation}`,
      entity: 'FinancialTask',
      entityId: task.id,
      newValue: {
        taskNumber: task.taskNumber,
        checkerId: checker.id,
        amount: task.amount,
        fingerprint: dataHash,
      },
    });

    return task;
  }

  /**
   * Checker action: Reject a financial task
   */
  public async rejectFinancialTask(
    taskId: string,
    rejecter: FinancialActorContext,
    reason: string
  ): Promise<FinancialTaskRecord> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError(`Financial task ${taskId} not found.`);
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestError('A formal rejection reason is mandatory when rejecting financial tasks.');
    }

    // Tenant Isolation
    ScopeResolver.validateTenantAccess(
      { id: rejecter.id, email: rejecter.email || '', roles: rejecter.roles, tenantId: rejecter.tenantId },
      task.tenantId
    );

    task.status = 'REJECTED';
    task.rejectedAt = new Date().toISOString();
    task.rejectionReason = reason;
    task.updatedAt = new Date().toISOString();

    await logAudit({
      tenantId: task.tenantId,
      userId: rejecter.id,
      action: `FINANCIAL_TASK_REJECTED_${task.operation}`,
      entity: 'FinancialTask',
      entityId: task.id,
      newValue: {
        taskNumber: task.taskNumber,
        rejectedBy: rejecter.id,
        reason,
      },
    });

    return task;
  }

  public getTask(taskId: string): FinancialTaskRecord | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Final Execution: Execute an approved financial task with Idempotency and Anti-Tamper fingerprint validation

   */
  public async executeFinancialTask<T = any>(
    taskId: string,
    executor: FinancialActorContext,
    executionPayload: {
      idempotencyKey: string;
      currentPayload?: {
        amount?: number;
        currency?: string;
        beneficiary?: FinancialBeneficiaryInfo;
        fees?: number;
        tax?: number;
      };
      executeDomainLogic?: () => Promise<T>;
    }
  ): Promise<{ task: FinancialTaskRecord; result: T; isIdempotentReplay: boolean }> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new NotFoundError(`Financial task ${taskId} not found.`);
    }

    // 1. Idempotency Guard
    const idempotencyRecord = this.checkIdempotency(
      executionPayload.idempotencyKey,
      task.tenantId,
      task.operation,
      task.resourceId,
      executionPayload.currentPayload
    );

    if (idempotencyRecord) {
      return {
        task,
        result: idempotencyRecord.responsePayload as T,
        isIdempotentReplay: true,
      };
    }

    // 2. Tenant and Scope isolation
    ScopeResolver.validateTenantAccess(
      { id: executor.id, email: executor.email || '', roles: executor.roles, tenantId: executor.tenantId },
      task.tenantId
    );

    // 3. Stale Approval & Status Check
    if (task.status !== 'APPROVED') {
      throw new BadRequestError(`Cannot execute task in status ${task.status}. Must be APPROVED.`);
    }

    if (new Date(task.expiresAt).getTime() < Date.now()) {
      task.status = 'EXPIRED';
      throw new BadRequestError(`Financial approval expired on ${task.expiresAt}. Re-authorization required.`);
    }

    // 4. Anti-Tampering Fingerprint Verification
    const payloadAmount = executionPayload?.currentPayload?.amount ?? task.amount;
    const payloadCurrency = executionPayload?.currentPayload?.currency ?? task.currency;
    const payloadBeneficiary = executionPayload?.currentPayload?.beneficiary ?? task.beneficiary;
    const payloadFees = executionPayload?.currentPayload?.fees ?? task.fees;
    const payloadTax = executionPayload?.currentPayload?.tax ?? task.tax;

    const currentHash = this.computeApprovalDataHash({
      tenantId: task.tenantId,
      branchId: task.branchId,
      resourceType: task.resourceType,
      resourceId: task.resourceId,
      operation: task.operation,
      amount: payloadAmount,
      currency: payloadCurrency,
      beneficiary: payloadBeneficiary,
      fees: payloadFees,
      tax: payloadTax,
      makerId: task.makerId,
      authorityPolicyVersion: 'v1.0',
    });

    if (currentHash !== task.approvalDataHash || (task.snapshot && currentHash !== task.snapshot.dataHash)) {
      throw new ConflictError(
        `[FINANCIAL_DATA_TAMPERED] Execution rejected: Material financial data (amount, beneficiary, or fees) has been altered after checker approval.`
      );
    }

    // 5. Concurrency protection (Optimistic lock)
    task.status = 'EXECUTING';
    task.updatedAt = new Date().toISOString();

    let domainResult: T;
    try {
      domainResult = executionPayload?.executeDomainLogic
        ? await executionPayload.executeDomainLogic()
        : ({ success: true, taskId: task.id } as any);
    } catch (err: any) {
      task.status = 'APPROVED'; // Revert to approved so error can be remediated or retried safely
      task.updatedAt = new Date().toISOString();
      throw err;
    }

    // 6. Mark Executed
    task.status = 'EXECUTED';
    task.executedAt = new Date().toISOString();
    task.executedBy = executor.email || executor.id;
    task.updatedAt = new Date().toISOString();

    // 7. Store Idempotency Record
    this.recordIdempotency(
      executionPayload.idempotencyKey,
      task.tenantId,
      task.operation,
      task.resourceId,
      executionPayload.currentPayload,
      domainResult
    );

    // 8. Immutable Audit
    await logAudit({
      tenantId: task.tenantId,
      userId: executor.id,
      action: `FINANCIAL_TASK_EXECUTED_${task.operation}`,
      entity: 'FinancialTask',
      entityId: task.id,
      newValue: {
        taskNumber: task.taskNumber,
        executedBy: executor.id,
        amount: task.amount,
        idempotencyKey: executionPayload.idempotencyKey,
      },
    });

    return {
      task,
      result: domainResult,
      isIdempotentReplay: false,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. DOUBLE-ENTRY GL & ACCOUNTING INTEGRITY
  // ---------------------------------------------------------------------------

  /**
   * Validate double-entry debits == credits balance with Decimal precision
   */
  public assertDoubleEntryIntegrity(lines: DoubleEntryLine[], transactionDate?: string, tenantId?: string): {
    totalDebit: Decimal;
    totalCredit: Decimal;
  } {
    if (!lines || lines.length < 2) {
      throw new BadRequestError('Double-entry GL transaction must have at least 2 lines (Debits and Credits).');
    }

    const txDate = transactionDate || new Date().toISOString();
    if (tenantId) {
      accountingPeriodService.assertPeriodOpenForDate(txDate, tenantId);
    }

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of lines) {
      const amount = new Decimal(line.amount || 0);
      if (amount.lessThanOrEqualTo(0)) {
        throw new BadRequestError(`Line amount for account ${line.accountCode} must be strictly positive.`);
      }

      if (line.direction === 'DEBIT') {
        totalDebit = totalDebit.plus(amount);
      } else if (line.direction === 'CREDIT') {
        totalCredit = totalCredit.plus(amount);
      } else {
        throw new BadRequestError(`Invalid GL line direction "${line.direction}". Must be DEBIT or CREDIT.`);
      }
    }

    const diff = totalDebit.minus(totalCredit).abs();
    if (diff.greaterThan(0.001)) {
      throw new BadRequestError(
        `[GL_IMBALANCE_REJECTED] Double-entry GL out of balance: Total Debits (₹${totalDebit.toFixed(2)}) != Total Credits (₹${totalCredit.toFixed(2)}). Variance: ₹${diff.toFixed(2)}.`
      );
    }

    return { totalDebit, totalCredit };
  }

  // ---------------------------------------------------------------------------
  // 5. AUTHORITY TIERS & LIMIT MATCHING
  // ---------------------------------------------------------------------------

  public resolveRequiredAuthorityLevel(amount: number): number {
    const amt = new Decimal(amount);
    if (amt.lessThanOrEqualTo(500000)) return 1; // Level 1: Up to ₹5L (Branch Manager)
    if (amt.lessThanOrEqualTo(2500000)) return 2; // Level 2: Up to ₹25L (Underwriter)
    if (amt.lessThanOrEqualTo(10000000)) return 3; // Level 3: Up to ₹1Cr (Credit Head)
    return 4; // Level 4: > ₹1Cr (Executive Committee / Board)
  }

  public assertCheckerAuthority(checker: FinancialActorContext, amount: number, operation: FinancialOperationType): void {
    const amt = new Decimal(amount);
    const roles = (checker.roles || []).map((r) => r.toUpperCase());

    const isSuperAdmin = roles.includes('SUPER_ADMIN');
    const isCreditHead = roles.includes('CREDIT_HEAD') || roles.includes('COMPANY_ADMIN');
    const isUnderwriter = roles.includes('UNDERWRITER') || roles.includes('SENIOR_UNDERWRITER');
    const isFinanceOfficer = roles.includes('FINANCE_OFFICER');
    const isBranchManager = roles.includes('BRANCH_MANAGER');

    // Level 1: Branch Manager (Max ₹5L, restricted to BRANCH scope)
    if (isBranchManager && !isUnderwriter && !isCreditHead && !isSuperAdmin && !isFinanceOfficer) {
      if (amt.greaterThan(500000)) {
        throw new ForbiddenError(
          `[AUTHORITY_LIMIT_EXCEEDED] Branch Manager authority is limited to ₹5,00,000. Requested: ₹${amt.toNumber().toLocaleString('en-IN')}. Escalation to Level 2 (Underwriter) required.`
        );
      }
      return;
    }

    // Level 2: Underwriter / Finance Officer (Max ₹25L for UW, Max ₹1Cr for FO)
    if (isUnderwriter && !isCreditHead && !isSuperAdmin) {
      if (amt.greaterThan(2500000)) {
        throw new ForbiddenError(
          `[AUTHORITY_LIMIT_EXCEEDED] Senior Underwriter sanction authority is limited to ₹25,00,000. Requested: ₹${amt.toNumber().toLocaleString('en-IN')}. Escalation to Level 3 (Credit Head) required.`
        );
      }
      return;
    }

    if (isFinanceOfficer && !isCreditHead && !isSuperAdmin) {
      if (amt.greaterThan(10000000)) {
        throw new ForbiddenError(
          `[AUTHORITY_LIMIT_EXCEEDED] Finance Officer authority is limited to ₹1,00,00,000. Requested: ₹${amt.toNumber().toLocaleString('en-IN')}. Escalation to Board Committee required.`
        );
      }
      return;
    }

    if (isCreditHead || isSuperAdmin) {
      return; // Allowed for high amounts
    }

    throw new ForbiddenError(`User lacks financial approval authority for operation ${operation}.`);
  }

  // ---------------------------------------------------------------------------
  // 6. IDEMPOTENCY ENGINE
  // ---------------------------------------------------------------------------

  private buildIdempotencyPayloadHash(payload: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
  }

  public checkIdempotency(
    key: string,
    tenantId: string,
    operation: string,
    resourceId: string,
    requestPayload: any
  ): IdempotencyRecord | null {
    if (!key) return null;

    const fullKey = `${tenantId}:${operation}:${key}`;
    const existing = this.idempotencyStore.get(fullKey);
    if (!existing) return null;

    const incomingHash = this.buildIdempotencyPayloadHash(requestPayload);
    if (existing.requestHash !== incomingHash) {
      throw new ConflictError(
        `[IDEMPOTENCY_KEY_REUSE_PAYLOAD_MISMATCH] Idempotency key '${key}' was already used with different financial parameters. Duplicate request rejected.`
      );
    }

    return existing;
  }

  public recordIdempotency(
    key: string,
    tenantId: string,
    operation: string,
    resourceId: string,
    requestPayload: any,
    responsePayload: any
  ): void {
    if (!key) return;

    const fullKey = `${tenantId}:${operation}:${key}`;
    const requestHash = this.buildIdempotencyPayloadHash(requestPayload);

    this.idempotencyStore.set(fullKey, {
      key,
      tenantId,
      operation,
      resourceId,
      requestHash,
      responsePayload,
      createdAt: new Date().toISOString(),
    });
  }

  public getFinancialTask(taskId: string): FinancialTaskRecord | undefined {
    return this.tasks.get(taskId);
  }

  public listPendingTasks(tenantId?: string): FinancialTaskRecord[] {
    const list = Array.from(this.tasks.values());
    if (tenantId) {
      return list.filter((t) => t.tenantId === tenantId);
    }
    return list;
  }
}

export const financialControlService = FinancialControlService.getInstance();
