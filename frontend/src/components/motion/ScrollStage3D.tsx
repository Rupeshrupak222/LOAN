'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface ScrollStage3DProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  pin?: boolean;
  pinSpacing?: boolean;
  perspective?: number;
  scrub?: number | boolean;
  scrollLength?: string; // e.g. '+=100%' or '+=150%'
  enterStart?: string;
  exitEnd?: string;
}

export const ScrollStage3D: React.FC<ScrollStage3DProps> = ({
  children,
  className = '',
  id,
  pin = false,
  pinSpacing = true,
  perspective = 1400,
  scrub = 1,
  scrollLength = '+=100%',
  enterStart = 'top bottom',
  exitEnd = 'bottom top',
}) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerRef.current || !stageRef.current) return;
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    const depthMultiplier = isMobile ? 0.45 : 1.0;

    const stageEl = stageRef.current;
    const triggerEl = triggerRef.current;

    // Elements marked with depth attributes
    const depthElements = stageEl.querySelectorAll<HTMLElement>('[data-depth-z]');

    if (reducedMotion) {
      depthElements.forEach((el) => {
        el.style.transform = 'none';
        el.style.opacity = '1';
        el.style.filter = 'none';
      });
      return;
    }

    const ctx = gsap.context(() => {
      // Collect per-element initial and exit properties
      const elementsData = Array.from(depthElements).map((el) => {
        const targetZ = parseFloat(el.getAttribute('data-depth-z') || '-800') * depthMultiplier;
        const targetRotX = parseFloat(el.getAttribute('data-rotate-x') || '28') * (isMobile ? 0.5 : 1);
        const targetRotY = parseFloat(el.getAttribute('data-rotate-y') || '-8') * (isMobile ? 0.5 : 1);
        const targetScale = parseFloat(el.getAttribute('data-scale') || '0.7');
        const targetY = parseFloat(el.getAttribute('data-offset-y') || '60') * depthMultiplier;
        const targetBlur = isMobile ? 4 : parseFloat(el.getAttribute('data-blur') || '10');
        const staggerDelay = parseFloat(el.getAttribute('data-stagger') || '0');

        return {
          el,
          targetZ,
          targetRotX,
          targetRotY,
          targetScale,
          targetY,
          targetBlur,
          staggerDelay,
        };
      });

      // Initialize all elements deep in 3D space
      elementsData.forEach(({ el, targetZ, targetRotX, targetRotY, targetScale, targetY, targetBlur }) => {
        el.style.transform = `translate3d(0, ${targetY}px, ${targetZ}px) rotateX(${targetRotX}deg) rotateY(${targetRotY}deg) scale(${targetScale})`;
        el.style.opacity = '0';
        el.style.filter = `blur(${targetBlur}px)`;
        el.style.transformStyle = 'preserve-3d';
        el.style.willChange = 'transform, opacity, filter';
      });

      // Create ScrollTrigger tied directly to scroll progress
      ScrollTrigger.create({
        trigger: triggerEl,
        start: pin ? 'top top' : enterStart,
        end: pin ? scrollLength : exitEnd,
        pin: pin,
        pinSpacing: pin ? pinSpacing : false,
        scrub: scrub,
        onUpdate: (self) => {
          const p = self.progress;

          elementsData.forEach(({ el, targetZ, targetRotX, targetRotY, targetScale, targetY, targetBlur, staggerDelay }) => {
            // Apply stagger offset to progress window
            const effectiveP = Math.min(1, Math.max(0, (p - staggerDelay * 0.15) / (1 - staggerDelay * 0.15)));

            // ── PHASE 1: ENTER FROM DEPTH (0.0 -> 0.45) ──
            if (effectiveP < 0.45) {
              const enterP = effectiveP / 0.45; // 0 to 1
              // Smooth ease-out curve for entrance
              const eased = 1 - Math.pow(1 - enterP, 2.5);

              const currentZ = targetZ * (1 - eased);
              const currentRotX = targetRotX * (1 - eased);
              const currentRotY = targetRotY * (1 - eased);
              const currentScale = targetScale + (1 - targetScale) * eased;
              const currentY = targetY * (1 - eased);
              const currentBlur = targetBlur * (1 - eased);
              const currentOpacity = Math.min(1, eased * 1.3);

              el.style.transform = `translate3d(0, ${currentY.toFixed(1)}px, ${currentZ.toFixed(
                1
              )}px) rotateX(${currentRotX.toFixed(2)}deg) rotateY(${currentRotY.toFixed(2)}deg) scale(${currentScale.toFixed(3)})`;
              el.style.opacity = currentOpacity.toFixed(3);
              el.style.filter = currentBlur > 0.5 ? `blur(${currentBlur.toFixed(1)}px)` : 'none';
              el.style.pointerEvents = 'none';
            }
            // ── PHASE 2: ACTIVE & SETTLED (0.45 -> 0.72) ──
            else if (effectiveP >= 0.45 && effectiveP <= 0.72) {
              el.style.transform = 'translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) scale(1)';
              el.style.opacity = '1';
              el.style.filter = 'none';
              el.style.pointerEvents = 'auto';
            }
            // ── PHASE 3: EXIT INTO DEPTH (0.72 -> 1.0) ──
            else {
              const exitP = (effectiveP - 0.72) / 0.28; // 0 to 1
              const easedExit = Math.pow(exitP, 1.8);

              // Elements retreat backwards into space
              const exitZ = -950 * easedExit * depthMultiplier;
              const exitRotX = -24 * easedExit;
              const exitScale = 1 - 0.25 * easedExit;
              const exitY = -60 * easedExit;
              const exitBlur = 8 * easedExit;
              const exitOpacity = Math.max(0, 1 - easedExit * 1.25);

              el.style.transform = `translate3d(0, ${exitY.toFixed(1)}px, ${exitZ.toFixed(
                1
              )}px) rotateX(${exitRotX.toFixed(2)}deg) rotateY(0deg) scale(${exitScale.toFixed(3)})`;
              el.style.opacity = exitOpacity.toFixed(3);
              el.style.filter = exitBlur > 0.5 ? `blur(${exitBlur.toFixed(1)}px)` : 'none';
              el.style.pointerEvents = 'none';
            }
          });
        },
      });
    }, triggerEl);

    return () => ctx.revert();
  }, [pin, pinSpacing, perspective, scrub, scrollLength, enterStart, exitEnd]);

  return (
    <div
      ref={triggerRef}
      id={id}
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        perspective: `${perspective}px`,
        perspectiveOrigin: '50% 50%',
        contain: 'paint',
      }}
    >
      <div
        ref={stageRef}
        className="w-full h-full"
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </div>
    </div>
  );
};
