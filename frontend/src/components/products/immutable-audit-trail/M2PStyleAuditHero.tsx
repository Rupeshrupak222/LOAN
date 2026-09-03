'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Lock, Activity, Plus, CheckCircle2, ChevronRight } from 'lucide-react';

export const M2PStyleAuditHero: React.FC = () => {
  const [chainBlocks, setChainBlocks] = useState([
    { id: '#00182', name: 'KYC_ATTESTED', time: '12:40:02 UTC', fp: 'E8F1 112C', status: 'SEALED' },
    { id: '#00183', name: 'DTI_SANCTION_COMMITTED', time: '12:40:55 UTC', fp: '9C3A 667F', status: 'SEALED' },
    { id: '#00184', name: 'PAYMENT_RECORDED', time: '12:41:08 UTC', fp: '72C1 19F4', status: 'SEALED' },
  ]);

  const [isAppending, setIsAppending] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleAppendLive = () => {
    if (isAppending) return;
    setIsAppending(true);
    setToastMsg('Ingesting transaction payload & calculating SHA-256 Merkle root...');

    setTimeout(() => {
      const nextNum = chainBlocks.length + 182;
      const newBlock = {
        id: `#00${nextNum}`,
        name: 'DISBURSAL_CLEARED',
        time: '12:41:48 UTC',
        fp: '4A12 88B1',
        status: 'SEALED',
      };
      setChainBlocks((prev) => [...prev, newBlock]);
      setIsAppending(false);
      setToastMsg(`Block ${newBlock.id} successfully appended to WORM storage with 100% parity.`);
    }, 450);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="hero-audit-infrastructure"
      className="relative py-16 sm:py-20 lg:py-24 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200"
      style={{ contain: 'paint layout' }}
    >
      {/* ── UNIQUE 3D WORM CRYPTOGRAPHIC BLOCK STRATUM BACKGROUND ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Isometric Cryptographic Block Grid */}
        <div
          className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1850px] h-[920px] opacity-35"
          style={{
            transform: 'perspective(850px) rotateX(62deg) translateZ(-40px)',
            backgroundImage: `
              linear-gradient(to right, rgba(16, 185, 129, 0.25) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(21, 94, 239, 0.25) 1px, transparent 1px)
            `,
            backgroundSize: '46px 46px',
            maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
          }}
        />

        {/* Volumetric Cryptographic Security Flares */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-[700px] h-[550px] bg-gradient-to-br from-emerald-500/18 via-teal-400/12 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-10 right-1/3 translate-x-1/2 w-[650px] h-[550px] bg-gradient-to-bl from-blue-600/18 via-indigo-500/12 to-transparent blur-[130px] rounded-full" />

        {/* Floating 3D Cryptographic Telemetry Badges */}
        <div className="absolute top-28 left-[6%] px-3 py-1.5 rounded-lg bg-white/85 border border-emerald-200 backdrop-blur-md shadow-md text-[10px] font-mono text-emerald-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>WORM_APPEND_ONLY // 7_YR_REGULATORY_SEAL</span>
        </div>

        <div className="absolute top-40 right-[6%] px-3 py-1.5 rounded-lg bg-white/85 border border-blue-200 backdrop-blur-md shadow-md text-[10px] font-mono text-[#155EEF] font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7s' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>MERKLE_TREE_ROOT // ZERO_TAMPER_DRIFT</span>
        </div>

        {/* Floating Cryptographic Cube Wireframes */}
        <div className="absolute bottom-24 left-[12%] w-8 h-8 border-2 border-emerald-400/50 rotate-45 animate-pulse" />
        <div className="absolute bottom-32 right-[14%] w-7 h-7 border border-blue-400/50 rotate-12 animate-spin" style={{ animationDuration: '20s' }} />
      </div>

      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* ── LEFT COLUMN (55%): HIGH-IMPACT HEADLINE & INFRASTRUCTURE NARRATIVE ── */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#155EEF] border border-blue-200 rounded-full text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
              <span>AI-NATIVE AUDIT INFRASTRUCTURE // WORM COMPLIANCE CORE</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#071A33] tracking-tight leading-[1.08]"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <span className="text-[#155EEF]">AI-Native</span> Infrastructure for <br className="hidden sm:inline" />
              Immutable Financial Ledgers
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl font-sans">
              Power Banking, Lending, and Payments on a unified, append-only audit core designed for seamless regulatory compliance, zero-mutation non-repudiation, and sub-second forensic traceability.
            </p>

            {/* 3 Institutional Checklist Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>FIPS 140-2 Level 3 HSM</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-[#155EEF] shrink-0" />
                <span>Section 65B Admissibility</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                <Activity className="w-4 h-4 text-cyan-600 shrink-0" />
                <span>Sub-Second Parity Check</span>
              </div>
            </div>

            {/* Dual Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => scrollTo('core-audit-stack')}
                className="px-7 py-3.5 bg-[#155EEF] hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Audit Rails</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <Link
                href="/contact"
                className="px-7 py-3.5 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-semibold text-sm rounded-lg transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <span>Book Technical Review</span>
              </Link>
            </div>

            <div className="text-xs text-slate-500 font-mono pt-2">
              CONNECTED ACROSS 200+ BANKS & NBFC LENDING CHANNELS
            </div>
          </div>

          {/* ── RIGHT COLUMN (45%): DENSE INTERACTIVE CRYPTOGRAPHIC CONSOLE ── */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 bg-[#071A33] text-white border-2 border-slate-800 rounded-xl shadow-2xl space-y-5 font-mono text-left">
              {/* Console Top Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/80 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                  <span className="font-bold text-white uppercase tracking-wider">LIVE AUDIT BUS // WORM ENGINE</span>
                </div>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>SEALED</span>
                </span>
              </div>

              {/* Active Canonical Payload Snapshot */}
              <div className="p-4 bg-[#0A1628] border border-slate-700 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-cyan-300 font-bold">CANONICAL BLOCK #00184</span>
                  <span>12:41:08 UTC</span>
                </div>

                <div className="space-y-1 text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">EVENT_TYPE:</span>
                    <span className="text-white font-bold">PAYMENT_RECORDED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">TRANSACTION_VAL:</span>
                    <span className="text-emerald-400 font-bold">₹4,250.00 (UPI_AUTOPAY)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NPCI_RRN:</span>
                    <span className="text-slate-300">624109844210</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">INITIATING_ACTOR:</span>
                    <span className="text-cyan-300 font-bold">SYSTEM // CLEARING_BUS</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  <span>SHA-256 DIGEST: </span>
                  <span className="text-cyan-300 font-bold">72C1 19F4 4A8C 9E02 ...</span>
                </div>
              </div>

              {/* Continuous Streamed Chain Nodes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="uppercase font-bold">HISTORICAL LINEAGE BLOCKS</span>
                  <button
                    type="button"
                    onClick={handleAppendLive}
                    disabled={isAppending}
                    className="text-[#155EEF] hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors cursor-pointer text-xs disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAppending ? 'Appending...' : 'Append Live Event'}</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {chainBlocks.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 bg-[#0D2039] border border-slate-700/60 rounded flex items-center justify-between text-[11px] hover:border-cyan-400/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">{b.id}</span>
                        <span className="text-slate-200">{b.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                        <span>{b.time}</span>
                        <span className="text-emerald-400 font-bold">✓ {b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Toast message */}
              {toastMsg && (
                <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/60 rounded text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{toastMsg}</span>
                </div>
              )}

              {/* Parity Footer */}
              <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>MERKLE CONSISTENCY: <strong className="text-emerald-400">100% PARITY</strong></span>
                <span>DATA MUTABILITY: <strong className="text-cyan-300">0.00%</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
