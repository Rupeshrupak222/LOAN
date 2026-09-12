'use client';

import React, { useState } from 'react';
import type {
  SupportCategory,
  SupportPriority,
  SupportTicket,
  TicketStatus,
} from '../types';
import {
  Headphones,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  MessageSquare,
  ShieldAlert,
  ArrowUpRight,
  RefreshCw,
  X,
  FileText,
} from 'lucide-react';

interface Props {
  tickets: SupportTicket[];
  isLoading: boolean;
  onRefresh: () => void;
  onSelectTicket: (ticket: SupportTicket) => void;
  onCreateTicket: (payload: any) => Promise<void>;
}

export const SupportTicketsView: React.FC<Props> = ({
  tickets,
  isLoading,
  onRefresh,
  onSelectTicket,
  onCreateTicket,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // New Ticket Form State
  const [formCustId, setFormCustId] = useState('CUST-DEMO-001');
  const [formCustName, setFormCustName] = useState('Aarav Sharma');
  const [formCustEmail, setFormCustEmail] = useState('aarav.sharma@example.com');
  const [formCustPhone, setFormCustPhone] = useState('+919876543210');
  const [formSubject, setFormSubject] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<SupportCategory>('DISBURSEMENT_QUERY');
  const [formPriority, setFormPriority] = useState<SupportPriority>('HIGH');
  const [formLoanId, setFormLoanId] = useState('LOAN-2026-9182');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = t.ticketNumber.toLowerCase().includes(q);
      const matchCust = t.customerName.toLowerCase().includes(q) || t.customerId.toLowerCase().includes(q);
      const matchSub = t.subject.toLowerCase().includes(q);
      const matchLoan = t.loanId?.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchSub && !matchLoan) return false;
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateTicket({
        customerId: formCustId,
        customerName: formCustName,
        customerEmail: formCustEmail,
        customerPhone: formCustPhone,
        subject: formSubject,
        description: formDescription,
        category: formCategory,
        priority: formPriority,
        loanId: formLoanId,
      });
      setIsCreating(false);
      setFormSubject('');
      setFormDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (prio: SupportPriority) => {
    switch (prio) {
      case 'URGENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            OPEN
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            IN PROGRESS
          </span>
        );
      case 'WAITING_FOR_CUSTOMER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            WAITING ON CUSTOMER
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            RESOLVED
          </span>
        );
      case 'CLOSED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
            CLOSED
          </span>
        );
      case 'ESCALATED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            🔥 ESCALATED
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Action and Filter Toolbar */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ticket #, customer, loan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_CUSTOMER">Waiting on Customer</option>
              <option value="RESOLVED">Resolved</option>
              <option value="ESCALATED">Escalated</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
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
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            Create Ticket
          </button>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Ticket Number</th>
                <th className="py-3 px-4">Borrower Details</th>
                <th className="py-3 px-4">Subject & Category</th>
                <th className="py-3 px-4">Priority / Status</th>
                <th className="py-3 px-4">SLA Breach Tracking</th>
                <th className="py-3 px-4">Assigned Agent</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No support tickets found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((t) => {
                  const isBreached = t.sla.isResponseBreached || t.sla.isResolutionBreached;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => onSelectTicket(t)}
                      className="hover:bg-slate-850/50 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white group-hover:text-indigo-300 transition">
                          {t.ticketNumber}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {t.messageCount} msg(s) • {t.sourceChannel}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{t.customerName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{t.customerId}</div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-200 truncate">{t.subject}</div>
                        <div className="text-[10px] text-indigo-400 font-mono mt-0.5">
                          {t.category} {t.loanId ? `• Loan #${t.loanId}` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          {getPriorityBadge(t.priority)}
                        </div>
                        {getStatusBadge(t.status)}
                      </td>

                      <td className="py-3 px-4">
                        {isBreached ? (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <AlertCircle className="w-3 h-3" /> SLA BREACHED
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                            <Clock className="w-3 h-3" /> SLA On Track
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Target: {t.sla.resolutionTargetHours}h resolution
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {t.assignedAgentName ? (
                          <div>
                            <div className="font-medium">{t.assignedAgentName}</div>
                            <span className="text-[10px] text-slate-500">{t.assignedTeam || 'General Support'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(t);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg transition text-xs font-medium inline-flex items-center gap-1"
                        >
                          Open Thread <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Headphones className="w-4 h-4 text-indigo-400" />
                Open Support Ticket
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
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
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={formCustName}
                    onChange={(e) => setFormCustName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SupportCategory)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="DISBURSEMENT_QUERY">DISBURSEMENT QUERY</option>
                    <option value="PAYMENT_DISPUTE">PAYMENT DISPUTE</option>
                    <option value="LOAN_INQUIRY">LOAN INQUIRY</option>
                    <option value="KYC_ISSUE">KYC ISSUE</option>
                    <option value="FORECLOSURE_REQUEST">FORECLOSURE REQUEST</option>
                    <option value="FRAUD_REPORT">FRAUD REPORT</option>
                    <option value="GRIEVANCE_COMPLAINT">GRIEVANCE COMPLAINT</option>
                    <option value="APP_TECHNICAL_ERROR">APP TECHNICAL ERROR</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as SupportPriority)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Disbursement delayed for loan approval"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Provide customer inquiry context..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">Related Loan ID (Optional)</label>
                <input
                  type="text"
                  value={formLoanId}
                  onChange={(e) => setFormLoanId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? 'Creating...' : 'Open Support Ticket'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
