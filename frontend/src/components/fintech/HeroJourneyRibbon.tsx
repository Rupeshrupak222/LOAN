'use client';

import React from 'react';

interface HeroJourneyRibbonProps {
  className?: string;
}

export const HeroJourneyRibbon: React.FC<HeroJourneyRibbonProps> = ({ className = '' }) => {
  // Continuous 3D curved SVG ribbon traversing all 6 steps
  const pathD = `
    M 60,340
    C 80,390 120,440 220,430
    C 310,420 340,360 430,370
    C 520,380 560,420 680,410
    C 800,400 870,240 980,240
    C 1070,240 1100,430 1200,435
    C 1270,440 1330,360 1380,280
  `;

  return (
    <div className={`absolute inset-0 pointer-events-none z-10 overflow-visible ${className}`}>
      <svg
        viewBox="0 0 1440 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="ribbonGradient" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.9" />
            <stop offset="25%" stopColor="#2563eb" stopOpacity="1" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="75%" stopColor="#2563eb" stopOpacity="1" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="glowGradient" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.5" />
          </linearGradient>

          <filter id="ribbonGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <marker
            id="arrowhead"
            markerWidth="14"
            markerHeight="14"
            refX="10"
            refY="7"
            orient="auto"
          >
            <polygon
              points="0 1, 12 7, 0 13, 3 7"
              fill="#1d4ed8"
              stroke="#2563eb"
              strokeWidth="1.5"
            />
          </marker>
        </defs>

        {/* Shadow */}
        <path
          d={pathD}
          stroke="rgba(37, 99, 235, 0.22)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0, 10)"
          filter="url(#ribbonGlow)"
        />

        {/* Soft Outer Neon Aura */}
        <path
          d={pathD}
          stroke="url(#glowGradient)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />

        {/* Solid Core Ribbon */}
        <path
          d={pathD}
          stroke="url(#ribbonGradient)"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd="url(#arrowhead)"
        />

        {/* Animated Pulse Highlight */}
        <path
          d={pathD}
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="24 180"
          className="animate-ribbon-flow opacity-80"
        />
      </svg>
    </div>
  );
};

export default HeroJourneyRibbon;
