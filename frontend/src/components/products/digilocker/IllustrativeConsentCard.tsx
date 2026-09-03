'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Lock, XCircle, RefreshCw, ArrowRight } from 'lucide-react';

type ConsentState = 'pending' | 'authorizing' | 'granted' | 'declined';

export const IllustrativeConsentCard: React.FC = () => {
  const [consentState, setConsentState] = useState<ConsentState>('pending');

  const handleAllow = () => {
    setConsentState('authorizing');
    setTimeout(() => {
      setConsentState('granted');
    }, 900);
  };

  const handleDecline = () => {
    setConsentState('declined');
  };

  const handleReset = () => {
    setConsentState('pending');
  };

  return (
    <section
      id="section-consent"
      className="py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Editorial Narrative */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase">
            <span>CONSENT-FIRST ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
            VERIFICATION STARTS{' '}
            <span className="text-[#155EEF] block">WITH CONSENT.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
            Digital document verification requires explicit customer authorization. Customers review who is requesting the document, exactly which attributes will be accessed, and the explicit purpose of verification.
          </p>

          {/* Three Non-Negotiable Consent Guarantees */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold font-mono text-[#071A33] uppercase">
                  Explicit Scope & Purpose
                </h4>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  Access is strictly limited to the stated verification purpose, preventing unauthorized data re-purposing.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80">
              <Lock className="w-5 h-5 text-[#155EEF] shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold font-mono text-[#071A33] uppercase">
                  User-Controlled Authorization
                </h4>
                <p className="text-xs text-slate-500 font-sans mt-0.5">
                  The user can inspect the request details and decline at any point before authorization is committed.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Clean Interactive Consent Dialog Simulation */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-300 shadow-xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Top Demonstration Watermark Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#071A33]">
                <Lock className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>DOCUMENT ACCESS REQUEST</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                ILLUSTRATIVE CONSENT FLOW
              </span>
            </div>

            {/* Request Specification Metadata */}
            <div className="space-y-3 font-sans">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  REQUESTER
                </span>
                <span className="text-xs font-bold text-[#071A33]">
                  ADYAPAN DEMO (LENDING WORKSPACE)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  REQUESTED DOCUMENT
                </span>
                <span className="text-xs font-bold text-slate-800">
                  DIGITAL IDENTITY DOCUMENT (VERIFIED XML)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-left">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  VERIFICATION PURPOSE
                </span>
                <span className="text-xs font-bold text-slate-800">
                  CREDIT ONBOARDING & STATUTORY KYC COMPLIANCE
                </span>
              </div>
            </div>

            {/* Simulated Dynamic Status Bar */}
            <div className="p-3 rounded-xl bg-slate-100/80 border border-slate-200 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 uppercase">STATE:</span>
              {consentState === 'pending' && (
                <span className="font-bold text-amber-600">AWAITING AUTHORIZATION</span>
              )}
              {consentState === 'authorizing' && (
                <span className="font-bold text-blue-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  REQUESTING CONSENT...
                </span>
              )}
              {consentState === 'granted' && (
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  CONSENT RECEIVED · DOCUMENT AVAILABLE
                </span>
              )}
              {consentState === 'declined' && (
                <span className="font-bold text-rose-600 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  ACCESS DECLINED
                </span>
              )}
            </div>

            {/* Action Buttons */}
            {consentState === 'pending' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDecline}
                  className="py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  DECLINE
                </button>
                <button
                  type="button"
                  onClick={handleAllow}
                  className="py-3 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md shadow-[#155EEF]/20 transition-all cursor-pointer"
                >
                  ALLOW ACCESS
                </button>
              </div>
            )}

            {consentState === 'authorizing' && (
              <div className="py-3 text-center text-xs font-mono text-slate-500">
                Processing simulated consent handshake...
              </div>
            )}

            {(consentState === 'granted' || consentState === 'declined') && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#071A33] font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>RESET CONSENT DEMO</span>
                </button>
              </div>
            )}

            <p className="text-[10px] font-mono text-slate-400 text-center">
              Simulated demonstration interface. Does not access actual user DigiLocker accounts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
