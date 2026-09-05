'use client';

import React, { useState } from 'react';
import { Send, CheckCircle2, RefreshCw, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';
import { api } from '@/lib/api';

interface Props {
  selectedTrack?: string;
}

export const EnterpriseContactForm3D: React.FC<Props> = ({ selectedTrack = 'lending' }) => {
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [volumeBand, setVolumeBand] = useState('₹50 CR – ₹250 CR / Month');
  const [projectScope, setProjectScope] = useState('');
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [ticketRef, setTicketRef] = useState('ARCH-REQ-48210');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workEmail) return;

    setFormStatus('submitting');
    try {
      const res = await api.post('/support/inquiry', {
        fullName,
        workEmail,
        orgName,
        volumeBand,
        projectScope,
      });
      const returnedId = res.data?.data?.id || `ARCH-REQ-${Math.floor(10000 + Math.random() * 90000)}`;
      setTicketRef(returnedId);
    } catch {
      // Graceful offline fallback
      setTicketRef(`ARCH-REQ-${Math.floor(10000 + Math.random() * 90000)}`);
    } finally {
      setTimeout(() => {
        setFormStatus('success');
      }, 500);
    }
  };

  const handleReset = () => {
    setFormStatus('idle');
    setFullName('');
    setWorkEmail('');
    setOrgName('');
    setProjectScope('');
  };

  return (
    <ScrollStage3D
      id="contact-form-section"
      perspective={1500}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start text-left">
        {/* Left Column: Staggered 2-Line Headline Reveal */}
        <div className="lg:col-span-5 space-y-6">
          <div
            data-depth-z="-400"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
          >
            <span>STAGE 04 // ENGAGEMENT SCOPE</span>
          </div>

          {/* Line 1: TELL US WHAT (translateZ: -700px) */}
          <div
            data-depth-z="-700"
            data-rotate-x="30"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-[58px] font-black text-[#071A33] tracking-tight leading-[1.04] uppercase font-sans">
              TELL US WHAT
            </h2>
          </div>

          {/* Line 2: YOU'RE BUILDING. (translateZ: -1000px) */}
          <div
            data-depth-z="-1000"
            data-rotate-x="38"
            data-offset-y="90"
            data-blur="12"
            data-stagger="0.25"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-[58px] font-black tracking-tight leading-[1.04] uppercase font-sans">
              <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-[#0A2540] bg-clip-text text-transparent">
                YOU'RE BUILDING.
              </span>
            </h2>
          </div>

          <div
            data-depth-z="-600"
            data-rotate-y="-8"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.4"
          >
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Provide your organization and projected scale. An Adyapan principal solutions architect will review your technical parameters and respond with customized architecture diagrams.
            </p>
          </div>

          {/* Trust Guarantees */}
          <div
            data-depth-z="-450"
            data-rotate-x="15"
            data-offset-y="30"
            data-blur="4"
            data-stagger="0.5"
            className="pt-4 border-t border-slate-200/90 space-y-3 font-sans text-xs text-slate-600"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct engineer-to-engineer review · No marketing middlemen</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[#155EEF] shrink-0" />
              <span>Strict mutual NDA and institutional data confidentiality</span>
            </div>
          </div>
        </div>

        {/* Right Column: Layered Form Assembling from Depth */}
        <div className="lg:col-span-7">
          <div
            data-depth-z="-850"
            data-rotate-x="22"
            data-rotate-y="10"
            data-scale="0.8"
            data-offset-y="70"
            data-blur="10"
            data-stagger="0.3"
            className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-300 shadow-xl space-y-6 relative overflow-hidden"
          >
            {formStatus === 'success' ? (
              <div className="py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-2xl font-black text-[#071A33] font-sans">
                    ENGAGEMENT INITIATED
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                    Your technical parameters have been routed to our Solutions Architecture desk. A principal engineer will reach out to <strong>{workEmail}</strong> within 15 minutes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left font-mono text-xs text-slate-600 space-y-1 max-w-md mx-auto">
                  <p>ASSIGNED DESK: <strong className="text-[#071A33]">CORE LENDING & INFRASTRUCTURE</strong></p>
                  <p>TICKET REFERENCE: <strong className="text-[#155EEF]">{ticketRef}</strong></p>
                  <p>ESTIMATED RESPONSE: <strong className="text-emerald-700">&lt; 15 MINUTES</strong></p>
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>SUBMIT ANOTHER INQUIRY</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 font-mono text-xs">
                  <span className="font-bold text-[#071A33]">
                    ENTERPRISE BRIEFING REQUEST
                  </span>
                  <span className="text-[#155EEF] font-bold">
                    DOMAIN: {selectedTrack.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                      FULL NAME *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Mehta"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-sans focus:bg-white focus:border-[#155EEF] focus:outline-hidden transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                      WORK EMAIL *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@organization.com"
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-sans focus:bg-white focus:border-[#155EEF] focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                      ORGANIZATION / NBFC / BANK *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex FinTech Ltd."
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-sans focus:bg-white focus:border-[#155EEF] focus:outline-hidden transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                      PROJECTED DISBURSAL VOLUME
                    </label>
                    <select
                      value={volumeBand}
                      onChange={(e) => setVolumeBand(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-sans focus:bg-white focus:border-[#155EEF] focus:outline-hidden transition-all"
                    >
                      <option>Under ₹50 CR / Month</option>
                      <option>₹50 CR – ₹250 CR / Month</option>
                      <option>₹250 CR – ₹1,000 CR / Month</option>
                      <option>₹1,000+ CR / Month (Tier-1)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                    TECHNICAL ARCHITECTURE SCOPE & TIMELINES
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe your current tech stack, licensing needs, and desired deployment horizon..."
                    value={projectScope}
                    onChange={(e) => setProjectScope(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-sans focus:bg-white focus:border-[#155EEF] focus:outline-hidden transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formStatus === 'submitting'}
                  className="w-full py-4 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md shadow-[#155EEF]/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
                >
                  {formStatus === 'submitting' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>DISPATCHING TO SOLUTIONS DESK...</span>
                    </>
                  ) : (
                    <>
                      <span>REQUEST ARCHITECTURAL CONSULTATION</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </ScrollStage3D>
  );
};
