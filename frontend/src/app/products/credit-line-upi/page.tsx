'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';

// Signature Credit Line on UPI 13 Scenes
import { CreditLineHeroCore } from '@/components/products/credit-line-upi/CreditLineHeroCore';
import { PaymentsMovedFastProblem } from '@/components/products/credit-line-upi/PaymentsMovedFastProblem';
import { RevolvingCreditInstrument } from '@/components/products/credit-line-upi/RevolvingCreditInstrument';
import { FinancialRailJourney } from '@/components/products/credit-line-upi/FinancialRailJourney';
import { UpiTransactionConveyor } from '@/components/products/credit-line-upi/UpiTransactionConveyor';
import { RevolvingLifecycleCycle } from '@/components/products/credit-line-upi/RevolvingLifecycleCycle';
import { ExplodedLendingStack } from '@/components/products/credit-line-upi/ExplodedLendingStack';
import { PlatformCapabilityWall } from '@/components/products/credit-line-upi/PlatformCapabilityWall';
import { RiskControlShield } from '@/components/products/credit-line-upi/RiskControlShield';
import { EverydayMomentsShowcase } from '@/components/products/credit-line-upi/EverydayMomentsShowcase';
import { PartnerPlugInEngine } from '@/components/products/credit-line-upi/PartnerPlugInEngine';
import { FinancialControlDesk } from '@/components/products/credit-line-upi/FinancialControlDesk';
import { FinalCreditCoreCTA } from '@/components/products/credit-line-upi/FinalCreditCoreCTA';

export default function CreditLineUpiSignaturePage() {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* ── Global Navigation Bar ── */}
        <MotionNavbar />

        {/* ── Top Context Breadcrumb & Back Link ── */}
        <div className="pt-28 sm:pt-32 pb-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#155EEF] transition-colors py-1.5 px-3 rounded-full hover:bg-slate-100 border border-slate-200/80 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Financial Architecture</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Adyapan</span>
              <span>/</span>
              <span className="text-slate-600 font-bold">Lending Infrastructure</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Credit Line on UPI</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: Immersive 3D Credit Core Launch Hero ── */}
        <CreditLineHeroCore />

        {/* ── SCENE 2: The Problem (Traditional vs. Continuous UPI Rail) ── */}
        <PaymentsMovedFastProblem />

        {/* ── SCENE 3: The Revolving Credit Line Living Instrument ── */}
        <RevolvingCreditInstrument />

        {/* ── SCENE 4: 6-Chamber Financial Rail Journey ── */}
        <FinancialRailJourney />

        {/* ── SCENE 5: Draw Down on UPI Precision Conveyor ── */}
        <UpiTransactionConveyor />

        {/* ── SCENE 6: Perpetual Credit Lifecycle Engine ── */}
        <RevolvingLifecycleCycle />

        {/* ── SCENE 7: 7-Layer 3D Exploded Lending Stack ── */}
        <ExplodedLendingStack />

        {/* ── SCENE 8: 12-Cell Interactive Capability Wall ── */}
        <PlatformCapabilityWall />

        {/* ── SCENE 9: Risk + Control Transparent Shield ── */}
        <RiskControlShield />

        {/* ── SCENE 10: One Platform, Multiple Payment Moments ── */}
        <EverydayMomentsShowcase />

        {/* ── SCENE 11: Modular Partner Plug-in Infrastructure ── */}
        <PartnerPlugInEngine />

        {/* ── SCENE 12: Financial Operations Control Desk ── */}
        <FinancialControlDesk />

        {/* ── SCENE 13: Reconstructed Credit Core Closing & CTA ── */}
        <FinalCreditCoreCTA />

        {/* ── Global Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
