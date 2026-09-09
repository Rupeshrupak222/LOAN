'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Layers, RefreshCw } from 'lucide-react';
import { CreditCore3D } from './CreditCore3D';

export const FinalCreditCoreCTA: React.FC = () => {
  return (
    <section
      id="section-final-cta"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-gradient-to-b from-white via-[#F8FAFC] to-white text-[#071A33] overflow-hidden select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-blue-500/8 rounded-full blur-[220px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10 text-center">
        {/* The Reconstructed Assembled Credit Core */}
        <div className="flex flex-col items-center justify-center">
          {/* Assembled Layers Pill */}
          <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">AVAILABLE</span>
            <span>+</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">USED</span>
            <span>+</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">REPAYMENT</span>
            <span>+</span>
            <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">PAYMENT</span>
            <span>+</span>
            <span className="bg-blue-50 px-2.5 py-1 rounded border border-blue-200 text-[#155EEF] font-bold">CONTROL</span>
          </div>

          <CreditCore3D
            availableAmount={50000}
            totalLimit={50000}
            usedAmount={0}
            size={380}
            interactiveTilt={true}
          />
        </div>

        {/* Section Headline & Narrative */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <h2
            className="text-4xl sm:text-6xl md:text-7xl font-black text-[#071A33] tracking-tight uppercase leading-[0.98]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            TURN CREDIT <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#00D2FF] bg-clip-text text-transparent">
              INTO A PAYMENT RAIL.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Build payment experiences where available credit is ready when the customer needs it.
          </p>
        </div>

        {/* Closing Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact"
            className="px-9 py-4 rounded-xl bg-[#155EEF] hover:bg-[#004EEB] text-white font-bold text-xs font-mono tracking-widest uppercase shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>EXPLORE ADYAPAN CREDIT INFRASTRUCTURE</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/contact"
            className="px-8 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs font-mono tracking-widest uppercase transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <span>TALK TO OUR TEAM</span>
          </Link>
        </div>

        {/* Institutional System Footnote */}
        <div className="pt-8 border-t border-slate-200/80 text-xs font-mono text-slate-400 uppercase tracking-widest">
          ADYAPAN / CREDIT LINE ON UPI • REVOLVING DIGITAL CREDIT INFRASTRUCTURE
        </div>
      </div>
    </section>
  );
};
