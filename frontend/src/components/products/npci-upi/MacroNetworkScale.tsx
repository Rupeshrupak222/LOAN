'use client';

import React from 'react';
import {
  Share2,
  Building,
  CreditCard,
  Cpu,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   MacroNetworkScale — "ONE PAYMENT / MANY CONNECTIONS"
   ─────────────────────────────────────────────────────────────
   ▸ Macro camera pull-back visualization:
     - Customer
     - Payment Request
     - Adyapan Network Router
     - NPCI Central Rail
     - Sponsor / Issuer Banks
     - Merchant Settlement
   ▸ Labeled as "Illustrative network simulation"
   ══════════════════════════════════════════════════════════════ */

export const MacroNetworkScale: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-8 sm:p-14 max-w-[1400px] mx-auto text-left shadow-2xl relative overflow-hidden space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono text-blue-300 bg-blue-900/40 border border-blue-700 mb-2">
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>MACRO INFRASTRUCTURE TOPOLOGY</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">One Payment, Connected to a National Mesh</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800 self-start sm:self-auto">
            ILLUSTRATIVE NETWORK SIMULATION
          </span>
        </div>

        {/* The 6 Continuous Node Chain */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Step 01</span>
            <span className="text-sm font-bold text-white block">Customer</span>
            <p className="text-[10px] text-slate-400">Payment Request</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Step 02</span>
            <span className="text-sm font-bold text-blue-300 block">Gateway Router</span>
            <p className="text-[10px] text-slate-400">Intent Parsing</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Step 03</span>
            <span className="text-sm font-bold text-emerald-300 block">NPCI Switch</span>
            <p className="text-[10px] text-slate-400">Interbank Rail</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Step 04</span>
            <span className="text-sm font-bold text-indigo-300 block">Remitter Core</span>
            <p className="text-[10px] text-slate-400">Debit Balance</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Step 05</span>
            <span className="text-sm font-bold text-teal-300 block">Beneficiary Bank</span>
            <p className="text-[10px] text-slate-400">Credit Clearing</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-500 uppercase block">Step 06</span>
            <span className="text-sm font-bold text-emerald-400 block">Merchant LMS</span>
            <p className="text-[10px] text-slate-400">100% Settled</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>End-to-end execution achieved in under 120ms with zero manual intervention.</span>
          </div>
          <span className="text-blue-300 font-bold">256-Bit Encrypted High-Volume Rail</span>
        </div>
      </div>
    </section>
  );
};
