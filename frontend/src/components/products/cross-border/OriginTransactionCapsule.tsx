'use client';

import React from 'react';
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  FileCheck,
  Zap,
  Globe,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   OriginTransactionCapsule — "EVERY JOURNEY STARTS SOMEWHERE."
   ─────────────────────────────────────────────────────────────
   ▸ Detailed inspection of the transaction capsule at origin:
     - Origin: New York, United States
     - Amount: USD 10,000.00
     - Sender Bank: Chase Manhattan Bank NY
     - SWIFT UETR: 9b2d8e41-0f7a-4c28-8d39-e93d5a0c1b4f
   ▸ Clearly labeled: "Illustrative example"
   ══════════════════════════════════════════════════════════════ */

interface CapsuleDataField {
  label: string;
  value: string;
}

export const OriginTransactionCapsule: React.FC = () => {
  const fields: CapsuleDataField[] = [
    { label: 'Origin City', value: 'New York (JFK / LGA Hub)' },
    { label: 'Origin Currency', value: 'USD ($ United States Dollar)' },
    { label: 'Transfer Amount', value: '$10,000.00 USD' },
    { label: 'SWIFT UETR Key', value: '9b2d8e41-0f7a-4c28-8d39-e93d5a0c1b4f' },
  ];

  return (
    <section id="origin-capsule" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Compass className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>ORIGIN DISPATCH POINT</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Every Journey Starts Somewhere
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Before entering international airspace, the transaction capsule is signed with ISO 20022 metadata, sanctions verification hashes, and correspondent routing keys.
        </p>
      </div>

      {/* Main Capsule Presentation Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto text-left">
        {/* Left: Origin Identity Panel */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 uppercase">
                ORIGIN DISPATCH · NEW YORK
              </span>
              <span className="text-xs font-mono text-emerald-600 font-bold">Sanctions Pre-Cleared</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-[#071A33] tracking-tight">Origin Financial Capsule</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The payload packs authenticated originator KYC credentials, destination IBAN coordinates, and purpose of payment (POP) regulatory tags.
            </p>
          </div>

          {/* Capsule Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            {fields.map((f, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{f.label}</span>
                <span className="font-bold text-[#071A33] block truncate">{f.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-mono text-slate-400">
            <span>REGULATORY CLEARANCE:</span>
            <span className="font-bold text-[#155EEF]">OFAC & FinCEN Automated Screening Pass</span>
          </div>
        </div>

        {/* Right: Dark Telemetry Dispatch Capsule */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-blue-300 uppercase">
                CAPSULE DISPATCH TELEMETRY
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700">
              ILLUSTRATIVE EXAMPLE
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Debit Account Status:</span>
              <span className="text-emerald-400 font-bold">100% Reserved & Held</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Next Flight Stage:</span>
              <span className="text-blue-300 font-bold">Transatlantic Flight Arc</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-[#155EEF] via-blue-400 to-emerald-400 rounded-full w-2/5 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-3 border-t border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cryptographically sealed for secure international transit.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
