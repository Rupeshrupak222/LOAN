'use client';

import React from 'react';
import { UserCheck, FileCheck2, Link2, BadgeCheck, Check } from 'lucide-react';

export const VerificationSummaryCards: React.FC = () => {
  const summaryItems = [
    {
      title: 'Identity',
      status: 'Verified',
      supportingText: 'Aadhaar & biometric match',
      icon: UserCheck,
    },
    {
      title: 'Documents',
      status: '4/4 Verified',
      supportingText: 'Government records authenticated',
      icon: FileCheck2,
    },
    {
      title: 'DigiLocker',
      status: 'Connected',
      supportingText: 'Direct MeitY consent gateway',
      icon: Link2,
    },
    {
      title: 'KYC',
      status: 'Completed',
      supportingText: 'Compliant with RBI digital guidelines',
      icon: BadgeCheck,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {summaryItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-[#155EEF]/30 hover:shadow-md transition-all text-left space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                <span>{item.status}</span>
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-[#071A33] tracking-tight">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {item.supportingText}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
