'use client';

import React from 'react';
import { ArrowRight, Check, X, FileSpreadsheet, Sparkles } from 'lucide-react';

export const BeforeAfterTransformation: React.FC = () => {
  const beforeSteps = [
    { label: 'UPLOAD', desc: 'Customer searches for physical scans or PDFs' },
    { label: 'PRINT', desc: 'Manual branch or back-office printouts' },
    { label: 'SCAN', desc: 'Optical re-scanning with OCR errors' },
    { label: 'REVIEW', desc: 'Manual human clerk authenticity checks' },
  ];

  const afterSteps = [
    { label: 'REQUEST', desc: 'Initiate digital document check' },
    { label: 'CONSENT', desc: 'User authorizes authentic document sharing' },
    { label: 'VERIFY', desc: 'Direct digital issuer verification in seconds' },
  ];

  return (
    <section
      id="section-before-after"
      className="py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs">
            <span>TRANSFORMATION</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
            THE DOCUMENT IS DIGITAL.{' '}
            <span className="text-[#155EEF] block">THE TRUST STILL MATTERS.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
            Digital verification can reduce manual document handling by allowing trusted documents to be accessed and verified through supported workflows and user consent.
          </p>
        </div>

        {/* Minimalist Side-by-Side Before / After Line Transformation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Before Column (Heavier visual weight) */}
          <div className="lg:col-span-6 p-8 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-8 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-700">
                  CONVENTIONAL DOCUMENT VERIFICATION
                </span>
              </div>
              <span className="text-[11px] font-mono text-rose-600 font-bold">MANUAL BURDEN</span>
            </div>

            {/* Stepper with Connecting Line */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
              {beforeSteps.map((step, idx) => (
                <div key={idx} className="relative group">
                  <span className="absolute -left-[29px] top-1.5 w-4 h-4 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">
                    <X className="w-2.5 h-2.5 text-slate-500" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold font-mono text-slate-800 tracking-wide">
                      {step.label}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-sans">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
              <span>Average Turnaround: 24–72 Hours</span>
              <span className="font-mono text-rose-600 font-semibold">High Drop-off</span>
            </div>
          </div>

          {/* After Column (Clean, Streamlined, Modern) */}
          <div className="lg:col-span-6 p-8 rounded-2xl bg-blue-50/50 border border-blue-200 shadow-sm space-y-8 text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-blue-200/70">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#071A33]">
                  DIGILOCKER CONSENT-DRIVEN FLOW
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#155EEF] font-bold">DIGITAL PATHWAY</span>
            </div>

            {/* Streamlined Steps with Clean Blue Line */}
            <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-blue-400">
              {afterSteps.map((step, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[29px] top-1.5 w-4 h-4 rounded-full bg-[#155EEF] border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-xs">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold font-mono text-[#071A33] tracking-wide">
                      {step.label}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 font-sans">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-blue-200/70 text-xs text-slate-600 flex items-center justify-between">
              <span>Verification Completion: Under 30 Seconds</span>
              <span className="font-mono text-emerald-600 font-bold">Consent Authenticated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
