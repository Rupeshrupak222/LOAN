'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  CreditCard,
  Wifi,
  Sparkles,
  Lock,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionScrollReveal3D } from '@/components/motion/MotionScrollReveal3D';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { HeroCardMotion3D } from '@/components/products/debit-cards/HeroCardMotion3D';
import { TapToPaySimulator } from '@/components/products/debit-cards/TapToPaySimulator';
import { CardControlsPlayground } from '@/components/products/debit-cards/CardControlsPlayground';
import { DebitVsPrepaidComparison } from '@/components/products/debit-cards/DebitVsPrepaidComparison';
import { CardLifecycleJourney } from '@/components/products/debit-cards/CardLifecycleJourney';
import { CardSecurityShell } from '@/components/products/debit-cards/CardSecurityShell';

export default function DebitPrepaidCardsSignaturePage() {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* ── Global 3D Navigation Bar ── */}
        <MotionNavbar />

        {/* ── Top Context Breadcrumb & Back Link ── */}
        <div className="pt-28 sm:pt-32 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#155EEF] transition-colors py-1.5 px-3 rounded-full hover:bg-white border border-transparent hover:border-slate-200 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Financial Architecture</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Adyapan</span>
              <span>/</span>
              <span className="text-slate-600 font-bold">Banking & Core</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Debit & Prepaid Cards (Signature)</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: The Card in Motion (3D Interactive Hero Canvas) ── */}
        <HeroCardMotion3D />

        {/* ── SCENE 2: Narrative Bridge — "Programmable Card Issuance" ── */}
        <MotionScrollReveal3D>
          <section className="relative py-20 bg-gradient-to-b from-[#EFF6FF] via-white to-white border-y border-slate-200/60">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>PROGRAMMABLE CARD ARCHITECTURE</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight max-w-5xl mx-auto">
                One physical card.{' '}
                <span className="bg-gradient-to-r from-[#155EEF] to-indigo-600 bg-clip-text text-transparent">
                  Unlimited programmable spending rules.
                </span>
              </h2>

              <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-4xl mx-auto">
                From instant virtual provisioning to hardware tamper-resistant tokenization, Adyapan card systems give FinTechs and enterprises end-to-end control over transaction routing, spending limits, and channel authorizations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left max-w-[1360px] mx-auto">
                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-[#155EEF] uppercase">01 · Instant Issuance</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Sub-2s Virtual PAN</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Generate tokenized virtual cards instantly and push provision directly to Apple Pay and Google Wallet.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-emerald-600 uppercase">02 · Atomic Auth</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Sub-400ms Turnaround</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Direct switch integration ensuring ultra-low latency authorizations with real-time balance validation.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase">03 · Dynamic Controls</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Zero-Latency Freeze</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Lock card rails, adjust MCC spending ceilings, and enable/disable international roaming via mobile in real-time.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── SCENE 3: Tap-To-Pay Contactless Simulation ── */}
        <MotionScrollReveal3D>
          <TapToPaySimulator />
        </MotionScrollReveal3D>

        {/* ── SCENE 4: Your Card. Your Rules (Card Controls Playground) ── */}
        <MotionScrollReveal3D>
          <CardControlsPlayground />
        </MotionScrollReveal3D>

        {/* ── SCENE 5: Debit vs. Prepaid Dual Architecture ── */}
        <MotionScrollReveal3D>
          <DebitVsPrepaidComparison />
        </MotionScrollReveal3D>

        {/* ── SCENE 6: Card Lifecycle Journey (Issuance to Renewal) ── */}
        <MotionScrollReveal3D>
          <CardLifecycleJourney />
        </MotionScrollReveal3D>

        {/* ── SCENE 7: Multi-Layer Cryptographic Security Shell ── */}
        <MotionScrollReveal3D>
          <CardSecurityShell />
        </MotionScrollReveal3D>

        {/* ── SCENE 8: Product Ecosystem Cross-Navigation ── */}
        <MotionScrollReveal3D>
          <section className="relative py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#155EEF] font-mono">
                    Connected Product Ecosystem
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#071A33] tracking-tight">
                    Modules That Connect With Card Systems
                  </h3>
                </div>
                <Link
                  href="/"
                  className="text-xs font-bold text-[#155EEF] hover:underline flex items-center gap-1 font-mono"
                >
                  <span>View All 16 Architecture Products</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
                <Link
                  href="/products/core-banking-engine"
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Banking & Core</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Core Banking Engine
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Real-time double-entry ledger that records every card swipe with exact NUMERIC decimal precision.
                  </p>
                </Link>

                <Link
                  href="/products/neobanking-portal"
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Banking & Core</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Neobanking Portal
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Full-stack corporate banking portal where finance teams issue cards and set team spend allowances.
                  </p>
                </Link>

                <Link
                  href="/products/bnpl"
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Lending Solutions</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    0% 3-Month BNPL
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Split card checkout transactions into 3 interest-free monthly installments automatically.
                  </p>
                </Link>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── SCENE 9: Flagship Final CTA ── */}
        <MotionScrollReveal3D>
          <section className="relative py-20 sm:py-28 bg-[#071A33] text-white overflow-hidden text-center">
            {/* Ambient lighting */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#155EEF]/20 blur-[140px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-blue-300 bg-blue-950/80 border border-blue-800">
                <CreditCard className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>ENTERPRISE CARD ISSUANCE PLATFORM</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                POWER EVERY PAYMENT{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                  WITH INTELLIGENT CARDS.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Issue virtual and physical debit & prepaid cards with granular spend controls and automated double-entry ledger integration.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-sm shadow-xl shadow-[#155EEF]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Launch LMS Card Manager</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/"
                  className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-md transition-all hover:scale-105"
                >
                  Back to Architecture Overview
                </Link>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── Regulatory Midnight Navy Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
