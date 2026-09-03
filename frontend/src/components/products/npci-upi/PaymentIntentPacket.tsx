'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   PaymentIntentPacket — "IT STARTS WITH A SINGLE INTENT."
   ─────────────────────────────────────────────────────────────
   ▸ Customer Initiator node generates a structured payment packet:
     - Virtual Payment Address (VPA)
     - Transaction Amount
     - Timestamp & Nonce Token
     - 2FA Cryptographic Signature
   ▸ Demonstrates packet formation & path ingress.
   ══════════════════════════════════════════════════════════════ */

interface PacketField {
  label: string;
  value: string;
  verified: boolean;
}

export const PaymentIntentPacket: React.FC = () => {
  const [packetState, setPacketState] = useState<'idle' | 'transmitting' | 'ingested'>('transmitting');

  const fields: PacketField[] = [
    { label: 'Payer VPA', value: 'rahul.sharma@okaxis', verified: true },
    { label: 'Payee VPA', value: 'merchant.adyapan@icici', verified: true },
    { label: 'Transaction Value', value: '₹4,850.00 INR', verified: true },
    { label: 'Auth Token', value: '0x9E7F...3B2A (256-Bit SHA)', verified: true },
  ];

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>PAYMENT INITIATION LAYER</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          It Starts with a Single Intent
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          When a payer approves a digital payment request, a structured cryptographic packet is created and dispatched across the high-speed network.
        </p>
      </div>

      {/* Main Packet Visual Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto text-left">
        {/* Left: Customer Node Initiator Card */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200 uppercase">
                NODE 01 · PAYER INGRESS
              </span>
              <span className="text-xs font-mono text-emerald-600 font-bold">2FA Approved</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-[#071A33] tracking-tight">Structured Payment Packet</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The payment packet encapsulates virtual addresses, transaction amounts, and cryptographic nonces in a single atomic payload.
            </p>
          </div>

          {/* Packet Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            {fields.map((f, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">{f.label}</span>
                <span className="font-bold text-[#071A33] block truncate">{f.value}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-mono text-slate-400">
            <span>PACKET PROTOCOL:</span>
            <span className="font-bold text-[#155EEF]">NPCI UPI v2.0 JSON-RPC Envelope</span>
          </div>
        </div>

        {/* Right: Dark Telemetry Route Ingress */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-10 flex flex-col justify-between space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-blue-300 uppercase">
                PACKET SWITCHING TELEMETRY
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              IN FLIGHT (12ms)
            </span>
          </div>

          {/* Packet Ingress Visual Gauge */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Originating Node:</span>
              <span className="text-white font-bold">Payer Mobile Device</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Destination Switch:</span>
              <span className="text-blue-300 font-bold">Adyapan Dynamic Router</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-[#155EEF] via-blue-400 to-emerald-400 rounded-full w-3/4 animate-pulse" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 pt-3 border-t border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sub-second transmission over dedicated encrypted financial fibers.</span>
          </div>
        </div>
      </div>
    </section>
  );
};
