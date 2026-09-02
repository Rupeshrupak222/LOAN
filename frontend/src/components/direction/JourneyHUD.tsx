'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Layers,
  Cpu,
  Calculator,
  Clock,
  Users,
  ShieldCheck,
  Rocket,
  ChevronUp,
} from 'lucide-react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
  onSelectDirection: (id: DirectionId) => void;
}

export const JourneyHUD: React.FC<Props> = ({
  activeDirection,
  onSelectDirection,
}) => {
  const current = DIRECTIONS[activeDirection];
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 animate-fade-up max-w-[95vw]">
      <div className="flex items-center gap-2 sm:gap-3 px-4 py-2.5 rounded-full bg-white/95 border border-slate-300/80 backdrop-blur-2xl shadow-2xl shadow-slate-900/15">
        {/* Active Direction Pill */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-200">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: current.accentHex }}
          />
          <span className="text-xs font-mono font-bold text-slate-900 uppercase hidden md:inline-block">
            {current.label.split(' ')[0]} PATH
          </span>
        </div>

        {/* Chapter Shortcuts */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs font-mono font-bold">
          <a
            href="#branches"
            className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors hidden sm:inline-block"
          >
            Branches
          </a>
          <a
            href="#simulator"
            className="px-2.5 py-1 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Simulator
          </a>
          <a
            href="#launchpad"
            className="px-3 py-1 rounded-lg font-bold text-white transition-all duration-200 shadow-xs"
            style={{ backgroundColor: current.accentHex }}
          >
            Get Loan
          </a>
        </div>

        {/* Scroll to Top */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Back to Top"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
