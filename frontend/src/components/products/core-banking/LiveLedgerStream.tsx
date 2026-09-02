'use client';

import React, { useState, useEffect } from 'react';
import { Database, Zap, Pause, Play, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';

interface LedgerEntry {
  id: string;
  time: string;
  type: 'CREDIT' | 'DEBIT' | 'SETTLEMENT' | 'INTEREST';
  account: string;
  amount: string;
  balanceAfter: string;
  status: 'COMMITTED';
}

const INITIAL_ENTRIES: LedgerEntry[] = [
  { id: 'TX-98421', time: '16:04:12', type: 'CREDIT', account: 'ACC #8421 (Merchant Payout)', amount: '+₹25,000.00', balanceAfter: '₹14,92,410.00', status: 'COMMITTED' },
  { id: 'TX-98420', time: '16:04:09', type: 'DEBIT', account: 'ACC #1938 (Corporate Escrow)', amount: '-₹7,500.00', balanceAfter: '₹14,67,410.00', status: 'COMMITTED' },
  { id: 'TX-98419', time: '16:03:55', type: 'INTEREST', account: 'ACC #6091 (Daily Accrual)', amount: '+₹412.50', balanceAfter: '₹14,74,910.00', status: 'COMMITTED' },
  { id: 'TX-98418', time: '16:03:41', type: 'SETTLEMENT', account: 'NPCI BATCH #421 (UPI Settlement)', amount: '+₹17,500.00', balanceAfter: '₹14,74,497.50', status: 'COMMITTED' },
  { id: 'TX-98417', time: '16:03:18', type: 'DEBIT', account: 'ACC #3320 (Disbursal Drawdown)', amount: '-₹50,000.00', balanceAfter: '₹14,56,997.50', status: 'COMMITTED' },
];

export const LiveLedgerStream: React.FC = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>(INITIAL_ENTRIES);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const types: Array<'CREDIT' | 'DEBIT' | 'SETTLEMENT' | 'INTEREST'> = ['CREDIT', 'DEBIT', 'SETTLEMENT', 'INTEREST'];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      const randomAmount = (Math.random() * 45000 + 1000).toFixed(2);
      const isPositive = chosenType === 'CREDIT' || chosenType === 'INTEREST' || chosenType === 'SETTLEMENT';
      const formattedAmount = `${isPositive ? '+' : '-'}₹${Number(randomAmount).toLocaleString('en-IN')}`;

      const newEntry: LedgerEntry = {
        id: `TX-${Math.floor(90000 + Math.random() * 9999)}`,
        time: new Date().toTimeString().split(' ')[0],
        type: chosenType,
        account: `ACC #${Math.floor(1000 + Math.random() * 8999)} (Live Stream Ingest)`,
        amount: formattedAmount,
        balanceAfter: `₹${(1490000 + Math.random() * 50000).toLocaleString('en-IN')}`,
        status: 'COMMITTED',
      };

      setEntries((prev) => [newEntry, ...prev.slice(0, 5)]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <section id="live-stream" className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-6 sm:p-10 shadow-2xl overflow-hidden relative">
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#155EEF]/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

        {/* Header bar */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
          <div className="text-left space-y-1">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-[#155EEF]" />
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Live Double-Entry Ledger Stream
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Real-time immutable PostgreSQL double-entry commits with exact NUMERIC(14,2) decimal precision.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 border border-slate-700 flex items-center gap-2 cursor-pointer transition-all"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPlaying ? 'Pause Feed' : 'Resume Live Stream'}</span>
            </button>

            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>SUB-10MS LATENCY</span>
            </span>
          </div>
        </div>

        {/* Table Ledger Feed */}
        <div className="relative z-10 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="pb-3 font-bold">Time</th>
                <th className="pb-3 font-bold">Tx Hash</th>
                <th className="pb-3 font-bold">Operation Type</th>
                <th className="pb-3 font-bold">Target Account</th>
                <th className="pb-3 font-bold text-right">Delta Amount</th>
                <th className="pb-3 font-bold text-right">Balance State</th>
                <th className="pb-3 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {entries.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors animate-fade-in">
                  <td className="py-3 text-slate-400">{tx.time}</td>
                  <td className="py-3 text-blue-300 font-bold">{tx.id}</td>
                  <td className="py-3">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
                        tx.type === 'CREDIT'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : tx.type === 'DEBIT'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{tx.account}</td>
                  <td className={`py-3 text-right font-bold ${tx.amount.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.amount}
                  </td>
                  <td className="py-3 text-right text-slate-200 font-bold">{tx.balanceAfter}</td>
                  <td className="py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      <span>COMMITTED</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="relative z-10 mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono text-slate-400 gap-2">
          <span>Database Engine: PostgreSQL NUMERIC(14,2) Multi-Tenant Shard</span>
          <span className="text-slate-400">* Simulated live ledger events for architecture visualization.</span>
        </div>
      </div>
    </section>
  );
};
