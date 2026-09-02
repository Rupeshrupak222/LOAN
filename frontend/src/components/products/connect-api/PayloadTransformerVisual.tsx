'use client';

import React, { useState } from 'react';
import { FileCode, ArrowRight, RotateCw, CheckCircle2, Zap } from 'lucide-react';

export const PayloadTransformerVisual: React.FC = () => {
  const [amount, setAmount] = useState(5000);
  const [recipient, setRecipient] = useState('payee_corp_9912');

  return (
    <section className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <FileCode className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>ZERO-OVERHEAD TRANSFORMATION</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          Bidirectional Payload Transformation
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Translate public JSON schemas into compact internal binary Protobuf structures on the fly with zero serialization overhead.
        </p>
      </div>

      {/* Main Transformation Visual Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch max-w-5xl mx-auto text-left">
        {/* Left: Client JSON Ingress */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 space-y-4 shadow-sm font-mono text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase">CLIENT REST INGRESS</span>
            <span className="text-[10px] text-[#155EEF] font-bold bg-blue-50 px-2 py-0.5 rounded">application/json</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1.5">
            <p className="text-slate-400">{'// Client Request'}</p>
            <p>{'{'}</p>
            <p className="pl-4">
              <span className="text-blue-600">"amount"</span>: <span className="font-bold text-emerald-600">{amount}</span>,
            </p>
            <p className="pl-4">
              <span className="text-blue-600">"currency"</span>: <span className="text-amber-600">"INR"</span>,
            </p>
            <p className="pl-4">
              <span className="text-blue-600">"payeeId"</span>: <span className="text-amber-600">"{recipient}"</span>,
            </p>
            <p className="pl-4">
              <span className="text-blue-600">"rail"</span>: <span className="text-amber-600">"IMPS_INSTANT"</span>
            </p>
            <p>{'}'}</p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase block">Simulate Amount (INR)</label>
            <input
              type="range"
              min={1000}
              max={100000}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
            />
          </div>
        </div>

        {/* Center: Transformation Bridge Indicator */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center p-2">
          <div className="w-12 h-12 rounded-2xl bg-[#155EEF] text-white flex items-center justify-center shadow-lg shadow-[#155EEF]/30 animate-pulse">
            <ArrowRight className="w-6 h-6 rotate-90 lg:rotate-0" />
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-400 mt-2 text-center uppercase">
            Protobuf Serialization (Sub-1ms)
          </span>
        </div>

        {/* Right: Internal Banking Mesh Protobuf */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-[#071A33] text-white p-6 sm:p-7 space-y-4 shadow-2xl font-mono text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-[10px] font-bold text-blue-300 uppercase">INTERNAL PROTOBUF WIRE</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              gRPC Binary Stream
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 space-y-1.5">
            <p className="text-slate-400">{'// Banking Core Protobuf Msg'}</p>
            <p className="text-blue-300">message DisbursePayload {'{'}</p>
            <p className="pl-4">
              <span className="text-slate-400">int64</span> value_cents = <span className="text-emerald-400 font-bold">{amount * 100}</span>;
            </p>
            <p className="pl-4">
              <span className="text-slate-400">string</span> currency_iso = <span className="text-amber-300">"356"</span>;
            </p>
            <p className="pl-4">
              <span className="text-slate-400">bytes</span> recipient_hash = <span className="text-blue-400">0x7a8f...</span>;
            </p>
            <p className="pl-4">
              <span className="text-slate-400">RailType</span> rail_code = <span className="text-emerald-400">RAIL_IMPS_01</span>;
            </p>
            <p className="text-blue-300">{'}'}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 flex justify-between">
            <span>Payload Size Reduction:</span>
            <span className="text-emerald-400 font-bold">-68% Wire Compression</span>
          </div>
        </div>
      </div>
    </section>
  );
};
