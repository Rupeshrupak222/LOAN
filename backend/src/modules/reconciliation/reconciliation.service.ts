import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import {
  AdjustmentStatus,
  AdjustmentType,
  FinancialException,
  FinancialExceptionType,
  LedgerAdjustment,
  ReconciliationDashboardStats,
} from './reconciliation.types';

export class ReconciliationService {
  private static instance: ReconciliationService;

  // In-memory repositories
  private readonly exceptions = new Map<string, FinancialException>();
  private readonly adjustments = new Map<string, LedgerAdjustment>();
  private lastRunAt: string = new Date().toISOString();

  private constructor() {}

  public static getInstance(): ReconciliationService {
    if (!ReconciliationService.instance) {
      ReconciliationService.instance = new ReconciliationService();
    }
    return ReconciliationService.instance;
  }

  /**
   * Executes a comprehensive 5-pillar reconciliation pass across financial ledgers.
   */
  public async runReconciliation(): Promise<{ scannedCount: number; exceptionsFound: number }> {
    let exceptionsFound = 0;
    const now = new Date().toISOString();

    // -------------------------------------------------------------------------
    // 1. Repayment Allocation Consistency
    // Verifies that sum of buckets (Principal, Interest, Fees, Penalty) == Payment Amount
    // -------------------------------------------------------------------------
    const payments = await prisma.payment.findMany({
      where: { status: 'SUCCESS' },
      include: {
        allocations: true,
        loan: { select: { loanNo: true } },
      },
    });

    for (const p of payments) {
      if (p.allocations && p.allocations.length > 0) {
        const allocatedSum = p.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
        const pmtAmount = Number(p.amount);
        const discrepancy = Math.abs(allocatedSum - pmtAmount);

        if (discrepancy > 0.05) {
          const excId = `EXC-ALLOC-${p.id}`;
          if (!this.exceptions.has(excId)) {
            this.exceptions.set(excId, {
              exceptionId: excId,
              type: 'ALLOCATION_MISMATCH',
              severity: 'HIGH',
              status: 'OPEN',
              loanId: p.loanId,
              loanNo: p.loan?.loanNo,
              paymentId: p.id,
              reference: p.reference || undefined,
              discrepancyAmount: Number(discrepancy.toFixed(2)),
              whatHappened: `Payment #${p.paymentNo} allocation sum (₹${allocatedSum.toLocaleString('en-IN')}) does not match payment transaction amount (₹${pmtAmount.toLocaleString('en-IN')}).`,
              evidence: `Payment Amount: ₹${pmtAmount}, Allocations Sum: ₹${allocatedSum}, Delta: ₹${discrepancy.toFixed(2)}`,
              source: 'Allocation Engine',
              recommendedAction: 'Execute controlled bucket reallocation to balance principal/interest ledger.',
              detectedAt: now,
            });
            exceptionsFound++;
          }
        }
      }
    }

    // -------------------------------------------------------------------------
    // 2. Outstanding Balance Consistency
    // Verifies Loan.outstandingPrincipal == sum(schedule items outstanding)
    // -------------------------------------------------------------------------
    const loans = await prisma.loan.findMany({
      where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
      include: {
        schedule: {
          where: { status: { not: 'PAID' } },
        },
      },
    });

    for (const l of loans) {
      const loanOutstanding = Number(l.outstandingPrincipal);
      const schedulePrincipalDue = l.schedule.reduce((sum, item) => sum + Number(item.principal), 0);
      const discrepancy = Math.abs(loanOutstanding - schedulePrincipalDue);

      if (discrepancy > 1.00) {
        const excId = `EXC-BAL-${l.id}`;
        if (!this.exceptions.has(excId)) {
          this.exceptions.set(excId, {
            exceptionId: excId,
            type: 'OUTSTANDING_BALANCE_MISMATCH',
            severity: 'CRITICAL',
            status: 'OPEN',
            loanId: l.id,
            loanNo: l.loanNo,
            discrepancyAmount: Number(discrepancy.toFixed(2)),
            whatHappened: `Loan #${l.loanNo} outstanding principal (₹${loanOutstanding.toLocaleString('en-IN')}) does not reconcile with unpaid schedule installments (₹${schedulePrincipalDue.toLocaleString('en-IN')}).`,
            evidence: `Loan Master Outstanding: ₹${loanOutstanding}, Schedule Remaining Principal: ₹${schedulePrincipalDue}, Delta: ₹${discrepancy.toFixed(2)}`,
            source: 'Ledger Audit Verifier',
            recommendedAction: 'Perform ledger adjustment or regenerate repayment amortization waterfall.',
            detectedAt: now,
          });
          exceptionsFound++;
        }
      }
    }

    // -------------------------------------------------------------------------
    // 3. Gateway / Verified Submission Reconciliation (Missing Transaction)
    // Verifies that customer submissions marked VERIFIED have a corresponding Payment record
    // -------------------------------------------------------------------------
    const verifiedSubmissions = await prisma.paymentSubmission.findMany({
      where: { status: 'VERIFIED' },
      include: { loan: { select: { loanNo: true } } },
    });

    for (const sub of verifiedSubmissions) {
      const match = payments.find((p) => p.loanId === sub.loanId && p.reference === sub.reference);
      if (!match) {
        const excId = `EXC-MISS-${sub.id}`;
        if (!this.exceptions.has(excId)) {
          this.exceptions.set(excId, {
            exceptionId: excId,
            type: 'MISSING_TRANSACTION',
            severity: 'HIGH',
            status: 'OPEN',
            loanId: sub.loanId,
            loanNo: sub.loan?.loanNo,
            reference: sub.reference,
            discrepancyAmount: Number(sub.amount),
            whatHappened: `Verified payment submission #${sub.submissionNo} (UTR: ${sub.reference}) has no corresponding Payment ledger record.`,
            evidence: `Submission UTR: ${sub.reference}, Amount: ₹${Number(sub.amount).toLocaleString('en-IN')}, Verified At: ${sub.verifiedAt?.toISOString() || 'N/A'}`,
            source: 'Gateway Reconciliation',
            recommendedAction: 'Post manual payment ledger entry or link submission to correct loan.',
            detectedAt: now,
          });
          exceptionsFound++;
        }
      }
    }

    // -------------------------------------------------------------------------
    // 4. Duplicate Transaction Detection
    // Checks for duplicate payment references with SUCCESS status
    // -------------------------------------------------------------------------
    const referenceMap = new Map<string, typeof payments>();
    for (const p of payments) {
      if (p.reference && p.reference.trim().length > 3) {
        const list = referenceMap.get(p.reference) || [];
        list.push(p);
        referenceMap.set(p.reference, list);
      }
    }

    for (const [ref, list] of referenceMap.entries()) {
      if (list.length > 1) {
        const excId = `EXC-DUP-${ref}`;
        if (!this.exceptions.has(excId)) {
          const totalDupAmount = list.reduce((sum, p) => sum + Number(p.amount), 0);
          this.exceptions.set(excId, {
            exceptionId: excId,
            type: 'DUPLICATE_TRANSACTION',
            severity: 'CRITICAL',
            status: 'OPEN',
            loanId: list[0].loanId,
            loanNo: list[0].loan?.loanNo,
            reference: ref,
            discrepancyAmount: totalDupAmount,
            whatHappened: `Multiple successful payment transactions (${list.length}) share identical bank reference / UTR '${ref}'.`,
            evidence: `Payments: ${list.map((p) => `#${p.paymentNo} (₹${p.amount})`).join(', ')}`,
            source: 'Duplicate Scanner',
            recommendedAction: 'Investigate potential duplicate bank debit and initiate payment reversal workflow if necessary.',
            detectedAt: now,
          });
          exceptionsFound++;
        }
      }
    }

    // -------------------------------------------------------------------------
    // 5. Disbursement Instruction vs Bank Status
    // -------------------------------------------------------------------------
    const activeLoans = await prisma.loan.findMany({
      where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
      include: {
        disbursements: true,
      },
    });
    for (const l of activeLoans || []) {
      const disbursements = l.disbursements || [];
      const hasCompletedDisb = disbursements.some((d) => d.status === 'COMPLETED');
      if (!hasCompletedDisb && disbursements.length > 0) {
        const excId = `EXC-DISB-${l.id}`;
        if (!this.exceptions.has(excId)) {
          this.exceptions.set(excId, {
            exceptionId: excId,
            type: 'DISBURSEMENT_STATUS_MISMATCH',
            severity: 'HIGH',
            status: 'OPEN',
            loanId: l.id,
            loanNo: l.loanNo,
            discrepancyAmount: Number(l.principal),
            whatHappened: `Loan #${l.loanNo} is marked ACTIVE/OVERDUE in core ledger, but disbursement status is '${l.disbursements[0]?.status}'.`,
            evidence: `Loan Status: ${l.status}, Disbursement ID: ${l.disbursements[0]?.id}, Disbursement Status: ${l.disbursements[0]?.status}`,
            source: 'Disbursement Reconciliation',
            recommendedAction: 'Confirm electronic fund transfer release with banking gateway.',
            detectedAt: now,
          });
          exceptionsFound++;
        }
      }
    }

    this.lastRunAt = now;
    return {
      scannedCount: payments.length + loans.length + verifiedSubmissions.length,
      exceptionsFound,
    };
  }

  /**
   * Returns executive dashboard KPI statistics for reconciliation.
   */
  public async getDashboardStats(actor: { id: string; roles: string[] }): Promise<ReconciliationDashboardStats> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot access reconciliation metrics.');
    }

    // Aggregate total payment volume from database
    const paymentAggregate = await prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    });
    const totalReconciledVolume = Number(paymentAggregate._sum.amount || 0);

    const activeExceptions = Array.from(this.exceptions.values()).filter((e) => e.status !== 'DISMISSED' && e.status !== 'ADJUSTED');
    const totalDiscrepancyAmount = activeExceptions.reduce((sum, e) => sum + e.discrepancyAmount, 0);

    const pendingAdjustments = Array.from(this.adjustments.values()).filter((a) => a.status === 'PENDING_APPROVAL');

    const byType: Record<FinancialExceptionType, number> = {
      ALLOCATION_MISMATCH: 0,
      OUTSTANDING_BALANCE_MISMATCH: 0,
      MISSING_TRANSACTION: 0,
      DUPLICATE_TRANSACTION: 0,
      DISBURSEMENT_STATUS_MISMATCH: 0,
      ORPHAN_TRANSACTION: 0,
    };

    const bySeverity = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };

    for (const e of activeExceptions) {
      byType[e.type] = (byType[e.type] || 0) + 1;
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
    }

    const healthPercent = totalReconciledVolume > 0
      ? Math.max(0, Math.min(100, Number(((1 - totalDiscrepancyAmount / totalReconciledVolume) * 100).toFixed(1))))
      : 100;

    return {
      totalReconciledVolume,
      reconciliationHealthPercent: healthPercent,
      totalActiveExceptions: activeExceptions.length,
      criticalExceptionsCount: bySeverity.CRITICAL,
      pendingAdjustmentsCount: pendingAdjustments.length,
      totalDiscrepancyAmount,
      byType,
      bySeverity,
      lastRunAt: this.lastRunAt,
    };
  }

  /**
   * Lists financial exceptions with query filtering.
   */
  public listExceptions(
    filters: {
      status?: string;
      severity?: string;
      type?: string;
      loanId?: string;
    },
    actor: { id: string; roles: string[] }
  ): FinancialException[] {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot access financial exceptions.');
    }

    let items = Array.from(this.exceptions.values());

    if (filters.status) items = items.filter((e) => e.status === filters.status);
    if (filters.severity) items = items.filter((e) => e.severity === filters.severity);
    if (filters.type) items = items.filter((e) => e.type === filters.type);
    if (filters.loanId) items = items.filter((e) => e.loanId === filters.loanId);

    const sevWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    return items.sort((a, b) => sevWeight[b.severity] - sevWeight[a.severity]);
  }

  /**
   * Proposes a formal ledger adjustment with Maker-Checker controls.
   */
  public async proposeAdjustment(
    params: {
      type: AdjustmentType;
      loanId: string;
      exceptionId?: string;
      amount: number;
      reason: string;
    },
    actor: { id: string; email: string; roles: string[] }
  ): Promise<LedgerAdjustment> {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot propose ledger adjustments.');
    }

    if (!params.reason || params.reason.trim().length < 5) {
      throw new BadRequestError('Mandatory audit rationale required to propose a financial adjustment.');
    }

    const loan = await prisma.loan.findUnique({
      where: { id: params.loanId },
      select: { loanNo: true },
    });
    if (!loan) {
      throw new NotFoundError(`Loan '${params.loanId}' not found.`);
    }

    // Maker-Checker threshold: Adjustments >= ₹5,000 or status corrections require approval
    const requiresApproval = params.amount >= 5000 || params.type === 'REVERSAL' || params.type === 'LEDGER_CORRECTION';
    const status: AdjustmentStatus = requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED';

    const adjustmentId = `ADJ-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const adjustment: LedgerAdjustment = {
      adjustmentId,
      type: params.type,
      loanId: params.loanId,
      loanNo: loan.loanNo,
      exceptionId: params.exceptionId,
      amount: Number(params.amount),
      reason: params.reason.trim(),
      proposedBy: actor.email,
      proposedAt: new Date().toISOString(),
      status,
      requiresApproval,
      approvedBy: requiresApproval ? undefined : actor.email,
      approvedAt: requiresApproval ? undefined : new Date().toISOString(),
    };

    this.adjustments.set(adjustmentId, adjustment);

    // If linked to an exception and approved, mark exception adjusted
    if (status === 'APPROVED' && params.exceptionId && this.exceptions.has(params.exceptionId)) {
      const exc = this.exceptions.get(params.exceptionId)!;
      exc.status = 'ADJUSTED';
      exc.resolutionNotes = `Resolved via auto-approved adjustment #${adjustmentId}`;
      exc.resolvedAt = new Date().toISOString();
      exc.resolvedBy = actor.email;
    }

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'LEDGER_ADJUSTMENT_PROPOSED',
      entity: 'LedgerAdjustment',
      entityId: adjustmentId,
      newValue: {
        type: params.type,
        amount: params.amount,
        loanId: params.loanId,
        status,
        requiresApproval,
      },
    }).catch(() => {});

    return adjustment;
  }

  /**
   * Approves a pending ledger adjustment (Maker-Checker Checker action).
   */
  public async approveAdjustment(
    adjustmentId: string,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<LedgerAdjustment> {
    const isAuthorized =
      actor.roles.includes('SUPER_ADMIN') ||
      actor.roles.includes('ADMIN') ||
      actor.roles.includes('FINANCE_OFFICER');

    if (!isAuthorized) {
      throw new ForbiddenError('Unauthorized: Only Finance Officers and Administrators can approve ledger adjustments.');
    }

    const adj = this.adjustments.get(adjustmentId);
    if (!adj) {
      throw new NotFoundError(`Adjustment #${adjustmentId} not found.`);
    }

    if (adj.status !== 'PENDING_APPROVAL') {
      throw new BadRequestError(`Adjustment is already '${adj.status}'.`);
    }

    // Segregation of duties: Maker cannot approve their own adjustment (unless Super Admin in dev)
    if (adj.proposedBy === actor.email && !actor.roles.includes('SUPER_ADMIN')) {
      throw new ForbiddenError('Maker-Checker Violation: You cannot approve an adjustment you proposed.');
    }

    adj.status = 'APPROVED';
    adj.approvedBy = actor.email;
    adj.approvedAt = new Date().toISOString();

    // Update linked exception if present
    if (adj.exceptionId && this.exceptions.has(adj.exceptionId)) {
      const exc = this.exceptions.get(adj.exceptionId)!;
      exc.status = 'ADJUSTED';
      exc.resolutionNotes = `Resolved via approved adjustment #${adj.adjustmentId} by ${actor.email}`;
      exc.resolvedAt = new Date().toISOString();
      exc.resolvedBy = actor.email;
    }

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'LEDGER_ADJUSTMENT_APPROVED',
      entity: 'LedgerAdjustment',
      entityId: adjustmentId,
      newValue: { approvedBy: actor.email, amount: adj.amount },
    }).catch(() => {});

    return adj;
  }

  /**
   * Rejects a pending ledger adjustment.
   */
  public async rejectAdjustment(
    adjustmentId: string,
    rejectionReason: string,
    actor: { id: string; email: string; roles: string[] }
  ): Promise<LedgerAdjustment> {
    const isAuthorized =
      actor.roles.includes('SUPER_ADMIN') ||
      actor.roles.includes('ADMIN') ||
      actor.roles.includes('FINANCE_OFFICER');

    if (!isAuthorized) {
      throw new ForbiddenError('Unauthorized: Only Finance Officers and Administrators can reject adjustments.');
    }

    const adj = this.adjustments.get(adjustmentId);
    if (!adj) {
      throw new NotFoundError(`Adjustment #${adjustmentId} not found.`);
    }

    if (adj.status !== 'PENDING_APPROVAL') {
      throw new BadRequestError(`Adjustment is already '${adj.status}'.`);
    }

    adj.status = 'REJECTED';
    adj.rejectionReason = rejectionReason || 'Rejected by finance committee.';

    await logAudit({
      userId: actor.id,
      role: actor.roles[0],
      action: 'LEDGER_ADJUSTMENT_REJECTED',
      entity: 'LedgerAdjustment',
      entityId: adjustmentId,
      newValue: { rejectedBy: actor.email, reason: adj.rejectionReason },
    }).catch(() => {});

    return adj;
  }

  /**
   * Lists adjustments with status filtering.
   */
  public listAdjustments(actor: { id: string; roles: string[] }): LedgerAdjustment[] {
    if (actor.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view adjustments.');
    }

    return Array.from(this.adjustments.values()).sort(
      (a, b) => new Date(b.proposedAt).getTime() - new Date(a.proposedAt).getTime()
    );
  }

  public clearForTesting(): void {
    this.exceptions.clear();
    this.adjustments.clear();
  }
}

export const reconciliationService = ReconciliationService.getInstance();
