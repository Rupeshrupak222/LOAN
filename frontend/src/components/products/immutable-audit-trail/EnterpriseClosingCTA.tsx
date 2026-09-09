'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Lock } from 'lucide-react';

export const EnterpriseClosingCTA: React.FC = () => {
  return (
    <section
      id="enterprise-closing-cta"
      className="py-16 sm:py-24 px-4 sm:px-8 lg:px-12 bg-[#071A33] text-white border-b border-slate-800"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-4xl mx-auto space-y-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 rounded-full text-xs font-semibold tracking-wide">
          <Lock className="w-3.5 h-3.5" />
          <span>PRODUCTION-READY FINANCIAL LEDGER</span>
        </div>

        <div className="space-y-4">
          <h2
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Power Your Lending Rails with <br />
            <span className="text-[#155EEF]">Unbreakable Cryptographic Proof</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto font-sans">
            Preserve the operational truth behind every credit sanction, disbursement, DTI evaluation, and compliance sign-off with mathematically verifiable, append-only records.
          </p>
        </div>

        {/* Dual Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            href="/contact"
            className="w-full sm:w-auto px-8 py-4 bg-[#155EEF] hover:bg-blue-600 text-white font-semibold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span>Connect with Risk Solutions Team</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/contact"
            className="w-full sm:w-auto px-8 py-4 bg-[#0A1628] hover:bg-[#0E2442] border border-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Developer API Docs</span>
          </Link>
        </div>

        <div className="pt-8 border-t border-slate-800 text-xs text-slate-400 font-mono flex flex-wrap items-center justify-center gap-6">
          <span>ADYAPAN AUDIT CORE v4.0</span>
          <span>•</span>
          <span>FIPS 140-2 LEVEL 3 HSM</span>
          <span>•</span>
          <span>SECTION 65B READY</span>
          <span>•</span>
          <span>RBI MASTER DIRECTION ALIGNED</span>
        </div>
      </div>
    </section>
  );
};
