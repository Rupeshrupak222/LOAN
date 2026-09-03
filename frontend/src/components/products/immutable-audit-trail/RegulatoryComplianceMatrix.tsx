'use client';

import React from 'react';
import { Scale, ShieldCheck, CheckCircle2, FileText } from 'lucide-react';

export const RegulatoryComplianceMatrix: React.FC = () => {
  const FRAMEWORKS = [
    {
      authority: 'Reserve Bank of India (RBI)',
      mandate: 'Master Direction on Digital Lending',
      section: 'Circular DOR.CRE.REC.66/21.07.001',
      requirement: 'Mandates end-to-end auditability of borrower consent, fee disclosures (KFS), loan sanctioning algorithms, and collection trail.',
      adyapanProof: 'WORM append-only log with sub-second retrieval. Cryptographically preserves borrower consent timestamps and APR calculations.',
      status: 'Fully Compliant',
    },
    {
      authority: 'Indian Judicial Evidence Standards',
      mandate: 'Indian Evidence Act / BSA',
      section: 'Section 65B Certificate Mandate',
      requirement: 'Electronic records must be certified by an authorized custodian proving unbroken system integrity during evidence production.',
      adyapanProof: 'Generates automated Section 65B evidence certificates backed by FIPS 140-2 Level 3 HSM signatures and machine serial IDs.',
      status: 'Court Admissible',
    },
    {
      authority: 'International Standards Organization',
      mandate: 'ISO/IEC 27001:2022',
      section: 'Annex A.12.4 Logging & Monitoring',
      requirement: 'Event logs recording user activities, exceptions, faults, and information security events must be protected against tampering.',
      adyapanProof: 'Write-Once-Read-Many storage volume locks prohibit administrator modifications. Merkle parent hashing detects bit-level drift.',
      status: 'Audited & Certified',
    },
    {
      authority: 'Basel Committee on Banking Supervision',
      mandate: 'BCBS 239 Risk Traceability',
      section: 'Principles for Risk Data Aggregation',
      requirement: 'Banks must ensure risk data integrity, non-repudiation, and transparent lineage across all credit scoring models.',
      adyapanProof: 'DTI calculations, credit bureau inquiries, and policy adjustments are recorded as discrete versioned events with CRO digital sign-offs.',
      status: 'Enterprise Standard',
    },
  ];

  return (
    <section
      id="regulatory-compliance-matrix"
      className="py-16 sm:py-24 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] border-b border-slate-200"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#155EEF] border border-blue-200 rounded-full text-xs font-semibold tracking-wide">
            <Scale className="w-3.5 h-3.5" />
            <span>STATUTORY COMPLIANCE ARCHITECTURE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-extrabold text-[#071A33] tracking-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Built for Institutional Scrutiny
          </h2>

          <p className="text-base text-slate-600 font-sans">
            Directly mapped to Indian financial directives and international banking risk standards to eliminate regulatory compliance friction.
          </p>
        </div>

        {/* ── COMPLIANCE CARDS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {FRAMEWORKS.map((f) => (
            <div
              key={f.mandate}
              className="p-8 bg-[#F8FAFC] border border-slate-200 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#155EEF] uppercase font-mono">
                    {f.authority}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{f.status}</span>
                  </span>
                </div>

                <h3
                  className="text-xl font-bold text-[#071A33] tracking-tight"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {f.mandate}
                </h3>

                <div className="text-[11px] font-mono text-slate-500">
                  {f.section}
                </div>

                <p className="text-xs text-slate-600 font-sans leading-relaxed">
                  <strong className="text-slate-800">Regulatory Mandate:</strong> {f.requirement}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 text-xs font-sans text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200">
                <strong className="text-[#155EEF] font-mono block text-[11px] uppercase pb-1">
                  Adyapan Architectural Guarantee:
                </strong>
                {f.adyapanProof}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
