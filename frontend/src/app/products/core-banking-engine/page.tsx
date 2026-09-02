'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Database,
  RefreshCw,
  Lock,
  Cpu,
  CheckCircle2,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionScrollReveal3D } from '@/components/motion/MotionScrollReveal3D';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { LivingCoreHero3D } from '@/components/products/core-banking/LivingCoreHero3D';
import { FollowTransactionEngine } from '@/components/products/core-banking/FollowTransactionEngine';
import { LiveLedgerStream } from '@/components/products/core-banking/LiveLedgerStream';
import { CoreArchitectureMatrix } from '@/components/products/core-banking/CoreArchitectureMatrix';
import { CoreCapabilitiesEditorial } from '@/components/products/core-banking/CoreCapabilitiesEditorial';

export default function CoreBankingEngineSignaturePage() {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* ── Master Global 3D Navigation Bar ── */}
        <MotionNavbar />

        {/* ── Top Context Breadcrumb & Back Link ── */}
        <div className="pt-28 sm:pt-32 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
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
              <span className="text-slate-600 font-bold">Banking & Core</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Core Banking Engine (Signature)</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: Living 3D Financial Core Hero ── */}
        <LivingCoreHero3D />

        {/* ── SCENE 2: Narrative Bridge — "Every Account Has A State. Every Movement A Ledger Event." ── */}
        <MotionScrollReveal3D>
          <section className="relative py-20 bg-gradient-to-b from-[#EFF6FF] via-white to-white border-y border-slate-200/60">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>ZERO-DRIFT FINANCIAL INVARIANTS</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-tight">
                Every account has an exact state.{' '}
                <span className="bg-gradient-to-r from-[#155EEF] to-indigo-600 bg-clip-text text-transparent">
                  Every financial movement becomes an immutable ledger event.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
                Unlike legacy core systems that rely on batch-processed approximations, Adyapan enforces mathematical double-entry equality before any balance update is committed to storage.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-left">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-mono font-bold text-[#155EEF] uppercase">01 · Precision Math</span>
                  <h3 className="text-base font-bold text-[#071A33]">Exact NUMERIC(14,2)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Zero floating-point rounding errors across millions of concurrent credit and debit ledger entries.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-mono font-bold text-emerald-600 uppercase">02 · Atomic Latency</span>
                  <h3 className="text-base font-bold text-[#071A33]">Sub-10ms Commit SLA</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Optimized PostgreSQL transaction isolation ensuring sub-10ms commit finality under peak retail loads.
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-2">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase">03 · Zero Reconciliation Drift</span>
                  <h3 className="text-base font-bold text-[#071A33]">Continuous EOD Balance</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Automated continuous reconciliation eliminating manual spreadsheet adjustments during day-end clearing.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── SCENE 3: Interactive Follow-A-Transaction Step-Through ── */}
        <MotionScrollReveal3D>
          <FollowTransactionEngine />
        </MotionScrollReveal3D>

        {/* ── SCENE 4: Live Simulated Double-Entry Ledger Stream ── */}
        <MotionScrollReveal3D>
          <LiveLedgerStream />
        </MotionScrollReveal3D>

        {/* ── SCENE 5: Four-Layer Financial Stack Matrix ── */}
        <MotionScrollReveal3D>
          <CoreArchitectureMatrix />
        </MotionScrollReveal3D>

        {/* ── SCENE 6: Editorial Enterprise Capabilities ── */}
        <MotionScrollReveal3D>
          <CoreCapabilitiesEditorial />
        </MotionScrollReveal3D>

        {/* ── SCENE 7: Product Ecosystem Cross-Navigation ── */}
        <MotionScrollReveal3D>
          <section className="relative py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#155EEF] font-mono">
                    Connected Product Ecosystem
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#071A33] tracking-tight">
                    Capabilities That Connect Into the Core
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
                  href="/products/debit-prepaid-cards"
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Banking & Core</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Debit & Prepaid Cards
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Virtual & physical card issuance API linked directly to core banking account ledgers.
                  </p>
                </Link>

                <Link
                  href="/products/neobanking-portal"
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Banking & Core</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Neobanking Portal
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Full-stack digital SME banking front door with automated tax vaults and Tally ERP sync.
                  </p>
                </Link>

                <Link
                  href="/products/connect-api-gateway"
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Banking & Core</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Connect API Gateway
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    REST & gRPC interfaces for financial workflows, payroll, and real-time ledger access.
                  </p>
                </Link>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── SCENE 8: Flagship Final CTA ── */}
        <MotionScrollReveal3D>
          <section className="relative py-20 sm:py-28 bg-[#071A33] text-white overflow-hidden text-center">
            {/* Ambient lighting */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#155EEF]/20 blur-[140px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-blue-300 bg-blue-950/80 border border-blue-800">
                <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>ENTERPRISE CORE INFRASTRUCTURE</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                BUILD ON A FINANCIAL CORE{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                  DESIGNED FOR WHAT COMES NEXT.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Bring accounts, transactions, double-entry ledgers, and settlement into one unified financial operating layer.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-sm shadow-xl shadow-[#155EEF]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Explore Adyapan LMS Suite</span>
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
