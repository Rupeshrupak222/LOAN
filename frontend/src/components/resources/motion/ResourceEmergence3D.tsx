'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ResourceEmergence3DProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  initialZ?: number; // e.g. -900 to -1200
  rotateX?: number; // e.g. 18
  rotateY?: number; // e.g. -5
  scale?: number; // e.g. 0.68
  duration?: number;
  triggerStart?: string;
  staggerCards?: boolean;
}

export const ResourceEmergence3D: React.FC<ResourceEmergence3DProps> = ({
  children,
  className = '',
  delay = 0,
  initialZ = -950,
  rotateX = 16,
  rotateY = -4,
  scale = 0.7,
  duration = 1.2,
  triggerStart = 'top 85%',
  staggerCards = true,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current || !contentRef.current) return;
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wrapper = wrapperRef.current;
    const content = contentRef.current;

    if (reducedMotion) {
      gsap.set(content, { opacity: 1, z: 0, rotateX: 0, rotateY: 0, scale: 1, filter: 'blur(0px)', clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      // Find internal cards for staggered entrance
      const childCards = content.querySelectorAll('[data-resource-card], [data-topic-card], .grid > div');

      // Set initial state deep in 3D space: translateZ(-950px), scale(0.7), rotateX/Y, blur, opacity 0
      gsap.set(content, {
        opacity: 0,
        z: initialZ,
        rotateX: rotateX,
        rotateY: rotateY,
        scale: scale,
        filter: 'blur(14px)',
        transformPerspective: 1600,
        transformOrigin: '50% 30%',
        willChange: 'transform, opacity, filter',
      });

      if (staggerCards && childCards.length > 0) {
        gsap.set(childCards, {
          opacity: 0,
          z: -250,
          y: 40,
          scale: 0.9,
          filter: 'blur(6px)',
        });
      }

      // ScrollTrigger with ENTER -> ACTIVE -> EXIT -> CLEANUP lifecycle
      ScrollTrigger.create({
        trigger: wrapper,
        start: triggerStart,
        end: 'bottom top',
        onEnter: () => {
          const tl = gsap.timeline({
            defaults: { ease: 'power3.out' },
          });

          // ENTER -> ACTIVE: emerge from deep space
          tl.to(content, {
            opacity: 1,
            z: 0,
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: duration,
            delay: delay,
            ease: 'power3.out',
          });

          if (staggerCards && childCards.length > 0) {
            tl.to(
              childCards,
              {
                opacity: 1,
                z: 0,
                y: 0,
                scale: 1,
                filter: 'blur(0px)',
                duration: 0.85,
                stagger: 0.08,
                ease: 'power2.out',
              },
              `-=${duration * 0.65}`
            );
          }
        },
        // EXIT -> CLEANUP: As section scrolls past, recede gracefully to eliminate visual bleed
        onLeave: () => {
          gsap.to(content, {
            opacity: 0.25,
            z: -180,
            scale: 0.94,
            filter: 'blur(4px)',
            duration: 0.55,
            ease: 'power2.inOut',
          });
        },
        onEnterBack: () => {
          gsap.to(content, {
            opacity: 1,
            z: 0,
            scale: 1,
            filter: 'blur(0px)',
            duration: 0.6,
            ease: 'power2.out',
          });
        },
        onLeaveBack: () => {
          gsap.to(content, {
            opacity: 0,
            z: initialZ * 0.6,
            scale: scale * 1.1,
            filter: 'blur(10px)',
            duration: 0.5,
            ease: 'power2.in',
          });
        },
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, [delay, initialZ, rotateX, rotateY, scale, duration, triggerStart, staggerCards]);

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
    >
      <div
        ref={contentRef}
        className="w-full relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </div>
    </div>
  );
};
