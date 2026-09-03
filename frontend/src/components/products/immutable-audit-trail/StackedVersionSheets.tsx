'use client';

import React, { useState } from 'react';
import { Layers, FileText, ChevronRight, Scale, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const StackedVersionSheets: React.FC = () => {
  const [activeVersionIdx, setActiveVersionIdx] = useState(1);

  const VERSIONS = [
    {
      ver: 'VERSION 01 // GENESIS SPECIFICATION',
      date: '2026-08-01 09:00:00 UTC',
      who: 'CHIEF_RISK_OFFICER & RISK_COMMITTEE',
      boardRef: 'BOARD RESOLUTION BR-2026-08-01',
      changed: 'Initial retail unsecured lending policy deployed. Established baseline 42% DTI ceiling, minimum 700 bureau score threshold, and standard 36-month amortizing term structure.',
      ref: 'EVENT #000001 → #000098',
      hash: 'sha256:1a8f9c0e2b4d6...7710a',
    },
    {
      ver: 'VERSION 02 // RISK-CALIBRATION REVISION',
      date: '2026-08-15 14:22:18 UTC',
      who: 'CREDIT_RISK_COMMITTEE_CHAIR',
      boardRef: 'CIRCULAR RISK-DIR-2026-02',
      changed: 'Calibrated DTI risk boundary down to 40.0% to insulate loan book from macroeconomic inflationary pressures. Mandated automated bureau tradeline deduplication across all incoming applications.',
      ref: 'EVENT #000099 → #000150',
      hash: 'sha256:4b9e120df39a8...8821b',
    },
    {
      ver: 'VERSION 03 // UPI CREDIT LINE AMENDMENT',
      date: '2026-09-01 10:15:33 UTC',
      who: 'HEAD_OF_DIGITAL_LENDING & CHIEF_COMPLIANCE_OFFICER',
      boardRef: 'PRODUCT NOTE ADY-PL-UPI-2026',
      changed: 'Integrated real-time UPI AutoPay mandate failure audit tripwires into immediate credit line limit scoring. Enabled sub-second dynamic drawdown authorizations over NPCI switch rails.',
      ref: 'EVENT #000151 → #000184',
      hash: 'sha256:7c0d12e84ac42...9932c',
    },
    {
      ver: 'VERSION 04 // CO-LENDING REGULATORY HARMONIZATION',
      date: 'STAGED DEPLOYMENT DRAFT',
      who: 'EXECUTIVE_CREDIT_COUNCIL',
      boardRef: 'PENDING BOARD ATTESTATION',
      changed: 'Proposed multi-bank co-lending exposure allocation policy (80:20 risk participation) per RBI co-lending framework. Incorporates dual-signatory escrow accounts and synchronized audit exports.',
      ref: 'RESERVED EVENT #000185 → #000250',
      hash: 'sha256:PENDING_CRYPTO_SIGNATURE',
    },
  ];

  return (
    <section
      id="section-version-sheets"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-left space-y-3 pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>POLICY & REGULATORY GOVERNANCE VERSIONING</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            EVERY CHANGE <br />
            <span className="text-[#155EEF]">HAS A VERSION.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
            Policy rules, DTI thresholds, risk scorecards, and credit delegation matrices are themselves committed as immutable audit records. Trace exactly which version of a credit policy was in force when any historic loan was sanctioned.
          </p>
        </div>

        {/* ── STACKED PHYSICAL DOCUMENT SHEETS ── */}
        <div className="space-y-4 font-mono text-left">
          {VERSIONS.map((v, idx) => {
            const isSelected = activeVersionIdx === idx;

            return (
              <div
                key={v.ver}
                onClick={() => setActiveVersionIdx(idx)}
                className={`p-6 sm:p-8 border-2 transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-[#071A33] text-white border-[#071A33] shadow-2xl translate-x-2'
                    : 'bg-[#F8FAFC] text-[#071A33] border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-300/40 text-xs">
                  <span className="font-black text-base uppercase">{v.ver}</span>
                  <span className={isSelected ? 'text-cyan-300' : 'text-[#155EEF]'}>
                    AUTHORITY: {v.who}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="text-[10px] uppercase text-slate-400">
                    GOVERNANCE REFERENCE: <strong className={isSelected ? 'text-white' : 'text-slate-900'}>{v.boardRef}</strong>
                  </div>

                  <p className={`font-sans leading-relaxed text-xs ${isSelected ? 'text-slate-300' : 'text-slate-700'}`}>
                    {v.changed}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-3 border-t border-slate-300/40">
                    <span>APPLIED RANGE: <strong>{v.ref}</strong></span>
                    <span>TIMESTAMP: <strong>{v.date}</strong></span>
                    <span className="hidden md:inline">SPEC HASH: <code className={isSelected ? 'text-cyan-300' : 'text-slate-700'}>{v.hash.slice(0, 24)}...</code></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
