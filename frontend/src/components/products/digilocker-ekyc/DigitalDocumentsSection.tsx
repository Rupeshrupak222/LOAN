'use client';

import React from 'react';
import {
  UserCheck,
  CreditCard,
  FileText,
  Building2,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const DigitalDocumentsSection: React.FC = () => {
  const documents = [
    {
      name: 'Aadhaar Card',
      authority: 'UIDAI',
      badge: 'e-KYC XML',
      icon: UserCheck,
      description:
        'Direct retrieval of cryptographically signed demographic records, residential address verification, and official high-resolution photo.',
      features: ['Tamper-evident PKI XML', 'Zero physical photocopies', 'UIDAI secure consent token'],
      latency: '< 4 Seconds',
      status: 'Government Certified',
    },
    {
      name: 'Permanent Account Number (PAN)',
      authority: 'Income Tax Dept / NSDL',
      badge: 'Direct Tax ID',
      icon: CreditCard,
      description:
        'Instant NSDL database validation verifying legal tax ID, active PAN status, and automated Aadhaar-PAN linkage check.',
      features: ['Real-time NSDL API check', 'Fuzzy name matching AI', 'Tax compliance verification'],
      latency: '< 2 Seconds',
      status: 'Government Certified',
    },
    {
      name: 'Driving Licence',
      authority: 'MoRTH (Sarathi)',
      badge: 'National Registry',
      icon: FileText,
      description:
        'Central Ministry of Road Transport & Highways verification validating identity, age eligibility, and secondary address verification.',
      features: ['National Sarathi database', 'Cryptographic state registry', 'Secondary ID validation'],
      latency: '< 3 Seconds',
      status: 'Government Certified',
    },
    {
      name: 'Bank Account & Financials',
      authority: 'NPCI & Account Aggregator',
      badge: 'Penny-Drop Match',
      icon: Building2,
      description:
        'Automated ₹1 penny-drop validation ensuring the loan recipient bank account directly matches the verified PAN holder identity.',
      features: ['NPCI IMPS penny-drop', 'Instant account ownership', 'Sanction disbursement ready'],
      latency: '< 5 Seconds',
      status: 'RBI Spec Aligned',
    },
  ];

  return (
    <section className="space-y-10 py-6">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-bold text-[#155EEF] font-mono shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SUPPORTED CREDENTIALS</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#071A33] tracking-tight">
          Digital Documents, Verified Securely
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Every document is pulled directly from the issuing government authority as an authentic, signed cryptographic record without manual document scans.
        </p>
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documents.map((doc, idx) => {
          const Icon = doc.icon;
          return (
            <div
              key={idx}
              className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#155EEF]/50 transition-all text-left space-y-5 group flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#155EEF] flex items-center justify-center group-hover:bg-[#155EEF] group-hover:text-white transition-all shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#071A33] tracking-tight group-hover:text-[#155EEF] transition-colors">
                        {doc.name}
                      </h3>
                      <p className="text-xs font-mono font-bold text-slate-500">{doc.authority}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#155EEF] border border-blue-200">
                    {doc.badge}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {doc.description}
                </p>

                {/* Feature Bullet List */}
                <div className="space-y-2 pt-1">
                  {doc.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
                  <span className="text-[11px] font-bold text-slate-700">Fetch Latency: {doc.latency}</span>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>{doc.status}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
