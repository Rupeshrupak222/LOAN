'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building2,
  CreditCard,
  Layers,
  Coins,
  Zap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { ResourceEmergence3D } from '../motion/ResourceEmergence3D';

interface ProductBridgeItem {
  id: string;
  name: string;
  category: string;
  href: string;
  description: string;
  architectureBadge: string;
  icon: React.ElementType;
}

export const ProductKnowledgeBridge3D: React.FC = () => {
  const products: ProductBridgeItem[] = [
    {
      id: 'core-banking',
      name: 'Core Banking Engine',
      category: 'BANKING CORE',
      href: '/products/core-banking-engine',
      description: 'Double-entry ACID accounting kernel, multi-currency ledgers, and zero-drift balance calculations.',
      architectureBadge: 'SUB-5MS LATENCY',
      icon: Building2,
    },
    {
      id: 'debit-cards',
      name: 'Debit & Prepaid Cards',
      category: 'ISSUANCE & CONTROL',
      href: '/products/debit-prepaid-cards',
      description: 'Instant virtual card generation, dynamic spend velocity controls, and tokenized wallet provisioning.',
      architectureBadge: 'ZERO-TRUST TOKEN',
      icon: CreditCard,
    },
    {
      id: 'neobanking',
      name: 'Neobanking Portal',
      category: 'COMMERCIAL WORKSPACE',
      href: '/products/neobanking-portal',
      description: 'Embedded financial workspace for high-growth enterprises with automated payroll and tax reconciliation.',
      architectureBadge: 'MULTI-TENANT FABRIC',
      icon: Layers,
    },
    {
      id: 'personal-loans',
      name: 'Personal Lending Rails',
      category: 'CREDIT ORIGINATION',
      href: '/products/personal-loans',
      description: 'Digital loan origination and servicing infrastructure with automated e-mandate and collateral management.',
      architectureBadge: 'INSTANT SANCTION',
      icon: Coins,
    },
    {
      id: 'npci-upi',
      name: 'NPCI UPI 2.0 Network',
      category: 'REAL-TIME PAYMENTS',
      href: '/products/npci-upi-network',
      description: 'Multi-bank switch router with automated circuit breakers, recurring autopay mandates, and soundbox telemetry.',
      architectureBadge: '99.995% UPTIME',
      icon: Zap,
    },
    {
      id: 'ai-scorecard',
      name: 'AI Underwriting Scorecard',
      category: 'RISK & DECISIONING',
      href: '/products/ai-underwriting-scorecard',
      description: 'The 4-pillar risk engine providing continuous cashflow evaluation and explainable SHAP adverse attribution.',
      architectureBadge: 'SHAP EXPLAINABLE',
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="relative py-20 sm:py-28 bg-white border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <ResourceEmergence3D initialZ={-900} rotateX={14} duration={1.1}>
          
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#155EEF] bg-blue-50 border border-blue-200/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PRODUCT KNOWLEDGE // SECTION 07</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight font-sans">
              LEARN THE INFRASTRUCTURE.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-normal">
              Connect conceptual fintech intelligence directly to production engines deployed across modern financial institutions.
            </p>
          </div>

          {/* Product Cards Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left"
            style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
          >
            {products.map((prod) => {
              const Icon = prod.icon;

              return (
                <Link
                  key={prod.id}
                  href={prod.href}
                  data-resource-card
                  className="group relative p-7 rounded-3xl bg-slate-50/70 border border-slate-200 hover:border-[#155EEF] hover:bg-white transition-all duration-300 shadow-xs hover:shadow-xl flex flex-col justify-between"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 text-[10px] font-mono">
                      <span className="text-slate-500 font-bold uppercase">{prod.category}</span>
                      <span className="text-[#155EEF] font-bold bg-blue-50 px-2 py-0.5 rounded">
                        {prod.architectureBadge}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5 my-5">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-[#155EEF] flex items-center justify-center group-hover:bg-[#155EEF] group-hover:text-white transition-colors shadow-xs">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-[#071A33] tracking-tight group-hover:text-[#155EEF] transition-colors">
                          {prod.name}
                        </h3>
                        <span className="text-xs font-mono text-slate-400">Production Engine</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {prod.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#155EEF] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      <span>View Architecture</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#155EEF] transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>

        </ResourceEmergence3D>
      </div>
    </section>
  );
};
