'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Award,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  PhoneOff,
  Percent,
  CheckCircle2,
} from 'lucide-react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
}

const FAQS = [
  {
    q: 'Does checking my pre-approved loan path impact my CIBIL / Experian credit score?',
    a: 'No. Checking your pre-approved limit and exploring paths on Adyapan triggers a soft inquiry only, which has zero negative impact on your credit score.',
  },
  {
    q: 'How does the "Split in 3 Months @ 0% Extra Interest" work?',
    a: 'Just like Slice, if you choose the 3-month split option, your total loan amount is divided into 3 equal monthly installments. There are zero hidden processing fees and zero interest charges when paid on time.',
  },
  {
    q: 'Can I repay or foreclose my loan early? Is there any penalty?',
    a: 'Yes, you can prepay or completely close your loan at any time. Adyapan charges ₹0 foreclosure penalty and ₹0 prepayment fee on all standard individual loans.',
  },
  {
    q: 'How fast will the money reach my bank account or UPI handle?',
    a: 'For KYC-verified borrowers, funds are disbursed automatically via NPCI 24/7 payment rails within 90 seconds. It works even at midnight, on weekends, and on public holidays.',
  },
  {
    q: 'Who are Adyapan’s lending partners?',
    a: 'All loans are originated in strict partnership with RBI-registered Non-Banking Financial Companies (NBFCs) including Meridian NBFC, Northbank Capital, and Finroot Credit.',
  },
];

export const TrustAndSafetyDeck: React.FC<Props> = ({ activeDirection }) => {
  const current = DIRECTIONS[activeDirection];
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  return (
    <section className="relative py-24 bg-[#f8fafc] text-slate-900 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-mono text-indigo-700 uppercase tracking-widest mb-4 font-bold">
            <span>CHAPTER 07 : TRUST & TRANSPARENCY</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Institutions you can trust.{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(135deg, ${current.accentHex} 0%, #4f46e5 100%)`,
              }}
            >
              Zero fine print traps.
            </span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg font-medium">
            We hold ourselves to the highest regulatory, encryption, and borrower-protection standards in India.
          </p>
        </div>

        {/* 4 Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
            <BadgeCheck className="w-8 h-8 text-indigo-600 mb-3" />
            <h4 className="font-bold text-slate-900 text-base mb-1">RBI Regulated</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              100% compliant with RBI Digital Lending Master Directions. Key Fact Statement (KFS) provided before sanction.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
            <Lock className="w-8 h-8 text-emerald-600 mb-3" />
            <h4 className="font-bold text-slate-900 text-base mb-1">ISO 27001 & SOC 2</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Bank-grade 256-bit AES encryption at rest and in transit. Your personal data is never sold to third-party telemarketers.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
            <Percent className="w-8 h-8 text-amber-600 mb-3" />
            <h4 className="font-bold text-slate-900 text-base mb-1">₹0 Foreclosure Fee</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Close your loan whenever you receive a bonus or boost. No lock-in penalties and zero hidden amortization markups.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
            <PhoneOff className="w-8 h-8 text-rose-600 mb-3" />
            <h4 className="font-bold text-slate-900 text-base mb-1">Zero Spam Guarantee</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              We despise harassing calls as much as you do. All alerts and statements are 100% digital via secure WhatsApp & SMS.
            </p>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-black text-slate-900 text-center mb-6">
            Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;

              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
