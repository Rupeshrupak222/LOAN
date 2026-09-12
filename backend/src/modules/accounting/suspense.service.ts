import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import {
  SuspenseEntryRecord,
  SuspenseStatus,
} from './accounting.types';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { generalLedgerService } from '../finance/gl.service';
import { chartOfAccountsService } from './chart-of-accounts.service';
import { accountingPeriodService } from './accounting-period.service';
import { logAudit } from '../audit/audit.service';
import { JournalEntryLine } from '../finance/gl.types';

export class SuspenseService {
  private suspenseEntries: Map<string, SuspenseEntryRecord> = new Map();

  /**
   * Create an unallocated / suspense entry awaiting resolution
   */
  public async createSuspenseEntry(input: {
    tenantId: string;
    reference: string;
    amount: number;
    direction: 'DEBIT' | 'CREDIT';
    entryDate?: string;
    reason: string;
    assignedOwner?: string;
    userId?: string;
    postGl?: boolean;
  }): Promise<SuspenseEntryRecord> {
    if (input.amount <= 0) {
      throw new BadRequestError('Suspense amount must be strictly positive.');
    }

    const entryDate = input.entryDate || new Date().toISOString();
    accountingPeriodService.assertPeriodOpenForDate(entryDate, input.tenantId);

    const id = `SUSP-${uuid().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const record: SuspenseEntryRecord = {
      id,
      tenantId: input.tenantId,
      reference: input.reference,
      amount: input.amount,
      direction: input.direction,
      entryDate,
      reason: input.reason,
      assignedOwner: input.assignedOwner,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    if (input.postGl) {
      const suspenseAcc = chartOfAccountsService.getAccount('1099')!;
      const bankAcc = chartOfAccountsService.getAccount('1010')!;

      const lines: JournalEntryLine[] =
        input.direction === 'CREDIT'
          ? [
              {
                accountCode: '1010',
                accountName: bankAcc.name,
                direction: 'DEBIT',
                amount: input.amount,
                description: `Bank inbound receipt parked in suspense: ${input.reason}`,
              },
              {
                accountCode: '1099',
                accountName: suspenseAcc.name,
                direction: 'CREDIT',
                amount: input.amount,
                description: `Suspense clearing liability parked for ref ${input.reference}`,
              },
            ]
          : [
              {
                accountCode: '1099',
                accountName: suspenseAcc.name,
                direction: 'DEBIT',
                amount: input.amount,
                description: `Unidentified debit parked in suspense: ${input.reason}`,
              },
              {
                accountCode: '1010',
                accountName: bankAcc.name,
                direction: 'CREDIT',
                amount: input.amount,
                description: `Bank disbursement parked in suspense for ref ${input.reference}`,
              },
            ];

      await generalLedgerService.createJournalEntry({
        tenantId: input.tenantId,
        referenceType: 'MANUAL_JOURNAL',
        referenceId: id,
        transactionDate: entryDate,
        description: `Suspense Entry Parked: [${input.reference}] ${input.reason}`,
        lines,
        postedBy: input.userId || 'SUSPENSE_ENGINE',
      });
    }

    this.suspenseEntries.set(id, record);

    logAudit({
      tenantId: input.tenantId,
      userId: input.userId || 'SYSTEM',
      action: 'SUSPENSE_ENTRY_CREATED',
      entity: 'SuspenseEntry',
      entityId: id,
      newValue: { reference: input.reference, amount: input.amount, reason: input.reason },
    });

    return record;
  }

  /**
   * Resolve suspense entry by posting a GL resolution journal to target account
   */
  public async resolveSuspenseEntry(
    suspenseId: string,
    params: {
      targetAccountCode: string;
      resolutionNotes: string;
      userId: string;
      tenantId?: string;
    }
  ): Promise<SuspenseEntryRecord> {
    const entry = this.getSuspenseEntry(suspenseId);
    if (!entry) {
      throw new NotFoundError(`Suspense entry "${suspenseId}" not found.`);
    }

    if (params.tenantId && entry.tenantId !== params.tenantId) {
      throw new BadRequestError('Tenant mismatch for suspense entry.');
    }

    if (entry.status === 'RESOLVED') {
      throw new BadRequestError(`Suspense entry "${suspenseId}" is already RESOLVED.`);
    }

    const targetAcc = chartOfAccountsService.getAccount(params.targetAccountCode);
    if (!targetAcc) {
      throw new BadRequestError(`Invalid target account code "${params.targetAccountCode}".`);
    }

    const now = new Date().toISOString();
    accountingPeriodService.assertPeriodOpenForDate(now, entry.tenantId);

    const suspenseAcc = chartOfAccountsService.getAccount('1099')!;

    // Invert original suspense booking:
    // If original was credit in 1099, now DEBIT 1099, CREDIT targetAccountCode
    const lines: JournalEntryLine[] =
      entry.direction === 'CREDIT'
        ? [
            {
              accountCode: '1099',
              accountName: suspenseAcc.name,
              direction: 'DEBIT',
              amount: entry.amount,
              description: `Clear suspense liability: ${params.resolutionNotes}`,
            },
            {
              accountCode: params.targetAccountCode,
              accountName: targetAcc.name,
              direction: 'CREDIT',
              amount: entry.amount,
              description: `Resolution credit to ${targetAcc.name}: ${params.resolutionNotes}`,
            },
          ]
        : [
            {
              accountCode: params.targetAccountCode,
              accountName: targetAcc.name,
              direction: 'DEBIT',
              amount: entry.amount,
              description: `Resolution debit to ${targetAcc.name}: ${params.resolutionNotes}`,
            },
            {
              accountCode: '1099',
              accountName: suspenseAcc.name,
              direction: 'CREDIT',
              amount: entry.amount,
              description: `Clear suspense asset: ${params.resolutionNotes}`,
            },
          ];

    const glJournal = await generalLedgerService.createJournalEntry({
      tenantId: entry.tenantId,
      referenceType: 'MANUAL_JOURNAL',
      referenceId: entry.id,
      transactionDate: now,
      description: `Suspense Resolution [${entry.reference}]: Transferred to ${targetAcc.name} - ${params.resolutionNotes}`,
      lines,
      postedBy: params.userId,
    });

    entry.status = 'RESOLVED';
    entry.resolutionNotes = params.resolutionNotes;
    entry.resolutionJournalId = glJournal.id;
    entry.resolvedByUserId = params.userId;
    entry.resolvedAt = now;
    entry.updatedAt = now;

    logAudit({
      tenantId: entry.tenantId,
      userId: params.userId,
      action: 'SUSPENSE_ENTRY_RESOLVED',
      entity: 'SuspenseEntry',
      entityId: entry.id,
      newValue: { targetAccount: params.targetAccountCode, resolutionJournalId: glJournal.id },
    });

    return entry;
  }

  /**
   * List suspense entries with filters
   */
  public listSuspenseEntries(params?: {
    tenantId?: string;
    status?: SuspenseStatus;
    limit?: number;
  }): SuspenseEntryRecord[] {
    let list = Array.from(this.suspenseEntries.values());

    if (params?.tenantId) {
      list = list.filter((s) => s.tenantId === params.tenantId);
    }
    if (params?.status) {
      list = list.filter((s) => s.status === params.status);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(0, params?.limit || 100);
  }

  /**
   * Get single suspense entry
   */
  public getSuspenseEntry(id: string): SuspenseEntryRecord | undefined {
    return this.suspenseEntries.get(id);
  }
}

export const suspenseService = new SuspenseService();
