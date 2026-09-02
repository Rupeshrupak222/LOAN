'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Register GSAP plugins once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface GsapContextValue {
  lenis: Lenis | null;
  isReady: boolean;
}

const GsapContext = createContext<GsapContextValue>({ lenis: null, isReady: false });

export const useGsapContext = () => useContext(GsapContext);

export const GsapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);
  const [isReady, setIsReady] = useState(false);
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create Lenis instance (skip if reduced motion)
    if (!prefersReducedMotion) {
      const lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
      });

      lenisRef.current = lenis;

      // Sync Lenis scroll with GSAP ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update);

      // Use GSAP ticker instead of manual rAF for precise sync
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });

      // Disable Lenis's own rAF since GSAP ticker handles it
      gsap.ticker.lagSmoothing(0);
    }

    // Configure GSAP defaults for premium feel
    gsap.defaults({
      ease: 'power3.out',
      duration: 0.8,
    });

    // Set up GSAP context for cleanup
    ctxRef.current = gsap.context(() => {});

    setIsReady(true);

    return () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      if (ctxRef.current) {
        ctxRef.current.revert();
      }
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.ticker.remove((time) => {
        lenisRef.current?.raf(time * 1000);
      });
    };
  }, []);

  return (
    <GsapContext.Provider value={{ lenis: lenisRef.current, isReady }}>
      {children}
    </GsapContext.Provider>
  );
};
