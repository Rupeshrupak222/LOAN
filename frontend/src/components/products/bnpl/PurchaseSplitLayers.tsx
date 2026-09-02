'use client';

import React, { useState } from 'react';
import {
  Split,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   PurchaseSplitLayers — "ONE PURCHASE. THREE MOMENTS."
   ─────────────────────────────────────────────────────────────
   ▸ 3 Spatial Connected Payment Layers:
     - 01 TODAY (33.33% at checkout)
     - 02 NEXT MONTH (33.33% on Day 30)
     - 03 FOLLOWING MONTH (33.33% on Day 60)
   ▸ Interactive layer expansion.
   ══════════════════════════════════════════════════════════════ */

interface LayerSlice {
  id: string;
  stageNumber: string;
  timing: string;
  name: string;
  amountShare: string;
  percentage: string;
  status: string;
  settlementMethod: string;
  description: string;
}

const LAYERS: LayerSlice[] = [
  {
    id: 'layer-1',
    stageNumber: '01',
    timing: 'Day 0 · At Merchant Checkout',
    name: 'Initial Checkout Capture',
    amountShare: '₹4,000 (1/3 of ₹12,000)',
    percentage: '33.33%',
    status: 'Instant Authorization',
    settlementMethod: 'UPI / Debit Card / NetBanking',
    description: 'You pay 1/3 at checkout. The merchant receives 100% of the purchase value immediately, and your order dispatches right away.',
  },
  {
    id: 'layer-2',
    stageNumber: '02',
    timing: 'Day 30 · Scheduled Debit',
    name: 'Mid-Cycle Installment',
    amountShare: '₹4,000 (1/3 of ₹12,000)',
    percentage: '33.33%',
    status: 'Automated NACH Clear',
    settlementMethod: 'e-Mandate / UPI AutoPay',
    description: 'Exactly 30 days later, the second installment debits automatically. Zero interest, zero processing surcharges, zero hassle.',
  },
  {
    id: 'layer-3',
    stageNumber: '03',
    timing: 'Day 60 · Final Settlement',
    name: 'Final Closure Payment',
    amountShare: '₹4,000 (1/3 of ₹12,000)',
    percentage: '33.34%',
    status: 'Account Complete & Cleared',
    settlementMethod: 'Automated Clearance',
    description: 'The final 1/3 completes the purchase. Your temporary credit line closes with a perfect on-time repayment history logged.',
  },
];

export const PurchaseSplitLayers: React.FC = () => {
  const [activeLayerId, setActiveLayerId] = useState<string>('layer-1');
  const current = LAYERS.find((l) => l.id === activeLayerId) || LAYERS[0];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Split className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>SPATIAL PAYMENT SLICES</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          One Purchase. Three Moments.
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          The purchase remains whole while the financial obligation distributes evenly across 60 days. Inspect each spatial payment layer below.
        </p>
      </div>

      {/* 3 Interactive Layer Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-[1400px] mx-auto">
        {LAYERS.map((layer) => {
          const isSelected = activeLayerId === layer.id;

          return (
            <button
              key={layer.id}
              onClick={() => setActiveLayerId(layer.id)}
              className={`p-6 rounded-3xl border transition-all text-left group cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-xl shadow-blue-500/20 scale-102 ring-2 ring-[#155EEF]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  Stage {layer.stageNumber}
                </span>
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-300' : 'text-[#155EEF]'}`}>
                  {layer.percentage}
                </span>
              </div>
              <h3 className="text-lg font-bold">{layer.name}</h3>
              <p className={`text-xs mt-1 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                {layer.timing}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Selected Layer Display Arena */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">LAYER SPECIFICATION · {current.timing}</span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#071A33]">{current.name}</h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 self-start sm:self-auto">
            {current.status}
          </span>
        </div>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
          {current.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400">Installment Allocation</span>
            <span className="font-bold text-[#071A33]">{current.amountShare}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between items-center">
            <span className="text-slate-400">Settlement Protocol</span>
            <span className="font-bold text-[#155EEF]">{current.settlementMethod}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-3 border-t border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>No prepayment fees, no processing surcharges, exactly 0% APR.</span>
        </div>
      </div>
    </section>
  );
};
