'use client';

import React, { useState } from 'react';
import {
  RefreshCw,
  Cpu,
  ShieldCheck,
  Gauge,
  Lock,
  Check,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const PlatformScaleSection: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const pillars = [
    {
      num: '01',
      title: 'End-to-End\nLoan Lifecycle',
      desc: 'From application to disbursal and repayment—complete lending lifecycle in one platform.',
      icon: (isHovered: boolean) => (
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          {/* Circular soft blue/white background */}
          <div
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full transition-all duration-300 flex items-center justify-center ${
              isHovered
                ? 'bg-white shadow-lg text-[#155EEF]'
                : 'bg-blue-50 border border-blue-100 text-[#155EEF]'
            }`}
          >
            <svg viewBox="0 0 60 60" className="w-10 h-10 sm:w-12 sm:h-12" fill="none">
              {/* Rotating arrow ring */}
              <circle
                cx="30"
                cy="30"
                r="22"
                stroke={isHovered ? '#155EEF' : '#3B82F6'}
                strokeWidth="3.5"
                strokeDasharray="95 35"
                strokeLinecap="round"
              />
              {/* Center document lines */}
              <rect x="22" y="21" width="16" height="3" rx="1.5" fill={isHovered ? '#155EEF' : '#1D4ED8'} />
              <rect x="22" y="27" width="12" height="3" rx="1.5" fill={isHovered ? '#155EEF' : '#1D4ED8'} />
              <rect x="22" y="33" width="16" height="3" rx="1.5" fill={isHovered ? '#155EEF' : '#1D4ED8'} />
              {/* Green check circle badge */}
              <circle cx="41" cy="40" r="7.5" fill="#10B981" />
              <path d="M 37 40 L 40 43 L 45 38" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ),
    },
    {
      num: '02',
      title: 'AI-Powered\nRisk Assessment',
      desc: 'Intelligent credit and risk analysis for accurate decision-making and better outcomes.',
      icon: (isHovered: boolean) => (
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          <div
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full transition-all duration-300 flex items-center justify-center ${
              isHovered
                ? 'bg-white shadow-lg text-[#155EEF]'
                : 'bg-blue-50 border border-blue-100 text-[#155EEF]'
            }`}
          >
            <svg viewBox="0 0 60 60" className="w-10 h-10 sm:w-12 sm:h-12" fill="none">
              {/* Outer Neural Nodes */}
              <circle cx="16" cy="18" r="3" fill={isHovered ? '#155EEF' : '#60A5FA'} />
              <circle cx="44" cy="18" r="3" fill={isHovered ? '#155EEF' : '#60A5FA'} />
              <circle cx="14" cy="30" r="3" fill={isHovered ? '#155EEF' : '#60A5FA'} />
              <circle cx="46" cy="30" r="3" fill={isHovered ? '#155EEF' : '#60A5FA'} />
              <circle cx="16" cy="42" r="3" fill={isHovered ? '#155EEF' : '#60A5FA'} />
              <circle cx="44" cy="42" r="3" fill={isHovered ? '#155EEF' : '#60A5FA'} />
              {/* Connectors */}
              <line x1="16" y1="18" x2="24" y2="24" stroke={isHovered ? '#93C5FD' : '#BFDBFE'} strokeWidth="1.5" />
              <line x1="44" y1="18" x2="36" y2="24" stroke={isHovered ? '#93C5FD' : '#BFDBFE'} strokeWidth="1.5" />
              <line x1="14" y1="30" x2="22" y2="30" stroke={isHovered ? '#93C5FD' : '#BFDBFE'} strokeWidth="1.5" />
              <line x1="46" y1="30" x2="38" y2="30" stroke={isHovered ? '#93C5FD' : '#BFDBFE'} strokeWidth="1.5" />
              {/* Center Chip */}
              <rect
                x="22"
                y="22"
                width="16"
                height="16"
                rx="4"
                fill={isHovered ? '#155EEF' : '#2563EB'}
              />
              <text
                x="30"
                y="33"
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="8.5"
                fontFamily="system-ui, sans-serif"
                fontWeight="900"
              >
                AI
              </text>
            </svg>
          </div>
        </div>
      ),
    },
    {
      num: '03',
      title: 'DigiLocker\ne-KYC Integration',
      desc: 'Automated, government-verified identity and document verification in real-time.',
      icon: (isHovered: boolean) => (
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          <div
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full transition-all duration-300 flex items-center justify-center ${
              isHovered
                ? 'bg-white shadow-lg text-[#155EEF]'
                : 'bg-blue-50 border border-blue-100 text-[#155EEF]'
            }`}
          >
            <svg viewBox="0 0 60 60" className="w-10 h-10 sm:w-12 sm:h-12" fill="none">
              {/* 3D Blue Shield */}
              <path
                d="M 30 14 C 42 14, 46 18, 46 25 C 46 38, 36 46, 30 49 C 24 46, 14 38, 14 25 C 14 18, 18 14, 30 14 Z"
                fill={isHovered ? '#155EEF' : '#3B82F6'}
              />
              {/* User Avatar inside Shield */}
              <circle cx="30" cy="27" r="4.5" fill="#FFFFFF" />
              <path
                d="M 23 37 C 23 32.5, 26 31, 30 31 C 34 31, 37 32.5, 37 37"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Green check badge */}
              <circle cx="43" cy="39" r="6.5" fill="#10B981" />
              <path d="M 40 39 L 42 41 L 46 37" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ),
    },
    {
      num: '04',
      title: 'Faster Loan\nProcessing',
      desc: 'Reduce manual work, accelerate approvals, and deliver a seamless borrower experience.',
      icon: (isHovered: boolean) => (
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          <div
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full transition-all duration-300 flex items-center justify-center ${
              isHovered
                ? 'bg-white shadow-lg text-[#155EEF]'
                : 'bg-blue-50 border border-blue-100 text-[#155EEF]'
            }`}
          >
            <svg viewBox="0 0 60 60" className="w-10 h-10 sm:w-12 sm:h-12" fill="none">
              {/* Speedometer Arc */}
              <path
                d="M 17 38 A 18 18 0 1 1 43 38"
                stroke={isHovered ? '#155EEF' : '#2563EB'}
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              {/* Speed Dash Ticks */}
              <line x1="20" y1="30" x2="23" y2="30" stroke={isHovered ? '#93C5FD' : '#93C5FD'} strokeWidth="2" strokeLinecap="round" />
              <line x1="30" y1="20" x2="30" y2="23" stroke={isHovered ? '#93C5FD' : '#93C5FD'} strokeWidth="2" strokeLinecap="round" />
              <line x1="40" y1="30" x2="37" y2="30" stroke={isHovered ? '#93C5FD' : '#93C5FD'} strokeWidth="2" strokeLinecap="round" />
              {/* Dial Needle pointing high */}
              <line x1="30" y1="34" x2="38" y2="24" stroke={isHovered ? '#155EEF' : '#1D4ED8'} strokeWidth="3" strokeLinecap="round" />
              <circle cx="30" cy="34" r="3.5" fill={isHovered ? '#155EEF' : '#1D4ED8'} />
              {/* Motion speed lines on left */}
              <line x1="12" y1="28" x2="16" y2="28" stroke={isHovered ? '#93C5FD' : '#3B82F6'} strokeWidth="2" strokeLinecap="round" />
              <line x1="9" y1="33" x2="14" y2="33" stroke={isHovered ? '#93C5FD' : '#3B82F6'} strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="38" x2="16" y2="38" stroke={isHovered ? '#93C5FD' : '#3B82F6'} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      ),
    },
    {
      num: '05',
      title: 'Secure & Scalable\nInfrastructure',
      desc: 'Enterprise-grade security with a scalable architecture that grows with your lending business.',
      icon: (isHovered: boolean) => (
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
          <div
            className={`w-16 h-16 sm:w-18 sm:h-18 rounded-full transition-all duration-300 flex items-center justify-center ${
              isHovered
                ? 'bg-white shadow-lg text-[#155EEF]'
                : 'bg-blue-50 border border-blue-100 text-[#155EEF]'
            }`}
          >
            <svg viewBox="0 0 60 60" className="w-10 h-10 sm:w-12 sm:h-12" fill="none">
              {/* 3D Padlock Body */}
              <rect
                x="20"
                y="26"
                width="20"
                height="18"
                rx="4"
                fill={isHovered ? '#155EEF' : '#2563EB'}
              />
              {/* Shackle */}
              <path
                d="M 24 26 L 24 20 A 6 6 0 0 1 36 20 L 36 26"
                stroke={isHovered ? '#93C5FD' : '#60A5FA'}
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Keyhole */}
              <circle cx="30" cy="33" r="2" fill="#FFFFFF" />
              <line x1="30" y1="34" x2="30" y2="38" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
              {/* Green check badge */}
              <circle cx="42" cy="40" r="6.5" fill="#10B981" />
              <path d="M 39 40 L 41 42 L 45 38" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section className="w-full bg-white relative overflow-hidden py-20 sm:py-28 px-4 sm:px-8 border-t border-slate-100">
      {/* ── Decorative Background Elements (matching Screenshot) ── */}

      {/* Left 6x6 Blue Dot Grid Pattern */}
      <div className="absolute top-16 left-6 sm:left-12 grid grid-cols-6 gap-2.5 opacity-40 pointer-events-none">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-[#155EEF]" />
        ))}
      </div>

      {/* Right 6x6 Blue Dot Grid Pattern */}
      <div className="absolute top-16 right-6 sm:right-12 grid grid-cols-6 gap-2.5 opacity-40 pointer-events-none">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="w-1 h-1 rounded-full bg-[#155EEF]" />
        ))}
      </div>

      {/* Top Right Decorative Contour Waves */}
      <div className="absolute top-0 right-0 w-96 h-96 opacity-35 pointer-events-none">
        <svg viewBox="0 0 400 400" className="w-full h-full fill-none stroke-blue-200" strokeWidth="1">
          <path d="M 0 60 Q 150 20 250 120 T 400 90" />
          <path d="M 0 100 Q 180 50 280 160 T 400 130" />
          <path d="M 0 140 Q 210 80 310 200 T 400 170" />
          <path d="M 0 180 Q 240 110 340 240 T 400 210" />
        </svg>
      </div>

      {/* ── Main Section Container ── */}
      <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16 relative z-10 text-center">
        {/* ── Section Heading & Subtitle (Exact Match to Screenshot) ── */}
        <div className="space-y-3">
          <h2 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-[#071A33]">
            The Scale of{' '}
            <span className="text-[#155EEF]">Our Platform</span>
          </h2>

          {/* Small Blue Center Accent Divider */}
          <div className="w-12 h-1 bg-[#155EEF] rounded-full mx-auto my-3.5" />

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed font-normal">
            Built to power modern lending at scale with intelligence, speed, security, and seamless integrations.
          </p>
        </div>

        {/* ── 5 Tall Sleek Cards Grid (With Hover Blue Color Transformation) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 sm:gap-6 pt-2">
          {pillars.map((item, idx) => {
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={item.num}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`group rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center justify-between transition-all duration-300 ease-out cursor-pointer relative ${
                  isHovered
                    ? 'bg-[#155EEF] text-white border border-[#155EEF] shadow-2xl shadow-[#155EEF]/30 -translate-y-2.5 scale-[1.02]'
                    : 'bg-white border border-slate-200/90 hover:border-slate-300 shadow-md shadow-slate-200/50 hover:shadow-lg'
                }`}
                style={{
                  minHeight: '390px',
                }}
              >
                {/* Top Half: Graphic + Number + Title */}
                <div className="space-y-4 w-full flex flex-col items-center">
                  {/* Top Graphic */}
                  <div>{item.icon(isHovered)}</div>

                  {/* Circular Step Number Badge */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-colors duration-300 ${
                      isHovered
                        ? 'bg-white text-[#155EEF] shadow-md'
                        : 'bg-[#155EEF] text-white'
                    }`}
                  >
                    {item.num}
                  </div>

                  {/* Title */}
                  <h3
                    className={`text-base sm:text-lg font-black tracking-tight leading-snug whitespace-pre-line transition-colors duration-300 ${
                      isHovered ? 'text-white' : 'text-[#071A33]'
                    }`}
                  >
                    {item.title}
                  </h3>

                  {/* Small Divider */}
                  <div
                    className={`w-8 h-0.5 rounded-full mx-auto transition-colors duration-300 ${
                      isHovered ? 'bg-white/40' : 'bg-slate-200'
                    }`}
                  />
                </div>

                {/* Bottom Half: Description */}
                <p
                  className={`text-xs leading-relaxed mt-4 transition-colors duration-300 ${
                    isHovered ? 'text-blue-50' : 'text-slate-500'
                  }`}
                >
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
