'use client';

import React, { useEffect, useState } from 'react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
}

export const DirectionGlowSpine: React.FC<Props> = ({ activeDirection }) => {
  const current = DIRECTIONS[activeDirection];
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = window.scrollY / totalHeight;
        setScrollProgress(Math.min(1, Math.max(0, currentProgress)));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-y-0 left-1/2 -translate-x-1/2 z-0 hidden lg:block w-px h-full">
      {/* Background ambient beam */}
      <div
        className="w-[2px] h-full mx-auto transition-colors duration-700 opacity-30"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${current.accentHex} 15%, #4f46e5 50%, ${current.accentHex} 85%, transparent 100%)`,
          boxShadow: `0 0 12px ${current.accentHex}`,
        }}
      />

      {/* Traveling Energy Pulse Orb */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full transition-all duration-300 pointer-events-none"
        style={{
          top: `${scrollProgress * 100}%`,
          transform: 'translate(-50%, -50%)',
          backgroundColor: current.accentHex,
          boxShadow: `0 0 20px 6px ${current.accentHex}, 0 0 30px 10px rgba(99,102,241,0.4)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-75"
          style={{ backgroundColor: current.accentHex }}
        />
      </div>
    </div>
  );
};
