'use client';

import React from 'react';
import { ShieldCheck, Lock, Smartphone, Key, CheckCircle2, Cpu, EyeOff, Sparkles } from 'lucide-react';

interface SecurityPillar {
  title: string;
  badge: string;
  description: string;
  specs: string;
}

const PILLARS: SecurityPillar[] = [
  {
    title: 'Network-Level Tokenization (DPAN)',
    badge: 'Zero Plaintext Exposure',
    description: 'Actual 16-digit Primary Account Numbers are never stored on device. Replaced with cryptographically bound Device PAN tokens.',
    specs: 'EMVCo Tokenized Spec',
  },
  {
    title: 'Dynamic Time-Based CVV Generation',
    badge: 'Rotating Every 60s',
    description: 'In-app virtual cards generate single-use 3-digit security codes rotating continuously to neutralize e-commerce card-not-present fraud.',
    specs: 'HMAC-SHA256 Rolling Code',
  },
  {
    title: 'Location & MCC Geo-Fencing',
    badge: 'Granular Controls',
    description: 'Enforce real-time transaction boundaries based on device GPS proximity, specific country codes, and authorized Merchant Category Codes.',
    specs: '< 150ms Fraud Decisioning',
  },
  {
    title: 'Hardware Security Module (HSM) Vaulting',
    badge: 'FIPS 140-2 Level 3',
    description: 'All cryptographic keys, PIN blocks, and cardholder encryption material reside inside certified HSM hardware tamper-resistant enclaves.',
    specs: 'Zero Key Material in RAM',
  },
];

export const CardSecurityShell: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-12 shadow-2xl relative overflow-hidden text-left">
        {/* Ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#155EEF]/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-700 text-xs font-mono font-bold text-blue-300">
                <ShieldCheck className="w-4 h-4 text-[#155EEF]" />
                <span>CRYPTOGRAPHIC SECURITY SHELL</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-black text-white">
                Multi-Layered Protection for Every Tap & Swipe
              </h3>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PCI-DSS L1 CERTIFIED ALIGNED</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PILLARS.map((p, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Pillar 0{idx + 1}</span>
                  <span className="text-[10px] font-mono font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {p.badge}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white">{p.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{p.description}</p>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Engine Spec:</span>
                  <span className="text-emerald-400 font-bold">{p.specs}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
