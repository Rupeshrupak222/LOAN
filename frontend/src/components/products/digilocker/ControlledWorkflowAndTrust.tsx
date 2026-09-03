'use client';

import React from 'react';
import { ShieldCheck, CheckCircle2, Lock, FileCheck, Layers, Sparkles } from 'lucide-react';

export const ControlledWorkflowAndTrust: React.FC = () => {
  const architecturalLayers = [
    {
      num: 'LAYER 01',
      title: 'REQUEST LAYER',
      desc: 'Configurable parameters specifying necessary document types and identity schemas.',
    },
    {
      num: 'LAYER 02',
      title: 'CONSENT LAYER',
      desc: 'Transparent, statutory user authorization window under applicable data protection frameworks.',
    },
    {
      num: 'LAYER 03',
      title: 'DOCUMENT LAYER',
      desc: 'Cryptographically signed digital record retrieval from certified digital issuers.',
    },
    {
      num: 'LAYER 04',
      title: 'VERIFICATION LAYER',
      desc: 'Automated schema validation, certificate chain verification, and audit trail commit.',
    },
  ];

  const trustPrinciples = [
    {
      title: 'CONSENT',
      desc: 'Access is strictly initiated upon user authorization via authenticated consent flows.',
    },
    {
      title: 'SOURCE',
      desc: 'Documents originate from accredited digital repositories and verified public authorities.',
    },
    {
      title: 'VERIFICATION',
      desc: 'Document authenticity is confirmed via cryptographic signatures and digital integrity checks.',
    },
  ];

  const capabilities = [
    {
      title: 'DIGITAL DOCUMENT ACCESS',
      desc: 'Access supported digital documents directly through accredited ecosystem workflows.',
    },
    {
      title: 'CONSENT-BASED SHARING',
      desc: 'Document sharing is conducted transparently with explicit, auditable user authorization.',
    },
    {
      title: 'VERIFICATION WORKFLOW',
      desc: 'Support structured, sub-second verification journeys integrated into loan decision engines.',
    },
    {
      title: 'PAPERLESS ONBOARDING',
      desc: 'Reduce manual paper handling, photocopy logistics, and physical storage costs.',
    },
  ];

  return (
    <div id="section-infrastructure-trust" className="select-none">
      {/* ── Top Subsection: 4 Compact Architectural Layers ── */}
      <section className="py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33]">
        <div className="max-w-[1400px] mx-auto space-y-14">
          <div className="max-w-3xl space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase">
              <span>CONTROLLED ARCHITECTURE</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              THE EXPERIENCE IS SIMPLE.{' '}
              <span className="text-[#155EEF] block">THE WORKFLOW IS CONTROLLED.</span>
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Behind the streamlined user interface operates a rigorously structured four-tier verification architecture ensuring cryptographic integrity at every boundary.
            </p>
          </div>

          {/* 4 Compact Horizontal Architectural Layers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {architecturalLayers.map((layer, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-blue-300 hover:bg-white transition-all space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-[10px] font-mono font-bold text-[#155EEF] tracking-wider">
                    {layer.num}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <h3 className="text-sm font-black text-[#071A33] font-sans tracking-wide">
                  {layer.title}
                </h3>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  {layer.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom Subsection: Premium Dark Trust & Product Capabilities Section ── */}
      <section className="py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-[#071A33] text-white border-b border-slate-900">
        <div className="max-w-[1400px] mx-auto space-y-16">
          {/* Trust Principles Header */}
          <div className="max-w-3xl space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 border border-white/20 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>INSTITUTIONAL TRUST</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight uppercase font-sans">
              TRUST IS A{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                USER EXPERIENCE.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed font-sans">
              Financial verification succeeds when customers feel in control of their records and institutions can rely completely on document authenticity.
            </p>
          </div>

          {/* 3 Core Trust Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {trustPrinciples.map((tp, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-3"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-white/10 text-cyan-400 font-mono text-xs font-bold tracking-wider">
                  <span>0{idx + 1} //</span>
                  <span>{tp.title}</span>
                </div>
                <h3 className="text-lg font-black text-white font-sans tracking-wide">
                  {tp.title} FIRST
                </h3>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  {tp.desc}
                </p>
              </div>
            ))}
          </div>

          {/* 4 Product Capabilities Strip */}
          <div className="pt-8 border-t border-white/10 space-y-6 text-left">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 block">
              CORE PRODUCT CAPABILITIES
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {capabilities.map((cap, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/10 transition-colors"
                >
                  <h4 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wide">
                    {cap.title}
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {cap.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
