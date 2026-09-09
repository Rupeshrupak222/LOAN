'use client';

import React from 'react';

export const SketchComplexitySimplicity: React.FC<{ className?: string }> = ({ className = '' }) => {
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
          SKETCH 07 // TRANSFORMATION KINETICS
        </span>
        <span>FIG. 7.0 — CHAOS RESOLVED TO ESSENCE</span>
      </div>

      <svg
        viewBox="0 0 850 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto py-2"
      >
        {/* Baseline Axis */}
        <line x1="40" y1="100" x2="810" y2="100" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />

        {/* ── LEFT: Tangled, Knotty, Multi-Step Legacy Labyrinth ── */}
        <g stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Confusing loops, overlapping scribbles, and jagged zigzags */}
          <path d="M 60 100 C 90 40, 110 160, 140 70 C 170 140, 120 40, 160 150 C 200 60, 180 180, 220 90 C 250 160, 220 50, 260 130 C 290 80, 270 170, 310 100" />
          <path d="M 70 80 C 130 150, 150 50, 200 120 C 240 60, 280 150, 320 100" stroke="#94A3B8" strokeDasharray="3 3" />
          <path d="M 90 130 C 140 60, 200 160, 250 80 C 280 140, 300 90, 330 100" stroke="#CBD5E1" />
        </g>
        <text x="70" y="175" fill="#E11D48" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [CHAOTIC LEGACY FRICTION]
        </text>
        <text x="70" y="188" fill="#64748B" fontSize="8" fontFamily="monospace">
          MANUAL CHECKS · DISPARATE FORMS · DELAYS
        </text>

        {/* ── CENTER: The Adyapan Compression Filter (Funnel / Caliper) ── */}
        <g stroke="#071A33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Mechanical Caliper Frame */}
          <line x1="370" y1="40" x2="430" y2="85" stroke="#155EEF" strokeWidth="2" />
          <line x1="370" y1="160" x2="430" y2="115" stroke="#155EEF" strokeWidth="2" />
          <line x1="430" y1="85" x2="430" y2="115" stroke="#155EEF" strokeWidth="2.5" />
          <circle cx="430" cy="100" r="14" fill="#FFFFFF" stroke="#155EEF" strokeWidth="2" />
          <path d="M 426 100 L 434 100" stroke="#155EEF" strokeWidth="2" />
          <path d="M 430 96 L 430 104" stroke="#155EEF" strokeWidth="2" />
        </g>
        <text x="360" y="30" fill="#155EEF" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [ADYAPAN SYNCHRONIZATION]
        </text>

        {/* ── RIGHT: One Pure, Confident, Direct Blue Line ── */}
        <g stroke="#155EEF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="445" y1="100" x2="790" y2="100" />
          <polygon points="785,93 802,100 785,107" fill="#155EEF" stroke="none" />
        </g>
        <text x="520" y="140" fill="#071A33" fontSize="10" fontFamily="monospace" fontWeight="bold">
          ONE CLEAN CONTINUOUS JOURNEY
        </text>
        <text x="520" y="155" fill="#10B981" fontSize="9" fontFamily="monospace" fontWeight="bold">
          ✓ SUB-MINUTE SANCTION · IMMEDIATE SETTLEMENT
        </text>
      </svg>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>NOTEBOOK REF: SIMP-07</span>
        <span className="text-[#155EEF] font-bold">COMPLEXITY LIVES IN THE ENGINE · SIMPLICITY LIVES IN THE JOURNEY</span>
      </div>
    </div>
  );
};
