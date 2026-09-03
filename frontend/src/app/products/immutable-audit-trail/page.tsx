'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';

// M2P Fintech-Inspired High-Density Infrastructure Suite
import { M2PStyleAuditHero } from '@/components/products/immutable-audit-trail/M2PStyleAuditHero';
import { OperationalMetricsRibbon } from '@/components/products/immutable-audit-trail/OperationalMetricsRibbon';
import { CoreAuditStackSuite } from '@/components/products/immutable-audit-trail/CoreAuditStackSuite';
import { BuiltForScaleGrid } from '@/components/products/immutable-audit-trail/BuiltForScaleGrid';
import { LiveAuditExplorerConsole } from '@/components/products/immutable-audit-trail/LiveAuditExplorerConsole';
import { RegulatoryComplianceMatrix } from '@/components/products/immutable-audit-trail/RegulatoryComplianceMatrix';
import { EnterpriseClosingCTA } from '@/components/products/immutable-audit-trail/EnterpriseClosingCTA';

export default function ImmutableAuditTrailPage() {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-white text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* ── Global Navigation Bar ── */}
        <MotionNavbar />

        {/* ── Top Context Breadcrumb & Back Link ── */}
        <div className="pt-24 sm:pt-28 pb-4 border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-[#155EEF] transition-colors py-1 px-3 border border-slate-200 rounded-md bg-slate-50 hover:bg-white shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Products</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Adyapan</span>
              <span>/</span>
              <span>Compliance &amp; Infrastructure</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Immutable Audit Trail</span>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: High-Density Split Hero Console ── */}
        <M2PStyleAuditHero />

        {/* ── SECTION 2: Full-Width 6-Metric Scale Ribbon ── */}
        <OperationalMetricsRibbon />

        {/* ── SECTION 3: 6 Numbered Capability Deep-Dives with AI & System Agents ── */}
        <CoreAuditStackSuite />

        {/* ── SECTION 4: Built for Speed, Scale & Intelligence 4-Quadrant Grid ── */}
        <BuiltForScaleGrid />

        {/* ── SECTION 5: Live Operational Audit Explorer & Query Console ── */}
        <LiveAuditExplorerConsole />

        {/* ── SECTION 6: Statutory Regulatory Compliance & Evidence Matrix ── */}
        <RegulatoryComplianceMatrix />

        {/* ── SECTION 7: High-Impact Enterprise Closing Call-to-Action ── */}
        <EnterpriseClosingCTA />

        {/* ── Global Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
