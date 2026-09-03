'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   MechanicalFxChamber — "THEN THE VALUE CHANGES FORM"
   ─────────────────────────────────────────────────────────────
   ▸ The Hero FX Conversion Chamber:
     - Calibrated Exchange Rate Dial (USD/GBP: 0.7890)
     - Physical multi-layer disc transformation
     - USD markings separate ➔ GBP markings assemble
   ▸ Clearly labeled: "Illustrative mid-market rate"
   ══════════════════════════════════════════════════════════════ */

interface CurrencyPair {
  id: string;
  label: string;
  source: string;
  dest: string;
  rate: number;
  symbol: string;
}

const PAIRS: CurrencyPair[] = [
  { id: 'usd-gbp', label: 'USD / GBP', source: 'USD ($)', dest: 'GBP (£)', rate: 0.7890, symbol: '£' },
  { id: 'usd-eur', label: 'USD / EUR', source: 'USD ($)', dest: 'EUR (€)', rate: 0.9240, symbol: '€' },
  { id: 'usd-inr', label: 'USD / INR', source: 'USD ($)', dest: 'INR (₹)', rate: 83.450, symbol: '₹' },
];

export const MechanicalFxChamber: React.FC = () => {
  const [selectedPairId, setSelectedPairId] = useState<string>('usd-gbp');
  const [inputAmount, setInputAmount] = useState<number>(10000);

  const activePair = PAIRS.find((p) => p.id === selectedPairId) || PAIRS[0];
  const convertedValue = Math.round(inputAmount * activePair.rate);

  return (
    <section id="fx-chamber" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <RotateCcw className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>HERO FX TRANSFORMATION CHAMBER</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Then the Value Changes Form
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          The origination currency disc enters the precision mechanical chamber, decoupling into layered financial markings before reforming as destination liquidity.
        </p>
      </div>

      {/* Currency Pair Selector Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-[1400px] mx-auto text-left">
        {PAIRS.map((pair) => {
          const isSelected = selectedPairId === pair.id;

          return (
            <button
              key={pair.id}
              onClick={() => setSelectedPairId(pair.id)}
              className={`p-6 rounded-3xl border transition-all text-left group cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-xl shadow-blue-500/20 scale-102 ring-2 ring-[#155EEF]/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  Currency Pair
                </span>
                <span className={`text-xs font-mono font-bold ${isSelected ? 'text-emerald-300' : 'text-[#155EEF]'}`}>
                  Mid-Market
                </span>
              </div>
              <h3 className="text-lg font-bold">{pair.label}</h3>
              <p className={`text-xs mt-1 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                1 {pair.source.split(' ')[0]} = {pair.rate} {pair.dest.split(' ')[0]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Chamber Transformation Stage */}
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-2xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">PRECISION CHAMBER CALIBRATION</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">{activePair.label} Mechanical Transformation</h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 self-start sm:self-auto">
            Zero-Spread Spot Rate
          </span>
        </div>

        {/* 2-Side Transformation Chamber Mechanics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
          {/* Source Decoupled Disc */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Source Disc (Decoupled)</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-white">${inputAmount.toLocaleString('en-US')} USD</span>
              <span className="text-xs text-blue-400">Origination Node</span>
            </div>
            <p className="text-xs text-slate-400">USD atomic layer recedes into chamber backdrop.</p>
          </div>

          {/* Destination Formed Disc */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 space-y-3">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">Destination Disc (Reformed)</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-400">
                {activePair.symbol}{convertedValue.toLocaleString()} {activePair.dest.split(' ')[0]}
              </span>
              <span className="text-xs text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full">Reformed</span>
            </div>
            <p className="text-xs text-slate-300">New destination currency layer locks into alignment.</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-800 text-slate-400">
          <span>Execution Latency: <strong className="text-white">Sub-50ms Synchronous</strong></span>
          <span className="text-emerald-400 font-bold">100% Guaranteed Rate Lock</span>
        </div>
      </div>
    </section>
  );
};
