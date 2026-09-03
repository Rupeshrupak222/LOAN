'use client';

import React, { useState } from 'react';
import { Search, FileText, CheckCircle2, ChevronRight, Lock, Hash, ShieldCheck } from 'lucide-react';

export const ArchiveSearchConsole: React.FC = () => {
  const [query, setQuery] = useState('PAYMENT');
  const [selectedResult, setSelectedResult] = useState<string | null>('#000184');

  const ALL_ENTRIES = [
    {
      id: '#000184',
      action: 'PAYMENT_RECORDED',
      actor: 'CLEARING_BUS_V2',
      caseRef: 'CASE-20481',
      date: '2026-09-03 12:41:08 UTC',
      amount: '₹4,250.00',
      status: 'SEALED',
      digest: 'sha256:4a8c9e120df39...b4250e',
      details: 'Monthly installment recovery cleared through NPCI UPI auto-debit collection rail. Principal balance updated.',
      initiator: 'NPCI_UMRN_MANDATE_BATCH_09',
    },
    {
      id: '#000179',
      action: 'PAYMENT_INITIATED // DRAWDOWN',
      actor: 'UPI_QR_INTENT',
      caseRef: 'CASE-20481',
      date: '2026-09-03 11:15:30 UTC',
      amount: '₹1,500.00',
      status: 'SEALED',
      digest: 'sha256:7b1f3c909ed81...c1500a',
      details: 'Borrower merchant checkout QR transaction drawdown against approved Credit Line on UPI facility.',
      initiator: 'MERCHANT_SOUNDBOX_TXN_78912',
    },
    {
      id: '#000172',
      action: 'PAYMENT_SCHEDULE_COMMITTED',
      actor: 'LMS_CORE_ENGINE',
      caseRef: 'CASE-20480',
      date: '2026-09-02 18:22:11 UTC',
      amount: '₹12,000.00',
      status: 'SEALED',
      digest: 'sha256:9c0d12e84ac42...d1200b',
      details: '36-month amortization schedule generated with reducing balance interest model at 14.5% APR.',
      initiator: 'AUTOMATED_LOAN_DISBURSAL_JOB',
    },
    {
      id: '#000166',
      action: 'PAYMENT_MANDATE_BOUND',
      actor: 'AUTOPAY_API',
      caseRef: 'CASE-20479',
      date: '2026-09-02 14:05:44 UTC',
      amount: 'RECURRING CAP: ₹5,000',
      status: 'SEALED',
      digest: 'sha256:1e2f4a5b6ca11...f5000c',
      details: 'Sponsor bank confirmed registration of electronic mandate for automated monthly debits.',
      initiator: 'BORROWER_BANK_HDFC_SWITCH',
    },
    {
      id: '#000155',
      action: 'POLICY_DTI_EVALUATION',
      actor: 'RULE_ENGINE_V2',
      caseRef: 'CASE-20478',
      date: '2026-09-01 16:30:20 UTC',
      amount: 'DTI: 32.10%',
      status: 'SEALED',
      digest: 'sha256:3d4e5f6a7be90...e3210d',
      details: 'Evaluated salary cashflow ₹95,000 against pre-existing EMIs ₹30,500; within policy boundary.',
      initiator: 'CORE_UNDERWRITING_PIPELINE',
    },
  ];

  const results = ALL_ENTRIES.filter(
    (e) =>
      e.id.toLowerCase().includes(query.toLowerCase()) ||
      e.action.toLowerCase().includes(query.toLowerCase()) ||
      e.actor.toLowerCase().includes(query.toLowerCase()) ||
      e.caseRef.toLowerCase().includes(query.toLowerCase())
  );

  const activeEntry = ALL_ENTRIES.find((e) => e.id === selectedResult) || ALL_ENTRIES[0];

  return (
    <section
      id="section-search-console"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-4xl mx-auto space-y-16 text-left">
        {/* Section Header */}
        <div className="space-y-3 pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <Search className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>FORENSIC SEARCH & HISTORICAL RETRIEVAL ENGINE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            FIND THE MOMENT.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
            Execute sub-second forensic queries across billions of financial events. Search by case reference, action verb, actor certificate, or cryptographic hash.
          </p>
        </div>

        {/* ── THE INTERACTIVE SEARCH HARNESS ── */}
        <div className="p-8 bg-[#F8FAFC] border-2 border-slate-900 shadow-xl space-y-6 font-mono">
          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by event ID (#000184), action, actor, or case (CASE-20481)..."
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-300 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#155EEF]"
            />
          </div>

          {/* Quick Query Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 text-[10px] uppercase">SUGGESTED QUERIES:</span>
            {['PAYMENT', 'CASE-20481', 'POLICY', 'CLEARING_BUS'].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuery(q)}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[11px] font-bold cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Search Results List */}
          <div className="space-y-3 pt-2">
            <div className="text-[10px] text-slate-400 uppercase">
              QUERY MATCHES ({results.length}) • CLICK ENTRY TO VIEW FORENSIC PAYLOAD
            </div>

            {results.map((res) => {
              const isSelected = selectedResult === res.id;

              return (
                <div
                  key={res.id}
                  onClick={() => setSelectedResult(res.id)}
                  className={`p-4 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-[#071A33] text-white border-[#071A33] shadow-md'
                      : 'bg-white text-[#071A33] border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{res.id}</span>
                      <span className="font-black">{res.action}</span>
                      <span className={`text-[10px] px-2 py-0.5 font-bold ${isSelected ? 'bg-slate-800 text-cyan-300' : 'bg-slate-100 text-slate-700'}`}>
                        {res.caseRef}
                      </span>
                    </div>
                    <p className={`text-[11px] font-sans ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {res.details}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`font-black text-sm ${isSelected ? 'text-cyan-300' : 'text-[#155EEF]'}`}>
                      {res.amount}
                    </span>
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Detail Drawer for Selected Query Result */}
          {activeEntry && (
            <div className="p-6 bg-white border-2 border-slate-900 shadow-md space-y-4 text-xs font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-bold text-[#071A33] uppercase">
                  FORENSIC RECORD SUMMARY // {activeEntry.id}
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-300 text-[10px]">
                  ✓ RECORD COMMITTED & SEALED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">TIMESTAMP</span>
                  <div className="text-slate-900 font-bold">{activeEntry.date}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase">ACTOR SERVICE</span>
                  <div className="text-[#155EEF] font-bold">{activeEntry.actor}</div>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase">CRYPTOGRAPHIC HASH</span>
                  <div className="text-slate-800 font-bold bg-slate-50 p-2 border border-slate-200 break-all">
                    {activeEntry.digest}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
