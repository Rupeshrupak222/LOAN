'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Zap,
  ShieldCheck,
  Sparkles,
  Calendar,
  Cloud,
  Layers,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';
import { DigiLockerVaultHero3D } from '@/components/products/digilocker-ekyc/DigiLockerVaultHero3D';
import { WideKycVerificationPortal } from '@/components/products/digilocker-ekyc/WideKycVerificationPortal';
import { KycProcessSection } from '@/components/products/digilocker-ekyc/KycProcessSection';
import { DigitalDocumentsSection } from '@/components/products/digilocker-ekyc/DigitalDocumentsSection';
import { KycFinalCtaSection } from '@/components/products/digilocker-ekyc/KycFinalCtaSection';
import { PlatformScaleSection } from '@/components/products/digilocker-ekyc/PlatformScaleSection';

export default function DigilockerEkycPage() {
  const [triggerCount, setTriggerCount] = useState(0);

  const handleStartWorkflow = () => {
    setTriggerCount((prev) => prev + 1);
    const dashboardEl = document.getElementById('kyc-dashboard-visual');
    if (dashboardEl) {
      dashboardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const valueProps = [
    {
      title: 'Faster Decisions',
      subtitle: 'AI-powered underwriting',
      icon: Zap,
    },
    {
      title: 'Lower Risk',
      subtitle: 'Intelligent risk assessment',
      icon: ShieldCheck,
    },
    {
      title: 'Better Experience',
      subtitle: 'Digital-first borrower journey',
      icon: Cloud,
    },
    {
      title: 'End-to-End Management',
      subtitle: 'From origination to collections',
      icon: Layers,
    },
  ];

  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* ── 1. Global Navigation Bar (Preserved Adyapan Header) ── */}
        <MotionNavbar />

        {/* ── Main Page Content ── */}
        <div className="pt-28 sm:pt-32 pb-16">
          <main className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-16">
            {/* ── 2. Top Context Breadcrumb & Back Link (Cleanly Placed in Page Flow) ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#155EEF] transition-colors py-1 px-2.5 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 w-fit"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back to AI Risk & Compliance</span>
              </Link>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>Adyapan</span>
                <span>/</span>
                <span className="text-slate-600 font-bold">AI Risk & Compliance</span>
                <span>/</span>
                <span className="text-[#155EEF] font-bold">DigiLocker e-KYC</span>
              </div>
            </div>

            {/* ── 3. HERO SECTION (Exact Reference Composition with Adyapan Blue) ── */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-center">
              {/* Left Column: Headline, Description, CTAs, Value Props */}
              <div className="lg:col-span-6 space-y-6 text-left">
                {/* Category Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-bold text-[#155EEF] font-mono shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
                  <span>AI Risk & Compliance · Government-Verified Identity</span>
                </div>

                {/* Large Headline */}
                <h1 className="text-2xl sm:text-4xl lg:text-[2.65rem] xl:text-[2.85rem] font-black tracking-tight text-[#071A33] leading-[1.18]">
                  Seamless Loan Origination, Approval, & Management with{' '}
                  <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-indigo-700 bg-clip-text text-transparent">
                    <span className="whitespace-nowrap">AI-Powered</span> Lending Solutions
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  Automate the entire lending lifecycle with intelligent automation, real-time risk insights, and seamless borrower experiences. Built for modern financial institutions.
                </p>

                {/* Two CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <button
                    onClick={handleStartWorkflow}
                    className="px-6 sm:px-7 py-3.5 rounded-2xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-sm shadow-lg shadow-[#155EEF]/25 hover:shadow-xl hover:shadow-[#155EEF]/35 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Explore AI Lending Platform →</span>
                  </button>

                  <Link
                    href="/login"
                    className="px-5 sm:px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm transition-all flex items-center gap-2 shadow-xs hover:border-slate-300"
                  >
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Request a Demo →</span>
                  </Link>
                </div>

                {/* 4-Item Horizontal Value Props Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                  {valueProps.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="space-y-1 text-left">
                        <div className="flex items-center gap-1.5 text-[#155EEF]">
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs font-bold text-[#071A33]">{item.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">
                          {item.subtitle}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: 3D Smartphone, Document Folder & Identity Cards (Adyapan Blue) */}
              <div className="lg:col-span-6">
                <DigiLockerVaultHero3D />
              </div>
            </section>

            {/* ── 4. FULL-WIDTH ENTERPRISE KYC VERIFICATION PORTAL CARD ── */}
            <section className="w-full">
              <WideKycVerificationPortal
                onStartVerification={handleStartWorkflow}
                isExternalTriggering={triggerCount > 0}
              />
            </section>
          </main>
        </div>

        {/* ── 5. THE SCALE OF OUR PLATFORM SECTION (Placed Immediately Under Verification Portal) ── */}
        <PlatformScaleSection />

        {/* ── 6. Supporting Workflow & Final Action CTA ── */}
        <div className="py-16">
          <main className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-16">
            <KycProcessSection />
            <DigitalDocumentsSection />
            <KycFinalCtaSection onStartKyc={handleStartWorkflow} />
          </main>
        </div>

        {/* ── 7. Regulatory Fintech Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
