'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  TrendingUp,
  Clock,
  History,
  Receipt,
  FileText,
  Sliders,
  DollarSign,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import {
  useCreditFacility,
  useFacilityTransactions,
  useFacilityAdjustments,
  useAdjustLimit,
  useFacilityActions,
} from '../hooks/useCreditLimits';
import { DrawdownRequestModal } from './DrawdownRequestModal';

interface Props {
  facilityId: string;
}

export function CreditFacilityDetail({ facilityId }: Props) {
  const { data: facility, isLoading, error } = useCreditFacility(facilityId);
  const { data: transactions = [] } = useFacilityTransactions(facilityId);
  const { data: adjustments = [] } = useFacilityAdjustments(facilityId);

  const [activeTab, setActiveTab] = useState<'drawdowns' | 'history' | 'ledger'>('drawdowns');
  const [isDrawdownModalOpen, setIsDrawdownModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [newLimitInput, setNewLimitInput] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('SALARY_INCREASE');
  const [adjustComments, setAdjustComments] = useState('');

  const adjustLimitMutation = useAdjustLimit();
  const { suspend, freeze, resume, close } = useFacilityActions();

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading facility details...
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="py-20 text-center text-rose-600">
        <AlertTriangle className="w-10 h-10 mx-auto mb-3" />
        <p className="font-semibold">Failed to load credit facility #{facilityId}</p>
        <Link href="/credit-facilities" className="mt-4 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Facilities Desk
        </Link>
      </div>
    );
  }

  const utilPct = facility.approvedLimit > 0
    ? Math.round((facility.utilizedAmount / facility.approvedLimit) * 100)
    : 0;

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLimitInput || newLimitInput <= 0) return;
    await adjustLimitMutation.mutateAsync({
      facilityId: facility.id,
      data: {
        newLimit: newLimitInput,
        adjustmentType: adjustType,
        reasonCode: adjustReason,
        comments: adjustComments || `Manual ${adjustType} approved by underwriter`,
      },
    });
    setIsAdjustModalOpen(false);
  };

  const handleAction = async (action: 'suspend' | 'freeze' | 'resume' | 'close') => {
    const reason = prompt(`Enter mandatory reason for facility ${action.toUpperCase()}:`);
    if (!reason) return;

    if (action === 'suspend') await suspend.mutateAsync({ facilityId: facility.id, reason });
    if (action === 'freeze') await freeze.mutateAsync({ facilityId: facility.id, reason });
    if (action === 'resume') await resume.mutateAsync({ facilityId: facility.id, reason });
    if (action === 'close') await close.mutateAsync({ facilityId: facility.id, reason });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/credit-facilities"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Credit Facilities
        </Link>

        <div className="flex items-center gap-2">
          {facility.status === 'ACTIVE' && (
            <>
              <button
                onClick={() => {
                  setAdjustType('INCREASE');
                  setNewLimitInput(facility.approvedLimit + 25000);
                  setIsAdjustModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Increase Limit
              </button>
              <button
                onClick={() => {
                  setAdjustType('DECREASE');
                  setNewLimitInput(Math.max(10000, facility.approvedLimit - 25000));
                  setIsAdjustModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <MinusCircle className="w-3.5 h-3.5" />
                Decrease Limit
              </button>
              <button
                onClick={() => handleAction('freeze')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                Freeze Facility
              </button>
            </>
          )}

          {facility.status === 'FROZEN' && (
            <button
              onClick={() => handleAction('resume')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              Resume Facility
            </button>
          )}

          {facility.status === 'SUSPENDED' && (
            <button
              onClick={() => handleAction('resume')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              Resume Facility
            </button>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 font-mono">{facility.facilityNo}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                  Version v{facility.limitVersion}
                </span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    facility.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : facility.status === 'FROZEN'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {facility.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Borrower: <strong className="text-slate-900">{facility.customerName}</strong> ({facility.customerCode}) • {facility.productName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {facility.status === 'ACTIVE' && (
              <button
                onClick={() => setIsDrawdownModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm shadow-indigo-200"
              >
                <DollarSign className="w-4 h-4" />
                Request Drawdown
              </button>
            )}
          </div>
        </div>

        {/* Step-by-Step Lifecycle Stepper */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold">1. Credit Decision</div>
                <div className="text-[10px] text-emerald-600">Risk Grade {facility.riskGrade}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold">2. Authority Sanction</div>
                <div className="text-[10px] text-emerald-600">Approved Limit</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold">3. Facility Active</div>
                <div className="text-[10px] text-emerald-600">Active v{facility.limitVersion}</div>
              </div>
            </div>

            <div className={`flex items-center gap-2 p-2 rounded-lg ${facility.status === 'ACTIVE' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' : 'bg-slate-50 text-slate-400'}`}>
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <div className="font-bold">4. Drawdowns</div>
                <div className="text-[10px] text-indigo-600">{facility.drawdowns?.length || 0} disbursed</div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">
              <TrendingUp className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <div className="font-bold">5. Limit Restoration</div>
                <div className="text-[10px] text-slate-500">Auto on Repayment</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credit Capacity Meter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sanctioned Limit</div>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-2">
            ₹{facility.approvedLimit.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
            <span>Interest Rate: {facility.annualInterestRatePct}% p.a.</span>
            <span>Tenure: 12–24m</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Utilized Balance</span>
            <span className="font-bold text-indigo-600 font-mono">{utilPct}%</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 font-mono mt-2">
            ₹{facility.utilizedAmount.toLocaleString('en-IN')}
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  utilPct > 80 ? 'bg-rose-500' : utilPct > 50 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(utilPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available Capacity</div>
          <div className="text-3xl font-bold text-emerald-700 font-mono mt-2">
            ₹{facility.availableAmount.toLocaleString('en-IN')}
          </div>
          {facility.excessExposure > 0 ? (
            <div className="mt-3 text-xs text-rose-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Excess Exposure: ₹{facility.excessExposure.toLocaleString('en-IN')}
            </div>
          ) : (
            <div className="mt-3 text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready for immediate drawdown
            </div>
          )}
        </div>
      </div>

      {/* Tabs & Content */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
          <button
            onClick={() => setActiveTab('drawdowns')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'drawdowns'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Drawdown Disbursements ({facility.drawdowns?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Limit Adjustments ({adjustments.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-3.5 px-4 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Immutable Ledger ({transactions.length})
          </button>
        </div>

        <div className="p-6">
          {/* Tab 1: Drawdowns */}
          {activeTab === 'drawdowns' && (
            <div className="space-y-4">
              {!facility.drawdowns || facility.drawdowns.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  No drawdowns recorded on this facility yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                        <th className="py-3 px-4">Drawdown #</th>
                        <th className="py-3 px-4 text-right">Requested</th>
                        <th className="py-3 px-4 text-right">Fee + GST</th>
                        <th className="py-3 px-4 text-right">Net Disbursed</th>
                        <th className="py-3 px-4 text-right">Monthly EMI</th>
                        <th className="py-3 px-4">Tenure</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {facility.drawdowns.map((dd) => (
                        <tr key={dd.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                            {dd.drawdownNo}
                            {dd.purpose && <span className="block text-xs text-slate-400 font-sans">{dd.purpose}</span>}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-slate-900 font-mono">
                            ₹{dd.requestedAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            ₹{dd.totalDeductions.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-emerald-700 font-mono">
                            ₹{dd.netDisbursedAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-900">
                            ₹{dd.monthlyEmi.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{dd.tenureMonths} Months</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {dd.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500">
                            {new Date(dd.requestedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Adjustments */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {adjustments.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  Initial limit assigned at creation. No subsequent adjustments made.
                </div>
              ) : (
                <div className="space-y-3">
                  {adjustments.map((adj) => (
                    <div key={adj.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <span>Limit {adj.adjustmentType}:</span>
                          <span className="font-mono text-slate-500 line-through">₹{adj.oldLimit.toLocaleString('en-IN')}</span>
                          <span>→</span>
                          <span className="font-mono text-indigo-600 font-bold">₹{adj.newLimit.toLocaleString('en-IN')}</span>
                          <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-bold">v{adj.version}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">Reason: <strong className="text-slate-800">{adj.reasonCode}</strong> • {adj.comments}</p>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <div>Approved by {adj.approvedBy} ({adj.approvedByRole})</div>
                        <div className="mt-1">{new Date(adj.createdAt).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Ledger */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500">No ledger transactions found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                        <th className="py-3 px-4">Transaction Type</th>
                        <th className="py-3 px-4 text-right">Movement</th>
                        <th className="py-3 px-4 text-right">Sanctioned</th>
                        <th className="py-3 px-4 text-right">Utilized</th>
                        <th className="py-3 px-4 text-right">Available</th>
                        <th className="py-3 px-4">Description</th>
                        <th className="py-3 px-4 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-900">
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700">
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            {tx.type === 'DRAWDOWN' ? (
                              <span className="text-rose-600">-₹{tx.amount.toLocaleString('en-IN')}</span>
                            ) : tx.type === 'REPAYMENT_CREDIT' ? (
                              <span className="text-emerald-600">+₹{tx.amount.toLocaleString('en-IN')}</span>
                            ) : (
                              <span className="text-slate-900">₹{tx.amount.toLocaleString('en-IN')}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            ₹{tx.newApprovedLimit.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            ₹{tx.newUtilized.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                            ₹{tx.newAvailable.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">
                            {tx.description}
                          </td>
                          <td className="py-3 px-4 text-right text-xs text-slate-400">
                            {new Date(tx.createdAt).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drawdown Request Modal */}
      {isDrawdownModalOpen && (
        <DrawdownRequestModal
          facility={facility}
          isOpen={isDrawdownModalOpen}
          onClose={() => setIsDrawdownModalOpen(false)}
        />
      )}

      {/* Adjust Limit Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              {adjustType === 'INCREASE' ? 'Increase' : 'Decrease'} Credit Limit
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Current Sanctioned Limit: <strong>₹{facility.approvedLimit.toLocaleString('en-IN')}</strong> (v{facility.limitVersion})
            </p>

            <form onSubmit={handleAdjustSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Approved Limit (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={newLimitInput}
                  onChange={(e) => setNewLimitInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason Code
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="SALARY_INCREASE">Salary / Income Increase</option>
                  <option value="EXCELLENT_REPAYMENT">Consistent Repayment Track Record</option>
                  <option value="PORTFOLIO_REVIEW">Periodic Portfolio Limit Review</option>
                  <option value="RISK_MITIGATION">Risk Mitigation / Exposure Cap</option>
                  <option value="BORROWER_REQUEST">Borrower Explicit Request</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mandatory Notes & Approval Justification
                </label>
                <textarea
                  rows={3}
                  value={adjustComments}
                  onChange={(e) => setAdjustComments(e.target.value)}
                  placeholder="Provide underwriter audit commentary..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLimitMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                >
                  {adjustLimitMutation.isPending ? 'Saving...' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
