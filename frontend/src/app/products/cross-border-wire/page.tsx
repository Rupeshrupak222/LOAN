'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Globe,
  Compass,
  Layers,
  Sparkles,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionScrollReveal3D } from '@/components/motion/MotionScrollReveal3D';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { PlanetaryOriginHero3D } from '@/components/products/cross-border/PlanetaryOriginHero3D';
import { OriginTransactionCapsule } from '@/components/products/cross-border/OriginTransactionCapsule';
import { BorderCrossingArc } from '@/components/products/cross-border/BorderCrossingArc';
import { CurrencyTransformationChamber } from '@/components/products/cross-border/CurrencyTransformationChamber';
import { InvisibleRoutingCorridor } from '@/components/products/cross-border/InvisibleRoutingCorridor';
import { SwiftDualJourney } from '@/components/products/cross-border/SwiftDualJourney';
import { SettlementPrecisionPlane } from '@/components/products/cross-border/SettlementPrecisionPlane';
import { DestinationArrival } from '@/components/products/cross-border/DestinationArrival';
import { MacroGlobalPerspective } from '@/components/products/cross-border/MacroGlobalPerspective';
import { FinalPlanetaryCTA } from '@/components/products/cross-border/FinalPlanetaryCTA';

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

        {/* ── SCENE 1: The World is the Interface 3D Planetary Hero ── */}
        <PlanetaryOriginHero3D />

        {/* ── SCENE 2: Every Journey Starts Somewhere (Origin Transaction Capsule) ── */}
        <MotionScrollReveal3D>
          <OriginTransactionCapsule />
        </MotionScrollReveal3D>

        {/* ── SCENE 3: Then the Money Crosses a Border (3D Flight Arc) ── */}
        <MotionScrollReveal3D>
          <BorderCrossingArc />
        </MotionScrollReveal3D>

        {/* ── SCENE 4: The Currency Transformation Chamber (Precision FX Engine) ── */}
        <MotionScrollReveal3D>
          <CurrencyTransformationChamber />
        </MotionScrollReveal3D>

        {/* ── SCENE 5: The Invisible Corridor (High-Speed Infrastructure Tunnel) ── */}
        <MotionScrollReveal3D>
          <InvisibleRoutingCorridor />
        </MotionScrollReveal3D>

        {/* ── SCENE 6: The Message Travels with the Money (Dual Stream) ── */}
        <MotionScrollReveal3D>
          <SwiftDualJourney />
        </MotionScrollReveal3D>

        {/* ── SCENE 7: The Settlement Precision Plane ── */}
        <MotionScrollReveal3D>
          <SettlementPrecisionPlane />
        </MotionScrollReveal3D>

        {/* ── SCENE 8: Destination Arrival & Finality ── */}
        <MotionScrollReveal3D>
          <DestinationArrival />
        </MotionScrollReveal3D>

        {/* ── SCENE 9: Global Financial Perspective (Multi-Corridor Mesh) ── */}
        <MotionScrollReveal3D>
          <MacroGlobalPerspective />
        </MotionScrollReveal3D>

        {/* ── SCENE 10: Product Ecosystem Cross-Navigation ── */}
        <MotionScrollReveal3D>
          <section className="relative py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#155EEF] font-mono">
                    Connected Global Settlement
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

        {/* ── SCENE 11: Ready to Move Money Beyond Borders? (Final Payoff CTA) ── */}
        <MotionScrollReveal3D>
          <FinalPlanetaryCTA />
        </MotionScrollReveal3D>

        {/* ── Regulatory Midnight Navy Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
