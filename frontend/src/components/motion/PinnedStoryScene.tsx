'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import {
  Compass,
  FileCheck,
  Calculator,
  ShieldCheck,
  Rocket,
  ArrowRight,
  Zap,
} from 'lucide-react';

const SCENES = [
  {
    id: 1,
    title: 'Tell us what you need.',
    tag: 'SCENE 01 / INTENT',
    desc: 'Whether scaling a restaurant inventory, funding technical upskilling, or renovating your family home, your intent drives our underwriting.',
    icon: Compass,
    metric: 'Instant Digital Intent Check',
    bgBadge: '01 Intent',
  },
  {
    id: 2,
    title: 'Choose your path.',
    tag: 'SCENE 02 / STRUCTURE',
    desc: 'Select tailored terms from 3 to 36 months, or choose our flagship 0% interest 3-month split option. No fine-print surprises.',
    icon: FileCheck,
    metric: '0% Split or Flexible Monthly EMI',
    bgBadge: '02 Architecture',
  },
  {
    id: 3,
    title: 'Understand your numbers.',
    tag: 'SCENE 03 / TRANSPARENCY',
    desc: 'Every single rupee is accounted for in real-time. Zero hidden processing deductions, zero prepayment penalties.',
    icon: Calculator,
    metric: '100% Reducing Balance Math',
    bgBadge: '03 Transparency',
  },
  {
    id: 4,
    title: 'Check your eligibility in 60s.',
    tag: 'SCENE 04 / UNDERWRITING',
    desc: 'Direct paperless DigiLocker consent with zero branch visits. Check your pre-approved limit without impacting your CIBIL score.',
    icon: ShieldCheck,
    metric: 'Zero Impact on Credit Score',
    bgBadge: '04 Verification',
  },
  {
    id: 5,
    title: 'Move forward with momentum.',
    tag: 'SCENE 05 / DISBURSAL',
    desc: 'Approved capital lands straight into your Google Pay, PhonePe, or Primary Bank Account in 90 seconds flat.',
    icon: Rocket,
    metric: '⚡ 90s Disbursal Complete',
    bgBadge: '05 Momentum',
  },
];

export const PinnedStoryScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setProgress(latest);
      // Map 0 -> 1 into 0 -> 4 indices
      const index = Math.min(4, Math.max(0, Math.floor(latest * 5)));
      setActiveIdx(index);
    });

    return () => unsubscribe();
  }, [scrollYProgress]);

  const currentScene = SCENES[activeIdx];
  const Icon = currentScene.icon;

  return (
    <div id="story-scene" ref={containerRef} className="relative h-[280vh] bg-[#FFFFFF]">
      {/* Sticky Fullscreen Pinned Canvas */}
      <div className="sticky top-0 h-screen flex flex-col justify-center items-center overflow-hidden px-4 sm:px-6 lg:px-8 border-t border-[#D3E5FA]/60">
        {/* Soft Ambient Radial Lighting */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#EAF4FF] rounded-full blur-[140px] pointer-events-none opacity-60" />

        <div className="relative z-10 max-w-6xl w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAF4FF] border border-[#D3E5FA] text-xs font-mono text-[#155EEF] uppercase tracking-widest mb-3 font-bold">
              <span>NARRATIVE ARC : SCROLL-DRIVEN MOMENTUM</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#071A33] tracking-tight">
              A financing experience engineered like a high-end product.
            </h2>
          </div>

          {/* 5-Segment Dynamic Progress Pill Bar */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-10">
            {SCENES.map((s, idx) => {
              const segmentProgress = Math.min(1, Math.max(0, (progress - idx * 0.2) / 0.2));

              return (
                <div
                  key={s.id}
                  onClick={() => setActiveIdx(idx)}
                  className="flex-1 max-w-[140px] h-2.5 rounded-full bg-slate-100 border border-[#D3E5FA] overflow-hidden cursor-pointer relative"
                >
                  <div
                    className="h-full bg-[#155EEF] transition-all duration-150"
                    style={{ width: `${segmentProgress * 100}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Dynamic Pinned Card Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl bg-white border border-[#D3E5FA] p-8 sm:p-12 shadow-lg relative min-h-[380px] overflow-hidden">
            {/* Left: Dynamic Morphing Headline & Description with AnimatePresence */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIdx}
                  initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -16, filter: 'blur(4px)' }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="space-y-4"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF4FF] text-[#155EEF] text-xs font-mono font-bold">
                    <span>{currentScene.tag}</span>
                  </div>

                  <h3 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-tight">
                    {currentScene.title}
                  </h3>

                  <p className="text-[#526071] text-base sm:text-lg leading-relaxed font-normal max-w-lg">
                    {currentScene.desc}
                  </p>

                  <div className="pt-4 flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-[#EAF4FF] border border-[#D3E5FA] text-xs font-mono font-bold text-[#155EEF] flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      <span>{currentScene.metric}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right: Dynamic Visual Stage Display with AnimatePresence */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="w-full aspect-square max-w-[340px] rounded-2xl bg-gradient-to-b from-[#EAF4FF] to-white border border-[#D3E5FA] p-8 flex flex-col items-center justify-center text-center shadow-md relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIdx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center justify-center"
                  >
                    <div className="w-24 h-24 rounded-2xl bg-[#155EEF] text-white flex items-center justify-center shadow-lg shadow-[#155EEF]/30 mb-6">
                      <Icon className="w-12 h-12" />
                    </div>
                    <div className="text-xs font-mono font-bold text-[#526071] uppercase tracking-wider mb-1">
                      STAGE 0{activeIdx + 1} OF 05
                    </div>
                    <div className="text-base font-bold text-[#071A33]">
                      {currentScene.bgBadge}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll helper */}
        <div className="absolute bottom-4 text-xs font-mono text-[#526071] font-semibold flex items-center gap-1.5 animate-pulse">
          <span>Keep scrolling to progress story</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-90" />
        </div>
      </div>
    </div>
  );
};
