'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radio, ShieldCheck, Zap, Wifi, Signal } from 'lucide-react';
import { SoundboxDevice3D } from './SoundboxDevice3D';

export const CellularVerticalSignal: React.FC = () => {
  const [pulsePosition, setPulsePosition] = useState(0); // 0 to 100%
  const [isLanded, setIsLanded] = useState(false);
  const [tilt, setTilt] = useState({ rx: 12, ry: -8 });
  const sectionRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);

  // Reliable continuous 3D RF Telemetry pulse loop (never freezes on scroll)
  useEffect(() => {
    let animId: number;
    let start = performance.now();
    const cycleDuration = 2800; // 2.8s pulse descent cycle

    const loop = (time: number) => {
      if (isVisibleRef.current) {
        const elapsed = (time - start) % cycleDuration;
        const progress = elapsed / cycleDuration;
        // Natural ease-in descent acceleration
        const pos = Math.pow(progress, 1.4) * 100;
        setPulsePosition(pos);

        if (progress >= 0.85) {
          setIsLanded(true);
        } else {
          setIsLanded(false);
        }
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, []);

  // IntersectionObserver: pause updates when truly offscreen, resume smoothly when visible
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 3D pointer parallax tilt
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: 12 - y * 14,
      ry: -8 + x * 18,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 12, ry: -8 });
  };

  const triggerManualPulse = () => {
    setIsLanded(true);
    setTimeout(() => setIsLanded(false), 900);
  };

  return (
    <section
      id="section-cellular-signal"
      ref={sectionRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative py-20 sm:py-28 px-4 sm:px-8 bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EEF4FB] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-blue-500/5 rounded-full blur-[180px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-12 relative z-10 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Radio className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>4G CELLULAR IoT TELEMETRY</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.08]">
            CONNECTED WHERE <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              THE COUNTER IS.
            </span>
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs font-mono text-slate-600 uppercase tracking-wider pt-1">
            <span className="font-bold text-[#071A33] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              4G LTE CAT-1 MODEM
            </span>
            <span className="text-slate-300">•</span>
            <span>NO SMARTPHONE REQUIRED</span>
            <span className="text-slate-300">•</span>
            <span>ZERO WI-FI DEPENDENCY</span>
          </div>
        </div>

        {/* ── 3D CELLULAR BEACON STAGE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pt-4">
          {/* Left Column: 3D Holographic Signal Column + Grounded Soundbox */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center min-h-[520px] relative">
            {/* 3D Perspective Stage Container */}
            <div
              className="relative w-80 flex flex-col items-center justify-center"
              style={{
                perspective: '1600px',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* ── 3D CONCENTRIC HOLOGRAPHIC SIGNAL RINGS ── */}
              <div
                className="absolute -top-24 w-72 h-44 flex items-center justify-center pointer-events-none transition-transform duration-150"
                style={{
                  transform: `rotateX(${tilt.rx + 60}deg) rotateZ(${tilt.ry}deg) translateZ(80px)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* 3D Ripple Rings floating horizontally above the device */}
                {[120, 180, 240, 300].map((ringSize, idx) => (
                  <div
                    key={ringSize}
                    className="absolute rounded-full border-2 border-cyan-400/40 transition-all duration-300"
                    style={{
                      width: `${ringSize}px`,
                      height: `${ringSize}px`,
                      opacity: isLanded ? 0.8 : 0.35 + idx * 0.12,
                      boxShadow: isLanded ? '0 0 15px rgba(34,211,238,0.5)' : 'none',
                    }}
                  />
                ))}

                {/* Descending 3D Photon Signal Core */}
                <div
                  className="absolute rounded-full bg-[#155EEF] border-2 border-white shadow-[0_0_25px_rgba(21,94,239,1)] transition-transform duration-75"
                  style={{
                    width: '18px',
                    height: '18px',
                    transform: `translateZ(${(100 - pulsePosition) * 1.5}px)`,
                  }}
                />
              </div>

              {/* Vertical Guide Beam */}
              <div className="absolute -top-24 bottom-24 w-0.5 bg-gradient-to-b from-transparent via-[#155EEF]/40 to-[#155EEF] pointer-events-none" />

              {/* The 3D Soundbox Hardware in Space */}
              <div className="relative mt-8">
                {/* Arrival Contact Ring Shockwave */}
                <div
                  className={`w-72 h-14 rounded-full bg-cyan-400/30 blur-md absolute -bottom-4 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300 ${
                    isLanded ? 'opacity-100 scale-125' : 'opacity-0 scale-75'
                  }`}
                />

                <SoundboxDevice3D
                  rotationX={tilt.rx}
                  rotationY={tilt.ry}
                  scale={0.92}
                  signalStrength={4}
                  isVibrating={isLanded}
                  showWaveform={false}
                  displayAmount={isLanded ? '4G ONLINE' : '₹500.00'}
                  displayStatus={isLanded ? 'MQTT TELEMETRY' : 'PAYMENT VERIFIED'}
                />
              </div>
            </div>

            {/* Interactive Pulse Trigger */}
            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={triggerManualPulse}
                className="px-5 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-[#155EEF] shadow-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Signal className="w-3.5 h-3.5 text-[#155EEF] animate-pulse" />
                <span>Test 4G Telemetry Pulse</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-white px-3.5 py-2 rounded-full border border-slate-200">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isLanded ? 'bg-emerald-500 animate-ping' : 'bg-[#155EEF]'
                  }`}
                />
                <span className="font-semibold text-slate-800">
                  {isLanded ? 'RF PACKET COMMITTED' : 'AWAITING TELEMETRY'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Technical Specification Telemetry Cards */}
          <div className="lg:col-span-5 space-y-4 text-left">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-[#155EEF] font-bold">CELLULAR MODEM</span>
                <span>SUB-SECOND DISPATCH</span>
              </div>
              <div className="text-lg font-black text-[#071A33]">
                Dual-Band 4G LTE Cat-1 + 2G Fallback
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Persistent MQTT telemetry socket maintains continuous connection to the Adyapan banking switch.
                When cellular 4G fluctuates, automatic 2G carrier handover prevents checkout stalls.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">CARRIER LATENCY</span>
                <div className="text-base font-black font-mono text-[#071A33]">38ms MQTT</div>
                <div className="text-[10px] font-mono text-emerald-600 font-semibold">99.98% SLA</div>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">SIGNAL BANDWIDTH</span>
                <div className="text-base font-black font-mono text-[#071A33]">-68 dBm</div>
                <div className="text-[10px] font-mono text-[#155EEF] font-semibold">B1 / B3 / B5 / B8</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-bold text-slate-900">Anti-Tamper eSIM Integration</div>
                <div className="text-slate-500 text-[11px]">Direct carrier binding prevents unauthorized SIM extraction on public counters.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
