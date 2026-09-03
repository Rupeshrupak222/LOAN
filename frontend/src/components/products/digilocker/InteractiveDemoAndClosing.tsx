'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

type DemoStep = 'idle' | 'requesting' | 'consent_required' | 'consent_received' | 'doc_available' | 'verifying' | 'complete';

export const InteractiveDemoAndClosing: React.FC = () => {
  const [demoStep, setDemoStep] = useState<DemoStep>('idle');

  const runDemo = () => {
    setDemoStep('requesting');
    setTimeout(() => {
      setDemoStep('consent_required');
      setTimeout(() => {
        setDemoStep('consent_received');
        setTimeout(() => {
          setDemoStep('doc_available');
          setTimeout(() => {
            setDemoStep('verifying');
            setTimeout(() => {
              setDemoStep('complete');
            }, 700);
          }, 700);
        }, 700);
      }, 700);
    }, 700);
  };

  const resetDemo = () => {
    setDemoStep('idle');
  };

  return (
    <div id="section-demo-and-closing" className="select-none">
      {/* ── Interactive 5-Step Sandbox Demo ── */}
      <ScrollStage3D
        perspective={1500}
        className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33]"
      >
        <div className="max-w-[1400px] mx-auto space-y-12">
          <div className="max-w-3xl space-y-4 text-left">
            <div
              data-depth-z="-450"
              data-rotate-x="18"
              data-offset-y="30"
              data-scale="0.9"
              data-blur="4"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
            >
              <span>STAGE 10 // LIVE SANDBOX</span>
            </div>

            <div
              data-depth-z="-750"
              data-rotate-x="30"
              data-offset-y="60"
              data-blur="8"
              data-stagger="0.1"
            >
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
                TRY THE{' '}
                <span className="text-[#155EEF]">VERIFICATION FLOW.</span>
              </h2>
            </div>

            <div
              data-depth-z="-650"
              data-rotate-y="-8"
              data-offset-y="40"
              data-blur="6"
              data-stagger="0.25"
            >
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
                Experience the end-to-end simulated verification handshake in real time. Watch how consent, retrieval, and verification synchronize within seconds.
              </p>
            </div>
          </div>

          {/* Interactive Simulation Console (Emerges from Z: -1000px, rotX: 18deg) */}
          <div
            data-depth-z="-1000"
            data-rotate-x="18"
            data-scale="0.78"
            data-offset-y="75"
            data-blur="10"
            data-stagger="0.35"
            className="max-w-3xl mx-auto rounded-2xl bg-white border border-slate-300 shadow-xl p-8 space-y-8 text-left"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 font-mono text-xs">
              <span className="font-bold text-[#071A33]">
                SIMULATED VERIFICATION PIPELINE
              </span>
              <span className="text-slate-400 uppercase tracking-widest text-[10px]">
                NO EXTERNAL NETWORK CALLS
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 font-mono text-[10px] text-center">
              <div className={`p-2.5 rounded-lg border transition-all ${
                demoStep !== 'idle' ? 'bg-blue-50 border-blue-300 text-[#155EEF] font-bold' : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                01. REQUEST
              </div>
              <div className={`p-2.5 rounded-lg border transition-all ${
                demoStep === 'consent_required' || demoStep === 'consent_received' || demoStep === 'doc_available' || demoStep === 'verifying' || demoStep === 'complete'
                  ? 'bg-blue-50 border-blue-300 text-[#155EEF] font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                02. CONSENT
              </div>
              <div className={`p-2.5 rounded-lg border transition-all ${
                demoStep === 'consent_received' || demoStep === 'doc_available' || demoStep === 'verifying' || demoStep === 'complete'
                  ? 'bg-blue-50 border-blue-300 text-[#155EEF] font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                03. FETCH
              </div>
              <div className={`p-2.5 rounded-lg border transition-all ${
                demoStep === 'verifying' || demoStep === 'complete'
                  ? 'bg-blue-50 border-blue-300 text-[#155EEF] font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                04. VERIFY
              </div>
              <div className={`p-2.5 rounded-lg border transition-all ${
                demoStep === 'complete'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                05. COMPLETE
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 text-white font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 pb-2 border-b border-slate-800">
                <span>SIMULATOR STATUS:</span>
                <span className="uppercase text-slate-300">
                  {demoStep === 'idle' && 'READY TO RUN'}
                  {demoStep === 'requesting' && 'REQUESTING DOCUMENT...'}
                  {demoStep === 'consent_required' && 'AWAITING USER CONSENT'}
                  {demoStep === 'consent_received' && 'USER CONSENT CONFIRMED'}
                  {demoStep === 'doc_available' && 'DOCUMENT PAYLOAD RETRIEVED'}
                  {demoStep === 'verifying' && 'VALIDATING DIGITAL SIGNATURE...'}
                  {demoStep === 'complete' && 'VERIFICATION COMMITTED'}
                </span>
              </div>

              <div className="text-slate-300 pt-1 font-sans text-sm">
                {demoStep === 'idle' && 'Click START DEMO to observe the step-by-step verification lifecycle.'}
                {demoStep === 'requesting' && 'LMS creates a structured verification request schema.'}
                {demoStep === 'consent_required' && 'Consent window triggered with explicit scope.'}
                {demoStep === 'consent_received' && 'Customer authorizes document access with authenticated credential.'}
                {demoStep === 'doc_available' && 'Direct digital issuer payload successfully received.'}
                {demoStep === 'verifying' && 'SHA-256 integrity hash & issuer public keys verified.'}
                {demoStep === 'complete' && 'Verification successful. Customer profile marked eligible for decisioning.'}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {demoStep === 'idle' ? (
                <button
                  type="button"
                  onClick={runDemo}
                  className="px-6 py-3.5 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md shadow-[#155EEF]/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>START DEMO</span>
                </button>
              ) : demoStep === 'complete' ? (
                <button
                  type="button"
                  onClick={resetDemo}
                  className="px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>RUN AGAIN</span>
                </button>
              ) : (
                <div className="text-xs font-mono text-[#155EEF] font-bold">
                  SIMULATION IN PROGRESS...
                </div>
              )}

              <span className="text-[10px] font-mono text-slate-400">
                SIMULATED DEMONSTRATION
              </span>
            </div>
          </div>
        </div>
      </ScrollStage3D>

      {/* ── Final Closing Hero with Centered Flat Verified Document ── */}
      <ScrollStage3D
        perspective={1600}
        className="py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] text-center relative overflow-hidden"
      >
        <div className="max-w-4xl mx-auto space-y-10 relative z-10">
          <div
            data-depth-z="-450"
            data-rotate-x="20"
            data-offset-y="30"
            data-scale="0.85"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>THE DIGITAL FUTURE OF ONBOARDING</span>
          </div>

          {/* Monumental Headline Coming Forward (Z: -1100px) */}
          <div
            data-depth-z="-1100"
            data-rotate-x="35"
            data-offset-y="90"
            data-scale="0.65"
            data-blur="12"
            data-stagger="0.15"
          >
            <h2 className="text-4xl sm:text-6xl lg:text-[76px] font-black tracking-tight text-[#071A33] uppercase leading-tight font-sans">
              MAKE VERIFICATION{' '}
              <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-[#0A2540] bg-clip-text text-transparent block mt-1">
                FEEL DIGITAL.
              </span>
            </h2>
          </div>

          <div
            data-depth-z="-650"
            data-rotate-y="-5"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.35"
          >
            <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto font-sans">
              Design cleaner onboarding journeys around trusted digital documents and consent-driven verification. Replace back-office manual friction with speed, precision, and trust.
            </p>
          </div>

          {/* Centered Flat Document Sheet with Stamp (Z: -800px) */}
          <div
            data-depth-z="-800"
            data-rotate-x="18"
            data-scale="0.85"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.5"
            className="max-w-md mx-auto p-6 rounded-2xl bg-white border border-slate-300 shadow-xl text-left relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-mono font-bold text-[#071A33]">
                DIGITAL IDENTITY ATTESTATION
              </span>
              <span className="text-[9px] font-mono text-slate-400 uppercase">
                DEMONSTRATION RECORD
              </span>
            </div>

            <div className="py-3 space-y-1 text-xs font-mono text-slate-600">
              <p>SUBJECT: <strong className="text-[#071A33]">DEMO USER</strong></p>
              <p>ISSUER: <strong className="text-[#071A33]">DIGITAL VERIFIED REPOSITORY</strong></p>
              <p>REFERENCE: <strong className="text-[#155EEF]">DEMO-48291</strong></p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="px-3 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-700 font-mono font-black text-xs tracking-widest uppercase flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>VERIFIED</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                SHA-256 COMMITTED
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div
            data-depth-z="-450"
            data-rotate-x="15"
            data-offset-y="30"
            data-scale="0.85"
            data-blur="4"
            data-stagger="0.65"
            className="flex flex-wrap items-center justify-center gap-4 pt-4 font-sans"
          >
            <Link
              href="/#simulator"
              className="px-8 py-4 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>EXPLORE ADYAPAN</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/contact"
              className="px-7 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>TALK TO OUR TEAM</span>
            </Link>
          </div>
        </div>
      </ScrollStage3D>
    </div>
  );
};
