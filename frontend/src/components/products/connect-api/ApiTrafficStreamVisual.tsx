'use client';

import React, { useState } from 'react';
import { Activity, ArrowUpRight, ArrowDownRight, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

interface TrafficStream {
  id: string;
  name: string;
  volume: string;
  status: string;
  latency: string;
  rateLimit: string;
}

const STREAMS: TrafficStream[] = [
  { id: '1', name: 'POST /v1/payments/disburse (IMPS)', volume: '4,820 Req/sec', status: 'Optimal', latency: '6ms', rateLimit: '48% Consumed' },
  { id: '2', name: 'GET /v1/accounts/balance (Core)', volume: '12,400 Req/sec', status: 'Cached L1', latency: '1ms', rateLimit: '22% Consumed' },
  { id: '3', name: 'POST /v1/cards/virtual/authorize', volume: '1,950 Req/sec', status: 'Optimal', latency: '9ms', rateLimit: '35% Consumed' },
  { id: '4', name: 'POST /v1/webhooks/events (Dispatched)', volume: '8,100 Events/sec', status: 'Delivered', latency: '4ms', rateLimit: '15% Consumed' },
];

export const ApiTrafficStreamVisual: React.FC = () => {
  const [hoveredStream, setHoveredStream] = useState<string | null>(null);

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Activity className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>TRAFFIC & STREAM GOVERNANCE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Real-Time API Traffic & Stream Control
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Monitor ingress velocity, sub-millisecond cache hits, and adaptive rate-limiting across all connected enterprise tenants.
        </p>
      </div>

      {/* Main Container */}
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">TELEMETRY AGGREGATOR</span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">Live Endpoint Traffic Breakdown</h3>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            SIMULATED TRAFFIC STREAM
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {STREAMS.map((s) => {
            const isHovered = hoveredStream === s.id;
            return (
              <div
                key={s.id}
                onMouseEnter={() => setHoveredStream(s.id)}
                onMouseLeave={() => setHoveredStream(null)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isHovered
                    ? 'bg-gradient-to-tr from-[#0F294D] to-[#155EEF] border-[#155EEF] shadow-lg scale-[1.01]'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1">
                  <p className="font-bold text-white text-sm">{s.name}</p>
                  <p className="text-[10px] text-slate-400">Token Bucket: {s.rateLimit}</p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <span className="text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-400/30">
                    {s.latency}
                  </span>
                  <span className="font-black text-emerald-400 text-sm">{s.volume}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
