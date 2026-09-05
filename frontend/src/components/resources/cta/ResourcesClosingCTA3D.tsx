'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  MessageSquare,
  Sparkles,
  FileText,
  Bookmark,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { ResourceEmergence3D } from '../motion/ResourceEmergence3D';

export const ResourcesClosingCTA3D: React.FC = () => {
  return (
    <section className="relative py-24 sm:py-32 bg-[#071A33] text-white overflow-hidden">
      {/* Background Architectural Caliper Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(#FFFFFF 1.5px, transparent 1.5px), linear-gradient(to right, #155EEF 1px, transparent 1px), linear-gradient(to bottom, #155EEF 1px, transparent 1px)',
          backgroundSize: '36px 36px, 120px 120px, 120px 120px',
        }}
      />

      {/* Atmospheric Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#155EEF]/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <ResourceEmergence3D initialZ={-950} rotateX={16} duration={1.2}>
          
          <div className="max-w-4xl mx-auto text-center space-y-8">
            
            {/* 3D Converging Research Sheets Visual Composition */}
            <div
              className="relative w-48 h-32 mx-auto mb-6"
              style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
            >
              {/* Sheet 1 (Left Wing) */}
              <div
                className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 transform translate-z-[-20px] rotate-[-12deg] shadow-lg flex flex-col justify-between"
              >
                <div className="flex justify-between items-center text-[9px] font-mono text-slate-300">
                  <span>RESEARCH</span>
                  <Bookmark className="w-2.5 h-2.5 text-amber-400" />
                </div>
                <div className="h-1.5 w-3/4 bg-white/20 rounded" />
              </div>

              {/* Sheet 2 (Right Wing) */}
              <div
                className="absolute inset-0 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 p-4 transform translate-z-[10px] rotate-[10deg] shadow-xl flex flex-col justify-between"
              >
                <div className="flex justify-between items-center text-[9px] font-mono text-blue-300">
                  <span>BLUEPRINT</span>
                  <FileText className="w-2.5 h-2.5 text-blue-400" />
                </div>
                <div className="h-1.5 w-1/2 bg-white/30 rounded" />
              </div>

              {/* Sheet 3 (Center Anchor) */}
              <div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#155EEF] to-[#004EEB] border border-blue-400/50 p-4 transform translate-z-[35px] shadow-2xl flex flex-col justify-between"
              >
                <div className="flex justify-between items-center text-[9px] font-mono text-white font-bold">
                  <span>ADYAPAN // INTEL</span>
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
                <div className="text-center text-xs font-mono font-bold">
                  SYSTEMS READY
                </div>
              </div>
            </div>

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest text-blue-300 bg-white/[0.08] border border-white/15 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2E90FA]" />
              <span>THE HORIZON // CONTINUOUS EXPLORATION</span>
            </div>

            {/* Headline */}
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight font-sans text-white leading-[1.08]">
              KEEP EXPLORING.
            </h2>

            {/* Supporting Text */}
            <p className="text-base sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              The financial systems of tomorrow are being built today. Connect with our engineering and product teams to integrate these rails into your ecosystem.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/products/core-banking-engine"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm text-white bg-[#155EEF] hover:bg-[#004EEB] transition-all shadow-xl shadow-blue-500/30 hover:shadow-blue-500/45 hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Explore Products</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <MessageSquare className="w-4 h-4 text-blue-300" />
                <span>Start a Conversation</span>
              </Link>
            </div>

            {/* Bottom Invariant Footer Micro-Note */}
            <div className="pt-10 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-400">
              <span>ZERO-DRIFT FINANCIAL INVARIANTS</span>
              <span>•</span>
              <span>100% AUDITABLE LOGS</span>
              <span>•</span>
              <span>NPCI &amp; RBI COMPLIANCE READY</span>
            </div>

          </div>

        </ResourceEmergence3D>
      </div>
    </section>
  );
};
