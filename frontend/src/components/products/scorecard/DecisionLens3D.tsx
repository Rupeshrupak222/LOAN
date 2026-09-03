'use client';

import React from 'react';
import { Eye, ArrowRight, ShieldCheck, CheckCircle2, Sliders } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const DecisionLens3D: React.FC = () => {
  return (
    <ScrollStage3D
      id="scorecard-lens"
      perspective={1500}
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
            <span>STAGE 04 // OPTICAL CONTEXT FILTER</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              UNDERWRITING IS{' '}
              <span className="text-[#155EEF] block">ABOUT CONTEXT.</span>
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
              An isolated transaction says very little. Viewed through our decision lens, each payment, obligation, and liquidity buffer is evaluated against the applicant's lifecycle context.
            </p>
          </div>
        </div>

        {/* ── 3D Circular Transparent Decision Lens Stage ── */}
        <div
          data-depth-z="-950"
          data-rotate-x="22"
          data-offset-y="70"
          data-blur="10"
          data-stagger="0.3"
          className="p-8 sm:p-12 rounded-3xl bg-slate-50 border border-slate-300 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative overflow-hidden"
        >
          {/* Left Ingress: Raw Signals */}
          <div className="lg:col-span-4 space-y-3 font-mono text-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              INGRESS // BEFORE LENS
            </span>
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs">
              <span className="text-xs font-bold text-[#071A33] font-sans block">
                UNSTRUCTURED TELEMETRY
              </span>
              <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                Raw account aggregator statements, disparate bureau tradelines, and payment event timestamps.
              </p>
              <div className="pt-2 text-[10px] text-amber-700 font-bold">
                • HIGH NOISE RATIO
              </div>
            </div>
          </div>

          {/* Center: The Decision Lens (Circular Transparent Optical Metaphor) */}
          <div className="lg:col-span-4 flex items-center justify-center relative py-6">
            <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-blue-400/40 bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-cyan-400/10 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center p-6 text-center space-y-2 relative group hover:scale-105 transition-transform">
              <div className="w-12 h-12 rounded-2xl bg-[#155EEF] text-white flex items-center justify-center shadow-lg shadow-[#155EEF]/30">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-black text-[#071A33] uppercase tracking-wider block">
                DECISION LENS
              </span>
              <p className="text-[10px] font-mono text-slate-600 leading-tight">
                CORRELATING SIGNALS WITH INSTITUTIONAL RISK POLICIES
              </p>
              <div className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#155EEF] font-mono font-bold text-[9px]">
                CALIBRATED REFRACTION
              </div>
            </div>
          </div>

          {/* Right Egress: Evaluated Underwriting View */}
          <div className="lg:col-span-4 space-y-3 font-mono text-xs">
            <span className="text-[10px] font-bold text-[#155EEF] uppercase tracking-wider block">
              EGRESS // AFTER LENS
            </span>
            <div className="p-4 rounded-xl bg-[#071A33] text-white space-y-2 shadow-lg">
              <span className="text-xs font-bold text-cyan-300 font-sans block">
                STRUCTURED UNDERWRITING CONTEXT
              </span>
              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                Clear affordability margin, verified debt capacity, and policy-aligned eligibility metrics.
              </p>
              <div className="pt-2 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>DECISION CONFIDENCE: HIGH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollStage3D>
  );
};
