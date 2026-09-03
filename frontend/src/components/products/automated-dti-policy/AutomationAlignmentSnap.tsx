'use client';

import React, { useState } from 'react';
import { Zap, RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';

export const AutomationAlignmentSnap: React.FC = () => {
  const [isSnapped, setIsSnapped] = useState(true);

  return (
    <section
      id="section-automation-snap"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-left sm:text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>STRUCTURAL PROCESS ALIGNMENT</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            FROM MANUAL CHECK <br />
            <span className="text-[#155EEF]">TO CONFIGURED POLICY.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Eliminate fragmented spreadsheets and ad-hoc arithmetic. Snap legacy human review into an audit-proof, deterministic execution circuit.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsSnapped(!isSnapped)}
              className="px-6 py-2.5 bg-[#071A33] hover:bg-black text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 mx-auto cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${!isSnapped ? 'animate-spin' : ''}`} />
              <span>{isSnapped ? 'SHOW LEGACY FRAGMENTED PROCESS' : 'SNAP TO AUTOMATED CIRCUIT'}</span>
            </button>
          </div>
        </div>

        {/* ── FRAGMENTED VS ALIGNED PHYSICAL CIRCUIT ── */}
        <div className="p-8 sm:p-12 bg-[#F8FAFC] border-2 border-slate-900 shadow-xl space-y-6 text-left">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 text-xs font-mono">
            <span className="font-bold uppercase tracking-wider text-slate-500">
              {isSnapped ? 'STATE: ALIGNED POLICY ENGINE' : 'STATE: FRAGMENTED MANUAL SPREADSHEETS'}
            </span>
            <span className={`font-bold ${isSnapped ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isSnapped ? '✓ ZERO LATENCY' : '⚠ 24-48 HOUR FRICTION'}
            </span>
          </div>

          <div className="space-y-4">
            {[
              { num: '01', manual: 'Spreadsheet Upload & Copy-Paste', auto: 'Direct API & Bureau Ingestion Payload', manualOffset: '-translate-x-6 rotate-1' },
              { num: '02', manual: 'Unstandardized Excel Formula Checks', auto: 'Deterministic Sub-Millisecond DTI Arithmetic', manualOffset: 'translate-x-8 -rotate-1' },
              { num: '03', manual: 'Ad-hoc Underwriter In-Box Queues', auto: 'Configured Policy Threshold Boundary Verification', manualOffset: '-translate-x-4 rotate-2' },
              { num: '04', manual: 'Non-Auditable Informal Decision Sign-Off', auto: 'Immutable SHA-256 Decision Document Stamped', manualOffset: 'translate-x-6 -rotate-1' },
            ].map((st) => (
              <div
                key={st.num}
                className={`p-5 border-2 transition-all duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isSnapped
                    ? 'bg-white border-slate-900 translate-x-0 rotate-0 shadow-md'
                    : `bg-rose-50/60 border-rose-300 ${st.manualOffset} shadow-xs`
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="w-8 h-8 rounded-none bg-slate-900 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {st.num}
                  </span>
                  <div className="text-sm font-bold text-[#071A33] uppercase">
                    {isSnapped ? st.auto : st.manual}
                  </div>
                </div>

                <div className="text-xs font-mono font-bold">
                  {isSnapped ? (
                    <span className="text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>AUTOMATED</span>
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      <span>MANUAL BOTTLENECK</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
