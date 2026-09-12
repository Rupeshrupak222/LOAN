import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import {
  AccrualEntryRecord,
  AccrualType,
  AccrualStatus,
} from './accounting.types';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { generalLedgerService } from '../finance/gl.service';
import { chartOfAccountsService } from './chart-of-accounts.service';
import { accountingPeriodService } from './accounting-period.service';
import { logAudit } from '../audit/audit.service';
import { JournalEntryLine } from '../finance/gl.types';

export class AccrualService {
  private accruals: Map<string, AccrualEntryRecord> = new Map();

  /**
   * Create a new Accrual schedule or entry (Maker action)
   */
  public createAccrual(input: {
    tenantId: string;
    accrualType: AccrualType;
    periodId?: string;
    description: string;
    amount: number;
    effectiveDate?: string;
    autoReversalDate?: string;
    accountDebitCode?: string;
    accountCreditCode?: string;
    userId: string;
  }): AccrualEntryRecord {
    if (input.amount <= 0) {
      throw new BadRequestError('Accrual amount must be strictly positive.');
    }

    const effectiveDate = input.effectiveDate || new Date().toISOString();
    accountingPeriodService.assertPeriodOpenForDate(effectiveDate, input.tenantId);

    // Default debit & credit codes according to accrual type
    let defaultDebit = '1030'; // Interest Accrued but Not Due
    let defaultCredit = '4010'; // Interest Income on Loans

    if (input.accrualType === 'COMMISSION_ACCRUAL') {
      defaultDebit = '5040'; // Partner Origination Commission Expense
      defaultCredit = '2030'; // Partner Commission Payable
    } else if (input.accrualType === 'EXPENSE_ACCRUAL') {
      defaultDebit = '5070'; // General Ops Expense
      defaultCredit = '2050'; // Accounts Payable
    } else if (input.accrualType === 'FEE_ACCRUAL') {
      defaultDebit = '1060'; // Fee Receivable
      defaultCredit = '4020'; // Processing Fee Income
    }

    const debitCode = input.accountDebitCode || defaultDebit;
    const creditCode = input.accountCreditCode || defaultCredit;

    const debitAcc = chartOfAccountsService.getAccount(debitCode);
    const creditAcc = chartOfAccountsService.getAccount(creditCode);

    if (!debitAcc || !creditAcc) {
      throw new BadRequestError('Invalid Debit or Credit account code for accrual.');
    }

    const activePeriod =
      accountingPeriodService.getPeriod(effectiveDate.slice(0, 7), input.tenantId) ||
      accountingPeriodService.getCurrentOpenPeriod(input.tenantId);

    const periodId = input.periodId || activePeriod?.id || `period-${input.tenantId}-${effectiveDate.slice(0, 7)}`;

    const id = `ACC-${uuid().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    const accrual: AccrualEntryRecord = {
      id,
      tenantId: input.tenantId,
      accrualType: input.accrualType,
      periodId,
      description: input.description,
      amount: input.amount,
      effectiveDate,
      autoReversalDate: input.autoReversalDate,
      accountDebitCode: debitCode,
      accountCreditCode: creditCode,
      status: 'DRAFT',
      proposedByUserId: input.userId,
      createdAt: now,
      updatedAt: now,
    };

    this.accruals.set(id, accrual);

    logAudit({
      tenantId: input.tenantId,
      userId: input.userId,
      action: 'ACCRUAL_CREATED',
      entity: 'AccrualEntry',
      entityId: id,
      newValue: { accrualType: input.accrualType, amount: input.amount },
    });

    return accrual;
  }

  /**
   * Approve and Post Accrual Entry to General Ledger (Checker action with SoD)
   */
  public async approveAndPostAccrual(
    accrualId: string,
    approverUserId: string,
    tenantId?: string
  ): Promise<AccrualEntryRecord> {
    const accrual = this.getAccrual(accrualId);
    if (!accrual) {
      throw new NotFoundError(`Accrual "${accrualId}" not found.`);
    }

    if (tenantId && accrual.tenantId !== tenantId) {
      throw new BadRequestError('Tenant mismatch for accrual.');
    }

    if (accrual.status !== 'DRAFT') {
      throw new BadRequestError(`Cannot approve accrual with status "${accrual.status}". Must be DRAFT.`);
    }

    // Segregation of Duties: Maker cannot approve their own accrual
    if (accrual.proposedByUserId === approverUserId) {
      throw new BadRequestError('Segregation of Duties Violation: Accrual maker cannot approve their own accrual.');
    }

    // Verify period is open
    accountingPeriodService.assertPeriodOpenForDate(accrual.effectiveDate, accrual.tenantId);

    const debitAcc = chartOfAccountsService.getAccount(accrual.accountDebitCode)!;
    const creditAcc = chartOfAccountsService.getAccount(accrual.accountCreditCode)!;

    const lines: JournalEntryLine[] = [
      {
        accountCode: accrual.accountDebitCode,
        accountName: debitAcc.name,
        direction: 'DEBIT',
        amount: accrual.amount,
        description: accrual.description,
      },
      {
        accountCode: accrual.accountCreditCode,
        accountName: creditAcc.name,
        direction: 'CREDIT',
        amount: accrual.amount,
        description: accrual.description,
      },
    ];

    const glEntry = await generalLedgerService.createJournalEntry({
      tenantId: accrual.tenantId,
      referenceType: accrual.accrualType === 'INTEREST_ACCRUAL' ? 'DAILY_INTEREST_ACCRUAL' : 'FEE_ACCRUAL',
      referenceId: accrual.id,
      transactionDate: accrual.effectiveDate,
      description: `[Accrual ${accrual.accrualType}] ${accrual.description}`,
      lines,
      postedBy: approverUserId,
    });

    const now = new Date().toISOString();
    accrual.status = 'POSTED';
    accrual.approvedByUserId = approverUserId;
    accrual.glJournalId = glEntry.id;
    accrual.updatedAt = now;

    logAudit({
      tenantId: accrual.tenantId,
      userId: approverUserId,
      action: 'ACCRUAL_APPROVED_AND_POSTED',
      entity: 'AccrualEntry',
      entityId: accrual.id,
      newValue: { amount: accrual.amount, glJournalId: glEntry.id },
    });

    return accrual;
  }

  /**
   * Reverse a posted accrual entry (compensating GL journal)
   */
  public async reverseAccrual(
    accrualId: string,
    userId: string,
    reason: string,
    tenantId?: string
  ): Promise<AccrualEntryRecord> {
    const accrual = this.getAccrual(accrualId);
    if (!accrual) {
      throw new NotFoundError(`Accrual "${accrualId}" not found.`);
    }

    if (tenantId && accrual.tenantId !== tenantId) {
      throw new BadRequestError('Tenant mismatch for accrual.');
    }

    if (accrual.status !== 'POSTED') {
      throw new BadRequestError(`Cannot reverse accrual with status "${accrual.status}". Must be POSTED.`);
    }

    const now = new Date().toISOString();
    accountingPeriodService.assertPeriodOpenForDate(now, accrual.tenantId);

    const debitAcc = chartOfAccountsService.getAccount(accrual.accountDebitCode)!;
    const creditAcc = chartOfAccountsService.getAccount(accrual.accountCreditCode)!;

    // Invert lines: Credit original debit account, Debit original credit account
    const reversalLines: JournalEntryLine[] = [
      {
        accountCode: accrual.accountCreditCode,
        accountName: creditAcc.name,
        direction: 'DEBIT',
        amount: accrual.amount,
        description: `Reversal of accrual [${accrual.id}]: ${reason}`,
      },
      {
        accountCode: accrual.accountDebitCode,
        accountName: debitAcc.name,
        direction: 'CREDIT',
        amount: accrual.amount,
        description: `Reversal of accrual [${accrual.id}]: ${reason}`,
      },
    ];

    const glReversal = await generalLedgerService.createJournalEntry({
      tenantId: accrual.tenantId,
      referenceType: 'MANUAL_JOURNAL',
      referenceId: `REV-${accrual.id}`,
      transactionDate: now,
      description: `Accrual Reversal [${accrual.id}] - ${reason}`,
      lines: reversalLines,
      postedBy: userId,
    });

    accrual.status = 'REVERSED';
    accrual.reversalJournalId = glReversal.id;
    accrual.reversedAt = now;
    accrual.updatedAt = now;

    logAudit({
      tenantId: accrual.tenantId,
      userId,
      action: 'ACCRUAL_REVERSED',
      entity: 'AccrualEntry',
      entityId: accrual.id,
      newValue: { reversalJournalId: glReversal.id, reason },
    });

    return accrual;
  }

  /**
   * List accruals with filters
   */
  public listAccruals(params?: {
    tenantId?: string;
    status?: AccrualStatus;
    accrualType?: AccrualType;
    limit?: number;
  }): AccrualEntryRecord[] {
    let list = Array.from(this.accruals.values());

    if (params?.tenantId) {
      list = list.filter((a) => a.tenantId === params.tenantId);
    }
    if (params?.status) {
      list = list.filter((a) => a.status === params.status);
    }
    if (params?.accrualType) {
      list = list.filter((a) => a.accrualType === params.accrualType);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(0, params?.limit || 100);
  }

  /**
   * Get accrual by ID
   */
  public getAccrual(id: string): AccrualEntryRecord | undefined {
    return this.accruals.get(id);
  }
}

export const accrualService = new AccrualService();
