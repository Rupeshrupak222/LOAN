'use client';

import React, { useState } from 'react';
import {
  QrCode,
  Volume2,
  Radio,
  Cpu,
  Server,
} from 'lucide-react';

interface SchematicLayer {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  primaryFeatures: string[];
  systemRole: string;
  telemetryMetric: string;
}

const SCHEMATIC_LAYERS: SchematicLayer[] = [
  {
    id: 'layer-acquiring',
    name: 'ACQUIRING',
    category: 'OPTICAL & SWITCH INGRESS',
    icon: QrCode,
    primaryFeatures: ['Dynamic Bharat QR', 'Multi-Bank UPI Ingress', 'Instant T+1 Settlement'],
    systemRole: 'Captures payment payload from customer UPI app and initiates banking switch verification.',
    telemetryMetric: '0% MDR Routing • 99.98% UPI Success',
  },
  {
    id: 'layer-audio',
    name: 'AUDIO',
    category: 'ACOUSTIC REACTION ENGINE',
    icon: Volume2,
    primaryFeatures: ['3W Neodymium Driver', '8 Regional Languages', '85 dB High-Volume Output'],
    systemRole: 'Translates verified transaction payloads into instantaneous audible voice prompts across the retail counter.',
    telemetryMetric: '< 1.2s Voice Latency • 85 dB Speech Tuned',
  },
  {
    id: 'layer-connectivity',
    name: 'CONNECTIVITY',
    category: 'CELLULAR IoT INFRASTRUCTURE',
    icon: Radio,
    primaryFeatures: ['4G LTE Cat-1 IoT', 'SIM Life-Cycle Management', 'Zero Wi-Fi Reliance'],
    systemRole: 'Maintains encrypted persistent MQTT telemetry with automatic carrier handover and 2G fallback.',
    telemetryMetric: 'Dual-Band Cat-1 • Persistent MQTT Sockets',
  },
  {
    id: 'layer-ops',
    name: 'MERCHANT OPS',
    category: 'TERMINAL LIFECYCLE & TELEMETRY',
    icon: Cpu,
    primaryFeatures: ['Hardware Diagnostics', '2600mAh Battery Health', 'OTA Firmware Updates'],
    systemRole: 'Delivers untethered daily store operation with remote over-the-air firmware patches and diagnostics.',
    telemetryMetric: '7-Day Standby • Anti-Tamper HSM Protection',
  },
];

export const AcquiringCapabilitiesMatrix: React.FC = () => {
  const [hoveredLayer, setHoveredLayer] = useState<string | null>('layer-acquiring');

  const activeData = SCHEMATIC_LAYERS.find((l) => l.id === hoveredLayer) || SCHEMATIC_LAYERS[0];

  return (
    <section
      id="section-capabilities-schematic"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Server className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>FINTECH HARDWARE SCHEMATIC</span>
          </div>

          <h2 className="text-3xl sm:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.08]">
            FOUR LAYERS. <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              ONE UNIFIED SYSTEM.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            A single engineered terminal unifying payment acquiring, acoustic confirmation, cellular telemetry,
            and merchant operations. Hover any layer to trace its connection to the Soundbox.
          </p>
        </div>

        {/* ── HORIZONTAL TECHNICAL BLUEPRINT DIAGRAM ── */}
        <div className="p-8 sm:p-14 rounded-3xl bg-white border-2 border-slate-200 shadow-xl relative overflow-hidden">
          {/* Subtle Grid Schematic Texture */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left: 4 Horizontal Capability Rails */}
            <div className="lg:col-span-7 space-y-4">
              {SCHEMATIC_LAYERS.map((layer) => {
                const isHovered = hoveredLayer === layer.id;
                const Icon = layer.icon;

                return (
                  <div
                    key={layer.id}
                    onMouseEnter={() => setHoveredLayer(layer.id)}
                    className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isHovered
                        ? 'bg-blue-50/80 border-[#155EEF] shadow-md shadow-blue-100 translate-x-2'
                        : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isHovered
                            ? 'bg-[#155EEF] text-white border-[#155EEF]'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="space-y-0.5 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-[#071A33] tracking-wide font-mono">
                            {layer.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {layer.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-medium text-slate-600">
                          {layer.primaryFeatures.map((feat, idx) => (
                            <span key={feat} className="flex items-center gap-1">
                              {idx > 0 && <span className="text-slate-300">•</span>}
                              <span>{feat}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Circuit Link Indicator */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span
                        className={`w-2 h-2 rounded-full transition-colors ${
                          isHovered ? 'bg-[#155EEF] animate-ping' : 'bg-slate-300'
                        }`}
                      />
                      <span className="text-[10px] font-mono font-bold uppercase text-[#155EEF]">
                        {isHovered ? 'CONNECTED' : 'STANDBY'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right: Convergence Core Schematic (Soundbox System Hub) */}
            <div className="lg:col-span-5 p-8 rounded-3xl bg-[#080E1B] text-white border border-slate-800 shadow-2xl space-y-6 text-left relative overflow-hidden">
              {/* Laser Scan Accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-2 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SYSTEM CORE SCHEMATIC</span>
                  </span>
                  <span>NODE: ADY-SBX-01</span>
                </div>
                <div className="text-2xl font-black text-white font-mono tracking-tight">
                  {activeData.name} SUBSYSTEM
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {activeData.category}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                  Integration Blueprint
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {activeData.systemRole}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#111A2E] border border-cyan-500/30 space-y-1">
                <span className="text-[9px] font-mono uppercase text-cyan-400 font-bold block">
                  Live Telemetry Benchmark
                </span>
                <div className="text-xs font-mono font-bold text-white">
                  {activeData.telemetryMetric}
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span>ADYAPAN HARDWARE OS</span>
                <span className="text-emerald-400 font-bold">100% HARDWARE BOUND</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
