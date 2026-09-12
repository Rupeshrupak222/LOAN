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
  {
    code: '2030',
    name: 'Partner Commission Payable',
    category: 'LIABILITY',
    normalBalance: 'CREDIT',
    description: 'Accrued origination commissions payable to lending partners and DSAs.',
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
    name: 'Gateway & Payment Processing Fee Expense',
    category: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Interchange, PG gateway fees, and payout platform charges.',
    isSystemAccount: true,
  },
  {
    code: '5020',
    name: 'NPA & Credit Loss Provision Expense',
    category: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Statutory loan loss provisioning expense as per RBI prudential norms.',
    isSystemAccount: true,
  },
  {
    code: '5030',
    name: 'Bad Debts Written Off Expense',
    category: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Unrecoverable principal balances written off.',
    isSystemAccount: true,
  },
  {
    code: '5040',
    name: 'Partner Origination Commission Expense',
    category: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Channel partner and sourcing DSA payout commission expense.',
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
   * Post Automatic Journal for Payment Refund
   */
  public async postRefundJournal(params: {
    paymentId: string;
    refundId: string;
    tenantId?: string;
    branchId?: string;
    loanId?: string;
    loanNo?: string;
    refundAmount: number;
    reason?: string;
    postedBy?: string;
  }): Promise<JournalEntry> {
    const lines: JournalEntryLine[] = [
      {
        accountCode: '2010',
        accountName: 'Customer Unallocated & Excess Repayment Deposits',
        direction: 'DEBIT',
        amount: params.refundAmount,
        description: `Refund debited against surplus funds for payment ${params.paymentId} (Refund: ${params.refundId})`,
      },
      {
        accountCode: '1010',
        accountName: 'Disbursement & Settlement Bank Account',
        direction: 'CREDIT',
        amount: params.refundAmount,
        description: `Refund payout from bank account for ${params.loanNo || params.paymentId}`,
      },
    ];

    return this.createJournalEntry({
      tenantId: params.tenantId,
      branchId: params.branchId,
      referenceType: 'REFUND',
      referenceId: params.refundId,
      description: `Payment refund processed for ${params.loanNo || params.paymentId}: ${params.reason || 'Customer refund'}`,
      lines,
      postedBy: params.postedBy || 'REFUND_ENGINE',
    });
  }

  /**
   * Post Automatic Journal for Payment Reversal (Bounced / Revoked transaction)
   * Exact mirror compensating journal of the original repayment allocation.
   */
  public async postReversalJournal(params: {
    paymentId: string;
    reversalId: string;
    tenantId?: string;
    branchId?: string;
    loanId?: string;
    loanNo?: string;
    reversalAmount: number;
    originalPrincipal: number;
    originalInterest: number;
    originalFees: number;
    originalPenalties: number;
    originalExcess?: number;
    reason?: string;
    postedBy?: string;
  }): Promise<JournalEntry> {
    const lines: JournalEntryLine[] = [];

    if (params.originalPrincipal > 0) {
      lines.push({
        accountCode: '1020',
        accountName: 'Loans & Advances to Customers (Principal Book)',
        direction: 'DEBIT',
        amount: params.originalPrincipal,
        description: `Reinstatement of principal on ${params.loanNo} due to payment reversal`,
      });
    }

    if (params.originalInterest > 0) {
      lines.push({
        accountCode: '4010',
        accountName: 'Interest Income on Loans',
        direction: 'DEBIT',
        amount: params.originalInterest,
        description: `Reversal of recognized interest income on ${params.loanNo}`,
      });
    }

    if (params.originalFees > 0) {
      lines.push({
        accountCode: '1050',
        accountName: 'Penalties & Late Fees Receivable',
        direction: 'DEBIT',
        amount: params.originalFees,
        description: `Reinstatement of fee receivable on ${params.loanNo}`,
      });
    }

    if (params.originalPenalties > 0) {
      lines.push({
        accountCode: '4030',
        accountName: 'Late Payment & Default Charges Income',
        direction: 'DEBIT',
        amount: params.originalPenalties,
        description: `Reversal of penal charge income on ${params.loanNo}`,
      });
    }

    if (params.originalExcess && params.originalExcess > 0) {
      lines.push({
        accountCode: '2010',
        accountName: 'Customer Unallocated & Excess Repayment Deposits',
        direction: 'DEBIT',
        amount: params.originalExcess,
        description: `Reversal of unallocated excess deposit on ${params.loanNo}`,
      });
    }

    // Credit bank account for the total reversed amount
    lines.push({
      accountCode: '1010',
      accountName: 'Disbursement & Settlement Bank Account',
      direction: 'CREDIT',
      amount: params.reversalAmount,
      description: `Reversal of repayment funds received via ${params.paymentId}`,
    });

    return this.createJournalEntry({
      tenantId: params.tenantId,
      branchId: params.branchId,
      referenceType: 'REVERSAL',
      referenceId: params.reversalId,
      description: `Compensating reversal journal for payment ${params.paymentId} on ${params.loanNo}: ${params.reason || 'Payment bounced/revoked'}`,
      lines,
      postedBy: params.postedBy || 'REVERSAL_ENGINE',
    });
  }

  /**
   * Post Automatic Journal for Chargeback / Dispute Deduction
   */
  public async postChargebackJournal(params: {
    disputeId: string;
    paymentId: string;
    tenantId?: string;
    branchId?: string;
    loanId?: string;
    loanNo?: string;
    disputeAmount: number;
    feeAmount?: number;
    reason?: string;
    postedBy?: string;
  }): Promise<JournalEntry> {
    const disputeAmt = new Decimal(params.disputeAmount);
    const feeAmt = new Decimal(params.feeAmount || 0);
    const totalDeducted = disputeAmt.plus(feeAmt);

    const lines: JournalEntryLine[] = [
      {
        accountCode: '1020',
        accountName: 'Loans & Advances to Customers (Principal Book)',
        direction: 'DEBIT',
        amount: disputeAmt.toNumber(),
        description: `Disputed payment reversal / chargeback debit for ${params.loanNo || params.paymentId}`,
      },
    ];

    if (feeAmt.greaterThan(0)) {
      lines.push({
        accountCode: '5010',
        accountName: 'Gateway & Payment Processing Fee Expense',
        direction: 'DEBIT',
        amount: feeAmt.toNumber(),
        description: `Chargeback administrative fee for dispute ${params.disputeId}`,
      });
    }

    lines.push({
      accountCode: '1010',
      accountName: 'Disbursement & Settlement Bank Account',
      direction: 'CREDIT',
      amount: totalDeducted.toNumber(),
      description: `Deduction by payment gateway for chargeback ${params.disputeId}`,
    });

    return this.createJournalEntry({
      tenantId: params.tenantId,
      branchId: params.branchId,
      referenceType: 'CHARGEBACK',
      referenceId: params.disputeId,
      description: `Chargeback journal for disputed payment ${params.paymentId}: ${params.reason || 'Gateway chargeback'}`,
      lines,
      postedBy: params.postedBy || 'DISPUTE_ENGINE',
    });
  }

  /**
   * Post Automatic Journal for Gateway Settlement Batch
   */
  public async postSettlementJournal(params: {
    batchId: string;
    providerCode: string;
    tenantId?: string;
    grossAmount: number;
    feeAmount: number;
    gstAmount: number;
    netSettledAmount: number;
    postedBy?: string;
  }): Promise<JournalEntry> {
    const net = new Decimal(params.netSettledAmount);
    const fee = new Decimal(params.feeAmount);
    const gst = new Decimal(params.gstAmount);
    const gross = new Decimal(params.grossAmount);

    const totalFeeExp = fee.plus(gst);

    const lines: JournalEntryLine[] = [
      {
        accountCode: '1010',
        accountName: 'Disbursement & Settlement Bank Account',
        direction: 'DEBIT',
        amount: net.toNumber(),
        description: `Net funds settled by ${params.providerCode} for batch ${params.batchId}`,
      },
      {
        accountCode: '5010',
        accountName: 'Gateway & Payment Processing Fee Expense',
        direction: 'DEBIT',
        amount: totalFeeExp.toNumber(),
        description: `MDR & Gateway fee (incl GST) charged by ${params.providerCode} for batch ${params.batchId}`,
      },
      {
        accountCode: '2010',
        accountName: 'Customer Unallocated & Excess Repayment Deposits',
        direction: 'CREDIT',
        amount: gross.toNumber(),
        description: `Gross settlement clearing credit for batch ${params.batchId}`,
      },
    ];

    return this.createJournalEntry({
      tenantId: params.tenantId,
      referenceType: 'SETTLEMENT',
      referenceId: params.batchId,
      description: `PG Settlement Batch ${params.batchId} from ${params.providerCode}: Gross ₹${gross.toFixed(2)}, Fees ₹${totalFeeExp.toFixed(2)}, Net ₹${net.toFixed(2)}`,
      lines,
      postedBy: params.postedBy || 'SETTLEMENT_ENGINE',
    });
  }

  /**
   * Post Automatic Journal for Partner Origination Commission
   */
  public async postPartnerCommissionJournal(params: {
    partnerId: string;
    partnerName: string;
    loanId: string;
    loanNo: string;
    tenantId?: string;
    commissionAmount: number;
    postedBy?: string;
  }): Promise<JournalEntry> {
    const lines: JournalEntryLine[] = [
      {
        accountCode: '5040',
        accountName: 'Partner Origination Commission Expense',
        direction: 'DEBIT',
        amount: params.commissionAmount,
        description: `Origination commission payable to ${params.partnerName} for loan ${params.loanNo}`,
      },
      {
        accountCode: '2030',
        accountName: 'Partner Commission Payable',
        direction: 'CREDIT',
        amount: params.commissionAmount,
        description: `Commission accrual credit for partner ${params.partnerName}`,
      },
    ];

    return this.createJournalEntry({
      tenantId: params.tenantId,
      referenceType: 'PARTNER_COMMISSION',
      referenceId: params.loanId,
      description: `Partner DSA commission accrual for ${params.partnerName} on loan ${params.loanNo}`,
      lines,
      postedBy: params.postedBy || 'PARTNER_COMMISSION_ENGINE',
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

  /**
   * Get a specific Journal Entry by ID
   */
  public getJournalEntry(id: string): JournalEntry | undefined {
    return journalLedger.find((e) => e.id === id);
  }

  /**
   * Post Automatic Double-Entry Journal for Debt Settlement & Waiver
   */
  public async postSettlementWaiverJournal(params: {
    settlementId: string;
    loanId: string;
    loanNo: string;
    tenantId?: string;
    branchId?: string;
    waivedPrincipal: number;
    waivedInterest: number;
    waivedPenalties: number;
    reason?: string;
    postedBy?: string;
  }): Promise<JournalEntry> {
    const totalWaiver = new Decimal(params.waivedPrincipal)
      .plus(params.waivedInterest)
      .plus(params.waivedPenalties);

    if (totalWaiver.lessThanOrEqualTo(0)) {
      throw new BadRequestError('Total waiver amount must be strictly positive to post a settlement journal.');
    }

    const lines: JournalEntryLine[] = [
      {
        accountCode: '5030',
        accountName: 'Bad Debts Written Off Expense',
        direction: 'DEBIT',
        amount: totalWaiver.toNumber(),
        description: `Settlement discount & debt waiver expense for loan ${params.loanNo}`,
      },
    ];

    if (params.waivedPrincipal > 0) {
      lines.push({
        accountCode: '1020',
        accountName: 'Loans & Advances to Customers (Principal Book)',
        direction: 'CREDIT',
        amount: params.waivedPrincipal,
        description: `Principal balance forgiven under settlement for ${params.loanNo}`,
      });
    }

    if (params.waivedInterest > 0) {
      lines.push({
        accountCode: '1040',
        accountName: 'Interest Accrued and Due (Billed)',
        direction: 'CREDIT',
        amount: params.waivedInterest,
        description: `Overdue interest waived under settlement for ${params.loanNo}`,
      });
    }

    if (params.waivedPenalties > 0) {
      lines.push({
        accountCode: '1050',
        accountName: 'Penalties & Late Fees Receivable',
        direction: 'CREDIT',
        amount: params.waivedPenalties,
        description: `Late charges waived under settlement for ${params.loanNo}`,
      });
    }

    return this.createJournalEntry({
      tenantId: params.tenantId,
      branchId: params.branchId,
      referenceType: 'SETTLEMENT_WAIVER',
      referenceId: params.settlementId,
      description: `Debt settlement & fee waiver journal for ${params.loanNo}: ${params.reason || 'Settlement Authorization'}`,
      lines,
      postedBy: params.postedBy || 'COLLECTIONS_SETTLEMENT_ENGINE',
    });
  }

  /**
   * Post Automatic Double-Entry Journal for Unrecoverable Bad Debt Write-Off
   */
  public async postWriteOffJournal(params: {
    writeOffId: string;
    loanId: string;
    loanNo: string;
    tenantId?: string;
    branchId?: string;
    writeOffPrincipal: number;
    writeOffInterest?: number;
    writeOffPenalties?: number;
    reason?: string;
    postedBy?: string;
  }): Promise<JournalEntry> {
    const totalWriteOff = new Decimal(params.writeOffPrincipal)
      .plus(params.writeOffInterest || 0)
      .plus(params.writeOffPenalties || 0);

    if (totalWriteOff.lessThanOrEqualTo(0)) {
      throw new BadRequestError('Total write-off amount must be strictly positive.');
    }

    const lines: JournalEntryLine[] = [
      {
        accountCode: '5030',
        accountName: 'Bad Debts Written Off Expense',
        direction: 'DEBIT',
        amount: totalWriteOff.toNumber(),
        description: `Bad debt charge-off provision for delinquent loan ${params.loanNo}`,
      },
    ];

    if (params.writeOffPrincipal > 0) {
      lines.push({
        accountCode: '1020',
        accountName: 'Loans & Advances to Customers (Principal Book)',
        direction: 'CREDIT',
        amount: params.writeOffPrincipal,
        description: `Gross principal charge-off for unrecoverable balance ${params.loanNo}`,
      });
    }

    if (params.writeOffInterest && params.writeOffInterest > 0) {
      lines.push({
        accountCode: '1040',
        accountName: 'Interest Accrued and Due (Billed)',
        direction: 'CREDIT',
        amount: params.writeOffInterest,
        description: `Accrued interest charge-off for ${params.loanNo}`,
      });
    }

    if (params.writeOffPenalties && params.writeOffPenalties > 0) {
      lines.push({
        accountCode: '1050',
        accountName: 'Penalties & Late Fees Receivable',
        direction: 'CREDIT',
        amount: params.writeOffPenalties,
        description: `Penal fees charge-off for ${params.loanNo}`,
      });
    }

    return this.createJournalEntry({
      tenantId: params.tenantId,
      branchId: params.branchId,
      referenceType: 'WRITE_OFF',
      referenceId: params.writeOffId,
      description: `Bad debt write-off accounting journal for ${params.loanNo}: ${params.reason || 'Credit Committee Write-Off'}`,
      lines,
      postedBy: params.postedBy || 'COLLECTIONS_WRITEOFF_ENGINE',
    });
  }
}

export const generalLedgerService = new GeneralLedgerService();
