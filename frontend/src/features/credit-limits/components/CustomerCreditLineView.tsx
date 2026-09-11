'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  DollarSign,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Lock,
  Clock,
  HelpCircle,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useCreditFacilities } from '../hooks/useCreditLimits';
import { DrawdownRequestModal } from './DrawdownRequestModal';

export function CustomerCreditLineView() {
  const { data: facilities = [], isLoading } = useCreditFacilities();
  const [isDrawdownModalOpen, setIsDrawdownModalOpen] = useState(false);

  // Take primary active credit line
  const activeFacility = facilities.find((f) => f.status === 'ACTIVE') || facilities[0];

  if (isLoading) {
    return (
      <div className="py-16 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading your credit line...
      </div>
    );
  }

  if (!activeFacility) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
          <CreditCard className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Active Credit Line</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          You do not have an active revolving credit facility yet. Apply for an instant credit line or term loan to get approved limit capacity.
        </p>
        <Link
          href="/customer/apply"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200"
        >
          Check Eligibility & Apply
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const utilPct = activeFacility.approvedLimit > 0
    ? Math.round((activeFacility.utilizedAmount / activeFacility.approvedLimit) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Primary Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-semibold text-indigo-300">
                {activeFacility.productName}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <div className="mt-2 text-xs text-indigo-200">
              Facility #{activeFacility.facilityNo}
            </div>
          </div>

          <button
            onClick={() => setIsDrawdownModalOpen(true)}
            disabled={activeFacility.status !== 'ACTIVE' || activeFacility.availableAmount <= 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-indigo-950 bg-white hover:bg-indigo-50 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <DollarSign className="w-4 h-4 text-indigo-700" />
            Withdraw Credit
          </button>
        </div>

        {/* Large Available Limit */}
        <div className="mt-8 relative z-10">
          <span className="text-xs uppercase tracking-wider text-indigo-200 block">
            Available Credit Capacity
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight mt-1">
            ₹{activeFacility.availableAmount.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Progress Bar & Sub-Metrics */}
        <div className="mt-6 pt-6 border-t border-white/10 space-y-3 relative z-10">
          <div className="flex items-center justify-between text-xs text-indigo-200">
            <span>Used: <strong>₹{activeFacility.utilizedAmount.toLocaleString('en-IN')}</strong> ({utilPct}%)</span>
            <span>Total Limit: <strong>₹{activeFacility.approvedLimit.toLocaleString('en-IN')}</strong></span>
          </div>

          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-indigo-400 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(utilPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feature Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Auto-Restoring</div>
            <div className="text-[11px] text-slate-500">Repayments restore limit instantly</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Zero Inactivity Fee</div>
            <div className="text-[11px] text-slate-500">Pay interest only on withdrawn funds</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Instant Disbursement</div>
            <div className="text-[11px] text-slate-500">24x7 transfer to your bank account</div>
          </div>
        </div>
      </div>

      {/* Recent Withdrawals / Drawdown List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900">Drawdown History</h3>

        {!activeFacility.drawdowns || activeFacility.drawdowns.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            No withdrawals made yet. Click &quot;Withdraw Credit&quot; to transfer funds to your bank.
          </div>
        ) : (
          <div className="space-y-3">
            {activeFacility.drawdowns.map((dd) => (
              <div
                key={dd.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-900 font-mono text-sm">
                    {dd.drawdownNo}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {dd.purpose || 'Credit withdrawal'} • {dd.tenureMonths} Months EMI: ₹{dd.monthlyEmi.toLocaleString('en-IN')}/mo
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-emerald-700 font-mono text-base">
                    ₹{dd.requestedAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {new Date(dd.requestedAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isDrawdownModalOpen && (
        <DrawdownRequestModal
          facility={activeFacility}
          isOpen={isDrawdownModalOpen}
          onClose={() => setIsDrawdownModalOpen(false)}
        />
      )}
    </div>
  );
}
