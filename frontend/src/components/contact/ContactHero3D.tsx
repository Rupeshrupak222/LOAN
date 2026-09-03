'use client';

import React from 'react';
import { ArrowRight, MessageSquare, ShieldCheck, Sparkles, ChevronDown } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const ContactHero3D: React.FC = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <ScrollStage3D
      id="contact-hero"
      pin={true}
      perspective={1500}
      scrollLength="+=110%"
      className="min-h-screen bg-[#FFFFFF] text-[#071A33] border-b border-slate-200 select-none flex flex-col justify-between"
    >
      {/* ── Subdued Editorial Background Grid Lines ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(to right, #071A33 1px, transparent 1px), linear-gradient(to bottom, #071A33 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[500px] bg-gradient-to-b from-blue-100/50 via-slate-50/30 to-transparent blur-[140px] rounded-full pointer-events-none" />
      </div>

      {/* ── Main 3D Centered Spatial Stage ── */}
      <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-8 lg:px-12 my-auto pt-28 sm:pt-36 pb-16 text-center space-y-8 relative z-10">
        {/* Layer 1: Eyebrow Badge (Emerges from Z: -500px) */}
        <div
          data-depth-z="-500"
          data-rotate-x="20"
          data-rotate-y="0"
          data-scale="0.85"
          data-offset-y="40"
          data-blur="6"
          data-stagger="0"
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase shadow-xs mx-auto"
        >
          <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
          <span>ENTERPRISE CONNECT // ARCHITECTURAL ENGAGEMENT</span>
        </div>

        {/* Layer 2: Headline Line 1 (Emerges from Z: -700px, RotateX: 30deg) */}
        <div
          data-depth-z="-700"
          data-rotate-x="30"
          data-rotate-y="-5"
          data-scale="0.75"
          data-offset-y="70"
          data-blur="8"
          data-stagger="0.2"
        >
          <h1 className="text-4xl sm:text-7xl lg:text-[84px] font-black text-[#071A33] tracking-tight leading-[0.98] uppercase font-sans">
            WHAT CAN WE
          </h1>
        </div>

        {/* Layer 3: Headline Line 2 (Emerges from Z: -1000px, RotateX: 38deg) */}
        <div
          data-depth-z="-1000"
          data-rotate-x="38"
          data-rotate-y="5"
          data-scale="0.65"
          data-offset-y="95"
          data-blur="12"
          data-stagger="0.4"
        >
          <h1 className="text-4xl sm:text-7xl lg:text-[84px] font-black tracking-tight leading-[0.98] uppercase font-sans">
            <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-[#0A2540] bg-clip-text text-transparent">
              HELP YOU WITH?
            </span>
          </h1>
        </div>

        {/* Layer 4: Supporting Description (Emerges from Z: -650px) */}
        <div
          data-depth-z="-650"
          data-rotate-x="18"
          data-rotate-y="-8"
          data-scale="0.82"
          data-offset-y="50"
          data-blur="6"
          data-stagger="0.6"
          className="max-w-2xl mx-auto"
        >
          <p className="text-base sm:text-xl text-slate-600 font-normal leading-relaxed font-sans">
            Connect directly with Adyapan solutions architecture. Whether you are scaling a lending portfolio, modernizing core ledgers, or deploying consent-driven verification, our technical leads are ready.
          </p>
        </div>

        {/* Layer 5: Fast CTAs (Emerges from Z: -450px, Scale: 0.8) */}
        <div
          data-depth-z="-450"
          data-rotate-x="15"
          data-rotate-y="0"
          data-scale="0.85"
          data-offset-y="40"
          data-blur="4"
          data-stagger="0.8"
          className="flex flex-wrap items-center justify-center gap-4 pt-4 font-sans"
        >
          <button
            type="button"
            onClick={() => scrollToSection('conversation-track')}
            className="px-8 py-4 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer"
          >
            <span>SCHEDULE ARCHITECTURAL BRIEFING</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('direct-connection')}
            className="px-7 py-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <span>DIRECT CHANNELS</span>
          </button>
        </div>
      </div>

      {/* Bottom Scroll Cue */}
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-8 lg:px-12 py-6 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
          <span>SCROLL DOWN TO ADVANCE 3D ARCHITECTURAL STAGE</span>
        </div>
        <ChevronDown className="w-4 h-4 text-[#155EEF] animate-bounce" />
      </div>
    </ScrollStage3D>
  );
};
