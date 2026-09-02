'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Split,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   FinalRecombinationCTA — "READY TO SPLIT THE PURCHASE?"
   ─────────────────────────────────────────────────────────────
   ▸ Final visual payoff:
     - The 3 payment slices recombine into "PURCHASE COMPLETE".
     - Final Calls to Action.
   ══════════════════════════════════════════════════════════════ */

export const FinalRecombinationCTA: React.FC = () => {
  return (
    <section className="relative py-20 sm:py-28 bg-[#071A33] text-white overflow-hidden text-center">
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-[#155EEF]/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-blue-300 bg-blue-950/80 border border-blue-800">
          <Split className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>PURCHASE COMPLETE · RECOMBINED</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          READY TO SPLIT THE PURCHASE?{' '}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
            ENJOY TODAY, PAY IN THREE.
          </span>
        </h2>

        <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
          Explore the available BNPL checkout journey and review the applicable 0% payment terms before you continue.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="px-8 py-4 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-sm shadow-xl shadow-[#155EEF]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span>Explore BNPL Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#checkout-splitter"
            className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition-all hover:scale-105"
          >
            Simulate 3-Part Split →
          </a>
        </div>

        <div className="pt-6 flex items-center justify-center gap-6 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>0% Interest for 3 Months*</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Instant Sub-Second Disbursal</span>
          </div>
        </div>
      </div>
    </section>
  );
};
