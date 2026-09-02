'use client';

import React, { useState } from 'react';
import { Sliders, Calculator, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

const TENURES = [3, 6, 12, 18, 24];

export const LoanAmountTenureVisual: React.FC = () => {
  const [amount, setAmount] = useState(75000);
  const [tenure, setTenure] = useState(12);

  // Indicative simulated EMI calculation (illustrative only)
  const indicativeRate = 0.12; // 12% p.a.
  const monthlyRate = indicativeRate / 12;
  const emi = Math.round(
    (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1)
  );
  const totalRepay = emi * tenure;
  const totalInterest = totalRepay - amount;

  return (
    <section id="calculator" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Calculator className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>INTERACTIVE LOAN ESTIMATOR</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Customize Your Amount & Repayment Horizon
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Adjust loan principal and tenure to see simulated monthly installment estimates with zero hidden processing charges.
        </p>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto">
        {/* Left Column: Sliders & Tenure Selector */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 flex flex-col justify-between text-left space-y-6 shadow-sm">
          {/* Amount Slider */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-500 font-bold uppercase">Required Loan Amount</span>
              <span className="text-2xl sm:text-3xl font-black text-[#155EEF] font-mono">
                ₹{amount.toLocaleString('en-IN')}
              </span>
            </div>

            <input
              type="range"
              min={10000}
              max={500000}
              step={5000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Min: ₹10,000</span>
              <span>Max: ₹5,00,000</span>
            </div>
          </div>

          {/* 3D Tenure Buttons */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-mono text-slate-500 font-bold uppercase block">
              Repayment Tenure (Months)
            </span>

            <div className="grid grid-cols-5 gap-2">
              {TENURES.map((t) => {
                const isSelected = tenure === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTenure(t)}
                    className={`py-3 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-md scale-105'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {t}M
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-mono text-[#155EEF] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Zero foreclosure charges after 6 on-time monthly installments</span>
          </div>
        </div>

        {/* Right Column: Simulated EMI Summary Card */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-9 flex flex-col justify-between text-left shadow-2xl space-y-6 font-mono">
          <div>
            <span className="text-[10px] font-bold text-blue-300 uppercase">SIMULATED REPAYMENT BREAKDOWN</span>
            <div className="mt-4">
              <span className="text-xs text-slate-400 block">Estimated Monthly EMI</span>
              <p className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
                ₹{emi.toLocaleString('en-IN')}<span className="text-sm text-slate-400">/mo</span>
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Principal Amount:</span>
              <span className="font-bold text-white">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Tenure Horizon:</span>
              <span className="font-bold text-blue-300">{tenure} Months</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Indicative Interest:</span>
              <span className="font-bold text-emerald-300">₹{totalInterest.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="pt-2 text-[10px] text-slate-500">
            * Illustrative calculator based on indicative 12% p.a. rate. Final terms determined upon partner credit evaluation.
          </div>
        </div>
      </div>
    </section>
  );
};
