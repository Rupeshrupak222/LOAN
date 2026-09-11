// Double-Entry General Ledger (GL) & Financial Core Types

export type GlAccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

export interface GlAccount {
  code: string;
  name: string;
  category: GlAccountCategory;
  normalBalance: 'DEBIT' | 'CREDIT';
  description: string;
  isSystemAccount: boolean;
}

export type JournalEntryDirection = 'DEBIT' | 'CREDIT';

export interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  direction: JournalEntryDirection;
  amount: number;
  description?: string;
}

export type JournalReferenceType =
  | 'DISBURSEMENT'
  | 'DAILY_INTEREST_ACCRUAL'
  | 'REPAYMENT'
  | 'FEE_COLLECTION'
  | 'PENALTY_ASSESSMENT'
  | 'LOAN_RESTRUCTURE'
  | 'SETTLEMENT_WAIVER'
  | 'NPA_PROVISIONING'
  | 'WRITE_OFF'
  | 'MANUAL_ADJUSTMENT';

export interface JournalEntry {
  id: string;
  entryNumber: string;
  tenantId: string;
  branchId?: string;
  referenceType: JournalReferenceType;
  referenceId?: string;
  transactionDate: string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  postedBy?: string;
  createdAt: string;
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  category: GlAccountCategory;
  debitTotal: number;
  creditTotal: number;
  netBalance: number;
}

export interface TrialBalanceReport {
  tenantId: string;
  asOfDate: string;
  accounts: TrialBalanceItem[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
}

export type AssetClassificationType =
  | 'STANDARD_REGULAR'   // 0 DPD
  | 'SMA_0'              // 1-30 DPD
  | 'SMA_1'              // 31-60 DPD
  | 'SMA_2'              // 61-90 DPD
  | 'SUB_STANDARD_NPA'   // 91-180 DPD
  | 'DOUBTFUL_NPA'       // 181-365 DPD
  | 'LOSS_ASSET';        // >365 DPD or Uncollectible

export interface LoanAssetClassification {
  loanId: string;
  loanNo: string;
  borrowerName: string;
  principalOutstanding: number;
  interestOutstanding: number;
  dpd: number;
  classification: AssetClassificationType;
  provisionPct: number;
  provisionRequired: number;
  isNpa: boolean;
  npaDate?: string;
}

export interface PortfolioNpaSummary {
  tenantId: string;
  totalActiveLoans: number;
  totalBookOutstanding: number;
  standardLoansCount: number;
  standardLoansBook: number;
  smaLoansCount: number;
  smaLoansBook: number;
  npaLoansCount: number;
  npaLoansBook: number;
  grossNpaPct: number;
  netNpaPct: number;
  totalProvisionRequired: number;
  provisionCoverageRatioPct: number;
  generatedAt: string;
}
