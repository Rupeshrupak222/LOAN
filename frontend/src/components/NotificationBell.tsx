'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Info,
  ExternalLink,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

interface NotificationItem {
  id: string;
  userId?: string | null;
  customerId?: string | null;
  channel: string;
  title: string;
  message: string;
  type: string; // INFO, ALERT, SUCCESS, WARNING
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function NotificationBell() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications with periodic polling
  const { data, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data?.data || { items: [], unreadCount: 0 };
    },
    refetchInterval: 20000, // 20s live sync
  });

  const notifications = data?.items || [];
  const unreadCount = data?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Clear all notifications
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/notifications/clear-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Delete single notification
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const displayedNotifications =
    filter === 'unread'
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    if (item.metadata?.link) {
      router.push(item.metadata.link);
      setIsOpen(false);
    } else if (item.metadata?.applicationId) {
      router.push(`/applications/${item.metadata.applicationId}`);
      setIsOpen(false);
    } else if (item.metadata?.loanId) {
      router.push(`/loans/${item.metadata.loanId}`);
      setIsOpen(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case 'ALERT':
      case 'WARNING':
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <AlertTriangle className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] dark:bg-blue-950/50 dark:text-[#60A5FA]">
            <Info className="h-4 w-4" />
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="Notifications"
        className={cn(
          'relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all shadow-2xs cursor-pointer',
          isOpen
            ? isDark
              ? 'border-[#3B82F6] bg-[#1E2445] text-white shadow-md'
              : 'border-blue-400 bg-blue-50 text-[#2563EB] shadow-md'
            : isDark
            ? 'border-[#1E2445] bg-[#1E2445] text-slate-300 hover:bg-[#1E2445]/80 hover:text-white'
            : 'border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        )}
      >
        <Bell className={cn('h-4 w-4 transition-transform', isOpen ? 'rotate-12' : '')} />

        {/* Dynamic Badge */}
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 animate-in zoom-in-50 duration-200',
              isDark ? 'ring-[#060F1B]' : 'ring-white'
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notifications Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute -right-2 sm:right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-[380px] rounded-2xl border shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150',
            isDark
              ? 'border-[#2B3566] bg-[#0E152B]/95 text-slate-100 shadow-black/60'
              : 'border-slate-200/90 bg-white/95 text-slate-900 shadow-slate-300/50'
          )}
        >
          {/* Header */}
          <div
            className={cn(
              'flex items-center justify-between px-4 py-3 border-b',
              isDark ? 'border-[#2B3566] bg-[#131B38]/60' : 'border-slate-100 bg-slate-50/70'
            )}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  title="Mark all as read"
                  className={cn(
                    'flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer',
                    isDark
                      ? 'text-[#60A5FA] hover:bg-[#1E2445]'
                      : 'text-[#2563EB] hover:bg-blue-50'
                  )}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark Read</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                  title="Clear all notifications"
                  className={cn(
                    'flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg transition-colors cursor-pointer text-slate-400 hover:text-rose-500',
                    isDark ? 'hover:bg-rose-950/30' : 'hover:bg-rose-50'
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div
            className={cn(
              'flex items-center justify-between px-4 py-2 border-b text-xs',
              isDark ? 'border-[#2B3566]/60 bg-[#0E152B]' : 'border-slate-100 bg-white'
            )}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px]',
                  filter === 'all'
                    ? isDark
                      ? 'bg-[#2563EB] text-white shadow-2xs font-bold'
                      : 'bg-blue-50 text-[#2563EB] shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                )}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer text-[11px]',
                  filter === 'unread'
                    ? isDark
                      ? 'bg-[#2563EB] text-white shadow-2xs font-bold'
                      : 'bg-blue-50 text-[#2563EB] shadow-2xs font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {notifications.length > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                {displayedNotifications.length} items
              </span>
            )}
          </div>

          {/* Notification List Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#2B3566]/60 overscroll-contain">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <div className="h-5 w-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                <span>Loading notifications...</span>
              </div>
            ) : displayedNotifications.length > 0 ? (
              displayedNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={cn(
                    'group relative flex items-start gap-3 p-3.5 transition-colors cursor-pointer select-none',
                    !item.isRead
                      ? isDark
                        ? 'bg-[#151D3B]/70 hover:bg-[#1A244A]'
                        : 'bg-blue-50/40 hover:bg-blue-50/70'
                      : isDark
                      ? 'hover:bg-[#131B38]/50'
                      : 'hover:bg-slate-50'
                  )}
                >
                  {/* Icon */}
                  {getIcon(item.type)}

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={cn(
                          'text-xs font-bold leading-tight truncate',
                          !item.isRead
                            ? isDark
                              ? 'text-white'
                              : 'text-slate-900'
                            : isDark
                            ? 'text-slate-300'
                            : 'text-slate-700'
                        )}
                      >
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>

                    {item.metadata?.link && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-brand-700 dark:text-blue-400">
                        View Details <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>

                  {/* Actions (Mark single read / Delete) */}
                  <div className="flex flex-col items-end justify-between self-stretch gap-1.5 shrink-0">
                    {!item.isRead ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(item.id);
                        }}
                        title="Mark as read"
                        className="h-5 w-5 flex items-center justify-center rounded-md text-[#2563EB] dark:text-[#60A5FA] hover:bg-blue-100 dark:hover:bg-blue-950/60 transition-all cursor-pointer"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    ) : (
                      <div className="h-5 w-5" />
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(item.id);
                      }}
                      title="Dismiss notification"
                      className="opacity-0 group-hover:opacity-100 h-5 w-5 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-2xl border',
                    isDark
                      ? 'border-[#2B3566] bg-[#1E2445] text-slate-400'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  )}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  {filter === 'unread'
                    ? "You're all caught up! There are no unread notifications."
                    : 'Your notification center is empty. New alerts will appear here.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
