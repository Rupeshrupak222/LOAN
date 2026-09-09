'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';
import { SoundboxDevice3D } from './SoundboxDevice3D';
import { useWebAudioChime } from './useWebAudioChime';

type SimState = 'idle' | 'sending' | 'confirmed';

export const FastCounterSimulation: React.FC = () => {
  const [simState, setSimState] = useState<SimState>('idle');
  const [isVibrating, setIsVibrating] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);
  const [displayAmount, setDisplayAmount] = useState('READY');
  const [displayStatus, setDisplayStatus] = useState('COUNTER IDLE');
  const sectionRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout[]>([]);
  const { playVoiceConfirmation } = useWebAudioChime();

  const clearAllTimers = () => {
    timerRef.current.forEach(clearTimeout);
    timerRef.current = [];
  };

  const handleSimulatePayment = () => {
    if (simState !== 'idle') return;
    clearAllTimers();

    // Stage 1: Phone sends payment
    setSimState('sending');
    setDisplayAmount('INGRESS...');
    setDisplayStatus('UPI VERIFYING');

    // Stage 2: Soundbox LED flashes, speaker activates, display shows amount (at 700ms)
    timerRef.current.push(
      setTimeout(() => {
        setSimState('confirmed');
        setIsVibrating(true);
        setShowWaveform(true);
        setDisplayAmount('₹500.00');
        setDisplayStatus('PAYMENT RECEIVED');
        playVoiceConfirmation('en', 1.0);
      }, 700)
    );

    // Stage 3: Return to idle after 3.8s
    timerRef.current.push(
      setTimeout(() => {
        setIsVibrating(false);
        setShowWaveform(false);
        setDisplayAmount('READY');
        setDisplayStatus('COUNTER IDLE');
        setSimState('idle');
      }, 4200)
    );
  };

  // IntersectionObserver cleanup: prevent audio when scrolled away
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            clearAllTimers();
            setSimState('idle');
            setIsVibrating(false);
            setShowWaveform(false);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearAllTimers();
    };
  }, []);

  return (
    <section
      id="section-payment-simulation"
      ref={sectionRef}
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-4xl mx-auto space-y-12 relative z-10 text-center">
        {/* Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Volume2 className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>HARDWARE BENCH TEST</span>
          </div>

          <h2 className="text-3xl sm:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.08]">
            PAYMENT <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              CONFIRMATION.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Test the physical hardware response. Trigger a transaction event and observe the instant
            acoustic broadcast and OLED illumination.
          </p>
        </div>

        {/* ── CENTER HARDWARE BENCH: One Soundbox, Live Response ── */}
        <div className="relative py-6 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Ground Contact Shadow */}
            <div className="w-72 h-4 rounded-full bg-black/20 blur-sm absolute -bottom-4 left-1/2 -translate-x-1/2 pointer-events-none" />

            <SoundboxDevice3D
              rotationX={12}
              rotationY={-10}
              scale={1.02}
              isVibrating={isVibrating}
              showWaveform={showWaveform}
              displayAmount={displayAmount}
              displayStatus={displayStatus}
            />
          </div>

          {/* Voice Confirmation Speech Balloon when Confirmed */}
          <div
            className={`mt-8 px-6 py-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
              simState === 'confirmed'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-md scale-105'
                : simState === 'sending'
                ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                : 'bg-white border-slate-200 text-slate-500 shadow-xs'
            }`}
          >
            {simState === 'confirmed' ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-mono font-bold tracking-wide">
                  &ldquo;ADYAPAN PAY: ₹500 RECEIVED SUCCESSFULLY&rdquo;
                </span>
              </>
            ) : simState === 'sending' ? (
              <>
                <Smartphone className="w-4 h-4 text-[#155EEF] animate-bounce shrink-0" />
                <span className="text-xs font-mono font-bold text-[#155EEF]">
                  CUSTOMER SMARTPHONE DISPATCHING PAYMENT...
                </span>
              </>
            ) : (
              <span className="text-xs font-mono text-slate-500">
                ILLUSTRATIVE DEMO • READY FOR TRIGGER
              </span>
            )}
          </div>

          {/* ── TACTILE MECHANICAL [ SIMULATE PAYMENT ] PUSH BUTTON ── */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={simState !== 'idle'}
              className={`relative px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                simState === 'idle'
                  ? 'bg-[#155EEF] hover:bg-[#124bbf] text-white shadow-[0_6px_0_#0d3882,0_12px_20px_rgba(21,94,239,0.3)] active:translate-y-1 active:shadow-[0_2px_0_#0d3882] cursor-pointer'
                  : 'bg-slate-300 text-slate-500 shadow-none translate-y-1 cursor-wait'
              }`}
            >
              <span>
                {simState === 'idle'
                  ? '[ SIMULATE PAYMENT ]'
                  : simState === 'sending'
                  ? 'COMMITTING PAYMENT...'
                  : 'CONFIRMED ON HARDWARE'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
