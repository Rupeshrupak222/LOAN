'use client';

import React, { useState } from 'react';
import {
  Database,
  Lock,
  ShieldCheck,
  Activity,
  FileCheck,
  Layers,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Play,
  RotateCcw
} from 'lucide-react';

export const CoreAuditStackSuite: React.FC = () => {
  // Interactive states for specific capability visualizers
  const [isTampered, setIsTampered] = useState(false);
  const [verifyState, setVerifyState] = useState<'IDLE' | 'CHECKING' | 'VALIDATING' | 'VERIFIED'>('IDLE');

  const handleRunVerify = () => {
    if (verifyState !== 'IDLE' && verifyState !== 'VERIFIED') return;
    setVerifyState('CHECKING');
    setTimeout(() => {
      setVerifyState('VALIDATING');
      setTimeout(() => {
        setVerifyState('VERIFIED');
      }, 450);
    }, 450);
  };

  return (
    <section
      id="core-audit-stack"
      className="py-16 sm:py-24 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] border-b border-slate-200"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-[1400px] mx-auto space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#155EEF] border border-blue-200 rounded-full text-xs font-semibold tracking-wide">
            <span>UNIFIED FINANCIAL FORENSICS ARCHITECTURE</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-extrabold text-[#071A33] tracking-tight leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Banking. Lending. Compliance. <br />
            <span className="text-[#155EEF]">The Complete Audit Suite</span>
          </h2>

          <p className="text-base text-slate-600 font-sans">
            Modular, high-throughput financial infrastructure covering event ingestion, hardware WORM locking, cryptographic lineage, and automated regulatory reporting.
          </p>
        </div>

        {/* ── 6 NUMBERED CAPABILITY SUITES ── */}
        <div className="space-y-12">
          {/* ────────────────── MODULE 01 ────────────────── */}
          <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#155EEF] font-mono">01</div>
              <h3
                className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Core Audit Ingestion Stack
              </h3>
              <p className="text-sm sm:text-base text-slate-600 font-sans leading-relaxed">
                Capture every state transition across high-velocity lending pipelines. Ingests events asynchronously from loan origination systems, payment switches, bureau credit evaluations, and servicing engines with sub-millisecond throughput.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Distributed gRPC & Kafka Event Pipeline:</strong> Buffers up to 100,000 events/sec with zero queue drops and microsecond monotonic ordering.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Strict Proto3 Contract Enforcement:</strong> Automatically rejects malformed or unverified payloads prior to committing to storage.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                <strong className="text-[#155EEF]">AI & Audit Agents:</strong> Ingress Validation Agent, Schema Normalization Agent, Dead-Letter Recovery Agent
              </div>
            </div>

            <div className="lg:col-span-5 p-6 bg-[#071A33] text-white rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-[11px] text-slate-400">
                <span>INGRESS TELEMETRY</span>
                <span className="text-emerald-400 font-bold">● ACTIVE BUFFER</span>
              </div>
              <div className="space-y-2 text-slate-200 text-[11px]">
                <div className="flex justify-between"><span>Throughput:</span><span className="text-white font-bold">14,820 events/sec</span></div>
                <div className="flex justify-between"><span>Monotonic Offset:</span><span className="text-cyan-300 font-bold">seq_id: 1048576</span></div>
                <div className="flex justify-between"><span>Proto3 Verification:</span><span className="text-emerald-400 font-bold">100% Validated</span></div>
                <div className="flex justify-between"><span>Clock Precision:</span><span className="text-slate-300">Stratum-1 NTP (±0.05µs)</span></div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                PROVABLE LOGICAL CLOCKS ENFORCE ABSOLUTE CAUSALITY
              </div>
            </div>
          </div>

          {/* ────────────────── MODULE 02 ────────────────── */}
          <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#155EEF] font-mono">02</div>
              <h3
                className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Hardware-Enforced WORM Storage
              </h3>
              <p className="text-sm sm:text-base text-slate-600 font-sans leading-relaxed">
                Write-Once-Read-Many (WORM) hardware storage compliance locks guarantee that once an audit record is committed, it cannot be modified, overwritten, or deleted by any administrative account or database operator.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>AWS S3 Object Lock Compliance Mode:</strong> Immutable retention locks cannot be circumvented even with AWS root account credentials.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Statutory 8-Year Legal Hold:</strong> Automatically satisfies RBI Digital Lending compliance lifecycle retention policies.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                <strong className="text-[#155EEF]">AI & Audit Agents:</strong> Retention Schedule Enforcer, Hardware Write-Lock Monitor, Storage Sanitization Auditor
              </div>
            </div>

            <div className="lg:col-span-5 p-6 bg-[#071A33] text-white rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-[11px] text-slate-400">
                <span>STORAGE POLICY CONTROLS</span>
                <span className="text-cyan-300 font-bold flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> OBJECT LOCKED</span>
              </div>
              <div className="space-y-2 text-slate-200 text-[11px]">
                <div className="flex justify-between"><span>Lock Mode:</span><span className="text-white font-bold">COMPLIANCE (STRICT)</span></div>
                <div className="flex justify-between"><span>Retain Until:</span><span className="text-cyan-300 font-bold">2034-09-03 UTC</span></div>
                <div className="flex justify-between"><span>Bypass Governance:</span><span className="text-rose-400 font-bold">DISABLED (HARDWARE)</span></div>
                <div className="flex justify-between"><span>Replication:</span><span className="text-slate-300">Triple-Zone Sync Mirror</span></div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                SQL UPDATE AND DELETE COMMANDS HARD-REJECTED AT DISK LAYER
              </div>
            </div>
          </div>

          {/* ────────────────── MODULE 03 ────────────────── */}
          <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#155EEF] font-mono">03</div>
              <h3
                className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Cryptographic Merkle Lineage
              </h3>
              <p className="text-sm sm:text-base text-slate-600 font-sans leading-relaxed">
                Every record embeds the cryptographic hash of its predecessor, creating a forward-only Merkle chain. Any retroactive edit immediately alters downstream lineage references, making tampering mathematically impossible to conceal.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Deterministic SHA-256 Digest:</strong> Generates unique cryptographic fingerprints over payload, timestamp, and actor identity.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Cascading Discrepancy Detection:</strong> Modifying a single character invalidates the Merkle root across all downstream entries.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                <strong className="text-[#155EEF]">AI & Audit Agents:</strong> Merkle Tree Lineage Agent, Checksum Drift Auditor, Payload Hash Integrity Agent
              </div>
            </div>

            {/* Interactive Tamper Simulation Card */}
            <div className="lg:col-span-5 p-6 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-[11px]">
                <span className="text-slate-400">INTEGRITY SIMULATOR</span>
                <button
                  type="button"
                  onClick={() => setIsTampered(!isTampered)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    isTampered ? 'bg-cyan-400 text-slate-950' : 'bg-rose-600 text-white hover:bg-rose-500'
                  }`}
                >
                  {isTampered ? 'Restore Canonical State' : 'Simulate Modification'}
                </button>
              </div>

              <div className="p-3 bg-[#071A33] border border-slate-800 rounded space-y-1 text-[11px]">
                <div className="text-slate-400 text-[10px]">EVENT #00184 // PAYMENT_RECORDED</div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <strong className={isTampered ? 'text-rose-400 line-through' : 'text-emerald-400'}>
                    ₹4,250.00
                  </strong>
                </div>
                {isTampered && (
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>Attempted Alteration:</span>
                    <span>₹7,250.00</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Digest:</span>
                  <span className={isTampered ? 'text-rose-400 font-bold' : 'text-cyan-300'}>
                    {isTampered ? 'B4E1 91AF 88C2 (MISMATCH)' : '72C1 19F4 4A8C (VALID)'}
                  </span>
                </div>
              </div>

              <div className={`p-2.5 rounded text-[10px] ${isTampered ? 'bg-rose-950/80 text-rose-300 border border-rose-500/80' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/80'}`}>
                {isTampered ? (
                  <span className="font-bold flex items-center gap-1.5"><AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0" /> Downstream Merkle lineage invalidated. Tamper alarm triggered.</span>
                ) : (
                  <span className="font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Merkle lineage unbroken. 100% mathematical consistency.</span>
                )}
              </div>
            </div>
          </div>

          {/* ────────────────── MODULE 04 ────────────────── */}
          <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#155EEF] font-mono">04</div>
              <h3
                className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                On-Demand History Verification
              </h3>
              <p className="text-sm sm:text-base text-slate-600 font-sans leading-relaxed">
                Empower risk officers, internal audit committees, and statutory regulators to run sub-second parity verifications across any historical sequence of events without slowing down production transactions.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>FIPS 140-2 Level 3 HSM Digital Signatures:</strong> Ed25519 signatures cryptographically prove authenticity without exposing private root keys.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Automated Reconciliation Workflows:</strong> Runs scheduled hourly Merkle parity checks across all multi-region data nodes.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                <strong className="text-[#155EEF]">AI & Audit Agents:</strong> Real-Time Verification Agent, Multi-Zone Parity Reconciler, Certificate Attestation Agent
              </div>
            </div>

            {/* Interactive Verification Bench */}
            <div className="lg:col-span-5 p-6 bg-[#071A33] text-white rounded-xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-[11px]">
                <span className="text-slate-400">VERIFICATION ENGINE</span>
                <button
                  type="button"
                  onClick={handleRunVerify}
                  disabled={verifyState !== 'IDLE' && verifyState !== 'VERIFIED'}
                  className="px-3 py-1 bg-[#155EEF] hover:bg-blue-600 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{verifyState === 'IDLE' || verifyState === 'VERIFIED' ? 'Run Verification' : 'Verifying...'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className={`p-2 rounded border ${verifyState === 'CHECKING' ? 'bg-cyan-950 border-cyan-400 text-cyan-300' : 'bg-[#0A1628] border-slate-800 text-slate-400'}`}>
                  1. Scan WORM Sectors
                </div>
                <div className={`p-2 rounded border ${verifyState === 'VALIDATING' ? 'bg-cyan-950 border-cyan-400 text-cyan-300' : 'bg-[#0A1628] border-slate-800 text-slate-400'}`}>
                  2. Parent Hash Check
                </div>
                <div className={`p-2 rounded border ${verifyState === 'VERIFIED' ? 'bg-emerald-950 border-emerald-400 text-emerald-300' : 'bg-[#0A1628] border-slate-800 text-slate-400'}`}>
                  3. HSM Signatures
                </div>
                <div className={`p-2 rounded border ${verifyState === 'VERIFIED' ? 'bg-emerald-950 border-emerald-400 text-emerald-300' : 'bg-[#0A1628] border-slate-800 text-slate-400'}`}>
                  4. Parity Complete
                </div>
              </div>

              <div className="p-2.5 bg-[#0A1628] border border-slate-700 rounded text-[11px] flex items-center justify-between">
                <span>Result:</span>
                <span className={`font-bold ${verifyState === 'VERIFIED' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {verifyState === 'VERIFIED' ? '100% VERIFIED (0 ANOMALIES)' : 'READY TO EXECUTE'}
                </span>
              </div>
            </div>
          </div>

          {/* ────────────────── MODULE 05 ────────────────── */}
          <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#155EEF] font-mono">05</div>
              <h3
                className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Statutory Compliance & Legal Admissibility
              </h3>
              <p className="text-sm sm:text-base text-slate-600 font-sans leading-relaxed">
                Generate Section 65B Certificates of Electronic Evidence formatted for Indian judicial proceedings. Meets all Reserve Bank of India Master Directions on Digital Lending and ISO 27001 Annex A.12.4 requirements out of the box.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Section 65B Electronic Admissibility:</strong> Automatically binds custodian officer digital signatures and machine serial IDs to forensic exports.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>RFC 3161 Trusted Timestamps:</strong> Third-party Time Stamping Authority (TSA) proves records existed at a deterministic historical instant.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                <strong className="text-[#155EEF]">AI & Audit Agents:</strong> Section 65B Legal Evidence Agent, Regulatory Reporting Agent, TSA Certificate Monitor
              </div>
            </div>

            <div className="lg:col-span-5 p-6 bg-[#071A33] text-white rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-[11px] text-slate-400">
                <span>STATUTORY COMPLIANCE BUNDLE</span>
                <span className="text-emerald-400 font-bold">✓ COURT ADMISSIBLE</span>
              </div>
              <div className="space-y-1.5 text-slate-200 text-[11px]">
                <div className="flex justify-between"><span>Evidence Act:</span><span className="text-cyan-300 font-bold">Section 65B Admissible</span></div>
                <div className="flex justify-between"><span>RBI Lending Directives:</span><span className="text-white font-bold">Master Circular Aligned</span></div>
                <div className="flex justify-between"><span>ISO Certification:</span><span className="text-emerald-400 font-bold">ISO 27001 Annex A.12.4</span></div>
                <div className="flex justify-between"><span>Audit Export Format:</span><span className="text-slate-300">Signed JSON-LD / Encrypted PDF</span></div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                MEETS INDIAN JUDICIAL STANDARDS FOR ELECTRONIC FINANCIAL RECORDS
              </div>
            </div>
          </div>

          {/* ────────────────── MODULE 06 ────────────────── */}
          <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-2xl shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 text-left">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#155EEF] font-mono">06</div>
              <h3
                className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Cross-Subsystem Unified History Rail
              </h3>
              <p className="text-sm sm:text-base text-slate-600 font-sans leading-relaxed">
                Break operational silos. Rather than maintaining disparate logs across loan origination, card management, UPI autopay debits, and credit policy updates, Adyapan streams all events into a unified, queryable chronological rail.
              </p>

              <div className="space-y-2 pt-2">
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Universal Forensic Search:</strong> Trace loan accounts, transaction IDs, bureau scores, or policy versions across all microservices.</span>
                </div>
                <div className="flex items-start gap-3 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span><strong>Instant Regulatory Audit Export:</strong> Generate verifiable audit dossiers for central bank inspections in seconds.</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700">
                <strong className="text-[#155EEF]">AI & Audit Agents:</strong> Forensic Search Agent, Cross-Rail Reconciler, Audit Trail Export Agent
              </div>
            </div>

            <div className="lg:col-span-5 p-6 bg-[#071A33] text-white rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-[11px] text-slate-400">
                <span>CROSS-SUBSYSTEM AGGREGATOR</span>
                <span className="text-cyan-300 font-bold">6 INGRESS RAILS</span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <div className="flex justify-between py-0.5 border-b border-slate-800"><span>1. Loan Origination:</span><span className="text-emerald-400 font-bold">STREAMING</span></div>
                <div className="flex justify-between py-0.5 border-b border-slate-800"><span>2. Underwriting & DTI:</span><span className="text-emerald-400 font-bold">STREAMING</span></div>
                <div className="flex justify-between py-0.5 border-b border-slate-800"><span>3. UPI & Payments Rail:</span><span className="text-emerald-400 font-bold">STREAMING</span></div>
                <div className="flex justify-between py-0.5 border-b border-slate-800"><span>4. Document e-Sign:</span><span className="text-emerald-400 font-bold">STREAMING</span></div>
                <div className="flex justify-between py-0.5 border-b border-slate-800"><span>5. LMS Servicing:</span><span className="text-emerald-400 font-bold">STREAMING</span></div>
                <div className="flex justify-between py-0.5"><span>6. Dispute & Recovery:</span><span className="text-emerald-400 font-bold">STREAMING</span></div>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                SINGLE TIME-ORDERED TRUTH • ZERO SILOED RECONCILIATION
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
