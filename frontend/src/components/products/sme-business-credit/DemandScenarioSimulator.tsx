'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Zap,
  Truck,
  DollarSign,
  BarChart3,
  ArrowRight,
  Activity,
  Sliders,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   DemandScenarioSimulator — "WHEN DEMAND CHANGES"
   ─────────────────────────────────────────────────────────────
   ▸ Interactive 3-mode demand slider/toggle:
     - LOW DEMAND (Baseline maintenance)
     - NORMAL DEMAND (Standard steady growth)
     - HIGH SURGE DEMAND (Peak festive/flash orders)
   ▸ Visual telemetry responds in real-time.
   ▸ Clearly labeled: "SIMULATED STORYTELLING"
   ══════════════════════════════════════════════════════════════ */

type DemandLevel = 'low' | 'normal' | 'high';

interface DemandConfig {
  level: DemandLevel;
  label: string;
  badge: string;
  badgeColor: string;
  orderVelocity: string;
  stockDepletionRate: string;
  creditDrawdown: string;
  revenueRunRate: string;
  cashCycleDays: string;
  description: string;
}

const DEMAND_MODES: Record<DemandLevel, DemandConfig> = {
  low: {
    level: 'low',
    label: 'Low / Off-Season Demand',
    badge: 'Baseline Mode',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    orderVelocity: '35 orders / day',
    stockDepletionRate: '48 days average turnover',
    creditDrawdown: '₹75,000 utilized',
    revenueRunRate: '₹4,50,000 / month',
    cashCycleDays: '45 days',
    description: 'During calm periods, unused credit stays dormant at ₹0 cost. Interest is only incurred on the exact ₹75,000 utilized.',
  },
  normal: {
    level: 'normal',
    label: 'Normal / Steady Demand',
    badge: 'Standard Operation',
    badgeColor: 'bg-blue-100 text-[#155EEF] border-blue-200',
    orderVelocity: '140 orders / day',
    stockDepletionRate: '22 days average turnover',
    creditDrawdown: '₹3,20,000 utilized',
    revenueRunRate: '₹16,80,000 / month',
    cashCycleDays: '28 days',
    description: 'Working capital is drawn down to maintain safety stock and replenished dynamically through weekly merchant payouts.',
  },
  high: {
    level: 'high',
    label: 'High Surge / Festive Demand',
    badge: '3.5x Surge Ingress',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    orderVelocity: '490 orders / day',
    stockDepletionRate: '7 days rapid turnover',
    creditDrawdown: '₹8,50,000 utilized',
    revenueRunRate: '₹54,20,000 / month',
    cashCycleDays: '14 days',
    description: 'High order volume requires instant bulk replenishment. Instant drawdowns prevent stockouts and maximize festive gross revenue.',
  },
};

export const DemandScenarioSimulator: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<DemandLevel>('normal');
  const current = DEMAND_MODES[activeLevel];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>REAL-TIME DEMAND DYNAMICS</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          When Demand Changes, Your Capital Adapts
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Test how the revolving credit line flexes between quiet baseline seasons, standard operations, and high-volume demand surges.
        </p>
      </div>

      {/* 3 Demand Toggle Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-[1400px] mx-auto">
        {(['low', 'normal', 'high'] as DemandLevel[]).map((lvl) => {
          const cfg = DEMAND_MODES[lvl];
          const isSelected = activeLevel === lvl;

          return (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={`p-6 rounded-3xl border transition-all text-left group cursor-pointer ${
                isSelected
                  ? 'bg-white border-[#155EEF] shadow-xl shadow-blue-500/10 scale-102 ring-2 ring-[#155EEF]/20'
                  : 'bg-slate-50 hover:bg-white border-slate-200 hover:border-slate-300 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-full border ${cfg.badgeColor}`}>
                  {cfg.badge}
                </span>
                <Sliders className={`w-4 h-4 ${isSelected ? 'text-[#155EEF]' : 'text-slate-400'}`} />
              </div>
              <h3 className={`text-lg font-bold ${isSelected ? 'text-[#071A33]' : 'text-slate-700'}`}>{cfg.label}</h3>
              <p className="text-xs text-slate-500 mt-2 font-mono">{cfg.orderVelocity}</p>
            </button>
          );
        })}
      </div>

      {/* Main Dynamic Telemetry Showcase Arena */}
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-2xl space-y-8">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">ACTIVE DEMAND SIMULATION</span>
            <h4 className="text-2xl font-black text-white mt-1">{current.label}</h4>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>SIMULATED STORYTELLING</span>
          </div>
        </div>

        {/* 4 Interactive Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Order Velocity</span>
              <ShoppingCart className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xl font-black text-white font-mono">{current.orderVelocity}</span>
            <p className="text-[11px] text-slate-400">Real-time order throughput</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Credit Drawdown</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-black text-emerald-400 font-mono">{current.creditDrawdown}</span>
            <p className="text-[11px] text-slate-400">Utilized out of ₹10,00,000 limit</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Stock Turnover</span>
              <Package className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-black text-white font-mono">{current.stockDepletionRate}</span>
            <p className="text-[11px] text-slate-400">Inventory conversion cycle</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Monthly Inflow</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-xl font-black text-indigo-300 font-mono">{current.revenueRunRate}</span>
            <p className="text-[11px] text-slate-400">Settled gross merchant volume</p>
          </div>
        </div>

        {/* Dynamic Storytelling Banner */}
        <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-900/60 text-sm text-slate-300 flex items-start gap-3">
          <Activity className="w-5 h-5 text-[#155EEF] shrink-0 mt-0.5" />
          <p className="leading-relaxed">{current.description}</p>
        </div>
      </div>
    </section>
  );
};
