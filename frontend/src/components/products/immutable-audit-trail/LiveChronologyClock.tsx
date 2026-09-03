'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, CheckCircle2, Zap, Server } from 'lucide-react';

export const LiveChronologyClock: React.FC = () => {
  const [seconds, setSeconds] = useState(8);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => (prev + 1) % 60);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const TIMELINE_LOGS = [
    {
      time: `12:41:${String(seconds).padStart(2, '0')}.419 UTC`,
      event: 'DISBURSAL_BATCH_SEALED',
      ref: '#000184',
      system: 'NEFT_SETTLEMENT_RAIL',
      impact: 'Tranche of ₹4,250 dispatched to beneficiary clearing pool.',
      sla: '0.002s',
    },
    {
      time: `12:41:${String((seconds + 59) % 60).padStart(2, '0')}.882 UTC`,
      event: 'DTI_POLICY_THRESHOLD_VERIFIED',
      ref: '#000183',
      system: 'POLICY_ENGINE_V2',
      impact: 'Calculated 33.75% against 40% cap; zero policy exceptions triggered.',
      sla: '0.001s',
    },
    {
      time: `12:41:${String((seconds + 58) % 60).padStart(2, '0')}.310 UTC`,
      event: 'BUREAU_TRADELINE_HASH_COMMITTED',
      ref: '#000182',
      system: 'CIBIL_CONNECTOR',
      impact: 'Multi-institutional credit exposure normalized into tamper-proof archive.',
      sla: '0.003s',
    },
    {
      time: `12:41:${String((seconds + 57) % 60).padStart(2, '0')}.104 UTC`,
      event: 'AADHAAR_ESIGN_XML_ATTESTED',
      ref: '#000181',
      system: 'DIGITAL_SIGNATURE_NODE',
      impact: 'UIDAI licensed timestamping authority (TSA) cert bound to sanction agreement.',
      sla: '0.002s',
    },
    {
      time: `12:41:${String((seconds + 56) % 60).padStart(2, '0')}.002 UTC`,
      event: 'UPI_AUTOPAY_MANDATE_REGISTERED',
      ref: '#000180',
      system: 'NPCI_SWITCH_ADAPTER',
      impact: 'UMRN issued by borrower bank; auto-debit collection queue scheduled.',
      sla: '0.004s',
    },
  ];

  return (
    <section
      id="section-time-record"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#071A33] text-white overflow-hidden border-b border-slate-800 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl mx-auto text-left sm:text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>HIGH-RESOLUTION DETERMINISTIC CAUSALITY</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            TIME IS PART <br />
            <span className="text-cyan-400">OF THE RECORD.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            In financial systems, ordering is everything. Adyapan eliminates race conditions and disputed transaction sequences through Stratum-1 atomic clock synchronization, ensuring an infallible timeline where events cannot be backdated or spliced.
          </p>
        </div>

        {/* ── ENORMOUS DIGITAL CLOCK & CHRONOLOGY FEED ── */}
        <div className="p-8 sm:p-14 bg-[#0A1628] border-2 border-slate-800 shadow-2xl relative space-y-10 text-left font-mono">
          {/* Giant Time Display */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="space-y-2">
              <span className="text-xs text-slate-400 uppercase tracking-widest">
                STRATUM-1 ATOMIC TIME REFERENCE (UTC)
              </span>

              <div
                className="text-5xl sm:text-7xl md:text-8xl font-black text-white tracking-tighter leading-none"
                style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
              >
                12:41:{String(seconds).padStart(2, '0')}.<span className="text-cyan-400 text-3xl sm:text-5xl">419</span>
              </div>
            </div>

            <div className="space-y-1 text-left md:text-right text-xs">
              <div className="text-cyan-400 font-bold uppercase">
                RFC 3161 TRUSTED TIMESTAMP AUTHORITY
              </div>
              <div className="text-slate-400 text-[10px]">
                ACCURACY: ±0.05 MICROSECONDS • DRIFT CORRECTION: ACTIVE
              </div>
            </div>
          </div>

          {/* Synchronized Chronology Rows */}
          <div className="space-y-3 pt-2">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              REAL-TIME MONOTONIC SEQUENCE LOG
            </div>

            {TIMELINE_LOGS.map((log, idx) => (
              <div
                key={log.event + idx}
                className="p-4 bg-[#071A33] border border-slate-800 hover:border-cyan-400/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400 font-bold">{log.time}</span>
                    <span className="text-white font-black">{log.event}</span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 font-bold">
                      {log.ref}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans">
                    {log.impact}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-slate-400 text-[10px] shrink-0">
                  <span>SUBSYSTEM: <strong className="text-slate-200">{log.system}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{log.sla} COMMIT LATENCY</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
