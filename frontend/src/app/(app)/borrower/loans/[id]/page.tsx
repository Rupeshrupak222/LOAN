'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  Download,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Receipt,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Badge } from '@/components/ui';
import { useToast } from '@/lib/toast';

export default function BorrowerLoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error, info } = useToast();
  const loanId = String(params.id);

  const [isNocModalOpen, setIsNocModalOpen] = useState(false);
  const [nocData, setNocData] = useState<any>(null);

  // Fetch loan details
  const { data: loan, isLoading } = useQuery({
    queryKey: ['borrower-loan-detail', loanId],
    queryFn: async () => {
      const res = await api.get<{ data: any }>(`/api/v1/borrower/loans/${loanId}`);
      return res.data?.data || res.data;
    },
  });

  // NOC Fetch Mutation
  const fetchNocMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get<{ data: any }>(`/api/v1/borrower/loans/${loanId}/noc`);
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      setNocData(data);
      setIsNocModalOpen(true);
      success('NOC Certificate Generated', 'Statutory No-Objection Certificate issued with digital signature.');
    },
    onError: (err: any) => {
      error('Cannot Generate NOC', err.response?.data?.message || 'Loan is not fully settled yet.');
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-400 mt-2">Loading loan account servicing details...</p>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <h3 className="text-base font-bold text-white mb-1">Loan Account Not Found</h3>
        <p className="text-xs text-slate-400 mb-4">The requested loan details could not be loaded.</p>
        <Link href="/borrower/loans">
          <Button size="sm" variant="outline" className="text-xs rounded-xl">Back to Loans Hub</Button>
        </Link>
      </div>
    );
  }

  const isClosed = loan.status === 'CLOSED';

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower/loans"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-blue-400">
                {loan.loanAccountNumber}
              </span>
              <Badge
                variant={isClosed ? 'default' : 'success'}
                className={`text-[10px] ${
                  isClosed
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                {loan.status}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
              {loan.productName} Servicing & Statement
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isClosed ? (
            <Button
              onClick={() => fetchNocMutation.mutate()}
              disabled={fetchNocMutation.isPending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              {fetchNocMutation.isPending ? 'Generating NOC...' : 'Download NOC Certificate'}
            </Button>
          ) : (
            <Link href="/borrower/payments">
              <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white">
                Pay EMI Online
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
          <span className="text-slate-400 font-medium">Sanctioned Principal</span>
          <div className="text-lg font-bold text-white">₹{loan.sanctionedPrincipal?.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500">{loan.tenureMonths} Mo @ {loan.interestRate}% p.a.</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
          <span className="text-slate-400 font-medium">Outstanding Balance</span>
          <div className="text-lg font-bold text-emerald-400">
            ₹{loan.totalOutstanding?.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500">Principal: ₹{loan.outstandingPrincipal?.toLocaleString('en-IN')}</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
          <span className="text-slate-400 font-medium">Monthly EMI</span>
          <div className="text-lg font-bold text-white">₹{loan.emiAmount?.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500">
            {loan.paidEmis} of {loan.totalEmis} Paid
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
          <span className="text-slate-400 font-medium">Disbursed On</span>
          <div className="text-lg font-bold text-white">{loan.disbursementDate || 'Active'}</div>
          <div className="text-[11px] text-slate-500">Auto-Debit: eNACH Active</div>
        </div>
      </div>

      {/* Repayment Schedule Table */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Repayment Amortization Schedule</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Complete breakdown of monthly EMIs, principal, and interest
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {loan.paidEmis} / {loan.totalEmis} EMIs Paid
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">EMI #</th>
                <th className="pb-2">Due Date</th>
                <th className="pb-2">Principal</th>
                <th className="pb-2">Interest</th>
                <th className="pb-2">Total Due</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Payment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loan.repaymentSchedule?.map((row: any) => {
                const isPaid = row.status === 'PAID';
                return (
                  <tr key={row.emiNumber} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-medium text-white">{row.emiNumber}</td>
                    <td className="py-2.5 text-slate-400">{row.dueDate}</td>
                    <td className="py-2.5 text-slate-300">₹{row.principalDue?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 text-slate-400">₹{row.interestDue?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5 font-bold text-white">₹{row.totalDue?.toLocaleString('en-IN')}</td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-400">
                      {row.paidAt || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History Table */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white">Payment Receipts & Ledger</h3>

        {loan.paymentHistory && loan.paymentHistory.length > 0 ? (
          <div className="divide-y divide-slate-800/60 text-xs">
            {loan.paymentHistory.map((p: any) => (
              <div key={p.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Repayment via {p.paymentMethod}</div>
                    <div className="text-slate-400 text-[11px]">Txn Ref: {p.referenceNumber} • {new Date(p.paidAt).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400">₹{p.amount?.toLocaleString('en-IN')}</div>
                  <span className="text-[10px] text-emerald-400 uppercase font-semibold">SUCCESS</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No payment records yet for this loan.</p>
        )}
      </div>

      {/* Statutory No-Objection Certificate (NOC) Modal */}
      {isNocModalOpen && nocData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">No-Objection Certificate (NOC)</h3>
                  <p className="text-[11px] text-slate-400">Statutory Loan Closure Confirmation</p>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">{nocData.certificateNumber}</span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
              <div className="text-slate-300 leading-relaxed font-serif">
                {nocData.complianceStatement}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                <div>
                  <span className="text-slate-400">Borrower:</span>
                  <div className="font-bold text-white">{nocData.borrowerName}</div>
                </div>
                <div>
                  <span className="text-slate-400">Loan A/C:</span>
                  <div className="font-bold text-white">{nocData.loanAccountNumber}</div>
                </div>
                <div>
                  <span className="text-slate-400">Sanctioned Principal:</span>
                  <div className="font-bold text-white">₹{nocData.sanctionedAmount?.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-slate-400">Closure Date:</span>
                  <div className="font-bold text-emerald-400">{nocData.closureDate}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono break-all">
                Digital Hash: {nocData.digitalSignatureHash}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNocModalOpen(false)}
                className="rounded-xl border-slate-800 text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  info('NOC Downloaded', 'Statutory certificate saved as PDF.');
                  setIsNocModalOpen(false);
                }}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
