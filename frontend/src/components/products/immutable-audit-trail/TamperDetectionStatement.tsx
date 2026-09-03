'use client';

import React from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, ArrowRight, ShieldCheck, Scale, FileCheck } from 'lucide-react';

export const TamperDetectionStatement: React.FC = () => {
  return (
    <section
      id="section-tamper-statement"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 text-left">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>FORENSIC TAMPER DEFENSE & NON-REPUDIATION</span>
            </span>

            <h2
              className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tighter uppercase leading-[0.96]"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              THE PAST <br />
              <span className="text-slate-400">STAYS THE PAST.</span>
            </h2>
          </div>

          <p className="text-xs sm:text-sm font-mono text-slate-600 max-w-sm">
            Relational databases permit silent administrative updates. Adyapan preserves historical truth by making past records immutable and requiring subsequent adjustments to be appended as verifiable compensating events.
          </p>
        </div>

        {/* ── SIDE-BY-SIDE FORENSIC COMPARISON ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch text-left">
          {/* Left: Original Record */}
          <div className="p-8 bg-[#F8FAFC] border-2 border-slate-900 shadow-md flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-300">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                  INITIAL DISBURSAL COMMITTED AT 12:41:08 UTC
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                  CANONICAL STATE
                </span>
              </div>

              <div className="space-y-2 font-mono">
                <div className="text-xs text-slate-500">EVENT TYPE</div>
                <div className="text-base font-black text-[#071A33]">PAYMENT_RECORDED (EMI_CLEARING)</div>

                <div className="text-xs text-slate-500 pt-2">COMMITTED RECOVERY AMOUNT</div>
                <div
                  className="text-3xl sm:text-4xl font-black text-[#071A33]"
                  style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
                >
                  ₹4,250.00
                </div>

                <div className="text-xs text-slate-500 pt-2">CRYPTOGRAPHIC MERKLE POINTER</div>
                <div className="text-[11px] font-bold text-slate-700 break-all bg-white p-2 border border-slate-200">
                  sha256:4a8c9e120df39...b4250e
                </div>

                <div className="text-xs text-slate-500 pt-2">STATUS</div>
                <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>SEALED IN COMPLIANCE LEDGER • HASH-LOCKED</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">✓ Statutory Audit Verification</span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Legally admissible under electronic records governance. No database administrator, rogue service account, or system glitch can silently edit this figure.
              </p>
            </div>
          </div>

          {/* Right: Attempted Modification */}
          <div className="p-8 bg-[#071A33] text-white border-2 border-rose-500 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">
                  ATTEMPTED RETROACTIVE MUTATION // SQL REWRITE
                </span>
                <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono font-bold">
                  ABORTED
                </span>
              </div>

              <div className="space-y-2 font-mono">
                <div className="text-xs text-slate-400">UNAUTHORIZED UPDATE VECTOR</div>
                <div className="text-sm font-black text-slate-300 font-mono">
                  UPDATE ledger SET amount = 7250 WHERE id = 184;
                </div>

                <div className="text-xs text-slate-400 pt-2">ATTEMPTED CORRUPTED VALUE</div>
                <div
                  className="text-3xl sm:text-4xl font-black text-rose-400 line-through"
                  style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
                >
                  ₹7,250.00
                </div>

                <div className="text-xs text-slate-400 pt-2">SYSTEM INTEGRITY RESULT</div>
                <div className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                  <span>CHECKSUM MISMATCH DETECTED // RECORD COMMITTED TO QUARANTINE</span>
                </div>

                <div className="text-[11px] text-rose-200/80 pt-1">
                  Cryptographic verification fails: child block pointers point to parent hash <code className="text-cyan-300">4a8c9e...</code>, not <code className="text-rose-300">e812d0...</code>.
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/70 border border-rose-800 text-xs font-mono text-rose-200 relative z-10 space-y-1">
              <span className="font-bold text-rose-300 block">⚠ Zero Administrative Overwrite</span>
              <p className="text-[11px] leading-relaxed">
                If an error occurs, the correcting operator must append a distinct <code className="bg-rose-900 px-1 text-white">REVERSAL_ENTRY</code> or <code className="bg-rose-900 px-1 text-white">ADJUSTMENT_NOTE</code>, leaving an unbroken audit trail of both the mistake and the remediation.
              </p>
            </div>
          </div>
        </div>

        {/* Regulatory Advisory Footnote */}
        <div className="p-6 bg-slate-50 border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-slate-700">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-[#155EEF] shrink-0" />
            <div>
              <strong className="text-slate-900">Regulatory Non-Repudiation Principle:</strong> Under Section 65B of the Indian Evidence Act and RBI digital lending directives, audit evidence must demonstrate complete chain of custody without retrospective modification.
            </div>
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider shrink-0">
            DEMONSTRATION ARCHITECTURE
          </span>
        </div>
      </div>
    </section>
  );
};
