'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Database, HardDrive, CheckCircle2, Lock } from 'lucide-react';

export const OperationalVolumeCounter: React.FC = () => {
  const [eventCount, setEventCount] = useState(184);

  useEffect(() => {
    const interval = setInterval(() => {
      setEventCount((prev) => prev + 1);
    }, 2400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="section-volume-counter"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#071A33] text-white overflow-hidden border-b border-slate-800 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-left sm:text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest border border-slate-800">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>OPERATIONAL THROUGHPUT & CAPACITY TELEMETRY</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            RECORD VOLUME.
          </h2>

          <div className="inline-block px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-mono uppercase tracking-widest">
            SIMULATED INSTITUTIONAL METRICS • REAL-TIME TICKER
          </div>
        </div>

        {/* ── MASSIVE INDUSTRIAL COUNTER READOUT ── */}
        <div className="p-8 sm:p-14 bg-[#0A1628] border-2 border-slate-800 shadow-2xl relative space-y-10 text-left font-mono">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 uppercase tracking-widest">
                IMMUTABLE EVENTS COMMITTED & SEALED
              </span>

              <div
                className="text-6xl sm:text-8xl md:text-9xl font-black text-cyan-400 tracking-tighter leading-none"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                000,{String(eventCount).padStart(3, '0')}
              </div>
            </div>

            <div className="space-y-1 text-xs text-slate-400">
              <div>AVERAGE DISK COMMIT SLA: <strong className="text-emerald-400">0.0028 SECONDS</strong></div>
              <div>REPLICATION FACTOR: <strong className="text-white">3 INDEPENDENT DATA CENTERS</strong></div>
              <div>RETENTION POLICY: <strong className="text-white">8 YEARS STRICT COMPLIANCE</strong></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            <div className="p-4 bg-[#071A33] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">RECORD TYPES</span>
              <div className="text-2xl font-black text-white">06 CATEGORIES</div>
              <div className="text-[10px] text-slate-500">SCHEMAS VERSIONED</div>
            </div>

            <div className="p-4 bg-[#071A33] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">POLICY DECISIONS</span>
              <div className="text-2xl font-black text-emerald-400">14 COMMITS</div>
              <div className="text-[10px] text-emerald-500">DTI & RISK RULES</div>
            </div>

            <div className="p-4 bg-[#071A33] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">PAYMENT EVENTS</span>
              <div className="text-2xl font-black text-[#155EEF]">32 CLEARINGS</div>
              <div className="text-[10px] text-cyan-400">UPI & IMPS SETTLEMENTS</div>
            </div>

            <div className="p-4 bg-[#071A33] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase">TAMPER DETECTIONS</span>
              <div className="text-2xl font-black text-cyan-300">0 ANOMALIES</div>
              <div className="text-[10px] text-slate-400">100% MERKLE PARITY</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
