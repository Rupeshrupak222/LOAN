'use client';

import React from 'react';
import { ShieldCheck, ArrowRight, FileText, Scale, BookOpen } from 'lucide-react';

export const ComplianceContextMatrix: React.FC = () => {
  const CONTEXT_ROWS = [
    {
      action: 'CREDIT_POLICY_CEILING_TIGHTENED',
      framework: 'RBI DIGITAL LENDING & BASEL III RISK GOVERNANCE',
      who: 'CHIEF_RISK_OFFICER // RISK_COMMITTEE',
      when: '12:41:09.022 UTC',
      what: 'DTI maximum ceiling adjusted 40% -> 38% for tier-2 unsecured loans.',
      justification: 'Macroeconomic credit tightening protocol following regional default signal spike.',
      result: 'ATTESTED WITH DUAL-KEY MULTI-SIG',
    },
    {
      action: 'SANCTION_DISBURSAL_EXCEPTION_OVERRIDE',
      framework: 'ISO 27001 ANNEX A.12.4 ACCESS & PRIVILEGE CONTROL',
      who: 'SENIOR_CREDIT_COMMITTEE_CHAIR (EMP-4109)',
      when: '12:42:15.891 UTC',
      what: 'Permitted sanction approval with additional FD collateral lien pledged.',
      justification: 'Borrower provided secondary liquid security covering 150% of exposure.',
      result: 'LIEN CONTRACT SEALED IN WORM REPOSITORY',
    },
    {
      action: 'COLLECTION_MANDATE_SUSPENSION_TRIGGERED',
      framework: 'RBI FAIR PRACTICES CODE & CONSUMER PROTECTION DIRECTIVE',
      who: 'SYSTEM // GRIEVANCE_REMEDIATION_DAEMON',
      when: '12:43:04.110 UTC',
      what: 'Temporary freeze on automated NACH/UPI mandate debits for 72 hours.',
      justification: 'Customer filed formal transaction dispute regarding duplicate merchant debit.',
      result: 'DISPUTE CASE BOUND TO AUDIT LEDGER',
    },
  ];

  return (
    <section
      id="section-compliance-context"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-left space-y-3 pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <Scale className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>STATUTORY COMPLIANCE CONTEXT MATRIX</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            COMPLIANCE <br />
            <span className="text-[#155EEF]">NEEDS CONTEXT.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
            Bare numbers on a balance sheet fail regulatory inspection without context. Adyapan pairs every state mutation with the initiating authority, business justification, statutory framework, and dual-custody approval.
          </p>
        </div>

        {/* ── SPLIT CONTEXT MATRIX ── */}
        <div className="space-y-6 font-mono text-left">
          {CONTEXT_ROWS.map((row) => (
            <div
              key={row.action}
              className="p-8 bg-white border-2 border-slate-900 shadow-md space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    GOVERNING STATUTORY MANDATE: {row.framework}
                  </span>
                  <div className="text-lg font-black text-[#071A33]">
                    {row.action}
                  </div>
                </div>

                <div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold uppercase">
                    ✓ {row.result}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">APPROVING AUTHORITY</span>
                  <div className="font-bold text-[#155EEF] pt-0.5">{row.who}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase">ATOMIC TIMESTAMP</span>
                  <div className="text-slate-800 font-bold pt-0.5">{row.when}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase">EXACT SYSTEM MUTATION</span>
                  <div className="text-slate-900 font-bold pt-0.5">{row.what}</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 text-xs font-sans text-slate-700 space-y-0.5">
                <span className="font-bold text-slate-900 font-mono text-[10px] uppercase">
                  RECORDED BUSINESS JUSTIFICATION:
                </span>
                <p className="text-slate-800 text-[11px] leading-relaxed">
                  {row.justification}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
