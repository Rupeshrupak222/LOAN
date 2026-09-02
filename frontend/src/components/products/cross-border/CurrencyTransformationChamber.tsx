'use client';

import React, { useState } from 'react';
import {
  RefreshCw,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   CurrencyTransformationChamber — "THE CURRENCY CHAMBER"
   ─────────────────────────────────────────────────────────────
   ▸ Mechanical & Architectural FX Conversion Engine:
     - Input: USD 10,000.00
     - Real-Time Interbank Mid-Market Rate: 0.7890
     - Output: GBP 7,890.00
   ▸ Clear layer separation (Amount ➔ Currency ➔ Rate ➔ Output)
   ▸ Labeled as "Illustrative mid-market simulation"
   ══════════════════════════════════════════════════════════════ */

export const CurrencyTransformationChamber: React.FC = () => {
  const [inputAmountUSD, setInputAmountUSD] = useState<number>(10000);
  const spotRate = 0.789; // USD to GBP illustrative mid-market rate
  const convertedGBP = Math.round(inputAmountUSD * spotRate);

  return (
    <section id="currency-chamber" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <RefreshCw className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>PRECISION FX CONVERSION ENGINE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          The Currency Transformation Chamber
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Inside the treasury chamber, source funds are converted at institutional mid-market rates without hidden spreads or intermediary price markups.
        </p>
      </div>

      {/* Main Conversion Chamber Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto text-left">
        {/* Left: Interactive Input Controller */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 flex flex-col justify-between space-y-8 shadow-sm">
          {/* Preset Buttons */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Transfer Size Presets</span>
            <div className="grid grid-cols-3 gap-3">
              {[5000, 10000, 25000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setInputAmountUSD(amt)}
                  className={`py-2.5 px-4 rounded-2xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    inputAmountUSD === amt
                      ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ${amt.toLocaleString('en-US')} USD
                </button>
              ))}
            </div>
          </div>

          {/* Amount Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#071A33]">Origination USD Value</span>
              <span className="text-2xl font-mono font-black text-[#155EEF]">
                ${inputAmountUSD.toLocaleString('en-US')} USD
              </span>
            </div>

            <input
              type="range"
              min={1000}
              max={50000}
              step={1000}
              value={inputAmountUSD}
              onChange={(e) => setInputAmountUSD(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
            />

            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>$1,000 USD (Min)</span>
              <span>$50,000 USD (Max)</span>
            </div>
          </div>

          {/* FX Mechanism Metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Spot Rate (USD/GBP)</span>
              <span className="font-bold text-[#071A33] block mt-0.5">1 USD = 0.789 GBP</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Treasury Spread</span>
              <span className="font-bold text-emerald-600 block mt-0.5">0.00% Zero-Markup</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Execution Latency</span>
              <span className="font-bold text-[#155EEF] block mt-0.5">Sub-50ms Lock</span>
            </div>
          </div>
        </div>

        {/* Right: Converted Chamber Output */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-blue-300 uppercase">
                DESTINATION TREASURY PAYOUT
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700">
              ILLUSTRATIVE SIMULATION
            </span>
          </div>

          <div className="space-y-4 font-mono">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Source Ingress</span>
                <span className="text-lg font-bold text-white">${inputAmountUSD.toLocaleString('en-US')} USD</span>
              </div>
              <span className="text-xs text-blue-400 font-bold">Origin Node</span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">Settled Output in London</span>
                <span className="text-2xl font-black text-emerald-400">£{convertedGBP.toLocaleString('en-GB')} GBP</span>
              </div>
              <span className="text-xs font-bold text-emerald-300 bg-emerald-900/50 px-2.5 py-1 rounded-full border border-emerald-700">
                100% Guaranteed
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-800 text-slate-400">
            <span>Intermediary Deduction: <strong className="text-emerald-400">£0.00 Fee</strong></span>
            <span className="text-blue-300 font-bold">Direct RTGS Liquidity</span>
          </div>
        </div>
      </div>
    </section>
  );
};
