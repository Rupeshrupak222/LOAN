'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Calendar,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Layers,
} from 'lucide-react';
import { TiltCard } from './TiltCard';
import { Button } from './ui';

export function SliceSplitVisualizer() {
  const [borrowAmount, setBorrowAmount] = useState(45000);
  const [activePlan, setActivePlan] = useState<'split3' | 'flexi6' | 'flexi12'>('split3');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);

  // Month date generator
  const getDueDates = () => {
    const today = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return [1, 2, 3].map((offset) => {
      const d = new Date(today.getFullYear(), today.getMonth() + offset, 5);
      return `05 ${months[d.getMonth()]}`;
    });
  };

  const dueDates = getDueDates();

  const splitAmount = Math.round(borrowAmount / 3);
  const flexi6Amount = Math.round((borrowAmount * 1.05) / 6);
  const flexi12Amount = Math.round((borrowAmount * 1.1) / 12);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSimulatePayout = () => {
    setIsSimulating(true);
    setSimulatedSuccess(false);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulatedSuccess(true);
      setTimeout(() => setSimulatedSuccess(false), 4500);
    }, 1400);
  };

  return (
    <div className="relative mx-auto max-w-[1536px] px-4 sm:px-8 lg:px-12 xl:px-16 py-20">
      {/* Radiant glow */}
      <div className="absolute left-1/2 top-10 -z-10 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" />

      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500/15 to-purple-500/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-brand-700 ring-1 ring-inset ring-brand-500/30">
          <Sparkles className="h-3.5 w-3.5 text-brand-600" /> Signature Feature
        </span>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">
          Split into 3. <span className="bg-brand-gradient bg-clip-text text-transparent">Pay 0% Extra.</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-600">
          Why pay expensive monthly interest? Borrow whatever you need today and split your payback across 3 months with absolutely zero extra charges.
        </p>
      </div>

      {/* Interactive Main Box */}
      <div className="mt-12 mx-auto max-w-6xl rounded-[3rem] border border-slate-200/80 bg-white/90 p-6 sm:p-12 shadow-card backdrop-blur-xl">
        {/* Slider & Controls */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-800">Choose Borrowing Amount</label>
              <span className="text-2xl font-black text-slate-950 bg-brand-50 px-4 py-1 rounded-2xl ring-1 ring-brand-600/20 text-brand-700">
                {formatINR(borrowAmount)}
              </span>
            </div>
            <input
              type="range"
              min={9000}
              max={150000}
              step={3000}
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(Number(e.target.value))}
              className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-brand-600 focus:outline-none"
            />
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
              <span>₹9,000 (Min)</span>
              <span>₹75,000</span>
              <span>₹1,50,000 (Max)</span>
            </div>
          </div>

          {/* Plan Switcher Pills */}
          <div className="flex rounded-2xl bg-slate-100 p-1.5 ring-1 ring-slate-200">
            <button
              onClick={() => setActivePlan('split3')}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all ${
                activePlan === 'split3'
                  ? 'bg-slate-950 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Split in 3 (0% Extra)
            </button>
            <button
              onClick={() => setActivePlan('flexi6')}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all ${
                activePlan === 'flexi6'
                  ? 'bg-slate-950 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              6M Flexi
            </button>
            <button
              onClick={() => setActivePlan('flexi12')}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition-all ${
                activePlan === 'flexi12'
                  ? 'bg-slate-950 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              12M Easy
            </button>
          </div>
        </div>

        {/* 3-Card Animated Split Visualization */}
        {activePlan === 'split3' ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {[1, 2, 3].map((monthIndex) => (
              <TiltCard
                key={monthIndex}
                maxTilt={10}
                perspective={1000}
                scale={1.02}
                glare={true}
                glareOpacity={0.2}
              >
                <div className="relative overflow-hidden rounded-3xl border border-brand-500/30 bg-gradient-to-b from-white via-brand-50/20 to-white p-6 shadow-soft transition-all duration-200 hover:shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 font-black text-xs text-white shadow-md shadow-brand-500/30">
                      0{monthIndex}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 ring-1 ring-emerald-600/20">
                      0% Interest
                    </span>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Installment {monthIndex}</p>
                    <p className="mt-1 text-3xl font-black text-slate-950">{formatINR(splitAmount)}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-brand-600" /> Due Date:
                    </span>
                    <span className="font-extrabold text-slate-800">{dueDates[monthIndex - 1]}</span>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-brand-500/30 bg-slate-950 p-8 text-white shadow-card">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-bold text-brand-300">
                  {activePlan === 'flexi6' ? '6 Months Flexi Plan' : '12 Months Easy Plan'}
                </span>
                <h3 className="mt-3 text-2xl sm:text-3xl font-black text-white">
                  {formatINR(activePlan === 'flexi6' ? flexi6Amount : flexi12Amount)} <span className="text-sm font-normal text-slate-400">/ month</span>
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Total Repaid: {formatINR(activePlan === 'flexi6' ? borrowAmount * 1.05 : borrowAmount * 1.1)} (Zero pre-closure fees)
                </p>
              </div>
              <Button onClick={() => setActivePlan('split3')} variant="secondary" className="text-xs font-bold">
                Switch to 0% Split in 3
              </Button>
            </div>
          </div>
        )}

        {/* Live Instant UPI Disbursal Simulation Action */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 rounded-3xl bg-slate-950 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <Zap className="h-6 w-6 fill-white" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-extrabold text-white">
                Transfer {formatINR(borrowAmount)} Instantly to Bank
              </p>
              <p className="text-xs text-slate-400">
                1.2-second direct transfer via NPCI IMPS / UPI 24x7
              </p>
            </div>
          </div>

          <button
            onClick={handleSimulatePayout}
            disabled={isSimulating}
            className="w-full sm:w-auto shrink-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isSimulating ? (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                Connecting UPI Rails...
              </span>
            ) : simulatedSuccess ? (
              <span className="flex items-center gap-2 font-bold text-slate-950">
                <CheckCircle2 className="h-4 w-4" /> ₹{borrowAmount.toLocaleString()} Sent to GPay!
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4 fill-slate-950" /> Test Instant Transfer
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
