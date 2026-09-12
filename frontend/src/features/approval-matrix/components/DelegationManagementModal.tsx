'use client';

import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Plus,
  Trash2,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  useAuthorityDelegations,
  useCreateDelegation,
  useRevokeDelegation,
} from '../hooks/useApprovalMatrix';
import { formatDateTime } from '@/lib/utils';
import { Spinner } from '@/components/ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const DelegationManagementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { data: delegations = [], isLoading } = useAuthorityDelegations();
  const createMutation = useCreateDelegation();
  const revokeMutation = useRevokeDelegation();

  const [isCreating, setIsCreating] = useState(false);
  const [delegateUserId, setDelegateUserId] = useState('');
  const [delegateRole, setDelegateRole] = useState('BRANCH_MANAGER');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState('Annual leave coverage');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegateUserId.trim()) {
      alert('Please provide delegate user ID or identifier.');
      return;
    }

    createMutation.mutate(
      {
        delegateUserId,
        delegateRole,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason,
        scope: 'ALL_SANCTION_AUTHORITY',
      },
      {
        onSuccess: () => {
          setIsCreating(false);
          setDelegateUserId('');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold">Temporary Authority Delegations</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Delegations List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Delegations ({delegations.length})
            </span>
            <button
              onClick={() => setIsCreating(!isCreating)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              {isCreating ? 'Cancel' : 'New Delegation'}
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreate} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3 text-xs">
              <h4 className="font-bold text-indigo-300">Grant Temporary Delegation</h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Delegate User ID / Email</label>
                  <input
                    type="text"
                    required
                    value={delegateUserId}
                    onChange={(e) => setDelegateUserId(e.target.value)}
                    placeholder="user_bm_delegate@adyapan.dev"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Delegate Role</label>
                  <select
                    value={delegateRole}
                    onChange={(e) => setDelegateRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  >
                    <option value="BRANCH_MANAGER">Branch Manager</option>
                    <option value="UNDERWRITER">Senior Underwriter</option>
                    <option value="CREDIT_HEAD">Credit Head</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Justification Reason</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {createMutation.isPending ? 'Delegating Authority...' : 'Grant Authority Delegation'}
              </button>
            </form>
          )}

          {isLoading ? (
            <div className="text-center py-6">
              <Spinner size="md" />
            </div>
          ) : delegations.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No active or historical authority delegations found.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto">
              {delegations.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{d.delegatorName}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-bold text-indigo-300">{d.delegateName}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          d.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Period: {new Date(d.startDate).toLocaleDateString()} – {new Date(d.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-slate-500 italic">Reason: {d.reason}</p>
                  </div>

                  {d.status === 'ACTIVE' && (
                    <button
                      onClick={() => revokeMutation.mutate(d.id)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
