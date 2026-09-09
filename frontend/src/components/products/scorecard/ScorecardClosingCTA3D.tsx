'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShieldCheck, CheckCircle2, PhoneCall } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const ScorecardClosingCTA3D: React.FC = () => {
  return (
    <ScrollStage3D
      id="scorecard-closing-cta"
      perspective={1500}
      className="py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] select-none relative overflow-hidden text-center"
    >
      {/* Background Volumetric Radiance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[500px] bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent blur-[140px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        {/* Stage 11: Final Transformation Lockup */}
        <div
          data-depth-z="-450"
          data-rotate-x="20"
          data-offset-y="30"
          data-scale="0.85"
          data-blur="4"
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase shadow-xs mx-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>STAGE 11 // FROM SIGNALS TO DECISION</span>
        </div>

        {/* Monumental Closing Headline Coming Forward from Z: -1100px */}
        <div
          data-depth-z="-1100"
          data-rotate-x="35"
          data-offset-y="90"
          data-scale="0.65"
          data-blur="12"
          data-stagger="0.15"
        >
          <h2 className="text-4xl sm:text-6xl lg:text-[76px] font-black text-[#071A33] tracking-tight leading-[1.02] uppercase font-sans">
            MAKE BETTER{' '}
            <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-[#0A2540] bg-clip-text text-transparent block mt-1">
              CONTEXT POSSIBLE.
            </span>
          </h2>
        </div>

        {/* Supporting Copy */}
        <div
          data-depth-z="-650"
          data-rotate-y="-5"
          data-offset-y="40"
          data-blur="6"
          data-stagger="0.35"
          className="max-w-2xl mx-auto"
        >
          <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed font-sans">
            Bring financial signals, institutional policy, and underwriting intelligence into one clearer, auditable decision journey. Eliminate guesswork with multi-pillar context.
          </p>
        </div>

        {/* ── Visual Underwriting Seal (Visual Callback to The Financial Portrait) ── */}
        <div
          data-depth-z="-800"
          data-rotate-x="18"
          data-scale="0.85"
          data-offset-y="40"
          data-blur="6"
          data-stagger="0.5"
          className="max-w-md mx-auto p-6 rounded-2xl bg-slate-50 border border-slate-300 shadow-xl text-left space-y-3"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <span className="text-xs font-mono font-bold text-[#071A33]">
              ADYAPAN UNDERWRITING ATTESTATION
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              SYNTHESIZED
            </span>
          </div>

          <div className="flex items-center justify-between font-mono text-xs text-slate-600">
            <span>4-PILLAR CORRELATION:</span>
            <span className="text-[#155EEF] font-bold">100% COMPLETE</span>
          </div>

          <div className="flex items-center justify-between font-mono text-xs text-slate-600">
            <span>DECISION CONFIDENCE:</span>
            <span className="text-emerald-700 font-bold">PRIME SANCTION VERIFIED</span>
          </div>
        </div>

        {/* Action CTAs */}
        <div
          data-depth-z="-450"
          data-rotate-x="15"
          data-offset-y="30"
          data-scale="0.85"
          data-blur="4"
          data-stagger="0.65"
          className="flex flex-wrap items-center justify-center gap-4 pt-4 font-sans"
        >
          <Link
            href="/contact"
            className="px-8 py-4 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer"
          >
            <span>TALK TO ADYAPAN</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/#simulator"
            className="px-7 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>EXPLORE LENDING</span>
          </Link>
        </div>
      </div>
    </ScrollStage3D>
  );
};
