'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, MessageSquare, PhoneCall } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const ContactClosingCTA3D: React.FC = () => {
  return (
    <ScrollStage3D
      id="contact-closing-cta"
      perspective={1500}
      className="py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-[#071A33] text-white select-none relative overflow-hidden"
    >
      {/* Background Volumetric Auras */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[550px] bg-gradient-to-r from-blue-600/20 via-indigo-500/15 to-transparent blur-[140px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
        {/* Eyebrow */}
        <div
          data-depth-z="-450"
          data-rotate-x="20"
          data-offset-y="30"
          data-scale="0.85"
          data-blur="4"
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase shadow-xs mx-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>DIRECT ENGINEERING ACCESS</span>
        </div>

        {/* Massive Headline Coming Forward Dramatically (Z: -1100px) */}
        <div
          data-depth-z="-1100"
          data-rotate-x="35"
          data-offset-y="90"
          data-scale="0.65"
          data-blur="12"
          data-stagger="0.15"
        >
          <h2 className="text-4xl sm:text-6xl lg:text-[76px] font-black text-white tracking-tight leading-[1.02] uppercase font-sans">
            START THE{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent block mt-1">
              CONVERSATION.
            </span>
          </h2>
        </div>

        {/* Supporting text */}
        <div
          data-depth-z="-650"
          data-rotate-y="-5"
          data-offset-y="40"
          data-blur="6"
          data-stagger="0.35"
          className="max-w-2xl mx-auto"
        >
          <p className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed font-sans">
            From regional NBFC portfolios to tier-1 commercial banking infrastructure, Adyapan engineers are ready to walk you through our live sandbox code and architecture.
          </p>
        </div>

        {/* Action CTAs */}
        <div
          data-depth-z="-450"
          data-rotate-x="15"
          data-offset-y="30"
          data-scale="0.85"
          data-blur="4"
          data-stagger="0.55"
          className="flex flex-wrap items-center justify-center gap-4 pt-4 font-sans"
        >
          <a
            href="#contact-form-section"
            className="px-8 py-4 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#155EEF]/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer"
          >
            <span>SUBMIT BRIEFING INQUIRY</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="tel:+918040008890"
            className="px-7 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-cyan-300" />
            <span>CALL DIRECT (+91 80 4000 8890)</span>
          </a>
        </div>
      </div>
    </ScrollStage3D>
  );
};
