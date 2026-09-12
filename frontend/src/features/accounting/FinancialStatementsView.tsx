'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  TrendingUp,
  Building,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { accountingApi } from './api';

export function FinancialStatementsView() {
  const [activeStatement, setActiveStatement] = useState<'PL' | 'BS' | 'CF'>('PL');

  const { data: pl, isLoading: isPlLoading } = useQuery({
    queryKey: ['accounting-pl'],
    queryFn: () => accountingApi.getProfitAndLoss(),
  });

  const { data: bs, isLoading: isBsLoading } = useQuery({
    queryKey: ['accounting-bs'],
    queryFn: () => accountingApi.getBalanceSheet(),
  });

  const { data: cf, isLoading: isCfLoading } = useQuery({
    queryKey: ['accounting-cf'],
    queryFn: () => accountingApi.getCashFlow(),
  });

  const isLoading = isPlLoading || isBsLoading || isCfLoading;

  return (
    <div className="space-y-6">
      {/* Statement Selector Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900 border border-slate-800 w-fit">
        <button
          onClick={() => setActiveStatement('PL')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeStatement === 'PL'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Profit & Loss (P&L)
        </button>

        <button
          onClick={() => setActiveStatement('BS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeStatement === 'BS'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building className="h-4 w-4" />
          Balance Sheet
        </button>

        <button
          onClick={() => setActiveStatement('CF')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeStatement === 'CF'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Cash Flow Statement
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mb-3"></div>
          <p className="text-sm">Calculating live financial statements from General Ledger...</p>
        </div>
      ) : activeStatement === 'PL' ? (
        /* ================= PROFIT & LOSS STATEMENT ================= */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400">Total Operating Revenue</span>
              <span className="text-lg font-bold text-emerald-400 block font-mono mt-1">
                ₹{(pl?.operatingRevenue?.totalRevenue || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400">Total Operating Expenses</span>
              <span className="text-lg font-bold text-rose-400 block font-mono mt-1">
                ₹{(pl?.operatingExpenses?.totalExpenses || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400">Net Operating Profit</span>
              <span className="text-lg font-bold text-white block font-mono mt-1">
                ₹{(pl?.netOperatingProfit || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <Card className="p-6 bg-slate-900/60 border-slate-800 space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Operating Revenue (Lending Yield & Fees)
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Interest Income on Loans (4010)</span>
                  <span className="text-slate-100">₹{(pl?.operatingRevenue?.interestIncome || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Loan Origination & Processing Fees (4020)</span>
                  <span className="text-slate-100">₹{(pl?.operatingRevenue?.processingFeeIncome || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Default & Penal Charges Income (4030)</span>
                  <span className="text-slate-100">₹{(pl?.operatingRevenue?.penaltyIncome || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Documentation & Other Fee Income (4040/4050)</span>
                  <span className="text-slate-100">₹{((pl?.operatingRevenue?.documentationFeeIncome || 0) + (pl?.operatingRevenue?.foreclosureIncome || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2.5 bg-slate-950/60 px-3 rounded-lg font-bold text-emerald-400 text-sm">
                  <span className="font-sans">Total Operating Revenue</span>
                  <span>₹{(pl?.operatingRevenue?.totalRevenue || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Operating Expenses & Provisions
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Partner DSA Origination Commission Expense (5040)</span>
                  <span className="text-rose-400">₹{(pl?.operatingExpenses?.partnerCommissionExpense || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Gateway & Payment Processing Fees (5010)</span>
                  <span className="text-rose-400">₹{(pl?.operatingExpenses?.paymentGatewayExpense || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Collection Agency & Recovery Expenses (5050)</span>
                  <span className="text-rose-400">₹{(pl?.operatingExpenses?.collectionExpense || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Technology & Cloud Infrastructure (5060)</span>
                  <span className="text-rose-400">₹{(pl?.operatingExpenses?.technologyExpense || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">NPA Provisioning & Bad Debts Written Off (5020/5030)</span>
                  <span className="text-rose-400">₹{(pl?.operatingExpenses?.badDebtExpense || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2.5 bg-slate-950/60 px-3 rounded-lg font-bold text-rose-400 text-sm">
                  <span className="font-sans">Total Operating Expenses</span>
                  <span>₹{(pl?.operatingExpenses?.totalExpenses || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-700 flex justify-between items-center text-base font-bold">
              <span className="text-white">Net Operating Profit</span>
              <span className="text-emerald-400 font-mono">
                ₹{(pl?.netOperatingProfit || 0).toLocaleString()}
              </span>
            </div>
          </Card>
        </div>
      ) : activeStatement === 'BS' ? (
        /* ================= BALANCE SHEET ================= */
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white">Balance Sheet Double-Entry Invariant</h4>
              <p className="text-xs text-slate-400">
                Formula: Assets = Liabilities + Equity
              </p>
            </div>
            {bs?.isBalanced ? (
              <Badge variant="success" className="px-3 py-1 font-bold">
                ASSETS = LIABILITIES + EQUITY (BALANCED)
              </Badge>
            ) : (
              <Badge variant="danger" className="px-3 py-1 font-bold">
                IMBALANCE: ₹{bs?.imbalanceAmount}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets */}
            <Card className="p-6 bg-slate-900/60 border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                ASSETS
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-2 border-b border-slate-800/40">
                  <span className="text-slate-300 font-sans">Cash & Bank Clearing (1010)</span>
                  <span className="text-slate-100">₹{(bs?.assets?.cashAndBank || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/40">
                  <span className="text-slate-300 font-sans">Loans Outstanding Principal (1020)</span>
                  <span className="text-slate-100">₹{(bs?.assets?.loanPrincipalReceivable || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/40">
                  <span className="text-slate-300 font-sans">Interest Receivable (1030/1040)</span>
                  <span className="text-slate-100">₹{(bs?.assets?.interestReceivable || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/40">
                  <span className="text-slate-300 font-sans">Penalties & Fees Receivable (1050/1060)</span>
                  <span className="text-slate-100">₹{((bs?.assets?.penaltyReceivable || 0) + (bs?.assets?.feeReceivable || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/40">
                  <span className="text-slate-300 font-sans">Suspense Clearing Assets (1099)</span>
                  <span className="text-slate-100">₹{(bs?.assets?.otherReceivables || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2.5 bg-blue-950/40 px-3 rounded-lg font-bold text-blue-400 text-sm">
                  <span className="font-sans">Total Assets</span>
                  <span>₹{(bs?.assets?.totalAssets || 0).toLocaleString()}</span>
                </div>
              </div>
            </Card>

            {/* Liabilities & Equity */}
            <Card className="p-6 bg-slate-900/60 border-slate-800 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  LIABILITIES
                </h4>
                <div className="space-y-2 text-xs font-mono mt-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                    <span className="text-slate-300 font-sans">Institutional Borrowings (2040)</span>
                    <span className="text-slate-100">₹{(bs?.liabilities?.borrowingsAndDebtCapital || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                    <span className="text-slate-300 font-sans">Partner DSA Payables (2030)</span>
                    <span className="text-slate-100">₹{(bs?.liabilities?.partnerPayables || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                    <span className="text-slate-300 font-sans">Statutory GST Payables (2020-2023)</span>
                    <span className="text-slate-100">₹{(bs?.liabilities?.taxPayables || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                    <span className="text-slate-300 font-sans">Customer Excess Deposits (2010)</span>
                    <span className="text-slate-100">₹{(bs?.liabilities?.otherLiabilities || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-amber-950/30 px-3 rounded font-bold text-amber-400">
                    <span className="font-sans">Total Liabilities</span>
                    <span>₹{(bs?.liabilities?.totalLiabilities || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                  EQUITY & RESERVES
                </h4>
                <div className="space-y-2 text-xs font-mono mt-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                    <span className="text-slate-300 font-sans">Lending Tier-1 Capital (3010)</span>
                    <span className="text-slate-100">₹{(bs?.equity?.capitalAndReserves || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-800/40">
                    <span className="text-slate-300 font-sans">Current Period Profit / Loss</span>
                    <span className="text-emerald-400 font-bold">₹{(bs?.equity?.currentPeriodProfitLoss || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-2 bg-purple-950/30 px-3 rounded font-bold text-purple-300">
                    <span className="font-sans">Total Equity</span>
                    <span>₹{(bs?.equity?.totalEquity || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-700 flex justify-between font-bold text-sm">
                <span className="text-white">Total Liabilities & Equity</span>
                <span className="text-white font-mono">
                  ₹{(bs?.totalLiabilitiesAndEquity || 0).toLocaleString()}
                </span>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* ================= CASH FLOW STATEMENT ================= */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400">Net Operating Cash Flow</span>
              <span className="text-lg font-bold text-emerald-400 block font-mono mt-1">
                ₹{(cf?.operatingActivities?.netCashFromOperations || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400">Net Financing Cash Flow</span>
              <span className="text-lg font-bold text-blue-400 block font-mono mt-1">
                ₹{(cf?.financingActivities?.netCashFromFinancing || 0).toLocaleString()}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400">Closing Cash & Bank Balance</span>
              <span className="text-lg font-bold text-white block font-mono mt-1">
                ₹{(cf?.closingCashBalance || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <Card className="p-6 bg-slate-900/60 border-slate-800 space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Cash Flows from Operating Activities
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Borrower Loan Repayments Inflow</span>
                  <span className="text-emerald-400">+₹{(cf?.operatingActivities?.borrowerRepaymentInflows || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Loan Disbursement Outflows</span>
                  <span className="text-rose-400">-₹{(cf?.operatingActivities?.loanDisbursementOutflows || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Fee & Penalty Collections</span>
                  <span className="text-emerald-400">+₹{(cf?.operatingActivities?.feeAndPenaltyCollections || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Partner Commission & Direct Operational Payments</span>
                  <span className="text-rose-400">-₹{(cf?.operatingActivities?.partnerCommissionPayments || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2.5 bg-slate-950/60 px-3 rounded-lg font-bold text-emerald-400 text-sm">
                  <span className="font-sans">Net Cash from Operating Activities</span>
                  <span>₹{(cf?.operatingActivities?.netCashFromOperations || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Cash Flows from Financing Activities
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Capital Inflows & Reserves</span>
                  <span className="text-blue-400">+₹{(cf?.financingActivities?.capitalInflows || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/60">
                  <span className="text-slate-300 font-sans">Debt Borrowings & Funding Lines</span>
                  <span className="text-blue-400">+₹{(cf?.financingActivities?.debtBorrowings || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2.5 bg-slate-950/60 px-3 rounded-lg font-bold text-blue-400 text-sm">
                  <span className="font-sans">Net Cash from Financing Activities</span>
                  <span>₹{(cf?.financingActivities?.netCashFromFinancing || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
