'use client';

import React, { useState } from 'react';
import { Layers, ShieldCheck, Database, Cpu, Zap, Lock, RefreshCw, CheckCircle2 } from 'lucide-react';

interface ArchLayer {
  id: string;
  name: string;
  level: string;
  badge: string;
  description: string;
  technologies: string[];
  specs: string;
}

const ARCH_LAYERS: ArchLayer[] = [
  {
    id: 'layer-gateway',
    name: '1. Ingestion & Edge Gateway Layer',
    level: 'Layer 01 · Ingress',
    badge: 'mTLS & HMAC',
    description:
      'Idempotent API gateway terminating mutual TLS, enforcing rate limits per tenant, and deserializing banking payloads.',
    technologies: ['gRPC Protobuf', 'REST JSON Schema', 'WAF Anti-DDoS', 'Idempotency Locking'],
    specs: '< 2ms Ingress Overhead',
  },
  {
    id: 'layer-orchestration',
    name: '2. Financial Orchestration & Rule Engine',
    level: 'Layer 02 · Execution',
    badge: 'State Machine',
    description:
      'Evaluates dynamic DTI ratios, anti-overdraft policies, AML rules, and prepares double-entry journal transactions.',
    technologies: ['DTI Rule Matrix', 'Balance Lock Engine', 'ACID State Machine', 'Rollback Guard'],
    specs: '< 4ms Policy Validation',
  },
  {
    id: 'layer-ledger',
    name: '3. Double-Entry Journal & Ledger Core',
    level: 'Layer 03 · Persistence',
    badge: 'PostgreSQL ACID',
    description:
      'Enforces double-entry balance invariants. Mutates asset and liability accounts in exact NUMERIC(14,2) decimal precision.',
    technologies: ['NUMERIC(14,2) Math', 'Double-Entry Invariants', 'Append-Only Event Store', 'Partition Sharding'],
    specs: 'Zero Float Drift · 100% Invariant',
  },
  {
    id: 'layer-settlement',
    name: '4. Clearing Rails & Settlement Switch',
    level: 'Layer 04 · Egress',
    badge: 'Multi-Rail Switch',
    description:
      'Direct switch connectivity to NPCI UPI, RTGS, NEFT, and IMPS rails with automatic active-active multi-bank failover.',
    technologies: ['NPCI UPI 2.0 Switch', 'IMPS / RTGS Clearing', 'Automated EOD Reconciliation', 'Webhook Dispatcher'],
    specs: 'T+0 Real-Time Gross Settlement',
  },
];

export const CoreArchitectureMatrix: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<string>('layer-ledger');

  return (
    <section className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>FOUR-LAYER FINANCIAL STACK</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          One Core. Every Financial Layer Synchronized.
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Explore how Adyapan Core Banking Engine unifies edge ingress, policy execution, double-entry persistence, and external clearing into one zero-drift stack.
        </p>
      </div>

      {/* Layer Interactive Tree Stack */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {ARCH_LAYERS.map((layer) => {
          const isSelected = activeLayer === layer.id;

          return (
            <div
              key={layer.id}
              onClick={() => setActiveLayer(layer.id)}
              className={`rounded-3xl border p-6 text-left transition-all duration-300 cursor-pointer shadow-sm ${
                isSelected
                  ? 'bg-[#071A33] text-white border-[#155EEF] shadow-2xl ring-2 ring-[#155EEF]/30 scale-[1.02]'
                  : 'bg-white text-[#071A33] border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-200/50">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      isSelected ? 'bg-emerald-400 animate-ping' : 'bg-slate-300'
                    }`}
                  />
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                      {layer.level}
                    </span>
                    <h3 className="text-base sm:text-lg font-black">{layer.name}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-blue-500/20 text-blue-300 border-blue-400/40'
                        : 'bg-blue-50 text-[#155EEF] border-blue-200'
                    }`}
                  >
                    {layer.badge}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {layer.specs}
                  </span>
                </div>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                {layer.description}
              </p>

              {/* Technologies / Feature nodes inside layer */}
              <div className="flex flex-wrap gap-2 pt-2">
                {layer.technologies.map((tech, i) => (
                  <span
                    key={i}
                    className={`text-[11px] font-mono font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 border-slate-700 text-slate-200'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'text-emerald-400' : 'text-[#155EEF]'}`} />
                    <span>{tech}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
