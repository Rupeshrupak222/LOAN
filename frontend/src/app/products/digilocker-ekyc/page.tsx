'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';

// Modular DigiLocker e-KYC Sections
import { DigitalDocumentHero } from '@/components/products/digilocker/DigitalDocumentHero';
import { BeforeAfterTransformation } from '@/components/products/digilocker/BeforeAfterTransformation';
import { HorizontalFlowLine } from '@/components/products/digilocker/HorizontalFlowLine';
import { IllustrativeConsentCard } from '@/components/products/digilocker/IllustrativeConsentCard';
import { InteractiveDocumentSurface } from '@/components/products/digilocker/InteractiveDocumentSurface';
import { SimulatedVerificationPanel } from '@/components/products/digilocker/SimulatedVerificationPanel';
import { DocumentCategorySelector } from '@/components/products/digilocker/DocumentCategorySelector';
import { LendingOnboardingPipeline } from '@/components/products/digilocker/LendingOnboardingPipeline';
import { ControlledWorkflowAndTrust } from '@/components/products/digilocker/ControlledWorkflowAndTrust';
import { InteractiveDemoAndClosing } from '@/components/products/digilocker/InteractiveDemoAndClosing';

export default function DigilockerEkycSignaturePage() {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* ── Fixed Editorial Navigation Bar ── */}
        <MotionNavbar />

        {/* ── Top Context Breadcrumb & Back Link ── */}
        <div className="pt-24 sm:pt-28 pb-4 border-b border-slate-100 bg-slate-50/70">
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
              <span className="text-slate-600 font-bold">AI Risk & Compliance</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">DigiLocker e-KYC (Signature)</span>
            </div>
          </div>
        </div>

        {/* ── Main Content Body (10 Structured Editorial Sections) ── */}
        <main className="w-full">
          {/* Section 1: Hero with 3D Abstract Digital Document */}
          <DigitalDocumentHero />

          {/* Section 2: Before / After Minimalist Line Transformation */}
          <BeforeAfterTransformation />

          {/* Section 3: The 5-Stage Primary Flow Line */}
          <HorizontalFlowLine />

          {/* Section 4: Illustrative Consent Experience */}
          <IllustrativeConsentCard />

          {/* Section 5: Tactile Digital Document Surface (Interactive Drag) */}
          <InteractiveDocumentSurface />

          {/* Section 6: Automated Verification Simulation Console */}
          <SimulatedVerificationPanel />

          {/* Section 7: Supported Document Categories (Clean Horizontal Selector) */}
          <DocumentCategorySelector />

          {/* Section 8: Lending Journey Onboarding Pipeline */}
          <LendingOnboardingPipeline />

          {/* Section 9: Controlled Architecture & Dark Trust Core */}
          <ControlledWorkflowAndTrust />

          {/* Section 10: Live Sandbox Demo & Clean Final Hero */}
          <InteractiveDemoAndClosing />
        </main>

        {/* ── Global Editorial Fintech Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
