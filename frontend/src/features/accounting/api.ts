import { api } from '@/lib/api';
import type {
  FinanceControlDashboardSummary,
  GlAccountRecord,
  GlAccountCategory,
  AccountSubCategory,
  AccountingPeriodRecord,
  PeriodCloseChecklistItem,
  ManualJournalRecord,
  ManualJournalLineInput,
  ManualJournalStatus,
  JournalSourceType,
  PeriodTrialBalanceReport,
  AccountGeneralLedgerReport,
  ProfitAndLossReport,
  BalanceSheetReport,
  CashFlowReport,
  ReceivablesSummaryReport,
  PayableRecord,
  PayableType,
  PayableStatus,
  AccrualEntryRecord,
  AccrualType,
  AccrualStatus,
  TaxEntryRecord,
  TaxPeriodSummaryReport,
  TaxType,
  SuspenseEntryRecord,
  SuspenseStatus,
} from './types';

export const accountingApi = {
  // 1. Dashboard
  getDashboard: async (): Promise<FinanceControlDashboardSummary> => {
    const res = await api.get('/accounting/dashboard');
    return res.data?.data;
  },

  // 2. Chart of Accounts (COA)
  getAccounts: async (params?: {
    category?: GlAccountCategory;
    subCategory?: AccountSubCategory;
    activeOnly?: boolean;
  }): Promise<GlAccountRecord[]> => {
    const res = await api.get('/accounting/coa', { params });
    return res.data?.data || [];
  },

  getAccount: async (code: string): Promise<GlAccountRecord> => {
    const res = await api.get(`/accounting/coa/${code}`);
    return res.data?.data;
  },

  createAccount: async (data: {
    code: string;
    name: string;
    category: GlAccountCategory;
    subCategory: AccountSubCategory;
    normalBalance: 'DEBIT' | 'CREDIT';
    description: string;
  }): Promise<GlAccountRecord> => {
    const res = await api.post('/accounting/coa', data);
    return res.data?.data;
  },

  updateAccount: async (
    code: string,
    updates: { name?: string; description?: string; subCategory?: AccountSubCategory; isActive?: boolean }
  ): Promise<GlAccountRecord> => {
    const res = await api.patch(`/accounting/coa/${code}`, updates);
    return res.data?.data;
  },

  deleteAccount: async (code: string): Promise<{ deleted: boolean }> => {
    const res = await api.delete(`/accounting/coa/${code}`);
    return res.data?.data;
  },

  // 3. Accounting Periods
  getPeriods: async (): Promise<AccountingPeriodRecord[]> => {
    const res = await api.get('/accounting/periods');
    return res.data?.data || [];
  },

  getPeriod: async (id: string): Promise<AccountingPeriodRecord> => {
    const res = await api.get(`/accounting/periods/${id}`);
    return res.data?.data;
  },

  createPeriod: async (data: {
    name: string;
    periodCode: string;
    startDate: string;
    endDate: string;
  }): Promise<AccountingPeriodRecord> => {
    const res = await api.post('/accounting/periods', data);
    return res.data?.data;
  },

  runPeriodChecklist: async (id: string): Promise<PeriodCloseChecklistItem[]> => {
    const res = await api.post(`/accounting/periods/${id}/checklist`);
    return res.data?.data || [];
  },

  softClosePeriod: async (id: string): Promise<AccountingPeriodRecord> => {
    const res = await api.post(`/accounting/periods/${id}/soft-close`);
    return res.data?.data;
  },

  closePeriod: async (id: string): Promise<AccountingPeriodRecord> => {
    const res = await api.post(`/accounting/periods/${id}/close`);
    return res.data?.data;
  },

  reopenPeriod: async (id: string, reason: string): Promise<AccountingPeriodRecord> => {
    const res = await api.post(`/accounting/periods/${id}/reopen`, { reason });
    return res.data?.data;
  },

  // 4. Manual Journals & Maker-Checker
  getJournals: async (params?: {
    status?: ManualJournalStatus;
    periodCode?: string;
    source?: JournalSourceType;
  }): Promise<ManualJournalRecord[]> => {
    const res = await api.get('/accounting/journals', { params });
    return res.data?.data || [];
  },

  getJournal: async (id: string): Promise<ManualJournalRecord> => {
    const res = await api.get(`/accounting/journals/${id}`);
    return res.data?.data;
  },

  createJournal: async (data: {
    transactionDate?: string;
    description: string;
    source?: JournalSourceType;
    reference?: string;
    lines: ManualJournalLineInput[];
    submitImmediately?: boolean;
  }): Promise<ManualJournalRecord> => {
    const res = await api.post('/accounting/journals', data);
    return res.data?.data;
  },

  submitJournal: async (id: string): Promise<ManualJournalRecord> => {
    const res = await api.post(`/accounting/journals/${id}/submit`);
    return res.data?.data;
  },

  approveJournal: async (id: string): Promise<ManualJournalRecord> => {
    const res = await api.post(`/accounting/journals/${id}/approve`);
    return res.data?.data;
  },

  postJournal: async (id: string): Promise<ManualJournalRecord> => {
    const res = await api.post(`/accounting/journals/${id}/post`);
    return res.data?.data;
  },

  rejectJournal: async (id: string, reason: string): Promise<ManualJournalRecord> => {
    const res = await api.post(`/accounting/journals/${id}/reject`, { reason });
    return res.data?.data;
  },

  reverseJournal: async (
    id: string,
    reason: string
  ): Promise<{ originalJournal: ManualJournalRecord; reversalJournal: ManualJournalRecord }> => {
    const res = await api.post(`/accounting/journals/${id}/reverse`, { reason });
    return res.data?.data;
  },

  // 5. Live Financial Reports
  getTrialBalance: async (params?: {
    periodCode?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PeriodTrialBalanceReport> => {
    const res = await api.get('/accounting/reports/trial-balance', { params });
    return res.data?.data;
  },

  getAccountGeneralLedger: async (
    accountCode: string,
    params?: { startDate?: string; endDate?: string }
  ): Promise<AccountGeneralLedgerReport> => {
    const res = await api.get(`/accounting/reports/general-ledger/${accountCode}`, { params });
    return res.data?.data;
  },

  getProfitAndLoss: async (params?: {
    periodCode?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ProfitAndLossReport> => {
    const res = await api.get('/accounting/reports/profit-and-loss', { params });
    return res.data?.data;
  },

  getBalanceSheet: async (params?: { asOfDate?: string }): Promise<BalanceSheetReport> => {
    const res = await api.get('/accounting/reports/balance-sheet', { params });
    return res.data?.data;
  },

  getCashFlow: async (params?: { startDate?: string; endDate?: string }): Promise<CashFlowReport> => {
    const res = await api.get('/accounting/reports/cash-flow', { params });
    return res.data?.data;
  },

  // 6. Receivables & Payables
  getReceivablesSummary: async (params?: { asOfDate?: string }): Promise<ReceivablesSummaryReport> => {
    const res = await api.get('/accounting/receivables/summary', { params });
    return res.data?.data;
  },

  getPayables: async (params?: {
    status?: PayableStatus;
    payableType?: PayableType;
  }): Promise<PayableRecord[]> => {
    const res = await api.get('/accounting/payables', { params });
    return res.data?.data || [];
  },

  getPayable: async (id: string): Promise<PayableRecord> => {
    const res = await api.get(`/accounting/payables/${id}`);
    return res.data?.data;
  },

  createPayable: async (data: {
    vendorOrPartnerName: string;
    payableType: PayableType;
    invoiceNumber?: string;
    description: string;
    amount: number;
    currency?: string;
    dueDate: string;
    accountDebitCode?: string;
    accountCreditCode?: string;
    autoSubmit?: boolean;
  }): Promise<PayableRecord> => {
    const res = await api.post('/accounting/payables', data);
    return res.data?.data;
  },

  approvePayable: async (id: string): Promise<PayableRecord> => {
    const res = await api.post(`/accounting/payables/${id}/approve`);
    return res.data?.data;
  },

  recordPayablePayment: async (
    id: string,
    data: { payoutUtr: string; paidAt?: string; accountPaidFromCode?: string }
  ): Promise<PayableRecord> => {
    const res = await api.post(`/accounting/payables/${id}/record-payment`, data);
    return res.data?.data;
  },

  // 7. Accruals
  getAccruals: async (params?: {
    status?: AccrualStatus;
    accrualType?: AccrualType;
  }): Promise<AccrualEntryRecord[]> => {
    const res = await api.get('/accounting/accruals', { params });
    return res.data?.data || [];
  },

  createAccrual: async (data: {
    accrualType: AccrualType;
    description: string;
    amount: number;
    effectiveDate?: string;
    autoReversalDate?: string;
    accountDebitCode?: string;
    accountCreditCode?: string;
  }): Promise<AccrualEntryRecord> => {
    const res = await api.post('/accounting/accruals', data);
    return res.data?.data;
  },

  approveAndPostAccrual: async (id: string): Promise<AccrualEntryRecord> => {
    const res = await api.post(`/accounting/accruals/${id}/approve-and-post`);
    return res.data?.data;
  },

  reverseAccrual: async (id: string, reason: string): Promise<AccrualEntryRecord> => {
    const res = await api.post(`/accounting/accruals/${id}/reverse`, { reason });
    return res.data?.data;
  },

  // 8. Tax Accounting & GST
  getTaxEntries: async (params?: {
    taxPeriod?: string;
    taxType?: TaxType;
  }): Promise<TaxEntryRecord[]> => {
    const res = await api.get('/accounting/tax/entries', { params });
    return res.data?.data || [];
  },

  getTaxPeriodSummary: async (params?: { taxPeriod?: string }): Promise<TaxPeriodSummaryReport> => {
    const res = await api.get('/accounting/tax/period-summary', { params });
    return res.data?.data;
  },

  recordOutputTax: async (data: {
    referenceType: string;
    referenceId: string;
    taxableAmount: number;
    isInterstate?: boolean;
    taxRatePct?: number;
    transactionDate?: string;
  }): Promise<TaxEntryRecord> => {
    const res = await api.post('/accounting/tax/output', data);
    return res.data?.data;
  },

  recordInputTax: async (data: {
    referenceType: string;
    referenceId: string;
    taxableAmount: number;
    isInterstate?: boolean;
    taxRatePct?: number;
    transactionDate?: string;
  }): Promise<TaxEntryRecord> => {
    const res = await api.post('/accounting/tax/input', data);
    return res.data?.data;
  },

  // 9. Suspense Clearing Desk
  getSuspenseEntries: async (params?: { status?: SuspenseStatus }): Promise<SuspenseEntryRecord[]> => {
    const res = await api.get('/accounting/suspense', { params });
    return res.data?.data || [];
  },

  createSuspenseEntry: async (data: {
    reference: string;
    amount: number;
    direction: 'DEBIT' | 'CREDIT';
    reason: string;
    assignedOwner?: string;
    entryDate?: string;
    postGl?: boolean;
  }): Promise<SuspenseEntryRecord> => {
    const res = await api.post('/accounting/suspense', data);
    return res.data?.data;
  },

  resolveSuspenseEntry: async (
    id: string,
    data: { targetAccountCode: string; resolutionNotes: string }
  ): Promise<SuspenseEntryRecord> => {
    const res = await api.post(`/accounting/suspense/${id}/resolve`, data);
    return res.data?.data;
  },
};
