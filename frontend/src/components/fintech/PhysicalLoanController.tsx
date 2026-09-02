'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
} from 'lucide-react';
import { GoalType } from './GoalSelectorMatrix';

interface Props {
  selectedGoal: GoalType;
}

const PRESET_AMOUNTS = [50000, 100000, 250000, 500000, 1000000, 2000000];

export const PhysicalLoanController: React.FC<Props> = ({ selectedGoal }) => {
  const [amount, setAmount] = useState(250000);
  const [tenure, setTenure] = useState(12);
  const [mode, setMode] = useState<'emi' | 'split3'>('emi');

  // Rates based on selected goal
  const interestRate =
    selectedGoal === 'education'
      ? 9.75
      : selectedGoal === 'personal'
      ? 10.5
      : selectedGoal === 'medical'
      ? 11.0
      : 11.25;

  const isSplit3 = mode === 'split3';
  const effectiveTenure = isSplit3 ? 3 : tenure;
  const annualRate = isSplit3 ? 0 : interestRate;
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
    <section id="calculator" className="relative py-28 bg-gradient-to-b from-[#EAF4FF]/60 via-[#FFFFFF] to-[#EAF4FF]/40 text-[#071A33] overflow-hidden border-t border-[#D3E5FA]/60">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#D3E5FA] text-xs font-mono text-[#155EEF] uppercase tracking-widest mb-4 font-bold shadow-2xs">
            <span>CHAPTER 03 : TACTILE LOAN CONTROL</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#071A33] mb-4">
            Make the numbers fit your life.
          </h2>
          <p className="text-[#526071] text-base sm:text-lg font-medium">
            Drag the controller. Feel the immediate financial impact. Toggle between transparent multi-month EMIs and our 0% 3-month split.
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center justify-center mb-12">
          <div className="inline-flex p-1.5 rounded-2xl bg-white border border-[#D3E5FA] shadow-xs">
            <button
              onClick={() => setMode('emi')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                !isSplit3
                  ? 'bg-[#155EEF] text-white shadow-sm'
                  : 'text-[#526071] hover:text-[#071A33]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Flexible Monthly EMI</span>
            </button>
            <button
              onClick={() => setMode('split3')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                isSplit3
                  ? 'bg-[#155EEF] text-white shadow-sm'
                  : 'text-[#526071] hover:text-[#071A33]'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Split in 3 Months (0% Interest)</span>
            </button>
          </div>
        </div>

        {/* Large Tactile Controller & Real-Time Output */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Physical Sliders & Quick Presets */}
          <div className="lg:col-span-7 rounded-3xl bg-white border border-[#D3E5FA] p-6 sm:p-10 flex flex-col justify-between shadow-md">
            <div>
              {/* Giant Numerical Display */}
              <div className="mb-8">
                <div className="text-xs font-mono uppercase tracking-widest text-[#526071] mb-2 font-semibold">
                  Select Loan Amount
                </div>
                <div className="text-4xl sm:text-6xl font-black font-mono tracking-tight text-[#071A33]">
                  {formatINR(amount)}
                </div>
              </div>

              {/* Slider 1: Amount */}
              <div className="mb-6">
                <input
                  type="range"
                  min={25000}
                  max={2500000}
                  step={5000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
                />
                <div className="flex justify-between text-xs font-mono text-[#526071] mt-2 font-semibold">
                  <span>Min: ₹25,000</span>
                  <span>Max: ₹25,00,000</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap mb-8">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all duration-150 ${
                      amount === preset
                        ? 'bg-[#155EEF] border-[#155EEF] text-white shadow-xs'
                        : 'bg-white border-[#D3E5FA] text-[#071A33] hover:bg-[#EAF4FF]'
                    }`}
                  >
                    {formatINR(preset)}
                  </button>
                ))}
              </div>

              {/* Slider 2: Tenure */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-[#526071] font-semibold">
                    Repayment Tenure
                  </span>
                  <span className="text-xl font-bold font-mono text-[#155EEF]">
                    {effectiveTenure} Months
                  </span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={36}
                  step={1}
                  value={effectiveTenure}
                  disabled={isSplit3}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${
                    isSplit3
                      ? 'bg-slate-100 opacity-50 cursor-not-allowed'
                      : 'bg-slate-200 accent-[#155EEF]'
                  }`}
                />
                <div className="flex justify-between text-xs font-mono text-[#526071] mt-2 font-semibold">
                  <span>3 Months</span>
                  {isSplit3 && (
                    <span className="text-[#155EEF] font-bold">
                      Fixed 3-Month 0% Split
                    </span>
                  )}
                  <span>36 Months</span>
                </div>
              </div>
            </div>

            {/* Micro FAQ Trust Pill */}
            <div className="pt-6 border-t border-[#D3E5FA] flex items-center justify-between text-xs text-[#526071] font-medium">
              <span className="flex items-center gap-1.5 text-[#155EEF] font-bold">
                <ShieldCheck className="w-4 h-4" />
                Zero prepayment foreclosure fees
              </span>
              <span>Calculated on reducing monthly balance</span>
            </div>
          </div>

          {/* Right Column: Visual Breakdown & Monthly Impact */}
          <div className="lg:col-span-5 rounded-3xl bg-white border border-[#D3E5FA] p-6 sm:p-10 flex flex-col justify-between shadow-md relative overflow-hidden">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[#526071] font-bold mb-1">
                MONTHLY COMMITMENT
              </div>
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#155EEF] mb-6">
                {formatINR(emi)}
                <span className="text-sm font-bold text-[#526071] ml-2 font-sans">
                  / month
                </span>
              </div>

              {/* Visual Split Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs font-mono text-[#526071] font-bold mb-2">
                  <span>Principal ({principalPercent.toFixed(0)}%)</span>
                  <span>Interest ({interestPercent.toFixed(0)}%)</span>
                </div>
                <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden flex border border-[#D3E5FA]">
                  <div
                    className="h-full bg-[#155EEF] transition-all duration-300"
                    style={{ width: `${principalPercent}%` }}
                  />
                  <div
                    className="h-full bg-[#4EA8FF] transition-all duration-300"
                    style={{ width: `${interestPercent}%` }}
                  />
                </div>
              </div>

              {/* Breakdown Details */}
              <div className="space-y-3 p-5 rounded-2xl bg-[#EAF4FF]/40 border border-[#D3E5FA] text-xs font-medium">
                <div className="flex justify-between text-[#526071]">
                  <span>Sanctioned Principal:</span>
                  <span className="font-bold text-[#071A33] font-mono text-sm">{formatINR(amount)}</span>
                </div>
                <div className="flex justify-between text-[#526071]">
                  <span>Total Interest:</span>
                  <span className="font-bold text-[#071A33] font-mono text-sm">
                    {isSplit3 ? '₹0 (0% Interest)' : formatINR(totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between text-[#526071]">
                  <span>Processing Fee:</span>
                  <span className="font-bold text-[#155EEF] font-mono text-sm">
                    {isSplit3 ? '₹0 (Waived)' : formatINR(processingFee)}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#D3E5FA] flex justify-between text-[#071A33] font-bold">
                  <span>Total Repayment:</span>
                  <span className="font-black text-[#071A33] font-mono text-base">
                    {formatINR(totalRepayment + processingFee)}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct CTA */}
            <div className="mt-8">
              <Link
                href={`/applications?amount=${amount}&tenure=${effectiveTenure}&purpose=${selectedGoal}`}
                className="w-full inline-flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-sm text-white bg-[#155EEF] hover:bg-[#104ec8] transition-all shadow-md shadow-[#155EEF]/20"
              >
                Lock this Path for {selectedGoal.toUpperCase()}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-[11px] text-center text-[#526071] mt-2 font-mono font-medium">
                ⚡ 90-Sec Paperless Approval • Zero Impact on CIBIL Score
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
