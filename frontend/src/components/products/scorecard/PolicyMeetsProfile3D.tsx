'use client';

import React, { useState } from 'react';
import { UserCheck, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const PolicyMeetsProfile3D: React.FC = () => {
  const [selectedState, setSelectedState] = useState<'eligible' | 'review' | 'refer'>('eligible');

  return (
    <ScrollStage3D
      id="scorecard-policy-profile"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
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
            <span>STAGE 06 // DECISION SYNTHESIS</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              INTELLIGENCE{' '}
              <span className="text-[#155EEF] block">MEETS POLICY.</span>
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
              Algorithms do not replace credit policy; they operationalize it. The applicant's multi-signal profile converges with your institution's specific risk guardrails to produce an explainable decision.
            </p>
          </div>
        </div>

        {/* ── Two Converging 3D Layers: Profile vs Policy ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Layer A: Applicant Profile (Emerges from Z: -1000px, rotY: -14deg) */}
          <div
            data-depth-z="-1000"
            data-rotate-x="16"
            data-rotate-y="-14"
            data-scale="0.76"
            data-offset-y="70"
            data-blur="10"
            data-stagger="0.2"
            className="lg:col-span-6 p-8 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                  LAYER 01 // APPLICANT PROFILE
                </span>
                <UserCheck className="w-4 h-4 text-[#155EEF]" />
              </div>

              <h3 className="text-xl font-black text-[#071A33] font-sans">
                Normalized Telemetry Vector
              </h3>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between">
                  <span className="text-slate-500">NET MONTHLY REVENUE:</span>
                  <span className="font-bold text-[#071A33]">₹1,45,000</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between">
                  <span className="text-slate-500">HISTORIC REPAYMENT DPD:</span>
                  <span className="font-bold text-emerald-700">0 INCIDENTS</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex justify-between">
                  <span className="text-slate-500">FIXED OBLIGATION RATIO:</span>
                  <span className="font-bold text-blue-700">26% DTI</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-400 border-t border-slate-200 pt-3">
              APPLICANT SIGNAL MATRIX COMPILED
            </div>
          </div>

          {/* Layer B: Underwriting Policy (Emerges from Z: -1200px, rotY: 14deg) */}
          <div
            data-depth-z="-1200"
            data-rotate-x="-12"
            data-rotate-y="14"
            data-scale="0.74"
            data-offset-y="80"
            data-blur="10"
            data-stagger="0.35"
            className="lg:col-span-6 p-8 rounded-2xl bg-blue-50/50 border border-blue-200 shadow-sm space-y-6 flex flex-col justify-between text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-200">
                <span className="text-xs font-mono font-bold text-[#155EEF] uppercase tracking-wider">
                  LAYER 02 // INSTITUTIONAL POLICY
                </span>
                <ShieldCheck className="w-4 h-4 text-[#155EEF]" />
              </div>

              <h3 className="text-xl font-black text-[#071A33] font-sans">
                Lending Risk Guardrails
              </h3>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-white border border-blue-200 flex justify-between">
                  <span className="text-slate-500">MIN SALARY THRESHOLD:</span>
                  <span className="font-bold text-[#071A33]">₹35,000 / Mo (MET)</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-blue-200 flex justify-between">
                  <span className="text-slate-500">MAX TOLERABLE DTI:</span>
                  <span className="font-bold text-emerald-700">&lt; 50% CEILING (MET)</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-blue-200 flex justify-between">
                  <span className="text-slate-500">BUREAU HARD STOP:</span>
                  <span className="font-bold text-emerald-700">NO 90+ DPD IN 24M (MET)</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500 border-t border-blue-200 pt-3">
              STATUTORY CREDIT POLICY SYNCHRONIZED
            </div>
          </div>
        </div>

        {/* ── Convergence Decision Context Panel (Emerges from Z: -900px) ── */}
        <div
          data-depth-z="-900"
          data-rotate-x="20"
          data-scale="0.82"
          data-offset-y="50"
          data-blur="8"
          data-stagger="0.5"
          className="p-8 rounded-2xl bg-[#071A33] text-white shadow-xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                CONVERGENCE OUTPUT
              </span>
              <h3 className="text-xl font-black font-sans text-white">
                Underwriting Decision Context
              </h3>
            </div>

            {/* Illustrative State Toggles */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setSelectedState('eligible')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedState === 'eligible'
                    ? 'bg-emerald-500 text-white font-bold'
                    : 'bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                ELIGIBLE
              </button>
              <button
                type="button"
                onClick={() => setSelectedState('review')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedState === 'review'
                    ? 'bg-amber-500 text-white font-bold'
                    : 'bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                REVIEW
              </button>
              <button
                type="button"
                onClick={() => setSelectedState('refer')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedState === 'refer'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'bg-white/10 text-slate-400 hover:text-white'
                }`}
              >
                REFER
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-slate-400 text-[10px]">DECISION STATUS:</span>
              <p className="text-lg font-black text-emerald-400 uppercase">
                {selectedState === 'eligible' && 'PRE-SANCTION READY'}
                {selectedState === 'review' && 'DESK REVIEW REQUIRED'}
                {selectedState === 'refer' && 'SENIOR COMMITTEE REFER'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-slate-400 text-[10px]">MAX SANCTION LIMIT:</span>
              <p className="text-lg font-black text-white">
                {selectedState === 'eligible' && '₹15,00,000'}
                {selectedState === 'review' && '₹7,50,000 (CAPPED)'}
                {selectedState === 'refer' && 'HELD FOR COLLATERAL'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
              <span className="text-slate-400 text-[10px]">REPAYMENT TENURE:</span>
              <p className="text-lg font-black text-cyan-300">
                {selectedState === 'eligible' && '36 TO 60 MONTHS'}
                {selectedState === 'review' && '24 MONTHS'}
                {selectedState === 'refer' && 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollStage3D>
  );
};
