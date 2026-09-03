'use client';

import React, { useState } from 'react';
import {
  Sliders,
  Home,
  Layers,
  TrendingUp,
  DollarSign,
  Activity,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   FinancialBlueprintBuilder — "THE FINANCIAL BLUEPRINT"
   ─────────────────────────────────────────────────────────────
   ▸ Interactive 3D Architectural Mortgage Calculator:
     - Property Value Slider (₹30L - ₹3Cr)
     - Down Payment Ratio (15% - 30%)
     - Tenure Selectors (15, 20, 25, 30 Years)
     - Illustrative Base Rate: 8.5% p.a.
   ▸ Mathematical EMI formula:
     EMI = [P × r × (1+r)^n] / [(1+r)^n - 1]
   ▸ Real-time visual layer telemetry.
   ══════════════════════════════════════════════════════════════ */

export const FinancialBlueprintBuilder: React.FC = () => {
  const [propertyValue, setPropertyValue] = useState<number>(7500000); // 75 Lakhs
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20); // 20%
  const [tenureYears, setTenureYears] = useState<number>(25); // 25 years
  const annualInterestRate = 0.085; // 8.5% illustrative

  // Computations
  const downPaymentAmount = Math.round((propertyValue * downPaymentPercent) / 100);
  const loanPrincipal = propertyValue - downPaymentAmount;

  const monthlyRate = annualInterestRate / 12;
  const totalMonths = tenureYears * 12;

  // EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
  const emiAmount = Math.round(
    (loanPrincipal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );

  const totalRepayment = emiAmount * totalMonths;
  const totalInterest = totalRepayment - loanPrincipal;

  return (
    <section id="financial-blueprint" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>THE FINANCIAL BLUEPRINT</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Attach Financing to the Blueprint
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Calibrate your property valuation, equity contribution, and repayment horizon to see how long-tenure structuring produces manageable monthly payments.
        </p>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto text-left">
        {/* Left Column: Interactive Controls */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 flex flex-col justify-between space-y-8 shadow-sm">
          {/* Property Value Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#071A33]">Estimated Property Value</span>
              <span className="text-xl font-mono font-black text-[#155EEF]">
                ₹{(propertyValue / 100000).toFixed(1)} Lakhs
              </span>
            </div>
            <input
              type="range"
              min={3000000}
              max={30000000}
              step={500000}
              value={propertyValue}
              onChange={(e) => setPropertyValue(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
            />
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>₹30 Lakhs</span>
              <span>₹3.0 Crores</span>
            </div>
          </div>

          {/* Down Payment % Selectors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-700">Down Payment Ratio</span>
              <span className="text-emerald-600 font-bold">
                ₹{(downPaymentAmount / 100000).toFixed(1)} Lakhs ({downPaymentPercent}%)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[15, 20, 30].map((dp) => (
                <button
                  key={dp}
                  onClick={() => setDownPaymentPercent(dp)}
                  className={`py-2.5 px-4 rounded-2xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    downPaymentPercent === dp
                      ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {dp}% Equity
                </button>
              ))}
            </div>
          </div>

          {/* Tenure Selectors */}
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold text-slate-700 block">Loan Tenure Horizon</span>
            <div className="grid grid-cols-4 gap-2">
              {[15, 20, 25, 30].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setTenureYears(yr)}
                  className={`py-2.5 px-3 rounded-2xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                    tenureYears === yr
                      ? 'bg-[#071A33] text-white border-[#071A33] shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {yr} Years
                </button>
              ))}
            </div>
          </div>

          {/* Rate & Sanction Notice */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-mono">
            <span className="text-slate-400">ILLUSTRATIVE BENCHMARK RATE:</span>
            <span className="font-bold text-[#155EEF]">8.50% p.a. (Fixed / Floating)</span>
          </div>
        </div>

        {/* Right Column: Dark Spatial Architectural Layer Breakdown */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-blue-300 uppercase">
                AMORTIZATION BLUEPRINT
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700">
              SIMULATED
            </span>
          </div>

          {/* Big Monthly EMI Highlight Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#155EEF] to-indigo-700 border border-blue-400/40 text-center shadow-lg space-y-1">
            <span className="text-[11px] font-mono font-bold text-blue-100 uppercase tracking-wider">
              Structured Monthly Installment (EMI)
            </span>
            <span className="text-3xl sm:text-4xl font-black text-white font-mono block">
              ₹{emiAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] font-mono text-blue-200 block">
              Calculated for {tenureYears * 12} Monthly Cycles
            </span>
          </div>

          {/* Component Layers */}
          <div className="space-y-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Structural Loan Principal</span>
              <span className="font-bold text-white">₹{loanPrincipal.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Total Interest Over {tenureYears} Yrs</span>
              <span className="font-bold text-blue-300">₹{totalInterest.toLocaleString('en-IN')}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Total Outflow Amount</span>
              <span className="font-bold text-emerald-400">₹{totalRepayment.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-3 font-mono">
            *No prepayment penalty for floating rate home loans. You can make lump-sum principal curtailments at any time.
          </p>
        </div>
      </div>
    </section>
  );
};
