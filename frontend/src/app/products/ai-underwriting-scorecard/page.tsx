'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';

// Modular AI Underwriting Scorecard 3D Sections
import { ScorecardHero3D } from '@/components/products/scorecard/ScorecardHero3D';
import { FinancialDimensions3D } from '@/components/products/scorecard/FinancialDimensions3D';
import { FourPillarScorecard3D } from '@/components/products/scorecard/FourPillarScorecard3D';
import { SignalTransformationStrips3D } from '@/components/products/scorecard/SignalTransformationStrips3D';
import { DecisionLens3D } from '@/components/products/scorecard/DecisionLens3D';
import { RiskLandscape3D } from '@/components/products/scorecard/RiskLandscape3D';
import { PolicyMeetsProfile3D } from '@/components/products/scorecard/PolicyMeetsProfile3D';
import { InteractiveScorecardDemo3D } from '@/components/products/scorecard/InteractiveScorecardDemo3D';
import { DecisionExplainability3D } from '@/components/products/scorecard/DecisionExplainability3D';
import { LendingStackIntegration3D } from '@/components/products/scorecard/LendingStackIntegration3D';
import { ScorecardClosingCTA3D } from '@/components/products/scorecard/ScorecardClosingCTA3D';

export default function AiUnderwritingScorecardPage() {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* Fixed Editorial Navigation Bar */}
        <MotionNavbar />

        {/* Context Breadcrumb & Back Link */}
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
              <span className="text-[#155EEF] font-bold">AI Underwriting Scorecard</span>
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <main className="w-full">
          {/* Section 01: Hero with The Financial Portrait 3D sheet */}
          <ScorecardHero3D />

          {/* Section 02: One Number Isn't The Whole Story */}
          <FinancialDimensions3D />

          {/* Section 03: Four Signals. One Clearer View. */}
          <FourPillarScorecard3D />

          {/* Section 04: From Raw Signals to Lending Insight */}
          <SignalTransformationStrips3D />

          {/* Section 05: The Decision Lens (Optical Context Metaphor) */}
          <DecisionLens3D />

          {/* Section 06: See the Shape of Risk */}
          <RiskLandscape3D />

          {/* Section 07: Intelligence Meets Policy (Profile + Policy Convergence) */}
          <PolicyMeetsProfile3D />

          {/* Section 08: Run the Scorecard (Interactive Demo) */}
          <InteractiveScorecardDemo3D />

          {/* Section 09: A Decision Should Be Understandable (Explainability) */}
          <DecisionExplainability3D />

          {/* Section 10: Built for the Lending Stack Pipeline */}
          <LendingStackIntegration3D />

          {/* Section 11: Final Transformation & Closing CTA */}
          <ScorecardClosingCTA3D />
        </main>

        {/* Canonical Fintech Footer */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
