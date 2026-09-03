'use client';

import React, { useState } from 'react';
import { Plus, ArrowRight, ShieldCheck, Lock, Database, FileCheck } from 'lucide-react';

export const AppendOnlyLedgerStrip: React.FC = () => {
  const [records, setRecords] = useState([
    {
      id: '#000180',
      event: 'BORROWER_ONBOARDED',
      actor: 'KYC_ORCHESTRATOR',
      time: '12:38:12 UTC',
      status: 'SEALED',
      category: 'IDENTITY',
      amount: 'PAN MASKED',
      summary: 'Biometric e-KYC verified via UIDAI licensed gateway. Aadhaar XML hash sealed.',
    },
    {
      id: '#000181',
      event: 'BUREAU_NORMALIZATION',
      actor: 'CIBIL_CONNECTOR',
      time: '12:39:45 UTC',
      status: 'SEALED',
      category: 'UNDERWRITING',
      amount: 'SCORE: 782',
      summary: '48-month credit history pulled and normalized into canonical tradeline schema.',
    },
    {
      id: '#000182',
      event: 'DTI_SANCTION_COMMITTED',
      actor: 'POLICY_ENGINE_V2',
      time: '12:40:02 UTC',
      status: 'SEALED',
      category: 'RISK_POLICY',
      amount: 'CAP: ₹50,000',
      summary: 'DTI calculated at 33.75% against 40% threshold. Automated sanction letter bound.',
    },
    {
      id: '#000183',
      event: 'UPI_MANDATE_REGISTERED',
      actor: 'NPCI_AUTOPAY_GATEWAY',
      time: '12:40:55 UTC',
      status: 'SEALED',
      category: 'COLLECTIONS',
      amount: 'UMRN REGISTERED',
      summary: 'Automated recurring collection mandate registered with borrower bank.',
    },
    {
      id: '#000184',
      event: 'DISBURSAL_CLEARED',
      actor: 'IMPS_SETTLEMENT_BUS',
      time: '12:41:08 UTC',
      status: 'SEALED',
      category: 'TRANSACTIONS',
      amount: '₹4,250.00',
      summary: 'Principal tranche disbursed into borrower primary bank account via IMPS clearing.',
    },
  ]);

  const handleAppendStrip = () => {
    const nextNum = records.length + 180;
    const newRec = {
      id: `#000${nextNum}`,
      event: 'INTEREST_ACCRUAL_SEALED',
      actor: 'ACCRUAL_DAEMON',
      time: '12:42:15 UTC',
      status: 'SEALED',
      category: 'ACCOUNTING',
      amount: '₹42.50 ACCRUED',
      summary: 'Daily interest compounding calculated per loan agreement schedule.',
    };
    setRecords((prev) => [...prev, newRec]);
  };

  return (
    <section
      id="section-ledger-strip"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-[1400px] mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 text-left">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase tracking-widest flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>CONTINUOUS SEQUENTIAL RECORD STRIP // CHRONOLOGICAL LOG</span>
            </span>

            <h2
              className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              YOU CAN ADD. <br />
              <span className="text-slate-400">YOU DON'T REWRITE.</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              Every loan origination, bureau check, policy decision, mandate registration, and repayment is appended sequentially to the ledger. Each entry cryptographically references its predecessor, forming an unbroken, forward-only chain of historical facts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              type="button"
              onClick={handleAppendStrip}
              className="px-5 py-3 bg-[#071A33] hover:bg-black text-white font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>APPEND SIMULATED EVENT</span>
            </button>
          </div>
        </div>

        {/* ── HORIZONTAL LEDGER RECORD STRIPS ── */}
        <div className="overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex items-stretch gap-4 min-w-max text-left font-mono">
            {records.map((r, idx) => (
              <div
                key={r.id}
                className="w-80 p-6 bg-white border-2 border-slate-900 shadow-md flex flex-col justify-between space-y-4 relative hover:shadow-xl transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-[10px] text-slate-400">
                    <span className="font-bold">ENTRY #{idx + 1} // {r.category}</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                      ✓ {r.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-2xl font-black text-[#071A33]">
                      {r.id}
                    </div>
                    <div className="text-xs font-bold text-[#155EEF] uppercase">
                      {r.event}
                    </div>
                    <div className="text-sm font-black text-slate-900 pt-1">
                      {r.amount}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 font-sans leading-relaxed pt-1">
                    {r.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
                  <div>ACTOR: <strong className="text-slate-800">{r.actor}</strong></div>
                  <div>TIME: <strong className="text-slate-800">{r.time}</strong></div>
                </div>
              </div>
            ))}

            {/* Awaiting Next Entry Slot */}
            <div className="w-80 p-6 border-2 border-dashed border-slate-300 bg-white/50 flex flex-col items-center justify-center text-center space-y-3 text-slate-400 font-mono text-xs">
              <Plus className="w-8 h-8 text-slate-300" />
              <span className="font-bold text-slate-600">AWAITING REAL-TIME TRANSACTION...</span>
              <p className="text-[10px] text-slate-400 font-sans max-w-xs">
                Next incoming event from payments gateway, LMS engine, or regulatory portal will automatically append to this slot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
