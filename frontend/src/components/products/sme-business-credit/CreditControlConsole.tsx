'use client';

import React, { useState } from 'react';
import {
  Sliders,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Zap,
  Activity,
  ShieldCheck,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   CreditControlConsole — "CREDIT CONTROL & UTILIZATION"
   ─────────────────────────────────────────────────────────────
   ▸ Interactive slider for Revolving Line Utilization.
   ▸ Real-time breakdown:
     - Total Credit Limit (₹5,00,000 / ₹10,00,000)
     - Utilized Capital
     - Available Liquidity Buffer
     - Estimated Daily Interest (Only on utilized portion)
   ▸ Clearly labeled: "SIMULATED DATA"
   ══════════════════════════════════════════════════════════════ */

export const CreditControlConsole: React.FC = () => {
  const [sanctionedLimit, setSanctionedLimit] = useState<number>(500000);
  const [utilizedAmount, setUtilizedAmount] = useState<number>(175000);

  const availableBuffer = sanctionedLimit - utilizedAmount;
  const utilizationPercent = Math.round((utilizedAmount / sanctionedLimit) * 100);

  // Illustrative daily interest rate: ~13.5% p.a. -> 0.037% per day
  const annualRate = 0.135;
  const dailyInterest = Math.round((utilizedAmount * annualRate) / 365);
  const monthlyEstimatedCost = dailyInterest * 30;

  return (
    <section id="credit-control" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Sliders className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>REVOLVING LINE CONTROLLER</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Pay Interest Only on What You Draw Down
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Unlike standard term loans, Adyapan SME Business Credit is an active revolving facility. Draw funds when needed, repay when customer cash settles.
        </p>
      </div>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto text-left">
        {/* Left Column: Interactive Sliders & Configuration */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 flex flex-col justify-between space-y-8 shadow-sm">
          {/* Limit Preset Selectors */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Sanctioned Line Limit</span>
            <div className="grid grid-cols-3 gap-3">
              {[250000, 500000, 1000000].map((lim) => (
                <button
                  key={lim}
                  onClick={() => {
                    setSanctionedLimit(lim);
                    if (utilizedAmount > lim) setUtilizedAmount(Math.round(lim * 0.4));
                  }}
                  className={`py-3 px-4 rounded-2xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    sanctionedLimit === lim
                      ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ₹{(lim / 100000).toFixed(lim % 100000 === 0 ? 0 : 1)} Lakh Line
                </button>
              ))}
            </div>
          </div>

          {/* Utilization Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#071A33]">Active Drawdown Amount</span>
              <span className="text-xl font-mono font-black text-[#155EEF]">
                ₹{utilizedAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <input
              type="range"
              min={10000}
              max={sanctionedLimit}
              step={5000}
              value={utilizedAmount}
              onChange={(e) => setUtilizedAmount(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
            />

            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>₹10,000 (Min)</span>
              <span>Utilization: {utilizationPercent}%</span>
              <span>₹{sanctionedLimit.toLocaleString('en-IN')} (Max)</span>
            </div>
          </div>

          {/* 3 Pillars Summary */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Zero Draw Fee</span>
              <span className="font-bold text-emerald-600 block mt-0.5">₹0 Prepayment</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Tenure</span>
              <span className="font-bold text-[#071A33] block mt-0.5">12-Mo Renewable</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Indicative APR</span>
              <span className="font-bold text-[#155EEF] block mt-0.5">13.5% p.a.</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dark Spatial Financial Breakdown */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-blue-300 uppercase">
                INTEREST TELEMETRY
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700">
              SIMULATED DATA
            </span>
          </div>

          {/* Real-Time Mathematical Breakdown */}
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center font-mono">
              <span className="text-xs text-slate-400">Available Liquid Buffer</span>
              <span className="text-lg font-black text-emerald-400">
                ₹{availableBuffer.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center font-mono">
              <span className="text-xs text-slate-400">Estimated Daily Interest</span>
              <span className="text-lg font-black text-blue-300">
                ₹{dailyInterest.toLocaleString('en-IN')} / day
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center font-mono">
              <span className="text-xs text-slate-400">30-Day Holding Cost</span>
              <span className="text-lg font-black text-white">
                ₹{monthlyEstimatedCost.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3 font-mono">
            *Interest is only charged for the exact number of days capital is utilized. Replenished funds immediately stop accruing daily interest.
          </p>
        </div>
      </div>
    </section>
  );
};
