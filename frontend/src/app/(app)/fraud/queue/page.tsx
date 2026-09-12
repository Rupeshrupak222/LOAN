'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, Search, Eye, AlertTriangle, ArrowRight } from 'lucide-react';

export default function FraudQueuePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const queue = [
    {
      id: 'app-fraud-q-01',
      appNo: 'APP-2026-801',
      customerName: 'Vikram Malhotra',
      customerCode: 'CUST-SYND-01',
      fraudScore: 88,
      fraudBand: 'CRITICAL',
      outcome: 'BLOCK',
      reasons: 'Shared burner device hardware ID with 3 other borrowers',
      status: 'UNDER_INVESTIGATION',
    },
    {
      id: 'app-fraud-q-02',
      appNo: 'APP-2026-802',
      customerName: 'Rohan Verma',
      customerCode: 'CUST-002',
      fraudScore: 65,
      fraudBand: 'HIGH',
      outcome: 'HIGH_RISK',
      reasons: 'Disbursement account reused across customer profiles',
      status: 'IN_REVIEW',
    },
    {
      id: 'app-fraud-q-03',
      appNo: 'APP-2026-803',
      customerName: 'Sameer Khan',
      customerCode: 'CUST-SYND-02',
      fraudScore: 78,
      fraudBand: 'HIGH',
      outcome: 'HIGH_RISK',
      reasons: 'Anonymized Tor proxy network & concurrent multi-partner burst',
      status: 'OPEN',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Fraud Review Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Applications flagged with elevated, high, or critical anomaly signals requiring investigator verification.
          </p>
        </div>
      </div>

      {/* Queue Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 font-bold">Application No</th>
                <th className="px-4 py-3 font-bold">Borrower Profile</th>
                <th className="px-4 py-3 font-bold">Fraud Index</th>
                <th className="px-4 py-3 font-bold">Outcome</th>
                <th className="px-4 py-3 font-bold">Primary Trigger Signal</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {queue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-3.5 font-bold font-mono text-rose-600 dark:text-rose-400">
                    {item.appNo}
                  </td>
                  <td className="px-4 py-3.5">
                    <strong className="text-slate-900 dark:text-slate-100 block font-bold">{item.customerName}</strong>
                    <span className="font-mono text-[10px] text-slate-400">{item.customerCode}</span>
                  </td>
                  <td className="px-4 py-3.5 font-black text-rose-600 dark:text-rose-400 text-sm">
                    {item.fraudScore}/100
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.outcome === 'BLOCK'
                          ? 'bg-rose-600 text-white'
                          : 'bg-orange-500/10 text-orange-600'
                      }`}
                    >
                      {item.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {item.reasons}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/fraud/cases`}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Investigate
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
