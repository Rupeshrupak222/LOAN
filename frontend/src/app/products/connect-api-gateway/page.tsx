'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  Layers,
  Sparkles,
  Sliders,
  Activity,
  CheckCircle2,
  Users,
  Server,
  Cpu,
  Globe,
  Lock,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionScrollReveal3D } from '@/components/motion/MotionScrollReveal3D';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { ApiBridgeHero3D } from '@/components/products/connect-api/ApiBridgeHero3D';
import { ConnectOnceMatrix } from '@/components/products/connect-api/ConnectOnceMatrix';
import { FollowRequestJourney } from '@/components/products/connect-api/FollowRequestJourney';
import { ApiTrafficStreamVisual } from '@/components/products/connect-api/ApiTrafficStreamVisual';
import { GatewaySecurityShell } from '@/components/products/connect-api/GatewaySecurityShell';
import { PayloadTransformerVisual } from '@/components/products/connect-api/PayloadTransformerVisual';
import { GatewayCapabilitiesCascade } from '@/components/products/connect-api/GatewayCapabilitiesCascade';

export default function ConnectApiGatewaySignaturePage() {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* ── Global 3D Navigation Bar ── */}
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
              <span className="text-slate-600 font-bold">Banking & Core</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Connect API Gateway (Signature)</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: The 3D API Bridge Hero ── */}
        <ApiBridgeHero3D />

        {/* ── SCENE 2: Narrative Bridge — "One Gateway. Every Connection." ── */}
        <MotionScrollReveal3D>
          <section className="relative py-20 bg-gradient-to-b from-[#EFF6FF] via-white to-white border-y border-slate-200/60">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>UNIFIED INTEGRATION LAYER</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight max-w-5xl mx-auto">
                One integration layer.{' '}
                <span className="bg-gradient-to-r from-[#155EEF] to-indigo-600 bg-clip-text text-transparent">
                  Unlimited financial services and applications.
                </span>
              </h2>

              <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-4xl mx-auto">
                Stop managing fragmented point-to-point connections. Connect API Gateway delivers a centralized, highly secure bridge for authentication, strict payload validation, protocol translation, and high-speed routing.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left max-w-[1360px] mx-auto">
                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-[#155EEF] uppercase">01 · Zero Overhead</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Sub-10ms Ingress</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Ultra-fast non-blocking event loops ensure requests pass through security, rate limits, and transformation in single-digit milliseconds.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-emerald-600 uppercase">02 · Financial Safety</span>
                  <h3 className="text-lg font-bold text-[#071A33]">Atomic Idempotency</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Redis cluster-backed lock state prevents double charges and duplicate disbursements across all network retries.
                  </p>
                </div>

                <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <span className="text-xs font-mono font-bold text-indigo-600 uppercase">03 · Wire Mesh</span>
                  <h3 className="text-lg font-bold text-[#071A33]">REST & gRPC Mesh</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Expose standardized OpenAPI 3.0 REST endpoints to web/mobile clients while orchestrating internal microservices via binary gRPC.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── SCENE 3: Connect Once Matrix ── */}
        <MotionScrollReveal3D>
          <ConnectOnceMatrix />
        </MotionScrollReveal3D>

        {/* ── SCENE 4: Follow The Request Journey ── */}
        <MotionScrollReveal3D>
          <FollowRequestJourney />
        </MotionScrollReveal3D>

        {/* ── SCENE 5: Real-Time API Traffic Stream ── */}
        <MotionScrollReveal3D>
          <ApiTrafficStreamVisual />
        </MotionScrollReveal3D>

        {/* ── SCENE 6: Zero-Trust Security Shell ── */}
        <MotionScrollReveal3D>
          <GatewaySecurityShell />
        </MotionScrollReveal3D>

        {/* ── SCENE 7: Bidirectional Payload Transformation ── */}
        <MotionScrollReveal3D>
          <PayloadTransformerVisual />
        </MotionScrollReveal3D>

        {/* ── SCENE 8: Deep 3D Cascading Capabilities ── */}
        <MotionScrollReveal3D>
          <GatewayCapabilitiesCascade />
        </MotionScrollReveal3D>

        {/* ── SCENE 9: Product Ecosystem Cross-Navigation ── */}
        <MotionScrollReveal3D>
          <section className="relative py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#155EEF] font-mono">
                    Connected Product Ecosystem
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#071A33] tracking-tight">
                    Modules Powered by the Connect API Gateway
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
                  href="/products/core-banking-engine"
                  className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs hover:shadow-xl hover:border-[#155EEF] transition-all group block space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Banking & Core</span>
                    <ArrowRight className="w-4 h-4 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                  </div>
                  <h4 className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                    Core Banking Engine
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The atomic double-entry ledger that processes mutations dispatched through the gateway.
                  </p>
                </Link>

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
                    Card issuance and real-time authorization webhooks routed via the gateway security layer.
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
                    The enterprise command center user interface consuming gateway endpoints for cash flow management.
                  </p>
                </Link>
              </div>
            </div>
          </section>
        </MotionScrollReveal3D>

        {/* ── SCENE 10: Flagship Final CTA ── */}
        <MotionScrollReveal3D>
          <section className="relative py-20 sm:py-28 bg-[#071A33] text-white overflow-hidden text-center">
            {/* Ambient lighting */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#155EEF]/20 blur-[140px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-blue-300 bg-blue-950/80 border border-blue-800">
                <Cpu className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>ENTERPRISE API INFRASTRUCTURE</span>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                CONNECT YOUR FINANCIAL INFRASTRUCTURE{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-teal-300 bg-clip-text text-transparent">
                  WITH ONE RESILIENT API.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Empower your development teams with sub-10ms latency, zero-trust cryptographic security, and unified financial connectivity.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-sm shadow-xl shadow-[#155EEF]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span>Launch LMS Developer Portal</span>
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
