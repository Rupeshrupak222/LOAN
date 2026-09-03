'use client';

import React from 'react';
import Link from 'next/link';
import { Landmark, Building2, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const EcosystemWhatWeBuild3D: React.FC = () => {
  const categories = [
    {
      title: 'BANKING & CORE',
      tag: 'LEDGERS & SWITCHES',
      desc: 'Sub-millisecond multi-currency core banking engine, neobanking portals, and developer-friendly Connect API gateways.',
      href: '/products/core-banking-engine',
      linkText: 'Explore Core Banking',
      icon: Landmark,
      depthZ: -700,
      rotX: 18,
      rotY: -10,
      stagger: 0.1,
      products: ['Core Banking Engine', 'Neobanking Portal', 'Connect API Gateway', 'Debit & Prepaid Cards'],
    },
    {
      title: 'LENDING SOLUTIONS',
      tag: 'ORIGINATION & SERVICING',
      desc: 'End-to-end digital lending rails spanning instant retail personal loans, SME business capital, mortgages, and BNPL credit checkout.',
      href: '/products/personal-loans',
      linkText: 'Explore Lending Rails',
      icon: Building2,
      depthZ: -1000,
      rotX: -14,
      rotY: 8,
      stagger: 0.25,
      products: ['Personal Loans', 'SME Business Credit', 'Home Mortgages', 'Credit Line on UPI'],
    },
    {
      title: 'PAYMENTS & SETTLEMENT',
      tag: 'REAL-TIME CLEARING',
      desc: 'Deep integration with NPCI switches, instant auto-debit NACH mandates, dynamic QR IoT soundboxes, and FX cross-border corridors.',
      href: '/products/npci-upi-network',
      linkText: 'Explore Payment Rails',
      icon: CreditCard,
      depthZ: -1300,
      rotX: 16,
      rotY: -6,
      stagger: 0.4,
      products: ['NPCI UPI Switch', 'Merchant QR Soundbox', 'Cross-Border Wire', 'NACH Auto-Debit'],
    },
    {
      title: 'AI RISK & COMPLIANCE',
      tag: 'AUDITABLE INTELLIGENCE',
      desc: 'Multi-pillar predictive underwriting scorecards, paperless DigiLocker e-KYC attestation, automated DTI rules, and append-only audit ledgers.',
      href: '/products/ai-underwriting-scorecard',
      linkText: 'Explore Risk & Scoring',
      icon: ShieldCheck,
      depthZ: -900,
      rotX: 12,
      rotY: 10,
      stagger: 0.55,
      products: ['AI Underwriting Scorecard', 'DigiLocker e-KYC', 'Immutable Audit Trail', 'Automated DTI Policy'],
    },
  ];

  return (
    <ScrollStage3D
      id="about-ecosystem"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
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
            <span>SECTION 03 // ARCHITECTURAL SUITE</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              ONE ECOSYSTEM.{' '}
              <span className="text-[#155EEF] block">MANY FINANCIAL JOURNEYS.</span>
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
              Rather than maintaining fractured point solutions, Adyapan engineers four synchronized architectural pillars that allow financial institutions to scale with absolute regulatory compliance.
            </p>
          </div>
        </div>

        {/* ── 4 Product Pillars Emerging from Different 3D Depths ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div
                key={idx}
                data-depth-z={cat.depthZ.toString()}
                data-rotate-x={cat.rotX.toString()}
                data-rotate-y={cat.rotY.toString()}
                data-scale="0.75"
                data-offset-y="75"
                data-blur="10"
                data-stagger={cat.stagger.toString()}
                className="p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-[#155EEF] transition-all space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      {cat.tag}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#155EEF] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-[#071A33] font-sans">
                    {cat.title}
                  </h3>

                  <p className="text-xs text-slate-600 font-sans leading-relaxed">
                    {cat.desc}
                  </p>

                  {/* List of included technologies */}
                  <div className="pt-2 space-y-1.5 font-mono text-[11px] text-slate-500">
                    {cat.products.map((p, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#155EEF]" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    href={cat.href}
                    className="text-xs font-mono font-bold text-[#155EEF] hover:text-[#0f44ad] transition-colors flex items-center gap-1.5"
                  >
                    <span>{cat.linkText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollStage3D>
  );
};
