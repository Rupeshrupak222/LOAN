'use client';

import React, { useState } from 'react';
import { FileCheck, CheckCircle2, RotateCcw, ShieldCheck, Printer } from 'lucide-react';

export const DigitalDecisionDocument: React.FC = () => {
  const [stampedLines, setStampedLines] = useState(6);
  const [isPrinting, setIsPrinting] = useState(false);

  const LINES = [
    { label: 'CASE REFERENCE', value: 'SIM-CASE-20481', detail: 'Single applicant facility request' },
    { label: 'VERIFIED DTI RATIO', value: '33.75%', detail: '₹27,000 monthly obligations / ₹80,000 income' },
    { label: 'POLICY LIMIT CEILING', value: '40.00%', detail: 'Institutional maximum allowable ratio' },
    { label: 'POLICY RULES EVALUATED', value: '08 / 08 PASSED', detail: 'All statutory & risk hygiene checks met' },
    { label: 'FINAL POLICY STATE', value: 'WITHIN CONFIGURED LIMIT', detail: 'Automated policy pass pre-authorized' },
    { label: 'DECISION TIMESTAMP', value: 'SIMULATED UTC', detail: 'Immutable record committed to audit trail' },
  ];

  const handleRePrint = () => {
    setIsPrinting(true);
    setStampedLines(0);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setStampedLines(count);
      if (count >= LINES.length) {
        clearInterval(interval);
        setIsPrinting(false);
      }
    }, 300);
  };

  return (
    <section
      id="section-decision-document"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-4xl mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-left sm:text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <FileCheck className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>AUTHENTICATED AUDIT CERTIFICATE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            THE DIGITAL <br />
            <span className="text-[#155EEF]">DECISION DOCUMENT.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            A line-by-line stamped digital certificate documenting every rule evaluated and policy threshold applied.
          </p>
        </div>

        {/* ── THE PRINTED DECISION DOCUMENT ── */}
        <div className="p-8 sm:p-14 bg-[#F8FAFC] border-2 border-slate-900 shadow-2xl relative text-left space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b-2 border-slate-900">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                CERTIFICATE OF POLICY UNDERWRITING
              </div>
              <div className="text-xl font-black uppercase text-[#071A33] mt-0.5">
                POLICY EVALUATION RECORD
              </div>
            </div>

            <button
              type="button"
              onClick={handleRePrint}
              disabled={isPrinting}
              className="px-4 py-2 bg-[#071A33] hover:bg-black text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isPrinting ? 'STAMPING RECORD...' : 'RE-STAMP DOCUMENT'}</span>
            </button>
          </div>

          {/* Stamped Rows */}
          <div className="space-y-3">
            {LINES.map((l, idx) => {
              const isStamped = idx < stampedLines;

              return (
                <div
                  key={l.label}
                  className={`p-4 border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isStamped
                      ? 'bg-white border-slate-300 opacity-100'
                      : 'bg-transparent border-dashed border-slate-200 opacity-30'
                  }`}
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                      {l.label}
                    </span>
                    <div className="text-base font-black font-mono text-[#071A33]">
                      {isStamped ? l.value : 'STAMP PENDING...'}
                    </div>
                  </div>

                  <div className="sm:text-right text-xs font-mono text-slate-500">
                    {isStamped && <span>{l.detail}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Official Seal Badge */}
          <div className="pt-6 border-t-2 border-slate-900 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-slate-800">
                OFFICIALLY ATTESTED BY ADYAPAN POLICY CORE
              </span>
            </div>

            <span className="text-[10px] uppercase">
              STATUS: AUDIT RECORD PERMANENTLY ARCHIVED
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
