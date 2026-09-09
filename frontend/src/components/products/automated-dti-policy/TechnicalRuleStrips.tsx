'use client';

import React, { useState } from 'react';
import { ShieldCheck, ChevronRight } from 'lucide-react';

export const TechnicalRuleStrips: React.FC = () => {
  const [expandedStrip, setExpandedStrip] = useState<string | null>('r1');

  const RULES = [
    {
      id: 'r1',
      code: 'RULE / 001',
      parameter: 'DTI CEILING',
      operator: '≤',
      threshold: 'CONFIGURED LIMIT (40%)',
      status: 'ACTIVE',
      details: 'Evaluates applicant consolidated monthly debt load against verified net disposable payroll. If exceeded, case is flagged for underwriter review.',
      action: 'Pass: Continue | Fail: Route to Review Queue',
    },
    {
      id: 'r2',
      code: 'RULE / 002',
      parameter: 'EXISTING OBLIGATION',
      operator: '≤',
      threshold: '50% TOTAL GROSS INCOME',
      status: 'ACTIVE',
      details: 'Ensures existing external EMIs alone do not exceed half of gross salary prior to evaluating prospective facility additions.',
      action: 'Pass: Continue | Fail: Reduce Sanction Cap',
    },
    {
      id: 'r3',
      code: 'RULE / 003',
      parameter: 'BUREAU SIGNAL',
      operator: '==',
      threshold: 'CONFIGURED HYGIENE CRITERIA',
      status: 'ACTIVE',
      details: 'Scans multi-year bureau trade-lines for past 30-day delinquency occurrences and recent multi-inquiry credit spikes.',
      action: 'Pass: Continue | Fail: Escalate to Senior Desk',
    },
    {
      id: 'r4',
      code: 'RULE / 004',
      parameter: 'EMPLOYMENT VINTAGE',
      operator: '≥',
      threshold: '12 MONTHS TENURE',
      status: 'ACTIVE',
      details: 'Validates stability signals including payroll consistency, registered corporate category, and continuous active contributions.',
      action: 'Pass: Continue | Fail: Require Additional Proof',
    },
    {
      id: 'r5',
      code: 'RULE / 005',
      parameter: 'DISPOSABLE SURPLUS',
      operator: '≥',
      threshold: '₹25,000 / MO CASH RESERVE',
      status: 'ACTIVE',
      details: 'Computes net unencumbered residual cashflow remaining after all debt servicing and household baseline expenses.',
      action: 'Pass: Instant Sanction | Fail: Referral',
    },
  ];

  return (
    <section
      id="section-technical-strips"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-[1400px] mx-auto space-y-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 text-left">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>TECHNICAL POLICY SPECIFICATION STRIPS</span>
            </span>

            <h2
              className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
              style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
            >
              RULES SHOULD BE <br />
              <span className="text-slate-400">VISIBLE.</span>
            </h2>
          </div>

          <p className="text-xs sm:text-sm font-mono text-slate-500 max-w-sm">
            Hover over any technical strip to expand the underlying logic parameters.
          </p>
        </div>

        {/* ── LARGE HORIZONTAL TECHNICAL SPEC STRIPS ── */}
        <div className="space-y-3">
          {RULES.map((r) => {
            const isExpanded = expandedStrip === r.id;

            return (
              <div
                key={r.id}
                onMouseEnter={() => setExpandedStrip(r.id)}
                className={`border transition-all duration-300 cursor-pointer ${
                  isExpanded
                    ? 'bg-[#071A33] text-white border-[#071A33] shadow-2xl p-6 sm:p-8'
                    : 'bg-[#F8FAFC] text-[#071A33] border-slate-200 hover:bg-slate-100 p-5 sm:p-6'
                }`}
              >
                {/* Top Summary Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {r.code}
                    </span>

                    <span
                      className="text-xl sm:text-2xl font-black tracking-tight uppercase"
                      style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
                    >
                      {r.parameter}
                    </span>

                    <span className={`text-base font-mono font-bold ${isExpanded ? 'text-cyan-400' : 'text-[#155EEF]'}`}>
                      {r.operator} {r.threshold}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 ${
                        isExpanded
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {r.status}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-cyan-400' : 'text-slate-400'}`} />
                  </div>
                </div>

                {/* Expanded Detailed Specifications */}
                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
                    <div className="md:col-span-8 space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        SPECIFICATION LOGIC
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {r.details}
                      </p>
                    </div>

                    <div className="md:col-span-4 space-y-1">
                      <div className="text-[10px] font-mono text-slate-400 uppercase">
                        EVALUATION BRANCHING
                      </div>
                      <div className="text-xs font-mono text-cyan-300 font-bold">
                        {r.action}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
