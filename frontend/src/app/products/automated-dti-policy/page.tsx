'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';

// The Financial X-Ray Signature Scenes
import { FinancialXRayHero } from '@/components/products/automated-dti-policy/FinancialXRayHero';
import { LayeredTypographicStatement } from '@/components/products/automated-dti-policy/LayeredTypographicStatement';
import { FinancialProfileDocument } from '@/components/products/automated-dti-policy/FinancialProfileDocument';
import { DtiMathematicalLayout } from '@/components/products/automated-dti-policy/DtiMathematicalLayout';
import { HorizontalThresholdInstrument } from '@/components/products/automated-dti-policy/HorizontalThresholdInstrument';
import { TechnicalRuleStrips } from '@/components/products/automated-dti-policy/TechnicalRuleStrips';
import { InteractivePolicyBuilder } from '@/components/products/automated-dti-policy/InteractivePolicyBuilder';
import { BureauXRayScanningChamber } from '@/components/products/automated-dti-policy/BureauXRayScanningChamber';
import { DigitalDecisionDocument } from '@/components/products/automated-dti-policy/DigitalDecisionDocument';
import { StackedPolicyVersions } from '@/components/products/automated-dti-policy/StackedPolicyVersions';
import { AutomationAlignmentSnap } from '@/components/products/automated-dti-policy/AutomationAlignmentSnap';
import { OperationalTelemetryWall } from '@/components/products/automated-dti-policy/OperationalTelemetryWall';
import { LendingStackSchematicStrip } from '@/components/products/automated-dti-policy/LendingStackSchematicStrip';
import { VerticalAuditTerminalStream } from '@/components/products/automated-dti-policy/VerticalAuditTerminalStream';
import { FinalXRayReconstructionCTA } from '@/components/products/automated-dti-policy/FinalXRayReconstructionCTA';

export default function AutomatedDtiPolicySignaturePage() {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-[#071A33] selection:bg-slate-900 selection:text-white relative overflow-x-hidden font-sans">
        {/* ── Global Navigation Bar ── */}
        <MotionNavbar />

        {/* ── Top Context Breadcrumb & Back Link ── */}
        <div className="pt-28 sm:pt-32 pb-4 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono font-bold text-slate-700 hover:text-black transition-colors py-1 px-3 border border-slate-300 shadow-xs uppercase tracking-wider"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Financial Architecture</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
              <span>Adyapan</span>
              <span>/</span>
              <span className="text-slate-700 font-bold">Lending Intelligence</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Automated DTI Policy</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: Full-Width Financial X-Ray Monitor Hero ── */}
        <FinancialXRayHero />

        {/* ── SCENE 2: Transparent Sliding Typographic Layers ── */}
        <LayeredTypographicStatement />

        {/* ── SCENE 3: Digital Underwriting Profile Document with Vertical Scan ── */}
        <FinancialProfileDocument />

        {/* ── SCENE 4: Iconic Mathematical Layout ── */}
        <DtiMathematicalLayout />

        {/* ── SCENE 5: Horizontal Threshold Measuring Instrument ── */}
        <HorizontalThresholdInstrument />

        {/* ── SCENE 6: Expandable Technical Rule Specifications ── */}
        <TechnicalRuleStrips />

        {/* ── SCENE 7: Declarative Policy Syntax Builder ── */}
        <InteractivePolicyBuilder />

        {/* ── SCENE 8: Dark Bureau X-Ray Diagnostic Film ── */}
        <BureauXRayScanningChamber />

        {/* ── SCENE 9: Stamped Digital Decision Document ── */}
        <DigitalDecisionDocument />

        {/* ── SCENE 10: Stacked Transparent Policy Versions ── */}
        <StackedPolicyVersions />

        {/* ── SCENE 11: Fragmented vs. Aligned Process Snap ── */}
        <AutomationAlignmentSnap />

        {/* ── SCENE 12: Industrial Operational Telemetry Wall ── */}
        <OperationalTelemetryWall />

        {/* ── SCENE 13: Architectural Schematic Circuit Strip ── */}
        <LendingStackSchematicStrip />

        {/* ── SCENE 14: Terminal Audit Stream ── */}
        <VerticalAuditTerminalStream />

        {/* ── SCENE 15: Fully Resolved Financial X-Ray Closing & CTA ── */}
        <FinalXRayReconstructionCTA />

        {/* ── Global Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
