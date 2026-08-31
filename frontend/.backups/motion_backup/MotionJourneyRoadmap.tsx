'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  FileText,
  ShieldCheck,
  Cpu,
  Zap,
  Rocket,
} from 'lucide-react';

const STAGES = [
  {
    step: '01',
    title: 'Apply in 30s',
    sub: 'Set your coordinates',
    desc: 'Pick your purpose and desired amount. No tedious forms or branch paperwork.',
    icon: FileText,
    badge: '30 Seconds',
  },
  {
    step: '02',
    title: 'Instant e-KYC',
    sub: 'DigiLocker Consent',
    desc: 'Zero photocopies. Instant Aadhaar & PAN verification with bank-grade 256-bit encryption.',
    icon: ShieldCheck,
    badge: '60 Seconds',
  },
  {
    step: '03',
    title: 'Smart Sanction',
    sub: 'AI Underwriting',
    desc: 'Our credit engine assesses cash-flow health with zero human bias to sanction maximum credit.',
    icon: Cpu,
    badge: 'Real-Time',
  },
  {
    step: '04',
    title: 'Receive Funds',
    sub: 'Instant UPI / Bank Rail',
    desc: 'Funds transferred directly to your Google Pay, PhonePe, or Primary Bank Account.',
    icon: Zap,
    badge: '90 Seconds flat',
  },
  {
    step: '05',
    title: 'Move Forward',
    sub: 'Empower Your Goal',
    desc: 'Scale your business, finish your degree, or renovate your home with peace of mind.',
    icon: Rocket,
    badge: 'Goal Achieved',
  },
];

export const MotionJourneyRoadmap: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      // Make everything visible immediately
      const allEls = sectionRef.current.querySelectorAll('[data-journey]');
      allEls.forEach((el) => gsap.set(el, { opacity: 1, y: 0, scale: 1 }));
      if (progressLineRef.current) gsap.set(progressLineRef.current, { scaleX: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      // Header entrance
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll('[data-reveal]');
        gsap.set(headerEls, { opacity: 0, y: 40 });

        ScrollTrigger.create({
          trigger: headerRef.current,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(headerEls, {
              opacity: 1, y: 0,
              duration: 0.8, stagger: 0.12, ease: 'power3.out',
            });
          },
        });
      }

      // Scroll-pinned progressive node activation
      if (gridRef.current && sectionRef.current) {
        const nodes = gridRef.current.querySelectorAll('[data-journey-node]');
        const nodeCount = nodes.length;

        // Initially hide all nodes
        gsap.set(nodes, {
          opacity: 0.3,
          scale: 0.88,
          y: 20,
        });

        // Create pinned scroll experience
        const pinTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 15%',
            end: `+=${nodeCount * 250}`,
            pin: true,
            scrub: 0.8,
            pinSpacing: true,
          },
        });

        // Progressive progress line
        if (progressLineRef.current) {
          gsap.set(progressLineRef.current, { scaleX: 0, transformOrigin: 'left center' });
          pinTl.to(progressLineRef.current, {
            scaleX: 1,
            duration: nodeCount,
            ease: 'none',
          }, 0);
        }

        // Sequentially activate each node
        nodes.forEach((node, i) => {
          const startTime = (i / nodeCount) * nodeCount;

          pinTl.to(node, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: 'back.out(1.5)',
          }, startTime);

          // Glow pulse on the step number
          const stepBadge = node.querySelector('[data-step-badge]');
          if (stepBadge) {
            pinTl.to(stepBadge, {
              boxShadow: '0 0 20px rgba(78, 168, 255, 0.5)',
              duration: 0.4,
              ease: 'power2.out',
            }, startTime + 0.3);
            pinTl.to(stepBadge, {
              boxShadow: '0 0 0px rgba(78, 168, 255, 0)',
              duration: 0.6,
              ease: 'power2.out',
            }, startTime + 0.7);
          }
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 bg-[#071A33] text-white overflow-hidden"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16">
          <div data-reveal className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-[#4EA8FF] uppercase tracking-widest mb-3 font-bold">
            <span>CHAPTER 04 : THE FINANCIAL JOURNEY</span>
          </div>

          <h2 data-reveal className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
            How your money moves.
          </h2>

          <p data-reveal className="text-[#B8C7D9] text-base sm:text-lg font-medium">
            A single, continuous financial path from your first intent to cash in hand in under 3 minutes.
          </p>
        </div>

        {/* Progress Line (horizontal connecting line between nodes) */}
        <div className="relative mb-6 hidden lg:block">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 -translate-y-1/2" />
          <div
            ref={progressLineRef}
            className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2"
            style={{
              background: 'linear-gradient(90deg, #155EEF, #4EA8FF, #155EEF)',
            }}
          />
        </div>

        {/* 5 Connected Interactive Nodes */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                data-journey-node
                className="p-6 rounded-2xl border border-white/15 bg-white/10 hover:bg-white/15 hover:border-[#4EA8FF] transition-all backdrop-blur-md flex flex-col justify-between h-full group"
              >
                {/* Node Top Header */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    data-step-badge
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm bg-[#155EEF] text-white shadow-xs group-hover:scale-110 transition-transform"
                  >
                    {stage.step}
                  </div>

                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-[#4EA8FF]">
                    {stage.badge}
                  </span>
                </div>

                {/* Node Body */}
                <div>
                  <h4 className="text-base font-bold text-white mb-1">{stage.title}</h4>
                  <div className="text-xs font-semibold text-[#4EA8FF] mb-2">{stage.sub}</div>
                  <p className="text-xs text-[#B8C7D9] leading-relaxed font-normal">{stage.desc}</p>
                </div>

                {/* Status indicator */}
                <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-[#4EA8FF] font-bold">
                  Milestone 0{idx + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
