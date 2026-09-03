'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const ControlledWorkflowAndTrust: React.FC = () => {
  const architecturalLayers = [
    {
      num: 'LAYER 01',
      title: 'REQUEST LAYER',
      desc: 'Configurable parameters specifying necessary document types and identity schemas.',
      depthZ: -850,
      rotX: 18,
    },
    {
      num: 'LAYER 02',
      title: 'CONSENT LAYER',
      desc: 'Transparent, statutory user authorization window under applicable data protection frameworks.',
      depthZ: -1050,
      rotX: 14,
    },
    {
      num: 'LAYER 03',
      title: 'DOCUMENT LAYER',
      desc: 'Cryptographically signed digital record retrieval from certified digital issuers.',
      depthZ: -1250,
      rotX: 10,
    },
    {
      num: 'LAYER 04',
      title: 'VERIFICATION LAYER',
      desc: 'Automated schema validation, certificate chain verification, and audit trail commit.',
      depthZ: -1450,
      rotX: 8,
    },
  ];

  const trustPrinciples = [
    {
      title: 'CONSENT',
      desc: 'Access is strictly initiated upon user authorization via authenticated consent flows.',
      depthZ: -900,
      rotY: -14,
    },
    {
      title: 'SOURCE',
      desc: 'Documents originate from accredited digital repositories and verified public authorities.',
      depthZ: -1100,
      rotY: 0,
    },
    {
      title: 'VERIFICATION',
      desc: 'Document authenticity is confirmed via cryptographic signatures and digital integrity checks.',
      depthZ: -1300,
      rotY: 14,
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
      <ScrollStage3D
        perspective={1500}
        className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33]"
      >
        <div className="max-w-[1400px] mx-auto space-y-14">
          <div className="max-w-3xl space-y-4 text-left">
            <div
              data-depth-z="-450"
              data-rotate-x="18"
              data-offset-y="30"
              data-scale="0.9"
              data-blur="4"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
            >
              <span>STAGE 09 // CONTROLLED ARCHITECTURE</span>
            </div>

            <div
              data-depth-z="-750"
              data-rotate-x="30"
              data-offset-y="60"
              data-blur="8"
              data-stagger="0.1"
            >
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
                THE EXPERIENCE IS SIMPLE.
              </h2>
            </div>

            <div
              data-depth-z="-1000"
              data-rotate-x="38"
              data-offset-y="90"
              data-blur="12"
              data-stagger="0.25"
            >
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight uppercase font-sans">
                <span className="text-[#155EEF] block">THE WORKFLOW IS CONTROLLED.</span>
              </h2>
            </div>

            <div
              data-depth-z="-650"
              data-rotate-y="-8"
              data-offset-y="40"
              data-blur="6"
              data-stagger="0.4"
            >
              <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
                Behind the streamlined user interface operates a rigorously structured four-tier verification architecture ensuring cryptographic integrity at every boundary.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {architecturalLayers.map((layer, idx) => (
              <div
                key={idx}
                data-depth-z={layer.depthZ.toString()}
                data-rotate-x={layer.rotX.toString()}
                data-scale="0.78"
                data-offset-y="70"
                data-blur="10"
                data-stagger={(idx * 0.15).toFixed(2)}
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
      </ScrollStage3D>

      {/* ── Bottom Subsection: Premium Dark Trust Section ── */}
      <ScrollStage3D
        perspective={1600}
        className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-[#071A33] text-white border-b border-slate-900"
      >
        <div className="max-w-[1400px] mx-auto space-y-16">
          <div className="max-w-3xl space-y-4 text-left">
            <div
              data-depth-z="-450"
              data-rotate-x="18"
              data-offset-y="30"
              data-scale="0.9"
              data-blur="4"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white/10 border border-white/20 text-cyan-400 text-xs font-mono font-bold tracking-wider uppercase"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>INSTITUTIONAL TRUST</span>
            </div>

            <div
              data-depth-z="-850"
              data-rotate-x="32"
              data-offset-y="60"
              data-blur="8"
              data-stagger="0.1"
            >
              <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight uppercase font-sans">
                TRUST IS A{' '}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  USER EXPERIENCE.
                </span>
              </h2>
            </div>

            <div
              data-depth-z="-650"
              data-rotate-y="-8"
              data-offset-y="40"
              data-blur="6"
              data-stagger="0.25"
            >
              <p className="text-base sm:text-lg text-slate-300 font-normal leading-relaxed font-sans">
                Financial verification succeeds when customers feel in control of their records and institutions can rely completely on document authenticity.
              </p>
            </div>
          </div>

          {/* 3 Core Trust Principles Cascading from Depth */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {trustPrinciples.map((tp, idx) => (
              <div
                key={idx}
                data-depth-z={tp.depthZ.toString()}
                data-rotate-y={tp.rotY.toString()}
                data-scale="0.76"
                data-offset-y="75"
                data-blur="10"
                data-stagger={(idx * 0.2).toFixed(2)}
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
          <div
            data-depth-z="-750"
            data-rotate-x="18"
            data-scale="0.85"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.45"
            className="pt-8 border-t border-white/10 space-y-6 text-left"
          >
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
      </ScrollStage3D>
    </div>
  );
};
