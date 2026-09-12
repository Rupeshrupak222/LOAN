import Decimal from 'decimal.js';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../config/prisma';
import { Money } from './money';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';
import type {
  GlAccount,
  JournalEntry,
  JournalEntryLine,
  JournalReferenceType,
  TrialBalanceReport,
  TrialBalanceItem,
} from './gl.types';

export const STANDARD_CHART_OF_ACCOUNTS: GlAccount[] = [
  // 1000 - ASSETS
  {
    code: '1010',
    name: 'Disbursement & Settlement Bank Account',
    category: 'ASSET',
    normalBalance: 'DEBIT',
    description: 'Central nodal clearing bank account for loan disbursements and customer repayments.',
    isSystemAccount: true,
  },
  {
    code: '1020',
    name: 'Loans & Advances to Customers (Principal Book)',
    category: 'ASSET',
    normalBalance: 'DEBIT',
    description: 'Gross principal loan balance outstanding from retail and SME borrowers.',
    isSystemAccount: true,
  },
  {
    code: '1030',
    name: 'Interest Accrued but Not Due',
    category: 'ASSET',
    normalBalance: 'DEBIT',
    description: 'Daily unbilled interest accrued on performing loan portfolio.',
    isSystemAccount: true,
  },
  {
    code: '1040',
    name: 'Interest Accrued and Due (Billed)',
    category: 'ASSET',
    normalBalance: 'DEBIT',
    description: 'Overdue / billed interest receivable from borrowers.',
    isSystemAccount: true,
  },
  {
    code: '1050',
    name: 'Penalties & Late Fees Receivable',
    category: 'ASSET',
    normalBalance: 'DEBIT',
    description: 'Assessed late fees and bounce penalties due from delinquent accounts.',
    isSystemAccount: true,
  },

  // 2000 - LIABILITIES
  {
    code: '2010',
    name: 'Customer Unallocated & Excess Repayment Deposits',
    category: 'LIABILITY',
    normalBalance: 'CREDIT',
    description: 'Surplus borrower funds awaiting manual reconciliation or next installment allocation.',
    isSystemAccount: true,
  },
  {
    code: '2020',
    name: 'Statutory GST Payable (18%)',
    category: 'LIABILITY',
    normalBalance: 'CREDIT',
    description: 'Goods and Services Tax collected on processing fees and documentation charges.',
    isSystemAccount: true,
  },

  // 3000 - EQUITY / CAPITAL
  {
    code: '3010',
    name: 'Lending Capital & Retained Reserves',
    category: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Tier-1 capital and institutional reserves funding the loan book.',
    isSystemAccount: true,
  },

  // 4000 - REVENUE / INCOME
  {
    code: '4010',
    name: 'Interest Income on Loans',
    category: 'INCOME',
    normalBalance: 'CREDIT',
    description: 'Core lending yield recognized on active and standard loans.',
    isSystemAccount: true,
  },
  {
    code: '4020',
    name: 'Loan Processing Fee Income',
    category: 'INCOME',
    normalBalance: 'CREDIT',
    description: 'Upfront origination fee income earned upon loan disbursement.',
    isSystemAccount: true,
  },
  {
    code: '4030',
    name: 'Late Payment & Default Charges Income',
    category: 'INCOME',
    normalBalance: 'CREDIT',
    description: 'Penal interest and cheque bounce fee income collected.',
    isSystemAccount: true,
  },

  // 5000 - EXPENSES & PROVISIONS
  {
    code: '5010',
    name: 'NPA & Credit Loss Provision Expense',
    category: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Statutory loan loss provisioning expense as per RBI prudential norms.',
    isSystemAccount: true,
  },
  {
    code: '5020',
    name: 'Bad Debts Written Off Expense',
    category: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Unrecoverable principal balances written off.',
    isSystemAccount: true,
  },
];

// In-memory journal entries ledger (can be queried or persisted)
const journalLedger: JournalEntry[] = [];

export class GeneralLedgerService {
  /**
   * Get Chart of Accounts
   */
  public getChartOfAccounts(): GlAccount[] {
    return STANDARD_CHART_OF_ACCOUNTS;
  }

  /**
   * Create and validate a Double-Entry Journal Entry with strict Debits = Credits checking.
   */
  public async createJournalEntry(input: {
    tenantId?: string;
    branchId?: string;
    referenceType: JournalReferenceType;
    referenceId?: string;
    transactionDate?: string;
    description: string;
    lines: JournalEntryLine[];
    postedBy?: string;
  }): Promise<JournalEntry> {
    if (!input.lines || input.lines.length < 2) {
      throw new BadRequestError('A valid double-entry journal must contain at least 2 lines (Debit and Credit).');
    }

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const line of input.lines) {
      const amount = new Decimal(line.amount || 0);
      if (amount.lessThanOrEqualTo(0)) {
        throw new BadRequestError(`Line amount for account ${line.accountCode} must be strictly positive.`);
      }

      if (line.direction === 'DEBIT') {
        totalDebit = totalDebit.plus(amount);
      } else if (line.direction === 'CREDIT') {
        totalCredit = totalCredit.plus(amount);
      } else {
        throw new BadRequestError(`Invalid direction "${line.direction}". Must be DEBIT or CREDIT.`);
      }
    }

    // Invariant check: Debits must equal Credits
    const diff = totalDebit.minus(totalCredit).abs();
    if (diff.greaterThan(0.001)) {
      throw new BadRequestError(
        `Double-entry imbalance detected: Total Debits (₹${totalDebit.toFixed(2)}) != Total Credits (₹${totalCredit.toFixed(2)}). Difference: ₹${diff.toFixed(2)}.`
      );
    }

    const entry: JournalEntry = {
      id: `JE-${uuid().slice(0, 8)}`,
      entryNumber: `JE-${Date.now().toString().slice(-8)}`,
      tenantId: input.tenantId || 'tenant-adyapan-default',
      branchId: input.branchId,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      transactionDate: input.transactionDate || new Date().toISOString(),
      description: input.description,
      lines: input.lines,
      totalDebit: totalDebit.toNumber(),
      totalCredit: totalCredit.toNumber(),
      postedBy: input.postedBy || 'SYSTEM_GL_ENGINE',
      createdAt: new Date().toISOString(),
    };

    journalLedger.push(entry);

    return entry;
  }

  /**
   * Post Automatic Journal for Loan Disbursement
   */
  public async postDisbursementJournal(params: {
    loanId: string;
    loanNo: string;
    tenantId?: string;
    branchId?: string;
    principalAmount: number;
    netDisbursedAmount: number;
    processingFee: number;
    gstAmount: number;
    documentationCharges?: number;
    disbursedBy?: string;
  }): Promise<JournalEntry> {
    const principal = new Decimal(params.principalAmount);
    const netDisbursed = new Decimal(params.netDisbursedAmount);
    const procFee = new Decimal(params.processingFee);
    const gst = new Decimal(params.gstAmount);
    const docCharges = new Decimal(params.documentationCharges || 0);

    const feeIncome = procFee.plus(docCharges);

    const lines: JournalEntryLine[] = [
      {
        accountCode: '1020',
        accountName: 'Loans & Advances to Customers (Principal Book)',
        direction: 'DEBIT',
        amount: principal.toNumber(),
        description: `Principal loan sanction for ${params.loanNo}`,
      },
      {
        accountCode: '1010',
        accountName: 'Disbursement & Settlement Bank Account',
        direction: 'CREDIT',
        amount: netDisbursed.toNumber(),
        description: `Net payout to borrower bank account for ${params.loanNo}`,
      },
      {
        accountCode: '4020',
        accountName: 'Loan Processing Fee Income',
        direction: 'CREDIT',
        amount: feeIncome.toNumber(),
        description: `Upfront processing and documentation fee recognized for ${params.loanNo}`,
      },
      {
        accountCode: '2020',
        accountName: 'Statutory GST Payable (18%)',
        direction: 'CREDIT',
        amount: gst.toNumber(),
        description: `18% GST collected on origination fees for ${params.loanNo}`,
      },
    ];

    return this.createJournalEntry({
      tenantId: params.tenantId,
      branchId: params.branchId,
      referenceType: 'DISBURSEMENT',
      referenceId: params.loanId,
      description: `Loan disbursement and origination fee recognition for ${params.loanNo}`,
      lines,
      postedBy: params.disbursedBy || 'DISBURSEMENT_ENGINE',
    });
  }

  /**
   * Post Automatic Journal for Repayment Allocation
   */
  public async postRepaymentJournal(params: {
    loanId: string;
    loanNo: string;
    paymentNo: string;
    tenantId?: string;
    branchId?: string;
    totalAmount: number;
    allocatedPrincipal: number;
    allocatedInterest: number;
    allocatedFees: number;
    allocatedPenalties: number;
    excessRefund?: number;
    receivedBy?: string;
  }): Promise<JournalEntry> {
    const lines: JournalEntryLine[] = [
      {
        accountCode: '1010',
        accountName: 'Disbursement & Settlement Bank Account',
        direction: 'DEBIT',
        amount: params.totalAmount,
        description: `Repayment received via ${params.paymentNo} for ${params.loanNo}`,
      },
    ];

    if (params.allocatedPrincipal > 0) {
      lines.push({
        accountCode: '1020',
        accountName: 'Loans & Advances to Customers (Principal Book)',
        direction: 'CREDIT',
        amount: params.allocatedPrincipal,
        description: `Principal recovery on ${params.loanNo}`,
      });
    }

    if (params.allocatedInterest > 0) {
      lines.push({
        accountCode: '4010',
        accountName: 'Interest Income on Loans',
        direction: 'CREDIT',
        amount: params.allocatedInterest,
        description: `Interest income realized on ${params.loanNo}`,
      });
    }

    if (params.allocatedFees > 0) {
      lines.push({
        accountCode: '1050',
        accountName: 'Penalties & Late Fees Receivable',
        direction: 'CREDIT',
        amount: params.allocatedFees,
        description: `Fee recovery on ${params.loanNo}`,
      });
    }

    if (params.allocatedPenalties > 0) {
      lines.push({
        accountCode: '4030',
        accountName: 'Late Payment & Default Charges Income',
        direction: 'CREDIT',
        amount: params.allocatedPenalties,
        description: `Late payment default charge realized on ${params.loanNo}`,
      });
    }

    if (params.excessRefund && params.excessRefund > 0) {
      lines.push({
        accountCode: '2010',
        accountName: 'Customer Unallocated & Excess Repayment Deposits',
        direction: 'CREDIT',
        amount: params.excessRefund,
        description: `Unallocated surplus credit held for ${params.loanNo}`,
      });
    }

    return this.createJournalEntry({
      tenantId: params.tenantId,
      branchId: params.branchId,
      referenceType: 'REPAYMENT',
      referenceId: params.loanId,
      description: `Customer installment repayment allocation for ${params.loanNo} (${params.paymentNo})`,
      lines,
      postedBy: params.receivedBy || 'PAYMENT_COLLECTIONS_ENGINE',
    });
  }

  /**
   * Post Daily Accrual Journal
   */
  public async postDailyAccrualJournal(params: {
    tenantId?: string;
    totalDailyAccruedInterest: number;
    loansCount: number;
    asOfDate: string;
  }): Promise<JournalEntry> {
    const lines: JournalEntryLine[] = [
      {
        accountCode: '1030',
        accountName: 'Interest Accrued but Not Due',
        direction: 'DEBIT',
        amount: params.totalDailyAccruedInterest,
        description: `Daily EOD interest accrual for ${params.loansCount} active loans on ${params.asOfDate}`,
      },
      {
        accountCode: '4010',
        accountName: 'Interest Income on Loans',
        direction: 'CREDIT',
        amount: params.totalDailyAccruedInterest,
        description: `EOD lending revenue recognition for ${params.loansCount} loans on ${params.asOfDate}`,
      },
    ];

    return this.createJournalEntry({
      tenantId: params.tenantId,
      referenceType: 'DAILY_INTEREST_ACCRUAL',
      transactionDate: params.asOfDate,
      description: `Automated EOD daily interest accrual across ${params.loansCount} performing loans`,
      lines,
      postedBy: 'EOD_ACCRUAL_CRON_JOB',
    });
  }

  /**
   * Generate Live Trial Balance
   */
  public getTrialBalance(tenantId?: string): TrialBalanceReport {
    const accountsMap = new Map<string, { debit: Decimal; credit: Decimal }>();

    for (const acc of STANDARD_CHART_OF_ACCOUNTS) {
      accountsMap.set(acc.code, { debit: new Decimal(0), credit: new Decimal(0) });
    }

    const filtered = tenantId ? journalLedger.filter((j) => j.tenantId === tenantId) : journalLedger;

    for (const entry of filtered) {
      for (const line of entry.lines) {
        let acc = accountsMap.get(line.accountCode);
        if (!acc) {
          acc = { debit: new Decimal(0), credit: new Decimal(0) };
          accountsMap.set(line.accountCode, acc);
        }

        if (line.direction === 'DEBIT') {
          acc.debit = acc.debit.plus(line.amount);
        } else {
          acc.credit = acc.credit.plus(line.amount);
        }
      }
    }

    let totalDebits = new Decimal(0);
    let totalCredits = new Decimal(0);

    const items: TrialBalanceItem[] = STANDARD_CHART_OF_ACCOUNTS.map((acc) => {
      const recorded = accountsMap.get(acc.code) || { debit: new Decimal(0), credit: new Decimal(0) };
      totalDebits = totalDebits.plus(recorded.debit);
      totalCredits = totalCredits.plus(recorded.credit);

      const netBalance =
        acc.normalBalance === 'DEBIT'
          ? recorded.debit.minus(recorded.credit).toNumber()
          : recorded.credit.minus(recorded.debit).toNumber();

      return {
        accountCode: acc.code,
        accountName: acc.name,
        category: acc.category,
        debitTotal: recorded.debit.toNumber(),
        creditTotal: recorded.credit.toNumber(),
        netBalance,
      };
    });

    const isBalanced = totalDebits.minus(totalCredits).abs().lessThanOrEqualTo(0.01);

    return {
      tenantId: tenantId || 'GLOBAL',
      asOfDate: new Date().toISOString(),
      accounts: items,
      totalDebits: totalDebits.toNumber(),
      totalCredits: totalCredits.toNumber(),
      isBalanced,
    };
  }

  /**
   * List Journal Entries with pagination & filters
   */
  public listJournalEntries(params?: {
    tenantId?: string;
    referenceType?: JournalReferenceType;
    limit?: number;
  }) {
    let list = [...journalLedger];
    if (params?.tenantId) {
      list = list.filter((e) => e.tenantId === params.tenantId);
    }
    if (params?.referenceType) {
      list = list.filter((e) => e.referenceType === params.referenceType);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.slice(0, params?.limit || 100);
  }
}

export const generalLedgerService = new GeneralLedgerService();
