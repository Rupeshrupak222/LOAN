'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';

// Modular About Adyapan 3D Sections
import { AboutHero3D } from '@/components/about/AboutHero3D';
import { WhyAdyapanExists3D } from '@/components/about/WhyAdyapanExists3D';
import { AdyapanEvolution3D } from '@/components/about/AdyapanEvolution3D';
import { EcosystemWhatWeBuild3D } from '@/components/about/EcosystemWhatWeBuild3D';
import { PeopleAndCulture3D } from '@/components/about/PeopleAndCulture3D';
import { HowWeThinkPrinciples3D } from '@/components/about/HowWeThinkPrinciples3D';
import { TechnologyStackArchitecture3D } from '@/components/about/TechnologyStackArchitecture3D';
import { CustomerCenteredCompression3D } from '@/components/about/CustomerCenteredCompression3D';
import { TrustAndReliability3D } from '@/components/about/TrustAndReliability3D';
import { TheFutureRoadmap3D } from '@/components/about/TheFutureRoadmap3D';
import { AboutClosingBrandCTA3D } from '@/components/about/AboutClosingBrandCTA3D';

export default function AboutAdyapanPage() {
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
              <span className="text-slate-600 font-bold">Company</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">About Adyapan</span>
            </div>
          </div>
        </div>

        {/* Main Content Narrative */}
        <main className="w-full">
          {/* Section 01: Hero — The Journey Forward 3D Visual */}
          <AboutHero3D />

          {/* Section 02: Why Adyapan Exists */}
          <WhyAdyapanExists3D />

          {/* Section 03: Where We Started. Where We're Going. */}
          <AdyapanEvolution3D />

          {/* Section 04: One Ecosystem. Many Financial Journeys. */}
          <EcosystemWhatWeBuild3D />

          {/* Section 05: Technology is Built by People */}
          <PeopleAndCulture3D />

          {/* Section 06: The Way We Build Matters */}
          <HowWeThinkPrinciples3D />

          {/* Section 07: The Experience is Simple. The System Behind It Isn't. */}
          <TechnologyStackArchitecture3D />

          {/* Section 08: Complexity Should Live Behind The Experience */}
          <CustomerCenteredCompression3D />

          {/* Section 09: Financial Technology Starts With Trust */}
          <TrustAndReliability3D />

          {/* Section 10: We're Still Building */}
          <TheFutureRoadmap3D />

          {/* Section 11: The Next Financial Journey Starts Here */}
          <AboutClosingBrandCTA3D />
        </main>

        {/* Midnight Navy Regulatory Footer */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
