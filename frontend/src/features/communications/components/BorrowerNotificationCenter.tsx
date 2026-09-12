'use client';

import React, { useState } from 'react';
import type { BorrowerNotification } from '../types';
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';

interface Props {
  notifications: BorrowerNotification[];
  unreadCount: number;
  isLoading: boolean;
  selectedCustomerId: string;
  onChangeCustomer: (customerId: string) => void;
  onMarkRead: (notificationId: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

export const BorrowerNotificationCenter: React.FC<Props> = ({
  notifications,
  unreadCount,
  isLoading,
  selectedCustomerId,
  onChangeCustomer,
  onMarkRead,
  onMarkAllRead,
}) => {
  const [filterRead, setFilterRead] = useState<string>('ALL');

  const filtered = notifications.filter((n) => {
    if (filterRead === 'UNREAD') return !n.isRead;
    if (filterRead === 'READ') return n.isRead;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top Banner & Customer Switcher */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Borrower In-App Notification Center
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                  {unreadCount} New
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Interactive simulator for borrower mobile/web notifications.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCustomerId}
            onChange={(e) => onChangeCustomer(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
          >
            <option value="CUST-DEMO-001">Customer: Aarav Sharma (CUST-DEMO-001)</option>
            <option value="CUST-DEMO-002">Customer: Meera Patel (CUST-DEMO-002)</option>
          </select>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-1">
        {['ALL', 'UNREAD', 'READ'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterRead(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterRead === f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {f === 'ALL' ? 'All Alerts' : f === 'UNREAD' ? `Unread (${unreadCount})` : 'Read'}
          </button>
        ))}
      </div>

      {/* Notifications Stream */}
      <div className="space-y-2.5">
        {filtered.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
            No notifications in inbox for this customer.
          </div>
        ) : (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                !notif.isRead
                  ? 'bg-slate-900/90 border-indigo-500/40 shadow-md shadow-indigo-950/20'
                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg mt-0.5 ${
                    !notif.isRead
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs font-bold ${!notif.isRead ? 'text-white' : 'text-slate-300'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] font-mono text-indigo-400">{notif.eventCode}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{notif.body}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1">
                    <span>
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {notif.actionUrl && (
                      <span className="text-indigo-400 font-semibold flex items-center gap-0.5">
                        Deep link: {notif.actionUrl} <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!notif.isRead && (
                <button
                  onClick={() => onMarkRead(notif.id)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium rounded-md transition whitespace-nowrap"
                >
                  Mark read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
