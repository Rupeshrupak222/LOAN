'use client';

import React, { useState } from 'react';
import {
  Building2,
  Layers,
  ArrowUp,
  Activity,
  CheckCircle2,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   TenureArchitecturalTower — "TENURE AS ARCHITECTURE"
   ─────────────────────────────────────────────────────────────
   ▸ Vertical architectural tower representing 30-year horizons.
   ▸ Stacked architectural tiers with amortizing loan dynamics.
   ▸ Interactive tier exploration.
   ══════════════════════════════════════════════════════════════ */

interface TowerFloor {
  yearTier: string;
  floorLabel: string;
  emiImpact: string;
  principalEquityShare: string;
  interestShare: string;
  strategicNote: string;
  color: string;
}

const TOWER_TIERS: TowerFloor[] = [
  {
    yearTier: '10-Year Horizon',
    floorLabel: 'Tier 01 · Compact Amortization',
    emiImpact: '₹74,560 / month (Higher EMI)',
    principalEquityShare: '72% Total Equity Paid Fast',
    interestShare: '₹29.4 Lakhs Total Interest',
    strategicNote: 'Rapid wealth accumulation and earliest debt-free home ownership.',
    color: 'border-blue-400 bg-blue-900/30 text-blue-200',
  },
  {
    yearTier: '15-Year Horizon',
    floorLabel: 'Tier 02 · Balanced Equity Ramp',
    emiImpact: '₹59,190 / month',
    principalEquityShare: '58% Principal Reduced by Yr 8',
    interestShare: '₹46.5 Lakhs Total Interest',
    strategicNote: 'Optimal balance between monthly cash flow buffer and fast principal paydown.',
    color: 'border-indigo-400 bg-indigo-900/30 text-indigo-200',
  },
  {
    yearTier: '20-Year Horizon',
    floorLabel: 'Tier 03 · Standard Architectural Horizon',
    emiImpact: '₹52,070 / month',
    principalEquityShare: 'Steady Equity Accumulation',
    interestShare: '₹64.9 Lakhs Total Interest',
    strategicNote: 'The most popular tenure tier for salaried professionals and growing families.',
    color: 'border-teal-400 bg-teal-900/30 text-teal-200',
  },
  {
    yearTier: '30-Year Horizon',
    floorLabel: 'Tier 04 · Maximum Affordability Anchor',
    emiImpact: '₹46,130 / month (Lowest EMI)',
    principalEquityShare: 'Lowest Monthly Obligation',
    interestShare: 'Long-horizon flexibility',
    strategicNote: 'Minimizes monthly commitment, leaving disposable income for investments and prepayments.',
    color: 'border-emerald-400 bg-emerald-900/30 text-emerald-200',
  },
];

export const TenureArchitecturalTower: React.FC = () => {
  const [activeTierIdx, setActiveTierIdx] = useState<number>(2);
  const activeTier = TOWER_TIERS[activeTierIdx];

  return (
    <section id="tenure-tower" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Building2 className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>TENURE AS ARCHITECTURE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Longer Horizons. Structured Monthly Planning.
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Visualize tenure as an architectural tower. Longer horizons lower monthly commitments, giving your household resilient financial stability.
        </p>
      </div>

      {/* Main Spatial Tower Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto text-left">
        {/* Left: 4 Stacked Architectural Tiers */}
        <div className="lg:col-span-7 space-y-3">
          {TOWER_TIERS.map((tier, idx) => {
            const isSelected = activeTierIdx === idx;
            return (
              <button
                key={tier.yearTier}
                onClick={() => setActiveTierIdx(idx)}
                className={`w-full p-6 rounded-3xl border transition-all text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#155EEF] shadow-xl shadow-blue-500/10 ring-2 ring-[#155EEF]/20 scale-102'
                    : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-600'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-[#155EEF]">
                      {tier.floorLabel}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#071A33]">{tier.yearTier}</h3>
                  <p className="text-xs text-slate-500">{tier.strategicNote}</p>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Estimated EMI</span>
                  <span className="text-base font-mono font-black text-[#155EEF] block">{tier.emiImpact}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Dark Tower Spatial Analysis */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-blue-300 uppercase">
                TOWER HORIZON TELEMETRY
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              OPTIMIZED
            </span>
          </div>

          <div className="space-y-4">
            <h4 className="text-2xl font-black text-white">{activeTier.yearTier}</h4>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              {activeTier.strategicNote}
            </p>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Monthly Cash Flow Impact</span>
                <span className="text-emerald-400 font-bold">{activeTier.emiImpact}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Principal Equity Ramp</span>
                <span className="text-white font-bold">{activeTier.principalEquityShare}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Interest Profile</span>
                <span className="text-blue-300 font-bold">{activeTier.interestShare}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-800 text-slate-400">
            <span>PREPAYMENT POLICY:</span>
            <span className="font-bold text-emerald-400">Zero Charges Anytime</span>
          </div>
        </div>
      </div>
    </section>
  );
};
