'use client';

import React, { useState } from 'react';
import {
  Lock,
  UserCheck,
  FileCheck,
  AlertOctagon,
  MessageSquare,
  Plus,
  ArrowRight,
  Clock,
  ShieldAlert,
  Send,
  Upload,
} from 'lucide-react';
import { FraudCase, FraudCaseStatus } from '../types';
import { assignFraudCase, addFraudCaseEvidence, addFraudCaseNote, resolveFraudCase } from '../api';
import { useToast } from '@/lib/toast';

interface FraudCaseDeskProps {
  fraudCase: FraudCase;
  onRefresh: () => void;
}

const STATUS_STEPS: FraudCaseStatus[] = ['OPEN', 'IN_REVIEW', 'ESCALATED', 'CLEARED', 'CONFIRMED_FRAUD', 'CLOSED'];

export function FraudCaseDesk({ fraudCase, onRefresh }: FraudCaseDeskProps) {
  const toast = useToast();
  const [noteText, setNoteText] = useState('');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [evidenceType, setEvidenceType] = useState('BANK_STATEMENT');
  const [resolveReason, setResolveReason] = useState('');
  const [resolveType, setResolveType] = useState<'CLEARED' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'REJECTED_LOAN'>('CLEARED');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      await addFraudCaseNote(fraudCase.id, noteText);
      toast.success('Investigation note appended to timeline.', 'Note Added');
      setNoteText('');
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add note');
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTitle.trim() || !evidenceDesc.trim()) return;

    try {
      await addFraudCaseEvidence(fraudCase.id, {
        type: evidenceType,
        title: evidenceTitle,
        description: evidenceDesc,
      });
      toast.success('Evidence document registered to case file.', 'Evidence Attached');
      setEvidenceTitle('');
      setEvidenceDesc('');
      setShowEvidenceModal(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to attach evidence');
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveReason.trim() || resolveReason.trim().length < 5) {
      toast.error('Please provide a clear justification of at least 5 characters.', 'Resolution Reason Required');
      return;
    }

    setSubmitting(true);
    try {
      await resolveFraudCase(fraudCase.id, {
        resolution: resolveType,
        reason: resolveReason,
      });
      toast.success(`Fraud case resolved with outcome ${resolveType}.`, 'Case Resolved');
      setShowResolveModal(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Resolution failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Case Header Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Case #{fraudCase.caseNo}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    fraudCase.status === 'CONFIRMED_FRAUD'
                      ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                      : fraudCase.status === 'CLEARED'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                  }`}
                >
                  {fraudCase.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Application #{fraudCase.applicationNo} • Customer #{fraudCase.customerCode} ({fraudCase.customerName})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEvidenceModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Attach Evidence
            </button>
            {fraudCase.status !== 'CLEARED' && fraudCase.status !== 'CONFIRMED_FRAUD' && (
              <button
                onClick={() => setShowResolveModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-sm shadow-rose-600/30 transition-colors"
              >
                <Lock className="h-3.5 w-3.5" />
                Resolve Case
              </button>
            )}
          </div>
        </div>

        {/* Case Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Assigned Investigator</span>
            <strong className="text-slate-800 dark:text-slate-200 font-bold">{fraudCase.assignedToName || 'Unassigned Queue'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Fraud Score</span>
            <strong className="text-rose-600 dark:text-rose-400 font-black">{fraudCase.fraudScore}/100</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">System Risk Score</span>
            <strong className="text-slate-800 dark:text-slate-200 font-bold">{fraudCase.riskScore}/100</strong>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Created On</span>
            <strong className="text-slate-800 dark:text-slate-200">{new Date(fraudCase.createdAt).toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Main Workbench Grid: Timeline & Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timeline & Notes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Investigation Timeline & Analyst Notes
            </h4>

            {/* Note Input Box */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <textarea
                rows={2}
                placeholder="Log field investigation observations, verification calls, or suspect findings..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!noteText.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 disabled:opacity-40 flex items-center gap-1.5"
                >
                  <Send className="h-3 w-3" />
                  Append Note
                </button>
              </div>
            </form>

            {/* Timeline Item List */}
            <div className="space-y-3 pt-2">
              {fraudCase.notes?.map((note) => (
                <div
                  key={note.id}
                  className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {note.userName} <span className="text-slate-400 font-normal">({note.userRole})</span>
                    </span>
                    <span className="text-slate-400">{new Date(note.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {note.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Evidence Register */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-slate-400" />
                Evidence Vault ({fraudCase.evidence?.length || 0})
              </h4>
            </div>

            {fraudCase.evidence?.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                No formal evidence artifacts attached yet. Click 'Attach Evidence' to record proof.
              </div>
            ) : (
              <div className="space-y-2.5">
                {fraudCase.evidence?.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{ev.title}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-600">
                        {ev.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{ev.description}</p>
                    <span className="text-[10px] text-slate-400 block pt-1">
                      By {ev.addedBy} • {new Date(ev.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Attach Investigation Evidence</h4>
            <form onSubmit={handleAddEvidence} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Evidence Type</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="BANK_STATEMENT">Bank Statement / Passbook</option>
                  <option value="DEVICE_FINGERPRINT">Device Fingerprint Log</option>
                  <option value="IP_LOOKUP">IP Geolocation & ISP Report</option>
                  <option value="IDENTITY_GRAPH">Identity Cluster Snapshot</option>
                  <option value="DOCUMENT">KYC / Identity Artifact</option>
                  <option value="EXTERNAL_REPORT">Third-Party Bureau / AML Report</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Cancelled Cheque Name Verification"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Description / Summary</label>
                <textarea
                  rows={3}
                  placeholder="Details of evidence..."
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white"
                >
                  Attach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Resolve Fraud Investigation Case</h4>
            <form onSubmit={handleResolve} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Resolution Outcome</label>
                <select
                  value={resolveType}
                  onChange={(e) => setResolveType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="CLEARED">CLEARED — False Alarm / Validated Genuine</option>
                  <option value="FALSE_POSITIVE">FALSE_POSITIVE — Rule Exception</option>
                  <option value="CONFIRMED_FRAUD">CONFIRMED_FRAUD — Fraudulent Profile / Blacklist</option>
                  <option value="REJECTED_LOAN">REJECTED_LOAN — Unverifiable Profile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Resolution Justification Reason</label>
                <textarea
                  rows={3}
                  placeholder="Detailed rationale for case closure..."
                  value={resolveReason}
                  onChange={(e) => setResolveReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white disabled:opacity-50"
                >
                  {submitting ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
