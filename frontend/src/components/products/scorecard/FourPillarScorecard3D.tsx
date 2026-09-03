'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  CreditCard,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const FourPillarScorecard3D: React.FC = () => {
  const [activePillar, setActivePillar] = useState<number | null>(null);

  const pillars = [
    {
      id: 1,
      title: 'INCOME STABILITY',
      category: 'PILLAR 01 // CASHFLOW CAPACITY',
      metric: '₹1,45,000 / Month',
      trend: 'POSITIVE (+8.4% YoY)',
      trendType: 'positive',
      weight: '25% WEIGHT',
      status: 'VERIFIED REVENUE',
      depthZ: -900,
      rotX: 18,
      rotY: -16,
      icon: TrendingUp,
      indicators: [
        { name: 'Salary Regularity', score: '98/100' },
        { name: 'Direct Deposit Vintage', score: '36 Months' },
        { name: 'Employer Risk Rating', score: 'Cat-A Corporate' },
      ],
    },
    {
      id: 2,
      title: 'CREDIT PROFILE',
      category: 'PILLAR 02 // HISTORIC VINTAGE',
      metric: '76 Months Track Record',
      trend: 'CLEAN REPAYMENT',
      trendType: 'positive',
      weight: '30% WEIGHT',
      status: '0 DPD RECORD',
      depthZ: -1200,
      rotX: -14,
      rotY: 14,
      icon: CreditCard,
      indicators: [
        { name: '30+ DPD Delinquencies', score: 'Zero Incidents' },
        { name: 'Credit Card Utilization', score: '18.4% (Optimal)' },
        { name: 'Secured vs Unsecured Mix', score: 'Balanced Ratio' },
      ],
    },
    {
      id: 3,
      title: 'DEBT OBLIGATIONS',
      category: 'PILLAR 03 // COMMITMENT BURDEN',
      metric: '26% Fixed DTI Ratio',
      trend: 'SUB-THRESHOLD',
      trendType: 'neutral',
      weight: '25% WEIGHT',
      status: 'HEADROOM ADEQUATE',
      depthZ: -1400,
      rotX: 16,
      rotY: -12,
      icon: ShieldCheck,
      indicators: [
        { name: 'Active Monthly EMIs', score: '₹37,700 / Mo' },
        { name: 'Debt-to-Income Margin', score: '44% Buffer Available' },
        { name: 'Interest Rate Shock Sensitivity', score: 'Resilient (<3% Impact)' },
      ],
    },
    {
      id: 4,
      title: 'FINANCIAL BEHAVIOUR',
      category: 'PILLAR 04 // LIQUIDITY DYNAMICS',
      metric: '₹84,000 Average Balance',
      trend: 'POSITIVE RUNWAY',
      trendType: 'positive',
      weight: '20% WEIGHT',
      status: 'HIGH LIQUIDITY',
      depthZ: -1000,
      rotX: 12,
      rotY: 12,
      icon: Sparkles,
      indicators: [
        { name: 'Min Balance Breach', score: '0 Instances (12M)' },
        { name: 'Recurring Utility Auto-Debits', score: '100% Success Rate' },
        { name: 'Emergency Liquidity Cushion', score: '2.8 Months Reserve' },
      ],
    },
  ];

  return (
    <ScrollStage3D
      id="scorecard-four-pillars"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16 text-left">
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
            <span>STAGE 02 // 4-PILLAR ARCHITECTURE</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              FOUR SIGNALS.{' '}
              <span className="text-[#155EEF] block">ONE CLEARER VIEW.</span>
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
              Four physical measurement planes capture the full financial spectrum. Each pillar maintains its independent weight and telemetry, converging into a calibrated underwriting score.
            </p>
          </div>
        </div>

        {/* ── Four Physical Measurement Planes Around Central Score Ring ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {pillars.map((p) => {
            const Icon = p.icon;
            const isHovered = activePillar === p.id;

            return (
              <div
                key={p.id}
                data-depth-z={p.depthZ.toString()}
                data-rotate-x={p.rotX.toString()}
                data-rotate-y={p.rotY.toString()}
                data-scale="0.76"
                data-offset-y="75"
                data-blur="10"
                data-stagger={(p.id * 0.15).toFixed(2)}
                onMouseEnter={() => setActivePillar(p.id)}
                onMouseLeave={() => setActivePillar(null)}
                className={`p-8 rounded-2xl border transition-all duration-300 cursor-pointer space-y-6 flex flex-col justify-between ${
                  isHovered
                    ? 'bg-white border-[#155EEF] shadow-xl shadow-[#155EEF]/15 scale-[1.02]'
                    : 'bg-slate-50/70 border-slate-200/90 hover:bg-white shadow-xs'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#155EEF] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                        {p.category}
                      </span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[#155EEF] text-[10px] font-mono font-bold">
                      {p.weight}
                    </span>
                  </div>

                  {/* Title & Core Metric */}
                  <div>
                    <h3 className="text-xl font-black text-[#071A33] font-sans">
                      {p.title}
                    </h3>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className="text-2xl font-black font-mono text-[#155EEF]">
                        {p.metric}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {p.trend}
                      </span>
                    </div>
                  </div>

                  {/* Sub-Indicators Table */}
                  <div className="p-3.5 rounded-xl bg-white/80 border border-slate-200/70 space-y-2 font-mono text-xs">
                    {p.indicators.map((ind, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px]">{ind.name}</span>
                        <span className="text-[11px] font-bold text-[#071A33]">{ind.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>STATUS: <strong className="text-emerald-700">{p.status}</strong></span>
                  <span className="text-[10px] text-slate-400">ILLUSTRATIVE VALUES</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Convergence Score Bar */}
        <div
          data-depth-z="-950"
          data-rotate-x="20"
          data-scale="0.8"
          data-offset-y="60"
          data-blur="8"
          data-stagger="0.45"
          className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A2540] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 font-bold tracking-wider">
              <span>ILLUSTRATIVE SCORECARD</span>
              <span>•</span>
              <span>COMPOSITE RISK INDEX</span>
            </div>
            <p className="text-sm sm:text-base text-slate-200 font-sans leading-relaxed">
              All four measurement planes converge into an auditable scoring vector calibrated to institutional risk policies.
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 font-mono">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">SYNCHRONIZED SCORE</span>
              <span className="text-3xl font-black text-white">814 / 900</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs uppercase">
              TIER-A APPROVED
            </div>
          </div>
        </div>
      </div>
    </ScrollStage3D>
  );
};
