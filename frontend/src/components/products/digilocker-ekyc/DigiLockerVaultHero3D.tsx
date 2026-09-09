'use client';

import React from 'react';

export const DigiLockerVaultHero3D: React.FC = () => {
  return (
    <div className="relative w-full h-[460px] sm:h-[530px] flex items-center justify-center select-none overflow-visible">
      {/* ── Background Circular Ambient Glow (Preserved Adyapan Blue) ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-blue-100/70 blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-48 sm:w-60 h-48 sm:h-60 rounded-full bg-indigo-100/50 blur-2xl pointer-events-none -z-10" />

      {/* ── Floor Isometric Perspective Grid ── */}
      <div className="absolute bottom-4 sm:bottom-8 w-full max-w-[480px] h-32 opacity-40 pointer-events-none overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white_30%,transparent_75%)]">
        <svg viewBox="0 0 400 120" className="w-full h-full stroke-blue-300/70 fill-none" strokeWidth="1">
          <line x1="0" y1="120" x2="200" y2="0" />
          <line x1="50" y1="120" x2="210" y2="0" />
          <line x1="100" y1="120" x2="220" y2="0" />
          <line x1="150" y1="120" x2="230" y2="0" />
          <line x1="200" y1="120" x2="240" y2="0" />
          <line x1="250" y1="120" x2="250" y2="0" />
          <line x1="300" y1="120" x2="260" y2="0" />
          <line x1="350" y1="120" x2="270" y2="0" />
          <line x1="400" y1="120" x2="280" y2="0" />
          {/* Horizontal grid lines */}
          <line x1="20" y1="110" x2="380" y2="110" />
          <line x1="50" y1="85" x2="350" y2="85" />
          <line x1="90" y1="60" x2="310" y2="60" />
          <line x1="130" y1="35" x2="270" y2="35" />
          <line x1="170" y1="15" x2="230" y2="15" />
        </svg>
      </div>

      {/* ── Main 3D Composition Container ── */}
      <div className="relative w-full max-w-[500px] h-full flex items-center justify-center">
        {/* SVG Hero Scene */}
        <svg
          viewBox="0 0 540 520"
          className="w-full h-full max-h-[520px] drop-shadow-2xl overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients for Adyapan Blue Brand */}
            <linearGradient id="phoneBodyG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#155EEF" />
              <stop offset="50%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E3A8A" />
            </linearGradient>

            <linearGradient id="phoneScreenG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#EFF6FF" />
            </linearGradient>

            <linearGradient id="folderFrontG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="40%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>

            <linearGradient id="folderBackG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#172554" />
            </linearGradient>

            <linearGradient id="shieldWhiteG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>

            <linearGradient id="shieldBlueG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>

            <linearGradient id="goldAadhaarG" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Drop Shadows */}
            <filter id="shadowLg" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="#0F172A" floodOpacity="0.18" />
            </filter>

            <filter id="shadowSm" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#155EEF" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* ═════════════════════════════════════════════════════════════════
              1. STANDING 3D SMARTPHONE (Background)
             ═════════════════════════════════════════════════════════════════ */}
          <g transform="translate(365, 50) rotate(8)" filter="url(#shadowLg)">
            {/* Phone Outer Shadow / Rim */}
            <rect
              x="-85"
              y="0"
              width="180"
              height="340"
              rx="34"
              fill="url(#phoneBodyG)"
              stroke="#B9CBFB"
              strokeWidth="2"
            />

            {/* Phone Screen Glass */}
            <rect
              x="-77"
              y="8"
              width="164"
              height="324"
              rx="28"
              fill="url(#phoneScreenG)"
            />

            {/* Top Speaker / Dynamic Island */}
            <rect x="-24" y="16" width="48" height="9" rx="4.5" fill="#0F172A" />

            {/* Phone Screen Content: DigiLocker Cloud Logo */}
            <g transform="translate(5, 75)">
              {/* Cloud Icon (Adyapan Blue) */}
              <path
                d="M -24 6 
                   A 12 12 0 0 1 -7 -4 
                   A 18 18 0 0 1 20 -2 
                   A 14 14 0 0 1 24 16 
                   L -24 16 
                   A 8 8 0 0 1 -24 6 Z"
                fill="url(#folderFrontG)"
              />
              {/* Lock shape inside cloud */}
              <rect x="-4" y="2" width="8" height="8" rx="2" fill="#FFFFFF" />
              <path d="M -2 2 L -2 -1 A 2 2 0 0 1 2 -1 L 2 2" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />

              {/* DigiLocker Brand Text */}
              <text
                x="0"
                y="34"
                textAnchor="middle"
                fill="#071A33"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="800"
                fontSize="13"
                letterSpacing="-0.2"
              >
                DigiLocker
              </text>
              <text
                x="0"
                y="46"
                textAnchor="middle"
                fill="#64748B"
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="500"
                fontSize="7.5"
              >
                Secure · Simple · Trusted
              </text>
            </g>
          </g>

          {/* ═════════════════════════════════════════════════════════════════
              2. 3D FOLDER BACK FLAP (Holds the cards)
             ═════════════════════════════════════════════════════════════════ */}
          <g transform="translate(190, 205)" filter="url(#shadowLg)">
            {/* Back Wall of Folder */}
            <path
              d="M -115 0 
                 L -50 0 
                 L -35 -14 
                 L 115 -14 
                 Q 125 -14 125 -4 
                 L 125 110 
                 Q 125 120 115 120 
                 L -115 120 
                 Q -125 120 -125 110 
                 L -125 10 
                 Q -125 0 -115 0 Z"
              fill="url(#folderBackG)"
            />
          </g>

          {/* ═════════════════════════════════════════════════════════════════
              3. THREE GOVERNMENT IDENTITY CARDS (Emerging from Folder)
             ═════════════════════════════════════════════════════════════════ */}
          {/* Card 1: Aadhaar Card (Left, tilted -6 deg) */}
          <g transform="translate(145, 175) rotate(-6)" filter="url(#shadowSm)">
            {/* Card Body */}
            <rect x="-42" y="-55" width="84" height="110" rx="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
            <rect x="-42" y="-55" width="84" height="110" rx="9" fill="none" stroke="#B9CBFB" strokeWidth="0.5" />

            {/* Aadhaar Sun Emblem */}
            <g transform="translate(0, -32)">
              {/* Sun Ray Flames */}
              <circle cx="0" cy="0" r="8" fill="url(#goldAadhaarG)" opacity="0.9" />
              <circle cx="0" cy="0" r="5" fill="#FFFFFF" />
              <circle cx="0" cy="0" r="3" fill="url(#goldAadhaarG)" />
              {/* Rays */}
              <line x1="0" y1="-11" x2="0" y2="-8" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="0" y1="8" x2="0" y2="11" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="-11" y1="0" x2="-8" y2="0" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="8" y1="0" x2="11" y2="0" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="-7" y1="-7" x2="-5" y2="-5" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="5" y1="5" x2="7" y2="7" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="-7" y1="7" x2="-5" y2="5" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="5" y1="-5" x2="7" y2="-7" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
            </g>

            {/* Label */}
            <text
              x="0"
              y="-12"
              textAnchor="middle"
              fill="#071A33"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="8.5"
            >
              Aadhaar Card
            </text>

            {/* Simulated Photo & Lines */}
            <rect x="-30" y="-3" width="20" height="24" rx="3" fill="#E2E8F0" />
            <rect x="-6" y="-1" width="36" height="4" rx="2" fill="#94A3B8" />
            <rect x="-6" y="7" width="28" height="3" rx="1.5" fill="#CBD5E1" />
            <rect x="-6" y="14" width="32" height="3" rx="1.5" fill="#CBD5E1" />

            {/* Masked Aadhaar UID Number */}
            <text
              x="0"
              y="34"
              textAnchor="middle"
              fill="#155EEF"
              fontFamily="monospace"
              fontWeight="700"
              fontSize="6.5"
            >
              •••• •••• 8921
            </text>
            <rect x="-24" y="40" width="48" height="2" rx="1" fill="#10B981" />
          </g>

          {/* Card 2: PAN Card (Center, straight) */}
          <g transform="translate(225, 160)" filter="url(#shadowSm)">
            {/* Card Body */}
            <rect x="-44" y="-55" width="88" height="110" rx="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />

            {/* National Emblem (Ashoka Pillar top representation) */}
            <g transform="translate(0, -32)">
              <rect x="-7" y="-8" width="14" height="12" rx="2" fill="#155EEF" opacity="0.8" />
              <circle cx="0" cy="7" r="3" fill="#1D4ED8" />
              <line x1="-8" y1="10" x2="8" y2="10" stroke="#1E3A8A" strokeWidth="1" />
            </g>

            {/* Label */}
            <text
              x="0"
              y="-12"
              textAnchor="middle"
              fill="#071A33"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="8.5"
            >
              PAN Card
            </text>

            {/* Microchip */}
            <rect x="-32" y="-2" width="16" height="12" rx="2" fill="#F59E0B" opacity="0.8" />
            <rect x="-10" y="0" width="42" height="4" rx="2" fill="#94A3B8" />
            <rect x="-10" y="8" width="32" height="3" rx="1.5" fill="#CBD5E1" />

            {/* PAN Number */}
            <text
              x="0"
              y="32"
              textAnchor="middle"
              fill="#155EEF"
              fontFamily="monospace"
              fontWeight="700"
              fontSize="7"
            >
              ABCDE1234F
            </text>
            <rect x="-24" y="38" width="48" height="2" rx="1" fill="#10B981" />
          </g>

          {/* Card 3: Driving License (Right, tilted +6 deg) */}
          <g transform="translate(305, 175) rotate(6)" filter="url(#shadowSm)">
            {/* Card Body */}
            <rect x="-42" y="-55" width="84" height="110" rx="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />

            {/* MoRTH Transport Emblem */}
            <g transform="translate(0, -32)">
              <rect x="-8" y="-7" width="16" height="12" rx="3" fill="#10B981" opacity="0.8" />
              <circle cx="0" cy="-1" r="3.5" fill="#FFFFFF" />
            </g>

            {/* Label */}
            <text
              x="0"
              y="-12"
              textAnchor="middle"
              fill="#071A33"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="8.5"
            >
              Driving License
            </text>

            {/* Simulated Data */}
            <rect x="-30" y="-3" width="18" height="22" rx="3" fill="#E2E8F0" />
            <rect x="-6" y="-1" width="36" height="4" rx="2" fill="#94A3B8" />
            <rect x="-6" y="7" width="30" height="3" rx="1.5" fill="#CBD5E1" />

            {/* DL Number */}
            <text
              x="0"
              y="32"
              textAnchor="middle"
              fill="#155EEF"
              fontFamily="monospace"
              fontWeight="700"
              fontSize="6.5"
            >
              DL-••••918
            </text>
            <rect x="-24" y="38" width="48" height="2" rx="1" fill="#10B981" />
          </g>

          {/* ═════════════════════════════════════════════════════════════════
              4. 3D FOLDER FRONT FLAP (In Adyapan Blue with 3D Bevel)
             ═════════════════════════════════════════════════════════════════ */}
          <g transform="translate(225, 275)" filter="url(#shadowLg)">
            {/* Main Folder Front Body */}
            <path
              d="M -135 -30 
                 L -50 -30 
                 L -35 -48 
                 L 130 -48 
                 Q 145 -48 145 -34 
                 L 145 75 
                 Q 145 90 130 90 
                 L -130 90 
                 Q -145 90 -145 75 
                 L -145 -16 
                 Q -145 -30 -135 -30 Z"
              fill="url(#folderFrontG)"
              stroke="#60A5FA"
              strokeWidth="1.5"
            />

            {/* Folder Front Highlights & Curvature */}
            <path
              d="M -140 -22 L -50 -22 L -35 -40 L 125 -40"
              stroke="#93C5FD"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
              fill="none"
            />

            {/* Central 3D White Shield with Lock on Folder */}
            <g transform="translate(0, 18)" filter="url(#shadowSm)">
              {/* White Shield */}
              <path
                d="M 0 -26 
                   C 18 -26, 24 -22, 24 -10 
                   C 24 12, 10 26, 0 32 
                   C -10 26, -24 12, -24 -10 
                   C -24 -22, -18 -26, 0 -26 Z"
                fill="url(#shieldWhiteG)"
                stroke="#E2E8F0"
                strokeWidth="1.5"
              />

              {/* Blue Padlock Icon */}
              <g transform="translate(0, -2)">
                <rect x="-8" y="-2" width="16" height="14" rx="3.5" fill="#155EEF" />
                <path
                  d="M -5 -2 L -5 -7 A 5 5 0 0 1 5 -7 L 5 -2"
                  stroke="#155EEF"
                  strokeWidth="2.8"
                  fill="none"
                  strokeLinecap="round"
                />
                <circle cx="0" cy="4" r="2" fill="#FFFFFF" />
                <line x1="0" y1="5" x2="0" y2="8" stroke="#FFFFFF" strokeWidth="1.5" />
              </g>
            </g>
          </g>

          {/* ═════════════════════════════════════════════════════════════════
              5. FOREGROUND FLOATING 3D SHIELD WITH CHECKMARK (Right Bottom)
             ═════════════════════════════════════════════════════════════════ */}
          <g transform="translate(415, 310)" filter="url(#shadowLg)" className="animate-floating">
            {/* Outer Blue Shield */}
            <path
              d="M 0 -34 
                 C 26 -34, 34 -28, 34 -14 
                 C 34 16, 14 36, 0 44 
                 C -14 36, -34 16, -34 -14 
                 C -34 -28, -26 -34, 0 -34 Z"
              fill="url(#shieldBlueG)"
              stroke="#93C5FD"
              strokeWidth="2"
            />

            {/* Inner White Bevel Rim */}
            <path
              d="M 0 -28 
                 C 20 -28, 26 -24, 26 -12 
                 C 26 12, 10 28, 0 35 
                 C -10 28, -26 12, -26 -12 
                 C -26 -24, -20 -28, 0 -28 Z"
              fill="none"
              stroke="#DBEAFE"
              strokeWidth="1.2"
              opacity="0.8"
            />

            {/* Bold White Checkmark */}
            <path
              d="M -12 -2 L -3 8 L 13 -8"
              stroke="#FFFFFF"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
