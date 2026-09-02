'use client';

import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Lock,
  Server,
  FileCode,
} from 'lucide-react';

interface Stage {
  id: number;
  name: string;
  badge: string;
  headline: string;
  description: string;
  payloadDiff: {
    ingressHeader: string;
    authVerification: string;
    routingDecision: string;
    upstreamResponse: string;
  };
}

const STAGES: Stage[] = [
  {
    id: 1,
    name: '1. Request Generated',
    badge: 'Stage 01 / 05',
    headline: 'Client Application Ingest & mTLS Handshake',
    description: 'A partner fintech application initiates a POST /v1/loans/originate request signed with HMAC-SHA256 headers.',
    payloadDiff: {
      ingressHeader: 'X-Adyapan-Signature: sha256=9f82a1b...',
      authVerification: 'mTLS Handshake: TLS 1.3 Certified',
      routingDecision: 'Pending Gateway Processing',
      upstreamResponse: 'Ingress Received',
    },
  },
  {
    id: 2,
    name: '2. Gateway Auth & Token Lock',
    badge: 'Stage 02 / 05',
    headline: 'Distributed Token Bucket & Idempotency Key Lock',
    description: 'The gateway validates tenant rate limits and claims a Redis distributed lock on the idempotency key.',
    payloadDiff: {
      ingressHeader: 'Idempotency-Key: 8a41-92bf-412e',
      authVerification: 'Token Bucket: 850/1000 Req Remaining',
      routingDecision: 'Rate Limit Checked OK',
      upstreamResponse: 'Idempotency Acquired',
    },
  },
  {
    id: 3,
    name: '3. Schema Validation',
    badge: 'Stage 03 / 05',
    headline: 'High-Speed JSON Schema 2020-12 Deserialization',
    description: 'Strict typing verification guarantees all mandatory fields (borrowerId, principalAmount, tenureMonths) satisfy schema rules.',
    payloadDiff: {
      ingressHeader: 'Content-Type: application/json',
      authVerification: 'Schema Validator: Rust-based V8 Parser',
      routingDecision: '0 Schema Violations',
      upstreamResponse: 'Payload Enriched',
    },
  },
  {
    id: 4,
    name: '4. Service Routing',
    badge: 'Stage 04 / 05',
    headline: 'Zero-Copy gRPC Protobuf Internal Forwarding',
    description: 'The JSON request is transformed into a compact binary Protobuf stream and dispatched to the Lending Core Engine.',
    payloadDiff: {
      ingressHeader: 'Wire Protocol: HTTP/2 gRPC Protobuf',
      authVerification: 'Target: srv-lending-core:50051',
      routingDecision: 'Round-Robin Healthy Node',
      upstreamResponse: 'Core Processing (6ms)',
    },
  },
  {
    id: 5,
    name: '5. Response Returned',
    badge: 'Stage 05 / 05',
    headline: '200 OK Response & Telemetry Commit',
    description: 'Core response serialized back to standard JSON format with latency metrics and cryptographic audit log commit.',
    payloadDiff: {
      ingressHeader: 'Status: 200 OK (8ms total)',
      authVerification: 'Audit Log: Committed to WORM Vault',
      routingDecision: 'Dispatched to Client App',
      upstreamResponse: '{"status": "APPROVED", "loanId": "LN-9812"}',
    },
  },
];

export const FollowRequestJourney: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const current = STAGES[activeStep];

  return (
    <section id="journey" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>REQUEST LIFECYCLE STEP-THROUGH</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Follow an API Request Through the Gateway
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Trace a single API request from client dispatch and rate-limiting to binary Protobuf conversion and sub-10ms response return.
        </p>
      </div>

      {/* Progress Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8 max-w-[1400px] mx-auto">
        {STAGES.map((st, idx) => {
          const isSelected = activeStep === idx;
          return (
            <button
              key={st.id}
              onClick={() => setActiveStep(idx)}
              className={`p-4 rounded-2xl text-left border transition-all text-xs font-mono font-bold cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="block text-[9px] uppercase opacity-75">Step 0{idx + 1}</span>
              <span className="truncate block mt-1 font-bold text-sm">{st.name.split('. ')[1]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto">
        {/* Left Column: Stage Explanation */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 flex flex-col justify-between text-left space-y-6 shadow-sm">
          <div className="space-y-3">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200">
              {current.badge}
            </span>
            <h3 className="text-2xl font-black text-[#071A33] mt-2">{current.headline}</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{current.description}</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <button
              onClick={() => setActiveStep((prev) => (prev > 0 ? prev - 1 : prev))}
              disabled={activeStep === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              ← Previous Step
            </button>

            <button
              onClick={() => setActiveStep((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev))}
              disabled={activeStep === STAGES.length - 1}
              className="px-6 py-2 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white text-xs font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next Step →
            </button>
          </div>
        </div>

        {/* Right Column: Simulated JSON Header Diff Viewer */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-6 sm:p-8 flex flex-col justify-between text-left shadow-2xl font-mono text-xs space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase">GATEWAY TELEMETRY STATE</span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[9px] text-slate-400 uppercase">Ingress Signature</p>
                <p className="text-blue-300 font-bold mt-0.5 text-xs">{current.payloadDiff.ingressHeader}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[9px] text-slate-400 uppercase">Auth & Rate Limit</p>
                <p className="text-emerald-400 font-bold mt-0.5 text-xs">{current.payloadDiff.authVerification}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[9px] text-slate-400 uppercase">Routing & Cluster</p>
                <p className="text-slate-200 font-bold mt-0.5 text-xs">{current.payloadDiff.routingDecision}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <p className="text-[9px] text-slate-400 uppercase">Payload State</p>
                <p className="text-emerald-300 font-bold mt-0.5 text-xs">{current.payloadDiff.upstreamResponse}</p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between text-[10px] text-slate-400">
            <span>Protocol: HTTP/2 & gRPC</span>
            <span className="text-emerald-400 font-bold">Zero-Copy Memory Pipe</span>
          </div>
        </div>
      </div>
    </section>
  );
};
