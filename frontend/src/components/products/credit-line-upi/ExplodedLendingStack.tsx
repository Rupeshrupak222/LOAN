'use client';

import React, { useState } from 'react';
import { Layers, Database, ShieldCheck, Cpu, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

export const ExplodedLendingStack: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState(0);
  const [axialSpread, setAxialSpread] = useState(0.8);
  const [tilt, setTilt] = useState({ rx: 22, ry: -25, rz: 4 });

  const LAYERS = [
    {
      id: 'layer-cx',
      name: 'CUSTOMER EXPERIENCE',
      tag: 'LAYER 01',
      sub: 'Merchant QR Scan & 1-Tap UPI Interface',
      icon: Layers,
      color: 'border-blue-400 bg-blue-50/90 text-blue-900',
      desc: 'Seamless mobile checkout experience. Customer views available limit and authorizes payment with UPI PIN without leaving counter.',
      specs: ['Pre-approved credit balance display', 'Biometric & UPI PIN authorization', 'Instant push confirmation receipt'],
      zOffset: 120,
    },
    {
      id: 'layer-orch',
      name: 'UPI PAYMENT ORCHESTRATION',
      tag: 'LAYER 02',
      sub: 'NPCI Switch Protocol & Mandate Engine',
      icon: Cpu,
      color: 'border-cyan-400 bg-cyan-50/90 text-cyan-900',
      desc: 'Connects directly into NPCI / UPI rails. Translates standard payment intent into credit drawdown requests in under 380 milliseconds.',
      specs: ['Standard UPI 2.0 protocol support', 'Sub-second switch clearing (<380ms)', 'High-throughput concurrency pipeline'],
      zOffset: 80,
    },
    {
      id: 'layer-clm',
      name: 'CREDIT LINE MANAGEMENT',
      tag: 'LAYER 03',
      sub: 'Revolving Ledger & Drawdown Engine',
      icon: RefreshCw,
      color: 'border-indigo-400 bg-indigo-50/90 text-indigo-900',
      desc: 'Maintains revolving credit limits, records transaction drawdowns, and manages real-time available balances across multiple devices.',
      specs: ['Dynamic credit limit adjustment', 'Multi-merchant drawdown tracking', 'Real-time balance recalculation'],
      zOffset: 40,
    },
    {
      id: 'layer-bill',
      name: 'TRANSACTION & BILLING LOGIC',
      tag: 'LAYER 04',
      sub: 'Interest Accrual & Repayment Schedules',
      icon: FileText,
      color: 'border-slate-400 bg-slate-50/90 text-slate-900',
      desc: 'Calculates pro-rata daily interest only on drawn balances. Automates billing cycles, statement dispatch, and auto-debit triggers.',
      specs: ['Daily pro-rata interest engine', 'Flexible billing cycle configurations', 'Automated UPI mandate debiting'],
      zOffset: 0,
    },
    {
      id: 'layer-risk',
      name: 'RISK & DECISIONING',
      tag: 'LAYER 05',
      sub: 'Rule Engine & Velocity Controls',
      icon: ShieldCheck,
      color: 'border-emerald-400 bg-emerald-50/90 text-emerald-900',
      desc: 'Evaluates transaction velocity, geo-risk anomalies, and merchant category codes in real time prior to authorizing drawdown.',
      specs: ['Pre-transaction policy checks', 'Merchant category code filtering', 'Real-time velocity limits'],
      zOffset: -40,
    },
    {
      id: 'layer-recon',
      name: 'RECONCILIATION & SETTLEMENT',
      tag: 'LAYER 06',
      sub: 'T+0 Clearing & Merchant Payouts',
      icon: Database,
      color: 'border-amber-400 bg-amber-50/90 text-amber-900',
      desc: 'Tri-party settlement matching between bank lender, NPCI switch, and acquiring merchant. Resolves disputes and exceptions automatically.',
      specs: ['Automated 3-way file reconciliation', 'Instant T+0 merchant clearing', 'Dispute & refund lifecycle handling'],
      zOffset: -80,
    },
    {
      id: 'layer-core',
      name: 'CORE LENDING SYSTEM (LMS)',
      tag: 'LAYER 07',
      sub: 'General Ledger & Regulatory Books',
      icon: Database,
      color: 'border-purple-400 bg-purple-50/90 text-purple-900',
      desc: 'Adyapan institutional lending core. Maintains loan master files, regulatory accounting books, NPA provisioning, and statutory reporting.',
      specs: ['Institutional banking books', 'Automated NPA classification', 'Audit-ready compliance reporting'],
      zOffset: -120,
    },
  ];

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: 22 - y * 16,
      ry: -25 + x * 20,
      rz: 4,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 22, ry: -25, rz: 4 });
  };

  const activeLayerData = LAYERS[selectedLayer];

  return (
    <section
      id="section-infrastructure-stack"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[550px] bg-blue-500/5 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>PLATFORM ARCHITECTURE DECONSTRUCTION</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            THE EXPERIENCE IS SIMPLE. <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              THE INFRASTRUCTURE ISN’T.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-normal leading-relaxed">
            Deconstruct the seven modular layers powering sub-second credit authorization over UPI.
          </p>

          {/* Axial Spread Slider */}
          <div className="pt-2 flex items-center justify-center gap-3 max-w-xs mx-auto">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Stacked</span>
            <input
              type="range"
              min="0.2"
              max="1.2"
              step="0.05"
              value={axialSpread}
              onChange={(e) => setAxialSpread(parseFloat(e.target.value))}
              className="w-36 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
              aria-label="Adjust 3D Axial Stack Separation"
            />
            <span className="text-[10px] font-mono text-[#155EEF] font-bold uppercase">Exploded</span>
          </div>
        </div>

        {/* ── 3D EXPLODED ARCHITECTURE STAGE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left: 3D Spatial Deconstructed Layers */}
          <div
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="lg:col-span-7 flex flex-col items-center justify-center min-h-[520px] relative select-none cursor-grab active:cursor-grabbing"
          >
            <div
              className="relative w-80 h-[480px] flex items-center justify-center"
              style={{
                perspective: '1600px',
                transformStyle: 'preserve-3d',
              }}
            >
              {LAYERS.map((layer, idx) => {
                const isSelected = selectedLayer === idx;
                const dynamicZ = layer.zOffset * axialSpread * 2.2;
                const dynamicX = layer.zOffset * axialSpread * 0.4;

                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayer(idx)}
                    className={`absolute w-72 h-36 rounded-2xl border-2 transition-all duration-300 cursor-pointer p-4 flex flex-col justify-between shadow-xl backdrop-blur-md ${
                      isSelected
                        ? 'border-[#155EEF] bg-white text-[#071A33] ring-4 ring-blue-500/20 shadow-[0_15px_35px_rgba(21,94,239,0.25)]'
                        : 'border-slate-200/90 bg-white/90 text-slate-800 hover:border-slate-400 shadow-md'
                    }`}
                    style={{
                      transform: `translate3d(${dynamicX}px, 0px, ${dynamicZ}px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) rotateZ(${tilt.rz}deg)`,
                      transformStyle: 'preserve-3d',
                      zIndex: Math.round(dynamicZ + 200),
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">
                        {layer.tag}
                      </span>
                      <layer.icon
                        className={`w-4 h-4 ${isSelected ? 'text-[#155EEF]' : 'text-slate-400'}`}
                      />
                    </div>

                    <div>
                      <div className="text-xs font-bold text-[#071A33] leading-snug uppercase">
                        {layer.name}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 mt-0.5 truncate">
                        {layer.sub}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100">
                      <span>AXIS Z: {Math.round(dynamicZ)}mm</span>
                      <span className={isSelected ? 'text-[#155EEF] font-bold' : ''}>
                        {isSelected ? 'INSPECTING' : 'CLICK TO VIEW'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Layer Detailed Technical Inspector */}
          <div className="lg:col-span-5 p-8 rounded-3xl bg-slate-50 border border-slate-200 text-left space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-[#155EEF] uppercase">
                {activeLayerData.tag} INSPECTION
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                PLATFORM SPEC
              </span>
            </div>

            <div>
              <h3 className="text-xl font-black text-[#071A33] uppercase">
                {activeLayerData.name}
              </h3>
              <p className="text-xs font-mono text-slate-500 mt-1">
                {activeLayerData.sub}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {activeLayerData.desc}
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                ENGINEERING SPECIFICATIONS
              </div>
              {activeLayerData.specs.map((spec, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
