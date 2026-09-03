'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sliders,
  Scale,
  FileText,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionScrollReveal3D } from '@/components/motion/MotionScrollReveal3D';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { CurrencyDiscHero3D } from '@/components/products/cross-border/CurrencyDiscHero3D';
import { PrecisionAmountOdometer } from '@/components/products/cross-border/PrecisionAmountOdometer';
import { MechanicalFxChamber } from '@/components/products/cross-border/MechanicalFxChamber';
import { OscillatingFxRibbon } from '@/components/products/cross-border/OscillatingFxRibbon';
import { PrecisionBalanceMechanism } from '@/components/products/cross-border/PrecisionBalanceMechanism';
import { DigitalInstructionSheet } from '@/components/products/cross-border/DigitalInstructionSheet';
import { MechanicalSettlementLock } from '@/components/products/cross-border/MechanicalSettlementLock';
import { DestinationCurrencyReveal } from '@/components/products/cross-border/DestinationCurrencyReveal';
import { FinancialWorkbench } from '@/components/products/cross-border/FinancialWorkbench';
import { FinalCurrencyCTA } from '@/components/products/cross-border/FinalCurrencyCTA';

export default function CrossBorderWireSignaturePage() {
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
              <span className="text-slate-600 font-bold">Payments & Settlement</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Cross-Border Wire (Signature)</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: The Currency Disc 3D Hero ── */}
        <CurrencyDiscHero3D />

        {/* ── SCENE 2: Start with the Value (Mechanical Amount Odometer) ── */}
        <MotionScrollReveal3D>
          <PrecisionAmountOdometer />
        </MotionScrollReveal3D>

        {/* ── SCENE 3: Then the Value Changes Form (Hero FX Chamber) ── */}
        <MotionScrollReveal3D>
          <MechanicalFxChamber />
        </MotionScrollReveal3D>

        {/* ── SCENE 4: The Rate Has a Story (3D Metallic Ribbon) ── */}
        <MotionScrollReveal3D>
          <OscillatingFxRibbon />
        </MotionScrollReveal3D>

        {/* ── SCENE 5: Precision Matters (Two-Sided Balance Mechanism) ── */}
        <MotionScrollReveal3D>
          <PrecisionBalanceMechanism />
        </MotionScrollReveal3D>

        {/* ── SCENE 6: The Payment Instruction (Signed Structured Sheet) ── */}
        <MotionScrollReveal3D>
          <DigitalInstructionSheet />
        </MotionScrollReveal3D>

        {/* ── SCENE 7: Settlement Lock (Precision Mechanical Click) ── */}
        <MotionScrollReveal3D>
          <MechanicalSettlementLock />
        </MotionScrollReveal3D>

        {/* ── SCENE 8: One Value. A Different Currency. (Final Disc Reveal) ── */}
        <MotionScrollReveal3D>
          <DestinationCurrencyReveal />
        </MotionScrollReveal3D>

        {/* ── SCENE 9: The Financial Workbench (Instrument Panel) ── */}
        <MotionScrollReveal3D>
          <FinancialWorkbench />
        </MotionScrollReveal3D>

        {/* ── SCENE 10: Product Ecosystem Cross-Navigation ── */}
        <MotionScrollReveal3D>
          <section className="relative py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#155EEF] font-mono">
                    Connected Settlement Ecosystem
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
                  href="/products/npci-upi-network"
                  className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Payments & Settlement</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-lg font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    NPCI UPI Network
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Direct interbank UPI switching, sub-second routing, automated e-Mandates, and high-throughput NACH batching.
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

                <Link
                  href="/products/core-banking-engine"
                  className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Banking & Core</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-lg font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Core Banking Engine
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Real-time double-entry general ledger, automated interest accrual, and sub-millisecond transaction settlements.
                  </p>
                </Link>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── SCENE 11: Ready to Move Value Across Currencies? (Final Payoff CTA) ── */}
        <MotionScrollReveal3D>
          <FinalCurrencyCTA />
        </MotionScrollReveal3D>

        {/* ── Regulatory Midnight Navy Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
