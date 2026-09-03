'use client';

import React from 'react';

export const SketchEcosystem: React.FC<{ className?: string }> = ({ className = '' }) => {
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
          SKETCH 03 // ARCHITECTURAL ECOSYSTEM
        </span>
        <span>FIG. 3.0 — 4-PILLAR CONVERGENCE</span>
      </div>

      <svg
        viewBox="0 0 800 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto py-2"
      >
        {/* Center Blueprint Concentric Calibration Rings */}
        <circle cx="400" cy="120" r="70" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="400" cy="120" r="45" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />

        {/* Central Hub: Adyapan Core Engine */}
        <g stroke="#071A33" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="400" cy="120" r="28" fill="#FFFFFF" stroke="#155EEF" strokeWidth="2.2" />
          <path d="M390 120 L410 120" stroke="#071A33" />
          <path d="M400 110 L400 130" stroke="#071A33" />
        </g>
        <text x="355" y="165" fill="#155EEF" fontSize="9" fontFamily="monospace" fontWeight="bold">
          [ADYAPAN CORE]
        </text>

        {/* ── Node A: Banking & Core (Top Left) ── */}
        <g stroke="#071A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="100" y="35" width="130" height="65" rx="6" fill="#F8FAFC" />
          {/* Classical Bank Pediment Architectural Sketch */}
          <path d="M120 50 L145 38 L170 50 Z" />
          <line x1="125" y1="52" x2="125" y2="70" />
          <line x1="145" y1="52" x2="145" y2="70" />
          <line x1="165" y1="52" x2="165" y2="70" />
          <line x1="118" y1="72" x2="172" y2="72" />
          {/* Connector Line to Center */}
          <path d="M230 68 C 300 68, 320 100, 372 115" stroke="#155EEF" strokeWidth="1.5" strokeDasharray="3 3" />
        </g>
        <text x="108" y="90" fill="#071A33" fontSize="9" fontFamily="monospace" fontWeight="bold">
          01. BANKING CORE
        </text>

        {/* ── Node B: Lending Solutions (Top Right) ── */}
        <g stroke="#071A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="570" y="35" width="130" height="65" rx="6" fill="#F8FAFC" />
          {/* Hand-drawn Loan Document with Seal */}
          <rect x="590" y="42" width="22" height="30" rx="1" fill="#FFFFFF" />
          <line x1="594" y1="48" x2="608" y2="48" stroke="#94A3B8" />
          <line x1="594" y1="54" x2="608" y2="54" stroke="#94A3B8" />
          <circle cx="605" cy="64" r="3" fill="#155EEF" stroke="none" />
          {/* Connector Line to Center */}
          <path d="M570 68 C 500 68, 480 100, 428 115" stroke="#155EEF" strokeWidth="1.5" strokeDasharray="3 3" />
        </g>
        <text x="578" y="90" fill="#071A33" fontSize="9" fontFamily="monospace" fontWeight="bold">
          02. LENDING RAILS
        </text>

        {/* ── Node C: Payments & Switches (Bottom Left) ── */}
        <g stroke="#071A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="100" y="140" width="130" height="65" rx="6" fill="#F8FAFC" />
          {/* Hand-drawn Soundbox + Switch Pulse */}
          <rect x="120" y="148" width="24" height="30" rx="3" fill="#FFFFFF" />
          <circle cx="132" cy="158" r="4" stroke="#155EEF" />
          <path d="M148 152 C152 158, 152 166, 148 172" stroke="#155EEF" strokeWidth="1.4" />
          <path d="M153 148 C158 158, 158 170, 153 176" stroke="#155EEF" strokeWidth="1.4" />
          {/* Connector Line to Center */}
          <path d="M230 172 C 300 172, 320 140, 372 125" stroke="#155EEF" strokeWidth="1.5" strokeDasharray="3 3" />
        </g>
        <text x="108" y="195" fill="#071A33" fontSize="9" fontFamily="monospace" fontWeight="bold">
          03. NPCI PAYMENTS
        </text>

        {/* ── Node D: AI Risk & Compliance (Bottom Right) ── */}
        <g stroke="#071A33" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="570" y="140" width="130" height="65" rx="6" fill="#F8FAFC" />
          {/* Hand-drawn Shield with Gauge */}
          <path d="M595 148 L608 148 C614 148, 618 158, 608 172 C598 158, 602 148, 595 148 Z" fill="#FFFFFF" />
          <path d="M604 156 L608 162 L616 152" stroke="#10B981" strokeWidth="1.8" />
          {/* Connector Line to Center */}
          <path d="M570 172 C 500 172, 480 140, 428 125" stroke="#155EEF" strokeWidth="1.5" strokeDasharray="3 3" />
        </g>
        <text x="578" y="195" fill="#071A33" fontSize="9" fontFamily="monospace" fontWeight="bold">
          04. RISK & GATING
        </text>
      </svg>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>NOTEBOOK REF: ECOS-03</span>
        <span className="text-[#155EEF] font-bold">FOUR INTEGRATED ARCHITECTURAL PILLARS</span>
      </div>
    </div>
  );
};
