'use client';

import React from 'react';
import { ShieldCheck, Eye, Lock, Sliders, CheckCircle2 } from 'lucide-react';

interface Pillar {
  icon: React.ElementType;
  title: string;
  tag: string;
  description: string;
}

const PILLARS: Pillar[] = [
  {
    icon: Eye,
    title: 'Absolute Transparency',
    tag: 'No Hidden Fees',
    description: 'Every interest calculation, processing component, and repayment schedule is disclosed upfront with zero hidden asterisks.',
  },
  {
    icon: Sliders,
    title: 'Borrower Control',
    tag: 'Flexible Tenures',
    description: 'Adjust repayment terms, select preferred EMI dates, and prepay early with clear, zero-penalty policies.',
  },
  {
    icon: ShieldCheck,
    title: 'Instant Visibility',
    tag: 'Real-Time Tracking',
    description: 'Track the status of your application live through the 5 stages with clear, understandable updates.',
  },
  {
    icon: Lock,
    title: 'Bank-Grade Security',
    tag: 'Zero-Trust Storage',
    description: '256-bit cryptographic encryption safeguarding all financial data and consent tokens at rest and in transit.',
  },
];

export const LendingClarityPillars: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>LENDING PRINCIPLES</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          Built Around Radical Clarity & Borrower Trust
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          We believe personal lending should empower your next move without confusing fine print or unexpected surprises.
        </p>
      </div>

      {/* 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {PILLARS.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#155EEF]/50 transition-all space-y-4 group"
            >
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#155EEF] flex items-center justify-center group-hover:bg-[#155EEF] group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {p.tag}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">{p.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
