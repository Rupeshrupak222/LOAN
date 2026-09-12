'use client';

import React, { useEffect, useState } from 'react';
import { paymentsApi } from '@/features/payments/api';
import { SettlementBatchItem } from '@/features/payments/types';
import { SettlementBatchCard } from '@/features/settlements/SettlementBatchCard';
import { CreateSettlementModal } from '@/features/settlements/CreateSettlementModal';
import {
  Coins,
  Plus,
  RefreshCw,
  Building,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export default function SettlementsPage() {
  const [batches, setBatches] = useState<SettlementBatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.getSettlementBatches({
        status: statusFilter || undefined,
        providerCode: providerFilter || undefined,
      });
      setBatches(data);
    } catch (err: any) {
      console.error('Failed to load settlement batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [statusFilter, providerFilter]);

  const handleConfirm = async (batchId: string) => {
    try {
      await paymentsApi.confirmSettlement(batchId);
      alert('Settlement confirmed! Net funds recorded and Double-Entry GL Journal posted.');
      loadBatches();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm settlement');
    }
  };

  const totalGross = batches.reduce((sum, b) => sum + b.grossAmount, 0);
  const totalNet = batches.reduce((sum, b) => sum + b.netSettledAmount, 0);
  const totalFees = batches.reduce((sum, b) => sum + b.feeAmount + b.gstAmount, 0);
  const totalDiscrepancies = batches.filter((b) => b.status === 'DISCREPANCY').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Coins className="w-6 h-6" />
            </div>
            Gateway Settlement & Remittance Desk
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Reconcile Payment Gateway batches, calculate net remittances, and verify MDR fee variances
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          Record PG Batch
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-zinc-500 font-medium">Gross Gateway Volume</span>
          <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
            ₹{totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">{batches.length} Batches Processed</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-zinc-500 font-medium">MDR Fees & GST (18%)</span>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            ₹{totalFees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Expense Account GL 5010</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-zinc-500 font-medium">Net Settled to Nodal Bank</span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-600/80 mt-1 block font-medium">Net Remitted Capital</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
          <span className="text-xs text-zinc-500 font-medium">Fee Variance Discrepancies</span>
          <div className={`text-xl font-extrabold mt-1 ${totalDiscrepancies > 0 ? 'text-amber-600' : 'text-zinc-400'}`}>
            {totalDiscrepancies} Batches
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">Rate deviations &gt; ₹5.00</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent outline-none font-medium"
          >
            <option value="">All Providers</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="CASHFREE">Cashfree</option>
            <option value="PAYTM">Paytm</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-transparent outline-none font-medium"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Confirmation</option>
            <option value="SETTLED">Settled</option>
            <option value="DISCREPANCY">Fee Discrepancy</option>
          </select>
        </div>

        <button
          onClick={loadBatches}
          className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-zinc-600 dark:text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Batches List */}
      <div className="space-y-4">
        {batches.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center text-zinc-400 text-xs">
            No settlement batches found.
          </div>
        ) : (
          batches.map((b) => (
            <SettlementBatchCard key={b.id} batch={b} onConfirm={handleConfirm} />
          ))
        )}
      </div>

      <CreateSettlementModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={loadBatches}
      />
    </div>
  );
}
