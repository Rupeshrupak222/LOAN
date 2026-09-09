'use client';

import React from 'react';
import { UserCheck, FileText, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const LendingOnboardingPipeline: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'CUSTOMER APPLIES',
      desc: 'Applicant initiates loan journey on web, mobile app, or branch tablet.',
      icon: UserCheck,
      depthZ: -750,
      rotX: 18,
    },
    {
      num: '02',
      title: 'DOCUMENT REQUEST',
      desc: 'LMS triggers automated parameter check for required identity & income records.',
      icon: FileText,
      depthZ: -950,
      rotX: 15,
    },
    {
      num: '03',
      title: 'USER CONSENT',
      desc: 'Customer approves explicit digital document access via authenticated consent window.',
      icon: Lock,
      depthZ: -1150,
      rotX: 12,
    },
    {
      num: '04',
      title: 'VERIFICATION',
      desc: 'Digital signatures & issuer checksums validate document authenticity.',
      icon: CheckCircle2,
      depthZ: -1350,
      rotX: 10,
    },
    {
      num: '05',
      title: 'APPLICATION ADVANCES',
      desc: 'Structured verified profile flows directly to policy & underwriting review.',
      icon: ArrowUpRight,
      depthZ: -1550,
      rotX: 8,
    },
  ];

  return (
    <ScrollStage3D
      id="section-lending-pipeline"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4 text-left">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
          >
            <span>STAGE 08 // WORKFLOW INTEGRATION</span>
          </div>

          <div
            data-depth-z="-750"
            data-rotate-x="30"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              BRING VERIFICATION
            </h2>
          </div>

          <div
            data-depth-z="-1000"
            data-rotate-x="38"
            data-offset-y="90"
            data-blur="12"
            data-stagger="0.25"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight uppercase font-sans">
              <span className="text-[#155EEF] block">CLOSER TO ONBOARDING.</span>
            </h2>
          </div>

          <div
            data-depth-z="-650"
            data-rotate-y="-8"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.4"
          >
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Verification is not an isolated back-office obstacle. By embedding digital document access directly into customer onboarding, lending workflows maintain continuous momentum while honoring compliance standards.
            </p>
          </div>
        </div>

        {/* 5-Step Lending Onboarding Pipeline Strip Arriving Sequentially */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                data-depth-z={step.depthZ.toString()}
                data-rotate-x={step.rotX.toString()}
                data-scale="0.76"
                data-offset-y="70"
                data-blur="8"
                data-stagger={(idx * 0.15).toFixed(2)}
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
        <div
          data-depth-z="-800"
          data-rotate-x="18"
          data-scale="0.85"
          data-offset-y="40"
          data-blur="6"
          data-stagger="0.5"
          className="p-6 rounded-2xl bg-white border border-slate-200/90 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600 font-sans"
        >
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
    </ScrollStage3D>
  );
};
