'use client';

import React from 'react';
import {
  Scale,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   PrecisionBalanceMechanism — "PRECISION MATTERS"
   ─────────────────────────────────────────────────────────────
   ▸ Two-Sided Mechanical Balance Instrument:
     - Left Pan: Source Capital ($10,000.00 USD)
     - Center: Exchange Pivot (1 USD = 0.7890 GBP)
     - Right Pan: Converted Payout (£7,890.00 GBP)
   ▸ Visual balance settling to equilibrium.
   ══════════════════════════════════════════════════════════════ */

export const PrecisionBalanceMechanism: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Scale className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>PRECISION VALUE EQUILIBRIUM</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Precision Matters
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Every cent and penny is mechanically accounted for. The bilateral conversion balance settles to perfect equilibrium without unrounded fractional loss.
        </p>
      </div>

      {/* 2-Side Balance Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1400px] mx-auto text-left">
        {/* Left: Source Value Pan */}
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">SOURCE VALUE PAN</span>
            <span className="text-xs font-mono font-bold text-[#155EEF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              USD Input
            </span>
          </div>

          <div>
            <span className="text-4xl font-black text-[#071A33] font-mono block">$10,000.00</span>
            <span className="text-xs text-slate-500 mt-1 block">Debited from US Originator Account</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Debit Protocol:</span>
              <span className="text-[#071A33] font-bold">US Fedwire ISO 20022</span>
            </div>
            <div className="flex justify-between">
              <span>Intermediary Slippage:</span>
              <span className="text-emerald-600 font-bold">$0.00 Exact Match</span>
            </div>
          </div>
        </div>

        {/* Right: Destination Value Pan */}
        <div className="p-8 sm:p-10 rounded-3xl border border-blue-500/40 bg-gradient-to-br from-[#071A33] to-[#0A2244] text-white space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-blue-300 uppercase">DESTINATION VALUE PAN</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
              GBP Equilibrium
            </span>
          </div>

          <div>
            <span className="text-4xl font-black text-emerald-400 font-mono block">£7,890.00</span>
            <span className="text-xs text-slate-300 mt-1 block">Credited to UK Beneficiary IBAN</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Credit Protocol:</span>
              <span className="text-emerald-400 font-bold">Bank of England CHAPS RTGS</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Equilibrium Status:</span>
              <span className="text-white font-bold">100% Calibrated Match</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
