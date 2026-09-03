'use client';

import React, { useState } from 'react';
import {
  Package,
  Calendar,
  Wrench,
  Clock,
  Building2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   BusinessScenariosMatrix — "5 SPATIAL BUSINESS SCENARIOS"
   ─────────────────────────────────────────────────────────────
   ▸ 5 Practical Enterprise Situations:
     1. Bulk Inventory Purchase (Volume discounts)
     2. Festive Seasonal Surge (High demand buffer)
     3. Equipment & Tooling Upgrade (CapEx acceleration)
     4. 45-Day Invoice Gap (Receivable bridge)
     5. Multi-Branch Expansion (Scaling retail presence)
   ▸ Spatial scene selector that dynamically updates the model.
   ══════════════════════════════════════════════════════════════ */

interface ScenarioItem {
  id: string;
  tag: string;
  title: string;
  challenge: string;
  solution: string;
  drawdownExample: string;
  repaymentTrigger: string;
  icon: React.ElementType;
}

const SCENARIOS: ScenarioItem[] = [
  {
    id: 'bulk-inventory',
    tag: 'PROCUREMENT',
    title: 'Bulk Supplier Inventory Discounts',
    challenge: 'A manufacturer offers a 22% discount if ₹4,00,000 worth of raw materials are paid upfront within 48 hours.',
    solution: 'Draw down from the revolving line instantly to lock in wholesale discounts without draining operational liquidity.',
    drawdownExample: '₹4,00,000 drawdown @ T+0',
    repaymentTrigger: 'Repaid over 45 days as finished goods are sold',
    icon: Package,
  },
  {
    id: 'seasonal-surge',
    tag: 'SEASONALITY',
    title: 'Festive & Peak Order Surge',
    challenge: 'Diwali and festive seasonal sales demand triple standard warehouse buffer stock for 6 weeks.',
    solution: 'Expand working capital line temporarily to stage buffer stock, then settle the line as festive revenues clear.',
    drawdownExample: '₹8,50,000 surge allocation',
    repaymentTrigger: 'Repaid automatically from daily merchant POS settle files',
    icon: Calendar,
  },
  {
    id: 'equipment-upgrade',
    tag: 'PRODUCTIVITY',
    title: 'Machinery & Hardware Modernization',
    challenge: 'Replacing legacy packaging equipment requires ₹3,50,000 to increase daily unit throughput by 40%.',
    solution: 'Deploy capital immediately to install new tooling and begin capturing higher fulfillment margins right away.',
    drawdownExample: '₹3,50,000 equipment advance',
    repaymentTrigger: '12-month equal amortization or bullet clearance',
    icon: Wrench,
  },
  {
    id: 'invoice-gap',
    tag: 'CASH FLOW',
    title: '45-Day Corporate Invoice Gap',
    challenge: 'Enterprise B2B clients operate on Net-45 credit terms while supplier and payroll obligations are due on the 1st.',
    solution: 'Bridge the receivable gap with line credit so payroll and operations proceed seamlessly without delay.',
    drawdownExample: '₹6,00,000 GST invoice bridge',
    repaymentTrigger: 'Lump-sum clearance upon corporate invoice settlement',
    icon: Clock,
  },
  {
    id: 'branch-expansion',
    tag: 'EXPANSION',
    title: 'New Branch / Outlet Launch',
    challenge: 'Securing a high-footfall retail storefront requires rental advances, fixture fit-outs, and initial stocking.',
    solution: 'Finance launch expenses through flexible credit stages, preserving primary equity for marketing and hiring.',
    drawdownExample: '₹12,00,000 multi-tranche facility',
    repaymentTrigger: 'Revolving line renewals based on new store GMV',
    icon: Building2,
  },
];

export const BusinessScenariosMatrix: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('bulk-inventory');
  const current = SCENARIOS.find((s) => s.id === selectedId) || SCENARIOS[0];
  const Icon = current.icon;

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>REAL-WORLD ENTERPRISE SCENARIOS</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Engineered for Real Business Situations
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Explore how enterprise founders deploy Adyapan SME Credit to solve timing gaps, seize inventory discounts, and scale operations.
        </p>
      </div>

      {/* 5 Scenario Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8 max-w-[1400px] mx-auto text-left">
        {SCENARIOS.map((sc) => {
          const isSelected = selectedId === sc.id;
          const ScIcon = sc.icon;

          return (
            <button
              key={sc.id}
              onClick={() => setSelectedId(sc.id)}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[9px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  {sc.tag}
                </span>
                <ScIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <h4 className="text-xs font-bold leading-tight">{sc.title}</h4>
            </button>
          );
        })}
      </div>

      {/* Selected Scenario Showcase Arena */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#155EEF] flex items-center justify-center font-bold">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">{current.tag} USE CASE</span>
              <h3 className="text-xl sm:text-2xl font-black text-[#071A33]">{current.title}</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 self-start sm:self-auto">
            SCENARIO ARCHITECTURE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left: Challenge vs Solution */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-1">
              <span className="text-[10px] font-mono font-bold text-amber-800 uppercase">Operational Challenge</span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{current.challenge}</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/60 space-y-1">
              <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">Credit Solution</span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{current.solution}</p>
            </div>
          </div>

          {/* Right: Financial Execution Strategy */}
          <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Illustrative Drawdown</span>
              <span className="font-bold text-emerald-400">{current.drawdownExample}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Repayment Trigger</span>
              <span className="font-bold text-blue-300 text-right max-w-[240px] truncate">{current.repaymentTrigger}</span>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Preserves enterprise cash balance & avoids equity dilution.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
