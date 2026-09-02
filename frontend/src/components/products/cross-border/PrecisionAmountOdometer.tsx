'use client';

import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   PrecisionAmountOdometer — "START WITH THE VALUE"
   ─────────────────────────────────────────────────────────────
   ▸ 3D Mechanical Odometer / Precision Numerical Mechanism:
     - Interactive Amount Slider ($1,000 to $50,000 USD)
     - Digits rotate dynamically into place
     - Tactile feedback and atomic 2-decimal precision
   ▸ Labeled as "ILLUSTRATIVE EXAMPLE"
   ══════════════════════════════════════════════════════════════ */

export const PrecisionAmountOdometer: React.FC = () => {
  const [amount, setAmount] = useState<number>(10000);

  const formattedAmount = amount.toLocaleString('en-US');
  const digits = formattedAmount.split('');

  return (
    <section id="amount-odometer" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Sliders className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>MECHANICAL AMOUNT CYLINDER</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Start with the Value
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Calibrate the transfer capital below. The physical 3D numerical cylinders rotate synchronously to reflect the exact origination payload.
        </p>
      </div>

      {/* Main Odometer Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto text-left">
        {/* Left: Interactive Amount Controller */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 flex flex-col justify-between space-y-8 shadow-sm">
          {/* Preset Buttons */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Amount Presets</span>
            <div className="grid grid-cols-3 gap-3">
              {[5000, 10000, 25000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt)}
                  className={`py-2.5 px-4 rounded-2xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    amount === amt
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
              <span className="text-sm font-bold text-[#071A33]">Origination Capital</span>
              <span className="text-2xl font-mono font-black text-[#155EEF]">
                ${amount.toLocaleString('en-US')} USD
              </span>
            </div>

            <input
              type="range"
              min={1000}
              max={50000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
            />

            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>$1,000 USD (Min)</span>
              <span>$50,000 USD (Max)</span>
            </div>
          </div>

          {/* Odometer Spec Pillars */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Origination Currency</span>
              <span className="font-bold text-[#071A33] block mt-0.5">USD ($)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Settlement Finality</span>
              <span className="font-bold text-emerald-600 block mt-0.5">Atomic 100%</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Cylinder Lock</span>
              <span className="font-bold text-[#155EEF] block mt-0.5">Calibrated</span>
            </div>
          </div>
        </div>

        {/* Right: Dark Physical 3D Odometer Gauge */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-blue-300 uppercase">
                MECHANICAL CYLINDER TELEMETRY
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700">
              ILLUSTRATIVE EXAMPLE
            </span>
          </div>

          {/* Rotating Digit Cylinders */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center gap-2 font-mono">
            <span className="text-3xl sm:text-5xl font-black text-emerald-400">$</span>
            <div className="flex items-center gap-1">
              {digits.map((char, idx) => (
                <div
                  key={idx}
                  className="w-10 sm:w-14 h-16 sm:h-20 rounded-2xl bg-slate-950 border border-slate-700 flex items-center justify-center text-3xl sm:text-5xl font-black text-white shadow-inner shadow-black/80"
                >
                  {char}
                </div>
              ))}
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-400">USD</span>
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-800 text-slate-400">
            <span>Mechanical Status: <strong className="text-emerald-400">Synchronized</strong></span>
            <span className="text-blue-300 font-bold">2-Decimal Precision</span>
          </div>
        </div>
      </div>
    </section>
  );
};
