'use client';

import React, { useState } from 'react';
import type {
  CommunicationChannel,
  CommunicationMessage,
  DeliveryStatus,
} from '../types';
import {
  Search,
  Filter,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Mail,
  Smartphone,
  Bell,
  ShieldCheck,
  Eye,
  RotateCcw,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  messages: CommunicationMessage[];
  isLoading: boolean;
  onRefresh: () => void;
  onRetry: (messageId: string) => Promise<void>;
}

export const MessageHistoryView: React.FC<Props> = ({
  messages,
  isLoading,
  onRefresh,
  onRetry,
}) => {
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<CommunicationMessage | null>(null);
  const [isRetrying, setIsRetrying] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const filteredMessages = messages.filter((m) => {
    if (channelFilter !== 'ALL' && m.channel !== channelFilter) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCust = m.customerId.toLowerCase().includes(q);
      const matchRec = m.recipientIdentifier.toLowerCase().includes(q);
      const matchEvt = m.eventCode.toLowerCase().includes(q);
      const matchBody = m.body.toLowerCase().includes(q);
      if (!matchCust && !matchRec && !matchEvt && !matchBody) return false;
    }
    return true;
  });

  const handleRetry = async (msgId: string) => {
    setIsRetrying(msgId);
    try {
      await onRetry(msgId);
    } finally {
      setIsRetrying(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getChannelIcon = (channel: CommunicationChannel) => {
    switch (channel) {
      case 'SMS':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-blue-400" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-3.5 h-3.5 text-green-400" />;
      case 'PUSH':
      case 'IN_APP':
        return <Bell className="w-3.5 h-3.5 text-amber-400" />;
      case 'INTERNAL_NOTIFICATION':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Send className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: DeliveryStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Delivered
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Send className="w-3 h-3 mr-1" /> Sent
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3 mr-1" /> Failed
          </span>
        );
      case 'BLOCKED_QUIET_HOURS':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3 mr-1" /> Quiet Hours
          </span>
        );
      case 'SUPPRESSED_PREFERENCE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Opt-Out Suppressed
          </span>
        );
      case 'SUPPRESSED_DUPLICATE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Deduplicated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700 text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by customer, phone, event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Channels</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="PUSH">Push</option>
              <option value="IN_APP">In-App</option>
              <option value="INTERNAL_NOTIFICATION">Internal Staff</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="SENT">Sent</option>
              <option value="FAILED">Failed</option>
              <option value="BLOCKED_QUIET_HOURS">Quiet Hours Held</option>
              <option value="SUPPRESSED_PREFERENCE">Suppressed (Opt-Out)</option>
              <option value="SUPPRESSED_DUPLICATE">Suppressed (Duplicate)</option>
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
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event / Category</th>
                <th className="py-3 px-4">Channel & Recipient</th>
                <th className="py-3 px-4">Message Content</th>
                <th className="py-3 px-4">Delivery Status</th>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No matching communication records found.
                  </td>
                </tr>
              ) : (
                filteredMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{msg.eventCode}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-indigo-400 font-mono">{msg.category}</span>
                        <span className="text-[10px] text-slate-500">v{msg.templateVersion || 1}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-300">
                        {getChannelIcon(msg.channel)}
                        <span>{msg.channel}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[160px]">
                        {msg.recipientIdentifier}
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      {msg.subject ? (
                        <div className="font-semibold text-slate-200 truncate">{msg.subject}</div>
                      ) : null}
                      <div className="text-slate-400 truncate text-[11px]">{msg.body}</div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(msg.status)}
                      {msg.retryCount > 0 ? (
                        <div className="text-[10px] text-amber-400 mt-1">Retried {msg.retryCount}x</div>
                      ) : null}
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedMessage(msg)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition"
                          title="View Message Audit Payload"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {msg.status === 'FAILED' ? (
                          <button
                            onClick={() => handleRetry(msg.id)}
                            disabled={isRetrying === msg.id}
                            className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 rounded-md transition"
                            title="Retry Message"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isRetrying === msg.id ? 'animate-spin' : ''}`} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  Dispatched Message Audit Detail
                </h3>
                <span className="text-xs font-mono text-slate-400">{selectedMessage.id}</span>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Channel</span>
                  <div className="flex items-center gap-1.5 mt-1 font-semibold text-white">
                    {getChannelIcon(selectedMessage.channel)}
                    {selectedMessage.channel}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">External ID</span>
                  <div className="text-xs font-mono text-slate-300 mt-1 truncate">
                    {selectedMessage.externalMessageId || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Rendered Body */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-medium block">
                  Delivered Content (PII Scrubbed)
                </span>
                {selectedMessage.subject ? (
                  <div className="text-xs font-semibold text-white pb-2 border-b border-slate-800">
                    Subject: {selectedMessage.subject}
                  </div>
                ) : null}
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                  {selectedMessage.body}
                </p>
              </div>

              {/* Idempotency Key */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-medium block">
                    Idempotency Hash (SHA256)
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    {selectedMessage.idempotencyKey}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedMessage.idempotencyKey)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-md bg-slate-800 hover:bg-slate-700 transition"
                  title="Copy Hash"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Error reason if failed */}
              {selectedMessage.errorMessage ? (
                <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-lg text-xs text-rose-300">
                  <strong className="block mb-1">Failure Reason:</strong>
                  {selectedMessage.errorMessage}
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Created: {new Date(selectedMessage.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
