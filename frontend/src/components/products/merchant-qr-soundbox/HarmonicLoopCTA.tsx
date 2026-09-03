'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Server,
  Building2,
  Cpu,
} from 'lucide-react';
import { SoundboxDevice3D } from './SoundboxDevice3D';
import { useWebAudioChime } from './useWebAudioChime';

export const HarmonicLoopCTA: React.FC = () => {
  const [displayAmount, setDisplayAmount] = useState('₹500.00');
  const [displayStatus, setDisplayStatus] = useState('PAYMENT VERIFIED');
  const sectionRef = useRef<HTMLDivElement>(null);
  const { playChime } = useWebAudioChime();

  return (
    <section
      id="section-final-showcase"
      ref={sectionRef}
      className="relative py-28 sm:py-40 px-4 sm:px-8 bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EEF4FB] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[850px] h-[500px] bg-blue-500/5 rounded-full blur-[180px]" />
      </div>

      <div className="max-w-5xl mx-auto space-y-16 relative z-10 text-center">
        {/* Assembled Soundbox in Pure High-End Negative Space */}
        <div className="flex flex-col items-center justify-center pt-6">
          <div className="relative">
            {/* Soft grounded shadow */}
            <div className="w-80 h-4 rounded-full bg-black/15 blur-sm absolute -bottom-4 left-1/2 -translate-x-1/2 pointer-events-none" />

            <SoundboxDevice3D
              rotationX={10}
              rotationY={-8}
              scale={1.05}
              isVibrating={false}
              showWaveform={false}
              displayAmount={displayAmount}
              displayStatus={displayStatus}
            />
          </div>
        </div>

        {/* Final Editorial Headline & Copy */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>ADYAPAN SOUNDBOX HARDWARE</span>
          </div>

          <h2 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#071A33] tracking-tight uppercase leading-[1.06]">
            MAKE EVERY PAYMENT <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              IMPOSSIBLE TO MISS.
            </span>
          </h2>

          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
            Bring QR payment acceptance and instant merchant-facing audio confirmation together
            in an engineered, connected hardware terminal.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#155EEF] to-[#0284C7] hover:from-[#124bbf] hover:to-[#0270a8] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Deploy Merchant Soundbox</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/products/npci-upi-network"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Explore Adyapan Acquiring Stack</span>
            </Link>
          </div>
        </div>

        {/* Connected Ecosystem Infrastructure Links */}
        <div className="pt-16 border-t border-slate-200 space-y-8">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">
            Connected Adyapan Architecture Solutions
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            {/* Link 1: UPI Switch */}
            <Link
              href="/products/npci-upi-network"
              className="p-6 rounded-2xl bg-white border-2 border-slate-200/90 hover:border-[#155EEF] hover:shadow-xl hover:shadow-blue-500/10 transition-all group space-y-3 block shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>CLEARING & SWITCH</span>
                <ArrowRight className="w-4 h-4 text-[#155EEF] group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                UPI Switch
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                National payment switch connectivity delivering sub-second authorization to counter hardware.
              </p>
            </Link>

            {/* Link 2: Merchant Acquiring */}
            <Link
              href="/products/merchant-qr-soundbox"
              className="p-6 rounded-2xl bg-white border-2 border-blue-300/80 shadow-md group space-y-3 block"
            >
              <div className="flex items-center justify-between text-xs font-mono text-[#155EEF] font-bold">
                <span>TERMINAL HARDWARE</span>
                <CheckCircle2 className="w-4 h-4 text-[#155EEF]" />
              </div>
              <div className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                Merchant Acquiring
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bharat QR acquiring engine with dynamic terminal enrollment and multi-bank settlement.
              </p>
            </Link>

            {/* Link 3: Reconciliation Engine */}
            <Link
              href="/products/connect-api-gateway"
              className="p-6 rounded-2xl bg-white border-2 border-slate-200/90 hover:border-[#155EEF] hover:shadow-xl hover:shadow-blue-500/10 transition-all group space-y-3 block shadow-sm"
            >
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>AUDIT & SETTLEMENT</span>
                <ArrowRight className="w-4 h-4 text-[#155EEF] group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                Reconciliation Engine
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Automated 3-way daily ledger matching between soundbox voice events, bank SMS, and switch commits.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
