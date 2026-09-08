'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  Building2,
  ChevronRight,
  FileCheck,
  BadgeAlert
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CustomerApplicationsPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers/me');
      setCustomer(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading loan applications...</p>
        </div>
      </div>
    );
  }

  const applications = customer?.applications || [];

  const statusSteps = [
    { key: 'DRAFT', label: 'Draft' },
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDERWRITING', label: 'Underwriting' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'DISBURSED', label: 'Disbursed' },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'SUBMITTED':
      case 'KYC_PENDING':
      case 'KYC_VERIFIED': return 1;
      case 'UNDER_REVIEW':
      case 'CREDIT_ASSESSMENT':
      case 'UNDERWRITING': return 2;
      case 'APPROVED':
      case 'AGREEMENT_PENDING':
      case 'READY_FOR_DISBURSEMENT': return 3;
      case 'DISBURSED': return 4;
      default: return 1;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Loan Applications
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track real-time underwriting progress and approval status for all submitted applications
          </p>
        </div>
        <Link
          href="/customers/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Apply for New Loan</span>
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 space-y-4">
          <FileText className="h-12 w-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Active Applications</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You haven't submitted any loan applications yet. Submit your information to receive preliminary offers.
          </p>
          <Link
            href="/customers/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold"
          >
            Start New Application →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app: any) => {
            const currentStepIdx = getStepIndex(app.status);
            const isRejected = app.status === 'REJECTED' || app.status === 'CANCELLED';

            return (
              <div
                key={app.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
              >
                {/* Top Title & Status Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400">
                        APP #{app.applicationCode || app.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        Submitted on {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {app.productName || app.product?.name || 'Personal Loan Application'}
                    </h2>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      app.status === 'DISBURSED' || app.status === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                {/* Amount & Tenure Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2445]/50 space-y-1">
                    <div className="text-slate-400 font-medium">Requested Amount</div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      ₹{parseFloat(app.requestedAmount || '0').toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2445]/50 space-y-1">
                    <div className="text-slate-400 font-medium">Tenure Requested</div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {app.tenureMonths} Months
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2445]/50 space-y-1">
                    <div className="text-slate-400 font-medium">Interest Rate</div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {app.interestRate || app.product?.minRate || '12.5'}% p.a.
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#1E2445]/50 space-y-1">
                    <div className="text-slate-400 font-medium">Purpose</div>
                    <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                      {app.purpose || 'Personal Use'}
                    </div>
                  </div>
                </div>

                {/* Step Progress Tracker Bar */}
                {!isRejected && (
                  <div className="pt-2 space-y-3">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Real-time Lifecycle Tracker
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {statusSteps.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        return (
                          <div key={step.key} className="space-y-1.5 text-center">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                isDone
                                  ? 'bg-brand-600 dark:bg-brand-400'
                                  : 'bg-slate-100 dark:bg-slate-800'
                              }`}
                            />
                            <span
                              className={`text-[10px] font-bold block truncate ${
                                isCurrent
                                  ? 'text-brand-600 dark:text-brand-400'
                                  : isDone
                                  ? 'text-slate-800 dark:text-slate-200'
                                  : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
