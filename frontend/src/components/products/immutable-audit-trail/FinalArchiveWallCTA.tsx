'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, ShieldCheck, CheckCircle2, Scale, Database } from 'lucide-react';

export const FinalArchiveWallCTA: React.FC = () => {
  return (
    <section
      id="section-final-cta"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16 text-center">
        {/* The Canonical Re-anchored Record Strip */}
        <div className="p-8 sm:p-12 bg-[#071A33] text-white border-2 border-slate-900 shadow-2xl relative text-left space-y-6 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-white font-bold uppercase tracking-wider">
                CANONICAL FORENSIC RECORD #000184 // PERSISTENT AUDIT STATE
              </span>
            </div>
            <span className="text-emerald-400 font-bold uppercase flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>STATUS: SEALED, HASHED & IMMUTABLE</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="p-4 bg-[#0A1628] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">PREVIOUS ANCESTOR</span>
              <div className="text-base font-black text-slate-300">#000183 (DTI POLICY)</div>
              <div className="text-[10px] text-slate-500">PARENT HASH: 7f9d8a12e443...</div>
            </div>

            <div className="p-4 bg-[#0E2442] border-2 border-cyan-400 space-y-1">
              <span className="text-[10px] text-cyan-400 uppercase font-bold">CURRENT CANONICAL ENTRY</span>
              <div className="text-xl font-black text-cyan-300">#000184 (₹4,250 DISBURSAL)</div>
              <div className="text-[10px] text-cyan-200">DIGEST: 4a8c9e120df3...</div>
            </div>

            <div className="p-4 bg-[#0A1628] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">NEXT SEQUENTIAL SLOT</span>
              <div className="text-base font-black text-slate-300">#000185 (WAITING COMMITS)</div>
              <div className="text-[10px] text-slate-500">AWAITING TRANSACTIONS...</div>
            </div>
          </div>
        </div>

        {/* 3 Core Structural Guarantees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left font-mono text-xs">
          <div className="p-6 bg-[#F8FAFC] border-2 border-slate-900 space-y-2">
            <span className="text-[10px] text-[#155EEF] font-bold uppercase">GUARANTEE 01</span>
            <div className="text-sm font-black text-[#071A33] uppercase">ZERO SILENT MUTATIONS</div>
            <p className="font-sans text-slate-600 text-xs leading-relaxed">
              Relational UPDATE and DELETE commands are fundamentally barred at the hardware storage layer. Every modification requires an explicit compensating record.
            </p>
          </div>

          <div className="p-6 bg-[#F8FAFC] border-2 border-slate-900 space-y-2">
            <span className="text-[10px] text-[#155EEF] font-bold uppercase">GUARANTEE 02</span>
            <div className="text-sm font-black text-[#071A33] uppercase">PROVABLE NON-REPUDIATION</div>
            <p className="font-sans text-slate-600 text-xs leading-relaxed">
              FIPS 140-2 Level 3 HSM digital signatures and mTLS service certificates mathematically prove actor authenticity without exposing private master credentials.
            </p>
          </div>

          <div className="p-6 bg-[#F8FAFC] border-2 border-slate-900 space-y-2">
            <span className="text-[10px] text-[#155EEF] font-bold uppercase">GUARANTEE 03</span>
            <div className="text-sm font-black text-[#071A33] uppercase">INSTANT AUDIT ADMISSIBILITY</div>
            <p className="font-sans text-slate-600 text-xs leading-relaxed">
              Fully aligned with RBI digital lending directives and Section 65B electronic record standards. Third-party auditors can verify integrity in sub-second queries.
            </p>
          </div>
        </div>

        {/* Closing Headline & Narrative */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <h2
            className="text-4xl sm:text-6xl md:text-7xl font-black text-[#071A33] tracking-tighter uppercase leading-[0.96]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            BUILD SYSTEMS <br />
            <span className="text-[#155EEF]">THAT REMEMBER.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto font-sans">
            Financial infrastructure should not suffer from administrative amnesia. Preserve the operational truth behind every credit sanction, disbursement, DTI evaluation, and compliance sign-off with mathematically verifiable, append-only records.
          </p>

          <div className="pt-2 text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
            EVERY EVENT. EVERY CHANGE. EVERY RECORD.
          </div>
        </div>

        {/* Closing Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 font-mono">
          <Link
            href="/contact"
            className="px-9 py-4 bg-[#071A33] hover:bg-black text-white font-bold text-xs tracking-widest uppercase shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>EXPLORE ADYAPAN AUDIT CORE</span>
            <ArrowRight className="w-4 h-4 text-cyan-400 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/contact"
            className="px-8 py-4 bg-white hover:bg-slate-50 border-2 border-slate-900 text-slate-900 font-bold text-xs tracking-widest uppercase transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>TALK TO OUR RISK TEAM</span>
          </Link>
        </div>

        {/* Institutional Footnote */}
        <div className="pt-8 border-t border-slate-200 text-xs font-mono text-slate-400 uppercase tracking-widest">
          ADYAPAN / IMMUTABLE AUDIT TRAIL • APPEND-ONLY REGULATORY LOGS SPECIFICATION v2.4
        </div>
      </div>
    </section>
  );
};
