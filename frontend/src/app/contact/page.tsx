'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';

import { ContactHero3D } from '@/components/contact/ContactHero3D';
import { ConversationTrackSelector } from '@/components/contact/ConversationTrackSelector';
import { ConversationPathSignal } from '@/components/contact/ConversationPathSignal';
import { EnterpriseContactForm3D } from '@/components/contact/EnterpriseContactForm3D';
import { DirectConnectionMatrix } from '@/components/contact/DirectConnectionMatrix';
import { WhatHappensNextPipeline } from '@/components/contact/WhatHappensNextPipeline';
import { ContactFaqAccordion3D } from '@/components/contact/ContactFaqAccordion3D';
import { ContactClosingCTA3D } from '@/components/contact/ContactClosingCTA3D';

export default function ContactPage() {
  const [selectedTrack, setSelectedTrack] = useState('lending');

  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* Fixed Editorial Navigation Header */}
        <MotionNavbar />

        {/* Top Context Subheader */}
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
              <span className="text-[#155EEF] font-bold">Solutions Architecture // Direct Connect</span>
            </div>
          </div>
        </div>

        {/* ── 8 Dedicated 3D Scroll-Driven Stages ── */}
        <main className="w-full">
          {/* Section 1: Hero (Text emerges from deep 3D space) */}
          <ContactHero3D />

          {/* Section 2: Conversation Selection (4 3D Cards cascading from depth) */}
          <ConversationTrackSelector
            selectedTrack={selectedTrack}
            onSelectTrack={setSelectedTrack}
          />

          {/* Section 3: Direct Ingress Signal Path (Telemetry connection lines) */}
          <ConversationPathSignal activeTrack={selectedTrack} />

          {/* Section 4: Enterprise Contact Form (Layered inputs assembling from depth) */}
          <EnterpriseContactForm3D selectedTrack={selectedTrack} />

          {/* Section 5: Direct Connection Matrix (Information blocks rising from plane) */}
          <DirectConnectionMatrix />

          {/* Section 6: What Happens Next (4 sequential stages arriving on 3D runway) */}
          <WhatHappensNextPipeline />

          {/* Section 7: Architectural FAQ (Accordion unfolding from depth) */}
          <ContactFaqAccordion3D />

          {/* Section 8: Final Closing CTA (Massive headline coming forward dramatically) */}
          <ContactClosingCTA3D />
        </main>

        {/* Global Editorial Footer */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
