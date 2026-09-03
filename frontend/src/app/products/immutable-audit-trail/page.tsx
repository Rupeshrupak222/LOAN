'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';

// The Record That Cannot Be Rewritten Signature Scenes
import { AuditRoomHero } from '@/components/products/immutable-audit-trail/AuditRoomHero';
import { TamperDetectionStatement } from '@/components/products/immutable-audit-trail/TamperDetectionStatement';
import { AppendOnlyLedgerStrip } from '@/components/products/immutable-audit-trail/AppendOnlyLedgerStrip';
import { RecordAnatomyDocument } from '@/components/products/immutable-audit-trail/RecordAnatomyDocument';
import { LiveChronologyClock } from '@/components/products/immutable-audit-trail/LiveChronologyClock';
import { LiveAuditFeedStream } from '@/components/products/immutable-audit-trail/LiveAuditFeedStream';
import { InteractiveIntegrityVerifier } from '@/components/products/immutable-audit-trail/InteractiveIntegrityVerifier';
import { TamperSimulationSandbox } from '@/components/products/immutable-audit-trail/TamperSimulationSandbox';
import { ForensicCaseHistory } from '@/components/products/immutable-audit-trail/ForensicCaseHistory';
import { ArchiveFilterTabs } from '@/components/products/immutable-audit-trail/ArchiveFilterTabs';
import { ArchiveSearchConsole } from '@/components/products/immutable-audit-trail/ArchiveSearchConsole';
import { ComplianceContextMatrix } from '@/components/products/immutable-audit-trail/ComplianceContextMatrix';
import { AuditInfrastructureSchematic } from '@/components/products/immutable-audit-trail/AuditInfrastructureSchematic';
import { OperationalVolumeCounter } from '@/components/products/immutable-audit-trail/OperationalVolumeCounter';
import { ForensicAuditConsole } from '@/components/products/immutable-audit-trail/ForensicAuditConsole';
import { StackedVersionSheets } from '@/components/products/immutable-audit-trail/StackedVersionSheets';
import { FinalArchiveWallCTA } from '@/components/products/immutable-audit-trail/FinalArchiveWallCTA';

export default function ImmutableAuditTrailSignaturePage() {
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
              <span className="text-slate-700 font-bold">Compliance & Governance</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Immutable Audit Trail</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: Full-Screen Audit Room & Massive Digital Record Hero ── */}
        <AuditRoomHero />

        {/* ── SCENE 2: The Past Should Stay The Past (Tamper Detection) ── */}
        <TamperDetectionStatement />

        {/* ── SCENE 3: Continuous Append-Only Ledger Strip ── */}
        <AppendOnlyLedgerStrip />

        {/* ── SCENE 4: Record Anatomy 10-Field Document ── */}
        <RecordAnatomyDocument />

        {/* ── SCENE 5: Live Chronology Clock & Synchronized Timestamps ── */}
        <LiveChronologyClock />

        {/* ── SCENE 6: Streaming Operational Audit Feed ── */}
        <LiveAuditFeedStream />

        {/* ── SCENE 7: Interactive Integrity Verification Bench ── */}
        <InteractiveIntegrityVerifier />

        {/* ── SCENE 8: Interactive Tamper Simulation Sandbox ── */}
        <TamperSimulationSandbox />

        {/* ── SCENE 9: Forensic Case Lifecycle Dossier ── */}
        <ForensicCaseHistory />

        {/* ── SCENE 10: Editorial Archive Filter Tabs ── */}
        <ArchiveFilterTabs />

        {/* ── SCENE 11: Forensic Query Search Console ── */}
        <ArchiveSearchConsole />

        {/* ── SCENE 12: Compliance Context Matrix ── */}
        <ComplianceContextMatrix />

        {/* ── SCENE 13: Audit Infrastructure Layer Schematic ── */}
        <AuditInfrastructureSchematic />

        {/* ── SCENE 14: Operational Volume Throughput Counter ── */}
        <OperationalVolumeCounter />

        {/* ── SCENE 15: Forensic Audit Operations Console ── */}
        <ForensicAuditConsole />

        {/* ── SCENE 16: Stacked Version Revision Sheets ── */}
        <StackedVersionSheets />

        {/* ── SCENE 17: Canonical Record Re-anchor & Closing CTAs ── */}
        <FinalArchiveWallCTA />

        {/* ── Global Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
