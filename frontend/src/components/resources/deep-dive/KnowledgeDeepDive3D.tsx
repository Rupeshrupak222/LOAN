'use client';

import React from 'react';
import Link from 'next/link';
import {
  Coins,
  Zap,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { ResourceEmergence3D } from '../motion/ResourceEmergence3D';

interface DeepDivePillar {
  number: string;
  title: string;
  subtitle: string;
  tagline: string;
  bullets: string[];
  productLink: string;
  productLabel: string;
  svgSketch: React.ReactNode;
}

export const KnowledgeDeepDive3D: React.FC = () => {
  const pillars: DeepDivePillar[] = [
    {
      number: '01',
      title: 'LENDING INFRASTRUCTURE',
      subtitle: 'Understand the systems behind modern lending.',
      tagline: 'Autonomous Origination // Collateral Rails',
      bullets: [
        'Real-time Account Aggregator statement ingestion',
        'Automated e-Mandate registration via NPCI Autopay',
        'Sub-second loan agreement signing with Aadhaar e-Sign',
      ],
      productLink: '/products/personal-loans',
      productLabel: 'Explore Lending Engine',
      svgSketch: (
        <svg viewBox="0 0 280 180" fill="none" className="w-full h-auto">
          {/* Blueprint Grid */}
          <path d="M 10 45 H 270 M 10 90 H 270 M 10 135 H 270" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
          <path d="M 60 10 V 170 M 140 10 V 170 M 220 10 V 170" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

          {/* Caliper Measurement Bracket */}
          <path d="M 30 50 L 30 130 L 45 130 M 30 90 L 50 90" stroke="#155EEF" strokeWidth="1.5" />
          
          {/* Credit Engine Central Block */}
          <rect x="70" y="55" width="140" height="70" rx="8" fill="#F8FAFC" stroke="#071A33" strokeWidth="1.75" />
          <text x="140" y="82" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#071A33" fontWeight="bold">CREDIT ENGINE</text>
          <text x="140" y="98" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#155EEF">AA + GST PIPELINE</text>
          <path d="M 85 110 H 195" stroke="#E2E8F0" strokeWidth="1.5" />

          {/* Dynamic Input Vector */}
          <path d="M 40 90 H 68" stroke="#155EEF" strokeWidth="2" />
          <polygon points="68,90 62,87 62,93" fill="#155EEF" />

          {/* Sanction Output Vector */}
          <path d="M 210 90 H 245" stroke="#16A34A" strokeWidth="2" />
          <polygon points="245,90 239,87 239,93" fill="#16A34A" />
          <circle cx="255" cy="90" r="8" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5" />
          <path d="M 252 90 L 254 92 L 258 87" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'PAYMENT INFRASTRUCTURE',
      subtitle: 'Explore the technology connecting digital payments.',
      tagline: 'Multi-Bank Switch // Low Latency Routing',
      bullets: [
        'Dynamic multi-lane bank health telemetry',
        'Sub-120ms traffic rerouting during bank outage windows',
        'Multilateral netting & central bank settlement parity',
      ],
      productLink: '/products/npci-upi-network',
      productLabel: 'Explore Payments Switch',
      svgSketch: (
        <svg viewBox="0 0 280 180" fill="none" className="w-full h-auto">
          {/* Blueprint Grid */}
          <path d="M 10 45 H 270 M 10 90 H 270 M 10 135 H 270" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

          {/* Switch Node */}
          <circle cx="140" cy="90" r="32" fill="#EFF6FF" stroke="#155EEF" strokeWidth="1.75" />
          <circle cx="140" cy="90" r="22" fill="#DBEAFE" stroke="#155EEF" strokeWidth="1" strokeDasharray="4 2" />
          <text x="140" y="88" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#155EEF" fontWeight="bold">SWITCH</text>
          <text x="140" y="99" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#071A33">NPCI 2.0</text>

          {/* Bank 1 Node */}
          <rect x="25" y="40" width="55" height="35" rx="5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.25" />
          <text x="52" y="60" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#0F172A">BANK A</text>

          {/* Bank 2 Node */}
          <rect x="25" y="105" width="55" height="35" rx="5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.25" />
          <text x="52" y="125" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#0F172A">BANK B</text>

          {/* Merchant Destination */}
          <rect x="200" y="72" width="60" height="36" rx="5" fill="#071A33" stroke="#071A33" strokeWidth="1.25" />
          <text x="230" y="94" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#FFFFFF" fontWeight="bold">MERCHANT</text>

          {/* Connecting Mesh Rails */}
          <path d="M 80 57 C 105 57, 105 80, 110 85" stroke="#155EEF" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M 80 122 C 105 122, 105 100, 110 95" stroke="#155EEF" strokeWidth="1.5" strokeDasharray="3 2" />
          <path d="M 172 90 H 198" stroke="#16A34A" strokeWidth="2" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'RISK & DECISIONING',
      subtitle: 'Explore the systems behind smarter financial decisions.',
      tagline: '4-Pillar Model // SHAP Explainability',
      bullets: [
        'Mathematical feature attribution on every decision',
        'Anti-fraud circular flow detection across banking chains',
        'Continuous dynamic calibration against macro indicators',
      ],
      productLink: '/products/ai-underwriting-scorecard',
      productLabel: 'Explore Risk Scorecard',
      svgSketch: (
        <svg viewBox="0 0 280 180" fill="none" className="w-full h-auto">
          {/* Blueprint Grid */}
          <path d="M 10 45 H 270 M 10 90 H 270 M 10 135 H 270" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

          {/* 4 Quadrant Pillars */}
          <g transform="translate(35, 40)">
            <rect x="0" y="0" width="95" height="42" rx="6" fill="#EFF6FF" stroke="#155EEF" strokeWidth="1.25" />
            <text x="47" y="24" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#155EEF" fontWeight="bold">01. CASHFLOW</text>

            <rect x="110" y="0" width="95" height="42" rx="6" fill="#F8FAFC" stroke="#071A33" strokeWidth="1.25" />
            <text x="157" y="24" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#071A33" fontWeight="bold">02. BEHAVIOR</text>

            <rect x="0" y="55" width="95" height="42" rx="6" fill="#F8FAFC" stroke="#071A33" strokeWidth="1.25" />
            <text x="47" y="79" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#071A33" fontWeight="bold">03. ALT DATA</text>

            <rect x="110" y="55" width="95" height="42" rx="6" fill="#EFF6FF" stroke="#155EEF" strokeWidth="1.25" />
            <text x="157" y="79" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#155EEF" fontWeight="bold">04. MACRO</text>
          </g>

          {/* Central Decision Convergence Node */}
          <circle cx="137" cy="90" r="14" fill="#FFFFFF" stroke="#16A34A" strokeWidth="2" />
          <path d="M 132 90 L 135 93 L 142 86" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <ResourceEmergence3D initialZ={-1000} rotateX={18} duration={1.2}>
          
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#155EEF] bg-blue-50 border border-blue-200/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ARCHITECTURAL PILLARS // SECTION 04</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight font-sans">
              GO DEEPER.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-normal">
              Explore the foundational systems driving contemporary financial infrastructure.
            </p>
          </div>

          {/* 3 Deep Dive Pillar Cards */}
          <div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left"
            style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
          >
            {pillars.map((pillar, i) => (
              <div
                key={pillar.number}
                data-resource-card
                className="group relative p-8 rounded-3xl bg-white border border-slate-200 hover:border-[#155EEF] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div>
                  {/* Top Bar with Number & Tagline */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <span className="text-2xl font-black text-slate-300 group-hover:text-[#155EEF] font-mono transition-colors">
                      {pillar.number}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#155EEF] bg-blue-50 px-2 py-0.5 rounded">
                      {pillar.tagline}
                    </span>
                  </div>

                  {/* Technical Architectural Sketch */}
                  <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:border-blue-100 transition-colors">
                    {pillar.svgSketch}
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xl font-black text-[#071A33] tracking-tight group-hover:text-[#155EEF] transition-colors leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {pillar.subtitle}
                  </p>

                  {/* Bullets */}
                  <ul className="mt-5 space-y-2.5 text-xs text-slate-700">
                    {pillar.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Link to Product Page */}
                <div className="mt-8 pt-5 border-t border-slate-100">
                  <Link
                    href={pillar.productLink}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#155EEF] group-hover:translate-x-1 transition-transform"
                  >
                    <span>{pillar.productLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </ResourceEmergence3D>
      </div>
    </section>
  );
};
