'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Calculator,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  PieChart,
  Calendar,
  Zap,
  TrendingDown,
  Info,
} from 'lucide-react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
}

export const DirectionSimulator: React.FC<Props> = ({ activeDirection }) => {
  const current = DIRECTIONS[activeDirection];
  const [amount, setAmount] = useState<number>(current.defaultAmount);
  const [tenure, setTenure] = useState<number>(current.defaultTenure);
  const [mode, setMode] = useState<'split3' | 'emi'>('emi');

  // Sync state when direction changes
  React.useEffect(() => {
    setAmount(current.defaultAmount);
    setTenure(current.defaultTenure);
  }, [activeDirection, current.defaultAmount, current.defaultTenure]);

  // Calculations
  const isSplit3 = mode === 'split3';
  const effectiveTenure = isSplit3 ? 3 : tenure;
  const annualRate = isSplit3 ? 0 : current.interestRate;
  const monthlyRate = annualRate / 12 / 100;

  let emi = 0;
  let totalInterest = 0;
  let totalRepayment = amount;

  if (isSplit3) {
    emi = Math.round(amount / 3);
    totalInterest = 0;
    totalRepayment = amount;
  } else {
    if (monthlyRate > 0) {
      emi = Math.round(
        (amount * monthlyRate * Math.pow(1 + monthlyRate, effectiveTenure)) /
          (Math.pow(1 + monthlyRate, effectiveTenure) - 1)
      );
      totalRepayment = emi * effectiveTenure;
      totalInterest = Math.max(0, totalRepayment - amount);
    } else {
      emi = Math.round(amount / effectiveTenure);
      totalRepayment = amount;
      totalInterest = 0;
    }
  }

  const processingFee = isSplit3 ? 0 : Math.round(amount * 0.0099);
  const principalPercent = totalRepayment > 0 ? (amount / totalRepayment) * 100 : 100;
  const interestPercent = totalRepayment > 0 ? (totalInterest / totalRepayment) * 100 : 0;

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <section id="simulator" className="relative py-24 bg-[#ffffff] text-slate-900 overflow-hidden border-t border-slate-200/80">
      {/* Soft background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -bottom-20 left-1/4 w-[600px] h-[500px] rounded-full blur-[160px] opacity-10 transition-all duration-700"
          style={{ backgroundColor: current.accentHex }}
        />
        <div className="absolute top-10 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Chapter 04 Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-700 uppercase tracking-widest mb-4 font-bold">
            <span>CHAPTER 04 : FINANCIAL REALITY SIMULATOR</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            No confusing numbers.{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(135deg, ${current.accentHex} 0%, #4f46e5 100%)`,
              }}
            >
              Understand every rupee.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            Deconstruct your loan in real time. Compare flexible multi-month tenures with our Slice-style 0% interest 3-month split.
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setMode('emi')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                !isSplit3
                  ? 'bg-white text-slate-900 shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Flexible Monthly EMI</span>
            </button>
            <button
              onClick={() => setMode('split3')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                isSplit3
                  ? 'text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              style={{
                backgroundColor: isSplit3 ? current.accentHex : undefined,
              }}
            >
              <Zap className="w-4 h-4" />
              <span>Split in 3 Months (0% Interest)</span>
            </button>
          </div>
        </div>

        {/* Simulator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Controls Column */}
          <div className="lg:col-span-7 rounded-3xl bg-slate-50 border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div>
              {/* Active Direction Banner */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: current.accentHex }}
                  >
                    <current.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                      Tailored for:
                    </span>
                    <div className="text-base font-black text-slate-900">
                      {current.shortTitle}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                  {isSplit3 ? '0% Extra APR' : `Starting ${current.interestRate}% APR`}
                </span>
              </div>

              {/* Slider 1: Loan Amount */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                    Loan Amount
                  </label>
                  <div
                    className="text-2xl sm:text-3xl font-black font-mono"
                    style={{ color: current.accentHex }}
                  >
                    {formatINR(amount)}
                  </div>
                </div>

                <input
                  type="range"
                  min={current.minAmount}
                  max={current.maxAmount}
                  step={5000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700"
                />

                <div className="flex justify-between text-xs font-mono text-slate-500 mt-2 font-semibold">
                  <span>Min: {formatINR(current.minAmount)}</span>
                  <span>Max: {formatINR(current.maxAmount)}</span>
                </div>
              </div>

              {/* Slider 2: Tenure */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-700 font-bold">
                    Repayment Tenure
                  </label>
                  <div className="text-2xl font-black font-mono text-slate-900">
                    {effectiveTenure} Months
                  </div>
                </div>

                <input
                  type="range"
                  min={current.minTenure}
                  max={current.maxTenure}
                  step={1}
                  value={effectiveTenure}
                  disabled={isSplit3}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${
                    isSplit3
                      ? 'bg-slate-200 opacity-50 cursor-not-allowed'
                      : 'bg-slate-200 accent-indigo-600 hover:accent-indigo-700'
                  }`}
                />

                <div className="flex justify-between text-xs font-mono text-slate-500 mt-2 font-semibold">
                  <span>{current.minTenure} Months</span>
                  {isSplit3 && (
                    <span className="text-amber-700 font-bold">
                      Fixed 3-Month 0% Split
                    </span>
                  )}
                  <span>{current.maxTenure} Months</span>
                </div>
              </div>
            </div>

            {/* Micro FAQ pill */}
            <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Zero prepayment / foreclosure penalties
              </span>
              <span>Calculated on reducing balance</span>
            </div>
          </div>

          {/* Breakdown Card Column */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between shadow-card relative overflow-hidden">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-slate-500 font-bold mb-1">
                MONTHLY COMMITMENT
              </div>
              <div
                className="text-4xl sm:text-5xl font-black font-mono tracking-tight mb-4"
                style={{ color: current.accentHex }}
              >
                {formatINR(emi)}
                <span className="text-sm font-bold text-slate-500 ml-2 font-sans">
                  / month
                </span>
              </div>

              {/* Visual Split Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs font-mono text-slate-600 font-bold mb-2">
                  <span>Principal ({principalPercent.toFixed(0)}%)</span>
                  <span>Interest ({interestPercent.toFixed(0)}%)</span>
                </div>
                <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${principalPercent}%`,
                      backgroundColor: current.accentHex,
                    }}
                  />
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${interestPercent}%` }}
                  />
                </div>
              </div>

              {/* Detailed Numbers Breakdown */}
              <div className="space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Principal Amount:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">{formatINR(amount)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Total Interest:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {isSplit3 ? '₹0 (0% Interest)' : formatINR(totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Processing Fee:</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">
                    {isSplit3 ? '₹0 (Waived)' : formatINR(processingFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between text-slate-900 font-bold">
                  <span>Total Payable:</span>
                  <span className="font-black text-slate-900 font-mono text-base">
                    {formatINR(totalRepayment + processingFee)}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct CTA */}
            <div className="mt-8">
              <Link
                href={`/applications/new?amount=${amount}&tenure=${effectiveTenure}&purpose=${activeDirection}`}
                className="w-full inline-flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-sm text-white transition-all duration-300 hover:brightness-105 active:scale-95 shadow-lg"
                style={{
                  backgroundColor: current.accentHex,
                  boxShadow: `0 10px 24px -4px ${current.accentHex}77`,
                }}
              >
                Lock this Path for {current.label.split(' ')[0]}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-xs text-center text-slate-500 mt-2 font-mono font-medium">
                ⚡ 90-Sec Instant KYC • Zero Impact on CIBIL Score
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
