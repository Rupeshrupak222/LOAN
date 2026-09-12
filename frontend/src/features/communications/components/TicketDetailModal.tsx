'use client';

import React, { useState } from 'react';
import type {
  SupportMessage,
  SupportTicket,
  TicketMessageType,
  TicketStatus,
} from '../types';
import {
  X,
  Send,
  Lock,
  MessageSquare,
  Clock,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  ticket: SupportTicket;
  messages: SupportMessage[];
  isLoading: boolean;
  onClose: () => void;
  onSendMessage: (ticketId: string, payload: { messageType: TicketMessageType; body: string; isInternalOnly?: boolean }) => Promise<void>;
  onAssignTicket: (ticketId: string, payload: { agentId?: string; agentName?: string; team?: string }) => Promise<void>;
  onEscalateTicket: (ticketId: string, payload: { reason: string; targetLevel?: number }) => Promise<void>;
  onUpdateStatus: (ticketId: string, payload: { status: TicketStatus; resolutionNote?: string; csatScore?: number }) => Promise<void>;
}

export const TicketDetailModal: React.FC<Props> = ({
  ticket,
  messages,
  isLoading,
  onClose,
  onSendMessage,
  onAssignTicket,
  onEscalateTicket,
  onUpdateStatus,
}) => {
  const [replyBody, setReplyBody] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Assignment state
  const [showAssign, setShowAssign] = useState(false);
  const [agentName, setAgentName] = useState('Priya Verma (Ops Support)');
  const [teamName, setTeamName] = useState('Tier-2 Operations');

  // Escalation state
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateReason, setEscalateReason] = useState('Banking gateway delay exceeding SLA threshold');

  // Resolve state
  const [showResolve, setShowResolve] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('Payment settlement confirmed by nodal bank.');
  const [csatScore, setCsatScore] = useState(5);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;

    setIsSending(true);
    try {
      await onSendMessage(ticket.id, {
        messageType: isInternalNote ? 'INTERNAL_NOTE' : 'CUSTOMER_MESSAGE',
        body: replyBody.trim(),
        isInternalOnly: isInternalNote,
      });
      setReplyBody('');
    } finally {
      setIsSending(false);
    }
  };

  const handleAssign = async () => {
    await onAssignTicket(ticket.id, { agentName, team: teamName });
    setShowAssign(false);
  };

  const handleEscalate = async () => {
    await onEscalateTicket(ticket.id, { reason: escalateReason });
    setShowEscalate(false);
  };

  const handleResolve = async () => {
    await onUpdateStatus(ticket.id, {
      status: 'RESOLVED',
      resolutionNote,
      csatScore,
    });
    setShowResolve(false);
  };

  const isBreached = ticket.sla.isResponseBreached || ticket.sla.isResolutionBreached;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="font-mono font-bold text-white text-base">
              {ticket.ticketNumber}
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {ticket.status}
            </span>
            <span className="text-xs text-slate-400">
              Customer: <strong className="text-slate-200">{ticket.customerName}</strong> ({ticket.customerId})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssign(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" /> Assign
            </button>
            <button
              onClick={() => setShowEscalate(true)}
              className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-medium rounded-lg transition flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Escalate
            </button>
            {ticket.status !== 'RESOLVED' && (
              <button
                onClick={() => setShowResolve(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Ticket
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Body: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {/* Left Column: Conversation Thread + Reply Composer (2 cols) */}
          <div className="md:col-span-2 flex flex-col border-r border-slate-800 bg-slate-950/40">
            {/* Conversation Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((m) => {
                const isInternal = m.isInternalOnly || m.messageType === 'INTERNAL_NOTE';
                const isCustomer = m.senderType === 'CUSTOMER';

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${
                      isCustomer ? 'items-start' : isInternal ? 'items-center' : 'items-end'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl p-3.5 text-xs shadow-sm ${
                        isInternal
                          ? 'bg-amber-950/40 border border-amber-500/40 text-amber-200'
                          : isCustomer
                          ? 'bg-slate-900 border border-slate-800 text-slate-200'
                          : 'bg-indigo-600/90 text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5 pb-1 border-b border-white/10 text-[10px]">
                        <span className="font-semibold flex items-center gap-1">
                          {isInternal && <Lock className="w-3 h-3 text-amber-400" />}
                          {m.senderName} ({m.senderType})
                        </span>
                        <span className="opacity-75 font-mono">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {isInternal && (
                        <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-1 flex items-center gap-1">
                          🔒 Internal Staff Note (Hidden from Customer)
                        </div>
                      )}

                      <p className="whitespace-pre-wrap leading-relaxed font-sans">{m.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            <form onSubmit={handleSendReply} className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(false)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition ${
                      !isInternalNote
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Public Reply to Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternalNote(true)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
                      isInternalNote
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Lock className="w-3 h-3" /> Internal Staff Note
                  </button>
                </div>
                <span className="text-[10px] text-slate-500">
                  {isInternalNote ? 'Visible to internal ops only' : 'Will trigger borrower in-app & SMS reply'}
                </span>
              </div>

              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? 'Add internal investigation notes, gateway reference logs...'
                      : 'Type response to customer...'
                  }
                  className="flex-1 bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2.5 outline-none focus:border-indigo-500 font-sans resize-none"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyBody.trim()}
                  className={`px-4 flex items-center justify-center rounded-lg text-xs font-semibold transition ${
                    isInternalNote
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
                  } disabled:opacity-50`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Ticket Meta & SLA Tracking Sidebar (1 col) */}
          <div className="p-4 bg-slate-900/90 overflow-y-auto space-y-4">
            {/* SLA Status Card */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> SLA Response & Resolution
              </h4>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>First Response:</span>
                  <strong className={ticket.sla.isResponseBreached ? 'text-rose-400' : 'text-emerald-400'}>
                    {ticket.firstResponseAt ? 'Responded' : `${ticket.sla.firstResponseTargetHours}h target`}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Resolution Target:</span>
                  <strong className={ticket.sla.isResolutionBreached ? 'text-rose-400' : 'text-emerald-400'}>
                    {ticket.sla.resolutionTargetHours}h max
                  </strong>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  {isBreached ? (
                    <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded text-[11px] text-rose-300 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> SLA Breached — Priority Escalated
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> SLA On-Track Compliant
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ticket Metadata */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5 text-xs">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Ticket Info</h4>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Subject</span>
                <span className="text-slate-200 font-medium">{ticket.subject}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Category</span>
                <span className="text-indigo-400 font-mono">{ticket.category}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Priority</span>
                <span className="font-semibold text-amber-400">{ticket.priority}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Assigned Agent</span>
                <span className="text-slate-200">{ticket.assignedAgentName || 'Unassigned'}</span>
              </div>

              {ticket.loanId && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Linked Loan ID</span>
                  <span className="text-slate-200 font-mono">{ticket.loanId}</span>
                </div>
              )}

              {ticket.csatScore && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">CSAT Rating</span>
                  <span className="text-amber-400 font-bold">⭐ {ticket.csatScore} / 5</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal: Assign Agent */}
        {showAssign && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full space-y-4">
              <h4 className="text-sm font-bold text-white">Assign Ticket</h4>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Agent Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Team</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowAssign(false)}
                  className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssign}
                  className="px-3 py-1.5 bg-indigo-600 text-xs text-white rounded-lg font-semibold"
                >
                  Save Assignment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Escalate */}
        {showEscalate && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full space-y-4">
              <h4 className="text-sm font-bold text-white">Escalate Ticket</h4>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Escalation Reason</label>
                <textarea
                  rows={3}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowEscalate(false)}
                  className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEscalate}
                  className="px-3 py-1.5 bg-rose-600 text-xs text-white rounded-lg font-semibold"
                >
                  Confirm Escalation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Resolve */}
        {showResolve && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md w-full space-y-4">
              <h4 className="text-sm font-bold text-white">Resolve Ticket & Customer Feedback</h4>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Resolution Summary Note</label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">CSAT Rating (1 to 5 Stars)</label>
                <select
                  value={csatScore}
                  onChange={(e) => setCsatScore(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5) Excellent</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5) Good</option>
                  <option value={3}>⭐⭐⭐ (3/5) Average</option>
                  <option value={2}>⭐⭐ (2/5) Poor</option>
                  <option value={1}>⭐ (1/5) Very Poor</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowResolve(false)}
                  className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  className="px-3 py-1.5 bg-emerald-600 text-xs text-white rounded-lg font-semibold"
                >
                  Confirm Resolution
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
