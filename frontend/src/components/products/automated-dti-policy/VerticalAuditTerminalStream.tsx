'use client';

import React, { useState } from 'react';
import { Terminal, ShieldCheck, CheckCircle2, Hash } from 'lucide-react';

export const VerticalAuditTerminalStream: React.FC = () => {
  const RECORDS = [
    { id: 'CASE / SIM-4821', version: 'v2.4', dti: '34.2%', state: 'WITHIN POLICY', time: '12:44:19.082 UTC', digest: 'sha256:4a8c9e120d...f39' },
    { id: 'CASE / SIM-4822', version: 'v2.4', dti: '42.8%', state: 'REVIEW TRIGGERED', time: '12:43:02.441 UTC', digest: 'sha256:7b1f3c909e...d81' },
    { id: 'CASE / SIM-4823', version: 'v2.3', dti: '28.9%', state: 'WITHIN POLICY', time: '12:41:55.190 UTC', digest: 'sha256:9c0d12e84a...c42' },
    { id: 'CASE / SIM-4824', version: 'v2.3', dti: '48.1%', state: 'REFER (HIGH DEBT)', time: '12:39:10.880 UTC', digest: 'sha256:1e2f4a5b6c...a11' },
    { id: 'CASE / SIM-4825', version: 'v2.3', dti: '31.5%', state: 'WITHIN POLICY', time: '12:37:44.201 UTC', digest: 'sha256:3d4e5f6a7b...e90' },
  ];

  return (
    <section
      id="section-audit-stream"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#0A1628] text-white overflow-hidden border-b border-slate-800 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-4xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-800 text-left">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>TERMINAL AUDIT STREAM // COMPLIANCE RECORD</span>
            </span>

            <h2
              className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              THE DECISION <br />
              <span className="text-cyan-400">LEAVES A TRACE.</span>
            </h2>
          </div>

          <div className="text-xs font-mono text-slate-400 uppercase">
            IMMUTABLE SEQUENTIAL LOG
          </div>
        </div>

        {/* ── VERTICAL TERMINAL STREAM READOUT ── */}
        <div className="p-6 sm:p-8 bg-[#071A33] border-2 border-slate-800 space-y-3 font-mono">
          <div className="text-[10px] text-slate-500 uppercase pb-2 border-b border-slate-800">
            RECORD STREAM // REAL-TIME DISPATCH LOG
          </div>

          {RECORDS.map((r) => (
            <div
              key={r.id}
              className="p-4 bg-[#0E2442]/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-cyan-400/50 transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="font-bold text-white">
                  {r.id}
                </span>
                <span className="text-slate-400">
                  {r.version}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-cyan-300 font-bold">
                  DTI: {r.dti}
                </span>

                <span
                  className={`px-2 py-0.5 text-[10px] font-bold ${
                    r.state.includes('WITHIN')
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {r.state}
                </span>

                <span className="text-slate-500 text-[10px] hidden md:inline">
                  {r.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
