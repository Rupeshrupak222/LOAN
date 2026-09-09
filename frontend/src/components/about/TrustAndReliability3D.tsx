'use client';

import React from 'react';
import { ShieldCheck, Lock, CheckCircle2, FileText, Scale } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const TrustAndReliability3D: React.FC = () => {
  const trustPillars = [
    {
      title: 'ZERO-TRUST SECURITY',
      subtitle: 'Cryptographic Hardening',
      desc: 'All sensitive borrower credentials and banking identifiers are tokenized and protected behind strict network isolation boundaries.',
      icon: Lock,
      depthZ: -750,
      rotX: 18,
      stagger: 0.1,
    },
    {
      title: 'HIGH-AVAILABILITY RELIABILITY',
      subtitle: 'Fault-Tolerant Settlement',
      desc: 'Engineered for sub-millisecond switch latency and resilient failover across multiple banking payment and clearing gateways.',
      icon: ShieldCheck,
      depthZ: -950,
      rotX: 14,
      stagger: 0.2,
    },
    {
      title: 'RADICAL TRANSPARENCY',
      subtitle: 'Clear Borrowing Terms',
      desc: 'Transparent APR disclosures, clear Key Fact Statements (KFS), and zero hidden processing deductions or cash demands.',
      icon: FileText,
      depthZ: -1150,
      rotX: 10,
      stagger: 0.3,
    },
    {
      title: 'REGULATORY ALIGNMENT',
      subtitle: 'Statutory Digital Lending',
      desc: 'Strict compliance with RBI digital lending directions, partnered exclusively with licensed NBFCs and registered banking entities.',
      icon: Scale,
      depthZ: -1350,
      rotX: 8,
      stagger: 0.4,
    },
  ];

  return (
    <ScrollStage3D
      id="about-trust"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16 text-left">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
          >
            <span>SECTION 08 // INTEGRITY & GOVERNANCE</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              FINANCIAL TECHNOLOGY{' '}
              <span className="text-[#155EEF] block">STARTS WITH TRUST.</span>
            </h2>
          </div>

          <div
            data-depth-z="-600"
            data-rotate-y="-8"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.2"
          >
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Trust is not an accessory in financial services; it is the foundation. Every microservice, audit log, and loan agreement is designed with security and compliance by default.
            </p>
          </div>
        </div>

        {/* ── 4 Stabilized Transparent Trust Plates with 3D Depth ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPillars.map((tp, idx) => {
            const Icon = tp.icon;
            return (
              <div
                key={idx}
                data-depth-z={tp.depthZ.toString()}
                data-rotate-x={tp.rotX.toString()}
                data-scale="0.76"
                data-offset-y="75"
                data-blur="10"
                data-stagger={tp.stagger.toString()}
                className="p-7 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-white hover:border-[#155EEF] transition-all space-y-4 flex flex-col justify-between shadow-2xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      PILLAR 0{idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#155EEF] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-[#071A33] font-sans">
                    {tp.title}
                  </h3>

                  <span className="text-[11px] font-mono font-bold text-[#155EEF] uppercase block">
                    {tp.subtitle}
                  </span>

                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    {tp.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>MANDATED & AUDITED</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollStage3D>
  );
};
