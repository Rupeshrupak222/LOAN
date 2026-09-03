'use client';

import React, { useState } from 'react';
import { FileText, ShieldCheck, Award, Car, CheckCircle2, Info } from 'lucide-react';

interface CategoryDoc {
  id: string;
  name: string;
  badge: string;
  icon: React.ElementType;
  issuerOrg: string;
  primaryAttributes: string[];
  demonstrationRecord: {
    title: string;
    ref: string;
    verifiedFields: string;
  };
}

const CATEGORIES: CategoryDoc[] = [
  {
    id: 'identity',
    name: 'IDENTITY',
    badge: 'CORE KYC',
    icon: FileText,
    issuerOrg: 'Statutory Identity Issuers',
    primaryAttributes: ['Full Name', 'DOB & Gender', 'Biometric Checksum', 'Masked Identifier'],
    demonstrationRecord: {
      title: 'Digital Identity Certificate (Demo)',
      ref: 'ID-DEMO-7719',
      verifiedFields: 'Name, DOB, Address Hash match',
    },
  },
  {
    id: 'education',
    name: 'EDUCATION',
    badge: 'ACADEMIC',
    icon: Award,
    issuerOrg: 'Central & State Examination Boards / Universities',
    primaryAttributes: ['Roll Number', 'Institution Name', 'Passing Year', 'Grade Attestation'],
    demonstrationRecord: {
      title: 'Secondary Marksheet Record (Demo)',
      ref: 'EDU-DEMO-3391',
      verifiedFields: 'Board Roll, School Affiliation, Grade Attested',
    },
  },
  {
    id: 'transport',
    name: 'TRANSPORT',
    badge: 'MOBILITY',
    icon: Car,
    issuerOrg: 'Ministry of Road Transport & Highways (MoRTH)',
    primaryAttributes: ['Driving License Status', 'Vehicle Registration', 'Validity Horizon', 'Vehicle Class'],
    demonstrationRecord: {
      title: 'Digital Driving License Record (Demo)',
      ref: 'DL-DEMO-9912',
      verifiedFields: 'License Valid, Non-Transport Class Certified',
    },
  },
  {
    id: 'certificates',
    name: 'CERTIFICATES',
    badge: 'STATUTORY',
    icon: ShieldCheck,
    issuerOrg: 'State Revenue & Administrative Authorities',
    primaryAttributes: ['Income Certificate', 'Domicile Record', 'Issuing Officer Signature', 'Seal Verification'],
    demonstrationRecord: {
      title: 'Revenue Income Certificate (Demo)',
      ref: 'REV-DEMO-4102',
      verifiedFields: 'Annual Income Band, Competent Authority Stamp',
    },
  },
  {
    id: 'other',
    name: 'OTHER SUPPORTED',
    badge: 'UTILITY & LIFE',
    icon: Info,
    issuerOrg: 'Participating Public Sector & Institutional Issuers',
    primaryAttributes: ['LPG Subscription', 'Insurance Policy Record', 'Pension Certificate', 'Health ID'],
    demonstrationRecord: {
      title: 'Institutional Service Record (Demo)',
      ref: 'OTH-DEMO-1844',
      verifiedFields: 'Policy Number, Active Coverage Confirmation',
    },
  },
];

export const DocumentCategorySelector: React.FC = () => {
  const [selectedId, setSelectedId] = useState('identity');

  const currentCategory = CATEGORIES.find((c) => c.id === selectedId) || CATEGORIES[0];
  const Icon = currentCategory.icon;

  return (
    <section
      id="section-document-types"
      className="py-20 sm:py-24 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase">
            <span>MULTI-DOCUMENT COVERAGE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
            ONE DIGITAL WORKFLOW.{' '}
            <span className="text-[#155EEF] block">MANY DOCUMENT TYPES.</span>
          </h2>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
            Access supported document categories from authorized digital issuers in the relevant ecosystem. Document availability depends on user consent and participating issuer integrations.
          </p>
        </div>

        {/* Clean Horizontal Category Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          {CATEGORIES.map((cat) => {
            const isSelected = cat.id === selectedId;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedId(cat.id)}
                onMouseEnter={() => setSelectedId(cat.id)}
                className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#155EEF] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Category Document Preview Pane */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-left">
          {/* Left Details */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#155EEF] flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#071A33] font-sans uppercase">
                  {currentCategory.name} WORKFLOW
                </h3>
                <p className="text-xs font-mono text-slate-500">
                  ISSUER ECOSYSTEM: {currentCategory.issuerOrg}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
                SUPPORTED VERIFICATION ATTRIBUTES:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentCategory.primaryAttributes.map((attr, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-sans font-semibold text-slate-700 shadow-2xs"
                  >
                    ✓ {attr}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Demonstration Card */}
          <div className="lg:col-span-5 p-6 rounded-xl bg-white border border-slate-300 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-mono font-bold text-[#071A33]">
                {currentCategory.demonstrationRecord.title}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                VALID
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>RECORD REF:</span>
                <span className="text-[#155EEF] font-bold">
                  {currentCategory.demonstrationRecord.ref}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>ATTESTATION:</span>
                <span className="text-slate-800 font-bold text-right">
                  {currentCategory.demonstrationRecord.verifiedFields}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-400 text-center">
              Demonstration record · Specific document availability governed by ecosystem integrations.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
