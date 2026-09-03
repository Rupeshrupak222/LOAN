'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Compass,
  Layers,
  Sparkles,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionScrollReveal3D } from '@/components/motion/MotionScrollReveal3D';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { ArchitecturalHero3D } from '@/components/products/home-mortgages/ArchitecturalHero3D';
import { SpatialRoomModules } from '@/components/products/home-mortgages/SpatialRoomModules';
import { FinancialBlueprintBuilder } from '@/components/products/home-mortgages/FinancialBlueprintBuilder';
import { TenureArchitecturalTower } from '@/components/products/home-mortgages/TenureArchitecturalTower';
import { EmiCircularFlow } from '@/components/products/home-mortgages/EmiCircularFlow';
import { BlueprintToHomeTransformation } from '@/components/products/home-mortgages/BlueprintToHomeTransformation';
import { CurvedMilestoneJourney } from '@/components/products/home-mortgages/CurvedMilestoneJourney';
import { FinalCompletedHomeScene } from '@/components/products/home-mortgages/FinalCompletedHomeScene';

export default function HomeMortgagesSignaturePage() {
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
              <span className="text-[#155EEF] font-bold">Home Mortgages (8.5%*)</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: The Blueprint Takes Shape 3D Hero ── */}
        <ArchitecturalHero3D />

        {/* ── SCENE 2: Spatial Room Modules (Living, Bedroom, Kitchen, Studio, Balcony) ── */}
        <MotionScrollReveal3D>
          <SpatialRoomModules />
        </MotionScrollReveal3D>

        {/* ── SCENE 3: The Financial Blueprint Builder ── */}
        <MotionScrollReveal3D>
          <FinancialBlueprintBuilder />
        </MotionScrollReveal3D>

        {/* ── SCENE 4: Tenure as Architecture (Vertical 30-Year Tower) ── */}
        <MotionScrollReveal3D>
          <TenureArchitecturalTower />
        </MotionScrollReveal3D>

        {/* ── SCENE 5: The EMI Circular Flow ── */}
        <MotionScrollReveal3D>
          <EmiCircularFlow />
        </MotionScrollReveal3D>

        {/* ── SCENE 6: From Blueprint to Living Home ── */}
        <MotionScrollReveal3D>
          <BlueprintToHomeTransformation />
        </MotionScrollReveal3D>

        {/* ── SCENE 7: 6-Milestone Curved Mortgage Journey ── */}
        <MotionScrollReveal3D>
          <CurvedMilestoneJourney />
        </MotionScrollReveal3D>

        {/* ── SCENE 8: Product Ecosystem Cross-Navigation ── */}
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

        {/* ── SCENE 9: Ready to Draw Your Home? Final Conclusion ── */}
        <MotionScrollReveal3D>
          <FinalCompletedHomeScene />
        </MotionScrollReveal3D>

        {/* ── Regulatory Midnight Navy Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
