'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   PaymentTimelineTunnel — "THREE PAYMENTS. ONE FINISH LINE."
   ─────────────────────────────────────────────────────────────
   ▸ 3D Temporal Pathway:
     - 01 Checkout Day (Today)
     - 02 Day 30 Mid-Point (Next Month)
     - 03 Day 60 Completion (Finish Line)
   ▸ Deep spatial card cascade.
   ══════════════════════════════════════════════════════════════ */

interface MilestoneCard {
  step: string;
  dayLabel: string;
  headline: string;
  amountExample: string;
  status: string;
  description: string;
  badge: string;
}

const TIMELINE_STEPS: MilestoneCard[] = [
  {
    step: '01',
    dayLabel: 'DAY 00',
    headline: 'Instant Checkout Capture',
    amountExample: '₹4,000 Paid',
    status: 'Authorized Instantly',
    description: 'First installment processes at point-of-sale. Merchant dispatches goods immediately.',
    badge: 'Checkout Trigger',
  },
  {
    dayLabel: 'DAY 30',
    step: '02',
    headline: 'Automated Mid-Point Debit',
    amountExample: '₹4,000 Paid',
    status: 'Auto-Debited',
    description: 'Second installment clears seamlessly via linked e-Mandate without manual intervention.',
    badge: '30-Day Checkpoint',
  },
  {
    dayLabel: 'DAY 60',
    step: '03',
    headline: 'Final Account Completion',
    amountExample: '₹4,000 Paid',
    status: '100% Cleared',
    description: 'Final installment clears. The entire ₹12,000 purchase is now fully settled and complete.',
    badge: 'Finish Line',
  },
];

export const PaymentTimelineTunnel: React.FC = () => {
  const [activeStepIdx, setActiveStepIdx] = useState<number>(1);

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Calendar className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>TEMPORAL 90-DAY JOURNEY</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Three Payments. One Finish Line.
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Experience how each installment moves through time. Clear milestones keep you fully informed from checkout to final account clearance.
        </p>
      </div>

      {/* 3 Step Cards in Deep Spatial Arrangement */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1400px] mx-auto text-left">
        {TIMELINE_STEPS.map((st, idx) => {
          const isSelected = activeStepIdx === idx;

          return (
            <div
              key={st.step}
              onClick={() => setActiveStepIdx(idx)}
              className={`p-7 sm:p-8 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                isSelected
                  ? 'bg-[#071A33] text-white border-blue-500/60 shadow-2xl scale-102 ring-2 ring-[#155EEF]/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full ${
                    isSelected ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {st.dayLabel} · {st.badge}
                  </span>
                  <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-400' : 'text-[#155EEF]'}`}>
                    Stage {st.step}
                  </span>
                </div>

                <h3 className={`text-xl font-black ${isSelected ? 'text-white' : 'text-[#071A33]'}`}>
                  {st.headline}
                </h3>
                <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {st.description}
                </p>
              </div>

              <div className={`p-4 rounded-2xl font-mono text-xs flex justify-between items-center ${
                isSelected ? 'bg-slate-900 border border-slate-800' : 'bg-slate-50 border border-slate-100'
              }`}>
                <span className={isSelected ? 'text-slate-400' : 'text-slate-500'}>Installment Status</span>
                <span className={`font-bold ${isSelected ? 'text-emerald-400' : 'text-[#155EEF]'}`}>{st.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
