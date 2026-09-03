import React, { useState, useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Volume2,
  VolumeX,
  ArrowDown,
  Layers,
} from 'lucide-react';
import { SoundboxDevice3D } from './SoundboxDevice3D';
import { useWebAudioChime } from './useWebAudioChime';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const SoundboxHeroCommercial: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const deviceWrapperRef = useRef<HTMLDivElement>(null);
  const annotationsRef = useRef<HTMLDivElement>(null);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isVibrating, setIsVibrating] = useState(false);
  const [showWaveform, setShowWaveform] = useState(false);
  const [displayAmount, setDisplayAmount] = useState('₹500.00');
  const [displayStatus, setDisplayStatus] = useState('PAYMENT VERIFIED');
  const { isAudioMuted, toggleMute, playChime } = useWebAudioChime();

  // 3D Parallax with Strict Subtle Inertia (rotateY: -6° to +6°, rotateX: -4° to +4°)
  const [gyroAngle, setGyroAngle] = useState({ rx: 0, ry: 0 });
  const gyroRef = useRef({
    rx: 0,
    ry: 0,
    targetRx: 0,
    targetRy: 0,
    rafId: 0,
  });

  const updateParallax = useCallback(() => {
    const g = gyroRef.current;
    // Spring lerp factor
    g.rx += (g.targetRx - g.rx) * 0.08;
    g.ry += (g.targetRy - g.ry) * 0.08;

    setGyroAngle({ rx: g.rx, ry: g.ry });

    const diff = Math.abs(g.targetRx - g.rx) + Math.abs(g.targetRy - g.ry);
    if (diff > 0.02) {
      g.rafId = requestAnimationFrame(updateParallax);
    } else {
      g.rafId = 0;
    }
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;

    const g = gyroRef.current;
    // Strict subtle movement: rotateY: -6deg to +6deg, rotateX: -4deg to +4deg
    g.targetRy = Math.max(-6, Math.min(6, normX * 6));
    g.targetRx = Math.max(-4, Math.min(4, -normY * 4));

    if (!g.rafId) {
      g.rafId = requestAnimationFrame(updateParallax);
    }
  };

  const handlePointerLeave = () => {
    const g = gyroRef.current;
    g.targetRx = 0;
    g.targetRy = 0;
    if (!g.rafId) {
      g.rafId = requestAnimationFrame(updateParallax);
    }
  };

  // Scroll Camera Zoom: Camera slowly moves closer, device becomes larger, labels disappear
  useEffect(() => {
    if (!containerRef.current || !deviceWrapperRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(deviceWrapperRef.current, {
        scale: 1.25,
        y: 60,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      });

      if (annotationsRef.current) {
        gsap.to(annotationsRef.current, {
          opacity: 0,
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'center top',
            scrub: true,
          },
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Hotspot interaction feedback
  const handleHotspotHover = (id: string | null) => {
    setActiveHotspot(id);
    if (id === 'grille') {
      setIsVibrating(true);
      setShowWaveform(true);
    } else if (id === 'display') {
      setDisplayStatus('OLED LIVE FEED');
    } else if (id === 'qr') {
      setDisplayStatus('READY FOR SCAN');
    } else {
      setIsVibrating(false);
      setShowWaveform(false);
      setDisplayStatus('PAYMENT VERIFIED');
    }
  };

  const handleButtonClick = (btn: string) => {
    if (btn === 'replay') {
      setIsVibrating(true);
      setShowWaveform(true);
      setDisplayAmount('₹500.00');
      setDisplayStatus('AUDIO REPLAY');
      playChime(1.0);
      setTimeout(() => {
        setIsVibrating(false);
        setShowWaveform(false);
        setDisplayStatus('PAYMENT VERIFIED');
      }, 1500);
    } else if (btn === 'volume') {
      toggleMute();
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative min-h-[95vh] flex flex-col items-center justify-between pt-10 pb-20 px-4 sm:px-8 overflow-hidden bg-gradient-to-b from-[#FFFFFF] via-[#F8FAFC] to-[#EEF4FB] text-[#071A33] select-none border-b border-slate-200"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Architectural Studio Lighting & Surface Refinement ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Overhead Soft Keylight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-blue-500/5 rounded-full blur-3xl" />
        {/* Soft Directional Rim Light */}
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        {/* Subtle Architectural Counter Surface Grid in Perspective */}
        <div
          className="absolute inset-x-0 bottom-0 h-96 opacity-25"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            transform: 'perspective(700px) rotateX(65deg) translateY(60px)',
            transformOrigin: '50% 100%',
          }}
        />
        {/* Thin Perspective Axis Lines */}
        <div className="absolute inset-x-0 bottom-24 h-px bg-gradient-to-r from-transparent via-slate-300/80 to-transparent" />
      </div>

      {/* ── TOP PRODUCT IDENTITY & EDITORIAL HEADLINE ── */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4 pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#155EEF] animate-pulse" />
          <span>MERCHANT QR SOUNDBOX</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-[#071A33] leading-[1.06] drop-shadow-xs max-w-4xl mx-auto uppercase">
          WHEN MONEY MOVES, <br />
          <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
            THE MERCHANT HEARS IT.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Connect QR payment acceptance with an audible confirmation that keeps merchants informed at the counter.
        </p>
      </div>

      {/* ── CENTER COMMERCIAL STAGE: Centered Grounded 3D Soundbox ── */}
      <div ref={deviceWrapperRef} className="relative z-10 w-full max-w-4xl my-8 flex flex-col items-center justify-center">
        <div ref={annotationsRef} className="relative w-full flex justify-center cursor-grab active:cursor-grabbing">
          <SoundboxDevice3D
            rotationX={gyroAngle.rx + 10}
            rotationY={gyroAngle.ry - 8}
            scale={1.05}
            isVibrating={isVibrating}
            showWaveform={showWaveform}
            displayAmount={displayAmount}
            displayStatus={displayStatus}
            activeHotspot={activeHotspot}
            onHotspotHover={handleHotspotHover}
            onButtonClick={handleButtonClick}
            showAnnotations={true}
          />
        </div>
      </div>

      {/* ── BOTTOM TECHNICAL METADATA & CALL-TO-ACTIONS ── */}
      <div className="relative z-10 flex flex-col items-center gap-5 pt-2">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-500 uppercase tracking-widest">
          <span>4G</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>IoT</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span>PAYMENT ALERTS</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            type="button"
            onClick={() => scrollToSection('section-counter-signal')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#155EEF] to-[#0284C7] hover:from-[#124bbf] hover:to-[#0270a8] text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Explore the Product</span>
            <ArrowDown className="w-4 h-4 transition-transform group-hover:translate-y-1" />
          </button>

          <button
            type="button"
            onClick={() => scrollToSection('section-exploded-architecture')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Layers className="w-4 h-4 text-[#155EEF]" />
            <span>See How It Works</span>
          </button>
        </div>
      </div>
    </section>
  );
};
