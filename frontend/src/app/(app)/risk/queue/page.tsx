'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Search, ArrowRight, Eye, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface QueueItem {
  applicationId: string;
  applicationNo: string;
  customerName: string;
  customerCode: string;
  productName: string;
  requestedAmount: number;
  tenureMonths: number;
  riskScore: number;
  riskBand: 'LOW' | 'MODERATE' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  riskGrade: 'A' | 'B' | 'C' | 'D' | 'E';
  status: string;
  createdAt: string;
}

export default function RiskQueuePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [bandFilter, setBandFilter] = useState('ALL');

  const [queueItems] = useState<QueueItem[]>([
    {
      applicationId: 'app-queue-001',
      applicationNo: 'APP-2026-901',
      customerName: 'Aarav Sharma',
      customerCode: 'CUST-001',
      productName: 'Instant Personal Loan',
      requestedAmount: 150000,
      tenureMonths: 24,
      riskScore: 22,
      riskBand: 'MODERATE',
      riskGrade: 'B',
      status: 'UNDERWRITING',
      createdAt: new Date().toISOString(),
    },
    {
      applicationId: 'app-queue-002',
      applicationNo: 'APP-2026-902',
      customerName: 'Rohan Verma',
      customerCode: 'CUST-002',
      productName: 'Retail Term Facility',
      requestedAmount: 400000,
      tenureMonths: 36,
      riskScore: 48,
      riskBand: 'MEDIUM',
      riskGrade: 'C',
      status: 'CREDIT_ASSESSMENT',
      createdAt: new Date().toISOString(),
    },
    {
      applicationId: 'app-queue-003',
      applicationNo: 'APP-2026-903',
      customerName: 'Priya Patel',
      customerCode: 'CUST-003',
      productName: 'Women Entrepreneur Loan',
      requestedAmount: 250000,
      tenureMonths: 24,
      riskScore: 16,
      riskBand: 'LOW',
      riskGrade: 'A',
      status: 'READY_FOR_SANCTION',
      createdAt: new Date().toISOString(),
    },
    {
      applicationId: 'app-queue-004',
      applicationNo: 'APP-2026-904',
      customerName: 'Sanjay Gupta',
      customerCode: 'CUST-004',
      productName: 'Personal Loan High-Ticket',
      requestedAmount: 750000,
      tenureMonths: 48,
      riskScore: 68,
      riskBand: 'HIGH',
      riskGrade: 'D',
      status: 'UNDERWRITING_REVIEW',
      createdAt: new Date().toISOString(),
    },
  ]);

  const filtered = queueItems.filter((item) => {
    if (bandFilter !== 'ALL' && item.riskBand !== bandFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        item.applicationNo.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.customerCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Risk Assessment Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Applications awaiting underwriting signal calibration, repayment capacity review, or manual grade sign-off.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Application No, Customer Name, Code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
          {['ALL', 'LOW', 'MODERATE', 'MEDIUM', 'HIGH', 'VERY_HIGH'].map((band) => (
            <button
              key={band}
              onClick={() => setBandFilter(band)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                bandFilter === band
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {band}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3 font-bold">Application No</th>
                <th className="px-4 py-3 font-bold">Borrower Details</th>
                <th className="px-4 py-3 font-bold">Loan Product</th>
                <th className="px-4 py-3 font-bold">Amount & Tenure</th>
                <th className="px-4 py-3 font-bold">Risk Score</th>
                <th className="px-4 py-3 font-bold">Authoritative Grade</th>
                <th className="px-4 py-3 font-bold">Status</th>
                <th className="px-4 py-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((app) => (
                <tr key={app.applicationId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-3.5 font-bold text-blue-600 dark:text-blue-400 font-mono">
                    {app.applicationNo}
                  </td>
                  <td className="px-4 py-3.5">
                    <strong className="text-slate-900 dark:text-slate-100 block font-bold">{app.customerName}</strong>
                    <span className="font-mono text-[10px] text-slate-400">{app.customerCode}</span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                    {app.productName}
                  </td>
                  <td className="px-4 py-3.5 text-slate-800 dark:text-slate-200 font-bold">
                    ₹{app.requestedAmount.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">({app.tenureMonths}m)</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-sm">{app.riskScore}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {app.riskBand}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`h-6 w-6 rounded-md flex items-center justify-center font-black text-xs text-white ${
                        app.riskGrade === 'A'
                          ? 'bg-emerald-500'
                          : app.riskGrade === 'B'
                          ? 'bg-blue-600'
                          : app.riskGrade === 'C'
                          ? 'bg-amber-500'
                          : app.riskGrade === 'D'
                          ? 'bg-orange-500'
                          : 'bg-rose-600'
                      }`}
                    >
                      {app.riskGrade}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/risk/evaluations/${app.applicationId}`}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 inline-flex items-center gap-1 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect
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
