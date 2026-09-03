'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, RefreshCw, AlertCircle, FileCheck, ArrowRight } from 'lucide-react';

type StepStatus = 'idle' | 'checking' | 'source_found' | 'doc_match' | 'complete';

export const SimulatedVerificationPanel: React.FC = () => {
  const [status, setStatus] = useState<StepStatus>('idle');

  const startVerification = () => {
    setStatus('checking');
    setTimeout(() => {
      setStatus('source_found');
      setTimeout(() => {
        setStatus('doc_match');
        setTimeout(() => {
          setStatus('complete');
        }, 800);
      }, 800);
    }, 800);
  };

  const resetVerification = () => {
    setStatus('idle');
  };

  return (
    <section
      id="section-verification"
      className="py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Narrative */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase">
            <span>AUTOMATED VALIDATION</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
            VERIFY WHAT{' '}
            <span className="text-[#155EEF] block">YOU RECEIVE.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
            Digital documents are cryptographically signed by accredited issuing entities. Automated checks validate certificate signatures, revocation registries, and document hashes before records enter the loan decisioning pipeline.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-left">
              <span className="text-slate-400 block text-[10px] uppercase">CHECKSUM ATTESTATION</span>
              <span className="font-bold text-[#071A33]">SHA-256 SIGNATURE</span>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-left">
              <span className="text-slate-400 block text-[10px] uppercase">VERIFIER LATENCY</span>
              <span className="font-bold text-emerald-600">&lt; 1.2 SECONDS</span>
            </div>
          </div>
        </div>

        {/* Right: Clean Interactive Verification Terminal Simulation */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-300 shadow-xl p-7 sm:p-9 space-y-6 text-left">
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-[#071A33]">
                <ShieldCheck className="w-4 h-4 text-[#155EEF]" />
                <span>VERIFICATION CONSOLE</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                SIMULATED VERIFICATION
              </span>
            </div>

            {/* Document Payload Summary */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[9px] text-slate-400 block uppercase">DOCUMENT</span>
                <span className="font-bold text-[#071A33]">IDENTITY_DEMO_XML</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[9px] text-slate-400 block uppercase">SOURCE</span>
                <span className="font-bold text-slate-700">CERTIFIED_ISSUER</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[9px] text-slate-400 block uppercase">REFERENCE</span>
                <span className="font-bold text-[#155EEF]">REF-99201-OK</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[9px] text-slate-400 block uppercase">STATUS</span>
                <span className="font-bold text-slate-800 uppercase">
                  {status === 'idle' && 'READY'}
                  {status === 'checking' && 'CHECKING...'}
                  {status === 'source_found' && 'SOURCE OK'}
                  {status === 'doc_match' && 'HASH MATCH'}
                  {status === 'complete' && 'VERIFIED'}
                </span>
              </div>
            </div>

            {/* Sequential Steps Progress Bar */}
            <div className="space-y-2 pt-1 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>VERIFICATION MILESTONES:</span>
                <span className="font-bold text-[#155EEF]">
                  {status === 'idle' && '0/3'}
                  {status === 'checking' && '1/3'}
                  {status === 'source_found' && '2/3'}
                  {status === 'doc_match' && '3/3'}
                  {status === 'complete' && 'COMPLETE'}
                </span>
              </div>

              {/* Progress Milestones Strip */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status !== 'idle' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={status !== 'idle' ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                    Issuer Certificate Handshake
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status === 'source_found' || status === 'doc_match' || status === 'complete' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={status === 'source_found' || status === 'doc_match' || status === 'complete' ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                    Payload Schema Integrity Check
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${status === 'doc_match' || status === 'complete' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={status === 'doc_match' || status === 'complete' ? 'text-slate-800 font-bold' : 'text-slate-400'}>
                    Digital Signature Attestation
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {status === 'idle' && (
              <button
                type="button"
                onClick={startVerification}
                className="w-full py-3.5 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md shadow-[#155EEF]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>VERIFY DOCUMENT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {status !== 'idle' && status !== 'complete' && (
              <div className="py-3.5 text-center text-xs font-mono text-[#155EEF] font-bold flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>EXECUTING ATOMIC VERIFICATION PIPELINE...</span>
              </div>
            )}

            {status === 'complete' && (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-bold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    VERIFICATION COMPLETE
                  </span>
                  <span>CONFIDENCE: 100%</span>
                </div>

                <button
                  type="button"
                  onClick={resetVerification}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  RUN ANOTHER SIMULATION
                </button>
              </div>
            )}

            <p className="text-[10px] font-mono text-slate-400 text-center">
              Simulated verification logic. Connects to no external databases or government APIs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
