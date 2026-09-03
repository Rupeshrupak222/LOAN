'use client';

import React from 'react';
import { Network, Zap, Shield, Cpu, ArrowRight } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

interface Props {
  activeTrack?: string;
}

export const ConversationPathSignal: React.FC<Props> = ({ activeTrack = 'lending' }) => {
  return (
    <ScrollStage3D
      id="conversation-path"
      perspective={1400}
      className="py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-12 text-left">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="5"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
          >
            <span>STAGE 03 // ACTIVE TELEMETRY</span>
          </div>

          <div
            data-depth-z="-800"
            data-rotate-x="30"
            data-offset-y="50"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              DIRECT DISPATCH{' '}
              <span className="text-[#155EEF] block">PIPELINE.</span>
            </h2>
          </div>

          <div
            data-depth-z="-600"
            data-rotate-y="-5"
            data-offset-y="30"
            data-blur="6"
            data-stagger="0.2"
          >
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Inquiries do not sit in an unread marketing inbox. Every submission initiates a direct gRPC handshake with our solutions architecture routing engine.
            </p>
          </div>
        </div>

        {/* ── 3D Signal Path Architecture Strip ── */}
        <div
          data-depth-z="-950"
          data-rotate-x="22"
          data-offset-y="70"
          data-blur="10"
          data-stagger="0.3"
          className="p-8 sm:p-10 rounded-2xl bg-[#071A33] text-white shadow-2xl relative overflow-hidden border border-slate-800"
        >
          {/* Top Status Bar */}
          <div className="flex flex-wrap items-center justify-between pb-6 border-b border-slate-800 text-xs font-mono text-slate-400 gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-white font-bold tracking-wider uppercase">
                ENCRYPTED INGRESS TUNNEL // LIVE
              </span>
            </div>

            <div className="flex items-center gap-4 text-[10px] tracking-wider uppercase text-cyan-300">
              <span>LATENCY: &lt;14MS</span>
              <span>•</span>
              <span>TLS 1.3 // AES-256</span>
            </div>
          </div>

          {/* Connected 3D Node Signal Flow */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8 relative z-10">
            {/* Node 1 */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-left">
              <div className="flex items-center justify-between text-cyan-400 font-mono text-[10px]">
                <span>01. INGRESS</span>
                <Network className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-white font-sans">Inquiry Ingestion</p>
              <p className="text-[11px] text-slate-400 font-sans">
                Payload validated against enterprise schema.
              </p>
            </div>

            {/* Node 2 */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-left">
              <div className="flex items-center justify-between text-blue-400 font-mono text-[10px]">
                <span>02. DOMAIN MATCH</span>
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-white font-sans">Solutions Mapping</p>
              <p className="text-[11px] text-slate-400 font-sans">
                Routed to domain specialist team in real time.
              </p>
            </div>

            {/* Node 3 */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-left">
              <div className="flex items-center justify-between text-emerald-400 font-mono text-[10px]">
                <span>03. COMPLIANCE</span>
                <Shield className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-white font-sans">Pre-NDA Protocol</p>
              <p className="text-[11px] text-slate-400 font-sans">
                Statutory confidentiality agreements prepared.
              </p>
            </div>

            {/* Node 4 */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-left">
              <div className="flex items-center justify-between text-amber-400 font-mono text-[10px]">
                <span>04. BRIEFING</span>
                <Zap className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs font-bold text-white font-sans">Direct Dispatch</p>
              <p className="text-[11px] text-slate-400 font-sans">
                Architect joins with pre-configured sandbox demo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ScrollStage3D>
  );
};
