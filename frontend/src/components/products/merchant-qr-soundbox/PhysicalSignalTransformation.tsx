'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Zap, Radio, Volume2, Eye, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useWebAudioChime } from './useWebAudioChime';

interface Stage {
  id: string;
  word: string;
  subtitle: string;
  icon: React.ElementType;
  physicalAction: string;
  stateDescription: string;
  visualEffect: string;
  telemetry: string;
}

const STAGES: Stage[] = [
  {
    id: 'payment-event',
    word: 'PAYMENT EVENT',
    subtitle: 'Stage 01 • Dynamic Ingress',
    icon: Zap,
    physicalAction: 'Compresses into a focused digital photon pulse at customer phone',
    stateDescription:
      'The buyer authorises ₹500. The banking switch commits the ledger mutation and compresses the confirmation into a 128-byte cryptographic packet.',
    visualEffect: 'Laser focus compression of text into a high-energy blue particle point',
    telemetry: 'Payload size: 128 bytes • Ingress: UPI Switch',
  },
  {
    id: 'signal',
    word: 'CELLULAR SIGNAL',
    subtitle: 'Stage 02 • Over-the-Air Transmission',
    icon: Radio,
    physicalAction: 'Travels across 4G cellular carrier waves into device antenna',
    stateDescription:
      'Transmitted over dual-band 4G LTE CAT-1 cellular frequencies directly to the counter. Decrypted by hardware secure element with zero internet Wi-Fi reliance.',
    visualEffect: 'Concentric RF radio wave pulses radiating into the hardware antenna',
    telemetry: 'Latency: Sub-second • Protocol: Encrypted MQTT',
  },
  {
    id: 'audio',
    word: 'ACOUSTIC AUDIO',
    subtitle: 'Stage 03 • Mechanical Resonance',
    icon: Volume2,
    physicalAction: 'Expands as an 85dB mechanical soundwave from neodymium speaker',
    stateDescription:
      'Digital packet triggers hardware DSP amplifier. Speaker diaphragm vibrates at tuned speech frequencies to announce payment in the merchant’s language.',
    visualEffect: 'High-amplitude physical soundwave ripples expanding into 3D counter space',
    telemetry: 'Sound pressure: 85 dB • Frequency: Speech-tuned 1kHz-4kHz',
  },
  {
    id: 'awareness',
    word: 'MERCHANT AWARENESS',
    subtitle: 'Stage 04 • Immediate Confidence',
    icon: Eye,
    physicalAction: 'Transforms into complete cashier certainty and effortless queue flow',
    stateDescription:
      'The merchant hears "₹500 Received" without glancing at a screen. Fake screenshot fraud is mathematically thwarted, and the next customer is served instantly.',
    visualEffect: 'Dual OLED screen locks in green status with zero payment doubt',
    telemetry: 'Verification SLA: Instantaneous • Queue delay: 0s',
  },
];

export const PhysicalSignalTransformation: React.FC = () => {
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { playChime } = useWebAudioChime();

  const currentStage = STAGES[activeStageIdx];

  const handleStageSelect = (index: number) => {
    setActiveStageIdx(index);
    if (index === 2) {
      playChime(0.9);
    }
  };

  const handleNextStage = () => {
    setActiveStageIdx((prev) => {
      const next = (prev + 1) % STAGES.length;
      if (next === 2) {
        playChime(0.9);
      }
      return next;
    });
  };

  // IntersectionObserver cleanup: prevent background execution
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && timerRef.current) {
            clearInterval(timerRef.current);
            setIsAutoPlaying(false);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 sm:py-36 px-4 sm:px-8 bg-[#FFFFFF] text-[#071A33] overflow-hidden border-b border-slate-200"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-14 relative z-10 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <RefreshCw className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>PHYSICAL TRANSFORMATION PIPELINE</span>
          </div>

          <h2 className="text-3xl sm:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-tight">
            FROM PAYMENT EVENT <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              TO MERCHANT AWARENESS.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Watch the sequence physically unfold: A payment starts as an abstract digital event, travels as a cellular signal, vibrates into acoustic sound, and culminates in merchant awareness.
          </p>
        </div>

        {/* ── 4-STAGE INTERACTIVE PROGRESS BREADCRUMB ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {STAGES.map((s, idx) => {
            const isSelected = activeStageIdx === idx;
            const isPast = activeStageIdx > idx;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStageSelect(idx)}
                className={`p-4 rounded-2xl border text-left transition-all duration-300 ${
                  isSelected
                    ? 'bg-blue-50 border-[#155EEF] shadow-md shadow-blue-100 translate-y-[-3px]'
                    : isPast
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#155EEF]' : 'text-slate-400'}`} />
                  <span className="text-[10px] font-mono text-[#155EEF] font-bold">0{idx + 1}</span>
                </div>
                <div className={`text-xs font-bold ${isSelected ? 'text-[#071A33]' : 'text-slate-600'}`}>
                  {s.word}
                </div>
                <div className="text-[9px] font-mono text-slate-400 mt-1 uppercase truncate">
                  {s.subtitle.split('•')[1] || ''}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── GIANT PHYSICAL STAGE DISPLAY ── */}
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#F8FAFC] via-[#EFF4FA] to-[#E9F0F8] border-2 border-slate-200 shadow-xl relative overflow-hidden">
          {/* Subtle Ambient Scan Light */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent pointer-events-none" />

          <div className="max-w-3xl mx-auto space-y-8 relative z-10">
            {/* Animated Word Transformation Callout */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-blue-200 text-[#155EEF] text-xs font-mono font-bold uppercase shadow-xs">
                <currentStage.icon className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>{currentStage.subtitle}</span>
              </div>

              <div className="text-4xl sm:text-6xl font-black text-[#071A33] tracking-wider font-mono drop-shadow-xs">
                {currentStage.word}
              </div>

              <div className="text-[#155EEF] font-mono text-sm sm:text-base font-bold">
                ↳ {currentStage.physicalAction}
              </div>
            </div>

            <p className="text-slate-700 text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-medium">
              {currentStage.stateDescription}
            </p>

            {/* Hardware Telemetry Strip */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-slate-600 shadow-xs">
              <span className="flex items-center gap-1.5 text-[#155EEF] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#155EEF]" />
                <span>HARDWARE TELEMETRY:</span>
              </span>
              <span>{currentStage.telemetry}</span>
            </div>

            {/* Next Stage Advance Button */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleNextStage}
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm font-bold"
              >
                <span>Advance Transformation (0{(activeStageIdx + 1) % 4 + 1})</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#155EEF]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
