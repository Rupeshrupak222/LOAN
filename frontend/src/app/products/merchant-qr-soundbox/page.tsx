'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';

// Signature Merchant QR Soundbox 10 Scenes
import { SoundboxHeroCommercial } from '@/components/products/merchant-qr-soundbox/SoundboxHeroCommercial';
import { PaymentCounterSignal } from '@/components/products/merchant-qr-soundbox/PaymentCounterSignal';
import { TypographicWaveform } from '@/components/products/merchant-qr-soundbox/TypographicWaveform';
import { CounterEnvironmentStage } from '@/components/products/merchant-qr-soundbox/CounterEnvironmentStage';
import { ExplodedDeviceArchitecture } from '@/components/products/merchant-qr-soundbox/ExplodedDeviceArchitecture';
import { CellularVerticalSignal } from '@/components/products/merchant-qr-soundbox/CellularVerticalSignal';
import { FastCounterSimulation } from '@/components/products/merchant-qr-soundbox/FastCounterSimulation';
import { TactileHardwareControls } from '@/components/products/merchant-qr-soundbox/TactileHardwareControls';
import { AcquiringCapabilitiesMatrix } from '@/components/products/merchant-qr-soundbox/AcquiringCapabilitiesMatrix';
import { HarmonicLoopCTA } from '@/components/products/merchant-qr-soundbox/HarmonicLoopCTA';

export default function MerchantQrSoundboxSignaturePage() {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#F8FAFC] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* ── Global Navigation Bar ── */}
        <MotionNavbar />

        {/* ── Top Context Breadcrumb & Back Link ── */}
        <div className="pt-28 sm:pt-32 pb-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#155EEF] transition-colors py-1.5 px-3 rounded-full hover:bg-slate-100 border border-slate-200/80 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Financial Architecture</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Adyapan</span>
              <span>/</span>
              <span className="text-slate-600 font-bold">Payments & Settlement</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Merchant QR Soundbox</span>
            </div>
          </div>
        </div>

        {/* ── SCENE 1: Cinematic Product Launch Hero Showroom ── */}
        <SoundboxHeroCommercial />

        {/* ── SCENE 2: The Payment Signal (Single Horizontal Light Pulse) ── */}
        <PaymentCounterSignal />

        {/* ── SCENE 3: The Sound (Kinetic Typography "PAYMENT RECEIVED" to LED) ── */}
        <TypographicWaveform />

        {/* ── SCENE 4: Merchant Counter (Continuous Panoramic Grounded Countertop) ── */}
        <CounterEnvironmentStage />

        {/* ── SCENE 5: Exploded Device (6-Layer Axial Disassembly & Drafting Annotations) ── */}
        <ExplodedDeviceArchitecture />

        {/* ── SCENE 6: 4G Connectivity (Poster-Like Descending RF Pulse) ── */}
        <CellularVerticalSignal />

        {/* ── SCENE 7: Payment Confirmation (Tactile Mechanical Push Button Bench) ── */}
        <FastCounterSimulation />

        {/* ── SCENE 8: Merchant Control Desk (Knurled Dial 0-270°, Dialects, Diagnostics) ── */}
        <TactileHardwareControls />

        {/* ── SCENE 9: Product Capabilities (Horizontal Technical Blueprint Schematic) ── */}
        <AcquiringCapabilitiesMatrix />

        {/* ── SCENE 10: Final Product Showcase (Pure Negative Space, Ecosystem Routes) ── */}
        <HarmonicLoopCTA />

        {/* ── Regulatory Midnight Navy Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
