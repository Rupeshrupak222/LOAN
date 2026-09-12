import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { generalLedgerService } from '../finance/gl.service';
import { Money } from '../finance/money';
import type { SettlementRequestRecord, SettlementStatus } from './collection.types';

export interface ProposeSettlementInput {
  caseId: string;
  proposedSettlementAmount: number;
  waivedPenalties?: number;
  waivedInterest?: number;
  waivedPrincipal?: number;
  reason: string;
  validityDays?: number;
}

export class CollectionSettlementService {
  private settlements: Map<string, SettlementRequestRecord> = new Map();

  /**
   * Propose a debt settlement and waiver agreement (Maker)
   */
  public async proposeSettlement(
    input: ProposeSettlementInput,
    actor: { id: string; email?: string; roles?: string[]; tenantId?: string; branchId?: string }
  ): Promise<SettlementRequestRecord> {
    const colCase = await prisma.collectionCase.findUnique({
      where: { id: input.caseId },
      include: {
        loan: {
          include: { schedule: true },
        },
      },
    });

    if (!colCase) {
      throw new NotFoundError(`Collection case ${input.caseId} not found.`);
    }

    // Calculate outstanding breakdown
    let principalDue = new Decimal(0);
    let interestDue = new Decimal(0);
    let penaltiesDue = new Decimal(0);

    for (const item of colCase.loan.schedule) {
      principalDue = principalDue.plus(new Decimal(item.principal).minus(item.paidAmount || 0).clamp(0, item.principal));
      interestDue = interestDue.plus(new Decimal(item.interest || 0));
      penaltiesDue = penaltiesDue.plus(new Decimal(item.penaltyAmount || 0));
    }

    const totalOutstanding = principalDue.plus(interestDue).plus(penaltiesDue);
    const proposedSettlement = new Decimal(input.proposedSettlementAmount);

    if (proposedSettlement.lessThanOrEqualTo(0) || proposedSettlement.greaterThan(totalOutstanding)) {
      throw new BadRequestError(`Proposed settlement amount must be positive and not exceed total outstanding (₹${totalOutstanding.toFixed(2)}).`);
    }

    const totalWaiver = totalOutstanding.minus(proposedSettlement);
    const discountPct = Number(totalWaiver.dividedBy(totalOutstanding).times(100).toFixed(2));

    const validityDays = input.validityDays || 30;
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + validityDays);

    const settlement: SettlementRequestRecord = {
      id: `setl-${uuid().slice(0, 8)}`,
      caseId: input.caseId,
      loanId: colCase.loanId,
      customerId: colCase.customerId,
      tenantId: colCase.loan.tenantId || actor.tenantId,
      totalOutstanding: totalOutstanding.toNumber(),
      principalOutstanding: principalDue.toNumber(),
      interestOutstanding: interestDue.toNumber(),
      penaltiesOutstanding: penaltiesDue.toNumber(),
      proposedSettlementAmount: proposedSettlement.toNumber(),
      proposedWaiverAmount: totalWaiver.toNumber(),
      discountPct,
      reason: input.reason,
      validityDate: validityDate.toISOString(),
      status: 'PENDING_APPROVAL',
      proposedByUserId: actor.email || actor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.settlements.set(settlement.id, settlement);

    // Update case status to SETTLEMENT_REVIEW
    await prisma.collectionCase.update({
      where: { id: input.caseId },
      data: { status: 'SETTLEMENT_REVIEW' },
    });

    await prisma.collectionActivity.create({
      data: {
        caseId: input.caseId,
        activityType: 'LEGAL',
        outcome: 'SETTLEMENT_REQUESTED',
        notes: `Proposed One-Time Settlement (OTS) for ₹${proposedSettlement.toFixed(2)} (${discountPct}% waiver of ₹${totalWaiver.toFixed(2)}). Reason: ${input.reason}`,
        performedBy: actor.email || 'officer',
      },
    });

    await logAudit({
      userId: actor.id,
      action: 'SETTLEMENT_REQUEST_PROPOSED',
      entity: 'SettlementRequest',
      entityId: settlement.id,
      newValue: {
        caseId: input.caseId,
        loanId: colCase.loanId,
        settlementAmount: settlement.proposedSettlementAmount,
        waiverAmount: settlement.proposedWaiverAmount,
        discountPct,
        tenantId: colCase.loan.tenantId,
      },
    });

    return settlement;
  }

  /**
   * Authorize or reject a settlement proposal (Checker) with SoD enforcement
   */
  public async authorizeSettlement(
    settlementId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason: string | undefined,
    checker: { id: string; email?: string; roles?: string[]; tenantId?: string }
  ): Promise<SettlementRequestRecord> {
    const settlement = this.settlements.get(settlementId);
    if (!settlement) {
      throw new NotFoundError(`Settlement request ${settlementId} not found.`);
    }

    if (settlement.status !== 'PENDING_APPROVAL') {
      throw new BadRequestError(`Settlement request is not pending approval (current status: ${settlement.status}).`);
    }

    // Segregation of Duties (SoD): Checker cannot be the same user as Maker
    const checkerIdentifier = checker.email || checker.id;
    if (checkerIdentifier === settlement.proposedByUserId) {
      throw new ForbiddenError('Segregation of Duties Violation: You cannot approve your own debt settlement proposal.');
    }

    if (action === 'REJECT') {
      const rejected: SettlementRequestRecord = {
        ...settlement,
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Rejected by credit authority.',
        approvedByUserId: checkerIdentifier,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.settlements.set(settlementId, rejected);

      await prisma.collectionCase.update({
        where: { id: settlement.caseId },
        data: { status: 'IN_PROGRESS' },
      });

      return rejected;
    }

    // Approval path
    const approved: SettlementRequestRecord = {
      ...settlement,
      status: 'APPROVED',
      approvedByUserId: checkerIdentifier,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.settlements.set(settlementId, approved);

    await logAudit({
      userId: checker.id,
      action: 'SETTLEMENT_REQUEST_APPROVED',
      entity: 'SettlementRequest',
      entityId: settlementId,
      newValue: {
        settlementId,
        loanId: settlement.loanId,
        approvedBy: checkerIdentifier,
      },
    });

    return approved;
  }

  /**
   * Finalize settlement upon receiving full agreed settlement payment
   */
  public async finalizeSettlementOnPayment(params: {
    settlementId: string;
    paymentAmount: number;
    paymentNo: string;
    actor?: { id?: string; email?: string };
  }): Promise<SettlementRequestRecord> {
    const settlement = this.settlements.get(params.settlementId);
    if (!settlement) throw new NotFoundError(`Settlement ${params.settlementId} not found.`);

    if (settlement.status !== 'APPROVED') {
      throw new BadRequestError(`Cannot finalize settlement in status ${settlement.status}. Must be APPROVED.`);
    }

    const loan = await prisma.loan.findUnique({
      where: { id: settlement.loanId },
    });
    if (!loan) throw new NotFoundError('Loan not found.');

    // Post Double-Entry General Ledger Journal for Waiver
    const glEntry = await generalLedgerService.postSettlementWaiverJournal({
      settlementId: settlement.id,
      loanId: loan.id,
      loanNo: loan.loanNo,
      tenantId: loan.tenantId || undefined,
      branchId: loan.branchId || undefined,
      waivedPrincipal: settlement.principalOutstanding > settlement.proposedSettlementAmount
        ? settlement.principalOutstanding - settlement.proposedSettlementAmount
        : 0,
      waivedInterest: settlement.interestOutstanding,
      waivedPenalties: settlement.penaltiesOutstanding,
      reason: settlement.reason,
      postedBy: params.actor?.email || 'SETTLEMENT_EXECUTOR',
    });

    const finalized: SettlementRequestRecord = {
      ...settlement,
      status: 'SETTLED',
      journalEntryId: glEntry.id,
      updatedAt: new Date().toISOString(),
    };
    this.settlements.set(settlement.id, finalized);

    // Update Loan and Case status in database
    await prisma.loan.update({
      where: { id: loan.id },
      data: { status: 'CLOSED' },
    });

    await prisma.collectionCase.update({
      where: { id: settlement.caseId },
      data: { status: 'CLOSED', overdueAmount: 0, dpd: 0 },
    });

    return finalized;
  }

  /**
   * List settlements for a case or loan
   */
  public listSettlements(caseId?: string, loanId?: string): SettlementRequestRecord[] {
    let list = Array.from(this.settlements.values());
    if (caseId) list = list.filter((s) => s.caseId === caseId);
    if (loanId) list = list.filter((s) => s.loanId === loanId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const collectionSettlementService = new CollectionSettlementService();
