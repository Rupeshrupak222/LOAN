'use client';

import React, { useState } from 'react';
import { Layers, ArrowRight, Database, FileText, Cpu, Server, ShieldCheck } from 'lucide-react';

export const AuditInfrastructureSchematic: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState(4);

  const STAGES = [
    {
      num: '01',
      title: 'ORIGINATION & INGESTION',
      type: 'DIGITAL CHANNELS',
      desc: 'Mobile SDKs, web portals, and co-lending partner APIs ingest borrower consent, Aadhaar biometric e-KYC payloads, and employment credentials.',
      tech: 'gRPC TLS 1.3 • Edge Ingress • W3C Trace Context',
    },
    {
      num: '02',
      title: 'UNDERWRITING & POLICY CORE',
      type: 'DECISION ENGINE',
      desc: 'Real-time DTI rulebooks, credit bureau normalization pipelines, and fraud tripwires evaluate applicant risk profiles with sub-second determinism.',
      tech: 'Stateless Evaluation • Decision Rulebook Hash • DTI Bounds',
    },
    {
      num: '03',
      title: 'SETTLEMENT & PAYMENTS BUS',
      type: 'CLEARING INTEGRATIONS',
      desc: 'NPCI UPI AutoPay switches, IMPS/NEFT disbursal gateways, and partner bank escrow accounts execute atomic fund movements.',
      tech: 'Idempotency Keys • ISO 20022 Financial Messaging • UMRN',
    },
    {
      num: '04',
      title: 'LOAN SERVICING & RECOVERY',
      type: 'LMS CORE ENGINE',
      desc: 'Calculates continuous daily interest accruals, tracks payment amortizations, manages grace periods, and attests penalty fee waivers.',
      tech: 'Reducing Balance Amortization • Dual-Custody Approval',
    },
    {
      num: '05',
      title: 'IMMUTABLE AUDIT STRATUM',
      type: 'CANONICAL ARCHIVE',
      desc: 'Central event streaming bus feeds dedicated Write-Once-Read-Many (WORM) hardware storage with FIPS 140-2 HSM cryptographic Merkle tree seals.',
      tech: 'Event Sourcing • RFC 3161 Timestamping • WORM Storage',
    },
  ];

  return (
    <section
      id="section-infrastructure-schematic"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-[1400px] mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-left sm:text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <Cpu className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>ENTERPRISE ARCHITECTURAL SCHEMATIC</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            THE RECORD LAYER <br />
            <span className="text-[#155EEF]">BEHIND FINANCIAL SYSTEMS.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            The audit trail is not an afterthought or passive log collector. It is an active, deterministic infrastructure stratum interwoven throughout every phase of the lending lifecycle.
          </p>
        </div>

        {/* ── 5 HORIZONTAL SYSTEM DOCUMENT LAYERS ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative text-left font-mono">
          {STAGES.map((s, idx) => {
            const isSelected = activeLayer === idx;

            return (
              <div
                key={s.num}
                onClick={() => setActiveLayer(idx)}
                className={`p-6 border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[260px] ${
                  isSelected
                    ? 'bg-[#071A33] text-white border-[#071A33] shadow-xl -translate-y-2'
                    : 'bg-[#F8FAFC] text-[#071A33] border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-300/60 text-xs text-slate-400">
                    <span className="font-bold">LAYER {s.num}</span>
                    <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-cyan-400' : 'text-[#155EEF]'}`}>
                      {s.type}
                    </span>
                  </div>

                  <h3
                    className="text-lg font-black uppercase tracking-tight"
                    style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
                  >
                    {s.title}
                  </h3>

                  <p className={`text-xs font-sans leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                    {s.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-300/60 text-[10px] text-slate-400 font-mono">
                  TECH: <strong className={isSelected ? 'text-cyan-300' : 'text-slate-800'}>{s.tech}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
