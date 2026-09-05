'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface SplitTextEmergence3DProps {
  phrase1: string;
  phrase2: string;
  eyebrow?: string;
  description?: string;
  className?: string;
  align?: 'left' | 'center';
}

export const SplitTextEmergence3D: React.FC<SplitTextEmergence3DProps> = ({
  phrase1,
  phrase2,
  eyebrow,
  description,
  className = '',
  align = 'center',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLHeadingElement>(null);
  const line2Ref = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!containerRef.current || !line1Ref.current || !line2Ref.current) return;
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Line 1: Comes forward from deep -1100px Z space
      gsap.set(line1Ref.current, {
        opacity: 0,
        z: -1100,
        rotateX: 24,
        scale: 0.6,
        filter: 'blur(12px)',
        transformPerspective: 1400,
      });

      // Line 2: Comes forward from -800px Z space with opposing rotation
      gsap.set(line2Ref.current, {
        opacity: 0,
        z: -800,
        rotateX: -18,
        scale: 0.7,
        filter: 'blur(10px)',
        transformPerspective: 1400,
      });

      if (descRef.current) {
        gsap.set(descRef.current, {
          opacity: 0,
          y: 30,
          filter: 'blur(6px)',
        });
      }

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
          });

          // Phrase 1 arrives
          tl.to(line1Ref.current, {
            opacity: 1,
            z: 0,
            rotateX: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 1.1,
          });

          // Phrase 2 arrives right behind it
          tl.to(
            line2Ref.current,
            {
              opacity: 1,
              z: 0,
              rotateX: 0,
              scale: 1,
              filter: 'blur(0px)',
              duration: 1.0,
            },
            '-=0.75'
          );

          if (descRef.current) {
            tl.to(
              descRef.current,
              {
                opacity: 1,
                y: 0,
                filter: 'blur(0px)',
                duration: 0.8,
              },
              '-=0.5'
            );
          }
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const alignmentClasses = align === 'center' ? 'text-center items-center' : 'text-left items-start';

  return (
    <div
      ref={containerRef}
      className={`flex flex-col ${alignmentClasses} ${className}`}
      style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
    >
      {eyebrow && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider text-[#155EEF] bg-blue-50/90 border border-blue-200/80 mb-4 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#155EEF] animate-pulse" />
          <span>{eyebrow}</span>
        </div>
      )}

      <div style={{ transformStyle: 'preserve-3d' }}>
        <h2
          ref={line1Ref}
          className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-[1.08] select-none"
        >
          {phrase1}
        </h2>
        <h2
          ref={line2Ref}
          className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#155EEF] tracking-tight leading-[1.08] mt-1 select-none"
        >
          {phrase2}
        </h2>
      </div>

      {description && (
        <p
          ref={descRef}
          className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed font-normal"
        >
          {description}
        </p>
      )}
    </div>
  );
};
