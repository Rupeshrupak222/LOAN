'use client';

import React from 'react';
import {
  ShieldCheck,
  Lock,
  FileCheck,
  ScanFace,
  Server,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

export const SecurityTrustSection: React.FC = () => {
  const securityPillars = [
    {
      title: 'Secure Verification',
      subtitle: 'Zero-Trust Consent Protocol',
      description:
        'Explicit borrower OTP consent is validated via official MeitY & UIDAI gateway sessions before any personal data is queried.',
      icon: KeyRound,
      badge: 'Explicit Consent',
    },
    {
      title: 'Digital Document Processing',
      subtitle: 'Tamper-Proof PKI Signatures',
      description:
        'Documents are processed as cryptographically signed XML directly from government issuing authorities, eliminating paper document forgery.',
      icon: FileCheck,
      badge: '100% Anti-Fraud',
    },
    {
      title: 'Verified Identity',
      subtitle: 'AI 3D Depth Liveness Check',
      description:
        'Sub-second neural face matching with active liveness detection prevents photo replay, printed masks, and biometric presentation attacks.',
      icon: ScanFace,
      badge: '99.7% Match Precision',
    },
    {
      title: 'Encrypted Data Flow',
      subtitle: 'Bank-Grade Cryptography',
      description:
        'All payloads are secured with TLS 1.3 in transit and AES-256 encryption at rest, strictly adhering to RBI and ISO 27001 data compliance.',
      icon: Lock,
      badge: 'AES-256 & TLS 1.3',
    },
  ];

  return (
    <section className="space-y-10 py-6">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-bold text-[#155EEF] font-mono shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>ENTERPRISE COMPLIANCE & SECURITY</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-[#071A33] tracking-tight">
          Built for Secure Loan Onboarding
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Bank-grade cryptographic architecture engineered in accordance with RBI digital lending guidelines and central identity verification standards.
        </p>
      </div>

      {/* 4 Compact Security Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {securityPillars.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-slate-50/70 border border-slate-200/80 hover:bg-white hover:border-[#155EEF]/40 hover:shadow-md transition-all text-left space-y-3 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-[#155EEF] flex items-center justify-center group-hover:bg-[#155EEF] group-hover:text-white transition-all shadow-xs">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold font-mono text-[#155EEF] uppercase tracking-wider block">
                    {pillar.subtitle}
                  </span>
                  <h3 className="text-base font-bold text-[#071A33] tracking-tight">
                    {pillar.title}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono">
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{pillar.badge}</span>
                </span>
                <span className="text-slate-400">RBI Spec</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
