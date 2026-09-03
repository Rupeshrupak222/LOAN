'use client';

import React from 'react';
import { Layers, ArrowDown, Shield, Database, Cpu, Layout, Smartphone } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const TechnologyStackArchitecture3D: React.FC = () => {
  const stackTiers = [
    {
      tier: 'TIER 01',
      name: 'CUSTOMER EXPERIENCE LAYER',
      desc: 'Intuitive web applications, native mobile SDKs, dynamic calculators, and responsive loan origination journeys.',
      tech: 'Next.js · React · GSAP Animation · Web3D Scenarios',
      icon: Layout,
      depthZ: -700,
      rotX: 18,
    },
    {
      tier: 'TIER 02',
      name: 'PRODUCT FABRIC LAYER',
      desc: 'Modular lending engines spanning retail loans, SME credit lines, home mortgages, and merchant soundbox IoT payment confirmations.',
      tech: 'Personal Loans · SME Credit · BNPL · QR Rails',
      icon: Smartphone,
      depthZ: -900,
      rotX: 14,
    },
    {
      tier: 'TIER 03',
      name: 'FINANCIAL SERVICES INTEGRATION',
      desc: 'Real-time integrations with Account Aggregators, DigiLocker e-KYC attestation, NPCI auto-debit switches, and pan-India banking APIs.',
      tech: 'MeitY DigiLocker · Account Aggregator · NACH · UPI Switch',
      icon: Cpu,
      depthZ: -1100,
      rotX: 10,
    },
    {
      tier: 'TIER 04',
      name: 'RISK & DECISIONING ENGINE',
      desc: 'Predictive 4-pillar risk scorecards, real-time automated DTI calibration, bureau rule engines, and sub-second credit gating.',
      tech: '4-Pillar Scoring · DTI Calibration · Bureau Rule Matrix',
      icon: Shield,
      depthZ: -1300,
      rotX: 8,
    },
    {
      tier: 'TIER 05',
      name: 'IMMUTABLE CORE & DATA VAULT',
      desc: 'Sub-millisecond transaction settlement engine, double-entry financial accounting ledgers, and append-only WORM regulatory logs.',
      tech: 'Core Banking Engine · Double-Entry Ledger · WORM Audit',
      icon: Database,
      depthZ: -1500,
      rotX: 6,
    },
  ];

  return (
    <ScrollStage3D
      id="about-tech-stack"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1200px] mx-auto space-y-16 text-left">
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
            <span>SECTION 06 // ARCHITECTURAL TOPOLOGY</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              THE EXPERIENCE IS SIMPLE.{' '}
              <span className="text-[#155EEF] block">THE SYSTEM BEHIND IT ISN'T.</span>
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
              Simplicity at the front requires immense structural discipline at the back. Discover the five synchronized architectural tiers that power every Adyapan loan origination and settlement.
            </p>
          </div>
        </div>

        {/* ── 5-Tier 3D Architectural Stack ── */}
        <div className="space-y-4">
          {stackTiers.map((tier, idx) => {
            const Icon = tier.icon;
            return (
              <div
                key={idx}
                data-depth-z={tier.depthZ.toString()}
                data-rotate-x={tier.rotX.toString()}
                data-scale="0.8"
                data-offset-y="60"
                data-blur="8"
                data-stagger={(idx * 0.12).toFixed(2)}
                className="p-7 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs hover:bg-white hover:border-[#155EEF] transition-all grid grid-cols-1 md:grid-cols-12 gap-6 items-center"
              >
                <div className="md:col-span-4 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF]">
                    <span>{tier.tier}</span>
                  </div>
                  <h3 className="text-base font-black text-[#071A33] font-sans">
                    {tier.name}
                  </h3>
                </div>

                <div className="md:col-span-5 text-xs text-slate-600 font-sans leading-relaxed">
                  {tier.desc}
                </div>

                <div className="md:col-span-3 p-3 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-500">
                  <span className="text-[9px] text-[#155EEF] font-bold block uppercase">CAPABILITIES:</span>
                  <span>{tier.tech}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollStage3D>
  );
};
