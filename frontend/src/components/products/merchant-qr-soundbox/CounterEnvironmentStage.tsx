'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Coffee,
  ShoppingBag,
  UtensilsCrossed,
  Store,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { SoundboxDevice3D } from './SoundboxDevice3D';

interface MerchantContext {
  id: string;
  name: string;
  category: string;
  icon: React.ElementType;
  counterMaterial: string;
  counterGradient: string;
  noiseLevel: string;
  avgTicket: string;
  contextNarrative: string;
  counterProps: { label: string; icon: string };
}

const CONTEXTS: MerchantContext[] = [
  {
    id: 'cafe',
    name: 'Artisan Espresso Bar',
    category: 'CAFE',
    icon: Coffee,
    counterMaterial: 'Solid Teak Wood & Brushed Brass Rim',
    counterGradient: 'from-[#FDFBF7] via-[#F5ECE3] to-[#E9DCCF]',
    noiseLevel: '78 dB (Steam wand & bean grinder chatter)',
    avgTicket: '₹280.00',
    contextNarrative:
      'Baristas cannot glance at personal phones while steaming milk. The soundbox cuts through ambient espresso steam, announcing the exact rupee total.',
    counterProps: { label: 'Fresh Roast Portafilter & Tamper Station', icon: '☕' },
  },
  {
    id: 'retail',
    name: 'Apparel & Lifestyle Boutique',
    category: 'RETAIL',
    icon: ShoppingBag,
    counterMaterial: 'Honed Italian Terrazzo & Matte Black Trim',
    counterGradient: 'from-[#FFFFFF] via-[#F8FAFC] to-[#EEF2F6]',
    noiseLevel: '65 dB (Boutique acoustic soundtrack)',
    avgTicket: '₹2,450.00',
    contextNarrative:
      'Cashiers multi-task bagging merchandise and removing security tags. Instant audible verification matches the barcode total without screen re-checks.',
    counterProps: { label: 'Garment Scanner & Acrylic Stand', icon: '🛍️' },
  },
  {
    id: 'restaurant',
    name: 'Bistro & Craft Dining',
    category: 'RESTAURANT',
    icon: UtensilsCrossed,
    counterMaterial: 'Chiseled Charcoal Granite with Warm Amber Accent',
    counterGradient: 'from-[#F8FAFC] via-[#EFF3F8] to-[#E2E8F0]',
    noiseLevel: '82 dB (Evening dining venue buzz)',
    avgTicket: '₹1,850.00',
    contextNarrative:
      'During dinner rush turnover, split bills and rapid table exits require unmistakable audio confirmation heard 5 meters away across the dining floor.',
    counterProps: { label: 'Table Folio & Guest Bill Tray', icon: '🍽️' },
  },
  {
    id: 'bazaar',
    name: 'High-Footfall Commercial Counter',
    category: 'SMALL BUSINESS',
    icon: Store,
    counterMaterial: 'Industrial Brushed Stainless Steel Stall Surface',
    counterGradient: 'from-[#F1F5F9] via-[#E2E8F0] to-[#CBD5E1]',
    noiseLevel: '86 dB (Street traffic and market bustle)',
    avgTicket: '₹140.00',
    contextNarrative:
      'Open market counters lack reliable wall sockets and endure extreme dust. The 2600mAh internal battery delivers 7-day untethered operation.',
    counterProps: { label: 'Counter Register & Packaging Stand', icon: '📦' },
  },
];

export const CounterEnvironmentStage: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isActivated, setIsActivated] = useState(false);
  const [pulseWave, setPulseWave] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const current = CONTEXTS[activeIdx];

  const handleSoundboxTap = () => {
    if (isActivated) return;
    setIsActivated(true);
    setPulseWave(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsActivated(false);
      setPulseWave(false);
    }, 2200);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? CONTEXTS.length - 1 : prev - 1));
    setIsActivated(false);
    setPulseWave(false);
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === CONTEXTS.length - 1 ? 0 : prev + 1));
    setIsActivated(false);
    setPulseWave(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-[#F8FAFC] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[700px] h-[500px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
              <Store className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>THE PHYSICAL COUNTER WORLD</span>
            </div>

            <h2 className="text-3xl sm:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.08]">
              BUILT FOR <br />
              <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
                THE COUNTER.
              </span>
            </h2>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              Camera travels across 4 distinct merchant worlds. The same Soundbox hardware remains
              physically grounded while adapting to varying acoustics and checkout rituals.
            </p>
          </div>

          {/* Panoramic Camera Track Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
              {CONTEXTS.map((c, idx) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveIdx(idx);
                    setIsActivated(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    activeIdx === idx
                      ? 'bg-[#155EEF] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {c.category}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Counter World"
                className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Counter World"
                className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── ONE CONTINUOUS PANORAMIC COUNTERTOP ENVIRONMENT ── */}
        <div
          className={`relative rounded-3xl bg-gradient-to-b ${current.counterGradient} border-2 border-slate-300/90 p-8 sm:p-16 shadow-xl transition-all duration-700 overflow-hidden`}
        >
          {/* Subtle Surface Texture Highlights */}
          <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-slate-900/10" />

          {/* Continuous Countertop Stage Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left Column: The Grounded Physical Soundbox in this World */}
            <div
              className="lg:col-span-6 flex flex-col items-center justify-center cursor-pointer group"
              onClick={handleSoundboxTap}
              title="Tap Soundbox to simulate payment confirmation in this environment"
            >
              <div className="relative">
                {/* Surface Contact Shadow */}
                <div className="w-80 h-5 rounded-full bg-black/20 blur-sm absolute -bottom-4 left-1/2 -translate-x-1/2 pointer-events-none" />

                <SoundboxDevice3D
                  rotationX={12}
                  rotationY={-10}
                  scale={0.98}
                  isVibrating={pulseWave}
                  showWaveform={pulseWave}
                  displayAmount={isActivated ? current.avgTicket : 'READY'}
                  displayStatus={isActivated ? 'PAYMENT VERIFIED' : 'ON COUNTER'}
                />
              </div>

              {/* Tap Indicator Badge */}
              <div className="mt-8 px-4 py-1.5 rounded-full bg-white/90 border border-slate-300 text-xs font-mono text-[#071A33] flex items-center gap-2 shadow-xs group-hover:border-[#155EEF] transition-all">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActivated ? 'bg-emerald-500 animate-ping' : 'bg-[#155EEF]'
                  }`}
                />
                <span className="font-semibold">
                  {isActivated ? `Announced: ${current.avgTicket} Verified` : 'Tap Soundbox to Test Environment Audio'}
                </span>
              </div>
            </div>

            {/* Right Column: Narrative Context & Counter Props */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF] uppercase">
                  <span>{current.counterProps.icon}</span>
                  <span>{current.counterProps.label}</span>
                </div>

                <h3 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight uppercase">
                  {current.name}
                </h3>

                <p className="text-slate-700 text-base sm:text-lg leading-relaxed font-medium">
                  {current.contextNarrative}
                </p>
              </div>

              {/* Technical Specifications for this Counter Environment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                    Surface Material
                  </span>
                  <div className="text-sm font-bold text-[#071A33] font-mono truncate">
                    {current.counterMaterial}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/90 border border-slate-200/90 shadow-xs space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                    Ambient Noise
                  </span>
                  <div className="text-sm font-bold text-[#155EEF] font-mono">
                    {current.noiseLevel}
                  </div>
                </div>
              </div>

              {/* Counter Calibration Metric */}
              <div className="p-4 rounded-2xl bg-white border border-blue-200 flex items-center justify-between text-xs shadow-xs">
                <span className="text-slate-600 font-medium">Counter Calibration:</span>
                <span className="font-mono font-bold text-[#155EEF]">85 dB Speaker Cut-Through</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
