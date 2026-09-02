'use client';

import React, { useState } from 'react';
import {
  Factory,
  Package,
  Store,
  Users,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   SupplyToCustomerStream — Working Capital Flow Visualization
   ─────────────────────────────────────────────────────────────
   ▸ Tracks capital through: Supplier → Inventory → Store → Customer
   ▸ Interactive step inspection
   ▸ Clearly marked as "ILLUSTRATIVE FLOW"
   ══════════════════════════════════════════════════════════════ */

interface StageDetail {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  capitalRole: string;
  simulatedAmount: string;
  turnaroundTime: string;
  metrics: { label: string; value: string }[];
}

const FLOW_STAGES: StageDetail[] = [
  {
    id: 'supplier',
    stepNumber: '01',
    title: 'Supplier Procurement',
    subtitle: 'Bulk Purchase Discounts',
    icon: Factory,
    capitalRole: 'Working capital revolver advances payment directly to suppliers at wholesale price tier.',
    simulatedAmount: '₹3,50,000',
    turnaroundTime: 'Instant Disbursal (T+0)',
    metrics: [
      { label: 'Bulk Discount Unlocked', value: '18% Off Unit Price' },
      { label: 'Supplier Terms', value: 'Net-0 Upfront Cash' },
    ],
  },
  {
    id: 'inventory',
    stepNumber: '02',
    title: 'Inventory Stocking',
    subtitle: 'Warehouse Buffer Staging',
    icon: Package,
    capitalRole: 'Raw stock and finished goods staged safely without locking up operational daily cash balances.',
    simulatedAmount: '₹4,85,000',
    turnaroundTime: 'Real-time Stock Valuation',
    metrics: [
      { label: 'Days Sales in Inventory', value: '24 Days Average' },
      { label: 'Stockout Prevention', value: '99.4% Fulfillment' },
    ],
  },
  {
    id: 'store',
    stepNumber: '03',
    title: 'Store & Channel Retail',
    subtitle: 'Omnichannel Merchandising',
    icon: Store,
    capitalRole: 'Goods available across physical retail outlets and digital storefronts to meet consumer demand.',
    simulatedAmount: '₹6,20,000',
    turnaroundTime: 'Daily Gross Run-rate',
    metrics: [
      { label: 'Retail Gross Margin', value: '34.2% Blended' },
      { label: 'Active Sales Points', value: '4 Hubs + Online' },
    ],
  },
  {
    id: 'customer',
    stepNumber: '04',
    title: 'Customer Revenue Collection',
    subtitle: 'Invoice & POS Settlement',
    icon: Users,
    capitalRole: 'Incoming customer receipts flow back to replenish the revolving credit line automatically.',
    simulatedAmount: '₹7,15,000',
    turnaroundTime: 'Sub-second UPI / POS Clearance',
    metrics: [
      { label: 'Net Cash Inflow', value: '+₹2,30,000 Free Cash' },
      { label: 'Revolving Line Status', value: '100% Replenished' },
    ],
  },
];

export const SupplyToCustomerStream: React.FC = () => {
  const [activeStage, setActiveStage] = useState<number>(0);
  const current = FLOW_STAGES[activeStage];
  const Icon = current.icon;

  return (
    <section id="supply-stream" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>WORKING CAPITAL ECOSYSTEM</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          From Supplier Ingress to Customer Settlement
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Trace how revolving credit unlocks inventory velocity and converts operational bottlenecks into cash flow momentum.
        </p>
      </div>

      {/* 4 Interactive Progress Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 max-w-[1400px] mx-auto">
        {FLOW_STAGES.map((st, idx) => {
          const isSelected = activeStage === idx;
          const StageIcon = st.icon;

          return (
            <button
              key={st.id}
              onClick={() => setActiveStage(idx)}
              className={`p-4 rounded-2xl text-left border transition-all text-xs font-mono font-bold cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase opacity-75">Stage {st.stepNumber}</span>
                <StageIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
              </div>
              <span className="truncate block font-bold text-sm">{st.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Spatial Stage Showcase Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto text-left">
        {/* Left Column: Stage Explanation & Capital Dynamics */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200">
                STAGE {current.stepNumber} · {current.subtitle}
              </span>
              <span className="text-xs font-mono text-slate-400">ILLUSTRATIVE FLOW</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-[#071A33] tracking-tight">{current.title}</h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{current.capitalRole}</p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 font-mono">
            {current.metrics.map((m, idx) => (
              <div key={idx}>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{m.label}</span>
                <span className="text-base font-extrabold text-[#071A33] mt-0.5 block">{m.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-mono">
            <span className="text-slate-400">TURNAROUND WINDOW:</span>
            <span className="font-bold text-[#155EEF]">{current.turnaroundTime}</span>
          </div>
        </div>

        {/* Right Column: Dark Spatial Terminal with Simulated Capital River */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-blue-300 uppercase">
                CAPITAL REVOLVER TELEMETRY
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              CYCLE HEALTHY
            </span>
          </div>

          {/* Center Stage Simulated Capital Gauge */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Simulated Stage Allocation</span>
              <span className="text-white font-bold">{current.simulatedAmount}</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#155EEF] via-blue-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${(activeStage + 1) * 25}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
              <span>Stage 01: Procurement</span>
              <span>Stage 04: Settlement</span>
            </div>
          </div>

          {/* Automated Balance Invariant */}
          <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>INTEREST APPLIED:</span>
            </span>
            <span className="font-bold text-emerald-400">Calculated Daily on Utilized Balance Only</span>
          </div>
        </div>
      </div>
    </section>
  );
};
