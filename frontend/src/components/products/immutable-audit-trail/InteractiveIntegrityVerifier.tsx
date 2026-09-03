'use client';

import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, RotateCcw, Lock, Key, Hash } from 'lucide-react';

export const InteractiveIntegrityVerifier: React.FC = () => {
  const [verifying, setVerifying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const VERIFY_STEPS = [
    {
      title: 'BLOCK STORAGE DISCOVERY & SECTOR VALIDATION',
      desc: 'Retrieves canonical record payload from WORM volume VOL-PROD-AUDIT-08. Verifies raw hardware sector integrity.',
    },
    {
      title: 'MERKLE LINEAGE POINTER RECONCILIATION',
      desc: 'Validates parent hash 7f9d8a12e443c08b...99e1 against immediate predecessor Event #000183. Sequence verified unbroken.',
    },
    {
      title: 'FIPS 140-2 HSM SIGNATURE ATTESTATION',
      desc: 'Evaluates Ed25519 digital signature against Adyapan root public certificate. Origin authenticity mathematically confirmed.',
    },
    {
      title: 'DETERMINISTIC SHA-256 RE-CALCULATION',
      desc: 'Recomputes digest over all 10 canonical attributes. Computed hash matches sealed block marker with zero bit-level divergence.',
    },
  ];

  const handleVerify = () => {
    if (verifying) return;
    setVerifying(true);
    setStepIndex(0);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      setStepIndex(count);
      if (count >= VERIFY_STEPS.length) {
        clearInterval(interval);
        setVerifying(false);
      }
    }, 450);
  };

  return (
    <section
      id="section-verify-integrity"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-4xl mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-left sm:text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>CRYPTOGRAPHIC VERIFICATION BENCH // PROOF SUITE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            TRUST THE RECORD. <br />
            <span className="text-[#155EEF]">THEN VERIFY IT.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Do not rely on institutional goodwill or informal promises. Adyapan allows auditors, regulators, and partner banks to independently verify the cryptographic validity of any historical event in sub-second execution.
          </p>
        </div>

        {/* ── THE VERIFICATION BENCH ── */}
        <div className="p-8 sm:p-12 bg-[#F8FAFC] border-2 border-slate-900 shadow-2xl space-y-8 text-left font-mono">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">AUDIT TARGET UNDER INSPECTION</span>
              <div className="text-xl font-black text-[#071A33]">
                RECORD #000184 // PAYMENT_RECORDED
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              className="px-6 py-3 bg-[#155EEF] hover:bg-blue-700 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{verifying ? 'COMPUTING INTEGRITY PROOF...' : 'RUN VERIFICATION SUITE'}</span>
            </button>
          </div>

          {/* Verification Steps Sequence */}
          <div className="space-y-3">
            {VERIFY_STEPS.map((st, idx) => {
              const isPassed = stepIndex > idx;
              const isCurrent = stepIndex === idx && verifying;

              return (
                <div
                  key={st.title}
                  className={`p-4 border transition-all space-y-1 text-xs ${
                    isPassed
                      ? 'bg-white border-emerald-500 text-slate-900 shadow-xs'
                      : isCurrent
                      ? 'bg-blue-50 border-[#155EEF] text-[#155EEF] animate-pulse'
                      : 'bg-white/40 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-black">STAGE 0{idx + 1}</span>
                      <span className="font-bold">{st.title}</span>
                    </div>

                    {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>

                  <p className={`text-[11px] font-sans pl-16 ${isPassed ? 'text-slate-600' : 'text-slate-400'}`}>
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {stepIndex === VERIFY_STEPS.length && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
              <span className="font-bold">✓ ALL 4 CRYPTOGRAPHIC CRITERIA ATTESTED WITH ZERO BIT DIVERGENCE</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 font-bold uppercase">
                STATUS: 100% INTACT & ADMISSIBLE
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
