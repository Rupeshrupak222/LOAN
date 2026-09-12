'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Send,
  AlertTriangle,
  Search,
  DollarSign,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import { accountingApi } from './api';
import { PayableRecord, PayableType, PayableStatus } from './types';

export function PayablesView() {
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPayableForPayment, setSelectedPayableForPayment] = useState<PayableRecord | null>(null);
  const [payoutUtr, setPayoutUtr] = useState('');

  // Form state
  const [vendorName, setVendorName] = useState('');
  const [payableType, setPayableType] = useState<PayableType>('PARTNER_COMMISSION');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [createError, setCreateError] = useState<string | null>(null);

  const { data: payables = [], isLoading } = useQuery({
    queryKey: ['accounting-payables'],
    queryFn: () => accountingApi.getPayables(),
  });

  const createMutation = useMutation({
    mutationFn: accountingApi.createPayable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-payables'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.message || err.message || 'Failed to create payable.');
    },
  });

  const approveMutation = useMutation({
    mutationFn: accountingApi.approvePayable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-payables'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
    },
  });

  const payMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { payoutUtr: string } }) =>
      accountingApi.recordPayablePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-payables'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['accounting-trial-balance'] });
      setSelectedPayableForPayment(null);
      setPayoutUtr('');
    },
  });

  const resetForm = () => {
    setVendorName('');
    setInvoiceNumber('');
    setDescription('');
    setAmount('');
    setCreateError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    createMutation.mutate({
      vendorOrPartnerName: vendorName,
      payableType,
      invoiceNumber: invoiceNumber || undefined,
      description,
      amount: parseFloat(amount) || 0,
      dueDate: new Date(dueDate).toISOString(),
      autoSubmit: true,
    });
  };

  const getStatusBadge = (status: PayableStatus) => {
    switch (status) {
      case 'PAID':
        return <Badge variant="success">PAID & SETTLED</Badge>;
      case 'APPROVED':
      case 'DUE':
        return <Badge variant="warning">APPROVED / DUE</Badge>;
      case 'SUBMITTED':
        return <Badge variant="default">SUBMITTED</Badge>;
      case 'DRAFT':
        return <Badge variant="default">DRAFT</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-400" />
            Accounts Payable & Vendor Disbursals
          </h3>
          <p className="text-xs text-slate-400">
            Origination commissions, payment gateway fees, and operating vendor payables linked to Phase 10 payouts.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Payable Invoice
        </button>
      </div>

      {/* Payables Table Card */}
      <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Vendor / Partner</th>
                <th className="p-3.5">Payable Type / Invoice</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-right">Amount (₹)</th>
                <th className="p-3.5">Due Date</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent mb-2"></div>
                    <p>Loading accounts payable...</p>
                  </td>
                </tr>
              ) : payables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No accounts payable records found.
                  </td>
                </tr>
              ) : (
                payables.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="p-3.5 font-bold text-slate-100">{p.vendorOrPartnerName}</td>
                    <td className="p-3.5">
                      <div className="font-mono text-blue-400 font-semibold">{p.payableType}</div>
                      <div className="text-[11px] text-slate-400">Inv: {p.invoiceNumber || p.id}</div>
                    </td>
                    <td className="p-3.5 max-w-xs text-slate-300 truncate">{p.description}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-100">
                      ₹{p.amount.toLocaleString()}
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{p.dueDate.slice(0, 10)}</td>
                    <td className="p-3.5 text-center">{getStatusBadge(p.status)}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.status === 'SUBMITTED' && (
                          <button
                            onClick={() => approveMutation.mutate(p.id)}
                            disabled={approveMutation.isPending}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </button>
                        )}

                        {(p.status === 'APPROVED' || p.status === 'DUE') && (
                          <button
                            onClick={() => setSelectedPayableForPayment(p)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors flex items-center gap-1"
                          >
                            <DollarSign className="h-3 w-3" />
                            Record Payout
                          </button>
                        )}

                        {p.status === 'PAID' && p.payoutUtr && (
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            UTR: {p.payoutUtr}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Record Payment Modal */}
      {selectedPayableForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <h3 className="text-base font-bold text-white">Record Bank Payout & Settle Payable</h3>
            <p className="text-xs text-slate-400">
              Settling <strong className="text-slate-200">₹{selectedPayableForPayment.amount.toLocaleString()}</strong> to {selectedPayableForPayment.vendorOrPartnerName}. This will debit the liability account and credit central bank clearing account 1010.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Banking UTR / Payout Reference *
              </label>
              <input
                type="text"
                value={payoutUtr}
                onChange={(e) => setPayoutUtr(e.target.value)}
                placeholder="e.g. UTR-AXIS-2026-991283"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPayableForPayment(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!payoutUtr.trim() || payMutation.isPending}
                onClick={() =>
                  payMutation.mutate({
                    id: selectedPayableForPayment.id,
                    data: { payoutUtr },
                  })
                }
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-all"
              >
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Payable Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create Accounts Payable</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Vendor / Partner Entity *
                </label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="e.g. Apex FinTech DSA or Razorpay Payouts"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Payable Type *
                </label>
                <select
                  value={payableType}
                  onChange={(e) => setPayableType(e.target.value as PayableType)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="PARTNER_COMMISSION">PARTNER_COMMISSION (DSA Sourcing)</option>
                  <option value="PAYMENT_GATEWAY_FEE">PAYMENT_GATEWAY_FEE (PG Charges)</option>
                  <option value="VENDOR_SERVICE">VENDOR_SERVICE (Tech / KYC Vendor)</option>
                  <option value="TAX_PAYABLE">TAX_PAYABLE (Statutory GST)</option>
                  <option value="OPERATIONAL_EXPENSE">OPERATIONAL_EXPENSE (General Ops)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Invoice No.
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="INV-2026-90"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Description / Service Details *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Sourcing fee commission for 14 originated loans in April 2026"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all"
                >
                  Submit Payable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
