'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCountUp } from './hooks/useCountUp';

export const CinematicStatsStrip: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const stat1 = useCountUp(2400, 2000, 0); // ₹2,400 Cr+
  const stat2 = useCountUp(90, 1600, 0);   // 90 Seconds
  const stat3 = useCountUp(120, 1800, 0);  // 120,000+
  const stat4 = useCountUp(4.9, 1400, 1);  // 4.9★

  useEffect(() => {
    if (!sectionRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const cards = sectionRef.current!.querySelectorAll('[data-stat-card]');
      gsap.set(cards, {
        opacity: 0,
        rotateX: 18,
        y: 50,
        scale: 0.92,
        transformOrigin: 'bottom center',
        transformPerspective: 1000,
      });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 82%',
        once: true,
        onEnter: () => {
          gsap.to(cards, {
            opacity: 1,
            rotateX: 0,
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: 'power3.out',
            stagger: 0.12,
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-16 bg-[#FFFFFF] text-[#071A33] border-y border-[#D3E5FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left perspective-1000">
          {/* Stat 1 */}
          <div data-stat-card ref={stat1.ref} className="p-6 rounded-2xl bg-[#EAF4FF]/40 border border-[#D3E5FA] shadow-2xs hover:shadow-sm transition-shadow hover:-translate-y-1 duration-300">
            <div className="text-3xl sm:text-5xl font-black text-[#071A33] font-mono tracking-tight">
              ₹{stat1.count} Cr+
            </div>
            <div className="text-sm font-bold text-[#155EEF] mt-1">Institutional Credit Disbursed</div>
            <div className="text-xs text-[#526071] mt-0.5 font-medium">100% digital, zero branch visits</div>
          </div>

          {/* Stat 2 */}
          <div data-stat-card ref={stat2.ref} className="p-6 rounded-2xl bg-[#EAF4FF]/40 border border-[#D3E5FA] shadow-2xs hover:shadow-sm transition-shadow hover:-translate-y-1 duration-300">
            <div className="text-3xl sm:text-5xl font-black text-[#155EEF] font-mono tracking-tight">
              {stat2.count}s
            </div>
            <div className="text-sm font-bold text-[#071A33] mt-1">Average Disbursal Speed</div>
            <div className="text-xs text-[#526071] mt-0.5 font-medium">From approval to bank credit</div>
          </div>

          {/* Stat 3 */}
          <div data-stat-card ref={stat3.ref} className="p-6 rounded-2xl bg-[#EAF4FF]/40 border border-[#D3E5FA] shadow-2xs hover:shadow-sm transition-shadow hover:-translate-y-1 duration-300">
            <div className="text-3xl sm:text-5xl font-black text-[#071A33] font-mono tracking-tight">
              {stat3.count}k+
            </div>
            <div className="text-sm font-bold text-[#155EEF] mt-1">Empowered Borrowers</div>
            <div className="text-xs text-[#526071] mt-0.5 font-medium">Pan-India retail & merchants</div>
          </div>

          {/* Stat 4 */}
          <div data-stat-card ref={stat4.ref} className="p-6 rounded-2xl bg-[#EAF4FF]/40 border border-[#D3E5FA] shadow-2xs hover:shadow-sm transition-shadow hover:-translate-y-1 duration-300">
            <div className="text-3xl sm:text-5xl font-black text-[#F5B942] font-mono tracking-tight">
              {stat4.count} ★
            </div>
            <div className="text-sm font-bold text-[#071A33] mt-1">Borrower Trust Score</div>
            <div className="text-xs text-[#526071] mt-0.5 font-medium">Verified Google & Play Store rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};
