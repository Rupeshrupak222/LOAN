'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   EmiCircularFlow — "SEE THE MONTHLY JOURNEY"
   ─────────────────────────────────────────────────────────────
   ▸ Circular architectural pathway representing monthly cycles.
   ▸ Visual steps:
     - Day 01: NACH e-Mandate Debit
     - Day 05: Core Ledger Split (Principal vs Interest)
     - Day 15: Tax Benefit & Statement Generation
     - Day 30: Principal Equity Reduction
   ▸ Clearly labeled: "Illustrative repayment flow"
   ══════════════════════════════════════════════════════════════ */

interface CycleMilestone {
  day: string;
  title: string;
  action: string;
  impact: string;
}

const CYCLE_STEPS: CycleMilestone[] = [
  {
    day: 'Day 01',
    title: 'Automated NACH Trigger',
    action: 'Direct debit clears from your linked primary salary account via NPCI e-Mandate.',
    impact: 'Zero missed dates · Clean bureau history',
  },
  {
    day: 'Day 05',
    title: 'Amortization Waterfall Split',
    action: 'Core engine splits payment: Interest allocated, remainder directly reduces outstanding principal.',
    impact: 'Exact financial decimal precision',
  },
  {
    day: 'Day 15',
    title: 'Section 24 & 80C Tax Logging',
    action: 'Real-time interest and principal tax exemption certificates logged to DigiLocker.',
    impact: 'Max ₹2 Lakhs Sec 24 + ₹1.5 Lakhs Sec 80C',
  },
  {
    day: 'Day 30',
    title: 'Equity Ownership Increment',
    action: 'Unencumbered property equity increases, compounding total family net worth.',
    impact: 'Growing permanent unencumbered asset',
  },
];

export const EmiCircularFlow: React.FC = () => {
  const [activeCycleIdx, setActiveCycleIdx] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCycleIdx((p) => (p + 1) % CYCLE_STEPS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const current = CYCLE_STEPS[activeCycleIdx];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Activity className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>CIRCULAR REPAYMENT CYCLE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          See the Monthly Journey
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Trace how each monthly installment flows seamlessly through automated clearing, tax logging, and principal debt reduction.
        </p>
      </div>

      {/* Main Circular Arena */}
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-12 max-w-[1400px] mx-auto shadow-2xl text-left space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">MONTHLY FLOW SIMULATOR</span>
            <h3 className="text-2xl font-black text-white mt-1">Automated 30-Day Cycle</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800">
            ILLUSTRATIVE REPAYMENT FLOW
          </span>
        </div>

        {/* 4 Interactive Cycle Milestones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CYCLE_STEPS.map((step, idx) => {
            const isCurrent = activeCycleIdx === idx;
            return (
              <div
                key={step.day}
                onClick={() => setActiveCycleIdx(idx)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                  isCurrent
                    ? 'bg-[#155EEF] border-blue-400 shadow-lg scale-102'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase ${isCurrent ? 'text-blue-100' : 'text-slate-500'}`}>
                    {step.day}
                  </span>
                  {isCurrent && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
                </div>
                <h4 className="text-sm font-bold text-white">{step.title}</h4>
                <p className="text-xs leading-relaxed opacity-85">{step.action}</p>
                <div className="pt-2 border-t border-white/10 text-[10px] font-mono font-bold text-emerald-300">
                  {step.impact}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Real-Time Telemetry Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Active Stage: <strong>{current.title}</strong></span>
          </div>
          <span className="text-slate-400">100% Paperless NACH & Real-Time Loan Account Synchronization</span>
        </div>
      </div>
    </section>
  );
};
