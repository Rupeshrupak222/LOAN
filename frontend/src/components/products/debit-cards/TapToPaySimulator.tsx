'use client';

import React, { useState } from 'react';
import { Wifi, CheckCircle2, Zap, ArrowRight, RotateCcw, Smartphone, ShieldCheck } from 'lucide-react';

export const TapToPaySimulator: React.FC = () => {
  const [step, setStep] = useState<'idle' | 'approaching' | 'authenticating' | 'approved'>('idle');
  const [balance, setBalance] = useState(48920);

  const startTapSequence = () => {
    if (step !== 'idle') return;
    setStep('approaching');

    setTimeout(() => {
      setStep('authenticating');
    }, 900);

    setTimeout(() => {
      setStep('approved');
      setBalance((prev) => prev - 2450);
    }, 2200);
  };

  const resetSequence = () => {
    setStep('idle');
    setBalance(48920);
  };

  return (
    <section className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Wifi className="w-3.5 h-3.5 text-[#155EEF] -rotate-90" />
          <span>CONTACTLESS PAYMENT INTERACTION</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          Sub-400ms Tap-To-Pay in Motion
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Experience the distance proximity relationship between the physical NFC card and the acquiring POS terminal during a simulated ₹2,450.00 retail transaction.
        </p>
      </div>

      {/* Interactive Terminal & Card Arena */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-900 to-[#071A33] text-white p-6 sm:p-12 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
        {/* Ambient field lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/15 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center justify-between">
          {/* Left: Floating 3D Mini Card */}
          <div className="md:col-span-5 flex flex-col items-center justify-center space-y-4">
            <div
              className={`w-64 h-40 rounded-2xl p-4 bg-gradient-to-tr from-[#0F294D] via-[#155EEF] to-indigo-600 border border-blue-400/40 text-white shadow-xl transition-all duration-700 flex flex-col justify-between text-left ${
                step === 'approaching'
                  ? 'translate-x-16 scale-105 rotate-3 shadow-2xl shadow-blue-500/40 ring-2 ring-blue-400'
                  : step === 'authenticating' || step === 'approved'
                  ? 'translate-x-20 scale-105 rotate-6 shadow-2xl shadow-emerald-500/40 ring-2 ring-emerald-400'
                  : 'rotate-0 translate-x-0'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold tracking-widest text-blue-200">ADYAPAN TAP</span>
                <Wifi className="w-4 h-4 text-blue-300 -rotate-90 animate-pulse" />
              </div>
              <p className="text-xs font-mono font-bold tracking-widest text-slate-100">•••• •••• •••• 9812</p>
              <div className="flex justify-between items-center text-[9px] font-mono text-slate-300">
                <span>EXP 09/29</span>
                <span className="font-bold">RuPay / Visa</span>
              </div>
            </div>

            <p className="text-[11px] font-mono text-slate-400">
              {step === 'idle' ? 'Card in Standby' : step === 'approaching' ? 'Card Moving into NFC Field...' : 'Card in Proximity'}
            </p>
          </div>

          {/* Middle: Electromagnetic Signal Wave Indicator */}
          <div className="md:col-span-2 flex flex-col items-center justify-center py-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              {step === 'authenticating' || step === 'approaching' ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="animate-pulse absolute inline-flex h-12 w-12 rounded-full bg-[#155EEF] opacity-90" />
                </>
              ) : step === 'approved' ? (
                <span className="relative flex h-10 w-10 rounded-full bg-emerald-500 items-center justify-center text-white">
                  <CheckCircle2 className="w-6 h-6" />
                </span>
              ) : (
                <span className="relative flex h-8 w-8 rounded-full bg-slate-800 border border-slate-700 items-center justify-center text-slate-500">
                  <Wifi className="w-4 h-4 -rotate-90" />
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-2">13.56 MHz NFC</span>
          </div>

          {/* Right: Simulated Smart POS Terminal */}
          <div className="md:col-span-5 rounded-2xl bg-slate-950 border border-slate-800 p-5 text-left font-mono text-xs space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold">ADYAPAN SMART POS</span>
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ONLINE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-1">
              <p className="text-[10px] text-slate-400 uppercase">Transaction Amount</p>
              <p className="text-2xl font-black text-white">₹2,450.00</p>
              <p className="text-[10px] text-blue-300">Merchant: Blue Cafe Bengaluru</p>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Terminal Status:</span>
                <span className={`font-bold ${step === 'approved' ? 'text-emerald-400' : 'text-blue-300'}`}>
                  {step === 'idle'
                    ? 'WAITING FOR CARD TAP...'
                    : step === 'approaching'
                    ? 'NFC FIELD DETECTED'
                    : step === 'authenticating'
                    ? '3DS 2.0 VERIFYING...'
                    : 'APPROVED: AUTH #98124'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Updated Card Balance:</span>
                <span className="text-slate-200 font-bold">₹{balance.toLocaleString('en-IN')}.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action button strip */}
        <div className="relative z-10 mt-8 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={startTapSequence}
            disabled={step !== 'idle'}
            className="px-6 py-3 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            <span>{step === 'idle' ? 'Simulate 1-Tap Payment (₹2,450)' : 'Executing Transaction...'}</span>
          </button>

          <button
            onClick={resetSequence}
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 flex items-center gap-2 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </section>
  );
};
