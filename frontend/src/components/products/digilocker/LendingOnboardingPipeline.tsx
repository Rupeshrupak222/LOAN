'use client';

import React from 'react';
import { ArrowRight, UserCheck, FileText, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';

export const LendingOnboardingPipeline: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'CUSTOMER APPLIES',
      desc: 'Applicant initiates loan journey on web, mobile app, or branch tablet.',
      icon: UserCheck,
    },
    {
      num: '02',
      title: 'DOCUMENT REQUEST',
      desc: 'LMS triggers automated parameter check for required identity & income records.',
      icon: FileText,
    },
    {
      num: '03',
      title: 'USER CONSENT',
      desc: 'Customer approves explicit digital document access via authenticated consent window.',
      icon: Lock,
    },
    {
      num: '04',
      title: 'VERIFICATION',
      desc: 'Digital signatures & issuer checksums validate document authenticity.',
      icon: CheckCircle2,
    },
    {
      num: '05',
      title: 'APPLICATION ADVANCES',
      desc: 'Structured verified profile flows directly to policy & underwriting review.',
      icon: ArrowUpRight,
    },
  ];

  return (
    <section
      id="section-lending-pipeline"
      className="py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase">
            <span>WORKFLOW INTEGRATION</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
            BRING VERIFICATION{' '}
            <span className="text-[#155EEF] block">CLOSER TO ONBOARDING.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
            Verification is not an isolated back-office obstacle. By embedding digital document access directly into customer onboarding, lending workflows maintain continuous momentum while honoring compliance standards.
          </p>
        </div>

        {/* 5-Step Lending Onboarding Pipeline Strip */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between text-left space-y-4 relative group hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between pb-3">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {step.num}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#155EEF] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-[#071A33] font-sans tracking-wide">
                    {step.title}
                  </h3>

                  <p className="text-xs text-slate-500 font-sans mt-2 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center text-[10px]">
                    →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Policy & Compliance Statement */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600 font-sans">
          <div className="space-y-1">
            <span className="font-bold font-mono text-[#071A33] uppercase block">
              COMPLIANCE & DECISION INTEGRITY
            </span>
            <p>
              Digital verification provides structured inputs for credit assessment. Final credit approval and sanction decisions remain subject to lender credit policy and risk underwriting rules.
            </p>
          </div>

          <span className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 font-mono text-[11px] font-bold text-slate-700">
            AUDIT-TRAIL CAPTURED
          </span>
        </div>
      </div>
    </section>
  );
};
