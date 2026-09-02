'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface MotionScrollReveal3DProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  rotateX?: number;
  scale?: number;
  duration?: number;
  triggerStart?: string;
  staggerChildren?: boolean;
}

export const MotionScrollReveal3D: React.FC<MotionScrollReveal3DProps> = ({
  children,
  className = '',
  delay = 0,
  yOffset = 70,
  rotateX = 14,
  scale = 0.93,
  duration = 1.05,
  triggerStart = 'top 88%',
  staggerChildren = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = containerRef.current;

    if (reducedMotion) {
      gsap.set(el, { opacity: 1, y: 0, rotateX: 0, scale: 1, filter: 'blur(0px)', clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      // Find cards / grid child nodes for 3D cascading entrance
      const childCards = el.querySelectorAll('[data-reveal-card], .grid > div, .space-y-4 > div');

      // Set initial 3D spatial lowered state on container
      gsap.set(el, {
        opacity: 0,
        y: yOffset,
        rotateX: rotateX,
        scale: scale,
        transformPerspective: 1400,
        transformOrigin: '50% 15%',
        filter: 'blur(10px)',
      });

      if (staggerChildren && childCards.length > 0) {
        gsap.set(childCards, {
          opacity: 0,
          y: 35,
          rotateX: 10,
          scale: 0.95,
          transformPerspective: 1000,
        });
      }

      ScrollTrigger.create({
        trigger: el,
        start: triggerStart,
        once: true,
        onEnter: () => {
          const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
          });

          // Animate main container in 3D
          tl.to(el, {
            opacity: 1,
            y: 0,
            rotateX: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: duration,
            delay: delay,
            clearProps: 'filter,transformPerspective,transformOrigin',
          });

          // Cascade child cards with 3D stagger
          if (staggerChildren && childCards.length > 0) {
            tl.to(
              childCards,
              {
                opacity: 1,
                y: 0,
                rotateX: 0,
                scale: 1,
                duration: 0.8,
                stagger: 0.08,
                clearProps: 'transformPerspective',
              },
              `-=${duration * 0.7}`
            );
          }
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [delay, yOffset, rotateX, scale, duration, triggerStart, staggerChildren]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform, opacity' }}
    >
      {children}
    </div>
  );
};
