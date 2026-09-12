'use client';

import React, { useEffect, useState } from 'react';
import { paymentsApi } from '@/features/payments/api';
import { PayoutItem } from '@/features/payments/types';
import { PaymentStatusBadge } from '@/features/payments/components/PaymentStatusBadge';
import { PayoutInitiateModal } from '@/features/payments/components/PayoutInitiateModal';
import {
  Send,
  Search,
  Plus,
  Building,
  RefreshCw,
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [initiateModalOpen, setInitiateModalOpen] = useState(false);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.getPayouts({
        status: statusFilter || undefined,
      });
      setPayouts(data);
    } catch (err: any) {
      console.error('Failed to load payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts();
  }, [statusFilter]);

  const filteredPayouts = payouts.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.payoutNo.toLowerCase().includes(q) ||
      (p.loanNo && p.loanNo.toLowerCase().includes(q)) ||
      p.beneficiaryName.toLowerCase().includes(q) ||
      (p.utrNumber && p.utrNumber.toLowerCase().includes(q))
    );
  });

  const totalVolume = payouts.reduce((sum, p) => sum + p.amount, 0);
  const successVolume = payouts
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.netDisbursedAmount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Send className="w-6 h-6" />
            </div>
            Payouts & Disbursements Desk
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Automated NEFT / IMPS Banking gateway disbursements and UTR settlement tracking
          </p>
        </div>

        <button
          onClick={() => setInitiateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Initiate Payout
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-zinc-500 font-medium">Total Sanctioned Volume</span>
          <div className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
            ₹{totalVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">{payouts.length} Total Instructions</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-zinc-500 font-medium">Net Disbursed to Bank</span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{successVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-1 block font-medium">
            Settled via Direct IMPS / NEFT
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-zinc-500 font-medium">Upfront Fees & GST Deducted</span>
          <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{payouts.reduce((sum, p) => sum + p.deductedFees + p.deductedGst, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">GL 4020 & 2020 Recognitions</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payout no, loan #, UTR, or beneficiary..."
            className="w-full pl-10 pr-4 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent outline-none font-medium"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
          </select>

          <button
            onClick={loadPayouts}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Payouts Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Payout #</th>
                <th className="py-3 px-4">Beneficiary & Account</th>
                <th className="py-3 px-4">Sanctioned Gross</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Banking UTR</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400 text-xs">
                    No disbursement payout instructions found.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {p.payoutNo}
                      {p.loanNo && <div className="text-[10px] text-zinc-400 font-normal">#{p.loanNo}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{p.beneficiaryName}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {p.beneficiaryAccountMasked} • {p.beneficiaryIfsc}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-700 dark:text-zinc-300">
                      ₹{p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-extrabold text-emerald-600 dark:text-emerald-400">
                      ₹{p.netDisbursedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4">
                      <PaymentStatusBadge status={p.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                      {p.utrNumber || <span className="text-zinc-400 italic">Pending Bank UTR</span>}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 text-[11px]">
                      {new Date(p.createdAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PayoutInitiateModal
        isOpen={initiateModalOpen}
        onClose={() => setInitiateModalOpen(false)}
        onSuccess={loadPayouts}
      />
    </div>
  );
}
