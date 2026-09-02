'use client';

import React from 'react';
import {
  Zap,
  Globe,
  Lock,
  Cpu,
  RefreshCw,
  FolderTree,
  Server,
  ArrowRight,
} from 'lucide-react';

interface Capability {
  icon: React.ElementType;
  title: string;
  tag: string;
  description: string;
}

const CAPABILITIES: Capability[] = [
  {
    icon: Globe,
    title: 'Dual Protocol REST & gRPC Mesh',
    tag: 'Wire Protocol',
    description: 'Consume services via OpenAPI 3.0 standard REST endpoints or ultra-fast gRPC protobuf streams with zero latency overhead.',
  },
  {
    icon: Zap,
    title: 'Sub-10ms Ingress Processing',
    tag: 'Ultra-Low Latency',
    description: 'High-performance Rust/Go API gateway routing engine executing validation and authorization in single-digit milliseconds.',
  },
  {
    icon: Lock,
    title: 'Cryptographic HMAC & mTLS Ingress',
    tag: 'Zero-Trust Security',
    description: 'Bidirectional certificate validation and SHA-256 signed request envelopes prevent packet replay and tampering.',
  },
  {
    icon: RefreshCw,
    title: 'Atomic Idempotency Engine',
    tag: 'Financial Safety',
    description: 'Redis cluster-backed lock state prevents duplicate payments or disbursals even during severe client network drops.',
  },
  {
    icon: FolderTree,
    title: 'Schema Validation & Deserialization',
    tag: 'Strict Typing',
    description: 'Strict JSON Schema 2020-12 enforcement with real-time field type verification before hitting core banking ledgers.',
  },
  {
    icon: Server,
    title: 'Reliable Event Webhooks',
    tag: 'Event Driven',
    description: 'Automated exponential backoff retries and cryptographic webhook payloads for all banking mutations and settlement states.',
  },
];

export const GatewayCapabilitiesCascade: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 space-y-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Cpu className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>DEVELOPER & ARCHITECT CAPABILITIES</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Engineered for Resilient Financial Connectivity
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Built from the ground up for high-availability enterprise environments demanding strict security, sub-second latency, and zero drift.
        </p>
      </div>

      {/* 6-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {CAPABILITIES.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#155EEF]/50 transition-all space-y-4 group"
            >
              <div className="flex justify-between items-center">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#155EEF] flex items-center justify-center group-hover:bg-[#155EEF] group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {c.tag}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                  {c.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">{c.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
