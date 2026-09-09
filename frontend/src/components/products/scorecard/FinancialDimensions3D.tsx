'use client';

import React from 'react';
import { TrendingUp, CreditCard, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const FinancialDimensions3D: React.FC = () => {
  const dimensions = [
    {
      num: '01',
      title: 'INCOME',
      tag: 'EARNING PROFILE',
      subtitle: 'Understand the earning profile.',
      detail: 'Evaluates net cashflow velocity, salary consistency, multi-source income diversity, and seasonal revenue durability.',
      icon: TrendingUp,
      depthZ: -700,
      rotX: 20,
      rotY: -12,
      stagger: 0.1,
    },
    {
      num: '02',
      title: 'CREDIT',
      tag: 'REPAYMENT DISCIPLINE',
      subtitle: 'Evaluate credit behaviour.',
      detail: 'Analyzes bureau vintage, payment delinquency absence, credit mix longevity, and historic credit utilization discipline.',
      icon: CreditCard,
      depthZ: -1000,
      rotX: -14,
      rotY: 10,
      stagger: 0.25,
    },
    {
      num: '03',
      title: 'OBLIGATIONS',
      tag: 'DEBT COMMITMENTS',
      subtitle: 'Understand existing financial commitments.',
      detail: 'Calculates active institutional EMIs, uncollateralized exposure, revolving card interest burden, and debt-to-income cushion.',
      icon: ShieldAlert,
      depthZ: -1300,
      rotX: 18,
      rotY: -8,
      stagger: 0.4,
    },
    {
      num: '04',
      title: 'BEHAVIOUR',
      tag: 'CASHFLOW INTEGRITY',
      subtitle: 'Identify relevant patterns in financial activity.',
      detail: 'Identifies recurring utility debits, liquidity buffer resilience, average monthly balance preservation, and transaction health.',
      icon: Sparkles,
      depthZ: -900,
      rotX: 10,
      rotY: 12,
      stagger: 0.55,
    },
  ];

  return (
    <ScrollStage3D
      id="scorecard-dimensions"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16 text-left">
        {/* Header Block Emerging from Depth */}
        <div className="max-w-3xl space-y-4">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs"
          >
            <span>STAGE 01 // MULTI-DIMENSIONAL OBSERVATION</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              ONE NUMBER ISN'T{' '}
              <span className="text-[#155EEF] block">THE WHOLE STORY.</span>
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
              Traditional credit scores collapse years of nuanced financial decisions into a single crude figure. Adyapan structures underwriting around four distinct physical dimensions to reconstruct the complete financial reality.
            </p>
          </div>
        </div>

        {/* ── 4 Physical 3D Information Layers Cascading from Different Depths ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dimensions.map((dim, idx) => {
            const Icon = dim.icon;
            return (
              <div
                key={idx}
                data-depth-z={dim.depthZ.toString()}
                data-rotate-x={dim.rotX.toString()}
                data-rotate-y={dim.rotY.toString()}
                data-scale="0.75"
                data-offset-y="75"
                data-blur="10"
                data-stagger={dim.stagger.toString()}
                className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-[#155EEF] transition-all space-y-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-mono font-black text-[#155EEF]">
                      DIMENSION {dim.num}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#155EEF] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    {dim.tag}
                  </span>

                  <h3 className="text-xl font-black text-[#071A33] font-sans">
                    {dim.title}
                  </h3>

                  <p className="text-sm font-semibold text-slate-700 font-sans">
                    {dim.subtitle}
                  </p>

                  <p className="text-xs text-slate-500 font-sans leading-relaxed">
                    {dim.detail}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold text-slate-400">
                  <span>LAYER {dim.num} OF 04</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Financial Profile Alignment Lockup */}
        <div
          data-depth-z="-750"
          data-rotate-x="18"
          data-scale="0.85"
          data-offset-y="40"
          data-blur="6"
          data-stagger="0.4"
          className="p-6 rounded-2xl bg-white border border-slate-200/90 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-sans text-slate-600"
        >
          <div className="space-y-1">
            <span className="font-bold font-mono text-[#071A33] uppercase block">
              SYNCHRONIZED PROFILE CONVERGENCE
            </span>
            <p>
              When all four dimensional layers align, they compose the unified applicant profile. No single adverse outlier can blindly reject an otherwise creditworthy portfolio candidate.
            </p>
          </div>

          <span className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-50 font-mono text-[11px] font-bold text-[#155EEF] border border-blue-200">
            FINANCIAL PROFILE READY
          </span>
        </div>
      </div>
    </ScrollStage3D>
  );
};
