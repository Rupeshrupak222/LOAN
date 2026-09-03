'use client';

import React, { useState } from 'react';
import { Sliders, RotateCcw, TrendingUp, ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const InteractiveScorecardDemo3D: React.FC = () => {
  const [incomeK, setIncomeK] = useState(145); // ₹145,000
  const [dtiPercent, setDtiPercent] = useState(26); // 26%
  const [creditTier, setCreditTier] = useState<'prime' | 'standard' | 'building'>('prime');
  const [behaviourScore, setBehaviourScore] = useState<'high' | 'moderate' | 'variable'>('high');

  // Dynamic calculated score
  const baseScore = 650;
  const incomeBonus = Math.round((incomeK - 30) * 0.4);
  const dtiPenalty = Math.round((dtiPercent - 20) * 2.5);
  const creditBonus = creditTier === 'prime' ? 90 : creditTier === 'standard' ? 45 : 10;
  const behaviourBonus = behaviourScore === 'high' ? 60 : behaviourScore === 'moderate' ? 30 : 0;

  const totalScore = Math.max(500, Math.min(880, baseScore + incomeBonus - dtiPenalty + creditBonus + behaviourBonus));

  const decisionTier =
    totalScore >= 780 ? 'TIER-A PRIME PRE-APPROVED' : totalScore >= 680 ? 'TIER-B STANDARD UNDERWRITE' : 'TIER-C CONDITIONAL REVIEW';

  const resetValues = () => {
    setIncomeK(145);
    setDtiPercent(26);
    setCreditTier('prime');
    setBehaviourScore('high');
  };

  return (
    <ScrollStage3D
      id="scorecard-interactive-demo"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16 text-left">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
          >
            <span>STAGE 07 // LIVE SANDBOX SIMULATOR</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              RUN THE{' '}
              <span className="text-[#155EEF] block">SCORECARD.</span>
            </h2>
          </div>

          <div
            data-depth-z="-600"
            data-rotate-y="-8"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.2"
          >
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Adjust the fictional applicant signals below to observe how the four-pillar risk engine dynamically recalibrates the composite score and decision tier.
            </p>
          </div>
        </div>

        {/* ── Interactive Simulator Console Grid ── */}
        <div
          data-depth-z="-1000"
          data-rotate-x="20"
          data-scale="0.8"
          data-offset-y="75"
          data-blur="10"
          data-stagger="0.3"
          className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-300 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
        >
          {/* Left Column: Fictional Signal Sliders */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-mono text-xs">
              <span className="font-bold text-[#071A33] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#155EEF]" />
                TELEMETRY CONTROLS
              </span>
              <button
                type="button"
                onClick={resetValues}
                className="text-slate-400 hover:text-[#155EEF] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET DEMO</span>
              </button>
            </div>

            {/* Slider 1: Income */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500 font-bold uppercase">01. MONTHLY INCOME</span>
                <span className="text-[#155EEF] font-bold">₹{incomeK.toLocaleString('en-IN')},000 / Mo</span>
              </div>
              <input
                type="range"
                min="30"
                max="350"
                step="5"
                value={incomeK}
                onChange={(e) => setIncomeK(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
              />
            </div>

            {/* Slider 2: Obligations (DTI) */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-500 font-bold uppercase">02. DEBT-TO-INCOME (DTI)</span>
                <span className={dtiPercent > 45 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'}>
                  {dtiPercent}% FIXED BURDEN
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="65"
                step="1"
                value={dtiPercent}
                onChange={(e) => setDtiPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
              />
            </div>

            {/* Segmented Control 3: Credit Vintage */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase block">
                03. CREDIT PROFILE TRACK RECORD
              </span>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {(['prime', 'standard', 'building'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCreditTier(t)}
                    className={`py-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold uppercase text-[11px] ${
                      creditTier === t
                        ? 'bg-[#155EEF] border-[#155EEF] text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t === 'prime' ? 'PRIME (70+ MO)' : t === 'standard' ? 'STANDARD (36 MO)' : 'NEW (< 12 MO)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Segmented Control 4: Behaviour */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase block">
                04. CASHFLOW LIQUIDITY DYNAMICS
              </span>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {(['high', 'moderate', 'variable'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBehaviourScore(b)}
                    className={`py-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold uppercase text-[11px] ${
                      behaviourScore === b
                        ? 'bg-[#155EEF] border-[#155EEF] text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {b === 'high' ? 'HIGH BUFFER' : b === 'moderate' ? 'MODERATE' : 'VARIABLE'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Live Calibrated Scorecard Result */}
          <div className="lg:col-span-5 p-8 rounded-2xl bg-[#071A33] text-white space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 font-mono text-xs">
                <span className="text-cyan-400 font-bold">SYNTHESIZED EVALUATION</span>
                <span className="text-[10px] text-slate-400">ILLUSTRATIVE SCORE</span>
              </div>

              <div className="text-center py-4 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">
                  CALCULATED SCORE
                </span>
                <div className="text-6xl font-black font-mono text-white tracking-tight">
                  {totalScore}
                </div>
                <span className="text-xs font-mono font-bold text-slate-400 block">
                  SCALE: 300 TO 900
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 border border-white/10 text-center font-mono text-xs font-bold text-cyan-300">
                {decisionTier}
              </div>
            </div>

            <div className="space-y-2 font-mono text-xs text-slate-300 border-t border-slate-800 pt-4">
              <div className="flex justify-between text-[11px]">
                <span>CAPACITY IMPACT:</span>
                <span className="text-emerald-400 font-bold">+{incomeBonus} PTS</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>OBLIGATION PENALTY:</span>
                <span className="text-rose-400 font-bold">-{dtiPenalty} PTS</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>VINTAGE WEIGHT:</span>
                <span className="text-cyan-400 font-bold">+{creditBonus} PTS</span>
              </div>
            </div>

            <p className="text-[10px] font-mono text-slate-400 text-center">
              Demonstration calculator. Does not represent actual Adyapan underwriting credit policies.
            </p>
          </div>
        </div>
      </div>
    </ScrollStage3D>
  );
};
