'use client';

import React, { useState } from 'react';
import { AlertOctagon, RefreshCw, ShieldCheck, RotateCcw, ShieldAlert, FileText, Database } from 'lucide-react';

export const TamperSimulationSandbox: React.FC = () => {
  const [hasMutated, setHasMutated] = useState(false);

  return (
    <section
      id="section-tamper-test"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-4xl mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-left sm:text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-xs font-mono font-bold uppercase tracking-widest">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            <span>INTERACTIVE MUTATION STRESS-TEST HARNESS</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            SIMULATE A RECORD <br />
            <span className="text-[#155EEF]">TAMPER ATTEMPT.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Experience first-hand how Adyapan’s append-only storage engine detects unauthorized SQL modifications and preserves original financial history against rogue administrative actions.
          </p>
        </div>

        {/* ── INTERACTIVE MUTATION SANDBOX ── */}
        <div className="p-8 sm:p-12 bg-white border-2 border-slate-900 shadow-2xl space-y-8 text-left font-mono">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">ACTIVE SIMULATION TARGET</span>
              <div className="text-lg font-black text-[#071A33]">
                TRANSACTION RECORD #000184 (FACILITY REPAYMENT)
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setHasMutated(true)}
                disabled={hasMutated}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-md"
              >
                SIMULATE SQL REWRITE
              </button>

              <button
                type="button"
                onClick={() => setHasMutated(false)}
                disabled={!hasMutated}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold uppercase transition-all disabled:opacity-40 cursor-pointer"
                title="Reset simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Side-by-Side Values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 border border-slate-300 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                <span>CANONICAL HISTORICAL RECORD</span>
                <span className="text-emerald-700 font-bold">SEALED (12:41:08 UTC)</span>
              </div>
              <div className="text-3xl font-black text-[#071A33]">₹4,250.00</div>
              <div className="text-xs text-slate-600 font-mono">
                HASH: <code className="text-[#155EEF] font-bold">sha256:4a8c9e120...</code>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Permanent record committed to write-once storage. Backed by dual-signed bank clearing receipts.
              </p>
            </div>

            <div
              className={`p-5 border-2 transition-all space-y-2 ${
                hasMutated
                  ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-md'
                  : 'bg-slate-50 border-dashed border-slate-300 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] uppercase">
                <span>ATTEMPTED RETROACTIVE REWRITE</span>
                <span className={hasMutated ? 'text-rose-700 font-bold' : ''}>
                  {hasMutated ? 'INTERCEPTED' : 'AWAITING ATTACK TRIGGER'}
                </span>
              </div>
              <div className="text-3xl font-black">
                {hasMutated ? '₹7,250.00' : '₹----.--'}
              </div>
              <div className="text-xs font-mono">
                {hasMutated ? (
                  <span>CORRUPTED DIGEST: <code className="text-rose-700 font-bold">sha256:e812d0a4...</code></span>
                ) : (
                  'No SQL mutation sent'
                )}
              </div>
              <p className="text-[11px] font-sans">
                {hasMutated
                  ? 'Unauthorized database administrator update attempting to alter historical ledger balance.'
                  : 'Click "Simulate SQL Rewrite" to inject a rogue update attempt.'}
              </p>
            </div>
          </div>

          {/* Immediate Difference Alert Banner */}
          {hasMutated && (
            <div className="p-5 bg-[#0A1628] text-white border-2 border-rose-500 space-y-3 text-xs">
              <div className="font-bold flex items-center gap-2 text-rose-400 text-sm">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />
                <span>FORENSIC INTEGRITY TRIPWIRE TRIPPED // WRITE-LOCK VIOLATION</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-mono text-[11px] text-slate-300">
                <div className="space-y-1">
                  <span className="text-rose-400 font-bold uppercase">1. CHECKSUM COLLISION</span>
                  <p className="font-sans text-slate-300 leading-snug">
                    Altering ₹4,250 to ₹7,250 changed the block digest. The downstream ledger points to 4a8c9e..., immediately proving illegal splicing.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-emerald-400 font-bold uppercase">2. CANONICAL PRESERVATION</span>
                  <p className="font-sans text-slate-300 leading-snug">
                    The append-only storage engine rejects the disk sector modification. The authentic ₹4,250 entry remains intact with zero data loss.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-cyan-300 font-bold">
                AUDIT EVENT DISPATCHED: SEC-ALERT-MUTATION-ATTEMPT-LOGGED-TO-SIEM
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
