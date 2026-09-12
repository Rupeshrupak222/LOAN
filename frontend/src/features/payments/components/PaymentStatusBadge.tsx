import React from 'react';
import { PaymentStatus, PayoutStatus } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RotateCcw,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';

interface Props {
  status: PaymentStatus | PayoutStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const PaymentStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const s = String(status || '').toUpperCase();

  const getStyle = () => {
    switch (s) {
      case 'SUCCESS':
      case 'PROCESSED':
      case 'SETTLED':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          text: 'text-emerald-700 dark:text-emerald-400',
          border: 'border-emerald-500/30',
          icon: CheckCircle2,
          label: s === 'SETTLED' ? 'Settled' : 'Success',
        };
      case 'PENDING':
      case 'INITIATED':
      case 'CREATED':
      case 'QUEUED':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/20',
          text: 'text-amber-700 dark:text-amber-400',
          border: 'border-amber-500/30',
          icon: Clock,
          label: s === 'INITIATED' ? 'Initiated' : 'Pending',
        };
      case 'PROCESSING':
      case 'VALIDATING':
      case 'RETRYING':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-500/20',
          text: 'text-blue-700 dark:text-blue-400',
          border: 'border-blue-500/30',
          icon: RefreshCw,
          label: 'Processing',
        };
      case 'FAILED':
      case 'CANCELLED':
      case 'EXPIRED':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-500/20',
          text: 'text-rose-700 dark:text-rose-400',
          border: 'border-rose-500/30',
          icon: XCircle,
          label: 'Failed',
        };
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return {
          bg: 'bg-purple-500/10 dark:bg-purple-500/20',
          text: 'text-purple-700 dark:text-purple-400',
          border: 'border-purple-500/30',
          icon: RotateCcw,
          label: s === 'PARTIALLY_REFUNDED' ? 'Partially Refunded' : 'Refunded',
        };
      case 'REVERSED':
        return {
          bg: 'bg-orange-500/10 dark:bg-orange-500/20',
          text: 'text-orange-700 dark:text-orange-400',
          border: 'border-orange-500/30',
          icon: RotateCcw,
          label: 'Reversed',
        };
      case 'CHARGEBACK':
      case 'DISCREPANCY':
        return {
          bg: 'bg-red-500/10 dark:bg-red-500/20',
          text: 'text-red-700 dark:text-red-400',
          border: 'border-red-500/30',
          icon: ShieldAlert,
          label: s === 'DISCREPANCY' ? 'Discrepancy' : 'Chargeback',
        };
      default:
        return {
          bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
          text: 'text-zinc-700 dark:text-zinc-400',
          border: 'border-zinc-500/30',
          icon: AlertTriangle,
          label: s,
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : size === 'lg'
      ? 'px-3.5 py-1.5 text-sm font-semibold'
      : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${sizeClass} transition-all`}
    >
      <Icon className={`w-3.5 h-3.5 ${s === 'PROCESSING' ? 'animate-spin' : ''}`} />
      <span>{style.label}</span>
    </span>
  );
};
