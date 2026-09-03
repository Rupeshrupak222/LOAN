'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle2, Play, ShieldCheck, Crosshair } from 'lucide-react';

export const FinancialProfileDocument: React.FC = () => {
  const [activeLine, setActiveLine] = useState(3);
  const [isAutoStepping, setIsAutoStepping] = useState(false);

  const FIELDS = [
    { label: 'APPLICANT REF', value: 'SIM-APP-89421', status: 'VERIFIED', note: 'Primary identity and tax PAN bound' },
    { label: 'GROSS MONTHLY INCOME', value: '₹80,000.00', status: 'VERIFIED', note: 'Direct salary automated payroll sweep' },
    { label: 'MONTHLY DEBT OBLIGATIONS', value: '₹18,000.00', status: 'VERIFIED', note: 'Active personal loan EMI + auto loan' },
    { label: 'PROPOSED NEW PAYMENT', value: '₹9,000.00', status: 'PROJECTED', note: 'Requested term: 36 mo facility' },
    { label: 'CURRENT TOTAL EXPOSURE', value: '₹3,40,000.00', status: 'SIMULATED', note: 'Multi-institutional credit exposure' },
    { label: 'BUREAU SIGNAL HEALTH', value: 'CLASS-A (CLEAN)', status: 'ACTIVE', note: '0 overdue cycles in past 36 months' },
    { label: 'POLICY UNDERWRITING SLATE', value: 'v2.4 STANDARD RETAIL', status: 'APPLIED', note: 'Rulebook ceiling bound at 40% DTI' },
  ];

  const handleStepScan = () => {
    setIsAutoStepping(true);
    let step = 0;
    const interval = setInterval(() => {
      setActiveLine(step);
      step++;
      if (step >= FIELDS.length) {
        clearInterval(interval);
        setIsAutoStepping(false);
      }
    }, 400);
  };

  return (
    <section
      id="section-profile-doc"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-gradient-to-b from-[#F8FAFC] via-white to-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-left space-y-3 pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <Crosshair className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>DIGITAL UNDERWRITING PROFILE // AUDIT SPEC</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            LOOK THROUGH <br />
            <span className="text-[#155EEF]">THE APPLICATION.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal max-w-xl">
            A continuous digital underwriting sheet that systematically scans, isolates, and verifies the applicant’s entire liability footprint.
          </p>
        </div>

        {/* ── DIGITAL UNDERWRITING SHEET WITH VERTICAL SCAN BAR ── */}
        <div className="relative p-8 sm:p-12 rounded-none bg-white border-2 border-slate-300 shadow-xl space-y-6">
          {/* Header Stamp */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-slate-900 text-xs font-mono">
            <div>
              <span className="font-bold uppercase tracking-widest text-[#071A33]">
                ADYAPAN CREDIT DIAGNOSTIC SHEET
              </span>
              <div className="text-[10px] text-slate-500">
                FORM ID: ADY-DTI-SPEC-2026 // CONFIDENTIAL
              </div>
            </div>

            <button
              type="button"
              onClick={handleStepScan}
              disabled={isAutoStepping}
              className="px-4 py-1.5 bg-[#155EEF] hover:bg-blue-700 text-white text-[11px] font-mono font-bold uppercase transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3 h-3" />
              <span>{isAutoStepping ? 'SCANNING ROWS...' : 'RUN FIELD SCAN'}</span>
            </button>
          </div>

          {/* Table Rows with Vertical Scanning Bar */}
          <div className="space-y-2 relative">
            {FIELDS.map((f, idx) => {
              const isActive = activeLine === idx;

              return (
                <div
                  key={f.label}
                  onClick={() => setActiveLine(idx)}
                  className={`p-4 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-[#071A33] text-white border-[#071A33] shadow-md -translate-x-1'
                      : 'bg-[#F8FAFC] text-[#071A33] border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                      {f.label}
                    </div>
                    <div className="text-base font-black font-mono tracking-tight">
                      {f.value}
                    </div>
                  </div>

                  <div className="sm:text-right space-y-0.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {f.status}
                    </span>
                    <div className={`text-xs ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                      {f.note}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Diagnostic Metadata */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400">
            <span>TOTAL SIGNALS VERIFIED: 07 / 07</span>
            <span>SYSTEM SENSITIVITY: 100% DETERMINISTIC</span>
            <span>SIMULATED VALUES</span>
          </div>
        </div>
      </div>
    </section>
  );
};
