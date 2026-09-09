'use client';

import React, { useState, useEffect } from 'react';

interface CreditCore3DProps {
  availableAmount?: number;
  totalLimit?: number;
  usedAmount?: number;
  isAuthorizing?: boolean;
  isRepaying?: boolean;
  size?: number; // Base diameter in px
  showControlsHint?: boolean;
  interactiveTilt?: boolean;
}

export const CreditCore3D: React.FC<CreditCore3DProps> = ({
  availableAmount = 50000,
  totalLimit = 50000,
  usedAmount = 0,
  isAuthorizing = false,
  isRepaying = false,
  size = 460,
  showControlsHint = false,
  interactiveTilt = true,
}) => {
  const [tilt, setTilt] = useState({ rx: 8, ry: -6 });
  const [rotationDegree, setRotationDegree] = useState(0);

  // Slow continuous rotation of the outer financial calibration ring
  useEffect(() => {
    let animId: number;
    const rotate = () => {
      setRotationDegree((prev) => (prev + 0.15) % 360);
      animId = requestAnimationFrame(rotate);
    };
    animId = requestAnimationFrame(rotate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactiveTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: 8 - y * 18,
      ry: -6 + x * 22,
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 8, ry: -6 });
  };

  // Radial calculation for the credit gauge ring
  const percentageAvailable = Math.max(0, Math.min(100, (availableAmount / totalLimit) * 100));
  const radius = 170;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentageAvailable / 100) * circumference;

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative flex items-center justify-center select-none"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        perspective: '1400px',
      }}
    >
      {/* ── 3D Multi-Layered Spatial Container ── */}
      <div
        className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Layer -2: Deep Ambient Keylight & Diffuse Floor Glow */}
        <div
          className={`absolute w-72 h-72 rounded-full blur-[90px] transition-all duration-700 pointer-events-none ${
            isAuthorizing
              ? 'bg-amber-400/25 scale-125'
              : isRepaying
              ? 'bg-emerald-400/25 scale-125'
              : 'bg-blue-500/15 scale-100'
          }`}
          style={{ transform: 'translateZ(-60px)' }}
        />

        {/* Layer -1: Precision Outer Calibration Rulers (Slow Rotating) */}
        <div
          className="absolute inset-2 rounded-full border border-slate-200/80 pointer-events-none"
          style={{
            transform: `translateZ(-20px) rotate(${rotationDegree}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Degree and Metric Ticks */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <div
              key={deg}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-300 origin-bottom"
              style={{
                transform: `rotate(${deg}deg) translateY(0px)`,
                transformOrigin: '50% 220px',
              }}
            />
          ))}
          {/* Fine Tick Marks */}
          {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg) => (
            <div
              key={deg}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-1.5 bg-slate-200 origin-bottom"
              style={{
                transform: `rotate(${deg}deg) translateY(0px)`,
                transformOrigin: '50% 220px',
              }}
            />
          ))}
        </div>

        {/* Layer 0: Glass Substrate & SVG Credit Ring Path */}
        <div
          className="absolute inset-4 rounded-full bg-gradient-to-b from-white/90 via-slate-50/70 to-blue-50/50 backdrop-blur-xl border border-white shadow-[0_20px_50px_rgba(7,26,51,0.08)] flex items-center justify-center pointer-events-none"
          style={{ transform: 'translateZ(0px)' }}
        >
          <svg className="w-full h-full -rotate-90" viewBox="0 0 400 400">
            {/* Background Rail Track */}
            <circle
              cx="200"
              cy="200"
              r={radius}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth="14"
              strokeDasharray="4 6"
            />

            {/* Utilized Capacity (Red/Amber Segment if used) */}
            {usedAmount > 0 && (
              <circle
                cx="200"
                cy="200"
                r={radius}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={0}
                opacity={0.3}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
              />
            )}

            {/* Active Available Credit Arc (Electric Blue Segment) */}
            <circle
              cx="200"
              cy="200"
              r={radius}
              fill="none"
              stroke="url(#creditGrad)"
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />

            {/* Gradient Definition */}
            <defs>
              <linearGradient id="creditGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00D2FF" />
                <stop offset="60%" stopColor="#155EEF" />
                <stop offset="100%" stopColor="#071A33" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Layer 1: Concentric Secondary Glass Inner Dial */}
        <div
          className="absolute w-[270px] h-[270px] rounded-full bg-white/95 border border-slate-200/90 shadow-inner flex flex-col items-center justify-center p-6 text-center"
          style={{
            transform: 'translateZ(35px)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Inner Decorative Precision Radial Lines */}
          <div className="absolute inset-2 rounded-full border border-dashed border-slate-200 pointer-events-none opacity-60" />

          {/* Status Eyebrow Badge */}
          <div
            className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase mb-2 border transition-all duration-300 ${
              isAuthorizing
                ? 'bg-amber-50 border-amber-300 text-amber-600 animate-pulse'
                : isRepaying
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600 animate-pulse'
                : 'bg-blue-50 border-blue-200 text-[#155EEF]'
            }`}
            style={{ transform: 'translateZ(10px)' }}
          >
            {isAuthorizing
              ? '⚡ DRAWING...'
              : isRepaying
              ? '✓ RESTORING...'
              : 'AVAILABLE CREDIT'}
          </div>

          {/* Core Balance Figure */}
          <div
            className="text-3xl sm:text-4xl font-black text-[#071A33] tracking-tight leading-none"
            style={{
              fontFamily: 'var(--font-unbounded), sans-serif',
              transform: 'translateZ(20px)',
            }}
          >
            ₹{availableAmount.toLocaleString('en-IN')}
          </div>

          {/* Limit / Used Fraction Readout */}
          <div
            className="mt-3 flex items-center gap-3 text-[10px] font-mono text-slate-500"
            style={{ transform: 'translateZ(12px)' }}
          >
            <span>LIMIT: ₹{totalLimit.toLocaleString('en-IN')}</span>
            <span className="text-slate-300">•</span>
            <span className={usedAmount > 0 ? 'text-amber-600 font-bold' : ''}>
              USED: ₹{usedAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Radial Percentage Visual Meter */}
          <div
            className="mt-2 w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200"
            style={{ transform: 'translateZ(8px)' }}
          >
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-[#155EEF] transition-all duration-700"
              style={{ width: `${percentageAvailable}%` }}
            />
          </div>

          {/* Financial Rail Status Chip */}
          <div
            className="mt-2 text-[9px] font-mono text-slate-400 tracking-wider uppercase"
            style={{ transform: 'translateZ(6px)' }}
          >
            UPI RAIL: LIVE & REVOLVING
          </div>
        </div>

        {/* Layer 2: Floating Transaction Particles / Orbital Nodes */}
        <div
          className="absolute inset-0 pointer-events-none flex items-center justify-center"
          style={{ transform: 'translateZ(55px)' }}
        >
          {/* Orbital Indicator Node */}
          <div
            className="absolute w-3 h-3 rounded-full bg-[#00D2FF] border-2 border-white shadow-[0_0_12px_#00D2FF] transition-all duration-700"
            style={{
              transform: `rotate(${(percentageAvailable / 100) * 360 - 90}deg) translateX(${radius}px)`,
            }}
          />
        </div>

        {/* Demonstration Indicator Watermark */}
        <div
          className="absolute -bottom-8 px-3 py-1 rounded-full bg-white/90 border border-slate-200 shadow-xs text-[9px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5"
          style={{ transform: 'translateZ(25px)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#155EEF] animate-ping" />
          <span>INTERACTIVE FINTECH DEMO</span>
        </div>
      </div>
    </div>
  );
};
