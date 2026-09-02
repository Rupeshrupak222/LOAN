'use client';

import React, { useState } from 'react';
import {
  Sliders,
  ShoppingBag,
  ArrowRight,
  Split,
  Calendar,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   InteractiveCheckoutSplitter — "THE CHECKOUT MOMENT"
   ─────────────────────────────────────────────────────────────
   ▸ Interactive Cart Amount Slider (₹3,000 to ₹60,000)
   ▸ Dynamically divides into 3 exact installments:
     - Today: Amount / 3
     - In 30 Days: Amount / 3
     - In 60 Days: Amount / 3
   ▸ Clearly labeled: "Illustrative example"
   ══════════════════════════════════════════════════════════════ */

export const InteractiveCheckoutSplitter: React.FC = () => {
  const [purchaseAmount, setPurchaseAmount] = useState<number>(15000); // Default ₹15,000

  const installmentAmount = Math.round(purchaseAmount / 3);
  const remainder = purchaseAmount - installmentAmount * 2; // For exact rounding match

  return (
    <section id="checkout-splitter" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <ShoppingBag className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>CHECKOUT MOMENT SPLITTER</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          At Checkout, Choose How the Purchase Moves
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Adjust the cart value below to observe how the purchase divides smoothly into three equal, interest-free parts.
        </p>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto text-left">
        {/* Left Column: Interactive Amount Controller */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 flex flex-col justify-between space-y-8 shadow-sm">
          {/* Preset Buttons */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Cart Amount Presets</span>
            <div className="grid grid-cols-3 gap-3">
              {[6000, 15000, 30000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setPurchaseAmount(amt)}
                  className={`py-2.5 px-4 rounded-2xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    purchaseAmount === amt
                      ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  ₹{amt.toLocaleString('en-IN')} Cart
                </button>
              ))}
            </div>
          </div>

          {/* Amount Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#071A33]">Cart Purchase Total</span>
              <span className="text-2xl font-mono font-black text-[#155EEF]">
                ₹{purchaseAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <input
              type="range"
              min={3000}
              max={60000}
              step={1000}
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
            />

            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>₹3,000 (Min)</span>
              <span>₹60,000 (Max)</span>
            </div>
          </div>

          {/* 0% Guarantee Pillars */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Interest Rate</span>
              <span className="font-bold text-emerald-600 block mt-0.5">0% (Zero APR)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Processing Fee</span>
              <span className="font-bold text-[#071A33] block mt-0.5">₹0 Surcharge</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Duration</span>
              <span className="font-bold text-[#155EEF] block mt-0.5">90-Day Window</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dark Physical 3-Block Breakdown */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Split className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-blue-300 uppercase">
                3-PART ALLOCATION TELEMETRY
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700">
              ILLUSTRATIVE EXAMPLE
            </span>
          </div>

          {/* 3 Physical Split Cards */}
          <div className="space-y-3 font-mono">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase block">Payment 01 · Today</span>
                <span className="text-xs text-slate-300">Upfront at Checkout</span>
              </div>
              <span className="text-xl font-black text-emerald-400">
                ₹{installmentAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase block">Payment 02 · In 30 Days</span>
                <span className="text-xs text-slate-400">Auto-debited via UPI</span>
              </div>
              <span className="text-xl font-black text-white">
                ₹{installmentAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase block">Payment 03 · In 60 Days</span>
                <span className="text-xs text-slate-400">Final Balance Cleared</span>
              </div>
              <span className="text-xl font-black text-white">
                ₹{remainder.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-800 text-slate-400">
            <span>Total Payable: <strong className="text-white">₹{purchaseAmount.toLocaleString('en-IN')}</strong></span>
            <span className="text-emerald-400 font-bold">100% Interest-Free</span>
          </div>
        </div>
      </div>
    </section>
  );
};
