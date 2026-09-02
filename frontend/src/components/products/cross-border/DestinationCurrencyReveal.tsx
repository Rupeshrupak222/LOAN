'use client';

import React from 'react';
import {
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   DestinationCurrencyReveal — "ONE VALUE. A DIFFERENT CURRENCY."
   ─────────────────────────────────────────────────────────────
   ▸ Final Converted Disc Reveal:
     - Origination USD disc fully resolved
     - Only GBP destination disc remains
     - Final value: £7,890.00 GBP
   ══════════════════════════════════════════════════════════════ */

export const DestinationCurrencyReveal: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <RotateCcw className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>DESTINATION REVELATION</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          One Value. A Different Currency.
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          The transformation cycle concludes. The source USD disc has resolved entirely into freshly minted destination GBP liquidity.
        </p>
      </div>

      {/* Main Converted Disc Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">FINAL LIQUIDITY DISPATCH</span>
              <h3 className="text-2xl font-black text-[#071A33]">GBP Currency Disc Active</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            Settlement Cleared
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Final Settled Amount</span>
            <span className="text-xl font-black text-emerald-600 block">£7,890.00 GBP</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Target Jurisdiction</span>
            <span className="text-sm font-bold text-[#071A33] block mt-1">United Kingdom (Bank of England)</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Ledger Credit Finality</span>
            <span className="text-sm font-bold text-[#155EEF] block mt-1">Irrevocable Funds Available</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-3 border-t border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Zero residual currency slippage or unassigned fraction loss.</span>
        </div>
      </div>
    </section>
  );
};
