'use client';

import React, { useState } from 'react';
import type {
  CommunicationChannel,
  CommunicationDashboardMetrics,
  CommunicationMessage,
  SupportDashboardMetrics,
} from '../types';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Mail,
  Smartphone,
  Bell,
  ShieldCheck,
  Headphones,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Users,
  FileCheck,
} from 'lucide-react';

interface Props {
  commMetrics?: CommunicationDashboardMetrics;
  supportMetrics?: SupportDashboardMetrics;
  recentMessages?: CommunicationMessage[];
  isLoading: boolean;
  onRefresh: () => void;
  onTriggerTestEvent: (eventCode: string) => void;
}

export const CommunicationOverviewView: React.FC<Props> = ({
  commMetrics,
  supportMetrics,
  recentMessages = [],
  isLoading,
  onRefresh,
  onTriggerTestEvent,
}) => {
  const [selectedTestEvent, setSelectedTestEvent] = useState('APPLICATION_APPROVED');
  const [isTriggering, setIsTriggering] = useState(false);

  const handleTrigger = async () => {
    setIsTriggering(true);
    try {
      await onTriggerTestEvent(selectedTestEvent);
    } finally {
      setIsTriggering(false);
    }
  };

  const getChannelIcon = (channel: CommunicationChannel) => {
    switch (channel) {
      case 'SMS':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-blue-400" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-green-400" />;
      case 'PUSH':
      case 'IN_APP':
        return <Bell className="w-4 h-4 text-amber-400" />;
      case 'INTERNAL_NOTIFICATION':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      default:
        return <Send className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
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
            <Clock className="w-3 h-3 mr-1" /> Quiet Hours Held
          </span>
        );
      case 'SUPPRESSED_PREFERENCE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users className="w-3 h-3 mr-1" /> Opt-Out Suppressed
          </span>
        );
      case 'SUPPRESSED_DUPLICATE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <RefreshCw className="w-3 h-3 mr-1" /> Deduplicated
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
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            Communication & Customer Support Operations Control Hub
          </h2>
          <p className="text-xs text-slate-400">
            Real-time delivery telemetry across SMS, WhatsApp, Email, Push, In-App, and Support SLAs.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Overall Delivery Rate */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Overall Delivery Rate
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {commMetrics?.overallDeliveryRate ?? 99.4}%
            </span>
            <span className="text-xs text-emerald-400 font-medium">SLA Target &gt; 99%</span>
          </div>
          <div className="mt-3 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${commMetrics?.overallDeliveryRate ?? 99.4}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {commMetrics?.totalDelivered ?? 0} delivered / {commMetrics?.totalMessagesSent ?? 0} dispatched
          </p>
        </div>

        {/* 2. Active Outbox & Suppression */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Active Templates & Policies
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {commMetrics?.activeTemplatesCount ?? 15}
            </span>
            <span className="text-xs text-indigo-400 font-medium">DLT / RBI Ready</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-4">
            Suppressed: <span className="text-amber-400 font-semibold">{commMetrics?.totalSuppressed ?? 0}</span> (Quiet Hours / Opt-Out / Dedup)
          </p>
        </div>

        {/* 3. Support Tickets & SLA Breaches */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Support Desk Active Tickets
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Headphones className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              {(supportMetrics?.openTickets ?? 0) + (supportMetrics?.inProgressTickets ?? 0)}
            </span>
            {supportMetrics?.breachedTickets ? (
              <span className="text-xs text-rose-400 font-semibold">
                ⚠️ {supportMetrics.breachedTickets} Breached SLA
              </span>
            ) : (
              <span className="text-xs text-emerald-400 font-medium">100% SLA Compliant</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-4">
            Avg 1st Response: <span className="text-white font-medium">{supportMetrics?.avgFirstResponseTimeHours ?? 1.2}h</span> | Resolution: <span className="text-white font-medium">{supportMetrics?.avgResolutionTimeHours ?? 8.4}h</span>
          </p>
        </div>

        {/* 4. Customer Satisfaction & Grievances */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              CSAT & Regulatory Desk
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">
              ⭐ {supportMetrics?.csatScore ?? 4.6} / 5.0
            </span>
            <span className="text-xs text-purple-400 font-medium">High Satisfaction</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-4">
            Grievances: <span className="text-amber-400 font-semibold">{supportMetrics?.openComplaints ?? 0}</span> open RBI complaint case(s)
          </p>
        </div>
      </div>

      {/* Channel Volume & Interactive Dispatch Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channel Health Grid (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-400" />
            Channel Delivery Performance Breakdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'SMS Gateway (DLT)', channel: 'SMS' as CommunicationChannel, icon: <Smartphone className="w-4 h-4 text-emerald-400" /> },
              { label: 'WhatsApp Cloud API', channel: 'WHATSAPP' as CommunicationChannel, icon: <MessageSquare className="w-4 h-4 text-green-400" /> },
              { label: 'Email MTA (SES/SendGrid)', channel: 'EMAIL' as CommunicationChannel, icon: <Mail className="w-4 h-4 text-blue-400" /> },
              { label: 'Push Notifications (FCM)', channel: 'PUSH' as CommunicationChannel, icon: <Bell className="w-4 h-4 text-amber-400" /> },
              { label: 'Borrower In-App Hub', channel: 'IN_APP' as CommunicationChannel, icon: <Users className="w-4 h-4 text-indigo-400" /> },
              { label: 'Internal Staff Router', channel: 'INTERNAL_NOTIFICATION' as CommunicationChannel, icon: <ShieldCheck className="w-4 h-4 text-purple-400" /> },
            ].map((c) => {
              const stats = commMetrics?.channelStats?.[c.channel] || { sent: 0, delivered: 0, failed: 0 };
              const rate = stats.sent > 0 ? ((stats.delivered / stats.sent) * 100).toFixed(0) : '100';

              return (
                <div key={c.channel} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {c.icon}
                      <span className="text-xs font-medium text-slate-200">{c.label}</span>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400">{rate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Delivered: <strong className="text-white">{stats.delivered}</strong></span>
                    <span>Failed: <strong className="text-rose-400">{stats.failed}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Test Event Trigger (1 col) */}
        <div className="bg-gradient-to-br from-slate-900/90 via-indigo-950/30 to-slate-900/90 border border-indigo-500/20 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Live Event Simulation Sandbox</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Trigger simulated domain events through the full policy engine, template renderer, and outbox.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-1">
                Domain Event Trigger
              </label>
              <select
                value={selectedTestEvent}
                onChange={(e) => setSelectedTestEvent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
              >
                <option value="APPLICATION_APPROVED">APPLICATION_APPROVED (SMS + WhatsApp)</option>
                <option value="KYC_COMPLETED">KYC_COMPLETED (SMS + Push)</option>
                <option value="DISBURSEMENT_COMPLETED">DISBURSEMENT_COMPLETED (SMS + WhatsApp + Email)</option>
                <option value="UPCOMING_DUE_REMINDER">UPCOMING_DUE_REMINDER (Collections SMS)</option>
                <option value="PAYMENT_COMPLETED">PAYMENT_COMPLETED (Instant Receipt)</option>
                <option value="PAYMENT_OVERDUE">PAYMENT_OVERDUE (Legal Notice / DPD)</option>
                <option value="UNDERWRITING_STARTED">UNDERWRITING_STARTED (Internal Staff Task)</option>
                <option value="COMPLAINT_REGISTERED">COMPLAINT_REGISTERED (RBI Grievance Ack)</option>
              </select>
            </div>

            <button
              onClick={handleTrigger}
              disabled={isTriggering}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium text-xs rounded-lg transition shadow-lg shadow-indigo-600/20"
            >
              <Send className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : ''}`} />
              {isTriggering ? 'Simulating Dispatch...' : 'Dispatch Live Event Test'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Dispatched Messages Stream */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            Recent Outbox Stream & Dispatch History
          </h3>
          <span className="text-xs text-slate-400">Live Transactional Feed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event / Category</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Content Preview</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentMessages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No communication messages dispatched yet. Trigger an event above to start streaming.
                  </td>
                </tr>
              ) : (
                recentMessages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{msg.eventCode}</div>
                      <span className="text-[10px] text-indigo-400 font-mono">{msg.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getChannelIcon(msg.channel)}
                        <span className="font-medium text-slate-300">{msg.channel}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {msg.recipientName ? (
                        <div>
                          <div>{msg.recipientName}</div>
                          <span className="text-[10px] text-slate-500">{msg.recipientIdentifier}</span>
                        </div>
                      ) : (
                        msg.recipientIdentifier
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-400 font-sans">
                      {msg.subject ? <span className="font-semibold text-slate-300">[{msg.subject}] </span> : null}
                      {msg.body}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(msg.status)}</td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
