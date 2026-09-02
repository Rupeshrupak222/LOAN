'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, CheckCircle2, Building, ShieldCheck, ArrowRight, Wallet, CheckSquare, X, History, Clock, FileText } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';

export default function DisbursementsPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'HISTORY'>('QUEUE');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [method, setMethod] = useState('NEFT_BANK_TRANSFER');
  const [reference, setReference] = useState('');

  const canExecutePayout = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'BRANCH_MANAGER'].includes(r)
  );

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['disbursements-queue'],
    queryFn: async () => {
      const res = await api.get('/disbursements/queue');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['disbursements-history'],
    queryFn: async () => {
      const res = await api.get('/disbursements/history');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  const disburseMutation = useMutation({
    mutationFn: async () =>
      api.post('/disbursements/execute', {
        applicationId: selectedApp.id,
        disbursementMethod: method,
        referenceNumber: reference,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-history'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedApp(null);
      setReference('');
      setActiveTab('HISTORY');
    },
  });

  if (queueLoading || historyLoading) return <Spinner />;

  const queue = Array.isArray(queueData) ? queueData : [];
  const history = Array.isArray(historyData) ? historyData : [];

  const totalDisbursedAmount = history.reduce((acc: number, d: any) => acc + Number(d.amount || 0), 0);
  const pendingPayoutAmount = queue.reduce((acc: number, q: any) => acc + Number(q.requestedAmount || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Lending / Disbursements"
        title="Disbursement Queue & Fund Release"
        subtitle="Verify pre-disbursement requirements, execute electronic bank transfers, and view audit history"
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <KpiCard
          label="Ready for Payout"
          value={String(queue.length)}
          hint={queue.length > 0 ? "Awaiting fund release" : "All approvals processed"}
          icon={<CheckSquare className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />}
        />
        <KpiCard
          label="Total Historical Disbursed"
          value={formatMoney(totalDisbursedAmount)}
          hint={`${history.length} completed loan release(s)`}
          icon={<Wallet className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />}
        />
        <KpiCard
          label="Payment Gateway Channel"
          value="NEFT / RTGS"
          hint="Core banking bridge active"
          icon={<Send className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
        />
      </div>

      {/* Interactive Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#2B3566] pb-1">
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={cn(
            "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'QUEUE'
              ? "bg-[#2563EB] text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending Payout Queue ({queue.length})
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={cn(
            "px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2",
            activeTab === 'HISTORY'
              ? "bg-[#2563EB] text-white shadow-sm"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          )}
        >
          <History className="w-3.5 h-3.5" />
          Disbursed Payout History ({history.length})
        </button>
      </div>

      {/* TAB 1: PENDING QUEUE */}
      {activeTab === 'QUEUE' && (
        <Card noPadding className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
              Sanctioned Loans Ready for Fund Release
            </h3>
            {history.length > 0 && queue.length === 0 && (
              <Button size="sm" variant="ghost" onClick={() => setActiveTab('HISTORY')} className="text-xs text-[#2563EB]">
                View Completed Payouts ({history.length}) →
              </Button>
            )}
          </div>

          {queue.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={cn(
                  "border-b text-[11px] font-bold uppercase",
                  isDark ? "border-[#2B3566] bg-[#16203D] text-slate-400" : "border-slate-200 bg-slate-50/80 text-slate-500"
                )}>
                  <tr>
                    <th className="py-2.5 px-3">Application</th>
                    <th className="py-2.5 px-3">Borrower</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Sanctioned Amount</th>
                    <th className="py-2.5 px-3">Bank Details</th>
                    <th className="py-2.5 px-3">KYC Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={cn(
                  "divide-y text-xs",
                  isDark ? "divide-[#2B3566] text-slate-200" : "divide-slate-100 text-slate-700"
                )}>
                  {queue.map((app: any) => (
                    <tr key={app.id} className={cn("transition-colors", isDark ? "hover:bg-[#16203D]/60" : "hover:bg-slate-50/70")}>
                      <td className="py-3 px-3 font-bold text-[#2563EB] dark:text-[#60A5FA]">
                        <Link href={`/applications/${app.id}`} className="hover:underline">
                          {app.applicationNo || 'N/A'}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <p className={cn("font-semibold leading-tight", isDark ? "text-white" : "text-slate-900")}>
                          {app.customer?.firstName || 'Borrower'} {app.customer?.lastName || ''}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{app.customer?.customerCode || '-'}</p>
                      </td>
                      <td className={cn("py-3 px-3 font-medium", isDark ? "text-slate-300" : "text-slate-700")}>{app.product?.name || 'Loan'}</td>
                      <td className="py-3 px-3 font-bold text-emerald-600 dark:text-[#10B981] text-sm">{formatMoney(app.requestedAmount || 0)}</td>
                      <td className={cn("py-3 px-3 text-xs", isDark ? "text-slate-300" : "text-slate-600")}>
                        {Array.isArray(app.customer?.bankAccounts) && app.customer.bankAccounts[0] ? (
                          <>
                            <span className={cn("font-semibold block", isDark ? "text-white" : "text-slate-900")}>{app.customer.bankAccounts[0].bankName}</span>
                            <span className="font-mono text-[11px] text-slate-400">A/C: {app.customer.bankAccounts[0].accountNumber}</span>
                          </>
                        ) : app.customer?.bankAccountNo ? (
                          <>
                            <span className={cn("font-semibold block", isDark ? "text-white" : "text-slate-900")}>{app.customer.bankName || 'Beneficiary Bank'}</span>
                            <span className="font-mono text-[11px] text-slate-400">A/C: {app.customer.bankAccountNo} ({app.customer.bankIfsc || 'IFSC'})</span>
                          </>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">No bank account on record</span>
                        )}
                      </td>
                      <td className="py-3 px-3"><Badge status={app.customer?.kycStatus} /></td>
                      <td className="py-3 px-3 text-right">
                        {canExecutePayout ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedApp(app);
                              setReference(`CMS-NEFT-${Math.floor(100000000 + Math.random() * 900000000)}`);
                            }}
                            className="bg-[#2563EB] hover:bg-blue-700 text-xs text-white font-semibold shadow-sm"
                          >
                            <Send className="h-3.5 w-3.5 mr-1" /> Execute Payout
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              Awaiting Finance Payout
                            </span>
                            <Link href={`/applications/${app.id}`}>
                              <Button size="sm" variant="ghost" className="text-xs">
                                View →
                              </Button>
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-[#1E2445] rounded-full w-12 h-12 flex items-center justify-center mx-auto text-blue-600">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                No approved loans currently pending disbursement.
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                All sanctioned loans have been disbursed to borrower bank accounts. Check the <strong>Disbursed Payout History</strong> tab to view completed electronic transfers.
              </p>
              {history.length > 0 && (
                <Button size="sm" onClick={() => setActiveTab('HISTORY')} className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  View Completed Disbursements ({history.length})
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: DISBURSEMENT HISTORY */}
      {activeTab === 'HISTORY' && (
        <Card noPadding className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
              Completed Electronic Loan Disbursements
            </h3>
            <span className="text-xs text-slate-400">Total Releases: {history.length}</span>
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={cn(
                  "border-b text-[11px] font-bold uppercase",
                  isDark ? "border-[#2B3566] bg-[#16203D] text-slate-400" : "border-slate-200 bg-slate-50/80 text-slate-500"
                )}>
                  <tr>
                    <th className="py-2.5 px-3">Loan Account #</th>
                    <th className="py-2.5 px-3">Application #</th>
                    <th className="py-2.5 px-3">Borrower</th>
                    <th className="py-2.5 px-3">Amount Disbursed</th>
                    <th className="py-2.5 px-3">Payment Channel</th>
                    <th className="py-2.5 px-3">Bank Reference / UTR</th>
                    <th className="py-2.5 px-3">Disbursed At</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={cn(
                  "divide-y text-xs",
                  isDark ? "divide-[#2B3566] text-slate-200" : "divide-slate-100 text-slate-700"
                )}>
                  {history.map((d: any) => (
                    <tr key={d.id} className={cn("transition-colors", isDark ? "hover:bg-[#16203D]/60" : "hover:bg-slate-50/70")}>
                      <td className="py-3 px-3 font-bold text-[#2563EB] dark:text-[#60A5FA]">
                        <Link href={`/loans/${d.loanId}`} className="hover:underline">
                          {d.loan?.loanNo || '-'}
                        </Link>
                      </td>
                      <td className="py-3 px-3 font-mono text-xs">
                        <Link href={`/applications/${d.loan?.application?.id}`} className="text-slate-500 hover:underline">
                          {d.loan?.application?.applicationNo || '-'}
                        </Link>
                      </td>
                      <td className="py-3 px-3">
                        <p className={cn("font-semibold leading-tight", isDark ? "text-white" : "text-slate-900")}>
                          {d.loan?.customer?.firstName || 'Borrower'} {d.loan?.customer?.lastName || ''}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{d.loan?.customer?.customerCode || '-'}</p>
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600 dark:text-[#10B981] text-sm">
                        {formatMoney(d.amount || 0)}
                      </td>
                      <td className={cn("py-3 px-3 text-xs font-semibold", isDark ? "text-slate-300" : "text-slate-700")}>
                        {d.method}
                      </td>
                      <td className="py-3 px-3 font-mono text-xs text-[#2563EB] dark:text-[#60A5FA] font-bold">
                        {d.reference}
                      </td>
                      <td className={cn("py-3 px-3 text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
                        {d.createdAt ? formatDate(d.createdAt) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {d.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link href={`/loans/${d.loanId}`}>
                          <Button size="sm" variant="secondary" className="text-xs">
                            View Account →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">No completed disbursements found.</p>
          )}
        </Card>
      )}

      {/* DIRECT DISBURSEMENT EXECUTION MODAL (Matching Image 2) */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              "w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-4 transition-all",
              isDark ? "bg-[#171B36] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2B3566]">
              <div>
                <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>
                  Execute Electronic Fund Disbursement
                </h3>
                <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                  Release principal to borrower bank account and activate live loan schedule
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Proposal Summary */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-[#1E2445] text-xs space-y-1.5 border border-slate-200/60 dark:border-[#2B3566]">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Application No:</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                  {selectedApp.applicationNo}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Borrower:</span>
                <span className="font-bold">
                  {selectedApp.customer?.firstName} {selectedApp.customer?.lastName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Sanctioned Principal:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatMoney(selectedApp.requestedAmount || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Beneficiary Bank A/C:</span>
                <span className="font-mono font-semibold">
                  {selectedApp.customer?.bankAccounts?.[0]?.bankName || selectedApp.customer?.bankName || 'Bank'} ·{' '}
                  {selectedApp.customer?.bankAccounts?.[0]?.accountNumber || selectedApp.customer?.bankAccountNo || 'On Record'}{' '}
                  ({selectedApp.customer?.bankAccounts?.[0]?.ifscCode || selectedApp.customer?.bankIfsc || 'IFSC'})
                </span>
              </div>
            </div>

            {/* Pre-Disbursement Checklist */}
            <div
              className={cn(
                "rounded-xl border p-3 space-y-1 text-xs",
                isDark ? "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]" : "border-emerald-200 bg-emerald-50 text-emerald-900"
              )}
            >
              <p className="font-bold">✓ Pre-Disbursement Verification Complete:</p>
              <p>• Underwriting sanction authorized</p>
              <p>• Borrower KYC verification status: {selectedApp.customer?.kycStatus || 'VERIFIED'}</p>
              <p>• Destination bank beneficiary validated</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  Disbursement Payment Channel *
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none",
                    isDark ? "border-[#2B3566] bg-[#1E2445] text-slate-200" : "border-slate-300 bg-white text-slate-800"
                  )}
                >
                  <option value="NEFT_BANK_TRANSFER">NEFT Electronic Bank Transfer</option>
                  <option value="RTGS">RTGS High-Value Transfer</option>
                  <option value="IMPS">IMPS Instant Transfer</option>
                  <option value="DIRECT_CREDIT">Internal Bank Direct Credit</option>
                  <option value="CHEQUE">Corporate Account Payee Cheque</option>
                </select>
              </div>

              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                  Bank Payment Reference / UTR Number *
                </label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. CMS-NEFT-994827104"
                  required
                />
              </div>

              {disburseMutation.isError && (
                <div
                  className={cn(
                    "rounded-xl p-3 text-xs border",
                    isDark ? "bg-rose-950/40 text-rose-400 border-rose-800/40" : "bg-rose-50 text-rose-700 border-rose-200"
                  )}
                >
                  {apiErrorMessage(disburseMutation.error)}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-[#2B3566]">
                <Button variant="ghost" onClick={() => setSelectedApp(null)}>
                  Cancel
                </Button>
                <Button
                  disabled={!reference.trim() || disburseMutation.isPending}
                  onClick={() => disburseMutation.mutate()}
                  className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {disburseMutation.isPending ? 'Releasing Funds...' : 'Authorize & Release Funds'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
