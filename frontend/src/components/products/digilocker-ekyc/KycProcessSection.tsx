'use client';

import React from 'react';
import {
  Smartphone,
  FileCheck2,
  ScanFace,
  BadgeCheck,
  Shield,
  Lock,
  Check,
  Zap,
} from 'lucide-react';

export const KycProcessSection: React.FC = () => {
  return (
    <section className="w-full py-12 sm:py-16 text-slate-800 space-y-12">
      {/* ── Section Header (Exact Screenshot Match) ── */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        {/* Pill Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 text-[11px] font-bold text-[#155EEF] font-mono shadow-2xs">
          <Shield className="w-3.5 h-3.5" />
          <span>VERIFICATION LIFECYCLE</span>
        </div>

        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black tracking-tight text-[#071A33] leading-tight">
          How DigiLocker e-KYC Works
        </h2>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
          A seamless, cryptographic pipeline that replaces cumbersome physical branch visits with instantaneous government API verification.
        </p>
      </div>

      {/* ── Orbital Process Diagram & Surrounding 4 Steps Architecture ── */}
      <div className="max-w-7xl mx-auto">
        {/* Desktop Layout: 3 Columns (Left 2 Steps | Center Orbital Circle | Right 2 Steps) */}
        <div className="hidden lg:grid grid-cols-12 gap-8 items-center">
          {/* ═════════════════════════════════════════════════════════════════
              LEFT COLUMN (Step 01 & Step 04)
             ═════════════════════════════════════════════════════════════════ */}
          <div className="col-span-4 flex flex-col justify-between h-[460px] text-left">
            {/* Step 01 */}
            <div className="space-y-2.5 max-w-[340px]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full border border-blue-200 text-[#155EEF] font-mono text-xs font-bold flex items-center justify-center bg-white shadow-2xs">
                  01
                </span>
                <span className="text-[10px] font-bold font-mono text-[#155EEF] uppercase tracking-wider">
                  EXPLICIT BORROWER OTP CONSENT
                </span>
              </div>

              <h3 className="text-lg font-black text-[#071A33] tracking-tight">
                Connect DigiLocker
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                Borrower provides direct digital consent via a secure OTP session connecting directly to the MeitY DigiLocker repository.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 text-[#155EEF] text-[11px] font-semibold border border-blue-200/70">
                  <Lock className="w-3 h-3 text-[#155EEF]" />
                  <span>Consent Gateway</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  MeitY / UIDAI API
                </span>
              </div>
            </div>

            {/* Step 04 */}
            <div className="space-y-2.5 max-w-[340px]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full border border-blue-200 text-[#155EEF] font-mono text-xs font-bold flex items-center justify-center bg-white shadow-2xs">
                  04
                </span>
                <span className="text-[10px] font-bold font-mono text-[#155EEF] uppercase tracking-wider">
                  CERTIFIED COMPLIANCE PROFILE
                </span>
              </div>

              <h3 className="text-lg font-black text-[#071A33] tracking-tight">
                Complete KYC
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                A tamper-proof KYC profile is generated, digitally certified, and stored in an immutable compliance audit trail for loan origination.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 text-[#155EEF] text-[11px] font-semibold border border-blue-200/70">
                  <Check className="w-3 h-3 text-[#155EEF] stroke-[2.5]" />
                  <span>Vault Core</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Instant Sanction Ready
                </span>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              CENTER COLUMN: CIRCULAR ORBITAL DIAGRAM
             ═════════════════════════════════════════════════════════════════ */}
          <div className="col-span-4 flex items-center justify-center">
            <div className="relative w-[380px] h-[380px] flex items-center justify-center">
              {/* Concentric Center Well Rings */}
              <div className="absolute w-44 h-44 rounded-full border border-blue-100 bg-blue-50/40 pointer-events-none" />
              <div className="absolute w-32 h-32 rounded-full border border-blue-200/60 bg-blue-50/70 pointer-events-none" />

              {/* Central Blue Shield with Checkmark */}
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#155EEF] shadow-xl shadow-blue-500/25 flex items-center justify-center text-white">
                <Shield className="w-8 h-8 fill-white/15 stroke-white" />
                <Check className="w-4 h-4 stroke-[3] text-white absolute" />
              </div>

              {/* SVG Dashed Orbital Ring with Clockwise Directional Arrows & Blue Dots */}
              <svg viewBox="0 0 380 380" className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Dashed Orbit Circle */}
                <circle
                  cx="190"
                  cy="190"
                  r="135"
                  stroke="#3B82F6"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  fill="none"
                  opacity="0.85"
                />

                {/* Clockwise Directional Arrows */}
                {/* Top Arrow (pointing right) */}
                <path d="M 186 52 L 194 55 L 186 58" stroke="#155EEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* Right Arrow (pointing down) */}
                <path d="M 328 186 L 325 194 L 322 186" stroke="#155EEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* Bottom Arrow (pointing left) */}
                <path d="M 194 328 L 186 325 L 194 322" stroke="#155EEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* Left Arrow (pointing up) */}
                <path d="M 52 194 L 55 186 L 58 194" stroke="#155EEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />

                {/* Orbit Connector Blue Dots */}
                <circle cx="120" cy="75" r="4.5" fill="#155EEF" />
                <circle cx="260" cy="75" r="4.5" fill="#155EEF" />
                <circle cx="260" cy="305" r="4.5" fill="#155EEF" />
                <circle cx="120" cy="305" r="4.5" fill="#155EEF" />
              </svg>

              {/* ── 4 Circular Orbital Node Badges ── */}

              {/* Node 1: Top-Left (Smartphone) */}
              <div className="absolute top-4 left-4 z-20">
                <div className="w-22 h-22 rounded-full bg-white border border-slate-100 shadow-xl shadow-slate-200/80 flex items-center justify-center text-[#155EEF] hover:scale-105 transition-transform">
                  <Smartphone className="w-8 h-8 text-[#155EEF]" />
                </div>
              </div>

              {/* Node 2: Top-Right (Fetch Documents) */}
              <div className="absolute top-4 right-4 z-20">
                <div className="w-22 h-22 rounded-full bg-white border border-slate-100 shadow-xl shadow-slate-200/80 flex items-center justify-center text-[#155EEF] hover:scale-105 transition-transform">
                  <FileCheck2 className="w-8 h-8 text-[#155EEF]" />
                </div>
              </div>

              {/* Node 3: Bottom-Right (Verify Identity) */}
              <div className="absolute bottom-4 right-4 z-20">
                <div className="w-22 h-22 rounded-full bg-white border border-slate-100 shadow-xl shadow-slate-200/80 flex items-center justify-center text-[#155EEF] hover:scale-105 transition-transform">
                  <ScanFace className="w-8 h-8 text-[#155EEF]" />
                </div>
              </div>

              {/* Node 4: Bottom-Left (Complete KYC) */}
              <div className="absolute bottom-4 left-4 z-20">
                <div className="w-22 h-22 rounded-full bg-white border border-slate-100 shadow-xl shadow-slate-200/80 flex items-center justify-center text-[#155EEF] hover:scale-105 transition-transform">
                  <BadgeCheck className="w-8 h-8 text-[#155EEF]" />
                </div>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              RIGHT COLUMN (Step 02 & Step 03)
             ═════════════════════════════════════════════════════════════════ */}
          <div className="col-span-4 flex flex-col justify-between h-[460px] text-left">
            {/* Step 02 */}
            <div className="space-y-2.5 max-w-[340px]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full border border-blue-200 text-[#155EEF] font-mono text-xs font-bold flex items-center justify-center bg-white shadow-2xs">
                  02
                </span>
                <span className="text-[10px] font-bold font-mono text-[#155EEF] uppercase tracking-wider">
                  CRYPTOGRAPHIC XML EXTRACTION
                </span>
              </div>

              <h3 className="text-lg font-black text-[#071A33] tracking-tight">
                Fetch Documents
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                Aadhaar, PAN, and driving licenses are fetched as authentic, PKI-signed digital XML documents directly from central authorities.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 text-[#155EEF] text-[11px] font-semibold border border-blue-200/70">
                  <FileCheck2 className="w-3 h-3 text-[#155EEF]" />
                  <span>DigiLocker Switch</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  UIDAI & NSDL Repo
                </span>
              </div>
            </div>

            {/* Step 03 */}
            <div className="space-y-2.5 max-w-[340px]">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full border border-blue-200 text-[#155EEF] font-mono text-xs font-bold flex items-center justify-center bg-white shadow-2xs">
                  03
                </span>
                <span className="text-[10px] font-bold font-mono text-[#155EEF] uppercase tracking-wider">
                  AI 3D LIVENESS & PENNY-DROP
                </span>
              </div>

              <h3 className="text-lg font-black text-[#071A33] tracking-tight">
                Verify Identity
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                Sub-second 3D depth camera matches borrower face against Aadhaar photo, while automated penny drop validates bank account ownership.
              </p>

              <div className="flex items-center gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/90 text-[#155EEF] text-[11px] font-semibold border border-blue-200/70">
                  <ScanFace className="w-3 h-3 text-[#155EEF]" />
                  <span>Vision AI & AA</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  99.7% Match Accuracy
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile / Tablet Responsive Fallback (Stacked Cards) ── */}
        <div className="lg:hidden space-y-6 pt-4 text-left">
          {/* Central Mini Orbital Badge */}
          <div className="flex items-center justify-center py-4">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#155EEF] flex items-center justify-center bg-blue-50/60 shadow-md">
              <Shield className="w-8 h-8 text-[#155EEF]" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-blue-200 text-[#155EEF] font-mono text-xs font-bold flex items-center justify-center">01</span>
                <span className="text-[10px] font-bold font-mono text-[#155EEF] uppercase">EXPLICIT BORROWER OTP CONSENT</span>
              </div>
              <h4 className="text-base font-bold text-[#071A33]">Connect DigiLocker</h4>
              <p className="text-xs text-slate-600">Borrower provides direct digital consent via a secure OTP session connecting directly to the MeitY DigiLocker repository.</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-500">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#155EEF] font-semibold">Consent Gateway</span>
                <span>MeitY / UIDAI API</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-blue-200 text-[#155EEF] font-mono text-xs font-bold flex items-center justify-center">02</span>
                <span className="text-[10px] font-bold font-mono text-[#155EEF] uppercase">CRYPTOGRAPHIC XML EXTRACTION</span>
              </div>
              <h4 className="text-base font-bold text-[#071A33]">Fetch Documents</h4>
              <p className="text-xs text-slate-600">Aadhaar, PAN, and driving licenses are fetched as authentic, PKI-signed digital XML documents directly from central authorities.</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-500">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#155EEF] font-semibold">DigiLocker Switch</span>
                <span>UIDAI & NSDL Repo</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-blue-200 text-[#155EEF] font-mono text-xs font-bold flex items-center justify-center">03</span>
                <span className="text-[10px] font-bold font-mono text-[#155EEF] uppercase">AI 3D LIVENESS & PENNY-DROP</span>
              </div>
              <h4 className="text-base font-bold text-[#071A33]">Verify Identity</h4>
              <p className="text-xs text-slate-600">Sub-second 3D depth camera matches borrower face against Aadhaar photo, while automated penny drop validates bank account ownership.</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-500">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#155EEF] font-semibold">Vision AI & AA</span>
                <span>99.7% Match Accuracy</span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full border border-blue-200 text-[#155EEF] font-mono text-xs font-bold flex items-center justify-center">04</span>
                <span className="text-[10px] font-bold font-mono text-[#155EEF] uppercase">CERTIFIED COMPLIANCE PROFILE</span>
              </div>
              <h4 className="text-base font-bold text-[#071A33]">Complete KYC</h4>
              <p className="text-xs text-slate-600">A tamper-proof KYC profile is generated, digitally certified, and stored in an immutable compliance audit trail for loan origination.</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-500">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#155EEF] font-semibold">Vault Core</span>
                <span>Instant Sanction Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
