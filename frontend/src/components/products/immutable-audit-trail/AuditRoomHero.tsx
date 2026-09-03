'use client';

import React, { useState } from 'react';
import { ArrowRight, ShieldCheck, Plus, Search, FileText, CheckCircle2, Lock, ShieldAlert, Cpu, Hash, Terminal } from 'lucide-react';

export const AuditRoomHero: React.FC = () => {
  const [currentEventNum, setCurrentEventNum] = useState(184);
  const [isAppending, setIsAppending] = useState(false);
  const [inspectOpen, setInspectOpen] = useState(false);
  const [recentActionToast, setRecentActionToast] = useState<string | null>(null);

  const handleAppendEvent = () => {
    if (isAppending) return;
    setIsAppending(true);
    setRecentActionToast('INGESTING EVENT PAYLOAD INTO WRITE-ONCE STORAGE...');

    setTimeout(() => {
      const nextId = currentEventNum + 1;
      setCurrentEventNum(nextId);
      setIsAppending(false);
      setRecentActionToast(`EVENT #${String(nextId).padStart(6, '0')} COMMITTED WITH SHA-256 MERKLE ATTESTATION`);
    }, 500);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="section-hero-audit-room"
      className="relative min-h-[96vh] flex flex-col justify-between py-16 sm:py-24 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Technical Grid Calibration Margins ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(to right, #071A33 1px, transparent 1px), linear-gradient(to bottom, #071A33 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="max-w-[1400px] mx-auto w-full relative z-10 space-y-12">
        {/* Top Editorial Headline Bar */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b-2 border-slate-900">
          <div className="space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-[11px] font-mono font-bold tracking-widest uppercase">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>IMMUTABLE AUDIT TRAIL // FORENSIC FINANCIAL ARCHIVE</span>
            </div>

            <h1
              className="text-4xl sm:text-6xl md:text-8xl font-black text-[#071A33] tracking-tighter leading-[0.92] uppercase"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              EVERY EVENT <br />
              <span className="text-[#155EEF]">LEAVES A TRACE.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-700 font-normal leading-relaxed max-w-2xl">
              Traditional databases allow silent <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono text-xs">UPDATE</code> and <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono text-xs">DELETE</code> mutations that obscure financial history. Adyapan provides a cryptographically sealed, append-only record stratum where every credit decision, policy modification, loan disbursal, and repayment is permanently preserved with microsecond causality.
            </p>
          </div>

          <div className="max-w-md space-y-6 text-left lg:text-right flex flex-col lg:items-end">
            <div className="p-4 bg-white border border-slate-300 shadow-xs space-y-1 text-left">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                REGULATORY STANDARD ALIGNMENT
              </span>
              <p className="text-xs font-mono text-slate-700 leading-snug">
                Designed for RBI Digital Lending Guidelines, ISO 27001 Annex A.12.4, and statutory 8-year financial audit permanence.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('section-ledger-strip')}
                className="px-6 py-3.5 bg-[#071A33] hover:bg-black text-white font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>OPEN THE AUDIT TRAIL</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('section-tamper-test')}
                className="px-6 py-3.5 bg-white hover:bg-slate-100 border-2 border-slate-900 text-slate-900 font-mono font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <span>RUN A RECORD DEMO</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── THE MASSIVE DIGITAL RECORD STRIP ── */}
        <div className="p-8 sm:p-12 bg-white border-2 border-slate-900 shadow-2xl relative space-y-8 text-left">
          {/* Top Record Identification Line */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-slate-900 font-mono">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>WRITE-ONCE-READ-MANY (WORM) RECORD POINTER</span>
              </span>
              <div
                className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                EVENT #{String(currentEventNum).padStart(6, '0')}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>STATE: APPENDED & SEALED</span>
              </span>

              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 border border-slate-200">
                SIMULATED PRODUCTION PAYLOAD
              </span>
            </div>
          </div>

          {/* 4 Core Forensic Quantitative Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
            <div className="space-y-1 p-4 bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase">ACTION TYPE</span>
              <div className="text-base font-black text-[#071A33] uppercase">
                PAYMENT_RECORDED
              </div>
              <div className="text-xs text-slate-600">Facility installment EMI sweep</div>
            </div>

            <div className="space-y-1 p-4 bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase">TIMESTAMP (UTC)</span>
              <div className="text-base font-black text-[#071A33]">
                2026-09-03 12:41:08.419
              </div>
              <div className="text-xs text-slate-600">Stratum-1 atomic clock reference</div>
            </div>

            <div className="space-y-1 p-4 bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase">INITIATING ACTOR</span>
              <div className="text-base font-black text-[#155EEF] uppercase">
                SYSTEM / CLEARING_BUS_V2
              </div>
              <div className="text-xs text-slate-600">Service account with mTLS sign-off</div>
            </div>

            <div className="space-y-1 p-4 bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase">PAYLOAD SETTLEMENT</span>
              <div className="text-xl font-black text-[#071A33]">
                ₹4,250.00
              </div>
              <div className="text-xs text-emerald-700 font-bold">✓ NPCI UPI Ref: 624109844210</div>
            </div>
          </div>

          {/* Chronological Sequence Link Bar */}
          <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-slate-600">
              <span>PREVIOUS: <strong className="text-slate-900 bg-slate-100 px-2 py-0.5">#{String(currentEventNum - 1).padStart(6, '0')}</strong></span>
              <span>→</span>
              <span>CURRENT: <strong className="text-white bg-[#155EEF] px-2 py-0.5 font-bold">#{String(currentEventNum).padStart(6, '0')}</strong></span>
              <span>→</span>
              <span>NEXT: <strong className="text-slate-400 border border-dashed border-slate-300 px-2 py-0.5">AWAITING COMMITS...</strong></span>
            </div>

            {/* Interactive Operations Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAppendEvent}
                disabled={isAppending}
                className="px-5 py-2.5 bg-[#155EEF] hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAppending ? 'COMMIT TO STORAGE...' : 'APPEND EVENT'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectOpen(!inspectOpen)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-slate-600" />
                <span>{inspectOpen ? 'COLLAPSE PAYLOAD' : 'INSPECT RECORD'}</span>
              </button>
            </div>
          </div>

          {/* Real-time Notification Banner */}
          {recentActionToast && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 font-mono text-xs text-emerald-900 font-bold flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{recentActionToast}</span>
            </div>
          )}

          {/* Deep Forensic Inspection Drawer */}
          {inspectOpen && (
            <div className="p-6 bg-[#071A33] text-white font-mono text-xs space-y-4 border-2 border-slate-900 shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>STRUCTURED FORENSIC JSON AUDIT PAYLOAD</span>
                </div>
                <span className="text-cyan-300 font-bold">NON-REPUDIABLE PROOF RECORD</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div><span className="text-slate-400">CANONICAL EVENT ID:</span> ADY-LOG-2026-09-03-{currentEventNum}</div>
                <div><span className="text-slate-400">PARENT HASH POINTER:</span> 7f9d8a12e443c08b...99e1</div>
                <div><span className="text-slate-400">EVENT SIGNATURE:</span> ed25519:5c03a9f4e28c701b3d88194...72c1</div>
                <div><span className="text-slate-400">HARDWARE SECURITY MODULE (HSM):</span> VALIDATED (KEY-ID: ADY-HSM-PRIMARY)</div>
                <div><span className="text-slate-400">BORROWER PAN ATTESTATION:</span> ABCDE****F (MASKED PER RBI GUIDELINE)</div>
                <div><span className="text-slate-400">MUTABILITY STATUS:</span> PERMANENTLY PROHIBITED (APPEND_ONLY_LOCK)</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
