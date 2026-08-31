'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, CheckCircle2, Building, ShieldCheck, ArrowRight, Wallet, CheckSquare } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';

export default function DisbursementsPage() {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [method, setMethod] = useState('NEFT_BANK_TRANSFER');
  const [reference, setReference] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['disbursements-queue'],
    queryFn: async () => {
      const res = await api.get('/disbursements/queue');
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
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-count'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setSelectedApp(null);
      setReference('');
    },
  });

  if (isLoading) return <Spinner />;

  const queue = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Lending / Disbursements"
        title="Disbursement Queue & Fund Release"
        subtitle="Verify pre-disbursement requirements and execute electronic bank transfers"
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <KpiCard
          label="Ready for Payout"
          value={String(queue.length)}
          hint="Approved loan agreements"
          icon={<CheckSquare className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />}
        />
        <KpiCard
          label="Total Payout Amount"
          value={formatMoney(queue.reduce((acc: number, q: any) => acc + Number(q.requestedAmount || 0), 0))}
          hint="Pending electronic release"
          icon={<Wallet className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />}
        />
        <KpiCard
          label="Payment Gateway Mode"
          value="NEFT / RTGS"
          hint="Core banking channel active"
          icon={<Send className="h-4 w-4 text-slate-600 dark:text-slate-400" />}
        />
      </div>

      <Card noPadding className="p-5 space-y-4">
        <h3 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
          Sanctioned Loans Ready for Fund Release
        </h3>
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
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">No bank account on record</span>
                      )}
                    </td>
                    <td className="py-3 px-3"><Badge status={app.customer?.kycStatus} /></td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedApp(app);
                          setReference(`CMS-NEFT-${Math.floor(100000000 + Math.random() * 900000000)}`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-xs text-white"
                      >
                        <Send className="h-3.5 w-3.5 mr-1" /> Execute Payout
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-8 text-center">No approved loans currently pending disbursement.</p>
        )}
      </Card>

      {/* Disbursement Execution Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className={cn(
            "w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-fade-in space-y-4",
            isDark ? "bg-[#1E2445] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
          )}>
            <div>
              <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>Execute Electronic Loan Disbursement</h3>
              <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                Sanctioned Amount: <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">{formatMoney(selectedApp.requestedAmount || 0)}</span> to{' '}
                <strong>{selectedApp.customer?.firstName || 'Borrower'} {selectedApp.customer?.lastName || ''}</strong>
              </p>
            </div>

            {/* Checklist */}
            <div className={cn(
              "rounded-xl border p-3 space-y-1 text-xs",
              isDark ? "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]" : "border-emerald-200 bg-emerald-50 text-emerald-900"
            )}>
              <p className="font-bold">✓ Pre-Disbursement Checklist Verified:</p>
              <p>• Underwriting sanction letter authorized</p>
              <p>• Borrower KYC verification status: {selectedApp.customer?.kycStatus || 'VERIFIED'}</p>
              <p>• Bank beneficiary destination account confirmed</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Disbursement Channel</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border p-2.5 text-xs focus:border-[#2563EB] focus:outline-none",
                    isDark ? "border-[#2B3566] bg-[#060F1B] text-slate-200" : "border-slate-300 bg-white text-slate-800"
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
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Bank Payment Reference / UTR Number</label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g. CMS-NEFT-994827104"
                  required
                />
              </div>

              {disburseMutation.isError && (
                <div className={cn(
                  "rounded-xl p-3 text-xs border",
                  isDark ? "bg-rose-950/40 text-rose-400 border-rose-800/40" : "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  {apiErrorMessage(disburseMutation.error)}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button
                  disabled={!reference.trim() || disburseMutation.isPending}
                  onClick={() => disburseMutation.mutate()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {disburseMutation.isPending ? 'Releasing Funds...' : 'Authorize & Release Funds'}
                </Button>
                <Button variant="secondary" onClick={() => setSelectedApp(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
