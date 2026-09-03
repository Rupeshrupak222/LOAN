'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  TrendingUp,
  Sparkles,
  Sliders,
  Activity,
  CheckCircle2,
  Package,
  ShoppingCart,
  Store,
  Factory,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionScrollReveal3D } from '@/components/motion/MotionScrollReveal3D';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { BusinessGrowthHero3D } from '@/components/products/sme-business-credit/BusinessGrowthHero3D';
import { SupplyToCustomerStream } from '@/components/products/sme-business-credit/SupplyToCustomerStream';
import { DemandScenarioSimulator } from '@/components/products/sme-business-credit/DemandScenarioSimulator';
import { InteractiveGrowthExpander } from '@/components/products/sme-business-credit/InteractiveGrowthExpander';
import { CreditControlConsole } from '@/components/products/sme-business-credit/CreditControlConsole';
import { BusinessScenariosMatrix } from '@/components/products/sme-business-credit/BusinessScenariosMatrix';

export default function SmeBusinessCreditSignaturePage() {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* ── Global Navigation Bar ── */}
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
              <span className="text-[#155EEF] font-bold">SME Business Credit (Signature)</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: The Business Growth Engine 3D Hero ── */}
        <BusinessGrowthHero3D />

        {/* ── SCENE 2: Narrative Bridge — "Capital That Moves With The Business" ── */}
        <MotionScrollReveal3D>
          <section className="relative py-20 bg-gradient-to-b from-[#EFF6FF] via-white to-white border-y border-slate-200/60">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>DYNAMIC REVOLVING LIQUIDITY</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight max-w-5xl mx-auto">
                No rigid fixed installments.{' '}
                <span className="bg-gradient-to-r from-[#155EEF] to-indigo-600 bg-clip-text text-transparent">
                  Revolving credit that breathes with your cash flow.
                </span>
              </h2>

              <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-4xl mx-auto">
                Adyapan SME Business Credit provides an active credit revolver connected directly to your GST turnover and merchant settlement accounts. Draw funds to purchase bulk stock, pay interest only on utilized capital, and replenish the line seamlessly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left max-w-[1360px] mx-auto">
                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-[#155EEF] uppercase">01 · Zero Idle Interest</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Daily Calculated Interest</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Unlike standard term loans, you only incur interest for the exact days funds are drawn down. Unused credit sits at ₹0 cost.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-emerald-600 uppercase">02 · Automated Replenishment</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Continuous Line Top-Up</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Customer collections and invoice settlements flow directly to reduce the principal, immediately restoring your available credit.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase">03 · Seamless GST Underwriting</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Sub-Minute Approval</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Automated bank statement parsing and GSTR-3B revenue verification eliminate months of manual branch underwriting.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── SCENE 3: Supply Chain & Working Capital Flow ── */}
        <MotionScrollReveal3D>
          <SupplyToCustomerStream />
        </MotionScrollReveal3D>

        {/* ── SCENE 4: Real-Time Demand Scenarios (Low / Normal / Surge) ── */}
        <MotionScrollReveal3D>
          <DemandScenarioSimulator />
        </MotionScrollReveal3D>

        {/* ── SCENE 5: Signature "Grow the Business" Transformation Deck ── */}
        <MotionScrollReveal3D>
          <InteractiveGrowthExpander />
        </MotionScrollReveal3D>

        {/* ── SCENE 6: Revolving Line Credit Controller ── */}
        <MotionScrollReveal3D>
          <CreditControlConsole />
        </MotionScrollReveal3D>

        {/* ── SCENE 7: 5 Spatial Business Scenarios ── */}
        <MotionScrollReveal3D>
          <BusinessScenariosMatrix />
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
                    Explore Other Adyapan Architecture Solutions
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
                  href="/products/personal-loans"
                  className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Lending Solutions</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-lg font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Personal Loans (60-Second)
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Paperless consumer lending with automated algorithmic underwriting and sub-minute IMPS bank clearing.
                  </p>
                </Link>

                <Link
                  href="/products/neobanking-portal"
                  className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Banking & Core</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-lg font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Neobanking Portal
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Unified multi-entity treasury visibility, automated GST tax reserves, and multi-sign approval policies.
                  </p>
                </Link>

                <Link
                  href="/products/connect-api-gateway"
                  className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Banking & Core</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-lg font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Connect API Gateway
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Unified enterprise integration layer for high-speed protocol translation, tokenization, and wire routing.
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
                <Store className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>BUSINESS GROWTH PLATFORM</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                WHEN YOUR BUSINESS IS READY TO GROW,{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-300 bg-clip-text text-transparent">
                  UNLOCK YOUR CREDIT REVOLVER.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
                Explore the Adyapan SME Business Credit facility with transparent daily holding costs, zero prepayment penalties, and automated renewal cycles.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-sm shadow-xl shadow-[#155EEF]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Apply via LMS Workspace</span>
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
