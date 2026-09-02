'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface SectionTransitionProps {
  from?: string; // background color transitioning from
  to?: string;   // background color transitioning to
  variant?: 'gradient' | 'line' | 'wave';
  className?: string;
}

export const SectionTransition: React.FC<SectionTransitionProps> = ({
  from = '#FFFFFF',
  to = '#FFFFFF',
  variant = 'gradient',
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = gsap.context(() => {
      if (variant === 'line' && lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'power2.inOut',
            scrollTrigger: {
              trigger: ref.current,
              start: 'top 80%',
              end: 'bottom 50%',
              scrub: 1,
            },
          }
        );
      }
    }, ref);

    return () => ctx.revert();
  }, [variant]);

  if (variant === 'gradient') {
    return (
      <div
        ref={ref}
        className={`relative h-24 sm:h-32 pointer-events-none ${className}`}
        style={{
          background: `linear-gradient(to bottom, ${from}, ${to})`,
        }}
      />
    );
  }

  if (variant === 'line') {
    return (
      <div
        ref={ref}
        className={`relative h-16 flex items-center justify-center pointer-events-none overflow-hidden ${className}`}
        style={{ background: from }}
      >
        <div
          ref={lineRef}
          className="w-full max-w-3xl h-px origin-center"
          style={{
            background: `linear-gradient(90deg, transparent, #155EEF, transparent)`,
            opacity: 0.4,
          }}
        />
      </div>
    );
  }

  // wave variant
  return (
    <div
      ref={ref}
      className={`relative h-20 pointer-events-none overflow-hidden ${className}`}
      style={{ background: from }}
    >
      <svg
        viewBox="0 0 1440 80"
        className="absolute bottom-0 w-full"
        preserveAspectRatio="none"
        style={{ height: '100%' }}
      >
        <path
          d="M0,40 C360,80 720,0 1440,40 L1440,80 L0,80 Z"
          fill={to}
          opacity="0.6"
        />
        <path
          d="M0,50 C360,70 720,20 1440,50 L1440,80 L0,80 Z"
          fill={to}
        />
      </svg>
    </div>
  );
};
