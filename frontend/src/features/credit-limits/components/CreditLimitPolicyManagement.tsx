'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Plus,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Layers,
  Percent,
  Calendar,
  DollarSign,
  ChevronRight,
} from 'lucide-react';
import { useCreditPolicies, useCreateCreditPolicy } from '../hooks/useCreditLimits';
import { CreditLimitPolicy, CreateCreditLimitPolicyDto, RiskGrade } from '../types';

export function CreditLimitPolicyManagement() {
  const { data: policies = [], isLoading } = useCreditPolicies();
  const createPolicyMutation = useCreateCreditPolicy();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [maxCustomerExposure, setMaxCustomerExposure] = useState<number>(1000000);
  const [maxActiveFacilities, setMaxActiveFacilities] = useState<number>(2);
  const [maxConcurrentDrawdowns, setMaxConcurrentDrawdowns] = useState<number>(5);
  const [drawdownFeePct, setDrawdownFeePct] = useState<number>(0.5);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPolicyMutation.mutateAsync({
      code: code || `POL-LIMIT-${Date.now()}`,
      name,
      description,
      maxCustomerExposure,
      maxActiveFacilitiesPerCustomer: maxActiveFacilities,
      maxConcurrentDrawdowns,
      drawdownFeePct,
      drawdownFeeMinInr: 100,
      gstRatePct: 18.0,
      repaymentRestoresLimit: true,
      excessExposurePolicy: 'BLOCK_DRAWDOWN',
      validityMonths: 24,
    });
    setIsCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-indigo-600" />
            Credit Limit Policies Studio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure institutional exposure caps, risk-grade limits, revolving parameters, and drawdown fees.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Policy Configuration
        </button>
      </div>

      {/* Policy List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-500">Loading credit limit policies...</div>
      ) : policies.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <p className="text-slate-500">No credit limit policies found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-6 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-bold text-slate-900">{policy.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {policy.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono font-bold">
                      v{policy.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{policy.code} • {policy.description}</p>
                </div>

                <div className="text-xs text-slate-400">
                  Effective: {new Date(policy.effectiveFrom).toLocaleDateString()}
                </div>
              </div>

              {/* Exposure & Drawdown Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 block">Max Total Exposure</span>
                  <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                    ₹{(policy.maxCustomerExposure / 100000).toFixed(1)} Lakhs
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 block">Active Facilities Cap</span>
                  <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                    {policy.maxActiveFacilitiesPerCustomer} Facilities
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 block">Drawdown Platform Fee</span>
                  <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                    {policy.drawdownFeePct}% + 18% GST
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 block">Facility Validity</span>
                  <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                    {policy.validityMonths} Months
                  </span>
                </div>
              </div>

              {/* Risk Grade Limits Matrix */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Risk-Based Credit Limit & Revolving Allowance Matrix
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/60 font-semibold">
                        <th className="py-2 px-3">Risk Grade</th>
                        <th className="py-2 px-3">Min Bureau Score</th>
                        <th className="py-2 px-3 text-right">Max Limit Cap (₹)</th>
                        <th className="py-2 px-3 text-center">Revolving Credit Line</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {policy.riskLimitCaps.map((cap) => (
                        <tr key={cap.riskGrade} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-bold text-slate-900">
                            Grade {cap.riskGrade}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600">
                            {cap.minCibilScore > 0 ? `${cap.minCibilScore}+` : 'N/A'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {cap.maxLimitCap > 0 ? `₹${cap.maxLimitCap.toLocaleString('en-IN')}` : '₹0 (Ineligible)'}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {cap.allowRevolving ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Allowed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" /> Blocked
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">New Credit Limit Policy</h2>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. High Net-Worth Revolving Credit Policy"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Policy Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. POL-LIMIT-HNW-001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Institutional intent and applicable bounds..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Customer Exposure (₹)</label>
                  <input
                    type="number"
                    step="50000"
                    value={maxCustomerExposure}
                    onChange={(e) => setMaxCustomerExposure(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Drawdown Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={drawdownFeePct}
                    onChange={(e) => setDrawdownFeePct(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPolicyMutation.isPending}
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                >
                  {createPolicyMutation.isPending ? 'Creating...' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
