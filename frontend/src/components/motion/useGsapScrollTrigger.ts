'use client';

import { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Hook to create a GSAP ScrollTrigger timeline for a section.
 * Returns a ref to attach to the trigger element.
 * The `setup` callback receives the timeline and trigger element.
 */
export function useGsapTimeline(
  setup: (tl: gsap.core.Timeline, trigger: HTMLElement) => void,
  deps: React.DependencyList = []
) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Make everything visible immediately
      const children = triggerRef.current.querySelectorAll('[data-gsap]');
      children.forEach((el) => {
        gsap.set(el, { opacity: 1, y: 0, x: 0, scale: 1, rotateX: 0, rotateY: 0, filter: 'blur(0px)' });
      });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      setup(tl, triggerRef.current!);
    }, triggerRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return triggerRef;
}

/**
 * Hook for scroll-linked progress animation.
 * Creates a ScrollTrigger that maps scroll progress to animation state.
 */
export function useScrollProgress(
  setup: (trigger: HTMLElement) => ScrollTrigger | gsap.core.Timeline | void,
  deps: React.DependencyList = []
) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!triggerRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = gsap.context(() => {
      setup(triggerRef.current!);
    }, triggerRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return triggerRef;
}

/**
 * Creates a staggered reveal animation for child elements when they scroll into view.
 * Each child with [data-reveal] will animate in with the specified choreography.
 */
export function useScrollRevealGsap(
  config: {
    start?: string;
    end?: string;
    stagger?: number;
    fromVars?: gsap.TweenVars;
    toVars?: gsap.TweenVars;
    childSelector?: string;
  } = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const children = containerRef.current.querySelectorAll(
      config.childSelector || '[data-reveal]'
    );

    if (children.length === 0) return;

    if (reducedMotion) {
      gsap.set(children, { opacity: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)', clearProps: 'all' });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(children, {
        opacity: 0,
        y: 48,
        filter: 'blur(8px)',
        ...config.fromVars,
      });

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: config.start || 'top 85%',
        end: config.end || 'bottom 20%',
        once: true,
        onEnter: () => {
          gsap.to(children, {
            opacity: 1,
            y: 0,
            x: 0,
            scale: 1,
            rotateX: 0,
            rotateY: 0,
            filter: 'blur(0px)',
            duration: 0.9,
            ease: 'power3.out',
            stagger: config.stagger || 0.1,
            ...config.toVars,
          });
        },
      });
    }, containerRef);

    return () => ctx.revert();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return containerRef;
}
