'use client';

import React, { useState } from 'react';
import {
  Store,
  Package,
  ShoppingCart,
  Building2,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Layers,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   InteractiveGrowthExpander — "GROW THE BUSINESS SCENARIO"
   ─────────────────────────────────────────────────────────────
   ▸ Interactive 4-stage business physical expansion:
     1. Store (Single retail outlet)
     2. Store + Warehouse (Inventory scaling)
     3. Store + Warehouse + Orders (Omnichannel fulfillment)
     4. Enterprise Hub (Multi-city logistics)
   ▸ Signature interactive "GROW THE SCENARIO" button.
   ══════════════════════════════════════════════════════════════ */

interface GrowthStage {
  stage: number;
  name: string;
  subtitle: string;
  creditNeed: string;
  turnoverRunrate: string;
  physicalFootprint: string;
  expansionKey: string;
  icon: React.ElementType;
}

const GROWTH_STAGES: GrowthStage[] = [
  {
    stage: 1,
    name: 'Single Retail Outlet',
    subtitle: 'Foundation Stage',
    creditNeed: '₹1,50,000 Working Capital',
    turnoverRunrate: '₹3,00,000 / month',
    physicalFootprint: '1 Storefront · 2 Staff',
    expansionKey: 'Local footfall with cash constraints on supplier minimum order quantities.',
    icon: Store,
  },
  {
    stage: 2,
    name: 'Store + Warehouse Buffer',
    subtitle: 'Inventory Scaling',
    creditNeed: '₹4,50,000 Bulk Procurement',
    turnoverRunrate: '₹10,50,000 / month',
    physicalFootprint: '1 Store + 1 Mini Warehouse · 6 Staff',
    expansionKey: 'Purchasing full pallets directly from factory distributors with 20% margin improvement.',
    icon: Package,
  },
  {
    stage: 3,
    name: 'Omnichannel Logistics Hub',
    subtitle: 'Digital Delivery Fleet',
    creditNeed: '₹9,00,000 Supply Chain Revolver',
    turnoverRunrate: '₹28,00,000 / month',
    physicalFootprint: '2 Stores + Central Hub + 4 Delivery Vans',
    expansionKey: 'Fulfilling online orders with same-day dispatch and automated inventory sync.',
    icon: ShoppingCart,
  },
  {
    stage: 4,
    name: 'Regional Enterprise Hub',
    subtitle: 'Multi-City Footprint',
    creditNeed: '₹20,00,000 Enterprise Line',
    turnoverRunrate: '₹75,00,000 / month',
    physicalFootprint: '5 Retail Outlets + 2 Regional Hubs · 32 Staff',
    expansionKey: 'Multi-state distribution network with revolving liquidity backing continuous invoice turnover.',
    icon: Building2,
  },
];

export const InteractiveGrowthExpander: React.FC = () => {
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(1);
  const current = GROWTH_STAGES[currentStageIdx];
  const Icon = current.icon;

  const handleNextStage = () => {
    setCurrentStageIdx((prev) => (prev + 1) % GROWTH_STAGES.length);
  };

  return (
    <section id="growth-expander" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <TrendingUp className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>SIGNATURE TRANSFORMATION DECK</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Watch a Business Physically Expand
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Activate the growth simulator to observe how strategic working capital scales a single storefront into a regional enterprise.
        </p>
      </div>

      {/* Main Growth Arena */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-12 max-w-[1400px] mx-auto shadow-sm space-y-8 text-left">
        {/* Top Growth Stepper Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold font-mono text-lg shadow-md">
              0{current.stage}
            </div>
            <div>
              <span className="text-xs font-mono font-bold text-[#155EEF] uppercase">GROWTH LEVEL 0{current.stage} OF 04</span>
              <h3 className="text-xl sm:text-2xl font-black text-[#071A33]">{current.name}</h3>
            </div>
          </div>

          <button
            onClick={handleNextStage}
            className="px-6 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-lg shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>GROW THE SCENARIO (Next Stage)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Interactive Level Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GROWTH_STAGES.map((st, idx) => {
            const isPassed = idx <= currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            const StageIcon = st.icon;

            return (
              <button
                key={st.stage}
                onClick={() => setCurrentStageIdx(idx)}
                className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-50 border-[#155EEF] shadow-md ring-2 ring-[#155EEF]/20'
                    : isPassed
                    ? 'bg-slate-50 border-slate-300 text-slate-700'
                    : 'bg-white border-slate-200 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase">Stage 0{st.stage}</span>
                  <StageIcon className={`w-4 h-4 ${isCurrent ? 'text-[#155EEF]' : 'text-slate-400'}`} />
                </div>
                <span className="text-xs font-bold block truncate text-[#071A33]">{st.subtitle}</span>
              </button>
            );
          })}
        </div>

        {/* Spatial Transformation Deck */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-4">
          {/* Left: Growth Blueprint Information */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <h4 className="text-base font-bold text-[#071A33]">Operational Footprint</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{current.expansionKey}</p>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 pt-2 border-t border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Footprint: {current.physicalFootprint}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 font-mono">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Working Capital Need</span>
                <span className="text-lg font-black text-[#155EEF] mt-1 block">{current.creditNeed}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Turnover Runrate</span>
                <span className="text-lg font-black text-emerald-600 mt-1 block">{current.turnoverRunrate}</span>
              </div>
            </div>
          </div>

          {/* Right: Visual 3D Physical Scale Matrix */}
          <div className="lg:col-span-6 p-8 rounded-3xl bg-gradient-to-tr from-[#071A33] to-[#0D2447] text-white flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-mono font-bold text-blue-300 uppercase">PHYSICAL CAPACITY MODEL</span>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                SCALED 0{current.stage}X
              </span>
            </div>

            {/* Dynamic Physical Grid Representation */}
            <div className="my-8 grid grid-cols-3 gap-3">
              {Array.from({ length: current.stage * 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-16 rounded-xl bg-blue-500/20 border border-blue-400/30 flex flex-col items-center justify-center p-2 text-center animate-fade-in"
                >
                  <Icon className="w-5 h-5 text-blue-300 mb-1" />
                  <span className="text-[9px] font-mono text-slate-300">Unit 0{idx + 1}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-white/10 text-slate-400">
              <span>ILLUSTRATIVE SCALING MODEL</span>
              <span className="text-white font-bold">100% Demand-Backed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
