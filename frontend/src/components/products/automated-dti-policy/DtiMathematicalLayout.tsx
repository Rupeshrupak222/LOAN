'use client';

import React, { useState } from 'react';
import { Calculator, ArrowRight, Divide } from 'lucide-react';

export const DtiMathematicalLayout: React.FC = () => {
  const [income, setIncome] = useState(80000);
  const [obligations, setObligations] = useState(18000);
  const [proposedPayment, setProposedPayment] = useState(9000);

  const totalDebt = obligations + proposedPayment;
  const dti = income > 0 ? Math.round((totalDebt / income) * 10000) / 100 : 0;

  return (
    <section
      id="section-dti-math"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <Calculator className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>EDITORIAL ARITHMETIC ARCHITECTURE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            THE RATIO.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            The core debt-to-income metric derived directly from monthly recurring debt obligations divided against gross verified earnings.
          </p>
        </div>

        {/* ── ICONIC OVERSIZED MATHEMATICAL LAYOUT ── */}
        <div className="p-8 sm:p-14 bg-[#F8FAFC] border-2 border-slate-900 shadow-2xl relative space-y-12">
          {/* Giant DTI Readout */}
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
              COMPUTED RATIO
            </span>

            <div
              className="text-6xl sm:text-8xl md:text-9xl font-black text-[#071A33] tracking-tighter leading-none"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              {dti}%
            </div>

            <div className="text-xs font-mono font-bold text-[#155EEF] uppercase tracking-widest">
              DEBT-TO-INCOME PROPORTION
            </div>
          </div>

          {/* Division Fraction Representation */}
          <div className="max-w-md mx-auto space-y-3 pt-4 border-t-2 border-slate-200">
            {/* Numerator: Total Debt */}
            <div className="flex items-center justify-between font-mono text-sm sm:text-base font-bold text-slate-800">
              <span className="text-slate-400 uppercase text-xs">Total Monthly Debt:</span>
              <span className="text-amber-600">₹{totalDebt.toLocaleString('en-IN')}</span>
            </div>

            {/* Division Line */}
            <div className="h-1 bg-slate-900 w-full" />

            {/* Denominator: Gross Income */}
            <div className="flex items-center justify-between font-mono text-sm sm:text-base font-bold text-slate-800">
              <span className="text-slate-400 uppercase text-xs">Gross Monthly Income:</span>
              <span className="text-[#155EEF]">₹{income.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Interactive Tuning Sliders */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
            {/* Slider 1: Gross Income */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Gross Income:</span>
                <span className="font-bold text-slate-900">₹{income.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="40000"
                max="160000"
                step="5000"
                value={income}
                onChange={(e) => setIncome(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-300 rounded-none appearance-none cursor-pointer accent-[#155EEF]"
                aria-label="Adjust Gross Income"
              />
            </div>

            {/* Slider 2: Obligations */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Existing EMIs:</span>
                <span className="font-bold text-amber-600">₹{obligations.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="5000"
                max="50000"
                step="2000"
                value={obligations}
                onChange={(e) => setObligations(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-300 rounded-none appearance-none cursor-pointer accent-amber-500"
                aria-label="Adjust Existing EMIs"
              />
            </div>

            {/* Slider 3: Proposed Payment */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500">Proposed Loan EMI:</span>
                <span className="font-bold text-cyan-600">₹{proposedPayment.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="30000"
                step="1000"
                value={proposedPayment}
                onChange={(e) => setProposedPayment(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-300 rounded-none appearance-none cursor-pointer accent-cyan-600"
                aria-label="Adjust Proposed Loan EMI"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
