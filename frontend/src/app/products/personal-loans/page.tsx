'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Layers,
  Sparkles,
  Sliders,
  Activity,
  CheckCircle2,
  Users,
  Clock,
  HeartHandshake,
  DollarSign,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionScrollReveal3D } from '@/components/motion/MotionScrollReveal3D';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { SixtySecondHero3D } from '@/components/products/personal-loans/SixtySecondHero3D';
import { LifeDoesntWaitStories } from '@/components/products/personal-loans/LifeDoesntWaitStories';
import { FollowTheJourneySimulator } from '@/components/products/personal-loans/FollowTheJourneySimulator';
import { LoanAmountTenureVisual } from '@/components/products/personal-loans/LoanAmountTenureVisual';
import { LendingDecisionCore } from '@/components/products/personal-loans/LendingDecisionCore';
import { LendingClarityPillars } from '@/components/products/personal-loans/LendingClarityPillars';

export default function PersonalLoansSignaturePage() {
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
              <span className="text-slate-600 font-bold">Lending Solutions</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Personal Loans (Signature)</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: The 60-Second Journey 3D Hero ── */}
        <SixtySecondHero3D />

        {/* ── SCENE 2: Narrative Bridge — "When You Need It, Capital Moves" ── */}
        <MotionScrollReveal3D>
          <section className="relative py-20 bg-gradient-to-b from-[#EFF6FF] via-white to-white border-y border-slate-200/60">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>MOMENTUM & CLARITY</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight max-w-5xl mx-auto">
                No branch visits. No physical paperwork.{' '}
                <span className="bg-gradient-to-r from-[#155EEF] to-indigo-600 bg-clip-text text-transparent">
                  Just an intuitive digital lending flow designed for speed.
                </span>
              </h2>

              <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-4xl mx-auto">
                Adyapan Personal Loans connects borrowers directly to automated credit scoring engines and instant IMPS settlement rails. Experience radical transparency from identity verification to account disbursal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left max-w-[1360px] mx-auto">
                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-[#155EEF] uppercase">01 · Instant e-KYC</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Paperless Verification</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Verify identity securely via Digilocker consent and instant penny drop bank account verification.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-emerald-600 uppercase">02 · Automated Underwriting</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Algorithmic Scoring</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Evaluate cash flow stability and bureau tradelines in real time to generate tailored repayment terms.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase">03 · Instant Disbursal</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Direct Bank Credit</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Approved loan principal is credited directly to your primary bank account via instant IMPS clearing.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── SCENE 3: When Life Doesn't Wait Stories ── */}
        <MotionScrollReveal3D>
          <LifeDoesntWaitStories />
        </MotionScrollReveal3D>

        {/* ── SCENE 4: Follow The Money Simulated Journey ── */}
        <MotionScrollReveal3D>
          <FollowTheJourneySimulator />
        </MotionScrollReveal3D>

        {/* ── SCENE 5: Loan Amount & 3D Tenure Calculator ── */}
        <MotionScrollReveal3D>
          <LoanAmountTenureVisual />
        </MotionScrollReveal3D>

        {/* ── SCENE 6: Algorithmic Lending Decision Core ── */}
        <MotionScrollReveal3D>
          <LendingDecisionCore />
        </MotionScrollReveal3D>

        {/* ── SCENE 7: Radical Clarity & Borrower Trust Pillars ── */}
        <MotionScrollReveal3D>
          <LendingClarityPillars />
        </MotionScrollReveal3D>

        {/* ── SCENE 8: Product Ecosystem Cross-Navigation ── */}
        <MotionScrollReveal3D>
          <section className="relative py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#155EEF] font-mono">
                    Connected Lending Ecosystem
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#071A33] tracking-tight">
                    Explore Other Adyapan Lending Solutions
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
                  href="/products/sme-business-credit"
                  className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Lending Solutions</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-lg font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    SME Business Credit
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Working capital revolvers and GST invoice discounting lines for fast-growing enterprises.
                  </p>
                </Link>

                <Link
                  href="/products/bnpl"
                  className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Lending Solutions</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-lg font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    0% 3-Month BNPL
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Instant zero-interest checkout installment splits for merchant e-commerce portals.
                  </p>
                </Link>

                <Link
                  href="/products/home-mortgages"
                  className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Lending Solutions</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-lg font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Home Mortgages
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Long-term residential mortgage origination and property title verification infrastructure.
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

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 lg:px-12 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-blue-300 bg-blue-950/80 border border-blue-800">
                <HeartHandshake className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>PERSONAL LENDING PLATFORM</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                WHEN THE NEXT MOVE MATTERS,{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                  START THE JOURNEY.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
                Explore the Adyapan personal loan experience with transparent terms, zero hidden charges, and rapid digital settlement.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  href="/apply?purpose=Personal+Loans"
                  className="px-8 py-4 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-sm shadow-xl shadow-[#155EEF]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Check Eligibility & Apply Now</span>
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
