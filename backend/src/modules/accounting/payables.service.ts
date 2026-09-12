import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import {
  PayableRecord,
  PayableType,
  PayableStatus,
} from './accounting.types';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { generalLedgerService } from '../finance/gl.service';
import { chartOfAccountsService } from './chart-of-accounts.service';
import { accountingPeriodService } from './accounting-period.service';
import { logAudit } from '../audit/audit.service';
import { JournalEntryLine } from '../finance/gl.types';

export class PayablesService {
  private payables: Map<string, PayableRecord> = new Map();

  /**
   * Create a new Accounts Payable entry (Maker action)
   */
  public createPayable(input: {
    tenantId: string;
    vendorOrPartnerName: string;
    payableType: PayableType;
    invoiceNumber?: string;
    description: string;
    amount: number;
    currency?: string;
    dueDate: string;
    accountDebitCode?: string;
    accountCreditCode?: string;
    userId: string;
    autoSubmit?: boolean;
  }): PayableRecord {
    if (input.amount <= 0) {
      throw new BadRequestError('Payable amount must be strictly positive.');
    }

    // Default GL accounts based on type if not supplied
    let defaultDebit = '5070'; // General expense
    let defaultCredit = '2050'; // Trade Accounts Payable

    if (input.payableType === 'PARTNER_COMMISSION') {
      defaultDebit = '5040'; // Partner Origination Commission Expense
      defaultCredit = '2030'; // Partner Commission Payable
    } else if (input.payableType === 'PAYMENT_GATEWAY_FEE') {
      defaultDebit = '5010'; // Gateway Fee Expense
      defaultCredit = '2050';
    } else if (input.payableType === 'TAX_PAYABLE') {
      defaultDebit = '2020'; // Statutory GST
      defaultCredit = '1010'; // Bank
    }

    const debitCode = input.accountDebitCode || defaultDebit;
    const creditCode = input.accountCreditCode || defaultCredit;

    const debitAcc = chartOfAccountsService.getAccount(debitCode);
    const creditAcc = chartOfAccountsService.getAccount(creditCode);

    if (!debitAcc || !creditAcc) {
      throw new BadRequestError('Invalid Debit or Credit account code for payable.');
    }

    const id = `PAY-${uuid().slice(0, 8).toUpperCase()}`;
    const now = new Date().toISOString();
    const status: PayableStatus = input.autoSubmit ? 'SUBMITTED' : 'DRAFT';

    const payable: PayableRecord = {
      id,
      tenantId: input.tenantId,
      vendorOrPartnerName: input.vendorOrPartnerName,
      payableType: input.payableType,
      invoiceNumber: input.invoiceNumber,
      description: input.description,
      amount: input.amount,
      currency: input.currency || 'INR',
      dueDate: input.dueDate,
      status,
      accountDebitCode: debitCode,
      accountCreditCode: creditCode,
      createdAt: now,
      updatedAt: now,
    };

    this.payables.set(id, payable);

    logAudit({
      tenantId: input.tenantId,
      userId: input.userId,
      action: 'PAYABLE_CREATED',
      entity: 'Payable',
      entityId: id,
      newValue: { vendorOrPartnerName: input.vendorOrPartnerName, amount: input.amount, payableType: input.payableType },
    });

    return payable;
  }

  /**
   * Approve a payable for payment processing (Checker action)
   */
  public async approvePayable(
    payableId: string,
    checkerUserId: string,
    tenantId?: string
  ): Promise<PayableRecord> {
    const payable = this.getPayable(payableId);
    if (!payable) {
      throw new NotFoundError(`Payable "${payableId}" not found.`);
    }

    if (tenantId && payable.tenantId !== tenantId) {
      throw new BadRequestError('Tenant mismatch for payable.');
    }

    if (payable.status !== 'SUBMITTED' && payable.status !== 'DRAFT') {
      throw new BadRequestError(`Cannot approve payable with status "${payable.status}".`);
    }

    const now = new Date().toISOString();

    // Verify period is open
    accountingPeriodService.assertPeriodOpenForDate(now, payable.tenantId);

    // Book expense and liability accrual upon approval
    const debitAcc = chartOfAccountsService.getAccount(payable.accountDebitCode)!;
    const creditAcc = chartOfAccountsService.getAccount(payable.accountCreditCode)!;

    const lines: JournalEntryLine[] = [
      {
        accountCode: payable.accountDebitCode,
        accountName: debitAcc.name,
        direction: 'DEBIT',
        amount: payable.amount,
        description: `Expense accrual for payable ${payable.vendorOrPartnerName}: ${payable.description}`,
      },
      {
        accountCode: payable.accountCreditCode,
        accountName: creditAcc.name,
        direction: 'CREDIT',
        amount: payable.amount,
        description: `Payable liability booked for ${payable.vendorOrPartnerName}`,
      },
    ];

    const glEntry = await generalLedgerService.createJournalEntry({
      tenantId: payable.tenantId,
      referenceType: 'PARTNER_COMMISSION',
      referenceId: payable.id,
      transactionDate: now,
      description: `Accounts Payable Booking: [${payable.invoiceNumber || payable.id}] ${payable.vendorOrPartnerName}`,
      lines,
      postedBy: checkerUserId,
    });

    payable.status = 'APPROVED';
    payable.approvedByUserId = checkerUserId;
    payable.glJournalId = glEntry.id;
    payable.updatedAt = now;

    logAudit({
      tenantId: payable.tenantId,
      userId: checkerUserId,
      action: 'PAYABLE_APPROVED',
      entity: 'Payable',
      entityId: payable.id,
      newValue: { amount: payable.amount, glJournalId: glEntry.id },
    });

    return payable;
  }

  /**
   * Record payment disbursement for an approved payable (Settles liability against bank)
   */
  public async recordPayment(
    payableId: string,
    params: {
      payoutUtr: string;
      paidAt?: string;
      userId: string;
      accountPaidFromCode?: string;
      tenantId?: string;
    }
  ): Promise<PayableRecord> {
    const payable = this.getPayable(payableId);
    if (!payable) {
      throw new NotFoundError(`Payable "${payableId}" not found.`);
    }

    if (params.tenantId && payable.tenantId !== params.tenantId) {
      throw new BadRequestError('Tenant mismatch for payable.');
    }

    if (payable.status !== 'APPROVED' && payable.status !== 'DUE') {
      throw new BadRequestError(`Cannot record payment for payable with status "${payable.status}". Must be APPROVED.`);
    }

    const paidAt = params.paidAt || new Date().toISOString();
    accountingPeriodService.assertPeriodOpenForDate(paidAt, payable.tenantId);

    const bankCode = params.accountPaidFromCode || '1010';
    const bankAcc = chartOfAccountsService.getAccount(bankCode);
    const liabilityAcc = chartOfAccountsService.getAccount(payable.accountCreditCode)!;

    if (!bankAcc) {
      throw new BadRequestError(`Invalid bank payment account code "${bankCode}".`);
    }

    // Debit Liability Account, Credit Bank Account
    const settlementLines: JournalEntryLine[] = [
      {
        accountCode: payable.accountCreditCode,
        accountName: liabilityAcc.name,
        direction: 'DEBIT',
        amount: payable.amount,
        description: `Settlement of payable ${payable.vendorOrPartnerName} [UTR: ${params.payoutUtr}]`,
      },
      {
        accountCode: bankCode,
        accountName: bankAcc.name,
        direction: 'CREDIT',
        amount: payable.amount,
        description: `Bank disbursement for payable ${payable.vendorOrPartnerName} [UTR: ${params.payoutUtr}]`,
      },
    ];

    const glEntry = await generalLedgerService.createJournalEntry({
      tenantId: payable.tenantId,
      referenceType: 'PAYOUT_TRANSFER',
      referenceId: params.payoutUtr,
      transactionDate: paidAt,
      description: `Payable Settlement Disbursement: ${payable.vendorOrPartnerName} [UTR: ${params.payoutUtr}]`,
      lines: settlementLines,
      postedBy: params.userId,
    });

    payable.status = 'PAID';
    payable.payoutUtr = params.payoutUtr;
    payable.paidAt = paidAt;
    payable.glJournalId = glEntry.id;
    payable.updatedAt = new Date().toISOString();

    logAudit({
      tenantId: payable.tenantId,
      userId: params.userId,
      action: 'PAYABLE_PAID',
      entity: 'Payable',
      entityId: payable.id,
      newValue: { amount: payable.amount, utr: params.payoutUtr, glJournalId: glEntry.id },
    });

    return payable;
  }

  /**
   * List payables with filtering
   */
  public listPayables(params?: {
    tenantId?: string;
    status?: PayableStatus;
    payableType?: PayableType;
    limit?: number;
  }): PayableRecord[] {
    let list = Array.from(this.payables.values());

    if (params?.tenantId) {
      list = list.filter((p) => p.tenantId === params.tenantId);
    }
    if (params?.status) {
      list = list.filter((p) => p.status === params.status);
    }
    if (params?.payableType) {
      list = list.filter((p) => p.payableType === params.payableType);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(0, params?.limit || 100);
  }

  /**
   * Get single payable by ID
   */
  public getPayable(id: string): PayableRecord | undefined {
    return this.payables.get(id);
  }
}

export const payablesService = new PayablesService();
