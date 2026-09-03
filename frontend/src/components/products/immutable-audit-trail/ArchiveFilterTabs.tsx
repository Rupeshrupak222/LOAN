'use client';

import React, { useState } from 'react';
import { Filter, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';

export const ArchiveFilterTabs: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  const TABS = ['ALL', 'APPLICATION', 'POLICY', 'PAYMENT', 'USER ACTION', 'SYSTEM ACTION', 'COMPLIANCE'];

  const SAMPLE_EVENTS = [
    {
      id: '#000184',
      type: 'PAYMENT',
      action: 'PAYMENT_RECORDED',
      actor: 'SYSTEM ACTION',
      amount: '₹4,250.00',
      caseRef: 'CASE-20481',
      desc: 'Monthly EMI installment cleared via UPI autopay collection channel.',
    },
    {
      id: '#000183',
      type: 'POLICY',
      action: 'DTI_THRESHOLD_EVALUATION',
      actor: 'SYSTEM ACTION',
      amount: 'DTI: 33.75%',
      caseRef: 'CASE-20481',
      desc: 'Automated bureau rulebook verified borrower debt load below 40% cap.',
    },
    {
      id: '#000182',
      type: 'APPLICATION',
      action: 'KYC_DIGITAL_ATTESTATION',
      actor: 'USER ACTION',
      amount: 'PAN MASKED',
      caseRef: 'CASE-20481',
      desc: 'Borrower submitted Aadhaar biometric e-KYC consent with dual-factor OTP.',
    },
    {
      id: '#000181',
      type: 'COMPLIANCE',
      action: 'SANCTION_HASH_SEALED',
      actor: 'SYSTEM ACTION',
      amount: 'SHA-256 MATCH',
      caseRef: 'CASE-20480',
      desc: 'Regulatory Key Fact Statement (KFS) digital certificate archived.',
    },
    {
      id: '#000180',
      type: 'POLICY',
      action: 'RULEBOOK_HOT_RELOAD',
      actor: 'USER ACTION',
      amount: 'CEILING: 40%',
      caseRef: 'SYS-POL-02',
      desc: 'Senior risk committee approved deployment of tightened credit boundaries.',
    },
    {
      id: '#000179',
      type: 'APPLICATION',
      action: 'BUREAU_TRADELINE_INGEST',
      actor: 'SYSTEM ACTION',
      amount: 'SCORE: 782',
      caseRef: 'CASE-20479',
      desc: 'Normalized 48-month tradeline commitments extracted from credit bureau.',
    },
    {
      id: '#000178',
      type: 'PAYMENT',
      action: 'DISBURSAL_ESCROW_RELEASE',
      actor: 'SYSTEM ACTION',
      amount: '₹50,000.00',
      caseRef: 'CASE-20478',
      desc: 'Lender partner escrow release triggered over direct RTGS settlement rail.',
    },
  ];

  const filtered = selectedFilter === 'ALL'
    ? SAMPLE_EVENTS
    : SAMPLE_EVENTS.filter((e) => e.type === selectedFilter || e.actor.toUpperCase() === selectedFilter);

  return (
    <section
      id="section-archive-filter"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 text-left">
          <div className="space-y-3 max-w-xl">
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>CATEGORY FILTER APERTURE // MULTI-TAXONOMY NAVIGATION</span>
            </span>

            <h2
              className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              FILTER THE ARCHIVE.
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
              Instantly isolate regulatory compliance filings, credit policy adjustments, loan originations, and payment drawdowns across millions of immutable ledger entries.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            SHOWING {filtered.length} MATCHING EVENTS
          </div>
        </div>

        {/* ── EDITORIAL FILTER TABS ── */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 border-b-2 border-slate-300 pb-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSelectedFilter(tab)}
                className={`px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative ${
                  selectedFilter === tab
                    ? 'text-slate-950 font-black'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <span>{tab}</span>
                {selectedFilter === tab && (
                  <span className="absolute -bottom-2.5 left-0 right-0 h-1 bg-[#155EEF]" />
                )}
              </button>
            ))}
          </div>

          {/* Filtered Records List */}
          <div className="space-y-3 font-mono text-left">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-white border-2 border-slate-900 shadow-xs hover:shadow-md transition-all space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-4">
                    <span className="font-black text-sm text-[#071A33]">{item.id}</span>
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200">
                      {item.type}
                    </span>
                    <span className="font-bold text-slate-900">{item.action}</span>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="text-slate-500 text-[11px]">{item.caseRef}</span>
                    <span className="text-[#155EEF] font-black text-sm">{item.amount}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                  <p className="font-sans leading-relaxed">
                    {item.desc}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ACTOR: <strong className="text-slate-800">{item.actor}</strong>
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
