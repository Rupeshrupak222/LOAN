'use client';

import React, { useState } from 'react';
import { Layers, GitCommit, ArrowRight, ShieldCheck } from 'lucide-react';

export const StackedPolicyVersions: React.FC = () => {
  const [activeVersion, setActiveVersion] = useState('v2');

  const VERSIONS = [
    {
      id: 'v1',
      version: 'POLICY / v01',
      cap: '40.0%',
      state: 'Standard Retail Policy',
      impact: 'Allows up to 40% DTI. Broadest market approval coverage with balanced risk parameters.',
      outcomeFor37Dti: 'PASS (WITHIN 40%)',
      isPass: true,
    },
    {
      id: 'v2',
      version: 'POLICY / v02',
      cap: '38.0%',
      state: 'Calibrated Risk Tightening',
      impact: 'Tighter 38% boundary. Recommended during macroeconomic contraction to suppress high-leverage defaults.',
      outcomeFor37Dti: 'PASS (MARGINAL)',
      isPass: true,
    },
    {
      id: 'v3',
      version: 'POLICY / v03',
      cap: '35.0%',
      state: 'Super-Prime Conservative',
      impact: 'Stringent 35% cap reserved for prime-tier unsecured credit with zero portfolio tolerance for borderline DTI.',
      outcomeFor37Dti: 'REVIEW TRIGGERED (> 35%)',
      isPass: false,
    },
  ];

  const currentVer = VERSIONS.find((v) => v.id === activeVersion) || VERSIONS[1];

  return (
    <section
      id="section-versions"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 text-left">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>STACKED POLICY VERSION SHEETS</span>
            </span>

            <h2
              className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              POLICY CHANGES. <br />
              <span className="text-slate-400">DECISIONS FOLLOW.</span>
            </h2>
          </div>

          <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
            SIMULATION ONLY • ZERO CODE DEPLOYMENT REQUIRED
          </div>
        </div>

        {/* ── STACKED TRANSPARENT FILM LAYERS ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left">
          {/* Left: 3 Stacked Version Sheets */}
          <div className="md:col-span-6 space-y-4">
            {VERSIONS.map((ver) => {
              const isSelected = activeVersion === ver.id;

              return (
                <div
                  key={ver.id}
                  onMouseEnter={() => setActiveVersion(ver.id)}
                  className={`p-6 border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? 'bg-[#071A33] text-white border-[#071A33] shadow-xl translate-x-2'
                      : 'bg-white text-[#071A33] border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {ver.version}
                    </span>
                    <span className={`text-xl font-black font-mono ${isSelected ? 'text-cyan-400' : 'text-[#155EEF]'}`}>
                      CAP: {ver.cap}
                    </span>
                  </div>

                  <div className="text-base font-bold uppercase mt-2">
                    {ver.state}
                  </div>

                  <p className={`text-xs mt-2 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {ver.impact}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Live Impact Telemetry on Applicant with 37% DTI */}
          <div className="md:col-span-6 p-8 sm:p-10 bg-white border-2 border-slate-900 shadow-xl space-y-6">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
              POLICY SIMULATION FOR APPLICANT AT 37.0% DTI
            </span>

            <div className="space-y-1">
              <div className="text-xs font-mono text-slate-500">ACTIVE POLICY RULESET</div>
              <div className="text-2xl font-black uppercase text-[#071A33]">
                {currentVer.version} ({currentVer.cap} CAP)
              </div>
            </div>

            <div className="p-4 bg-[#F8FAFC] border border-slate-200 space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                SIMULATED DECISION OUTCOME
              </div>
              <div
                className={`text-lg font-black font-mono ${
                  currentVer.isPass ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {currentVer.outcomeFor37Dti}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Hover over different policy sheets to verify how risk adjustments immediately affect boundary approval rates without touching underlying system code.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
