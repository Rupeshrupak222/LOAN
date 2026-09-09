'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Zap, Volume2, Sparkles, Play } from 'lucide-react';
import { SoundboxDevice3D } from './SoundboxDevice3D';
import { useWebAudioChime } from './useWebAudioChime';

export const PaymentCounterSignal: React.FC = () => {
  const [pulsePosition, setPulsePosition] = useState(0); // 0% to 100%
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeviceRevealed, setIsDeviceRevealed] = useState(false);
  const [isSpeakerActive, setIsSpeakerActive] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const { playChime } = useWebAudioChime();

  const stages = [
    { label: 'CUSTOMER', pos: 10, note: 'Buyer Authorizes UPI Scan' },
    { label: 'QR', pos: 35, note: 'Dynamic Terminal Read' },
    { label: 'PAYMENT', pos: 65, note: 'Banking Switch Commit' },
    { label: 'SOUNDBOX', pos: 95, note: 'Instant Acoustic Broadcast' },
  ];

  const startSignalTransmission = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setIsDeviceRevealed(false);
    setIsSpeakerActive(false);
    setPulsePosition(0);

    const startTime = performance.now();
    const duration = 2400; // 2.4s smooth travel across screen

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setPulsePosition(eased * 100);

      if (progress >= 0.85 && !isDeviceRevealed) {
        setIsDeviceRevealed(true);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Signal has reached the Soundbox!
        setIsSpeakerActive(true);
        playChime(1.0);
        setTimeout(() => {
          setIsSpeakerActive(false);
          setIsPlaying(false);
        }, 3000);
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  // IntersectionObserver cleanup: pause when scrolled out of view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            cancelAnimationFrame(animRef.current);
            setIsPlaying(false);
            setIsSpeakerActive(false);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <section
      id="section-counter-signal"
      ref={sectionRef}
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-16 relative z-10">
        {/* Section Header: Minimal, High-Impact Editorial */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>THE PAYMENT SIGNAL</span>
          </div>

          <h2 className="text-3xl sm:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.08]">
            A PAYMENT HAPPENS. <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              A SIGNAL MAKES IT REAL.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            A single photon pulse travels from the customer&apos;s phone across the counter into the Soundbox,
            igniting the acoustic chamber the exact millisecond the transaction clears.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={startSignalTransmission}
              disabled={isPlaying}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg ${
                isPlaying
                  ? 'bg-blue-50 text-[#155EEF] border border-blue-300 cursor-wait'
                  : 'bg-gradient-to-r from-[#155EEF] to-[#0284C7] hover:from-[#124bbf] hover:to-[#0270a8] text-white shadow-blue-500/20'
              }`}
            >
              <Play className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
              <span>{isPlaying ? 'Transmitting Payment Signal...' : 'Transmit Payment Signal'}</span>
            </button>
            <span className="block text-[11px] text-slate-500 font-mono mt-1.5">
              Follow the single light signal travel across the counter in real time
            </span>
          </div>
        </div>

        {/* ── CINEMATIC FULL-WIDTH HORIZONTAL PAYMENT STAGE ── */}
        <div className="relative py-12 px-4 sm:px-8 border-y border-slate-200/80 my-8">
          {/* Thin Laser Guide Rail Line */}
          <div className="relative w-full h-px bg-slate-200">
            {/* The Active Travelling Single Light Signal */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-transparent via-[#155EEF] to-cyan-400 rounded-full shadow-[0_0_20px_rgba(21,94,239,0.8)] transition-all ease-linear"
              style={{
                width: `${pulsePosition}%`,
                left: 0,
              }}
            />

            {/* Glowing Signal Head Pulse */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#155EEF] border-2 border-white shadow-[0_0_18px_rgba(21,94,239,1)] transition-all ease-linear -ml-2"
              style={{
                left: `${pulsePosition}%`,
              }}
            />
          </div>

          {/* Sequential Milestones along the Laser Axis (No Cards) */}
          <div className="relative grid grid-cols-4 gap-4 pt-8 text-center sm:text-left font-mono">
            {stages.map((stage, idx) => {
              const hasReached = pulsePosition >= stage.pos;
              return (
                <div key={stage.label} className="space-y-1 transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        hasReached ? 'bg-[#155EEF] shadow-[0_0_8px_#155EEF]' : 'bg-slate-300'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        hasReached ? 'text-[#071A33]' : 'text-slate-400'
                      }`}
                    >
                      {stage.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans pl-4 hidden sm:block">
                    {stage.note}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── SOUNDBOX REVELATION & WAVEFORM EXPANSION ── */}
          <div className="pt-16 pb-8 flex flex-col items-center justify-center min-h-[580px]">
            <div
              className={`transition-all duration-700 ease-out flex flex-col items-center ${
                isDeviceRevealed || isSpeakerActive
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-85 scale-95 translate-y-2'
              }`}
            >
              <SoundboxDevice3D
                rotationX={8}
                rotationY={-6}
                scale={1}
                isVibrating={isSpeakerActive}
                showWaveform={isSpeakerActive}
                displayAmount={isSpeakerActive ? '₹500.00' : 'READY FOR SCAN'}
                displayStatus={isSpeakerActive ? 'PAYMENT VERIFIED' : 'WAITING ON SIGNAL'}
              />

              {/* Status Callout when Activated */}
              <div className="mt-10 flex items-center gap-2.5 text-xs font-mono text-slate-600 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSpeakerActive ? 'bg-emerald-500 animate-ping' : 'bg-[#155EEF]'
                  }`}
                />
                <span className="uppercase font-semibold tracking-wide">
                  {isSpeakerActive
                    ? 'Acoustic Waveform Expanded • Verified at Counter'
                    : 'Awaiting Next Incoming Payment Signal'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
