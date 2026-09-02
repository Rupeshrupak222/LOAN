'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * High-performance lerped mouse parallax hook.
 * Uses requestAnimationFrame to interpolate mouse movement smoothly (60fps),
 * preventing direct jarring jumps and creating natural floating depth.
 */
export function useMouseParallax(damping = 0.08) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const targetCoords = useRef({ x: 0, y: 0 });
  const currentCoords = useRef({ x: 0, y: 0 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Disable on touch devices
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize from -1 to 1 based on viewport center
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      targetCoords.current = {
        x: (e.clientX - centerX) / centerX,
        y: (e.clientY - centerY) / centerY,
      };
    };

    const animate = () => {
      const dx = targetCoords.current.x - currentCoords.current.x;
      const dy = targetCoords.current.y - currentCoords.current.y;

      currentCoords.current.x += dx * damping;
      currentCoords.current.y += dy * damping;

      setCoords({
        x: currentCoords.current.x,
        y: currentCoords.current.y,
      });

      animFrameId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animFrameId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [damping]);

  return coords;
}
