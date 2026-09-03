'use client';

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  CheckCircle2,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   PurchaseMagnitudeContrast — "BIG PURCHASE. SMALLER PLANNED MOMENTS."
   ─────────────────────────────────────────────────────────────
   ▸ Visual comparison:
     - Heavy Lump-Sum: Full cash outflow on Day 1
     - 3-Way Split: Cash flow stays buffered and fluid
   ══════════════════════════════════════════════════════════════ */

export const PurchaseMagnitudeContrast: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>CASH FLOW PRESERVATION</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Big Purchase. Smaller Planned Moments.
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          No need to drain your monthly budget in a single moment. Distribute the capital outlay evenly while enjoying your purchase immediately.
        </p>
      </div>

      {/* 2-Side Comparison Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1400px] mx-auto text-left">
        {/* Left: Traditional Heavy Outflow */}
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">TRADITIONAL PAYMENT</span>
            <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
              Full Cash Drain
            </span>
          </div>

          <div>
            <span className="text-4xl font-black text-[#071A33] font-mono block">₹18,000</span>
            <span className="text-xs text-slate-500 mt-1 block">100% upfront on Day 0</span>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Draining ₹18,000 all at once reduces monthly emergency liquidity and restricts household flexibility for groceries, bills, and unexpected expenses.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Immediate Cash Impact:</span>
              <span className="text-amber-700 font-bold">-₹18,000 Outflow</span>
            </div>
            <div className="flex justify-between">
              <span>Budget Buffer Remaining:</span>
              <span className="text-slate-700 font-bold">Depleted</span>
            </div>
          </div>
        </div>

        {/* Right: Adyapan 3-Part Flow */}
        <div className="p-8 sm:p-10 rounded-3xl border border-blue-500/40 bg-gradient-to-br from-[#071A33] to-[#0A2244] text-white space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-blue-300 uppercase">ADYAPAN 0% BNPL</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
              Preserved Liquidity
            </span>
          </div>

          <div>
            <span className="text-4xl font-black text-emerald-400 font-mono block">3 × ₹6,000</span>
            <span className="text-xs text-slate-300 mt-1 block">Evenly spread over 90 days @ 0% APR</span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Pay only ₹6,000 today. Keep ₹12,000 working in your bank account, earning interest and maintaining emergency buffers while enjoying the product today.
          </p>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Day 0 Upfront Outflow:</span>
              <span className="text-emerald-400 font-bold">Only ₹6,000 (33%)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Liquid Cash Saved on Day 0:</span>
              <span className="text-white font-bold">+₹12,000 Retained</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
