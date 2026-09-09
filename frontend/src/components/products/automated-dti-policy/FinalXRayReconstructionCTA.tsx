'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Scan, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const FinalXRayReconstructionCTA: React.FC = () => {
  return (
    <section
      id="section-final-cta"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16 text-center">
        {/* The Fully Resolved Financial X-Ray Document */}
        <div className="p-8 sm:p-12 bg-[#071A33] text-white border-2 border-slate-900 shadow-2xl relative text-left space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-white font-bold uppercase tracking-wider">
                FINAL FINANCIAL X-RAY SPECIFICATION // FULL RESOLUTION
              </span>
            </div>
            <span className="text-cyan-300 uppercase">
              100% SCAN CONVERGED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 py-4">
            <div className="p-4 bg-[#0E2442] border border-slate-700 space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase">INCOME</div>
              <div className="text-lg font-black font-mono text-white">₹80,000</div>
            </div>

            <div className="p-4 bg-[#0E2442] border border-slate-700 space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase">OBLIGATIONS</div>
              <div className="text-lg font-black font-mono text-amber-400">₹18,000</div>
            </div>

            <div className="p-4 bg-[#0E2442] border border-slate-700 space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase">BUREAU</div>
              <div className="text-lg font-black font-mono text-cyan-300">0 OVERDUE</div>
            </div>

            <div className="p-4 bg-[#0E2442] border border-slate-700 space-y-1">
              <div className="text-[10px] font-mono text-slate-400 uppercase">POLICY CAP</div>
              <div className="text-lg font-black font-mono text-white">40.0%</div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-4 bg-emerald-950/60 border border-emerald-400 space-y-1">
              <div className="text-[10px] font-mono text-emerald-400 uppercase">OUTCOME</div>
              <div className="text-lg font-black font-mono text-emerald-300">PASS (33.75%)</div>
            </div>
          </div>
        </div>

        {/* Closing Headline & Narrative */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tighter uppercase leading-[0.98]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            SEE THE SIGNAL. <br />
            CONFIGURE THE POLICY. <br />
            <span className="text-[#155EEF]">CONTROL THE DECISION.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl mx-auto">
            Build lending workflows where every credit decision is consistent, policy-aware, and audit-ready.
          </p>
        </div>

        {/* Closing Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact"
            className="px-9 py-4 bg-[#071A33] hover:bg-black text-white font-mono font-bold text-xs tracking-widest uppercase shadow-xl transition-all flex items-center justify-center gap-2 group"
          >
            <span>EXPLORE ADYAPAN</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/contact"
            className="px-8 py-4 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 font-mono font-bold text-xs tracking-widest uppercase transition-all shadow-xs flex items-center justify-center gap-2"
          >
            <span>TALK TO OUR TEAM</span>
          </Link>
        </div>

        {/* Institutional Footnote */}
        <div className="pt-8 border-t border-slate-200 text-xs font-mono text-slate-400 uppercase tracking-widest">
          ADYAPAN / AUTOMATED DTI POLICY • REAL-TIME BUREAU RULE ENGINE
        </div>
      </div>
    </section>
  );
};
