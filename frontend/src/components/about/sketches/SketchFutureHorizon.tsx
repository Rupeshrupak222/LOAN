'use client';

import React from 'react';

export const SketchFutureHorizon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full rounded-2xl bg-white/90 border border-slate-200/90 p-6 shadow-sm overflow-hidden text-left ${className}`}>
      {/* Blueprint Grid Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #071A33 1px, transparent 1px), linear-gradient(to bottom, #071A33 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-mono text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5 font-bold text-[#071A33]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#155EEF]" />
          SKETCH 08 // THE HORIZON ENVELOPE
        </span>
        <span>FIG. 8.0 — ARCHITECTURAL HORIZON</span>
      </div>

      <svg
        viewBox="0 0 850 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto py-2"
      >
        {/* Baseline Ground Horizon */}
        <line x1="40" y1="160" x2="810" y2="160" stroke="#CBD5E1" strokeWidth="1.2" />

        {/* ── Structure 1: Solid Established Foundation (Left) ── */}
        <g stroke="#071A33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Solid building block */}
          <rect x="70" y="70" width="75" height="90" fill="#F8FAFC" />
          <line x1="70" y1="95" x2="145" y2="95" stroke="#CBD5E1" />
          <line x1="70" y1="120" x2="145" y2="120" stroke="#CBD5E1" />
          {/* Windows / modules */}
          <rect x="85" y="78" width="14" height="10" />
          <rect x="115" y="78" width="14" height="10" />
          <rect x="85" y="103" width="14" height="10" />
          <rect x="115" y="103" width="14" height="10" />
        </g>
        <text x="65" y="180" fill="#071A33" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [ESTABLISHED CORE]
        </text>

        {/* ── Structure 2: Scaling Platforms in Deployment (Center-Left) ── */}
        <g stroke="#071A33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="180" y="45" width="95" height="115" fill="#F8FAFC" />
          {/* Diagonal architectural bracing */}
          <line x1="180" y1="45" x2="275" y2="160" stroke="#155EEF" strokeWidth="1.2" strokeDasharray="3 3" />
          <line x1="275" y1="45" x2="180" y2="160" stroke="#155EEF" strokeWidth="1.2" strokeDasharray="3 3" />
          <rect x="200" y="60" width="20" height="20" />
          <rect x="235" y="60" width="20" height="20" />
        </g>
        <text x="185" y="180" fill="#155EEF" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [ACTIVE EXPANSION]
        </text>

        {/* ── Structure 3: Under Construction Blueprint (Center-Right) ── */}
        <g stroke="#155EEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 3">
          {/* Unfinished dotted skeleton frame */}
          <rect x="320" y="30" width="110" height="130" fill="none" />
          <line x1="320" y1="65" x2="430" y2="65" />
          <line x1="320" y1="100" x2="430" y2="100" />
          <line x1="375" y1="30" x2="375" y2="160" />
          {/* Crane / drafting arm */}
          <line x1="375" y1="30" x2="375" y2="15" stroke="#071A33" strokeDasharray="none" />
          <line x1="350" y1="15" x2="420" y2="15" stroke="#071A33" strokeDasharray="none" />
          <line x1="410" y1="15" x2="410" y2="35" stroke="#071A33" strokeDasharray="none" />
        </g>
        <text x="330" y="180" fill="#64748B" fontSize="9" fontFamily="monospace">
          // CONTINUOUS BLUEPRINTING
        </text>

        {/* ── Perspective Trajectory Arrow Extending Into Distance ── */}
        <g stroke="#155EEF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 460 140 C 530 110, 620 90, 780 70" />
          <polygon points="775,62 795,68 778,76" fill="#155EEF" stroke="none" />
          {/* Auxiliary coordinate marks */}
          <line x1="560" y1="60" x2="560" y2="160" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="680" y1="50" x2="680" y2="160" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
        </g>
        <text x="590" y="55" fill="#155EEF" fontSize="10" fontFamily="monospace" fontWeight="bold">
          FORWARD PERSPECTIVE VECTOR →
        </text>
        <text x="590" y="70" fill="#64748B" fontSize="8" fontFamily="monospace">
          WE ARE STILL BUILDING
        </text>
      </svg>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>NOTEBOOK REF: HORIZ-08</span>
        <span className="text-[#155EEF] font-bold">FOUNDED ON DISCIPLINE · OPEN TO THE FUTURE</span>
      </div>
    </div>
  );
};
