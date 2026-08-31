'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    category: 'Instant Cash & Speed',
    question: 'How fast will the money hit my bank account?',
    answer:
      'Instantly. Once you complete the 90-second digital KYC and select your withdrawal amount, the funds are transferred directly via 24x7 instant IMPS or UPI rails into your verified bank account in under 2 seconds.',
  },
  {
    category: 'Fees & Transparency',
    question: 'Are there any hidden charges or surprise deductions?',
    answer:
      'Zero. What you see is strictly what you pay. We don’t deduct hidden processing percentages upfront, and there are no surprise administrative fees. All terms, interest rates, and EMI schedules are laid out in plain English before you confirm.',
  },
  {
    category: 'Repayment & Flexibility',
    question: 'How does the "Split in 3 Months" 0% extra plan work?',
    answer:
      'When you borrow any amount on the 3-month plan, you can split your total bill across 3 equal monthly installments at 0% interest with zero markup. Perfect for quick purchases, travel, or gadget upgrades without paying hefty credit card interest.',
  },
  {
    category: 'Repayment & Flexibility',
    question: 'Can I pay off my loan early? Is there any foreclosure penalty?',
    answer:
      'Yes, you can prepay or fully close your loan anytime from your dashboard or app. Unlike traditional banks that penalize you 3-5% for early settlement, Adyapan charges ₹0 foreclosure fee. You only pay interest for the days you actually used the funds.',
  },
  {
    category: 'Documents & Eligibility',
    question: 'What documents are required to get started?',
    answer:
      'Just your Aadhaar number (for OTP verification), PAN card, and bank account details. No physical paperwork, no salary slips required for instant lines, and no branch visits whatsoever.',
  },
  {
    category: 'Safety & Privacy',
    question: 'Is my Aadhaar, PAN, and financial data secure?',
    answer:
      'Absolutely. We employ bank-grade 256-bit AES encryption, TLS 1.3 cryptographic transport, and strict RBI digital lending guidelines. We never share or sell your data to third-party telemarketers.',
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Instant Cash & Speed', 'Fees & Transparency', 'Repayment & Flexibility', 'Documents & Eligibility', 'Safety & Privacy'];

  const filteredFaqs =
    selectedCategory === 'All'
      ? FAQS
      : FAQS.filter((f) => f.category === selectedCategory);

  return (
    <div className="relative mx-auto max-w-[1536px] px-4 sm:px-8 lg:px-12 xl:px-16 py-20">
      {/* Header */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-extrabold uppercase tracking-widest text-brand-700 ring-1 ring-inset ring-brand-600/20">
          <HelpCircle className="h-3.5 w-3.5 text-brand-600" /> Straight Talk. No Jargon.
        </span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Everything you need to <span className="bg-brand-gradient bg-clip-text text-transparent">know</span>
        </h2>
        <p className="mt-4 text-base sm:text-lg text-slate-600">
          Have questions? Here are honest, transparent answers to help you borrow with confidence.
        </p>
      </div>

      {/* Categories */}
      <div className="mt-10 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all',
              selectedCategory === cat
                ? 'bg-slate-950 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-10 space-y-4">
        {filteredFaqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.question}
              className={cn(
                'overflow-hidden rounded-[2rem] border transition-all duration-200',
                isOpen
                  ? 'border-brand-500/60 bg-white shadow-card ring-2 ring-brand-500/15'
                  : 'border-slate-200/80 bg-white/80 hover:border-slate-300 hover:bg-white'
              )}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between p-6 sm:p-7 text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xs font-extrabold text-brand-700">
                    0{index + 1}
                  </span>
                  <span className="font-bold text-slate-900 text-base sm:text-lg">{faq.question}</span>
                </div>
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-transform duration-200',
                    isOpen && 'rotate-180 bg-brand-50 text-brand-600'
                  )}
                >
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-6 sm:px-8 pb-7 pt-1 text-sm sm:text-base leading-relaxed text-slate-600 animate-fade-up">
                  <div className="border-t border-slate-100 pt-4">
                    {faq.answer}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
