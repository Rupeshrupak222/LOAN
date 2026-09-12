import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import { generalLedgerService } from '../finance/gl.service';
import type { WriteOffRequestRecord, WriteOffStatus } from './collection.types';

export interface ProposeWriteOffInput {
  caseId: string;
  reason: string;
  recoveryExhaustionSummary: string;
}

export class CollectionWriteOffService {
  private writeOffs: Map<string, WriteOffRequestRecord> = new Map();

  /**
   * Propose bad debt write-off for an unrecoverable delinquent account (Maker)
   */
  public async proposeWriteOff(
    input: ProposeWriteOffInput,
    actor: { id: string; email?: string; roles?: string[]; tenantId?: string; branchId?: string }
  ): Promise<WriteOffRequestRecord> {
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

    if (colCase.dpd < 90) {
      throw new BadRequestError(`Loan must have at least 90 DPD for write-off consideration (current DPD: ${colCase.dpd}).`);
    }

    let principalDue = new Decimal(0);
    let interestDue = new Decimal(0);
    let penaltiesDue = new Decimal(0);

    for (const item of colCase.loan.schedule) {
      principalDue = principalDue.plus(new Decimal(item.principal).minus(item.paidAmount || 0).clamp(0, item.principal));
      interestDue = interestDue.plus(new Decimal(item.interest || 0));
      penaltiesDue = penaltiesDue.plus(new Decimal(item.penaltyAmount || 0));
    }

    const totalWriteOff = principalDue.plus(interestDue).plus(penaltiesDue);

    const writeOff: WriteOffRequestRecord = {
      id: `wrof-${uuid().slice(0, 8)}`,
      caseId: input.caseId,
      loanId: colCase.loanId,
      customerId: colCase.customerId,
      tenantId: colCase.loan.tenantId || actor.tenantId,
      principalOutstanding: principalDue.toNumber(),
      interestOutstanding: interestDue.toNumber(),
      penaltiesOutstanding: penaltiesDue.toNumber(),
      totalWriteOffAmount: totalWriteOff.toNumber(),
      dpd: colCase.dpd,
      reason: input.reason,
      recoveryExhaustionSummary: input.recoveryExhaustionSummary,
      status: 'PENDING_APPROVAL',
      proposedByUserId: actor.email || actor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.writeOffs.set(writeOff.id, writeOff);

    await prisma.collectionActivity.create({
      data: {
        caseId: input.caseId,
        activityType: 'LEGAL',
        outcome: 'ESCALATED',
        notes: `Bad debt write-off proposed for ₹${totalWriteOff.toFixed(2)} (DPD ${colCase.dpd}). Reason: ${input.reason}`,
        performedBy: actor.email || 'officer',
      },
    });

    await logAudit({
      userId: actor.id,
      action: 'WRITEOFF_REQUEST_PROPOSED',
      entity: 'WriteOffRequest',
      entityId: writeOff.id,
      newValue: {
        caseId: input.caseId,
        loanId: colCase.loanId,
        totalAmount: totalWriteOff.toNumber(),
        tenantId: colCase.loan.tenantId,
      },
    });

    return writeOff;
  }

  /**
   * Authorize or reject bad debt write-off (Checker) with SoD enforcement and GL posting
   */
  public async authorizeWriteOff(
    writeOffId: string,
    action: 'APPROVE' | 'REJECT',
    rejectionReason: string | undefined,
    checker: { id: string; email?: string; roles?: string[]; tenantId?: string }
  ): Promise<WriteOffRequestRecord> {
    const writeOff = this.writeOffs.get(writeOffId);
    if (!writeOff) {
      throw new NotFoundError(`Write-off request ${writeOffId} not found.`);
    }

    if (writeOff.status !== 'PENDING_APPROVAL') {
      throw new BadRequestError(`Write-off request is not pending approval (current status: ${writeOff.status}).`);
    }

    // Segregation of Duties (SoD) Violation check
    const checkerIdentifier = checker.email || checker.id;
    if (checkerIdentifier === writeOff.proposedByUserId) {
      throw new ForbiddenError('Segregation of Duties Violation: You cannot approve your own bad debt write-off request.');
    }

    if (action === 'REJECT') {
      const rejected: WriteOffRequestRecord = {
        ...writeOff,
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Rejected by credit committee.',
        approvedByUserId: checkerIdentifier,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.writeOffs.set(writeOffId, rejected);
      return rejected;
    }

    const loan = await prisma.loan.findUnique({
      where: { id: writeOff.loanId },
    });
    if (!loan) throw new NotFoundError('Loan not found.');

    // Post Double-Entry General Ledger Journal for Bad Debt Charge-Off
    const glEntry = await generalLedgerService.postWriteOffJournal({
      writeOffId: writeOff.id,
      loanId: loan.id,
      loanNo: loan.loanNo,
      tenantId: loan.tenantId || undefined,
      branchId: loan.branchId || undefined,
      writeOffPrincipal: writeOff.principalOutstanding,
      writeOffInterest: writeOff.interestOutstanding,
      writeOffPenalties: writeOff.penaltiesOutstanding,
      reason: writeOff.reason,
      postedBy: checkerIdentifier,
    });

    const approved: WriteOffRequestRecord = {
      ...writeOff,
      status: 'APPROVED',
      approvedByUserId: checkerIdentifier,
      approvedAt: new Date().toISOString(),
      journalEntryId: glEntry.id,
      updatedAt: new Date().toISOString(),
    };
    this.writeOffs.set(writeOffId, approved);

    // Update Loan and Case status in database to WRITTEN_OFF without deleting historical records
    await prisma.loan.update({
      where: { id: loan.id },
      data: { status: 'OVERDUE' }, // Preserves loan history, marks as written-off in collections
    });

    await prisma.collectionCase.update({
      where: { id: writeOff.caseId },
      data: { status: 'WRITTEN_OFF' },
    });

    await logAudit({
      userId: checker.id,
      action: 'WRITEOFF_REQUEST_APPROVED',
      entity: 'WriteOffRequest',
      entityId: writeOffId,
      newValue: {
        writeOffId,
        loanId: writeOff.loanId,
        journalEntryId: glEntry.id,
        approvedBy: checkerIdentifier,
      },
    });

    return approved;
  }

  /**
   * List write-off requests
   */
  public listWriteOffs(caseId?: string, loanId?: string): WriteOffRequestRecord[] {
    let list = Array.from(this.writeOffs.values());
    if (caseId) list = list.filter((w) => w.caseId === caseId);
    if (loanId) list = list.filter((w) => w.loanId === loanId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export const collectionWriteOffService = new CollectionWriteOffService();
