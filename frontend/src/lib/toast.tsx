'use client';

import React, { createContext, useContext, useState, useCallback, useId, ReactNode } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  RefreshCw,
} from 'lucide-react';
import { cn } from './utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: ToastAction;
}

export type ToastOptions = { title?: string; duration?: number; action?: ToastAction };
export type ToastFn = (messageOrTitle: string, descriptionOrOptions?: string | ToastOptions, extraOptions?: ToastOptions) => string;

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  success: ToastFn;
  error: ToastFn;
  warning: ToastFn;
  info: ToastFn;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function normalizeToastArgs(
  type: ToastType,
  messageOrTitle: string,
  descriptionOrOptions?: string | ToastOptions,
  extraOptions?: ToastOptions
): Omit<ToastItem, 'id'> {
  if (typeof descriptionOrOptions === 'string') {
    return {
      type,
      title: messageOrTitle,
      message: descriptionOrOptions,
      ...extraOptions,
    };
  }
  return {
    type,
    message: messageOrTitle,
    ...descriptionOrOptions,
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const duration = toast.duration ?? (toast.type === 'error' ? 7000 : 4500);

      setToasts((prev) => [...prev.slice(-4), { ...toast, id }]); // Keep at most 5 visible

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success: ToastFn = useCallback(
    (messageOrTitle, descriptionOrOptions, extraOptions) =>
      addToast(normalizeToastArgs('success', messageOrTitle, descriptionOrOptions, extraOptions)),
    [addToast]
  );

  const error: ToastFn = useCallback(
    (messageOrTitle, descriptionOrOptions, extraOptions) =>
      addToast(normalizeToastArgs('error', messageOrTitle, descriptionOrOptions, extraOptions)),
    [addToast]
  );

  const warning: ToastFn = useCallback(
    (messageOrTitle, descriptionOrOptions, extraOptions) =>
      addToast(normalizeToastArgs('warning', messageOrTitle, descriptionOrOptions, extraOptions)),
    [addToast]
  );

  const info: ToastFn = useCallback(
    (messageOrTitle, descriptionOrOptions, extraOptions) =>
      addToast(normalizeToastArgs('info', messageOrTitle, descriptionOrOptions, extraOptions)),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const icons = {
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
    error: <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-100',
    error: 'border-rose-500/30 bg-rose-50/95 dark:bg-rose-950/90 text-rose-950 dark:text-rose-100',
    warning: 'border-amber-500/30 bg-amber-50/95 dark:bg-amber-950/90 text-amber-950 dark:text-amber-100',
    info: 'border-blue-500/30 bg-blue-50/95 dark:bg-blue-950/90 text-blue-950 dark:text-blue-100',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 duration-200',
        borders[toast.type]
      )}
      role="alert"
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-xs font-bold leading-tight mb-0.5">{toast.title}</p>
        )}
        <p className="text-xs leading-relaxed opacity-90 break-words">{toast.message}</p>
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold underline hover:opacity-80 transition-opacity cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Close notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
