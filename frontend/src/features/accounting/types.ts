// Phase 12: Accounting & Financial Operations Frontend Domain Types

export type GlAccountCategory = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

export type AccountSubCategory =
  | 'Cash & Bank'
  | 'Loan Principal Receivable'
  | 'Interest Receivable'
  | 'Fee Receivable'
  | 'Penalty Receivable'
  | 'Other Receivables'
  | 'Borrowings & Debt Capital'
  | 'Accounts Payable'
  | 'Partner Payables'
  | 'Tax Payables'
  | 'Other Liabilities'
  | 'Capital & Reserves'
  | 'Interest Income'
  | 'Fee Income'
  | 'Penalty Income'
  | 'Other Lending Income'
  | 'Partner Commission Expense'
  | 'Payment Gateway Expense'
  | 'Collection Expense'
  | 'Operating & Admin Expense'
  | 'Bad Debt Expense'
  | 'Suspense Clearing';

export interface GlAccountRecord {
  code: string;
  name: string;
  category: GlAccountCategory;
  subCategory: AccountSubCategory;
  normalBalance: 'DEBIT' | 'CREDIT';
  description: string;
  isSystemAccount: boolean;
  isActive: boolean;
  tenantId?: string;
  parentCode?: string;
}

export type PeriodStatus = 'OPEN' | 'SOFT_CLOSED' | 'CLOSED' | 'REOPENED';

export interface PeriodCloseChecklistItem {
  code: string;
  name: string;
  description: string;
  passed: boolean;
  details?: string;
}

export interface AccountingPeriodRecord {
  id: string;
  tenantId: string;
  name: string;
  periodCode: string;
  startDate: string;
  endDate: string;
  status: PeriodStatus;
  checklist: PeriodCloseChecklistItem[];
  closedByUserId?: string;
  closedAt?: string;
  reopenReason?: string;
  reopenedByUserId?: string;
  reopenedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ManualJournalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'POSTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'REVERSED';

export type JournalSourceType =
  | 'MANUAL'
  | 'ADJUSTMENT'
  | 'ACCRUAL_REVERSAL'
  | 'TAX_ADJUSTMENT'
  | 'SUSPENSE_RESOLUTION'
  | 'CORRECTION';

export interface ManualJournalLineInput {
  accountCode: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  description?: string;
}

export interface ManualJournalLineRecord {
  id: string;
  accountCode: string;
  accountName: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: number;
  description?: string;
}

export interface ManualJournalRecord {
  id: string;
  journalNumber: string;
  tenantId: string;
  branchId?: string;
  periodId: string;
  periodCode: string;
  transactionDate: string;
  description: string;
  source: JournalSourceType;
  reference?: string;
  lines: ManualJournalLineRecord[];
  totalDebit: number;
  totalCredit: number;
  status: ManualJournalStatus;
  createdByUserId: string;
  createdByUserName?: string;
  submittedByUserId?: string;
  approvedByUserId?: string;
  approvedByUserName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  glJournalId?: string;
  reversalJournalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodTrialBalanceItem {
  accountCode: string;
  accountName: string;
  category: GlAccountCategory;
  subCategory: AccountSubCategory;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
  netBalance: number;
}

export interface PeriodTrialBalanceReport {
  tenantId: string;
  periodCode?: string;
  startDate: string;
  endDate: string;
  accounts: PeriodTrialBalanceItem[];
  totalOpeningDebits: number;
  totalOpeningCredits: number;
  totalPeriodDebits: number;
  totalPeriodCredits: number;
  totalClosingDebits: number;
  totalClosingCredits: number;
  isBalanced: boolean;
}

export interface GeneralLedgerTransactionRow {
  transactionDate: string;
  journalId: string;
  entryNumber: string;
  referenceType: string;
  referenceId?: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  postedBy?: string;
}

export interface AccountGeneralLedgerReport {
  accountCode: string;
  accountName: string;
  category: GlAccountCategory;
  normalBalance: 'DEBIT' | 'CREDIT';
  openingBalance: number;
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
  transactions: GeneralLedgerTransactionRow[];
}

export interface ProfitAndLossReport {
  tenantId: string;
  periodCode?: string;
  startDate: string;
  endDate: string;
  operatingRevenue: {
    interestIncome: number;
    processingFeeIncome: number;
    documentationFeeIncome: number;
    platformFeeIncome: number;
    penaltyIncome: number;
    foreclosureIncome: number;
    otherLendingIncome: number;
    totalRevenue: number;
  };
  operatingExpenses: {
    partnerCommissionExpense: number;
    paymentGatewayExpense: number;
    collectionExpense: number;
    employeeAndAdminExpense: number;
    technologyExpense: number;
    otherOperatingExpenses: number;
    badDebtExpense: number;
    totalExpenses: number;
  };
  netOperatingProfit: number;
}

export interface BalanceSheetReport {
  tenantId: string;
  asOfDate: string;
  assets: {
    cashAndBank: number;
    loanPrincipalReceivable: number;
    interestReceivable: number;
    feeReceivable: number;
    penaltyReceivable: number;
    otherReceivables: number;
    totalAssets: number;
  };
  liabilities: {
    borrowingsAndDebtCapital: number;
    accountsPayable: number;
    partnerPayables: number;
    taxPayables: number;
    otherLiabilities: number;
    totalLiabilities: number;
  };
  equity: {
    capitalAndReserves: number;
    retainedEarnings: number;
    currentPeriodProfitLoss: number;
    totalEquity: number;
  };
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  imbalanceAmount: number;
}

export interface CashFlowReport {
  tenantId: string;
  startDate: string;
  endDate: string;
  operatingActivities: {
    borrowerRepaymentInflows: number;
    loanDisbursementOutflows: number;
    feeAndPenaltyCollections: number;
    partnerCommissionPayments: number;
    operatingExpensePayments: number;
    netCashFromOperations: number;
  };
  financingActivities: {
    capitalInflows: number;
    debtBorrowings: number;
    debtRepayments: number;
    netCashFromFinancing: number;
  };
  netCashFlow: number;
  openingCashBalance: number;
  closingCashBalance: number;
}

export type ReceivableAgingBucket = 'CURRENT' | '1-30' | '31-60' | '61-90' | '91-180' | '180+';

export interface ReceivablesAgingBreakdown {
  bucket: ReceivableAgingBucket;
  principalAmount: number;
  interestAmount: number;
  feeAmount: number;
  penaltyAmount: number;
  totalAmount: number;
  accountsCount: number;
}

export interface ReceivablesSummaryReport {
  tenantId: string;
  asOfDate: string;
  totalPrincipalOutstanding: number;
  totalInterestReceivable: number;
  totalFeesReceivable: number;
  totalPenaltiesReceivable: number;
  totalReceivables: number;
  totalOverdueAmount: number;
  totalWrittenOffAmount: number;
  totalRecoveredAmount: number;
  agingBuckets: ReceivablesAgingBreakdown[];
}

export type PayableType =
  | 'PARTNER_COMMISSION'
  | 'PAYMENT_GATEWAY_FEE'
  | 'VENDOR_SERVICE'
  | 'TAX_PAYABLE'
  | 'OPERATIONAL_EXPENSE';

export type PayableStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'DUE' | 'PAID' | 'CLOSED';

export interface PayableRecord {
  id: string;
  tenantId: string;
  vendorOrPartnerName: string;
  payableType: PayableType;
  invoiceNumber?: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: PayableStatus;
  accountDebitCode: string;
  accountCreditCode: string;
  approvedByUserId?: string;
  payoutId?: string;
  payoutUtr?: string;
  paidAt?: string;
  glJournalId?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccrualType = 'INTEREST_ACCRUAL' | 'EXPENSE_ACCRUAL' | 'COMMISSION_ACCRUAL' | 'FEE_ACCRUAL';

export type AccrualStatus = 'DRAFT' | 'APPROVED' | 'POSTED' | 'REVERSED';

export interface AccrualEntryRecord {
  id: string;
  tenantId: string;
  accrualType: AccrualType;
  periodId: string;
  description: string;
  amount: number;
  effectiveDate: string;
  autoReversalDate?: string;
  accountDebitCode: string;
  accountCreditCode: string;
  status: AccrualStatus;
  proposedByUserId: string;
  approvedByUserId?: string;
  glJournalId?: string;
  reversalJournalId?: string;
  reversedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaxType = 'GST_OUTPUT_FEE' | 'GST_INPUT_VENDOR' | 'TDS_PARTNER' | 'RCM_EXPENSE';

export interface TaxEntryRecord {
  id: string;
  tenantId: string;
  taxPeriod: string;
  taxType: TaxType;
  referenceType: string;
  referenceId: string;
  taxableAmount: number;
  taxRatePct: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  transactionDate: string;
  glJournalId?: string;
  createdAt: string;
}

export interface TaxPeriodSummaryReport {
  tenantId: string;
  taxPeriod: string;
  totalTaxableFeeVolume: number;
  outputGstCollected: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  inputGstEligible: {
    cgst: number;
    sgst: number;
    igst: number;
    total: number;
  };
  netGstPayable: number;
}

export type SuspenseStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'WRITTEN_OFF';

export interface SuspenseEntryRecord {
  id: string;
  tenantId: string;
  reference: string;
  amount: number;
  direction: 'DEBIT' | 'CREDIT';
  entryDate: string;
  reason: string;
  assignedOwner?: string;
  status: SuspenseStatus;
  resolutionNotes?: string;
  resolutionJournalId?: string;
  resolvedByUserId?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceControlDashboardSummary {
  accountingHealth: {
    currentOpenPeriod: string;
    pendingJournalsCount: number;
    unbalancedJournalsCount: number;
    unresolvedReconExceptionsCount: number;
    openSuspenseBalance: number;
    backdatedExceptionsCount: number;
  };
  portfolioFinance: {
    totalPrincipalOutstanding: number;
    totalInterestReceivable: number;
    totalFeesReceivable: number;
    totalOverdueReceivable: number;
    totalWrittenOffAmount: number;
    totalRecoveredAmount: number;
  };
  profitabilityYtd: {
    totalLendingRevenue: number;
    totalOperatingExpenses: number;
    netOperatingProfit: number;
    operatingMarginPct: number;
  };
  liquidity: {
    cashAndBankBalance: number;
    totalDisbursementsOutflow: number;
    totalRepaymentsInflow: number;
    netOperatingCashFlow: number;
  };
}
