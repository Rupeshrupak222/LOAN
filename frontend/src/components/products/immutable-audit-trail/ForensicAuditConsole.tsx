'use client';

import React from 'react';
import { Terminal, ShieldCheck, Activity, Lock, Server, Cpu, Key, Database } from 'lucide-react';

export const ForensicAuditConsole: React.FC = () => {
  return (
    <section
      id="section-forensic-console"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#060F1E] text-white overflow-hidden border-b border-slate-800 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-left space-y-3 pb-6 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest border border-slate-800">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>FORENSIC AUDIT OPERATIONS CONSOLE // ACTIVE TELEMETRY</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            THE AUDIT CONSOLE.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 font-normal max-w-xl">
            A high-density operational dashboard providing real-time telemetry over storage engine health, cryptographic hardware status, and regulatory verification proofs.
          </p>
        </div>

        {/* ── THE TYPOGRAPHY-DRIVEN DARK CONSOLE ── */}
        <div className="p-8 sm:p-12 bg-[#0A1628] border-2 border-slate-800 shadow-2xl space-y-8 font-mono text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2.5 text-cyan-300 font-bold uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>ADYAPAN FORENSIC DAEMON v4.18.2</span>
            </div>
            <div className="text-slate-500 text-[11px] flex items-center gap-3">
              <span>UPTIME: <strong>99.999%</strong></span>
              <span>•</span>
              <span className="text-emerald-400 font-bold">HSM PRIMARY: SIGNING</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="p-4 bg-[#071A33] border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase">DAEMON SUBSYSTEM</span>
              <div className="text-base font-black text-emerald-400">ONLINE // HEALTHY</div>
              <div className="text-[10px] text-slate-400">Zero unsealed partitions</div>
            </div>

            <div className="p-4 bg-[#071A33] border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase">LATEST COMMITTED SEQ</span>
              <div className="text-base font-black text-white">SIM-000184 (PAYMENT)</div>
              <div className="text-[10px] text-slate-400">Stratum-1 time locked</div>
            </div>

            <div className="p-4 bg-[#071A33] border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase">WORM HARDWARE STATUS</span>
              <div className="text-base font-black text-cyan-300">SEALED IN COMPLIANCE MODE</div>
              <div className="text-[10px] text-slate-400">Root delete locked</div>
            </div>

            <div className="p-4 bg-[#071A33] border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase">HSM CRYPTO ATTESTATION</span>
              <div className="text-base font-black text-emerald-400">FIPS 140-2 LEVEL 3</div>
              <div className="text-[10px] text-slate-400">Ed25519 hardware signing</div>
            </div>

            <div className="p-4 bg-[#071A33] border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase">POLICY RULEBOOK VERSION</span>
              <div className="text-base font-black text-white">v2.4.1 (DTI 40.0% BOUND)</div>
              <div className="text-[10px] text-slate-400">Rulebook hash synchronized</div>
            </div>

            <div className="p-4 bg-[#071A33] border border-slate-800 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase">INGESTION BUFFER DEPTH</span>
              <div className="text-base font-black text-slate-300">0.00% (CLEARED)</div>
              <div className="text-[10px] text-slate-400">Direct-to-disk write path</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[10px] text-slate-500">
            <span>CLUSTER ID: ADY-AUDIT-PROD-MUMBAI-01</span>
            <span>REPLICATION: SYNCHRONOUS TRIPLE-ZONE MIRROR</span>
            <span>REGULATORY ARCHIVE: ACTIVE</span>
          </div>
        </div>
      </div>
    </section>
  );
};
