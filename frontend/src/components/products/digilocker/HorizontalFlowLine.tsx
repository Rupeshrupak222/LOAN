'use client';

import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, Layers, Sparkles } from 'lucide-react';

interface Stage {
  number: string;
  name: string;
  label: string;
  summary: string;
  detail: string;
}

const STAGES: Stage[] = [
  {
    number: '01',
    name: 'REQUEST',
    label: 'INITIATION',
    summary: 'Organization creates a digital document verification request with specified document attributes.',
    detail: 'Verification parameters, document types, and requested fields are defined without demanding physical scans.',
  },
  {
    number: '02',
    name: 'CONSENT',
    label: 'AUTHORIZATION',
    summary: 'Customer reviews the requester identity, requested documents, and explicit purpose.',
    detail: 'User explicitly accepts or declines access in a transparent, statutory consent-driven window.',
  },
  {
    number: '03',
    name: 'FETCH',
    label: 'RETRIEVAL',
    summary: 'Authentic digital document is securely accessed from the digital issuer ecosystem.',
    detail: 'Document is retrieved directly from government or certified digital issuers with cryptographic signatures.',
  },
  {
    number: '04',
    name: 'VERIFY',
    label: 'AUTHENTICATION',
    summary: 'Payload schema, digital signatures, and timestamp attestation are validated.',
    detail: 'Automated cryptographic check confirms the document has not been altered or tampered with.',
  },
  {
    number: '05',
    name: 'CONTINUE',
    label: 'ONBOARDING',
    summary: 'Verified identity and document data stream directly into the lending onboarding workflow.',
    detail: 'Loan application advances immediately without back-office document re-entry delays.',
  },
];

export const HorizontalFlowLine: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(1); // Default to stage 2 (Consent)

  const activeStage = STAGES[activeStageIndex];
  const progressPercent = (activeStageIndex / (STAGES.length - 1)) * 100;

  return (
    <section
      id="section-flow"
      className="py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase">
            <span>THE 5-STAGE PIPELINE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
            FROM REQUEST{' '}
            <span className="text-[#155EEF] block">TO VERIFIED.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
            A single, connected digital flow replacing manual photocopying, courier transit, and branch verification with a transparent digital pipeline.
          </p>
        </div>

        {/* ── Single Continuous Horizontal Flow Line Container ── */}
        <div className="relative pt-6 pb-2">
          {/* Base Horizontal Track Line */}
          <div className="absolute top-[38px] left-8 right-8 h-[3px] bg-slate-100 hidden md:block" />

          {/* Active Filled Progress Line */}
          <div
            className="absolute top-[38px] left-8 h-[3px] bg-[#155EEF] transition-all duration-500 ease-out hidden md:block"
            style={{ width: `calc(${progressPercent}% * 0.9 + 20px)` }}
          />

          {/* 5 Numbered Stages */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
            {STAGES.map((stage, idx) => {
              const isActive = activeStageIndex === idx;
              const isCompleted = idx < activeStageIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveStageIndex(idx)}
                  className={`text-left p-5 rounded-2xl transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? 'bg-white border-[#155EEF] shadow-lg shadow-[#155EEF]/10 scale-[1.02]'
                      : 'bg-slate-50/70 border-slate-200/80 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Number Circle indicator */}
                  <div className="flex items-center justify-between pb-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs transition-colors ${
                        isActive
                          ? 'bg-[#155EEF] text-white shadow-xs'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-white border border-slate-200 text-slate-500'
                      }`}
                    >
                      {stage.number}
                    </div>

                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isActive ? 'text-[#155EEF]' : 'text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>

                  {/* Stage Title */}
                  <h3
                    className={`text-base font-black tracking-wide font-sans ${
                      isActive ? 'text-[#071A33]' : 'text-slate-700'
                    }`}
                  >
                    {stage.name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 font-sans line-clamp-2 leading-relaxed">
                    {stage.summary}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Active Stage Deep Inspection Surface ── */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A2540] text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-3 font-mono text-xs text-cyan-400 font-bold tracking-wider">
              <span>STAGE {activeStage.number} // {activeStage.name}</span>
              <span>•</span>
              <span className="text-slate-400">{activeStage.label}</span>
            </div>
            <p className="text-base sm:text-lg font-medium text-slate-200 font-sans leading-relaxed">
              {activeStage.detail}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveStageIndex((prev) => (prev + 1) % STAGES.length)}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold tracking-wider uppercase border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>NEXT STAGE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
