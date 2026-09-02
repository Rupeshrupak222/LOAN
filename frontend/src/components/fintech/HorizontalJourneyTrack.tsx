'use client';

import React, { useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Cpu,
  Zap,
  Rocket,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const STAGES = [
  {
    step: '01',
    title: 'Apply in 30s',
    sub: 'Set your coordinates',
    desc: 'Pick your purpose and desired amount. No tedious forms or branch paperwork.',
    icon: FileText,
    badge: '30 Seconds',
  },
  {
    step: '02',
    title: 'Instant e-KYC',
    sub: 'DigiLocker Consent',
    desc: 'Zero photocopies. Instant Aadhaar & PAN verification with bank-grade 256-bit encryption.',
    icon: ShieldCheck,
    badge: '60 Seconds',
  },
  {
    step: '03',
    title: 'Smart Sanction',
    sub: 'AI Underwriting',
    desc: 'Our credit engine assesses cash-flow health with zero human bias to sanction maximum credit.',
    icon: Cpu,
    badge: 'Real-Time',
  },
  {
    step: '04',
    title: 'Receive Funds',
    sub: 'Instant UPI / Bank Rail',
    desc: 'Funds transferred directly to your Google Pay, PhonePe, or Primary Bank Account.',
    icon: Zap,
    badge: '90 Seconds flat',
  },
  {
    step: '05',
    title: 'Move Forward',
    sub: 'Empower Your Goal',
    desc: 'Scale your business, finish your degree, or renovate your home with peace of mind.',
    icon: Rocket,
    badge: 'Goal Achieved',
  },
];

export const HorizontalJourneyTrack: React.FC = () => {
  const [activeStage, setActiveStage] = useState(2);

  return (
    <section className="relative py-28 bg-[#071A33] text-white overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-[#4EA8FF] uppercase tracking-widest mb-4 font-bold">
            <span>CHAPTER 04 : THE FINANCIAL JOURNEY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
            How your money moves.
          </h2>
          <p className="text-[#B8C7D9] text-base sm:text-lg">
            A single, continuous financial path from your first intent to cash in hand in under 3 minutes.
          </p>
        </div>

        {/* Continuous Horizontal Journey Flow */}
        <div className="relative mb-12">
          {/* Connecting Energy Track */}
          <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-1 bg-white/10 -translate-y-1/2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#155EEF] via-[#4EA8FF] to-[#8DEBFF] transition-all duration-500"
              style={{ width: `${((activeStage + 1) / STAGES.length) * 100}%` }}
            />
          </div>

          {/* 5 Connected Interactive Nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
            {STAGES.map((stage, idx) => {
              const isCompleted = idx < activeStage;
              const isCurrent = idx === activeStage;

              return (
                <div
                  key={idx}
                  onClick={() => setActiveStage(idx)}
                  className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 backdrop-blur-md flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-white/15 border-[#4EA8FF] shadow-lg scale-102 ring-1 ring-[#4EA8FF]'
                      : isCompleted
                      ? 'bg-white/5 border-white/20 text-[#B8C7D9]'
                      : 'bg-white/[0.03] border-white/5 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Node Top Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm transition-all duration-200 ${
                        isCurrent
                          ? 'bg-[#155EEF] text-white shadow-xs'
                          : isCompleted
                          ? 'bg-white/20 text-white'
                          : 'bg-white/10 text-[#B8C7D9]'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : stage.step}
                    </div>

                    <span
                      className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        isCurrent
                          ? 'bg-[#155EEF] text-white'
                          : isCompleted
                          ? 'bg-white/10 text-[#B8C7D9]'
                          : 'text-[#B8C7D9]/60'
                      }`}
                    >
                      {stage.badge}
                    </span>
                  </div>

                  {/* Node Body */}
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">{stage.title}</h4>
                    <div className="text-xs font-semibold text-[#4EA8FF] mb-2">{stage.sub}</div>
                    <p className="text-xs text-[#B8C7D9] leading-relaxed font-normal">{stage.desc}</p>
                  </div>

                  {/* Status indicator */}
                  <div
                    className={`mt-4 pt-3 border-t border-white/10 text-[11px] font-mono ${
                      isCurrent
                        ? 'text-[#4EA8FF] font-bold'
                        : isCompleted
                        ? 'text-white'
                        : 'text-[#B8C7D9]/60'
                    }`}
                  >
                    {isCurrent ? '● Active Step' : isCompleted ? '✓ Completed' : 'Upcoming'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
