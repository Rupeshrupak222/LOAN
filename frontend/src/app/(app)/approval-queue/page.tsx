'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Inbox,
  UserCheck,
  Plus,
} from 'lucide-react';
import {
  ApprovalQueueView,
  DelegationManagementModal,
} from '@/features/approval-matrix';

export default function ApprovalQueuePage() {
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 shadow-inner">
            <Inbox className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">
                Approval Authority Queue
              </h1>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Phase 3 Production
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Manage loan proposals pending your delegated sanction authority. Review credit profiles,
              BRE decisions, and execute Approve, Send Back, Reject, or Escalation actions.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDelegationModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all self-start md:self-center"
        >
          <UserCheck className="w-4 h-4 text-indigo-400" />
          Manage Delegations
        </button>
      </div>

      {/* Main Approval Queue Component */}
      <ApprovalQueueView />

      {/* Temporary Delegation Modal */}
      <DelegationManagementModal
        isOpen={isDelegationModalOpen}
        onClose={() => setIsDelegationModalOpen(false)}
      />
    </div>
  );
}
