'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, CheckCircle2, Server, Globe } from 'lucide-react';

interface SecurityLayer {
  id: string;
  name: string;
  badge: string;
  description: string;
  specs: string[];
}

const LAYERS: SecurityLayer[] = [
  {
    id: 'mtls',
    name: 'Mutual TLS (mTLS 1.3)',
    badge: 'Layer 01 / Cryptographic Ingress',
    description: 'Enforces bidirectional x509 certificate validation on all incoming gRPC and HTTPS connections.',
    specs: ['TLS 1.3 Strict Cipher Suites', 'Automated Certificate Revocation Checking', 'Zero Plaintext Transmission'],
  },
  {
    id: 'hmac',
    name: 'HMAC-SHA256 Request Signatures',
    badge: 'Layer 02 / Request Integrity',
    description: 'Every request payload is verified against timestamped HMAC headers to prevent replay and MITM attacks.',
    specs: ['5-Minute Timestamp Window Expiry', 'Tenant Secret Key Isolation', 'Non-Repudiation Audit Logs'],
  },
  {
    id: 'rate-limit',
    name: 'Distributed Token Bucket Limiting',
    badge: 'Layer 03 / DDoS & Abuse Defense',
    description: 'Redis-backed cluster level rate-limiting enforcing strict per-tenant and per-IP transaction ceilings.',
    specs: ['Sub-Millisecond Redis Token Sync', 'Burst Capacity Allowance', 'Graceful 429 Retry-After Headers'],
  },
  {
    id: 'idempotency',
    name: 'Redis Idempotency Locks',
    badge: 'Layer 04 / Double-Spend Prevention',
    description: 'Guarantees financial mutation requests are executed exactly once regardless of network retries.',
    specs: ['24-Hour Idempotency Cache', 'Atomic Inflight Lock Acquisition', 'Zero Duplicate Charges'],
  },
];

export const GatewaySecurityShell: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState<string>('mtls');

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>ZERO-TRUST SECURITY SHELL</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Enterprise Security at the Gateway Boundary
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Multi-layer defense protecting your banking infrastructure before any untrusted byte touches backend services.
        </p>
      </div>

      {/* Grid of Security Layers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1400px] mx-auto text-left">
        {LAYERS.map((l) => {
          const isSelected = activeLayer === l.id;
          return (
            <div
              key={l.id}
              onClick={() => setActiveLayer(l.id)}
              className={`p-7 rounded-3xl border transition-all duration-300 cursor-pointer space-y-4 shadow-sm ${
                isSelected
                  ? 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white border-[#155EEF] shadow-xl ring-2 ring-[#155EEF]/30 scale-[1.02]'
                  : 'bg-white text-[#071A33] border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isSelected ? 'bg-white/10 text-blue-300 border-white/20' : 'bg-blue-50 text-[#155EEF] border-blue-200'
                  }`}
                >
                  {l.badge}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">HARDENED</span>
              </div>

              <div>
                <h3 className="text-lg font-black">{l.name}</h3>
                <p className={`text-xs mt-1.5 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                  {l.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/30 space-y-1.5 font-mono text-xs">
                {l.specs.map((sp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-[#155EEF]'}`} />
                    <span className={isSelected ? 'text-slate-200' : 'text-slate-700'}>{sp}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
