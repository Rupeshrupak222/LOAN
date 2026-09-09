'use client';

import React from 'react';

export const SketchPeople: React.FC<{ className?: string }> = ({ className = '' }) => {
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
          SKETCH 04 // THE HUMAN FACTOR
        </span>
        <span>FIG. 4.0 — MINDS BEHIND THE RAILS</span>
      </div>

      <svg
        viewBox="0 0 800 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto py-2"
      >
        {/* Baseline ground line */}
        <line x1="50" y1="180" x2="750" y2="180" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="5 5" />

        {/* ── Scene A: The Systems Thinker (Left) ── */}
        <g stroke="#071A33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Head & Hand on Chin in Thought */}
          <circle cx="160" cy="80" r="14" />
          <path d="M160 94 L160 145" />
          <path d="M160 105 L145 125 L155 90" stroke="#155EEF" strokeWidth="1.8" />
          <path d="M160 108 L178 135" />
          <path d="M160 145 L145 180" />
          <path d="M160 145 L175 180" />
          {/* Conceptual Thought Spark Rays */}
          <path d="M140 60 L132 52" stroke="#155EEF" strokeWidth="1.5" />
          <path d="M160 55 L160 45" stroke="#155EEF" strokeWidth="1.5" />
          <path d="M180 60 L188 52" stroke="#155EEF" strokeWidth="1.5" />
        </g>
        <text x="120" y="200" fill="#071A33" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [DEEP SYSTEMS THINKING]
        </text>

        {/* ── Scene B: The Collaborative Blueprint Session (Center) ── */}
        <g stroke="#071A33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Standing Engineer Left */}
          <circle cx="360" cy="75" r="13" />
          <path d="M360 88 L360 140" />
          <path d="M360 102 L395 110" stroke="#155EEF" strokeWidth="1.8" />
          <path d="M360 140 L348 180" />
          <path d="M360 140 L370 180" />

          {/* Collaborative Drafting Canvas / Board in middle */}
          <rect x="390" y="70" width="70" height="90" rx="3" fill="#F8FAFC" stroke="#071A33" />
          {/* Technical diagram sketched on board */}
          <circle cx="425" cy="100" r="12" stroke="#155EEF" strokeDasharray="2 2" />
          <line x1="405" y1="125" x2="445" y2="125" stroke="#94A3B8" />
          <line x1="405" y1="135" x2="435" y2="135" stroke="#94A3B8" />
          {/* Easel Stand */}
          <line x1="400" y1="160" x2="390" y2="180" stroke="#64748B" />
          <line x1="450" y1="160" x2="460" y2="180" stroke="#64748B" />

          {/* Standing Engineer Right Pointing */}
          <circle cx="490" cy="75" r="13" />
          <path d="M490 88 L490 140" />
          <path d="M490 102 L455 105" stroke="#155EEF" strokeWidth="1.8" />
          <path d="M490 140 L480 180" />
          <path d="M490 140 L502 180" />
        </g>
        <text x="365" y="200" fill="#071A33" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [CROSS-DISCIPLINE ALIGNMENT]
        </text>

        {/* ── Scene C: The Precision Craftsperson (Right) ── */}
        <g stroke="#071A33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          {/* Seated Figure at Technical Terminal */}
          <circle cx="670" cy="95" r="12" />
          <path d="M670 107 L670 145" />
          <path d="M670 118 L640 130" />
          <path d="M670 145 L650 160 L650 180" />
          {/* Stool */}
          <line x1="660" y1="150" x2="680" y2="150" stroke="#94A3B8" />
          <line x1="670" y1="150" x2="670" y2="180" stroke="#94A3B8" />
          {/* Terminal / Rig */}
          <rect x="620" y="115" width="28" height="20" rx="2" fill="#F8FAFC" stroke="#155EEF" />
          <line x1="615" y1="135" x2="640" y2="135" stroke="#071A33" />
          <line x1="627" y1="135" x2="627" y2="180" stroke="#071A33" />
        </g>
        <text x="615" y="200" fill="#071A33" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [CONTINUOUS CODE & AUDIT]
        </text>
      </svg>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>NOTEBOOK REF: TEAM-04</span>
        <span className="text-[#155EEF] font-bold">CONCEPTUAL BUILDER SILHOUETTES · ZERO FICTIONAL PROFILES</span>
      </div>
    </div>
  );
};
