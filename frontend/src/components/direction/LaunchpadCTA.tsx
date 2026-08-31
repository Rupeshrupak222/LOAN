'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
}

export const LaunchpadCTA: React.FC<Props> = ({ activeDirection }) => {
  const current = DIRECTIONS[activeDirection];
  const router = useRouter();
  const [mobile, setMobile] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/applications?purpose=${activeDirection}&amount=${current.defaultAmount}`);
  };

  return (
    <section id="launchpad" className="relative py-28 bg-gradient-to-b from-[#ffffff] via-[#f1f5f9] to-[#e2e8f0] text-slate-900 overflow-hidden border-t border-slate-200">
      {/* Radiant portal background glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div
          className="w-[700px] sm:w-[900px] h-[500px] rounded-full blur-[160px] opacity-15 transition-all duration-1000"
          style={{ backgroundColor: current.accentHex }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Converging Path Marker */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-mono uppercase tracking-widest text-emerald-700 mb-6 shadow-sm font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>CHAPTER 08 : YOUR NEXT MOVE STARTS NOW</span>
        </div>

        {/* Big Climax Headline */}
        <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
          Your money has a direction.{' '}
          <span
            className="block text-transparent bg-clip-text"
            style={{
              backgroundImage: `linear-gradient(135deg, ${current.accentHex} 0%, #4f46e5 100%)`,
            }}
          >
            Take the first step in 60 seconds.
          </span>
        </h2>

        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
          Join over 120,000 borrowers across India. Unlock up to ₹25 Lakhs with zero paperwork, zero physical branch visits, and zero fine print traps.
        </p>

        {/* Interactive Quick Launch Box */}
        <div className="max-w-xl mx-auto rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 text-sm font-mono font-bold">
                  +91
                </div>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-14 pr-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-mono font-semibold"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-7 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-300 hover:brightness-105 active:scale-95 shadow-xl whitespace-nowrap"
                style={{
                  backgroundColor: current.accentHex,
                  boxShadow: `0 10px 25px -4px ${current.accentHex}77`,
                }}
              >
                Check Offer in 60s
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 font-mono font-semibold flex-wrap pt-2">
              <span className="flex items-center gap-1 text-emerald-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Zero Impact on CIBIL Score
              </span>
              <span className="flex items-center gap-1 text-indigo-700">
                <Lock className="w-4 h-4 text-indigo-600" />
                256-Bit SSL Encrypted
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <Zap className="w-4 h-4 text-amber-600" />
                Instant 90s Disbursal
              </span>
            </div>
          </form>
        </div>

        {/* Existing LMS Portal Access Shortcut */}
        <div className="mt-8 text-xs text-slate-500 font-medium">
          Already an existing borrower or partner?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-800 font-bold underline underline-offset-4">
            Sign into your LMS Account →
          </Link>
        </div>
      </div>
    </section>
  );
};
