'use client';

import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, TrendingUp, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

interface SignalReason {
  id: string;
  pillar: string;
  title: string;
  weight: string;
  impact: string;
  explanation: string;
  signals: string[];
  depthZ: number;
}

const REASONS: SignalReason[] = [
  {
    id: 'income',
    pillar: '01. INCOME STABILITY',
    title: 'Strong Ingress Regularity & Employer Quality',
    weight: '25% WEIGHT',
    impact: 'POSITIVE (+46 PTS)',
    explanation:
      'The applicant receives predictable monthly compensation directly from an accredited employer on the 1st of every month without historical interruptions over 36 months.',
    signals: ['Fixed Monthly Cadence', 'Cat-A Corporate Entity', 'Low Seasonal Variance (<4%)'],
    depthZ: -800,
  },
  {
    id: 'credit',
    pillar: '02. CREDIT PROFILE',
    title: 'Extensive Bureau Vintage with 0 DPD Delinquencies',
    weight: '30% WEIGHT',
    impact: 'POSITIVE (+58 PTS)',
    explanation:
      'Historic credit bureau records reflect 76 consecutive months of timely settlements across prime credit cards and personal lines without a single 30+ DPD flag.',
    signals: ['76 Months Vintage', 'Zero Historic Defaults', 'Balanced Credit Line Mix'],
    depthZ: -1000,
  },
  {
    id: 'obligations',
    pillar: '03. DEBT OBLIGATIONS',
    title: 'Sub-Threshold DTI with Generous Absorption Buffer',
    weight: '25% WEIGHT',
    impact: 'NEUTRAL-POSITIVE (+22 PTS)',
    explanation:
      'Fixed institutional loan commitments stand at 26% of verified net cashflow, leaving a 44% safety buffer below the maximum institutional lending ceiling of 50%.',
    signals: ['26% Fixed DTI Ratio', 'No High-Interest Clustering', 'Adequate Rate Shock Buffer'],
    depthZ: -1200,
  },
  {
    id: 'behaviour',
    pillar: '04. FINANCIAL BEHAVIOUR',
    title: 'Disciplined Average Monthly Balance & Liquidity Runway',
    weight: '20% WEIGHT',
    impact: 'POSITIVE (+34 PTS)',
    explanation:
      'Account balances maintain a minimum of 2.8 months of operational reserves even after month-end debit sweeps, demonstrating robust liquidity management.',
    signals: ['Zero Overdraft Incidents', '100% Auto-Debit Success', '2.8M Emergency Buffer'],
    depthZ: -1400,
  },
];

export const DecisionExplainability3D: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('income');

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <ScrollStage3D
      id="scorecard-explainability"
      perspective={1500}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1200px] mx-auto space-y-16 text-left">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
          >
            <span>STAGE 08 // EXPLAINABLE AI ARCHITECTURE</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              A DECISION SHOULD BE{' '}
              <span className="text-[#155EEF] block">UNDERSTANDABLE.</span>
            </h2>
          </div>

          <div
            data-depth-z="-600"
            data-rotate-y="-8"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.2"
          >
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Black-box scoring is unacceptable in regulated financial infrastructure. Every credit sanction, referral, or limit recommendation is decomposed into auditable contributing signals.
            </p>
          </div>
        </div>

        {/* ── Expandable Contributing Signal Accordion Stack ── */}
        <div className="space-y-4">
          {REASONS.map((r, idx) => {
            const isOpen = openId === r.id;
            return (
              <div
                key={r.id}
                data-depth-z={r.depthZ.toString()}
                data-rotate-x="16"
                data-scale="0.8"
                data-offset-y="60"
                data-blur="8"
                data-stagger={(idx * 0.15).toFixed(2)}
                className="rounded-2xl bg-slate-50 border border-slate-200/90 overflow-hidden transition-all duration-300 shadow-2xs hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => toggle(r.id)}
                  className="w-full p-6 sm:p-7 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 text-[10px] font-mono font-bold">
                      <span className="text-slate-500 uppercase">{r.pillar}</span>
                      <span className="text-[#155EEF]">{r.weight}</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {r.impact}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#071A33] font-sans">
                      {r.title}
                    </h3>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#155EEF] border-[#155EEF]' : 'text-slate-400'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 sm:px-7 sm:pb-7 space-y-4 border-t border-slate-200/60 pt-4 text-left">
                    <p className="text-sm text-slate-600 font-sans leading-relaxed">
                      {r.explanation}
                    </p>

                    <div className="space-y-1.5 font-mono text-xs">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        AUDITED REASON CODES:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {r.signals.map((sig, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold"
                          >
                            ✓ {sig}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ScrollStage3D>
  );
};
