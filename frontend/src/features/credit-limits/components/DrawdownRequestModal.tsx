'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Percent,
  Calendar,
} from 'lucide-react';
import { CreditFacility } from '../types';
import { useRequestDrawdown } from '../hooks/useCreditLimits';

interface Props {
  facility: CreditFacility;
  isOpen: boolean;
  onClose: () => void;
}

export function DrawdownRequestModal({ facility, isOpen, onClose }: Props) {
  const [amount, setAmount] = useState<number>(Math.min(facility.availableAmount, 25000));
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [purpose, setPurpose] = useState<string>('Personal expenses and working capital');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestDrawdownMutation = useRequestDrawdown();

  if (!isOpen) return null;

  // Real-time Fee & Net Disbursement Calculation
  const feePct = 0.5;
  const rawFee = Math.max(100, amount * (feePct / 100));
  const feeGst = rawFee * 0.18;
  const totalDeductions = rawFee + feeGst;
  const netDisbursed = Math.max(0, amount - totalDeductions);

  // EMI Calculation
  const rate = facility.annualInterestRatePct / 12 / 100;
  const factor = Math.pow(1 + rate, tenureMonths);
  const emi = rate > 0 && factor > 1
    ? (amount * rate * factor) / (factor - 1)
    : amount / tenureMonths;
  const totalRepayment = emi * tenureMonths;
  const totalInterest = totalRepayment - amount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amount <= 0) {
      setErrorMsg('Drawdown amount must be greater than zero.');
      return;
    }

    if (amount > facility.availableAmount) {
      setErrorMsg(`Amount cannot exceed available limit of ₹${facility.availableAmount.toLocaleString('en-IN')}`);
      return;
    }

    if (amount < facility.minDrawdownAmount) {
      setErrorMsg(`Amount cannot be less than minimum drawdown of ₹${facility.minDrawdownAmount.toLocaleString('en-IN')}`);
      return;
    }

    try {
      await requestDrawdownMutation.mutateAsync({
        facilityId: facility.id,
        data: {
          amount,
          tenureMonths,
          purpose,
        },
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Failed to process drawdown request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Request Credit Drawdown</h2>
              <p className="text-xs text-slate-500">
                Facility #{facility.facilityNo} • Available: <strong className="text-emerald-700">₹{facility.availableAmount.toLocaleString('en-IN')}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <label>Drawdown Amount (₹)</label>
              <span className="text-slate-400 font-normal">Max: ₹{facility.availableAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">₹</span>
              <input
                type="number"
                step="500"
                min={facility.minDrawdownAmount}
                max={facility.availableAmount}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Repayment Tenure</label>
              <select
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={18}>18 Months</option>
                <option value={24}>24 Months</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Interest Rate</label>
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800">
                {facility.annualInterestRatePct}% p.a.
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / End-Use</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Working capital, inventory purchase"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Fee and Net Disbursement Breakdown Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5 text-xs">
            <div className="font-semibold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Financial Terms Preview</span>
              <span className="text-emerald-700 font-bold">18% GST Compliant</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Requested Drawdown:</span>
              <span className="font-mono font-semibold text-slate-900">₹{amount.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>Platform Fee (0.5%):</span>
              <span className="font-mono text-slate-900">-₹{Math.round(rawFee).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span>GST on Fee (18%):</span>
              <span className="font-mono text-slate-900">-₹{Math.round(feeGst).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between font-bold text-emerald-800 border-t border-slate-200 pt-2 text-sm">
              <span>Net Disbursed to Bank:</span>
              <span className="font-mono text-emerald-700 font-extrabold">₹{Math.round(netDisbursed).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex items-center justify-between text-indigo-700 font-semibold pt-1">
              <span>Estimated Monthly EMI:</span>
              <span className="font-mono">₹{Math.round(emi).toLocaleString('en-IN')} / month</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={requestDrawdownMutation.isPending || amount <= 0 || amount > facility.availableAmount}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestDrawdownMutation.isPending ? 'Processing...' : `Disburse ₹${Math.round(netDisbursed).toLocaleString('en-IN')}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
