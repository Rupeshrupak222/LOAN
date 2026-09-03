'use client';

import React from 'react';

export const SketchJourneyLine: React.FC<{ className?: string }> = ({ className = '' }) => {
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
          SKETCH 02 // CONTINUOUS JOURNEY LINE
        </span>
        <span>FIG. 2.0 — VECTOR TRAJECTORY</span>
      </div>

      <svg
        viewBox="0 0 900 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto py-2"
      >
        {/* Baseline Blueprint Construction Axes */}
        <line x1="40" y1="80" x2="860" y2="80" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="6 4" />

        {/* ── Continuous Hand-Drawn Fluid Trajectory Line ── */}
        <path
          d="M 50 80 Q 110 35, 170 80 T 290 80 T 430 80 T 570 80 T 710 80 T 850 80"
          stroke="#CBD5E1"
          strokeWidth="1.2"
          strokeDasharray="4 4"
        />
        <path
          d="M 50 80 C 100 40, 140 120, 200 80 C 260 40, 310 110, 380 80 C 450 50, 500 100, 570 80 C 640 60, 710 95, 780 80 C 810 70, 830 75, 850 80"
          stroke="#155EEF"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Milestone Node 1: IDEA */}
        <g stroke="#071A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="90" cy="62" r="7" fill="#FFFFFF" stroke="#155EEF" strokeWidth="2" />
          <line x1="90" y1="70" x2="90" y2="115" stroke="#94A3B8" strokeDasharray="2 2" />
        </g>
        <text x="65" y="130" fill="#071A33" fontSize="10" fontFamily="monospace" fontWeight="bold">
          01. IDEA
        </text>
        <text x="50" y="142" fill="#64748B" fontSize="8" fontFamily="monospace">
          // QUESTIONING FRICTION
        </text>

        {/* Milestone Node 2: BUILD */}
        <g stroke="#071A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="270" cy="68" r="7" fill="#FFFFFF" stroke="#155EEF" strokeWidth="2" />
          <line x1="270" y1="76" x2="270" y2="115" stroke="#94A3B8" strokeDasharray="2 2" />
        </g>
        <text x="248" y="130" fill="#071A33" fontSize="10" fontFamily="monospace" fontWeight="bold">
          02. BUILD
        </text>
        <text x="230" y="142" fill="#64748B" fontSize="8" fontFamily="monospace">
          // ENGINE PROTOTYPING
        </text>

        {/* Milestone Node 3: CONNECT */}
        <g stroke="#071A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="475" cy="68" r="7" fill="#FFFFFF" stroke="#155EEF" strokeWidth="2" />
          <line x1="475" y1="76" x2="475" y2="115" stroke="#94A3B8" strokeDasharray="2 2" />
        </g>
        <text x="445" y="130" fill="#071A33" fontSize="10" fontFamily="monospace" fontWeight="bold">
          03. CONNECT
        </text>
        <text x="430" y="142" fill="#64748B" fontSize="8" fontFamily="monospace">
          // SWITCH & RAILS INTEGRATION
        </text>

        {/* Milestone Node 4: GROW */}
        <g stroke="#071A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="660" cy="74" r="7" fill="#FFFFFF" stroke="#155EEF" strokeWidth="2" />
          <line x1="660" y1="82" x2="660" y2="115" stroke="#94A3B8" strokeDasharray="2 2" />
        </g>
        <text x="638" y="130" fill="#071A33" fontSize="10" fontFamily="monospace" fontWeight="bold">
          04. GROW
        </text>
        <text x="618" y="142" fill="#64748B" fontSize="8" fontFamily="monospace">
          // MULTI-TENANT SCALING
        </text>

        {/* Milestone Node 5: WHAT'S NEXT */}
        <g stroke="#155EEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="850,75 860,80 850,85" fill="#155EEF" />
        </g>
        <text x="795" y="130" fill="#155EEF" fontSize="10" fontFamily="monospace" fontWeight="bold">
          05. WHAT'S NEXT
        </text>
        <text x="800" y="142" fill="#64748B" fontSize="8" fontFamily="monospace">
          // FORWARD HORIZON
        </text>
      </svg>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>NOTEBOOK REF: TRAJ-02</span>
        <span className="text-[#155EEF] font-bold">CONTINUOUS HAND-DRAWN EVOLUTION</span>
      </div>
    </div>
  );
};
