'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Cpu,
  Radio,
  Volume2,
  QrCode,
  ShieldCheck,
  BatteryCharging,
  Sliders,
  Sparkles,
} from 'lucide-react';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ExplodedLayer {
  id: string;
  name: string;
  category: string;
  annotationTag: string;
  annotationSub: string;
  icon: React.ElementType;
  zOffset: number; // axial distance in mm
  description: string;
  techSpecs: string[];
}

const LAYERS: ExplodedLayer[] = [
  {
    id: 'layer-shell',
    name: 'Tempered Counter Shell & Bharat QR Core',
    category: 'OUTER SHELL',
    annotationTag: 'OUTER SHELL',
    annotationSub: 'TEMPERED COUNTER GLASS',
    icon: QrCode,
    zOffset: 160,
    description:
      'High-impact scratch-resistant tempered front faceplate with 160° wide-angle Bharat QR acquiring matrix, engineered for fast customer counter positioning.',
    techSpecs: ['Tempered Polycarbonate Front Shield', 'Dynamic QR Ingress', 'Anti-Glare Counter Treatment'],
  },
  {
    id: 'layer-display',
    name: 'High-Contrast OLED Confirmation Matrix',
    category: 'DISPLAY',
    annotationTag: 'DISPLAY',
    annotationSub: 'STATUS CONFIRMATION',
    icon: Sparkles,
    zOffset: 100,
    description:
      'Ultra-bright monochromatic OLED display giving cashiers immediate dual confirmation of transaction amount, battery health, and real-time 4G link status.',
    techSpecs: ['Instant Rupee Amount Display', 'Sunlight-Readable Monochromatic Matrix', 'T+1 Clearing State Indicator'],
  },
  {
    id: 'layer-speaker',
    name: '3W Neodymium Acoustic Waveguide Chamber',
    category: 'SPEAKER',
    annotationTag: 'SPEAKER',
    annotationSub: 'AUDIO OUTPUT • 85 dB',
    icon: Volume2,
    zOffset: 40,
    description:
      'Tuned acoustic resonance cavity with high-flux neodymium driver engineered to deliver 85dB speech-optimized clarity across noisy retail queues.',
    techSpecs: ['85 dB Voice Speech Tuning', 'Bass Reflex Resonance Cavity', 'DSP Hardware Audio Amplifier'],
  },
  {
    id: 'layer-processing',
    name: 'Secure Element Cryptographic Processor',
    category: 'PROCESSING',
    annotationTag: 'PROCESSING',
    annotationSub: 'HARDWARE ROOT OF TRUST',
    icon: Cpu,
    zOffset: -20,
    description:
      'Dedicated cryptographic chip executing terminal signature authentication, anti-tamper memory protection, and instant payload decryption.',
    techSpecs: ['Hardware Security Module (HSM)', 'Anti-Cloning Counter Chip', 'Instant RSA-2048 Verification'],
  },
  {
    id: 'layer-connectivity',
    name: '4G LTE Cat-1 IoT Modem & Antenna',
    category: 'CONNECTIVITY',
    annotationTag: 'CONNECTIVITY',
    annotationSub: '4G / IoT TELEMETRY',
    icon: Radio,
    zOffset: -80,
    description:
      'Dual-band 4G cellular IoT modem maintaining persistent ultra-low-latency MQTT event sockets with automatic 2G fallback in low-reception zones.',
    techSpecs: ['Dual-Band 4G LTE with 2G Fallback', 'Persistent MQTT Telemetry', 'eSIM Multi-Carrier Ready'],
  },
  {
    id: 'layer-power',
    name: '2600mAh High-Density Power Bank & Base',
    category: 'POWER',
    annotationTag: 'POWER',
    annotationSub: '7-DAY STANDBY BATTERY',
    icon: BatteryCharging,
    zOffset: -140,
    description:
      'Rechargeable lithium-ion power cell encased in shock-absorbent silicone rubber base, delivering 7 days of continuous untethered standby.',
    techSpecs: ['2600mAh Lithium-Ion Cell', 'Non-Slip Counter Grip Base', 'IP54 Dust & Moisture Protection'],
  },
];

export const ExplodedDeviceArchitecture: React.FC = () => {
  const [explosionFactor, setExplosionFactor] = useState(0.85); // 0 (assembled) to 1 (fully separated)
  const [selectedLayer, setSelectedLayer] = useState<string>('layer-speaker');
  const [stageTilt, setStageTilt] = useState({ rx: 25, ry: -32, rz: 5 });
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setStageTilt({
      rx: 25 - y * 18,
      ry: -32 + x * 24,
      rz: 5,
    });
  };

  const handlePointerLeave = () => {
    setStageTilt({ rx: 25, ry: -32, rz: 5 });
  };

  // GSAP ScrollTrigger: Scroll drives axial separation and reconstruction before exit
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top center',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          // Progress: 0 -> 0.5 separates out to 1.0; 0.5 -> 1.0 reconstructs back
          const p = self.progress;
          if (p <= 0.6) {
            setExplosionFactor(Math.min(1, 0.3 + p * 1.2));
          } else {
            setExplosionFactor(Math.max(0.1, 1 - (p - 0.6) * 2));
          }
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const activeLayerData = LAYERS.find((l) => l.id === selectedLayer) || LAYERS[0];

  return (
    <section
      id="section-exploded-architecture"
      ref={sectionRef}
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Backdrop Lighting ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-14 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>3D EXPLODED HARDWARE VIEW</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight uppercase leading-tight">
            QR AT THE FRONT. <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              CONNECTIVITY UNDERNEATH.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            The Soundbox is not merely a speaker. It is an integrated IoT payment instrument that physically
            unifies dynamic optical acquiring, low-latency cellular telemetry, and high-clarity acoustic broadcasting.
          </p>

          {/* Interactive Explosion Scrubbing Bar */}
          <div className="max-w-md mx-auto pt-4 flex flex-col items-center gap-2">
            <div className="flex items-center justify-between w-full text-xs font-mono text-slate-600">
              <span>Assembled Device</span>
              <span className="text-[#155EEF] font-bold">
                Axial Separation: {Math.round(explosionFactor * 100)}%
              </span>
              <span>Full Disassembly</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explosionFactor}
              onChange={(e) => setExplosionFactor(parseFloat(e.target.value))}
              aria-label="Scrub 3D Exploded View Depth"
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
            />
          </div>
        </div>

        {/* ── 3D EXPLODED DEVICE STAGE & LAYER INSPECTOR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left / Center: 3D Multi-Plane Spatial Disassembly */}
          <div
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="lg:col-span-7 flex flex-col items-center justify-center min-h-[500px] relative select-none cursor-grab active:cursor-grabbing"
          >
            {/* 3D Exploded View Assembly Container */}
            <div
              className="relative w-80 h-[460px] flex items-center justify-center"
              style={{
                perspective: '1800px',
                transformStyle: 'preserve-3d',
              }}
            >
              {LAYERS.map((layer) => {
                const isSelected = selectedLayer === layer.id;
                const dynamicZ = layer.zOffset * explosionFactor * 2.2;
                const dynamicX = layer.zOffset * explosionFactor * 0.4;

                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayer(layer.id)}
                    className={`absolute w-72 h-44 rounded-2xl border-2 transition-all duration-300 cursor-pointer p-4 flex flex-col justify-between shadow-xl backdrop-blur-md ${
                      isSelected
                        ? 'border-[#155EEF] bg-white text-[#071A33] ring-4 ring-blue-500/20 shadow-[0_15px_35px_rgba(21,94,239,0.25)]'
                        : 'border-slate-200/90 bg-white/90 text-slate-800 hover:border-slate-400 shadow-md'
                    }`}
                    style={{
                      transform: `translate3d(${dynamicX}px, 0px, ${dynamicZ}px) rotateX(${stageTilt.rx}deg) rotateY(${stageTilt.ry}deg) rotateZ(${stageTilt.rz}deg)`,
                      transformStyle: 'preserve-3d',
                      zIndex: Math.round(dynamicZ + 200),
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">
                        {layer.annotationTag}
                      </span>
                      <layer.icon
                        className={`w-4 h-4 ${isSelected ? 'text-[#155EEF]' : 'text-slate-400'}`}
                      />
                    </div>

                    <div className="py-1">
                      <div className="text-sm font-bold text-[#071A33] leading-snug">{layer.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5">{layer.annotationSub}</div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                      <span>AXIAL Z: {Math.round(dynamicZ)}mm</span>
                      <span className={isSelected ? 'text-[#155EEF] font-bold' : 'text-slate-400'}>
                        {isSelected ? 'INSPECTING' : 'CLICK TO FOCUS'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Exploded View Status Tag */}
            <div className="mt-8 flex items-center gap-2 text-xs font-mono text-slate-600">
              <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
              <span>Click any physical layer to inspect internal component engineering</span>
            </div>
          </div>

          {/* Right: Focused Hardware Sub-System Technical Callout */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl bg-white border-2 border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-6 text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold uppercase">
                  <activeLayerData.icon className="w-3.5 h-3.5 text-[#155EEF]" />
                  <span>{activeLayerData.category}</span>
                </div>
                <h3 className="text-2xl font-black text-[#071A33] tracking-tight">
                  {activeLayerData.name}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {activeLayerData.description}
                </p>
              </div>

              {/* Hardware Layer Specifications */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Hardware Specifications
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {activeLayerData.techSpecs.map((spec) => (
                    <div
                      key={spec}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-700"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />
                      <span className="font-mono font-medium">{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cellular 4G Ingress Signal Simulation Note */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#155EEF]">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>4G Cellular Transmission Pulse</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  The encrypted payload arrives via cellular VoLTE OTA, decrypts at Layer 04 (eSIM
                  Logic Board), and triggers instantaneous acoustic vibration at Layer 03.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
