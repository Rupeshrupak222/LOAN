'use client';

import React from 'react';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Key,
  Sparkles,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   DigitalPaymentSeal — "DIGITAL VERIFICATION SEAL"
   ─────────────────────────────────────────────────────────────
   ▸ Circular digital verification stamp & cryptographic telemetry.
   ▸ Zero fake regulatory claims; transparent 256-bit protocol.
   ══════════════════════════════════════════════════════════════ */

export const DigitalPaymentSeal: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-8 sm:p-14 max-w-[1400px] mx-auto text-left shadow-2xl relative overflow-hidden">
        {/* Subtle circular pulse backdrop */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Verification Seal Stamp Visual */}
          <div className="lg:col-span-4 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-2 border-dashed border-blue-400/40 p-3 flex items-center justify-center relative animate-[spin_60s_linear_infinite]">
              <div className="w-full h-full rounded-full border border-blue-400/60 flex flex-col items-center justify-center p-4 text-center bg-blue-950/40 shadow-inner">
                <Lock className="w-6 h-6 text-emerald-400 mb-1" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-blue-200 uppercase">
                  VERIFIED SEAL
                </span>
                <span className="text-[8px] font-mono text-slate-400 mt-0.5">256-Bit Tokenized</span>
              </div>
            </div>
          </div>

          {/* Right: Security & Clarity Principles */}
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono text-blue-300 bg-blue-900/40 border border-blue-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>DIGITAL TRANSACTION INTEGRITY</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Cryptographically Protected. Reviewed Before Confirming.
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Every BNPL transaction generates a unique digital mandate token verified through two-factor authentication. Zero card numbers or credentials are stored in plain text.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 font-mono text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>NPCI UPI AutoPay</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero Card Stored</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>DigiLocker Verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
