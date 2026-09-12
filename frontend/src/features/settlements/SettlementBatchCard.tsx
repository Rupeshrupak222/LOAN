import React from 'react';
import { SettlementBatchItem } from '../payments/types';
import { PaymentStatusBadge } from '../payments/components/PaymentStatusBadge';
import {
  Coins,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Building2,
  Calendar,
} from 'lucide-react';

interface Props {
  batch: SettlementBatchItem;
  onConfirm?: (batchId: string) => void;
}

export const SettlementBatchCard: React.FC<Props> = ({ batch, onConfirm }) => {
  const isDiscrepancy = batch.status === 'DISCREPANCY' || Math.abs(batch.feeVariance) > 5;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                Batch #{batch.batchNo}
              </h3>
              <PaymentStatusBadge status={batch.status} size="sm" />
            </div>
            <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
              <span>{batch.providerCode}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(batch.settlementDate).toLocaleDateString('en-IN')}
              </span>
              <span>•</span>
              <span>{batch.transactionCount} Transactions</span>
            </div>
          </div>
        </div>

        {batch.status === 'PENDING' && onConfirm && (
          <button
            onClick={() => onConfirm(batch.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirm Settlement
          </button>
        )}
      </div>

      {/* Financial Net Breakdown */}
      <div className="grid grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs">
        <div>
          <span className="text-zinc-500">Gross Volume</span>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            ₹{batch.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <span className="text-zinc-500">MDR Base Fee ({batch.contractedMdrPct}%)</span>
          <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            -₹{batch.feeAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <span className="text-zinc-500">GST (18%)</span>
          <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mt-0.5">
            -₹{batch.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div>
          <span className="text-zinc-500">Net Bank Settlement</span>
          <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
            ₹{batch.netSettledAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Fee Variance Banner if Discrepancy */}
      {isDiscrepancy && (
        <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Fee Variance Detected: Gateway charged ₹{Math.abs(batch.feeVariance).toFixed(2)}{' '}
              {batch.feeVariance > 0 ? 'more' : 'less'} than agreed contracted rate ({batch.contractedMdrPct}%).
            </span>
          </div>
          <span className="font-bold text-amber-700 dark:text-amber-300 font-mono">
            {batch.feeVariance > 0 ? `+₹${batch.feeVariance.toFixed(2)}` : `-₹${Math.abs(batch.feeVariance).toFixed(2)}`}
          </span>
        </div>
      )}

      {/* Settlement Metadata / Journal Reference */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
        <div className="font-mono">
          {batch.utrNumber ? `Bank UTR: ${batch.utrNumber}` : 'Awaiting Bank UTR'}
        </div>
        {batch.journalEntryId && (
          <div className="text-indigo-600 dark:text-indigo-400 font-medium">
            Posted to General Ledger: #{batch.journalEntryId}
          </div>
        )}
      </div>
    </div>
  );
};
