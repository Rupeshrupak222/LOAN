'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Clock,
  DollarSign,
  FileText,
  Activity,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ExternalLink,
  Upload,
  Info,
  Calendar,
  CreditCard,
  Percent,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { Card, Button, Badge, Spinner } from './ui';

interface BankStatementIntelligenceCardProps {
  customerId: string;
  applicationId?: string;
  readOnly?: boolean;
}

export function BankStatementIntelligenceCard({
  customerId,
  applicationId,
  readOnly = false,
}: BankStatementIntelligenceCardProps) {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INCOME' | 'CASH_FLOW' | 'OBLIGATIONS' | 'ANOMALIES' | 'AI_INSIGHTS'>('OVERVIEW');
  const [showIngestModal, setShowIngestModal] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['bank-intelligence', customerId],
    queryFn: async () => {
      const res = await api.get(`/bank-intelligence/customers/${customerId}`);
      return res.data?.data;
    },
    enabled: Boolean(customerId),
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/bank-intelligence/customers/${customerId}/analyze`);
      return res.data?.data;
    },
    onSuccess: () => {
      refetch();
    },
    onError: (err: any) => {
      alert(`Bank Statement analysis error: ${apiErrorMessage(err)}`);
    },
  });

  const ingestSampleMutation = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const sampleTxns: any[] = [];

      // Generate 6 months of sample salaried statement data
      for (let m = 5; m >= 0; m--) {
        const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');

        // Salary credit on the 1st
        sampleTxns.push({
          transactionDate: `${yyyy}-${mm}-01`,
          description: 'CMS/INFOSYS LTD/SALARY CR',
          amount: 85000,
          transactionType: 'CREDIT',
          balanceAfterTransaction: 92000,
        });

        // Rent on 5th
        sampleTxns.push({
          transactionDate: `${yyyy}-${mm}-05`,
          description: 'UPI/RENT TO LANDLORD SHARMA',
          amount: 22000,
          transactionType: 'DEBIT',
          balanceAfterTransaction: 70000,
        });

        // Bajaj EMI on 10th
        sampleTxns.push({
          transactionDate: `${yyyy}-${mm}-10`,
          description: 'ACH DR BAJAJ FINANCE LTD EMI',
          amount: 11500,
          transactionType: 'DEBIT',
          balanceAfterTransaction: 58500,
        });

        // Utilities on 15th
        sampleTxns.push({
          transactionDate: `${yyyy}-${mm}-15`,
          description: 'BESCOM ELECTRICITY BILL BANGALORE',
          amount: 2200,
          transactionType: 'DEBIT',
          balanceAfterTransaction: 56300,
        });

        // General UPI/Living expenses
        sampleTxns.push({
          transactionDate: `${yyyy}-${mm}-22`,
          description: 'UPI/SWIGGY/GROCERIES/SUPERMARKET',
          amount: 14000,
          transactionType: 'DEBIT',
          balanceAfterTransaction: 42300,
        });
      }

      // Add a recent pre-loan spike anomaly in last month
      const currentY = today.getFullYear();
      const currentM = String(today.getMonth() + 1).padStart(2, '0');
      sampleTxns.push({
        transactionDate: `${currentY}-${currentM}-26`,
        description: 'IMPS INWARD FROM FRIEND KAPOOR',
        amount: 150000,
        transactionType: 'CREDIT',
        balanceAfterTransaction: 192300,
      });

      const res = await api.post(`/bank-intelligence/customers/${customerId}/ingest`, {
        bankName: 'HDFC Bank',
        accountNumber: '501004928190',
        source: 'VERIFIED_E_STATEMENT',
        transactions: sampleTxns,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      setShowIngestModal(false);
      refetch();
    },
    onError: (err: any) => {
      alert(`Statement ingestion error: ${apiErrorMessage(err)}`);
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <Spinner />
          <p className="text-xs text-slate-500 font-medium">Loading Bank Statement Intelligence...</p>
        </div>
      </Card>
    );
  }

  const result = data;
  const hasTransactions = result && result.transactionsCount > 0;

  return (
    <Card className="p-5 space-y-5 border border-slate-200 dark:border-[#1E2445] shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-[#1E2445] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-bold">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Bank Statement & Cash Flow Intelligence
              </h3>
              {result && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300">
                  {result.source}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {result?.bankName || 'Bank'} • Account {result?.accountNumberMasked || 'XXXXXX'} •{' '}
              {hasTransactions ? `${result.transactionsCount} Transactions Analyzed` : 'No statement ingested'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowIngestModal(true)}
                className="text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                Ingest Statement
              </Button>
              {hasTransactions && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={analyzeMutation.isPending || isFetching}
                  onClick={() => analyzeMutation.mutate()}
                  className="text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', (analyzeMutation.isPending || isFetching) && 'animate-spin')} />
                  {analyzeMutation.isPending ? 'Analyzing...' : 'Re-Analyze'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Empty State Banner */}
      {!hasTransactions && (
        <div className="p-6 text-center space-y-3 bg-slate-50 dark:bg-[#1E2445]/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <FileText className="h-8 w-8 text-slate-400 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              No Bank Statement Transactions Available
            </p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Ingest an authorized bank statement (verified e-statement, PDF parser, or via the Step 12 Integration Hub) to generate income consistency, cash-flow, and obligation metrics.
            </p>
          </div>
          {!readOnly && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowIngestModal(true)}
              className="text-xs"
            >
              Ingest Sample Verified Statement
            </Button>
          )}
        </div>
      )}

      {/* Main Analytics Content */}
      {hasTransactions && (
        <>
          {/* Top Level Financial KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445]/30 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Estimated Salary</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                ₹{result.incomeIntelligence.estimatedRecurringSalary.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {result.incomeIntelligence.salaryFrequency} • Score {result.incomeIntelligence.incomeStabilityScore}/100
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445]/30 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Avg Bank Balance (ABB)</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                ₹{result.cashFlowIntelligence.averageBankBalance.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Min: ₹{result.cashFlowIntelligence.minimumBalanceRecorded.toLocaleString('en-IN')} • {result.cashFlowIntelligence.lowBalanceDaysCount} low-bal days
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445]/30 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Net Cash Flow</p>
              <p
                className={cn(
                  'text-base font-bold mt-0.5',
                  result.cashFlowIntelligence.netCashFlow >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                )}
              >
                ₹{result.cashFlowIntelligence.netCashFlow.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Burn Ratio: {result.cashFlowIntelligence.cashBurnVelocityRatio}x ({result.cashFlowIntelligence.liquidityRiskTier} Risk)
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1E2445]/30 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Detected Obligations</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                ₹{result.obligationIntelligence.estimatedTotalMonthlyObligations.toLocaleString('en-IN')}/mo
              </p>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                {result.obligationIntelligence.detectedEmis.length} Active EMI Line(s)
              </p>
            </div>
          </div>

          {/* Undisclosed Debt Warning Alert */}
          {result.obligationIntelligence.declaredObligationsComparison.possibleUndisclosedDebt && (
            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-none mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Potential Undisclosed Debt Commitment Detected</p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  {result.obligationIntelligence.declaredObligationsComparison.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Anomaly Summary Pill Banner */}
          {result.anomalySignals.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-200">
              <ShieldAlert className="h-4 w-4 text-rose-600 flex-none mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">
                  {result.anomalySignals.length} Financial Anomaly Signal(s) Identified
                </p>
                <p className="text-[11px] text-rose-800 dark:text-rose-300">
                  Review the Anomalies tab for empirical facts, alternative benign explanations, and recommended human verification steps.
                </p>
              </div>
            </div>
          )}

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-[#1E2445] pb-2 text-xs flex-wrap">
            {[
              { id: 'OVERVIEW', label: 'Executive Summary' },
              { id: 'INCOME', label: 'Income & Payroll' },
              { id: 'CASH_FLOW', label: 'Cash Flow & Monthly Trends' },
              { id: 'OBLIGATIONS', label: `Obligations & EMIs (${result.obligationIntelligence.detectedEmis.length})` },
              { id: 'ANOMALIES', label: `Anomalies (${result.anomalySignals.length})` },
              { id: 'AI_INSIGHTS', label: 'Underwriter Advisory AI' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-3 py-1.5 font-semibold rounded-lg transition-colors',
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#1E2445] dark:text-slate-400'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1E2445]/20 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200">Financial Profile Overview</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.advisoryAiSummary.executiveSummary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1E2445]/20 border border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Income Observations</p>
                  <ul className="space-y-1.5">
                    {result.incomeIntelligence.observations.map((obs: string, idx: number) => (
                      <li key={idx} className="text-slate-600 dark:text-slate-400 flex items-start gap-2">
                        <span className="text-blue-500 font-mono">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1E2445]/20 border border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="font-bold text-slate-800 dark:text-slate-200">Cash Flow Observations</p>
                  <ul className="space-y-1.5">
                    {result.cashFlowIntelligence.observations.map((obs: string, idx: number) => (
                      <li key={idx} className="text-slate-600 dark:text-slate-400 flex items-start gap-2">
                        <span className="text-emerald-500 font-mono">•</span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INCOME */}
          {activeTab === 'INCOME' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1E2445]/20">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Statement Credits</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    ₹{result.incomeIntelligence.totalCredits.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1E2445]/20">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Median Monthly Credit</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    ₹{result.incomeIntelligence.medianMonthlyIncome.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1E2445]/20">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Trajectory</span>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {result.incomeIntelligence.incomeTrajectory}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#1E2445]/20">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Primary Employer</span>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {result.incomeIntelligence.primaryEmployerName || 'Unspecified'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1E2445]/20 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200">AI Income Stability Interpretation</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.advisoryAiSummary.incomeStabilityAssessment}
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CASH FLOW */}
          {activeTab === 'CASH_FLOW' && (
            <div className="space-y-4 text-xs">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1E2445]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#1E2445]/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1E2445]">
                      <th className="p-2.5 font-semibold">Statement Month</th>
                      <th className="p-2.5 font-semibold">Inflow</th>
                      <th className="p-2.5 font-semibold">Outflow</th>
                      <th className="p-2.5 font-semibold">Net Cash Flow</th>
                      <th className="p-2.5 font-semibold">Avg Balance (ABB)</th>
                      <th className="p-2.5 font-semibold">Min / Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {result.cashFlowIntelligence.monthlyBreakdown.map((m: any) => (
                      <tr key={m.month} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2445]/20">
                        <td className="p-2.5 font-sans font-bold text-slate-800 dark:text-slate-200">{m.month}</td>
                        <td className="p-2.5 text-emerald-600 dark:text-emerald-400 font-semibold">₹{m.inflow.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-rose-600 dark:text-rose-400 font-semibold">₹{m.outflow.toLocaleString('en-IN')}</td>
                        <td
                          className={cn(
                            'p-2.5 font-bold',
                            m.netFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {m.netFlow >= 0 ? '+' : ''}₹{m.netFlow.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-slate-800 dark:text-slate-200">₹{m.avgBalance.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-slate-500 text-[11px]">₹{m.minBalance.toLocaleString('en-IN')} / ₹{m.maxBalance.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1E2445]/20 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200">Cash Flow & Liquidity Assessment</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.advisoryAiSummary.cashFlowAssessment}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: OBLIGATIONS */}
          {activeTab === 'OBLIGATIONS' && (
            <div className="space-y-4 text-xs">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[#1E2445]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#1E2445]/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#1E2445]">
                      <th className="p-2.5 font-semibold">Lender / Financial Entity</th>
                      <th className="p-2.5 font-semibold">Est. Monthly Amount</th>
                      <th className="p-2.5 font-semibold">Frequency</th>
                      <th className="p-2.5 font-semibold">Confidence</th>
                      <th className="p-2.5 font-semibold">Debits Count</th>
                      <th className="p-2.5 font-semibold">Last Recorded Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {result.obligationIntelligence.detectedEmis.map((emi: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-[#1E2445]/20">
                        <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">{emi.lenderOrMerchant}</td>
                        <td className="p-2.5 font-mono font-bold text-rose-600 dark:text-rose-400">
                          ₹{emi.estimatedMonthlyAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-slate-600 dark:text-slate-300">{emi.frequency}</td>
                        <td className="p-2.5">
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                              emi.confidence === 'HIGH'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            )}
                          >
                            {emi.confidence}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">{emi.transactionsCount}</td>
                        <td className="p-2.5 font-mono text-slate-500">{emi.lastDebitDate}</td>
                      </tr>
                    ))}
                    {result.obligationIntelligence.detectedEmis.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-slate-400">
                          Zero recurring loan or EMI debits identified in statement.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1E2445]/20 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200">Debt Burden & Obligation Synthesis</p>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.advisoryAiSummary.debtBurdenAssessment}
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: ANOMALIES */}
          {activeTab === 'ANOMALIES' && (
            <div className="space-y-3 text-xs">
              {result.anomalySignals.map((signal: any) => (
                <div
                  key={signal.signalId}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/60 dark:bg-[#1E2445]/20 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-rose-500 flex-none" />
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{signal.title}</h4>
                    </div>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                        signal.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200'
                          : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                      )}
                    >
                      {signal.severity}
                    </span>
                  </div>

                  <div className="space-y-1 bg-white/60 dark:bg-black/20 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 text-[11px]">
                    <p>
                      <strong className="text-slate-700 dark:text-slate-300">Fact:</strong> {signal.fact}
                    </p>
                    <p>
                      <strong className="text-slate-700 dark:text-slate-300">Anomaly:</strong> {signal.anomaly}
                    </p>
                    <p>
                      <strong className="text-slate-700 dark:text-slate-300">Interpretation:</strong> {signal.interpretation}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px]">Possible Benign Hypotheses:</span>
                      <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                        {signal.possibleExplanations.map((exp: string, idx: number) => (
                          <li key={idx}>{exp}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-1">
                      <span className="font-semibold text-slate-500 uppercase text-[10px]">Recommended Human Action:</span>
                      <ul className="list-disc list-inside text-blue-600 dark:text-blue-400 space-y-0.5">
                        {signal.recommendedHumanAction.map((act: string, idx: number) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}

              {result.anomalySignals.length === 0 && (
                <div className="p-6 text-center text-slate-400 space-y-1">
                  <ShieldCheck className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Zero Material Anomaly Signals</p>
                  <p className="text-[11px]">Bank statement exhibits normal cash turnover with no detected circular transfers or balance spikes.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: AI INSIGHTS */}
          {activeTab === 'AI_INSIGHTS' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-3">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  <span>Targeted Underwriter Verification Questions</span>
                </div>
                <ul className="space-y-2">
                  {result.advisoryAiSummary.underwriterQuestions.map((q: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                      <span className="flex-none font-bold text-blue-600">{idx + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1E2445]/20 border border-slate-100 dark:border-slate-800 space-y-1.5">
                <p className="font-bold text-slate-800 dark:text-slate-200">AI Model Governance & Safety Note</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generated by Adyapan centralized AI service (model: {result.model}). AI synthesis is strictly advisory.
                  Authoritative approval decisions, FOIR/DTI calculations, and credit approvals remain governed by the LMS underwriting policy.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Ingest Sample Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Ingest Bank Statement Data
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIngestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Ingest 6 months of verified bank statement transactions for customer <strong>{customerId}</strong>.
              The statement includes verified salary credits, recurring rent, Bajaj Finance EMI debits, utility bills, and a pre-application anomaly for underwriting assessment.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setShowIngestModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={ingestSampleMutation.isPending}
                onClick={() => ingestSampleMutation.mutate()}
                className="text-xs cursor-pointer"
              >
                {ingestSampleMutation.isPending ? 'Ingesting...' : 'Ingest & Run Intelligence'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
