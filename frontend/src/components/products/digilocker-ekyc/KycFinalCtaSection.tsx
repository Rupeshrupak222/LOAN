'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldCheck,
  FileText,
  Clock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface KycFinalCtaSectionProps {
  onStartKyc?: () => void;
}

export const KycFinalCtaSection: React.FC<KycFinalCtaSectionProps> = ({ onStartKyc }) => {
  const handleStart = () => {
    if (onStartKyc) {
      onStartKyc();
    } else {
      const el = document.getElementById('kyc-dashboard-visual');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const badges = [
    {
      icon: Clock,
      title: 'Under 45s',
      subtitle: 'Verification',
    },
    {
      icon: ShieldCheck,
      title: 'UIDAI & NSDL',
      subtitle: 'Certified',
    },
    {
      icon: FileText,
      title: '100%',
      subtitle: 'Paperless',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 relative overflow-hidden text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* ═════════════════════════════════════════════════════════════════
              LEFT COLUMN: 3D SHIELD ON PODIUM WITH BLUE ORGANIC WAVE
             ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 relative flex items-center justify-center min-h-[380px] sm:min-h-[460px]">
            {/* Organic Blue Curved Backdrop Wave */}
            <div
              className="absolute -left-12 sm:-left-20 bottom-0 top-12 w-[340px] sm:w-[460px] rounded-tr-[180px] sm:rounded-tr-[240px] rounded-br-[60px] bg-gradient-to-tr from-[#155EEF] via-[#2563EB] to-[#3B82F6] shadow-2xl pointer-events-none -z-10"
              style={{
                clipPath: 'polygon(0% 0%, 100% 20%, 95% 100%, 0% 100%)',
              }}
            />

            {/* Floor Circular Perspective Grid on the Blue Surface */}
            <div className="absolute bottom-4 left-4 sm:left-12 w-64 sm:w-80 h-32 opacity-30 pointer-events-none -z-10">
              <svg viewBox="0 0 300 120" className="w-full h-full stroke-white fill-none" strokeWidth="1">
                <ellipse cx="150" cy="60" rx="130" ry="45" strokeDasharray="3 3" />
                <ellipse cx="150" cy="60" rx="90" ry="30" />
                <ellipse cx="150" cy="60" rx="50" ry="16" />
                <line x1="20" y1="60" x2="280" y2="60" />
                <line x1="150" y1="15" x2="150" y2="105" />
              </svg>
            </div>

            {/* Concentric Subtle Circular Ripples Behind Shield */}
            <div className="absolute top-2 left-1/4 -translate-x-1/2 w-72 h-72 rounded-full opacity-25 pointer-events-none -z-10">
              <svg viewBox="0 0 300 300" className="w-full h-full stroke-blue-300 fill-none" strokeWidth="1">
                <circle cx="150" cy="150" r="140" strokeDasharray="4 4" />
                <circle cx="150" cy="150" r="105" />
                <circle cx="150" cy="150" r="70" strokeDasharray="2 2" />
              </svg>
            </div>

            {/* 3D SVG Composition: Podium + Shield with Circuit Line */}
            <div className="relative w-full max-w-[420px] h-[360px] sm:h-[420px] flex items-center justify-center">
              <svg
                viewBox="0 0 420 400"
                className="w-full h-full drop-shadow-2xl overflow-visible"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Podium Gradients */}
                  <linearGradient id="podiumTopG" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#F1F5F9" />
                  </linearGradient>

                  <linearGradient id="podiumSideG" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E2E8F0" />
                    <stop offset="100%" stopColor="#CBD5E1" />
                  </linearGradient>

                  {/* Shield 3D Gradients */}
                  <linearGradient id="shieldFaceG" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="70%" stopColor="#F8FAFC" />
                    <stop offset="100%" stopColor="#EFF6FF" />
                  </linearGradient>

                  <linearGradient id="shieldExtrusionG" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#CBD5E1" />
                    <stop offset="100%" stopColor="#94A3B8" />
                  </linearGradient>

                  <linearGradient id="circuitBlueG" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="50%" stopColor="#155EEF" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>

                  {/* Soft Drop Shadows */}
                  <filter id="podiumShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="25" stdDeviation="20" floodColor="#071A33" floodOpacity="0.25" />
                  </filter>

                  <filter id="shieldShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="-10" dy="18" stdDeviation="15" floodColor="#0F172A" floodOpacity="0.18" />
                  </filter>
                </defs>

                {/* ── 1. 3D Rounded Podium Pedestal ── */}
                <g transform="translate(190, 310)" filter="url(#podiumShadow)">
                  {/* Front Side Depth of Podium */}
                  <path
                    d="M -130 -10 
                       Q -130 55 -90 65 
                       L 90 65 
                       Q 130 55 130 -10 
                       L 130 -40 
                       L -130 -40 Z"
                    fill="url(#podiumSideG)"
                  />
                  {/* Top Surface of Rounded Podium */}
                  <ellipse
                    cx="0"
                    cy="-40"
                    rx="130"
                    ry="45"
                    fill="url(#podiumTopG)"
                    stroke="#E2E8F0"
                    strokeWidth="1.5"
                  />
                </g>

                {/* ── 2. Standing 3D White Shield with Thickness ── */}
                <g transform="translate(190, 160)" filter="url(#shieldShadow)">
                  {/* Shield 3D Extrusion / Thickness (Left side depth) */}
                  <path
                    d="M -88 -90 
                       L -102 -80 
                       L -102 20 
                       L -20 115 
                       L 0 102 
                       L -88 15 Z"
                    fill="url(#shieldExtrusionG)"
                    opacity="0.85"
                  />

                  {/* Shield Main 3D Front Face */}
                  <path
                    d="M 0 -115 
                       C 65 -115, 88 -95, 88 -50 
                       C 88 45, 45 95, 0 120 
                       C -45 95, -88 45, -88 -50 
                       C -88 -95, -65 -115, 0 -115 Z"
                    fill="url(#shieldFaceG)"
                    stroke="#E2E8F0"
                    strokeWidth="2.5"
                  />

                  {/* Inner Bevel Border Rim */}
                  <path
                    d="M 0 -102 
                       C 54 -102, 74 -85, 74 -44 
                       C 74 38, 38 82, 0 105 
                       C -38 82, -74 38, -74 -44 
                       C -74 -85, -54 -102, 0 -102 Z"
                    fill="none"
                    stroke="#DBEAFE"
                    strokeWidth="2"
                    opacity="0.7"
                  />

                  {/* ── 3. Stylized Blue Digital Circuit ("S" Shape Path) on Shield ── */}
                  <g transform="translate(0, -6)">
                    {/* Top Right Vertical Line */}
                    <path
                      d="M 16 -65 L 16 0"
                      stroke="url(#circuitBlueG)"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                    {/* Top Right Terminal Circle Node */}
                    <circle cx="16" cy="-65" r="5.5" fill="#1D4ED8" stroke="#DBEAFE" strokeWidth="2" />
                    <circle cx="16" cy="0" r="5.5" fill="#1D4ED8" stroke="#DBEAFE" strokeWidth="2" />

                    {/* Connecting Diagonal Bridge */}
                    <path
                      d="M 16 0 L -16 22"
                      stroke="url(#circuitBlueG)"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />

                    {/* Bottom Left Vertical Line */}
                    <path
                      d="M -16 22 L -16 65"
                      stroke="url(#circuitBlueG)"
                      strokeWidth="7"
                      strokeLinecap="round"
                    />
                    {/* Bottom Left Terminal Circle Node */}
                    <circle cx="-16" cy="22" r="5.5" fill="#1D4ED8" stroke="#DBEAFE" strokeWidth="2" />
                    <circle cx="-16" cy="65" r="5.5" fill="#1D4ED8" stroke="#DBEAFE" strokeWidth="2" />
                  </g>
                </g>
              </svg>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              RIGHT COLUMN: HEADLINE, DESCRIPTION, 2 BUTTONS & 3 TRUST BADGES
             ═════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 space-y-6">
            {/* Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black text-[#071A33] tracking-tight leading-[1.14]">
              Complete KYC.<br />
              Continue the <span className="text-[#155EEF]">Loan Journey.</span>
            </h2>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl font-normal">
              Verify customer identity digitally and move forward with a faster loan onboarding experience. Zero physical visits, zero paper documents.
            </p>

            {/* Two Action Buttons Side-by-Side */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              {/* Primary Blue Button */}
              <button
                onClick={handleStart}
                className="px-6 sm:px-7 py-3.5 rounded-2xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-sm shadow-lg shadow-[#155EEF]/25 hover:shadow-xl hover:shadow-[#155EEF]/35 transition-all flex items-center gap-2.5 cursor-pointer active:scale-95"
              >
                <Shield className="w-4 h-4 fill-white/20 stroke-white" />
                <span>Start DigiLocker e-KYC →</span>
              </button>

              {/* Secondary White Button */}
              <Link
                href="/applications/new"
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-sm transition-all flex items-center gap-2 shadow-xs hover:border-slate-300"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Explore Loan Origination →</span>
              </Link>
            </div>

            {/* 3 Horizontal Stat / Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-slate-100">
              {badges.map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex items-center gap-3 shadow-2xs hover:bg-white hover:border-slate-300 transition-all"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0 border border-blue-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-sm font-black text-[#071A33] font-mono">
                        {badge.title}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {badge.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
