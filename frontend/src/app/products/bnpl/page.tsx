'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Split,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionScrollReveal3D } from '@/components/motion/MotionScrollReveal3D';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { PurchaseObjectHero3D } from '@/components/products/bnpl/PurchaseObjectHero3D';
import { PurchaseSplitLayers } from '@/components/products/bnpl/PurchaseSplitLayers';
import { InteractiveCheckoutSplitter } from '@/components/products/bnpl/InteractiveCheckoutSplitter';
import { PaymentTimelineTunnel } from '@/components/products/bnpl/PaymentTimelineTunnel';
import { PurchaseMagnitudeContrast } from '@/components/products/bnpl/PurchaseMagnitudeContrast';
import { ResponsiblePlanningReview } from '@/components/products/bnpl/ResponsiblePlanningReview';
import { DigitalPaymentSeal } from '@/components/products/bnpl/DigitalPaymentSeal';
import { ContinuousPurchaseJourney } from '@/components/products/bnpl/ContinuousPurchaseJourney';
import { FinalRecombinationCTA } from '@/components/products/bnpl/FinalRecombinationCTA';

export default function BnplSignaturePage() {
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
              <span className="text-[#155EEF] font-bold">0% 3-Month BNPL (Signature)</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: The Purchase Object 3D Hero ── */}
        <PurchaseObjectHero3D />

        {/* ── SCENE 2: One Purchase. Three Moments. (Spatial Connected Layers) ── */}
        <MotionScrollReveal3D>
          <PurchaseSplitLayers />
        </MotionScrollReveal3D>

        {/* ── SCENE 3: The Checkout Moment Splitter ── */}
        <MotionScrollReveal3D>
          <InteractiveCheckoutSplitter />
        </MotionScrollReveal3D>

        {/* ── SCENE 4: Three Payments. One Finish Line. (Timeline Pathway) ── */}
        <MotionScrollReveal3D>
          <PaymentTimelineTunnel />
        </MotionScrollReveal3D>

        {/* ── SCENE 5: Big Purchase. Smaller Planned Moments. (Contrast Engine) ── */}
        <MotionScrollReveal3D>
          <PurchaseMagnitudeContrast />
        </MotionScrollReveal3D>

        {/* ── SCENE 6: Responsible BNPL Planning Review ── */}
        <MotionScrollReveal3D>
          <ResponsiblePlanningReview />
        </MotionScrollReveal3D>

        {/* ── SCENE 7: Digital Payment Verification Seal ── */}
        <MotionScrollReveal3D>
          <DigitalPaymentSeal />
        </MotionScrollReveal3D>

        {/* ── SCENE 8: The Continuous Purchase Journey ── */}
        <MotionScrollReveal3D>
          <ContinuousPurchaseJourney />
        </MotionScrollReveal3D>

        {/* ── SCENE 9: Product Ecosystem Cross-Navigation ── */}
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
                    Working capital revolving lines that breathe with your sales velocity and inventory replenishment cycles.
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
                    Home Mortgages (8.5%*)
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Long-tenure low EMI architectural home financing designed around 30-year affordability horizons.
                  </p>
                </Link>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── SCENE 10: Ready to Split the Purchase? Final Payoff CTA ── */}
        <MotionScrollReveal3D>
          <FinalRecombinationCTA />
        </MotionScrollReveal3D>

        {/* ── Regulatory Midnight Navy Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
