'use client';

import React from 'react';
import { Layers, ArrowRight, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const CustomerCenteredCompression3D: React.FC = () => {
  return (
    <ScrollStage3D
      id="about-customer-compression"
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
            <span>SECTION 07 // TRANSFORMATION METAPHOR</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              COMPLEXITY SHOULD LIVE{' '}
              <span className="text-[#155EEF] block">BEHIND THE EXPERIENCE.</span>
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
              Borrowers and businesses shouldn't have to navigate disparate banking portals or decipher banking acronyms. Adyapan absorbs regulatory and structural complexity behind a streamlined user interface.
            </p>
          </div>
        </div>

        {/* ── Before / After Comparative Transformation Split ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Complex Legacy Journey (Emerges from Z: -1000px, rotY: -12deg) */}
          <div
            data-depth-z="-1000"
            data-rotate-x="18"
            data-rotate-y="-12"
            data-scale="0.76"
            data-offset-y="70"
            data-blur="10"
            data-stagger="0.2"
            className="lg:col-span-6 p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6 flex flex-col justify-between text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                  TRADITIONAL APPROACH
                </span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>

              <h3 className="text-xl font-black text-[#071A33] font-sans">
                Fragmented Financial Journey
              </h3>

              <div className="space-y-3 font-mono text-xs text-slate-600">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Physical branch visits & paper document submissions</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Disparate manual underwriting reviews across siloes</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Opaque interest rates and hidden processing costs</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Days of uncertainty with zero real-time status visibility</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-rose-600 font-bold border-t border-slate-100 pt-3">
              HIGH FRICTION · UNPREDICTABLE TIMELINES
            </div>
          </div>

          {/* Right Column: Connected Experience (Emerges from Z: -1200px, rotY: 12deg) */}
          <div
            data-depth-z="-1200"
            data-rotate-x="-12"
            data-rotate-y="12"
            data-scale="0.74"
            data-offset-y="80"
            data-blur="10"
            data-stagger="0.35"
            className="lg:col-span-6 p-8 sm:p-10 rounded-3xl bg-blue-50/50 border border-blue-200 shadow-sm space-y-6 flex flex-col justify-between text-left"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-200">
                <span className="text-xs font-mono font-bold text-[#155EEF] uppercase tracking-wider">
                  THE ADYAPAN EXPERIENCE
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              <h3 className="text-xl font-black text-[#071A33] font-sans">
                Connected Single Architecture
              </h3>

              <div className="space-y-3 font-mono text-xs text-slate-700">
                <div className="p-3 rounded-xl bg-white border border-blue-200 flex items-center gap-3 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Instant paperless verification via DigiLocker e-KYC</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-blue-200 flex items-center gap-3 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Sub-second multi-pillar automated underwriting scorecard</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-blue-200 flex items-center gap-3 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>100% transparent statutory disclosures and KFS statements</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-blue-200 flex items-center gap-3 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Real-time loan status with automated instant disbursal</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-emerald-700 font-bold border-t border-blue-200 pt-3">
              ZERO-FRICTION · SYNCHRONIZED CLARITY
            </div>
          </div>
        </div>
      </div>
    </ScrollStage3D>
  );
};
