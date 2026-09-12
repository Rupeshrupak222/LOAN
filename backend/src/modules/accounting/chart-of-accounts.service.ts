import { GlAccountRecord, AccountCategory, AccountSubCategory } from './accounting.types';
import { STANDARD_CHART_OF_ACCOUNTS } from '../finance/gl.service';
import { BadRequestError, NotFoundError } from '../../common/errors';
import { logAudit } from '../audit/audit.service';

/**
 * Standard System Chart of Accounts with enriched sub-categories for Phase 12
 */
export const ENRICHED_STANDARD_COA: GlAccountRecord[] = [
  // ASSETS (1000 - 1999)
  {
    code: '1010',
    name: 'Disbursement & Settlement Bank Account',
    category: 'ASSET',
    subCategory: 'Cash & Bank',
    normalBalance: 'DEBIT',
    description: 'Central nodal clearing bank account for loan disbursements and customer repayments.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '1020',
    name: 'Loans & Advances to Customers (Principal Book)',
    category: 'ASSET',
    subCategory: 'Loan Principal Receivable',
    normalBalance: 'DEBIT',
    description: 'Gross principal loan balance outstanding from retail and SME borrowers.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '1030',
    name: 'Interest Accrued but Not Due',
    category: 'ASSET',
    subCategory: 'Interest Receivable',
    normalBalance: 'DEBIT',
    description: 'Daily unbilled interest accrued on performing loan portfolio.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '1040',
    name: 'Interest Accrued and Due (Billed)',
    category: 'ASSET',
    subCategory: 'Interest Receivable',
    normalBalance: 'DEBIT',
    description: 'Overdue / billed interest receivable from borrowers.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '1050',
    name: 'Penalties & Late Fees Receivable',
    category: 'ASSET',
    subCategory: 'Penalty Receivable',
    normalBalance: 'DEBIT',
    description: 'Assessed late fees and bounce penalties due from delinquent accounts.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '1060',
    name: 'Processing & Origination Fees Receivable',
    category: 'ASSET',
    subCategory: 'Fee Receivable',
    normalBalance: 'DEBIT',
    description: 'Upfront and deferred fees receivable on customer accounts.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '1099',
    name: 'Unidentified Bank Receipts Suspense Clearing',
    category: 'ASSET',
    subCategory: 'Suspense Clearing',
    normalBalance: 'DEBIT',
    description: 'Temporary clearing account for unallocated bank inbound debits/credits pending reconciliation.',
    isSystemAccount: true,
    isActive: true,
  },

  // LIABILITIES (2000 - 2999)
  {
    code: '2010',
    name: 'Customer Unallocated & Excess Repayment Deposits',
    category: 'LIABILITY',
    subCategory: 'Other Liabilities',
    normalBalance: 'CREDIT',
    description: 'Surplus borrower funds awaiting manual reconciliation or next installment allocation.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '2020',
    name: 'Statutory GST Payable (18%)',
    category: 'LIABILITY',
    subCategory: 'Tax Payables',
    normalBalance: 'CREDIT',
    description: 'Goods and Services Tax collected on processing fees and documentation charges.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '2021',
    name: 'CGST Payable (9%)',
    category: 'LIABILITY',
    subCategory: 'Tax Payables',
    normalBalance: 'CREDIT',
    description: 'Central GST liability on intra-state service fees.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '2022',
    name: 'SGST Payable (9%)',
    category: 'LIABILITY',
    subCategory: 'Tax Payables',
    normalBalance: 'CREDIT',
    description: 'State GST liability on intra-state service fees.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '2023',
    name: 'IGST Payable (18%)',
    category: 'LIABILITY',
    subCategory: 'Tax Payables',
    normalBalance: 'CREDIT',
    description: 'Integrated GST liability on inter-state service fees.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '2030',
    name: 'Partner Commission Payable',
    category: 'LIABILITY',
    subCategory: 'Partner Payables',
    normalBalance: 'CREDIT',
    description: 'Accrued origination commissions payable to lending partners and DSAs.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '2040',
    name: 'Institutional Borrowings & Debt Capital',
    category: 'LIABILITY',
    subCategory: 'Borrowings & Debt Capital',
    normalBalance: 'CREDIT',
    description: 'Senior term debt, credit lines, and institutional funding lines.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '2050',
    name: 'Trade Accounts Payable & Vendor Dues',
    category: 'LIABILITY',
    subCategory: 'Accounts Payable',
    normalBalance: 'CREDIT',
    description: 'Operational vendor payables and service dues.',
    isSystemAccount: true,
    isActive: true,
  },

  // EQUITY (3000 - 3999)
  {
    code: '3010',
    name: 'Lending Capital & Retained Reserves',
    category: 'EQUITY',
    subCategory: 'Capital & Reserves',
    normalBalance: 'CREDIT',
    description: 'Tier-1 paid-up equity capital and statutory reserve funds.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '3020',
    name: 'Retained Earnings from Previous Periods',
    category: 'EQUITY',
    subCategory: 'Capital & Reserves',
    normalBalance: 'CREDIT',
    description: 'Cumulative retained net earnings carried forward from prior fiscal years.',
    isSystemAccount: true,
    isActive: true,
  },

  // INCOME (4000 - 4999)
  {
    code: '4010',
    name: 'Interest Income on Loans',
    category: 'INCOME',
    subCategory: 'Interest Income',
    normalBalance: 'CREDIT',
    description: 'Core lending yield recognized on active and standard loans.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '4020',
    name: 'Loan Processing Fee Income',
    category: 'INCOME',
    subCategory: 'Fee Income',
    normalBalance: 'CREDIT',
    description: 'Upfront origination fee income earned upon loan disbursement.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '4030',
    name: 'Late Payment & Default Charges Income',
    category: 'INCOME',
    subCategory: 'Penalty Income',
    normalBalance: 'CREDIT',
    description: 'Penal interest and cheque bounce fee income collected.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '4040',
    name: 'Documentation & Platform Fee Income',
    category: 'INCOME',
    subCategory: 'Other Lending Income',
    normalBalance: 'CREDIT',
    description: 'Document verification and platform convenience charges.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '4050',
    name: 'Foreclosure & Prepayment Penalty Income',
    category: 'INCOME',
    subCategory: 'Fee Income',
    normalBalance: 'CREDIT',
    description: 'Prepayment and early foreclosure fees collected.',
    isSystemAccount: true,
    isActive: true,
  },

  // EXPENSES (5000 - 5999)
  {
    code: '5010',
    name: 'Gateway & Payment Processing Fee Expense',
    category: 'EXPENSE',
    subCategory: 'Payment Gateway Expense',
    normalBalance: 'DEBIT',
    description: 'Interchange, PG gateway fees, and payout platform charges.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '5020',
    name: 'NPA & Credit Loss Provision Expense',
    category: 'EXPENSE',
    subCategory: 'Bad Debt Expense',
    normalBalance: 'DEBIT',
    description: 'Statutory loan loss provisioning expense as per RBI prudential norms.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '5030',
    name: 'Bad Debts Written Off Expense',
    category: 'EXPENSE',
    subCategory: 'Bad Debt Expense',
    normalBalance: 'DEBIT',
    description: 'Unrecoverable principal balances written off.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '5040',
    name: 'Partner Origination Commission Expense',
    category: 'EXPENSE',
    subCategory: 'Partner Commission Expense',
    normalBalance: 'DEBIT',
    description: 'Channel partner and sourcing DSA payout commission expense.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '5050',
    name: 'Collection Agency & Recovery Expenses',
    category: 'EXPENSE',
    subCategory: 'Collection Expense',
    normalBalance: 'DEBIT',
    description: 'External collection agency contingency fees and recovery costs.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '5060',
    name: 'Technology & Cloud Infrastructure Expense',
    category: 'EXPENSE',
    subCategory: 'Operating & Admin Expense',
    normalBalance: 'DEBIT',
    description: 'Core lending infrastructure, hosting, and API verification expenses.',
    isSystemAccount: true,
    isActive: true,
  },
  {
    code: '5070',
    name: 'General Operational & Administrative Expense',
    category: 'EXPENSE',
    subCategory: 'Operating & Admin Expense',
    normalBalance: 'DEBIT',
    description: 'Salaries, office rent, compliance, and overhead operations.',
    isSystemAccount: true,
    isActive: true,
  },
];

export class ChartOfAccountsService {
  private accounts: Map<string, GlAccountRecord> = new Map();

  constructor() {
    this.seedStandardAccounts();
  }

  private seedStandardAccounts(): void {
    for (const acc of ENRICHED_STANDARD_COA) {
      this.accounts.set(acc.code, { ...acc });
    }
  }

  /**
   * List Chart of Accounts with optional tenant & category filtering
   */
  public listAccounts(params?: {
    tenantId?: string;
    category?: AccountCategory;
    subCategory?: AccountSubCategory;
    activeOnly?: boolean;
  }): GlAccountRecord[] {
    let list = Array.from(this.accounts.values());

    if (params?.tenantId) {
      list = list.filter((a) => !a.tenantId || a.tenantId === params.tenantId);
    }
    if (params?.category) {
      list = list.filter((a) => a.category === params.category);
    }
    if (params?.subCategory) {
      list = list.filter((a) => a.subCategory === params.subCategory);
    }
    if (params?.activeOnly) {
      list = list.filter((a) => a.isActive);
    }

    return list.sort((a, b) => a.code.localeCompare(b.code));
  }

  /**
   * Get an account by its unique code
   */
  public getAccount(code: string): GlAccountRecord | undefined {
    return this.accounts.get(code);
  }

  /**
   * Create a new custom Chart of Accounts entry
   */
  public createAccount(input: {
    code: string;
    name: string;
    category: AccountCategory;
    subCategory: AccountSubCategory;
    normalBalance: 'DEBIT' | 'CREDIT';
    description: string;
    tenantId?: string;
    parentCode?: string;
    userId?: string;
  }): GlAccountRecord {
    if (this.accounts.has(input.code)) {
      throw new BadRequestError(`Account code "${input.code}" already exists in Chart of Accounts.`);
    }

    // Validate code format (numeric e.g., 1070, 2060, etc.)
    if (!/^\d{4,6}$/.test(input.code)) {
      throw new BadRequestError('Account code must be a 4 to 6 digit numeric code.');
    }

    // Validate category normal balance convention
    const expectedNormalBalance =
      input.category === 'ASSET' || input.category === 'EXPENSE' ? 'DEBIT' : 'CREDIT';
    if (input.normalBalance !== expectedNormalBalance) {
      throw new BadRequestError(
        `Account category "${input.category}" typically requires normal balance "${expectedNormalBalance}".`
      );
    }

    const newAcc: GlAccountRecord = {
      code: input.code,
      name: input.name,
      category: input.category,
      subCategory: input.subCategory,
      normalBalance: input.normalBalance,
      description: input.description,
      isSystemAccount: false,
      isActive: true,
      tenantId: input.tenantId,
      parentCode: input.parentCode,
    };

    this.accounts.set(input.code, newAcc);

    logAudit({
      tenantId: input.tenantId || 'GLOBAL',
      userId: input.userId || 'SYSTEM',
      action: 'COA_ACCOUNT_CREATED',
      entity: 'ChartOfAccounts',
      entityId: input.code,
      newValue: { name: input.name, category: input.category, subCategory: input.subCategory },
    });

    return newAcc;
  }

  /**
   * Update a custom Chart of Accounts entry (System accounts cannot be structurally altered)
   */
  public updateAccount(
    code: string,
    updates: {
      name?: string;
      description?: string;
      subCategory?: AccountSubCategory;
      isActive?: boolean;
      userId?: string;
    }
  ): GlAccountRecord {
    const existing = this.accounts.get(code);
    if (!existing) {
      throw new NotFoundError(`Account code "${code}" not found.`);
    }

    if (existing.isSystemAccount && updates.isActive === false) {
      throw new BadRequestError(`System-controlled account "${code}" (${existing.name}) cannot be deactivated.`);
    }

    const updated: GlAccountRecord = {
      ...existing,
      name: updates.name || existing.name,
      description: updates.description || existing.description,
      subCategory: updates.subCategory || existing.subCategory,
      isActive: updates.isActive !== undefined ? updates.isActive : existing.isActive,
    };

    this.accounts.set(code, updated);

    logAudit({
      tenantId: existing.tenantId || 'GLOBAL',
      userId: updates.userId || 'SYSTEM',
      action: 'COA_ACCOUNT_UPDATED',
      entity: 'ChartOfAccounts',
      entityId: code,
      newValue: { updates },
    });

    return updated;
  }

  /**
   * Delete or archive a custom account (System accounts strictly protected)
   */
  public deleteAccount(code: string, userId?: string): void {
    const existing = this.accounts.get(code);
    if (!existing) {
      throw new NotFoundError(`Account code "${code}" not found.`);
    }

    if (existing.isSystemAccount) {
      throw new BadRequestError(`System account "${code}" is immutable and protected from deletion.`);
    }

    this.accounts.delete(code);

    logAudit({
      tenantId: existing.tenantId || 'GLOBAL',
      userId: userId || 'SYSTEM',
      action: 'COA_ACCOUNT_DELETED',
      entity: 'ChartOfAccounts',
      entityId: code,
      newValue: { accountName: existing.name },
    });
  }
}

export const chartOfAccountsService = new ChartOfAccountsService();
