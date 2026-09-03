'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle2, ShieldCheck, Hash, Shield, Key } from 'lucide-react';

export const RecordAnatomyDocument: React.FC = () => {
  const [selectedField, setSelectedField] = useState(0);

  const FIELDS = [
    {
      label: '01 / EVENT ID',
      value: 'SIM-EVT-2026-09-03-000184-ADY-PROD',
      spec: 'Global Unique Monotonic Identifier',
      desc: 'Combines microsecond epoch timestamp with worker partition ID and cryptographic nonce. Guarantees global uniqueness across multi-region cloud deployments without distributed lock contention.',
      impact: 'Enables deterministic sorting and direct key-value index lookups in sub-millisecond audit retrievals.',
    },
    {
      label: '02 / EVENT TYPE',
      value: 'PAYMENT_RECORDED // EMI_CLEARING',
      spec: 'Strict Categorical Schema Classifier',
      desc: 'Declared in protobuf / JSON-schema contracts. Strictly version-governed to prevent schema drift and ensure regulatory analyzers can parse historical entries decades later without amnesia.',
      impact: 'Routes events to specific compliance aggregators, accounting sub-ledgers, and credit bureau report generators.',
    },
    {
      label: '03 / ACTOR ATTRIBUTION',
      value: 'SYSTEM / CLEARING_BUS_V2 (CN=adyapan-clearing-agent-04)',
      spec: 'Mutual TLS & Service Account Provenance',
      desc: 'Captures the cryptographically attested identity of the initiating actor: whether an automated background daemon, a senior underwriter, an external banking API, or a borrower through mobile SDK.',
      impact: 'Guarantees absolute non-repudiation. Prevents anonymous or uncredited financial ledger adjustments.',
    },
    {
      label: '04 / HIGH-PRECISION TIMESTAMP',
      value: '2026-09-03T12:41:08.419082Z (RFC 3339 / ISO 8601)',
      spec: 'Stratum-1 Atomic NTP Clock Reference',
      desc: 'Recorded at the instant the write engine locks the payload into memory before disk commit. Synchronized across nodes using Stratum-1 atomic NTP servers to eliminate clock drift.',
      impact: 'Enables absolute causality reconstruction during disputed transaction investigations and interest accrual audits.',
    },
    {
      label: '05 / ACTION VERB',
      value: 'COMMIT_FACILITY_EMI // REDUCE_PRINCIPAL_BALANCE',
      spec: 'Domain-Driven State Transition Directive',
      desc: 'The exact semantic verb executed by the core lending platform. Details precisely how the event modified the state of the loan, collateral, or borrower exposure.',
      impact: 'Allows exact state reconstitution from genesis through full deterministic replay of historical events.',
    },
    {
      label: '06 / INGESTION SOURCE',
      value: 'UPI_COLLECT_GATEWAY (ENDPOINT: ip-10-0-12-84 / AZ-SOUTH-1A)',
      spec: 'Network Origin & Gateway Telemetry',
      desc: 'Records network transport protocol (gRPC with TLS 1.3), edge ingress IP, cloud availability zone, and gateway request ID for comprehensive network-level forensics.',
      impact: 'Enables cyber-forensic teams to correlate application ledger events with infrastructure firewall and edge logs.',
    },
    {
      label: '07 / STORAGE STATUS',
      value: 'SEALED & COMMITTED (WORM VOLUME: VOL-PROD-AUDIT-08)',
      spec: 'Write-Once-Read-Many Hardware Lock',
      desc: 'Confirms that the record has been written to immutable cloud object storage with Object Lock retention enabled in compliance mode. Cannot be overwritten or deleted even by root credentials.',
      impact: 'Satisfies SEC Rule 17a-4, RBI Digital Lending, and FINRA regulatory immutability standards.',
    },
    {
      label: '08 / PREVIOUS RECORD POINTER',
      value: 'sha256:7f9d8a12e443c08b...99e1 (EVENT #000183)',
      spec: 'Cryptographic Merkle Lineage Link',
      desc: 'The cryptographic hash of the immediate predecessor event. Forms a continuous, forward-only Merkle chain where altering any historical entry invalidates every subsequent record hash.',
      impact: 'Provides mathematical certainty that no records were deleted, inserted out of order, or retroactively spliced.',
    },
    {
      label: '09 / SCHEMA VERSION CONTRACT',
      value: 'v2.4.1 REGULATORY DIGITAL LENDING SPECIFICATION',
      spec: 'Statutory Data Contract Compliance',
      desc: 'References the precise version of Adyapan’s data dictionary in effect when the event was committed. Dictates mandatory regulatory tags, PII masking rules, and tax reporting requirements.',
      impact: 'Ensures external audit software can correctly deserialize and validate data structures from years in the past.',
    },
    {
      label: '10 / INTEGRITY SIGNATURE MARKER',
      value: 'ed25519:5c03a9f4e28c701b3d88194...72c1 (HSM-PRIMARY)',
      spec: 'Hardware Security Module Digital Attestation',
      desc: 'An Ed25519 digital signature generated over the serialized canonical payload using a FIPS 140-2 Level 3 Hardware Security Module (HSM) private key.',
      impact: 'Provides third-party auditors and regulatory inspectors with mathematical proof that the record originated from Adyapan’s authentic core.',
    },
  ];

  const currentField = FIELDS[selectedField];

  return (
    <section
      id="section-record-anatomy"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-left space-y-3 pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <FileText className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>RECORD ANATOMY // 10 FORENSIC ATTRIBUTES</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            WHAT DOES A RECORD <br />
            <span className="text-[#155EEF]">ACTUALLY CONTAIN?</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl font-normal leading-relaxed">
            Every audit entry is a self-contained, cryptographically signed forensic document. Inspect the 10 structural dimensions that ensure institutional compliance, legal admissibility, and tamper-evidence.
          </p>
        </div>

        {/* ── THE EXPANDED FORENSIC RECORD DOCUMENT ── */}
        <div className="p-8 sm:p-12 bg-[#F8FAFC] border-2 border-slate-900 shadow-2xl space-y-6 text-left">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-2 border-slate-900 text-xs font-mono">
            <span className="font-bold text-[#071A33] uppercase">
              STRUCTURED AUDIT ENTRY ATTRIBUTES (SELECT FIELD TO INSPECT)
            </span>
            <span className="text-slate-500">
              SCHEMA SPECIFICATION v2.4.1
            </span>
          </div>

          {/* 10 Vertical Document Fields */}
          <div className="space-y-2 font-mono">
            {FIELDS.map((f, idx) => {
              const isSelected = selectedField === idx;

              return (
                <div
                  key={f.label}
                  onClick={() => setSelectedField(idx)}
                  className={`p-4 border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-[#071A33] text-white border-[#071A33] shadow-md -translate-x-1'
                      : 'bg-white text-[#071A33] border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase">
                      {f.label} • <strong className={isSelected ? 'text-cyan-300' : 'text-[#155EEF]'}>{f.spec}</strong>
                    </span>
                    <div className="text-sm font-bold tracking-tight">
                      {f.value}
                    </div>
                  </div>

                  <div className="text-xs text-slate-400 sm:text-right shrink-0">
                    {isSelected ? 'ACTIVE INSPECTION' : 'INSPECT'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deep Architectural Inspector Drawer */}
          <div className="pt-6 border-t-2 border-slate-900 font-mono text-xs space-y-3 bg-white p-6 border border-slate-200">
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold border-b border-slate-200 pb-2">
              <span>FORENSIC FIELD SPECIFICATION // {currentField.label}</span>
              <span className="text-[#155EEF]">ARCHITECTURAL SIGNIFICANCE</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">DESCRIPTION</span>
                <p className="text-slate-800 leading-relaxed font-sans text-xs">
                  {currentField.desc}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">AUDIT & COMPLIANCE IMPACT</span>
                <p className="text-slate-900 font-bold leading-relaxed font-sans text-xs">
                  {currentField.impact}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
