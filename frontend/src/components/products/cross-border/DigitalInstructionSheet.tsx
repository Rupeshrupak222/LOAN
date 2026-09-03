'use client';

import React from 'react';
import {
  FileText,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   DigitalInstructionSheet — "THE PAYMENT INSTRUCTION"
   ─────────────────────────────────────────────────────────────
   ▸ Structured Financial Instruction Document:
     - Reference: UETR 9b2d8e41-0f7a-4c28-8d39-e93d5a0c1b4f
     - Source: New York, USA ($10,000.00 USD)
     - Destination: London, UK (£7,890.00 GBP)
     - Status: ISO 20022 pacs.008 Signed
   ▸ Folds compactly to enter settlement chamber.
   ══════════════════════════════════════════════════════════════ */

interface FieldItem {
  label: string;
  value: string;
}

export const DigitalInstructionSheet: React.FC = () => {
  const fields: FieldItem[] = [
    { label: 'Instruction Reference', value: 'UETR-9B2D-8E41-0F7A' },
    { label: 'Debtor Clearing Hub', value: 'New York (JFK / LGA)' },
    { label: 'Creditor IBAN', value: 'GB29 BUKB 2020 1555 9999 88' },
    { label: 'ISO 20022 Schema', value: 'pacs.008.001.08 Credit Transfer' },
  ];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <FileText className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>STRUCTURED SETTLEMENT DOCUMENT</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          The Payment Instruction
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          The transaction metadata is encapsulated in a tamper-proof ISO 20022 instruction sheet before compressing into the central settlement chamber.
        </p>
      </div>

      {/* Main Document Presentation */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#071A33] to-[#155EEF] text-white flex items-center justify-center font-bold">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">SWIFT GPI ENVELOPE</span>
              <h3 className="text-2xl font-black text-[#071A33]">Signed Wire Manifest</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
            Cryptographically Verified
          </span>
        </div>

        {/* Structured Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {fields.map((f, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase block">{f.label}</span>
              <span className="font-bold text-[#071A33] block truncate">{f.value}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-3 border-t border-slate-100">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Atomic instruction hashing ensures zero tampering during transit.</span>
        </div>
      </div>
    </section>
  );
};
