'use client';

import React from 'react';
import {
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   SwiftDualJourney — "THE MESSAGE TRAVELS WITH THE MONEY"
   ─────────────────────────────────────────────────────────────
   ▸ Dual Synchronized Movement:
     - 1. PAYMENT MESSAGE (ISO 20022 pacs.008 instruction travels ahead)
     - 2. PAYMENT VALUE (Liquidity settlement matches destination RTGS)
   ▸ Convergence at destination clearinghouse.
   ══════════════════════════════════════════════════════════════ */

export const SwiftDualJourney: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <FileText className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>SYNCHRONIZED DUAL PROTOCOL</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          The Message Travels with the Money
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Modern cross-border clearing dispatches rich ISO 20022 remittance messages ahead of the capital flow, preparing destination accounts for instant settlement upon arrival.
        </p>
      </div>

      {/* Dual Synchronized Stream Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1400px] mx-auto text-left">
        {/* Stream 1: ISO 20022 Financial Message */}
        <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 bg-white space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">STREAM 01 · INSTRUCTION</span>
            <span className="text-xs font-mono font-bold text-[#155EEF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Travels Ahead (T-0)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#155EEF] flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#071A33]">ISO 20022 pacs.008</h3>
              <p className="text-xs font-mono text-slate-400">Rich Structured Remittance Message</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Pre-validates creditor account numbers, tax IDs, and regulatory purposes, preventing returns and eliminating manual compliance investigations.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs font-mono text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Message Transmission:</span>
              <span className="text-[#155EEF] font-bold">Encrypted SWIFT GPI</span>
            </div>
            <div className="flex justify-between">
              <span>Payload Type:</span>
              <span className="text-slate-700 font-bold">Standardized XML Schema</span>
            </div>
          </div>
        </div>

        {/* Stream 2: Capital Value Liquidity */}
        <div className="p-8 sm:p-10 rounded-3xl border border-blue-500/40 bg-gradient-to-br from-[#071A33] to-[#0A2244] text-white space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-blue-300 uppercase">STREAM 02 · LIQUIDITY</span>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
              Synchronized Finality
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#155EEF] to-emerald-500 text-white flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Guaranteed Capital Flow</h3>
              <p className="text-xs font-mono text-slate-300">Central Bank Liquidity Rail</p>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Funds clear directly between central bank correspondent accounts with irrevocable settlement finality, eliminating credit counterparty risk.
          </p>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Settlement Finality:</span>
              <span className="text-emerald-400 font-bold">Irrevocable RTGS</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Convergence Point:</span>
              <span className="text-white font-bold">Destination Clearinghouse</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
