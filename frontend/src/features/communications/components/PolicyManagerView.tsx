'use client';

import React, { useState } from 'react';
import type {
  CommunicationChannel,
  CommunicationPolicy,
  CommunicationPriority,
  MessageCategory,
} from '../types';
import {
  ShieldAlert,
  Clock,
  RefreshCw,
  Send,
  Smartphone,
  Mail,
  MessageSquare,
  Bell,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  Sliders,
} from 'lucide-react';

interface Props {
  policies: CommunicationPolicy[];
  isLoading: boolean;
  onRefresh: () => void;
  onSavePolicy: (payload: Partial<CommunicationPolicy>) => Promise<void>;
}

export const PolicyManagerView: React.FC<Props> = ({
  policies,
  isLoading,
  onRefresh,
  onSavePolicy,
}) => {
  const [editingPolicy, setEditingPolicy] = useState<CommunicationPolicy | null>(null);
  const [primaryChannel, setPrimaryChannel] = useState<CommunicationChannel>('SMS');
  const [fallbackChannels, setFallbackChannels] = useState<CommunicationChannel[]>([]);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const [retryLimit, setRetryLimit] = useState(3);
  const [dedupWindow, setDedupWindow] = useState(30);
  const [priority, setPriority] = useState<CommunicationPriority>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenEdit = (p: CommunicationPolicy) => {
    setEditingPolicy(p);
    setPrimaryChannel(p.primaryChannel);
    setFallbackChannels(p.fallbackChannels || []);
    setQuietHoursEnabled(p.quietHoursEnabled);
    setQuietHoursStart(p.quietHoursStart || '22:00');
    setQuietHoursEnd(p.quietHoursEnd || '08:00');
    setRetryLimit(p.retryLimit || 3);
    setDedupWindow(p.dedupWindowMinutes || 30);
    setPriority(p.priority);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy) return;
    setIsSubmitting(true);
    try {
      await onSavePolicy({
        ...editingPolicy,
        primaryChannel,
        fallbackChannels,
        quietHoursEnabled,
        quietHoursStart,
        quietHoursEnd,
        retryLimit,
        dedupWindowMinutes: dedupWindow,
        priority,
      });
      setEditingPolicy(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChannelBadge = (ch: CommunicationChannel) => {
    const icon =
      ch === 'SMS' ? <Smartphone className="w-3 h-3" /> :
      ch === 'EMAIL' ? <Mail className="w-3 h-3" /> :
      ch === 'WHATSAPP' ? <MessageSquare className="w-3 h-3" /> :
      ch === 'PUSH' || ch === 'IN_APP' ? <Bell className="w-3 h-3" /> :
      <ShieldCheck className="w-3 h-3" />;

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700">
        {icon}
        {ch}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header info banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Central Event Routing & Fair Practice Quiet Hours Policies
          </h3>
          <p className="text-xs text-slate-400">
            Defines primary and fallback channel escalation, quiet hours blocking, and deduplication windows per domain event.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Policy Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event Code</th>
                <th className="py-3 px-4">Primary Channel</th>
                <th className="py-3 px-4">Fallback Order</th>
                <th className="py-3 px-4">Priority / Category</th>
                <th className="py-3 px-4">Quiet Hours</th>
                <th className="py-3 px-4">Retry / Dedup</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {policies.map((pol) => {
                const canBypass = pol.priority === 'CRITICAL' || pol.category === 'SECURITY' || !pol.quietHoursEnabled;

                return (
                  <tr key={pol.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{pol.eventCode}</div>
                      <span className="text-[10px] text-slate-500 font-mono">{pol.tenantId}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getChannelBadge(pol.primaryChannel)}
                    </td>
                    <td className="py-3 px-4">
                      {pol.fallbackChannels && pol.fallbackChannels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {pol.fallbackChannels.map((fc) => (
                            <span key={fc} className="text-[10px] text-slate-400">
                              &rarr; {fc}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">— No Fallback —</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          pol.priority === 'CRITICAL' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          pol.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {pol.priority}
                        </span>
                        <span className="text-[10px] text-indigo-300">{pol.category}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {canBypass ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> 24x7 Bypass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                          <Clock className="w-3 h-3" /> {pol.quietHoursStart} - {pol.quietHoursEnd}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">
                      {pol.retryLimit}x max / {pol.dedupWindowMinutes}m
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(pol)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        title="Edit Policy"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Policy Drawer / Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Configure Policy: {editingPolicy.eventCode}
              </h3>
              <button
                type="button"
                onClick={() => setEditingPolicy(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Primary Routing Channel
                </label>
                <select
                  value={primaryChannel}
                  onChange={(e) => setPrimaryChannel(e.target.value as CommunicationChannel)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                >
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                  <option value="PUSH">Push</option>
                  <option value="IN_APP">In-App</option>
                  <option value="INTERNAL_NOTIFICATION">Internal Staff</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as CommunicationPriority)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL (Bypasses Quiet Hours)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Quiet Hours Regulation (TRAI / RBI)
                  </label>
                  <input
                    type="checkbox"
                    checked={quietHoursEnabled}
                    onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                </div>

                {quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Start (Overnight)</label>
                      <input
                        type="time"
                        value={quietHoursStart}
                        onChange={(e) => setQuietHoursStart(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">End (Morning)</label>
                      <input
                        type="time"
                        value={quietHoursEnd}
                        onChange={(e) => setQuietHoursEnd(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Max Retry Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={retryLimit}
                    onChange={(e) => setRetryLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Deduplication Window (Mins)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    value={dedupWindow}
                    onChange={(e) => setDedupWindow(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPolicy(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? 'Saving...' : 'Save Policy'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
