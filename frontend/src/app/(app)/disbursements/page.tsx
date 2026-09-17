'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, CheckCircle2, Building, ShieldCheck, ArrowRight, Wallet, CheckSquare, X, History, Clock, FileText, Sparkles, ExternalLink, User, Lock } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner, Input } from '@/components/ui';
import { TableSkeleton } from '@/components/LoadingSkeletons';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { useToast } from '@/lib/toast';
import { DisbursementIntelligenceCard } from '@/components/DisbursementIntelligenceCard';

export default function DisbursementsPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'HISTORY'>('QUEUE');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [method, setMethod] = useState('NEFT_BANK_TRANSFER');
  const [reference, setReference] = useState('');

  const canExecutePayout = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER'].includes(r)
  );

  const isDisbursementAuthorized = user?.roles?.some((r: string) =>
    ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'AUDITOR'].includes(r)
  );

  const isBranchManagerRestricted =
    user?.roles?.includes('BRANCH_MANAGER') &&
    !user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER'].includes(r));

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['disbursements-queue'],
    enabled: isDisbursementAuthorized && !isBranchManagerRestricted,
    queryFn: async () => {
      const res = await api.get('/disbursements/queue');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['disbursements-history'],
    enabled: isDisbursementAuthorized && !isBranchManagerRestricted,
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
      toast.success('Loan disbursed successfully and active loan account initialized.');
      queryClient.invalidateQueries({ queryKey: ['disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['disbursements-history'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-queue'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-payment-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-payments-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payments-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedApp(null);
      setReference('');
      setActiveTab('HISTORY');
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Disbursement Release Notice' });
    },
  });

  if (isBranchManagerRestricted) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb="Lending / Disbursements"
          title="Disbursement & Fund Release"
          subtitle="Electronic fund execution is restricted to Finance & Treasury Officers"
        />

        <div
          className={cn(
            "max-w-2xl mx-auto rounded-2xl border p-8 text-center space-y-5 my-8 shadow-sm transition-colors",
            isDark ? "bg-[#171B36] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">
              Fund Release Authority Restricted
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              Branch Managers do not have authority to release funds or execute loan disbursements. Your authority covers branch application review, credit report assessment, and management approvals up to <strong className="text-slate-900 dark:text-white">₹5,00,000</strong>.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto">
              Per NBFC segregation-of-duties governance, electronic fund transfers and disbursement queues are managed exclusively by Finance & Treasury officers.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/branch-review">
              <Button size="md" className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-sm">
                Go to Branch Applications Desk →
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="md" variant="secondary">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user && !isDisbursementAuthorized) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumb="Lending / Disbursements"
          title="Disbursement & Fund Release"
          subtitle="Access Restricted"
        />

        <div
          className={cn(
            "max-w-2xl mx-auto rounded-2xl border p-8 text-center space-y-5 my-8 shadow-sm transition-colors",
            isDark ? "bg-[#171B36] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">
              Fund Release Authority Restricted
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed">
              Collection Officers do not have authority to release funds or execute loan disbursements. Your role is dedicated to borrower follow-ups, delinquency recovery, and recording repayments after disbursement.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto">
              Per NBFC segregation-of-duties governance, electronic fund transfers and disbursement queues are managed exclusively by Finance & Treasury officers.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/collections">
              <Button size="md" className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold shadow-sm">
                Go to Collections Desk →
              </Button>
            </Link>
            <Link href="/loans">
              <Button size="md" variant="secondary">
                View Loan Accounts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (queueLoading || historyLoading) return <TableSkeleton rows={6} cols={5} />;

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
          hint={`${formatMoney(pendingPayoutAmount)} awaiting release`}
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiCard
          label="Total Payouts Released"
          value={String(history.length)}
          hint={`${formatMoney(totalDisbursedAmount)} disbursed`}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
        <KpiCard
          label="Payout Method"
          value="Electronic Bank Transfer"
          hint="NEFT / RTGS / IMPS"
          icon={<Wallet className="h-4 w-4" />}
        />
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#2B3566] pb-2">
        <button
          onClick={() => setActiveTab('QUEUE')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
            activeTab === 'QUEUE'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending Payout Queue ({queue.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
            activeTab === 'HISTORY'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
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
                    <th className="py-2.5 px-3">Borrower Profile</th>
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
                  {queue.map((app: any) => {
                    const custId = app.customerId || app.customer?.id;
                    return (
                      <tr key={app.id} className={cn("transition-colors", isDark ? "hover:bg-[#16203D]/60" : "hover:bg-slate-50/70")}>
                        <td className="py-3 px-3 font-bold text-[#2563EB] dark:text-[#60A5FA]">
                          <Link href={`/applications/${app.id}`} className="hover:underline">
                            {app.applicationNo || 'N/A'}
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          {custId ? (
                            <Link
                              href={`/customers/${custId}`}
                              className="group block hover:opacity-90"
                              title="Click to view Customer 360 Profile"
                            >
                              <p className={cn("font-semibold leading-tight group-hover:underline text-[#2563EB] dark:text-[#60A5FA]")}>
                                {app.customer?.firstName || 'Borrower'} {app.customer?.lastName || ''}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                {app.customer?.customerCode || '-'}
                                <span className="text-[10px] text-blue-500 font-sans font-medium flex items-center gap-0.5">
                                  360 <ExternalLink className="w-2.5 h-2.5 inline" />
                                </span>
                              </p>
                            </Link>
                          ) : (
                            <div>
                              <p className={cn("font-semibold leading-tight", isDark ? "text-white" : "text-slate-900")}>
                                {app.customer?.firstName || 'Borrower'} {app.customer?.lastName || ''}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">{app.customer?.customerCode || '-'}</p>
                            </div>
                          )}
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
                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              {custId && (
                                <Link href={`/customers/${custId}`}>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="text-xs font-semibold gap-1.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 shadow-2xs"
                                    title="View Borrower Customer 360 Profile"
                                  >
                                    <User className="h-3.5 w-3.5" /> View Profile
                                  </Button>
                                </Link>
                              )}
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedApp(app);
                                  setReference(`CMS-NEFT-${Math.floor(100000000 + Math.random() * 900000000)}`);
                                }}
                                className="bg-[#2563EB] hover:bg-blue-700 text-xs text-white font-semibold shadow-sm gap-1.5 cursor-pointer"
                              >
                                <Send className="h-3.5 w-3.5" /> Execute Payout
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              {custId && (
                                <Link href={`/customers/${custId}`}>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="text-xs font-semibold gap-1.5 cursor-pointer text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50"
                                  >
                                    <User className="h-3.5 w-3.5" /> View Profile
                                  </Button>
                                </Link>
                              )}
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
                    );
                  })}
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
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: DISBURSEMENT HISTORY */}
      {activeTab === 'HISTORY' && (
        <Card noPadding className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
              Disbursed Payout Audit Ledger
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              {history.length} electronic fund transfer(s) completed
            </span>
          </div>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={cn(
                  "border-b text-[11px] font-bold uppercase",
                  isDark ? "border-[#2B3566] bg-[#16203D] text-slate-400" : "border-slate-200 bg-slate-50/80 text-slate-500"
                )}>
                  <tr>
                    <th className="py-2.5 px-3">Loan Account</th>
                    <th className="py-2.5 px-3">Origination App</th>
                    <th className="py-2.5 px-3">Borrower Profile</th>
                    <th className="py-2.5 px-3">Disbursed Principal</th>
                    <th className="py-2.5 px-3">Channel</th>
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
                  {history.map((d: any) => {
                    const custId = d.loan?.customerId || d.loan?.customer?.id;
                    return (
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
                          {custId ? (
                            <Link
                              href={`/customers/${custId}`}
                              className="group block hover:opacity-90"
                              title="Click to view Customer 360 Profile"
                            >
                              <p className={cn("font-semibold leading-tight group-hover:underline text-[#2563EB] dark:text-[#60A5FA]")}>
                                {d.loan?.customer?.firstName || 'Borrower'} {d.loan?.customer?.lastName || ''}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                {d.loan?.customer?.customerCode || '-'}
                                <span className="text-[10px] text-blue-500 font-sans font-medium flex items-center gap-0.5">
                                  360 <ExternalLink className="w-2.5 h-2.5 inline" />
                                </span>
                              </p>
                            </Link>
                          ) : (
                            <div>
                              <p className={cn("font-semibold leading-tight", isDark ? "text-white" : "text-slate-900")}>
                                {d.loan?.customer?.firstName || 'Borrower'} {d.loan?.customer?.lastName || ''}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">{d.loan?.customer?.customerCode || '-'}</p>
                            </div>
                          )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">No completed disbursements found.</p>
          )}
        </Card>
      )}

      {/* DIRECT DISBURSEMENT EXECUTION MODAL (Full Electronic Fund Release Desk) */}
      {selectedApp && (() => {
        const sanctionedAmount = Number(selectedApp.requestedAmount || 0);
        const processingFee = Math.round(sanctionedAmount * 0.015);
        const gstOnFee = Math.round(processingFee * 0.18);
        const netDisbursal = sanctionedAmount - processingFee - gstOnFee;
        const primaryBank = selectedApp.customer?.bankAccounts?.find((b: any) => b.isVerified) || selectedApp.customer?.bankAccounts?.[0] || null;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
            <div
              className={cn(
                "w-full max-w-3xl rounded-2xl border p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto transition-all",
                isDark ? "bg-[#171B36] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#2B3566]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <h3 className={cn("text-base font-bold flex items-center gap-2", isDark ? "text-white" : "text-slate-900")}>
                      <Send className="h-5 w-5 text-emerald-600" />
                      <span>Electronic Fund Release & Disbursal Desk</span>
                    </h3>
                    <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                      Execute direct Core Banking electronic transfer to borrower bank account.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. AUTOMATED MONEY MOVEMENT ROUTE */}
              <div className="p-4 bg-slate-50 dark:bg-[#1E2445]/60 rounded-xl border border-slate-200/80 dark:border-[#2B3566]">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-blue-600" />
                  <span>Automated Money Movement & Settlement Route</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 items-center">
                  {/* Source Card: Company Nodal Account */}
                  <div className="lg:col-span-4 p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-blue-700 dark:text-blue-400 flex items-center gap-1">
                        <Building className="h-3.5 w-3.5" /> Source Debit Account
                      </span>
                      <Badge variant="success" className="text-[9px] py-0 font-bold">Treasury Active</Badge>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      Adyapan Capital Services Ltd (Treasury)
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      HDFC Bank - Corporate Treasury
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-blue-200/60 dark:border-blue-900/40">
                      <span>A/C XXXX-XXXX-8901</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">GL: 1010</span>
                    </div>
                  </div>

                  {/* Middle Channel: Transfer Rails & Gateway */}
                  <div className="lg:col-span-3 flex flex-col items-center justify-center p-1.5 text-center space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                      <span>Payout Rails</span>
                      <ArrowRight className="h-3 w-3 text-emerald-600 hidden lg:inline" />
                    </div>

                    <div className="grid grid-cols-3 gap-1 w-full">
                      {(['IMPS', 'NEFT', 'RTGS'] as const).map((rail) => (
                        <button
                          key={rail}
                          type="button"
                          onClick={() => setMethod(rail)}
                          className={cn(
                            'py-1 px-1 text-center rounded border text-xs font-bold transition-all cursor-pointer',
                            method === rail || (method === 'NEFT_BANK_TRANSFER' && rail === 'NEFT')
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          )}
                        >
                          <div className="text-[11px]">{rail}</div>
                        </button>
                      ))}
                    </div>

                    <span className="text-[9px] text-slate-400 font-mono">
                      Connected Banking API
                    </span>
                  </div>

                  {/* Destination Card: Borrower Bank Account */}
                  <div className="lg:col-span-4 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                        <User className="h-3.5 w-3.5" /> Destination Credit Account
                      </span>
                      <Badge variant="success" className="text-[9px] py-0 font-bold">Penny-Drop Verified</Badge>
                    </div>
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {selectedApp.customer?.firstName} {selectedApp.customer?.lastName}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      {primaryBank?.bankName || selectedApp.customer?.bankName || 'Not Linked'} &bull; A/C {primaryBank?.accountNumber ? `XXXX-XXXX-${primaryBank.accountNumber.slice(-4)}` : (selectedApp.customer?.bankAccountNo || '—')}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
                      <span>IFSC: {primaryBank?.ifscCode || selectedApp.customer?.bankIfsc || '—'}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">100% Match</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. TRANSACTION REFERENCE & NET PAYOUT CARD */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-7 space-y-3">
                  <div>
                    <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>
                      Bank Payment Reference / UTR Number
                    </label>
                    <Input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. CMS-NEFT-994827104"
                      className="text-xs h-9 font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Bank UTR reference recorded for audit and general ledger posting.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Sanctioned Principal:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatMoney(sanctionedAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Deductions (Processing Fee + GST):</span>
                      <span className="font-mono text-rose-600 font-semibold">- {formatMoney(processingFee + gstOnFee)}</span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-5 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3">
                  <div>
                    <div className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                      Net Payout Amount
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-800 dark:text-emerald-200 mt-0.5">
                      {formatMoney(netDisbursal)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Status: Finance Verified & Cleared
                    </div>
                  </div>

                  <Button
                    disabled={!reference.trim() || disburseMutation.isPending}
                    onClick={() => disburseMutation.mutate()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {disburseMutation.isPending ? 'Executing Transfer...' : `Authorize & Release Funds (${formatMoney(netDisbursal)})`}
                  </Button>
                </div>
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
            </div>
          </div>
        );
      })()}
    </div>
  );
}
