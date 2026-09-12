'use client';

import React, { useState } from 'react';
import type { GrievanceComplaint } from '../types';
import {
  ShieldAlert,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FileCheck,
  Scale,
  Award,
} from 'lucide-react';

interface Props {
  complaints: GrievanceComplaint[];
  isLoading: boolean;
  onRefresh: () => void;
  onRegisterComplaint: (payload: any) => Promise<void>;
  onResolveComplaint: (id: string, payload: any) => Promise<void>;
}

export const ComplaintsDeskView: React.FC<Props> = ({
  complaints,
  isLoading,
  onRefresh,
  onRegisterComplaint,
  onResolveComplaint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [resolvingComplaint, setResolvingComplaint] = useState<GrievanceComplaint | null>(null);

  // Form State for Registration
  const [formCustId, setFormCustId] = useState('CUST-DEMO-002');
  const [formCustName, setFormCustName] = useState('Meera Patel');
  const [formCustEmail, setFormCustEmail] = useState('meera.p@example.com');
  const [formCustPhone, setFormCustPhone] = useState('+919876543211');
  const [formLoanId, setFormLoanId] = useState('LOAN-2026-8812');
  const [formComplaintType, setFormComplaintType] = useState('Double Debit During Auto-Pay Mandate');
  const [formRootCause, setFormRootCause] = useState('PAYMENT_GATEWAY_DOUBLE_PULL');
  const [formDetails, setFormDetails] = useState('Account was debited twice on auto-pay execution.');
  const [formRemedy, setFormRemedy] = useState('Immediate refund of duplicate debit and waiver of bounce charges.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Resolution
  const [resStatus, setResStatus] = useState<'RESOLVED_SATISFIED' | 'RESOLVED_REJECTED' | 'SETTLED_WITH_CONCESSION'>('RESOLVED_SATISFIED');
  const [resDecision, setResDecision] = useState<'UPHELD' | 'PARTIALLY_UPHELD' | 'REJECTED' | 'SETTLED'>('UPHELD');
  const [resDetails, setResDetails] = useState('Refund processed via nodal escrow account within 24 hours.');
  const [resCompensation, setResCompensation] = useState('4250');

  const filtered = complaints.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = c.complaintNumber.toLowerCase().includes(q);
      const matchCust = c.customerName.toLowerCase().includes(q) || c.customerId.toLowerCase().includes(q);
      const matchType = c.complaintType.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchType) return false;
    }
    return true;
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onRegisterComplaint({
        customerId: formCustId,
        customerName: formCustName,
        customerEmail: formCustEmail,
        customerPhone: formCustPhone,
        loanId: formLoanId,
        complaintType: formComplaintType,
        rootCauseCategory: formRootCause,
        details: formDetails,
        demandedRemedy: formRemedy,
      });
      setIsRegistering(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingComplaint) return;
    setIsSubmitting(true);
    try {
      await onResolveComplaint(resolvingComplaint.id, {
        status: resStatus,
        resolutionDecision: resDecision,
        resolutionDetails: resDetails,
        compensationAmount: resCompensation ? Number(resCompensation) : 0,
      });
      setResolvingComplaint(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Regulatory Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-indigo-400" />
            RBI Grievance Redressal Register & Ombudsman Desk
          </h3>
          <p className="text-xs text-slate-400">
            Mandatory 7-day statutory resolution tracking, root cause categorization, and audit log.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsRegistering(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Register Grievance
          </button>
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Complaint #</th>
                <th className="py-3 px-4">Complainant Details</th>
                <th className="py-3 px-4">Grievance & Root Cause</th>
                <th className="py-3 px-4">Escalation Tier</th>
                <th className="py-3 px-4">Status & Decision</th>
                <th className="py-3 px-4">Target Date (7-Day Clock)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-850/50 transition">
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-white">{c.complaintNumber}</div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(c.registeredAt).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{c.customerName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{c.customerId}</div>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-medium text-slate-200">{c.complaintType}</div>
                    <span className="text-[10px] text-indigo-400 font-mono">{c.rootCauseCategory}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {c.escalationTier}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-xs text-white mb-0.5">{c.status}</div>
                    {c.resolutionDecision ? (
                      <span className="text-[10px] font-mono text-emerald-400">
                        Decision: {c.resolutionDecision}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 italic">Under Review</span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                    {new Date(c.targetResolutionDate).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {!c.resolvedAt ? (
                      <button
                        onClick={() => setResolvingComplaint(c)}
                        className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg transition text-xs font-semibold"
                      >
                        Resolve Grievance
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Grievance Modal */}
      {isRegistering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleRegister}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-400" />
                Register Formal Grievance Complaint
              </h3>
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Customer ID</label>
                  <input
                    type="text"
                    required
                    value={formCustId}
                    onChange={(e) => setFormCustId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={formCustName}
                    onChange={(e) => setFormCustName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Grievance Title / Type</label>
                <input
                  type="text"
                  required
                  value={formComplaintType}
                  onChange={(e) => setFormComplaintType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Root Cause Category</label>
                <select
                  value={formRootCause}
                  onChange={(e) => setFormRootCause(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                >
                  <option value="PAYMENT_GATEWAY_DOUBLE_PULL">Payment Gateway Duplicate Pull</option>
                  <option value="DISBURSEMENT_GATEWAY_TIMEOUT">Disbursement Payout Latency</option>
                  <option value="SERVICING_DELAY">Loan Servicing Delay</option>
                  <option value="COLLECTIONS_CODE_CONDUCT">Collections Agency Conduct</option>
                  <option value="INTEREST_CALCULATION_DISCREPANCY">Interest / Penalty Fee Discrepancy</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Investigation Details</label>
                <textarea
                  rows={3}
                  required
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-xs text-white rounded-lg font-semibold"
              >
                {isSubmitting ? 'Registering...' : 'Register Complaint'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Resolve Grievance Modal */}
      {resolvingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleResolve}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Resolve Grievance: {resolvingComplaint.complaintNumber}
              </h3>
              <button
                type="button"
                onClick={() => setResolvingComplaint(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Status</label>
                  <select
                    value={resStatus}
                    onChange={(e) => setResStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                  >
                    <option value="RESOLVED_SATISFIED">RESOLVED SATISFIED</option>
                    <option value="SETTLED_WITH_CONCESSION">SETTLED WITH CONCESSION</option>
                    <option value="RESOLVED_REJECTED">RESOLVED REJECTED</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Audit Decision</label>
                  <select
                    value={resDecision}
                    onChange={(e) => setResDecision(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                  >
                    <option value="UPHELD">UPHELD (In favor of borrower)</option>
                    <option value="PARTIALLY_UPHELD">PARTIALLY UPHELD</option>
                    <option value="SETTLED">SETTLED (Fee waiver / concession)</option>
                    <option value="REJECTED">REJECTED (No fault found)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Compensation / Fee Waiver Amount (INR)
                </label>
                <input
                  type="number"
                  value={resCompensation}
                  onChange={(e) => setResCompensation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Final Resolution Details</label>
                <textarea
                  rows={3}
                  required
                  value={resDetails}
                  onChange={(e) => setResDetails(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolvingComplaint(null)}
                className="px-4 py-2 bg-slate-800 text-xs text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 text-xs text-white rounded-lg font-semibold"
              >
                {isSubmitting ? 'Resolving...' : 'Commit Formal Resolution'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
