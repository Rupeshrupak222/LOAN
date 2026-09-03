'use client';

import React, { useState } from 'react';
import { Search, Filter, Lock, ChevronDown, ChevronUp, CheckCircle2, Terminal } from 'lucide-react';

export const LiveAuditExplorerConsole: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('#00184');

  const CATEGORIES = ['ALL', 'LENDING', 'UPI PAYMENTS', 'POLICY ENGINE', 'KYC SUITE', 'COMPLIANCE'];

  const AUDIT_RECORDS = [
    {
      id: '#00184',
      cat: 'UPI PAYMENTS',
      action: 'PAYMENT_RECORDED',
      actor: 'CLEARING_BUS',
      amount: '₹4,250.00',
      time: '12:41:08 UTC',
      fp: '72C1 19F4 4A8C',
      prev: '#00183',
      schema: 'ADY-PAY-v2.4',
      detail: 'Borrower installment cleared via UPI AutoPay mandate (UMRN20260903001). Settlement pool dispatched to partner bank escrow.',
      rawJson: {
        event_id: '00184',
        account: 'LN-20481',
        amount_inr: 4250.0,
        gateway: 'NPCI_UPI_AUTOPAY',
        rrn: '624109844210',
        hsm_signature: 'ed25519:7c03a9f4e2...',
      },
    },
    {
      id: '#00183',
      cat: 'POLICY ENGINE',
      action: 'DTI_SANCTION_COMMITTED',
      actor: 'RULE_ENGINE',
      amount: 'DTI: 33.75%',
      time: '12:40:55 UTC',
      fp: '9C3A 667F 110E',
      prev: '#00182',
      schema: 'ADY-RISK-v3.1',
      detail: 'Automated debt-to-income risk evaluation passed against 40.0% board-mandated ceiling. Facility cap approved at ₹50,000.',
      rawJson: {
        event_id: '00183',
        applicant_pan: 'ABCDE1234F',
        dti_ratio: 0.3375,
        threshold_cap: 0.4,
        decision: 'APPROVED',
      },
    },
    {
      id: '#00182',
      cat: 'KYC SUITE',
      action: 'KYC_DIGITAL_ATTEST',
      actor: 'KYC_ORCHESTRATOR',
      amount: 'PAN VERIFIED',
      time: '12:40:02 UTC',
      fp: 'E8F1 112C 8821',
      prev: '#00181',
      schema: 'ADY-KYC-v1.9',
      detail: 'UIDAI biometric XML proof validated and signed. Verified zero duplicate borrower profile in bureau tradeline registry.',
      rawJson: {
        event_id: '00182',
        uidai_ref: 'XML-2026-09-03',
        pan_status: 'ACTIVE_VALID',
        sanctions_screening: 'CLEAR',
      },
    },
    {
      id: '#00181',
      cat: 'LENDING',
      action: 'LOAN_AGREEMENT_ESIGN',
      actor: 'BORROWER_APP',
      amount: 'FACILITY ₹50K',
      time: '12:39:45 UTC',
      fp: 'B2D4 908A 33F0',
      prev: '#00180',
      schema: 'ADY-LEGAL-v2.0',
      detail: 'Key Fact Statement (KFS) and sanction letter executed with Aadhaar OTP e-Sign. Nonce verified against UIDAI gateway.',
      rawJson: {
        event_id: '00181',
        contract_id: 'DOC-50192',
        esign_provider: 'NSDL_EGOV',
        timestamp_authority: 'CERT-IN_TSA',
      },
    },
    {
      id: '#00180',
      cat: 'COMPLIANCE',
      action: 'KFS_DISCLOSURE_SEALED',
      actor: 'COMPLIANCE_DESK',
      amount: 'APR: 14.5%',
      time: '12:38:12 UTC',
      fp: 'A7C9 41E0 9942',
      prev: '#00179',
      schema: 'ADY-COMP-v4.2',
      detail: 'Statutory Key Fact Statement signed and archived per RBI Digital Lending Guidelines. Zero hidden fees certified.',
      rawJson: {
        event_id: '00180',
        apr_disclosed: 14.5,
        processing_fee: 500.0,
        rbi_disclosure_version: '2026.1',
      },
    },
  ];

  const filtered = AUDIT_RECORDS.filter((r) => {
    const matchesCat = selectedCat === 'ALL' || r.cat === selectedCat;
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.amount.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <section
      id="live-audit-explorer"
      className="py-16 sm:py-24 px-4 sm:px-8 lg:px-12 bg-[#F8FAFC] text-[#071A33] border-b border-slate-200"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 text-left">
          <div className="space-y-2 max-w-xl">
            <span className="text-xs font-semibold text-[#155EEF] uppercase tracking-wide">
              OPERATIONAL FORENSIC EXPLORER
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-[#071A33] tracking-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Search & Verify the Immutable Trail
            </h2>
            <p className="text-sm text-slate-600 font-sans">
              Filter by transaction stream or execute high-speed sub-millisecond queries across historical audit blocks.
            </p>
          </div>

          <div className="w-full md:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event, actor, or ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#155EEF]"
            />
          </div>
        </div>

        {/* Category Pills Rail */}
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCat === cat
                  ? 'bg-[#155EEF] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* High-Density Records Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Event ID</th>
                  <th className="py-3.5 px-4 font-bold">Category</th>
                  <th className="py-3.5 px-4 font-bold">Action</th>
                  <th className="py-3.5 px-4 font-bold">Initiating Actor</th>
                  <th className="py-3.5 px-4 font-bold">Payload Val</th>
                  <th className="py-3.5 px-4 font-bold">Timestamp</th>
                  <th className="py-3.5 px-4 font-bold">SHA-256 Digest</th>
                  <th className="py-3.5 px-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const isExpanded = expandedId === item.id;

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                          isExpanded ? 'bg-blue-50/60 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-extrabold text-[#155EEF]">{item.id}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {item.cat}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.action}</td>
                        <td className="py-3.5 px-4 text-slate-600">{item.actor}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.amount}</td>
                        <td className="py-3.5 px-4 text-slate-500">{item.time}</td>
                        <td className="py-3.5 px-4 text-cyan-700 font-bold">{item.fp}</td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">
                            <Lock className="w-3 h-3 text-emerald-600" />
                            <span>SEALED</span>
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Drawer Details */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90">
                          <td colSpan={8} className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                              <div className="lg:col-span-7 space-y-3 font-sans">
                                <div className="text-xs font-bold text-[#155EEF] uppercase font-mono">
                                  FORENSIC CONTEXT // {item.id} (PARENT: {item.prev})
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed">
                                  {item.detail}
                                </p>
                                <div className="flex items-center gap-4 text-xs font-mono text-slate-500 pt-1">
                                  <span>Contract Schema: <strong>{item.schema}</strong></span>
                                  <span>Storage Mode: <strong>WORM Object Lock</strong></span>
                                </div>
                              </div>

                              <div className="lg:col-span-5 p-3.5 bg-[#071A33] text-white rounded-lg font-mono text-[11px] space-y-1">
                                <div className="text-[10px] text-slate-400 uppercase pb-1 border-b border-slate-700">
                                  RAW SERIALIZED PAYLOAD CONTRACT
                                </div>
                                <pre className="text-cyan-300 overflow-x-auto text-[10px] leading-tight">
                                  {JSON.stringify(item.rawJson, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
