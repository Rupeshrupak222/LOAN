'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Terminal, CheckCircle2, Server, Cpu } from 'lucide-react';

export const LiveAuditFeedStream: React.FC = () => {
  const [feedItems, setFeedItems] = useState([
    {
      id: 'EVT-904',
      time: '12:41:08 UTC',
      name: 'CREDIT_POLICY_DTI_BOUND_REVISED',
      category: 'GOVERNANCE',
      actor: 'CHIEF_RISK_OFFICER',
      details: 'DTI maximum ceiling tightened from 42% to 40% for retail unsecured loans.',
      status: 'LOCKED',
    },
    {
      id: 'EVT-905',
      time: '12:41:09 UTC',
      name: 'BUREAU_BULL_PULL_NORMALIZED',
      category: 'UNDERWRITING',
      actor: 'CIBIL_CONNECTOR',
      details: 'Ingested 48-month history; active personal loan EMI extracted as ₹18,000/mo.',
      status: 'LOCKED',
    },
    {
      id: 'EVT-906',
      time: '12:41:11 UTC',
      name: 'AML_SANCTION_SCREENING_CLEARED',
      category: 'KYC_COMPLIANCE',
      actor: 'AML_WATCHLIST_DAEMON',
      details: '0 hits against UN / OFAC / RBI defaulter databases; clearance certificate minted.',
      status: 'LOCKED',
    },
    {
      id: 'EVT-907',
      time: '12:41:13 UTC',
      name: 'UPI_AUTOPAY_MANDATE_EXECUTED',
      category: 'CLEARING',
      actor: 'NPCI_SWITCH_CONNECTOR',
      details: 'Scheduled monthly debit mandate approved by borrower bank with UMRN tag.',
      status: 'LOCKED',
    },
    {
      id: 'EVT-908',
      time: '12:41:16 UTC',
      name: 'LOAN_SANCTION_AGREEMENT_ESIGNED',
      category: 'LEGAL_RECORDS',
      actor: 'BORROWER_APP_CLIENT',
      details: 'Aadhaar e-Sign XML certificate committed to permanent non-repudiation volume.',
      status: 'LOCKED',
    },
  ]);

  // Periodic simulated real-time event entry with authentic financial operations
  useEffect(() => {
    const POOL = [
      { name: 'DISBURSAL_BATCH_ESCROW_DISPATCHED', cat: 'CLEARING', actor: 'SETTLEMENT_BUS', details: 'Tranche of ₹10,00,000 dispatched to lending partner escrow pool.' },
      { name: 'INTEREST_COMPOUNDING_CALCULATED', cat: 'ACCOUNTING', actor: 'LMS_CORE_ENGINE', details: 'Daily interest calculated per reducing balance schedule without rounding skew.' },
      { name: 'PENALTY_WAIVER_DUAL_AUTH_ATTESTED', cat: 'GOVERNANCE', actor: 'SENIOR_RISK_MANAGER', details: 'Late fee ₹250 waived with two-person rule approval cryptographic token.' },
      { name: 'CERSAI_SECURITY_INTEREST_REGISTERED', cat: 'STATUTORY', actor: 'CERSAI_GATEWAY', details: 'Collateral charge filed with Central Registry of Securitisation.' },
    ];

    const interval = setInterval(() => {
      const newSeconds = Math.floor(Math.random() * 40) + 20;
      const pick = POOL[Math.floor(Math.random() * POOL.length)];
      const newItem = {
        id: `EVT-${Math.floor(Math.random() * 800) + 1000}`,
        time: `12:41:${newSeconds} UTC`,
        name: pick.name,
        category: pick.cat,
        actor: pick.actor,
        details: pick.details,
        status: 'LOCKED',
      };
      setFeedItems((prev) => [newItem, ...prev.slice(0, 5)]);
    }, 3400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="section-live-feed"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-left space-y-3 pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white text-xs font-mono font-bold uppercase tracking-widest">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>REAL-TIME AUDIT INGESTION STREAM</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            LIVE OPERATIONAL <br />
            <span className="text-[#155EEF]">AUDIT FEED.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-2xl">
            Financial systems generate millions of concurrent state transitions. Adyapan ingests events across distributed banking adapters, policy engines, and settlement rails—sealing each into write-once hardware storage in real time.
          </p>
        </div>

        {/* ── THE STREAMING LOG CHASSIS ── */}
        <div className="p-8 sm:p-10 bg-white border-2 border-slate-900 shadow-xl space-y-6 font-mono text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-black text-slate-900 uppercase">HIGH-VELOCITY AUDIT BUS</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 text-[11px]">
              <span>THROUGHPUT: <strong>4,800 TPS</strong></span>
              <span>•</span>
              <span>BUFFER DROP: <strong>0.00%</strong></span>
              <span>•</span>
              <span className="text-emerald-700 font-bold">WORM COMMIT: ACTIVE</span>
            </div>
          </div>

          <div className="space-y-3">
            {feedItems.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-[#F8FAFC] border border-slate-300 hover:border-slate-900 transition-all space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-[#155EEF] shrink-0" />
                    <span className="text-slate-500 font-bold">{item.time}</span>
                    <span className="text-slate-950 font-black">{item.name}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-bold">
                      {item.category}
                    </span>
                    <span className="text-emerald-700 font-bold">✓ {item.status}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px] text-slate-600">
                  <p className="font-sans leading-snug">
                    {item.details}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ACTOR: <strong className="text-slate-700">{item.actor}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
