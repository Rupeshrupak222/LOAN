'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle2, ChevronRight, Lock, ShieldCheck, UserCheck, CreditCard } from 'lucide-react';

export const ForensicCaseHistory: React.FC = () => {
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(2);

  const LIFECYCLE = [
    {
      num: '01',
      event: 'APPLICATION_INGESTED',
      time: '12:35:10.104 UTC',
      actor: 'BORROWER_SDK // ONBOARDING_API',
      summary: 'Applicant initiates ₹50,000 unsecured credit facility request through mobile banking application.',
      details: 'Demographic payload ingested: Borrower ID ADY-USR-89412, PAN ABCPV****K, employment category Salaried IT Services, declared gross income ₹80,000/mo. Device fingerprint and IP geolocation sealed.',
      auditArtifact: 'ARTIFACT-PAYLOAD-ORIG-89412.JSON (SHA-256: 8a1f4c...)',
    },
    {
      num: '02',
      event: 'KYC_DOCUMENTS_ATTESTED',
      time: '12:36:44.891 UTC',
      actor: 'KYC_ORCHESTRATOR // NSDL_GATEWAY',
      summary: 'Biometric Aadhaar e-KYC and PAN verification completed with NSDL government registry.',
      details: 'Name match confidence 99.4%, face-match liveness check confirmed score 0.98. Digilocker bank statement statement PDF retrieved; 6-month continuous payroll cashflows cryptographically certified.',
      auditArtifact: 'CERT-KYC-ATTESTATION-UIDAI-XML (SHA-256: 1e9d2b...)',
    },
    {
      num: '03',
      event: 'POLICY_EVALUATED // DTI_SANCTION',
      time: '12:38:02.441 UTC',
      actor: 'DECISION_CORE_V2 // RULE_ENGINE',
      summary: 'Automated DTI rulebook evaluates gross cashflows against active bureau debt obligations.',
      details: 'CIBIL score 782 (0 past-due cycles in 36M). Existing obligations ₹18,000 + proposed loan EMI ₹9,000 = total debt ₹27,000. Computed DTI: 33.75%, clearing 40.0% institutional policy ceiling without referral.',
      auditArtifact: 'DECISION-RUN-SPEC-v2.4-CASE-20481 (SHA-256: 3c8e4a...)',
    },
    {
      num: '04',
      event: 'SANCTION_AGREEMENT_SEALED',
      time: '12:39:15.020 UTC',
      actor: 'LENDING_CORE // LEGAL_SERVICE',
      summary: 'Formal sanction letter and Key Fact Statement (KFS) generated per RBI digital lending guidelines.',
      details: 'Principal sanctioned: ₹50,000. Interest rate: 14.50% APR reducing balance. Total repayment liability clearly scheduled. Borrower e-Signs agreement via Aadhaar OTP with trusted timestamping certificate.',
      auditArtifact: 'KFS-SANCTION-CONTRACT-SIGNED-PDF (SHA-256: 9b2d1c...)',
    },
    {
      num: '05',
      event: 'UPI_AUTOPAY_MANDATE_BOUND',
      actor: 'NPCI_MANDATE_ADAPTER',
      time: '12:40:20.612 UTC',
      summary: 'Automated recurring collection mandate approved by borrower’s sponsor bank.',
      details: 'UMRN issued: UMRN20260903001. Maximum debit mandate cap ₹5,000 per cycle on 5th of each month. Destination VPA bound to lending institution escrow account at partner bank.',
      auditArtifact: 'NPCI-MANDATE-CONFIRM-XML (SHA-256: 5f8a0e...)',
    },
    {
      num: '06',
      event: 'DRAWDOWN_DISBURSED_&_SEALED',
      actor: 'IMPS_SETTLEMENT_BUS',
      time: '12:41:08.419 UTC',
      summary: 'Initial drawdown transaction of ₹4,250 disbursed into borrower account.',
      details: 'Transaction RRN: 624109844210. Disbursal advice dispatched to borrower SMS & email. Loan ledger balance debited; repayment schedule active in servicing core.',
      auditArtifact: 'LEDGER-COMMIT-BLOCK-000184 (SHA-256: 4a8c9e...)',
    },
  ];

  const currentEvent = LIFECYCLE[selectedCaseIdx];

  return (
    <section
      id="section-case-history"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-left space-y-3 pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <Lock className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>FORENSIC CASE LIFECYCLE DOSSIER // LOAN #20481</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            NOT JUST THE FINAL STATE. <br />
            <span className="text-[#155EEF]">THE COMPLETE HISTORY.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
            Trace the entire forensic sequence of a retail loan facility from initial borrower application through KYC, automated DTI underwriting, digital agreement attestation, mandate registration, and final disbursal.
          </p>
        </div>

        {/* ── CASE HISTORY LIST & DETAIL DOSSIER ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start text-left font-mono">
          {/* Left: 6 Chronological Stages */}
          <div className="md:col-span-6 space-y-2">
            {LIFECYCLE.map((item, idx) => {
              const isSelected = selectedCaseIdx === idx;

              return (
                <div
                  key={item.event}
                  onClick={() => setSelectedCaseIdx(idx)}
                  className={`p-4 border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                    isSelected
                      ? 'bg-[#071A33] text-white border-[#071A33] shadow-md translate-x-1'
                      : 'bg-[#F8FAFC] text-[#071A33] border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold">STEP {item.num}</span>
                      <span className="font-black">{item.event}</span>
                    </div>
                    <p className={`text-[11px] font-sans ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Stage Detail Dossier */}
          <div className="md:col-span-6 p-8 bg-[#F8FAFC] border-2 border-slate-900 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-300">
              <span className="text-[10px] text-slate-400 uppercase font-bold">
                FORENSIC CASE DOSSIER • STEP {currentEvent.num}
              </span>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-300 font-bold">
                ✓ ATTESTED IN LEDGER
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">EVENT VERB & WORKFLOW STEP</div>
              <div className="text-xl font-black text-[#071A33]">
                {currentEvent.event}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-slate-500 uppercase">FORENSIC EXECUTION DETAILS</div>
              <p className="text-xs text-slate-800 font-sans leading-relaxed">
                {currentEvent.details}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-300 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">CRYPTOGRAPHIC EVIDENCE ARTIFACT</span>
                <div className="font-bold text-[#155EEF] break-all bg-white p-2 border border-slate-200 mt-0.5">
                  {currentEvent.auditArtifact}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase">INITIATING SUBSYSTEM</span>
                  <div className="font-bold text-slate-800">{currentEvent.actor}</div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase">TIME RECORD</span>
                  <div className="font-bold text-slate-800">{currentEvent.time}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
