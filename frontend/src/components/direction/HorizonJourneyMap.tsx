'use client';

import React, { useState } from 'react';
import {
  Compass,
  FileCheck2,
  Cpu,
  Zap,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  QrCode,
  CreditCard,
  Building,
} from 'lucide-react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
}

const MILESTONES = [
  {
    step: '01',
    title: 'Set Your Direction',
    time: '15 Seconds',
    tag: 'Intuitive Goal Mapping',
    desc: 'Select your intent (Business, Education, Home, Emergency, Upgrade). Tell us the number that makes your move possible.',
    phoneMock: {
      screenTitle: 'Select Coordinates',
      badge: 'Goal: Active',
      headline: '₹3,50,000 Requested',
      sub: 'Merchant Expansion Line',
      status: 'Coordinates Locked',
    },
  },
  {
    step: '02',
    title: 'Paperless 60s KYC',
    time: '60 Seconds',
    tag: '100% Digital Consent',
    desc: 'Instant Aadhaar OTP verification via DigiLocker and PAN verification. Zero physical photocopies, zero branch visits.',
    phoneMock: {
      screenTitle: 'DigiLocker Consent',
      badge: 'Govt. of India e-KYC',
      headline: 'Aadhaar Verified ✓',
      sub: 'PAN Linked: *******842K',
      status: 'KYC Certified in 14s',
    },
  },
  {
    step: '03',
    title: 'Instant AI Sanction',
    time: '30 Seconds',
    tag: 'Zero Bias Underwriting',
    desc: 'Our credit engine evaluates cash-flow health and intent rather than outdated metrics, sanctioning pre-approved credit limits instantly.',
    phoneMock: {
      screenTitle: 'Credit Sanction',
      badge: 'Underwriting Approved',
      headline: 'Sanctioned: ₹3,50,000',
      sub: 'Meridian NBFC Capital Pool',
      status: 'KFS Document Ready',
    },
  },
  {
    step: '04',
    title: 'Direct UPI Disbursal',
    time: '90 Seconds',
    tag: 'Cash in Bank / App',
    desc: 'Funds transferred directly to your Google Pay, PhonePe, or Primary Savings Account via instant NPCI 24/7 payment rails.',
    phoneMock: {
      screenTitle: 'Payment Complete',
      badge: 'NPCI IMPS / UPI',
      headline: '+ ₹3,50,000 Credited',
      sub: 'UPI Ref: 489201948291',
      status: 'Ready to use immediately',
    },
  },
];

export const HorizonJourneyMap: React.FC<Props> = ({ activeDirection }) => {
  const current = DIRECTIONS[activeDirection];
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="relative py-24 bg-[#f8fafc] text-slate-900 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-10 w-[500px] h-[500px] rounded-full blur-[160px] opacity-10 transition-all duration-700"
          style={{ backgroundColor: current.accentHex }}
        />
        <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-teal-500/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Chapter 05 Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-700 uppercase tracking-widest mb-4 font-bold">
            <span>CHAPTER 05 : THE 3-MINUTE HORIZON</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            From your next move to{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(135deg, ${current.accentHex} 0%, #4f46e5 100%)`,
              }}
            >
              cash in hand.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            No branch lines. No printouts. No waiting for committee callbacks. Experience a loan designed for modern India.
          </p>
        </div>

        {/* Interactive Step Map + Phone Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: 4 Stepper Cards */}
          <div className="lg:col-span-7 space-y-4">
            {MILESTONES.map((item, idx) => {
              const isSelected = activeStep === idx;

              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer p-5 sm:p-6 rounded-3xl border transition-all duration-300 ${
                    isSelected
                      ? 'bg-white border-2 shadow-xl scale-[1.01]'
                      : 'bg-white/80 border-slate-200/80 hover:bg-white hover:border-slate-300'
                  }`}
                  style={{
                    borderColor: isSelected ? current.accentHex : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-sm text-white flex-shrink-0 transition-colors"
                        style={{
                          backgroundColor: isSelected ? current.accentHex : '#94a3b8',
                        }}
                      >
                        {item.step}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-bold text-slate-900">
                            {item.title}
                          </h4>
                          <span
                            className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                            style={{
                              backgroundColor: `${current.accentHex}15`,
                              color: current.accentHex,
                            }}
                          >
                            {item.tag}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-medium">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md font-bold whitespace-nowrap hidden sm:block">
                      ⚡ {item.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Phone Preview Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[340px] aspect-[9/18.5] rounded-[48px] p-3 bg-gradient-to-b from-slate-800 to-slate-900 border-4 border-slate-700 shadow-2xl flex flex-col justify-between overflow-hidden">
              {/* Phone Speaker Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
                <div className="w-10 h-1 rounded-full bg-slate-800" />
              </div>

              {/* Inner Screen */}
              <div className="relative w-full h-full rounded-[38px] bg-slate-950 p-5 pt-10 flex flex-col justify-between text-white overflow-hidden">
                {/* Top Status */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-4">
                    <span>Adyapan 2.0</span>
                    <span className="text-emerald-400 font-bold">● 5G Live</span>
                  </div>

                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    {MILESTONES[activeStep].phoneMock.screenTitle}
                  </div>
                  <div className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-200 inline-block mt-1">
                    {MILESTONES[activeStep].phoneMock.badge}
                  </div>
                </div>

                {/* Center Highlight Card */}
                <div className="my-auto p-5 rounded-2xl bg-white/[0.08] border border-white/15 text-center relative overflow-hidden">
                  <div
                    className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: current.accentHex }}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="text-lg font-black text-white mb-1">
                    {MILESTONES[activeStep].phoneMock.headline}
                  </div>
                  <div className="text-xs text-slate-300 mb-3 font-medium">
                    {MILESTONES[activeStep].phoneMock.sub}
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {MILESTONES[activeStep].phoneMock.status}
                  </div>
                </div>

                {/* Bottom Step Switcher */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400 font-semibold">
                    <span>Progress: Stage {activeStep + 1} of 4</span>
                    <span className="text-white font-bold">{((activeStep + 1) * 25)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${(activeStep + 1) * 25}%`,
                        backgroundColor: current.accentHex,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
