import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import {
  ManualJournalRecord,
  ManualJournalLineRecord,
  ManualJournalLineInput,
  ManualJournalStatus,
  JournalSourceType,
} from './accounting.types';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../common/errors';
import { generalLedgerService } from '../finance/gl.service';
import { chartOfAccountsService } from './chart-of-accounts.service';
import { accountingPeriodService } from './accounting-period.service';
import { logAudit } from '../audit/audit.service';
import { JournalEntryLine } from '../finance/gl.types';

export class JournalService {
  private journals: Map<string, ManualJournalRecord> = new Map();

  /**
   * Validate double entry lines and compute totals
   */
  private validateAndCalculateLines(lines: ManualJournalLineInput[]): {
    totalDebit: Decimal;
    totalCredit: Decimal;
    formattedLines: ManualJournalLineRecord[];
  } {
    if (!lines || lines.length < 2) {
      throw new BadRequestError('A valid manual journal must contain at least 2 lines (Debits and Credits).');
    }

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);
    const formattedLines: ManualJournalLineRecord[] = [];

    for (const line of lines) {
      const acc = chartOfAccountsService.getAccount(line.accountCode);
      if (!acc) {
        throw new BadRequestError(`Invalid account code "${line.accountCode}". Account not found in Chart of Accounts.`);
      }

      if (!acc.isActive) {
        throw new BadRequestError(`Account "${line.accountCode}" (${acc.name}) is inactive and cannot be posted to.`);
      }

      const amount = new Decimal(line.amount || 0);
      if (amount.lessThanOrEqualTo(0)) {
        throw new BadRequestError(`Amount for account ${line.accountCode} must be strictly positive.`);
      }

      if (line.direction === 'DEBIT') {
        totalDebit = totalDebit.plus(amount);
      } else if (line.direction === 'CREDIT') {
        totalCredit = totalCredit.plus(amount);
      } else {
        throw new BadRequestError(`Invalid direction "${line.direction}". Must be DEBIT or CREDIT.`);
      }

      formattedLines.push({
        id: `line-${uuid().slice(0, 8)}`,
        accountCode: line.accountCode,
        accountName: acc.name,
        direction: line.direction,
        amount: amount.toNumber(),
        description: line.description,
      });
    }

    const diff = totalDebit.minus(totalCredit).abs();
    if (diff.greaterThan(0.001)) {
      throw new BadRequestError(
        `Journal entry out of balance: Total Debits (₹${totalDebit.toFixed(2)}) != Total Credits (₹${totalCredit.toFixed(2)}). Imbalance: ₹${diff.toFixed(2)}.`
      );
    }

    return { totalDebit, totalCredit, formattedLines };
  }

  /**
   * Create a new manual journal entry (Maker action)
   */
  public createJournal(input: {
    tenantId: string;
    branchId?: string;
    transactionDate?: string;
    description: string;
    source?: JournalSourceType;
    reference?: string;
    lines: ManualJournalLineInput[];
    userId: string;
    userName?: string;
    submitImmediately?: boolean;
  }): ManualJournalRecord {
    const txDate = input.transactionDate || new Date().toISOString();

    // Verify accounting period is open
    accountingPeriodService.assertPeriodOpenForDate(txDate, input.tenantId);

    const activePeriod =
      accountingPeriodService.getPeriod(txDate.slice(0, 7), input.tenantId) ||
      accountingPeriodService.getCurrentOpenPeriod(input.tenantId);

    const periodId = activePeriod?.id || `period-${input.tenantId}-${txDate.slice(0, 7)}`;
    const periodCode = activePeriod?.periodCode || txDate.slice(0, 7);

    const { totalDebit, totalCredit, formattedLines } = this.validateAndCalculateLines(input.lines);

    const id = `MJ-${uuid().slice(0, 8).toUpperCase()}`;
    const journalNumber = `JRN-${Date.now().toString().slice(-8)}`;
    const now = new Date().toISOString();
    const status: ManualJournalStatus = input.submitImmediately ? 'SUBMITTED' : 'DRAFT';

    const journal: ManualJournalRecord = {
      id,
      journalNumber,
      tenantId: input.tenantId,
      branchId: input.branchId,
      periodId,
      periodCode,
      transactionDate: txDate,
      description: input.description,
      source: input.source || 'MANUAL',
      reference: input.reference,
      lines: formattedLines,
      totalDebit: totalDebit.toNumber(),
      totalCredit: totalCredit.toNumber(),
      status,
      createdByUserId: input.userId,
      createdByUserName: input.userName || 'Finance Maker',
      submittedByUserId: input.submitImmediately ? input.userId : undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.journals.set(id, journal);

    logAudit({
      tenantId: input.tenantId,
      userId: input.userId,
      action: 'MANUAL_JOURNAL_CREATED',
      entity: 'ManualJournal',
      entityId: id,
      newValue: { journalNumber, status, totalDebit: journal.totalDebit, description: input.description },
    });

    return journal;
  }

  /**
   * Submit a draft manual journal for checker review
   */
  public submitJournal(journalId: string, userId: string, tenantId?: string): ManualJournalRecord {
    const journal = this.getJournal(journalId);
    if (!journal) {
      throw new NotFoundError(`Journal "${journalId}" not found.`);
    }

    if (tenantId && journal.tenantId !== tenantId) {
      throw new UnauthorizedError('Unauthorized access to tenant journal.');
    }

    if (journal.status !== 'DRAFT') {
      throw new BadRequestError(`Cannot submit journal with status "${journal.status}". Must be DRAFT.`);
    }

    journal.status = 'SUBMITTED';
    journal.submittedByUserId = userId;
    journal.updatedAt = new Date().toISOString();

    logAudit({
      tenantId: journal.tenantId,
      userId,
      action: 'MANUAL_JOURNAL_SUBMITTED',
      entity: 'ManualJournal',
      entityId: journal.id,
      newValue: { journalNumber: journal.journalNumber },
    });

    return journal;
  }

  /**
   * Approve a manual journal (Checker action with strict Segregation of Duties)
   */
  public approveJournal(
    journalId: string,
    checkerUserId: string,
    checkerUserName?: string,
    tenantId?: string
  ): ManualJournalRecord {
    const journal = this.getJournal(journalId);
    if (!journal) {
      throw new NotFoundError(`Journal "${journalId}" not found.`);
    }

    if (tenantId && journal.tenantId !== tenantId) {
      throw new UnauthorizedError('Unauthorized access to tenant journal.');
    }

    if (journal.status !== 'SUBMITTED') {
      throw new BadRequestError(`Cannot approve journal with status "${journal.status}". Must be SUBMITTED.`);
    }

    // Maker-Checker Segregation of Duties Invariant
    if (journal.createdByUserId === checkerUserId) {
      throw new BadRequestError(
        'Segregation of Duties Violation: The maker who created the manual journal cannot approve or post it.'
      );
    }

    const now = new Date().toISOString();
    journal.status = 'APPROVED';
    journal.approvedByUserId = checkerUserId;
    journal.approvedByUserName = checkerUserName || 'Finance Checker';
    journal.approvedAt = now;
    journal.updatedAt = now;

    logAudit({
      tenantId: journal.tenantId,
      userId: checkerUserId,
      action: 'MANUAL_JOURNAL_APPROVED',
      entity: 'ManualJournal',
      entityId: journal.id,
      newValue: { journalNumber: journal.journalNumber, approvedBy: checkerUserId },
    });

    return journal;
  }

  /**
   * Post an approved manual journal to General Ledger
   */
  public async postJournal(
    journalId: string,
    posterUserId: string,
    tenantId?: string
  ): Promise<ManualJournalRecord> {
    const journal = this.getJournal(journalId);
    if (!journal) {
      throw new NotFoundError(`Journal "${journalId}" not found.`);
    }

    if (tenantId && journal.tenantId !== tenantId) {
      throw new UnauthorizedError('Unauthorized access to tenant journal.');
    }

    if (journal.status !== 'APPROVED' && journal.status !== 'SUBMITTED') {
      throw new BadRequestError(`Cannot post journal with status "${journal.status}". Must be APPROVED.`);
    }

    // Maker-Checker check
    if (journal.createdByUserId === posterUserId) {
      throw new BadRequestError(
        'Segregation of Duties Violation: Maker cannot post their own manual journal.'
      );
    }

    // Ensure period is open
    accountingPeriodService.assertPeriodOpenForDate(journal.transactionDate, journal.tenantId);

    // Map to GL lines
    const glLines: JournalEntryLine[] = journal.lines.map((l) => ({
      accountCode: l.accountCode,
      accountName: l.accountName,
      direction: l.direction,
      amount: l.amount,
      description: l.description || journal.description,
    }));

    // Post to General Ledger engine
    const glEntry = await generalLedgerService.createJournalEntry({
      tenantId: journal.tenantId,
      branchId: journal.branchId,
      referenceType: 'MANUAL_JOURNAL',
      referenceId: journal.journalNumber,
      transactionDate: journal.transactionDate,
      description: `[${journal.journalNumber}] ${journal.description}`,
      lines: glLines,
      postedBy: posterUserId,
    });

    const now = new Date().toISOString();
    journal.status = 'POSTED';
    journal.glJournalId = glEntry.id;
    journal.updatedAt = now;

    logAudit({
      tenantId: journal.tenantId,
      userId: posterUserId,
      action: 'MANUAL_JOURNAL_POSTED',
      entity: 'ManualJournal',
      entityId: journal.id,
      newValue: { journalNumber: journal.journalNumber, glJournalId: glEntry.id },
    });

    return journal;
  }

  /**
   * Reject a submitted manual journal
   */
  public rejectJournal(
    journalId: string,
    checkerUserId: string,
    reason: string,
    tenantId?: string
  ): ManualJournalRecord {
    const journal = this.getJournal(journalId);
    if (!journal) {
      throw new NotFoundError(`Journal "${journalId}" not found.`);
    }

    if (tenantId && journal.tenantId !== tenantId) {
      throw new UnauthorizedError('Unauthorized access to tenant journal.');
    }

    if (journal.status !== 'SUBMITTED' && journal.status !== 'APPROVED') {
      throw new BadRequestError(`Cannot reject journal with status "${journal.status}".`);
    }

    if (!reason || reason.trim().length < 5) {
      throw new BadRequestError('A valid reason (minimum 5 characters) is required to reject a manual journal.');
    }

    journal.status = 'REJECTED';
    journal.rejectionReason = reason.trim();
    journal.updatedAt = new Date().toISOString();

    logAudit({
      tenantId: journal.tenantId,
      userId: checkerUserId,
      action: 'MANUAL_JOURNAL_REJECTED',
      entity: 'ManualJournal',
      entityId: journal.id,
      newValue: { journalNumber: journal.journalNumber, reason },
    });

    return journal;
  }

  /**
   * Reverse an already posted manual journal (Generates double-entry inverted compensating entry)
   */
  public async reverseJournal(
    journalId: string,
    userId: string,
    reason: string,
    tenantId?: string
  ): Promise<{ originalJournal: ManualJournalRecord; reversalJournal: ManualJournalRecord }> {
    const journal = this.getJournal(journalId);
    if (!journal) {
      throw new NotFoundError(`Journal "${journalId}" not found.`);
    }

    if (tenantId && journal.tenantId !== tenantId) {
      throw new UnauthorizedError('Unauthorized access to tenant journal.');
    }

    if (journal.status !== 'POSTED') {
      throw new BadRequestError(`Cannot reverse journal with status "${journal.status}". Only POSTED journals can be reversed.`);
    }

    if (journal.reversalJournalId) {
      throw new BadRequestError(`Journal "${journal.journalNumber}" has already been reversed.`);
    }

    if (!reason || reason.trim().length < 5) {
      throw new BadRequestError('A clear audit reason (minimum 5 characters) is required to reverse a manual journal.');
    }

    // Invert directions for compensating journal
    const invertedLines: ManualJournalLineInput[] = journal.lines.map((l) => ({
      accountCode: l.accountCode,
      direction: l.direction === 'DEBIT' ? 'CREDIT' : 'DEBIT',
      amount: l.amount,
      description: `Reversal of line ${l.id}: ${l.description || journal.description}`,
    }));

    const now = new Date().toISOString();

    // Ensure current period is open for posting reversal
    accountingPeriodService.assertPeriodOpenForDate(now, journal.tenantId);

    // Create and post reversal journal
    const reversalJournal = this.createJournal({
      tenantId: journal.tenantId,
      branchId: journal.branchId,
      transactionDate: now,
      description: `REVERSAL of [${journal.journalNumber}] - ${reason.trim()}`,
      source: 'CORRECTION',
      reference: journal.journalNumber,
      lines: invertedLines,
      userId,
      submitImmediately: true,
    });

    // Auto-approve and post reversal
    reversalJournal.status = 'APPROVED';
    reversalJournal.approvedByUserId = userId;

    const glReversalLines: JournalEntryLine[] = reversalJournal.lines.map((l) => ({
      accountCode: l.accountCode,
      accountName: l.accountName,
      direction: l.direction,
      amount: l.amount,
      description: reversalJournal.description,
    }));

    const glEntry = await generalLedgerService.createJournalEntry({
      tenantId: journal.tenantId,
      branchId: journal.branchId,
      referenceType: 'MANUAL_JOURNAL',
      referenceId: reversalJournal.journalNumber,
      transactionDate: now,
      description: reversalJournal.description,
      lines: glReversalLines,
      postedBy: userId,
    });

    reversalJournal.status = 'POSTED';
    reversalJournal.glJournalId = glEntry.id;
    reversalJournal.updatedAt = now;

    journal.status = 'REVERSED';
    journal.reversalJournalId = reversalJournal.id;
    journal.updatedAt = now;

    logAudit({
      tenantId: journal.tenantId,
      userId,
      action: 'MANUAL_JOURNAL_REVERSED',
      entity: 'ManualJournal',
      entityId: journal.id,
      newValue: { originalJournal: journal.journalNumber, reversalJournal: reversalJournal.journalNumber, reason },
    });

    return { originalJournal: journal, reversalJournal };
  }

  /**
   * List manual journals with filter parameters
   */
  public listJournals(params?: {
    tenantId?: string;
    status?: ManualJournalStatus;
    periodCode?: string;
    source?: JournalSourceType;
    limit?: number;
  }): ManualJournalRecord[] {
    let list = Array.from(this.journals.values());

    if (params?.tenantId) {
      list = list.filter((j) => j.tenantId === params.tenantId);
    }
    if (params?.status) {
      list = list.filter((j) => j.status === params.status);
    }
    if (params?.periodCode) {
      list = list.filter((j) => j.periodCode === params.periodCode);
    }
    if (params?.source) {
      list = list.filter((j) => j.source === params.source);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(0, params?.limit || 100);
  }

  /**
   * Get single journal by ID
   */
  public getJournal(id: string): ManualJournalRecord | undefined {
    return this.journals.get(id);
  }
}

export const journalService = new JournalService();
