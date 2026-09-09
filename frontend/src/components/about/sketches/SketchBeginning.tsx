'use client';

import React from 'react';

export const SketchBeginning: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full rounded-2xl bg-white/90 border border-slate-200/90 p-6 shadow-sm overflow-hidden text-left ${className}`}>
      {/* Blueprint Grid Watermark */}
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
          SKETCH 01 // ORIGIN BLUEPRINT
        </span>
        <span>FIG. 1.0 — PEOPLE AT THE CENTER</span>
      </div>

      <svg
        viewBox="0 0 800 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto py-2"
      >
        {/* Architectural Construction Axis */}
        <line x1="60" y1="120" x2="740" y2="120" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="200" y1="30" x2="200" y2="210" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="400" y1="30" x2="400" y2="210" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
        <line x1="600" y1="30" x2="600" y2="210" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

        {/* ── 1. The Person (Architectural Outline / Silhouette) ── */}
        <g stroke="#071A33" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {/* Head */}
          <circle cx="100" cy="80" r="14" />
          {/* Torso & Pose */}
          <path d="M100 94 L100 145" />
          <path d="M100 108 L78 135" />
          <path d="M100 108 L122 130" />
          <path d="M100 145 L82 195" />
          <path d="M100 145 L118 195" />
          {/* Ground mark */}
          <path d="M70 198 C85 197, 115 197, 130 198" stroke="#94A3B8" strokeWidth="1.2" />
        </g>
        <text x="75" y="215" fill="#64748B" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [01. HUMAN MOMENT]
        </text>

        {/* Dynamic Curved Flow Connector 1 */}
        <path
          d="M130 115 C 160 110, 180 80, 220 80"
          stroke="#155EEF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeDasharray="5 3"
        />
        <polygon points="222,78 228,80 222,83" fill="#155EEF" />

        {/* ── 2. Real Financial Needs (Hand-drawn sketches) ── */}
        <g stroke="#071A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Home Mortgage shape */}
          <rect x="230" y="60" width="40" height="35" rx="3" stroke="#071A33" />
          <path d="M225 62 L250 42 L275 62" />
          <rect x="244" y="75" width="12" height="20" />

          {/* Education Cap */}
          <path d="M240 135 L265 125 L290 135 L265 145 Z" fill="#F8FAFC" />
          <path d="M248 140 L248 155 C248 160, 282 160, 282 155 L282 140" />
          <path d="M285 137 L292 152" />

          {/* SME Shop Canopy */}
          <rect x="315" y="70" width="50" height="40" rx="2" stroke="#071A33" />
          <path d="M312 70 C325 60, 355 60, 368 70" fill="#F1F5F9" />
          <path d="M327 90 L353 90" stroke="#94A3B8" />
        </g>
        <text x="235" y="185" fill="#64748B" fontSize="9" fontFamily="monospace">
          // CRITICAL NEEDS
        </text>
        <text x="235" y="198" fill="#155EEF" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [CAPITAL WITH DIGNITY]
        </text>

        {/* Dynamic Curved Flow Connector 2 */}
        <path
          d="M375 90 C 410 90, 420 120, 450 120"
          stroke="#155EEF"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <polygon points="450,117 458,120 450,123" fill="#155EEF" />

        {/* ── 3. Mathematical & System Processing ── */}
        <g stroke="#071A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Precision Measurement Frame */}
          <circle cx="490" cy="120" r="32" stroke="#071A33" strokeDasharray="3 3" />
          <circle cx="490" cy="120" r="24" stroke="#155EEF" />
          {/* Caliper ticks */}
          <line x1="490" y1="84" x2="490" y2="92" stroke="#155EEF" strokeWidth="2" />
          <line x1="490" y1="148" x2="490" y2="156" stroke="#155EEF" strokeWidth="2" />
          <line x1="454" y1="120" x2="462" y2="120" stroke="#155EEF" strokeWidth="2" />
          <line x1="518" y1="120" x2="526" y2="120" stroke="#155EEF" strokeWidth="2" />
          {/* Core Symbol */}
          <path d="M482 120 L488 126 L498 114" stroke="#10B981" strokeWidth="2.2" />
        </g>
        <text x="445" y="185" fill="#64748B" fontSize="9" fontFamily="monospace">
          // ZERO-TRUST VERIFICATION
        </text>
        <text x="445" y="198" fill="#071A33" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [SUB-SECOND DECISION]
        </text>

        {/* Dynamic Curved Flow Connector 3 */}
        <path
          d="M530 120 C 560 120, 580 120, 610 120"
          stroke="#155EEF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <polygon points="610,117 618,120 610,123" fill="#155EEF" />

        {/* ── 4. The Emerging Adyapan Platform ── */}
        <g stroke="#071A33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Stacked Architecture Isometric Plates */}
          <polygon points="640,65 720,65 700,90 620,90" fill="#FFFFFF" stroke="#071A33" />
          <polygon points="640,95 720,95 700,120 620,120" fill="#F8FAFC" stroke="#155EEF" strokeWidth="2" />
          <polygon points="640,125 720,125 700,150 620,150" fill="#FFFFFF" stroke="#071A33" />
          {/* Connecting vertical pillar pins */}
          <line x1="620" y1="90" x2="620" y2="150" stroke="#94A3B8" strokeDasharray="2 2" />
          <line x1="700" y1="90" x2="700" y2="150" stroke="#94A3B8" strokeDasharray="2 2" />
        </g>
        <text x="615" y="185" fill="#155EEF" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [ADYAPAN PLATFORM]
        </text>
        <text x="615" y="198" fill="#64748B" fontSize="9" fontFamily="monospace">
          CONNECTED FINANCIAL FABRIC
        </text>
      </svg>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>NOTEBOOK REF: ARCH-01</span>
        <span className="text-[#155EEF] font-bold">PEOPLE ARE AT THE CENTER OF WHAT WE BUILD</span>
      </div>
    </div>
  );
};
