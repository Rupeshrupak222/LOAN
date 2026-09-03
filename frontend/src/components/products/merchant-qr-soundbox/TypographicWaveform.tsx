'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useWebAudioChime } from './useWebAudioChime';

export const TypographicWaveform: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDecibels, setActiveDecibels] = useState(0);
  const [selectedFont, setSelectedFont] = useState<'unbounded' | 'bebas' | 'syne'>('unbounded');
  const sectionRef = useRef<HTMLDivElement>(null);
  const { playVoiceConfirmation } = useWebAudioChime();
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const FONT_OPTIONS = [
    {
      id: 'unbounded' as const,
      label: 'Cyber Geometric (Unbounded)',
      fontFamily: 'var(--font-unbounded), sans-serif',
      className: 'text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-black tracking-[-0.04em] leading-[0.92]',
    },
    {
      id: 'bebas' as const,
      label: 'Monumental Poster (Bebas Neue)',
      fontFamily: 'var(--font-bebas), sans-serif',
      className: 'text-7xl sm:text-9xl md:text-[11rem] lg:text-[13rem] font-normal tracking-[0.03em] leading-[0.82]',
    },
    {
      id: 'syne' as const,
      label: 'Sculpted Luxury (Syne)',
      fontFamily: 'var(--font-syne), sans-serif',
      className: 'text-6xl sm:text-8xl md:text-9xl font-[800] tracking-[-0.04em] leading-[0.88]',
    },
  ];

  const currentFont = FONT_OPTIONS.find((f) => f.id === selectedFont) || FONT_OPTIONS[0];

  const handlePlayChime = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    playVoiceConfirmation('en', 1.0);

    // Simulate authentic acoustic pulse envelope
    setActiveDecibels(85);
    const t1 = setTimeout(() => setActiveDecibels(68), 500);
    const t2 = setTimeout(() => setActiveDecibels(32), 1000);
    const t3 = setTimeout(() => {
      setActiveDecibels(0);
      setIsPlaying(false);
    }, 1800);

    timerRef.current.push(t1, t2, t3);
  };

  useEffect(() => {
    return () => {
      timerRef.current.forEach(clearTimeout);
    };
  }, []);

  // 24-bar acoustic frequency spectrum
  const barHeights = [
    12, 24, 38, 55, 78, 92, 100, 88, 70, 52, 38, 28,
    28, 38, 52, 70, 88, 100, 92, 78, 55, 38, 24, 12,
  ];

  return (
    <section
      id="section-the-sound"
      ref={sectionRef}
      className="relative py-24 sm:py-32 px-4 sm:px-8 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Acoustic Radial Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className={`w-[950px] h-[520px] rounded-full blur-[180px] transition-all duration-700 ${
            isPlaying ? 'bg-blue-500/15 scale-110' : 'bg-blue-500/5 scale-100'
          }`}
        />
      </div>

      <div className="max-w-6xl mx-auto space-y-10 relative z-10 text-center">
        {/* Section Pill & Concept Architecture */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Volume2 className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>THE SOUND IS THE CONFIRMATION</span>
          </div>

          <div className="flex items-center justify-center gap-3 text-xs font-mono text-slate-500 uppercase tracking-widest">
            <span className="font-semibold text-slate-700">DIGITAL</span>
            <span className="text-[#155EEF] font-bold">→</span>
            <span className="font-semibold text-slate-700">AUDIO</span>
            <span className="text-[#155EEF] font-bold">→</span>
            <span className="text-[#071A33] font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              PHYSICAL CERTAINTY
            </span>
          </div>
        </div>

        {/* ── INTERACTIVE FONT SELECTOR PILLS ── */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider mr-1">
            Display Typography:
          </span>
          {FONT_OPTIONS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedFont(f.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
                selectedFont === f.id
                  ? 'bg-slate-900 text-white font-bold shadow-md ring-2 ring-[#155EEF]'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* ── MONUMENTAL EDITORIAL TYPOGRAPHY STAGE ── */}
        <div
          onClick={handlePlayChime}
          className="relative py-4 sm:py-8 cursor-pointer group flex flex-col items-center justify-center"
          title="Click to trigger acoustic confirmation"
        >
          {/* Top Technical Drafting Gauge Line */}
          <div className="w-full max-w-xl pb-3 flex items-center justify-between text-[9px] font-mono text-slate-400 uppercase tracking-widest border-b border-slate-200/80">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-[#155EEF] animate-ping' : 'bg-slate-400'}`} />
              <span>ACOUSTIC RESONANCE: 85 dB SPL</span>
            </span>
            <span>FREQ: 587Hz — 1175Hz</span>
            <span className="text-[#155EEF] font-bold">3W NEODYMIUM</span>
          </div>

          {/* Main Monumental Baseline-Locked Words in Active Display Font */}
          <div className="pt-4 space-y-0 text-center transition-transform duration-300 group-hover:scale-[1.015]">
            <div
              className={`${currentFont.className} uppercase transition-all duration-500 ${
                isPlaying
                  ? 'bg-gradient-to-r from-[#155EEF] via-[#00E5FF] to-[#155EEF] bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(0,229,255,0.65)]'
                  : 'bg-gradient-to-b from-[#0F172A] via-[#071A33] to-[#1E293B] bg-clip-text text-transparent drop-shadow-[0_16px_32px_rgba(15,23,42,0.15)]'
              }`}
              style={{
                fontFamily: currentFont.fontFamily,
                textRendering: 'geometricPrecision',
              }}
            >
              PAYMENT
            </div>
            <div
              className={`${currentFont.className} uppercase transition-all duration-500 ${
                isPlaying
                  ? 'bg-gradient-to-r from-[#00E5FF] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(0,229,255,0.65)]'
                  : 'bg-gradient-to-b from-[#0F172A] via-[#071A33] to-[#1E293B] bg-clip-text text-transparent drop-shadow-[0_16px_32px_rgba(15,23,42,0.15)]'
              }`}
              style={{
                fontFamily: currentFont.fontFamily,
                textRendering: 'geometricPrecision',
              }}
            >
              RECEIVED
            </div>
          </div>

          {/* ── ACOUSTIC WAVEFORM SPECTRUM BARS (Physical Wave) ── */}
          <div className="mt-8 sm:mt-12 w-full max-w-2xl px-4 flex items-end justify-center gap-1.5 sm:gap-2.5 h-16">
            {barHeights.map((pct, idx) => {
              const activeHeight = isPlaying ? Math.max(8, (pct / 100) * 58) : 6;
              return (
                <span
                  key={idx}
                  className={`w-1.5 sm:w-2 rounded-full transition-all duration-200 ${
                    isPlaying
                      ? 'bg-gradient-to-t from-[#155EEF] to-[#22D3EE] shadow-[0_0_8px_rgba(34,211,238,0.7)]'
                      : 'bg-slate-200'
                  }`}
                  style={{ height: `${activeHeight}px` }}
                />
              );
            })}
          </div>

          {/* ── INTERACTIVE SOUND CONTROLS & TELEMETRY ── */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Interactive Audio Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayChime();
              }}
              className={`px-7 py-3.5 rounded-full border text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2.5 shadow-sm cursor-pointer ${
                isPlaying
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-blue-500/30 scale-95'
                  : 'bg-white text-slate-800 border-slate-300 hover:border-[#155EEF] hover:text-[#155EEF] hover:shadow-md'
              }`}
            >
              <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-bounce text-white' : 'text-[#155EEF]'}`} />
              <span>{isPlaying ? 'Broadcasting Voice & Chime' : 'Play Confirmation Chime'}</span>
            </button>

            {/* Live Decibel / Telemetry Readout */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                  }`}
                />
                <span className="font-bold text-slate-900">
                  {isPlaying ? `${activeDecibels} dB SPL` : '85 dB SPL'}
                </span>
              </span>
              <span className="text-slate-300">•</span>
              <span>NEODYMIUM 3W</span>
              <span className="text-slate-300">•</span>
            </div>
          </div>
        </div>

        {/* Supporting Editorial Caption */}
        <p className="text-slate-500 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
          A digital transaction becomes a sound wave in the air, creating instant certainty
          for the merchant without needing to check an app or wait for bank SMS.
        </p>
      </div>
    </section>
  );
};

