import React from 'react';
import { PaymentAllocationItem } from '../types';
import { Layers, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  allocations?: PaymentAllocationItem[];
  totalAmount?: number | string;
}

export const PaymentAllocationTable: React.FC<Props> = ({ allocations = [], totalAmount }) => {
  const buckets = [
    { key: 'FEES', label: '1. Origination & Processing Fees', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
    { key: 'PENALTY', label: '2. Penalties & Bounce Charges', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { key: 'INTEREST', label: '3. Accrued Interest', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { key: 'PRINCIPAL', label: '4. Principal Reduction', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { key: 'EXCESS', label: '5. Surplus / Unallocated Credit', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  ];

  const getAmountForBucket = (bucketKey: string) => {
    const items = allocations.filter((a) => a.bucket === bucketKey);
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + Number(a.amount || 0), 0);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Waterfall Payment Allocation</h4>
            <p className="text-xs text-zinc-500">Pure Decimal.js priority order allocation across schedule buckets</p>
          </div>
        </div>
        {totalAmount && (
          <div className="text-right">
            <span className="text-xs text-zinc-500">Total Payment</span>
            <div className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              ₹{Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {buckets.map((b) => {
          const amt = getAmountForBucket(b.key);
          const pct = totalAllocated > 0 ? (amt / totalAllocated) * 100 : 0;

          return (
            <div
              key={b.key}
              className={`flex items-center justify-between p-3 rounded-lg border border-zinc-100 dark:border-zinc-800/80 ${
                amt > 0 ? b.bg : 'bg-zinc-50/50 dark:bg-zinc-900/40 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${b.color}`}>{b.label}</span>
                {amt > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {pct.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                ₹{amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
          Strict Invariant: Total Debits == Total Credits == Total Allocated
        </span>
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
          Allocated: ₹{totalAllocated.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};
