'use client';

import React, { useState } from 'react';
import {
  usePricingPolicies,
  useCreatePricingPolicy,
  useCreatePolicyVersion,
  useActivatePricingPolicy,
} from '../hooks/useOffers';
import type { PricingPolicy, CreatePricingPolicyDto } from '../types';
import {
  Sliders,
  Sparkles,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
  IndianRupee,
  Percent,
  Calendar,
  Layers,
  ArrowRight,
  FileText,
} from 'lucide-react';

export const PricingPolicyManagement: React.FC = () => {
  const { data: policies = [], isLoading } = usePricingPolicies();
  const createMutation = useCreatePricingPolicy();
  const versionMutation = useCreatePolicyVersion();
  const activateMutation = useActivatePricingPolicy();

  const [selectedPolicy, setSelectedPolicy] = useState<PricingPolicy | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseRate, setBaseRate] = useState('14.5');
  const [interestModel, setInterestModel] = useState<'REDUCING_BALANCE' | 'FIXED_FLAT'>('REDUCING_BALANCE');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    await createMutation.mutateAsync({
      code,
      name,
      description,
      baseRateAnnualPct: parseFloat(baseRate) || 14.5,
      interestModel,
    });

    setIsCreateModalOpen(false);
    setCode('');
    setName('');
    setDescription('');
  };

  const handleCreateVersion = async (policyId: string) => {
    if (confirm('Create a new Draft version of this pricing policy?')) {
      await versionMutation.mutateAsync(policyId);
    }
  };

  const handleActivate = async (policyId: string) => {
    if (confirm('Activate this pricing policy version? (Previous versions will be archived)')) {
      await activateMutation.mutateAsync(policyId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Pricing & Offer Policies</h1>
          <p className="text-sm text-slate-400">
            Configure risk-graded interest spreads, fee schedules, GST policies, and offer validity limits
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition"
        >
          <Plus className="h-4 w-4" />
          Create Pricing Policy
        </button>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {isLoading ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-indigo-500" />
            <p className="mt-2 text-xs">Loading pricing policies...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500">
            <Sliders className="mx-auto h-8 w-8 stroke-[1.2] text-slate-700" />
            <p className="mt-2 text-sm font-medium text-slate-400">No pricing policies configured</p>
          </div>
        ) : (
          policies.map((policy) => (
            <div
              key={policy.id}
              className={`rounded-2xl border bg-slate-900 p-6 shadow-xl transition space-y-4 ${
                policy.status === 'ACTIVE'
                  ? 'border-indigo-500/30 ring-1 ring-indigo-500/20'
                  : 'border-slate-800'
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{policy.name}</h3>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">
                      v{policy.version}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{policy.code}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    policy.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : policy.status === 'DRAFT'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {policy.status}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{policy.description}</p>

              {/* Core Parameters */}
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-950 p-3.5 text-xs border border-slate-800/80">
                <div>
                  <span className="text-slate-500">Base Rack Rate</span>
                  <p className="mt-1 font-bold text-indigo-400">{policy.baseRateAnnualPct.toFixed(2)}% p.a.</p>
                </div>
                <div>
                  <span className="text-slate-500">Interest Model</span>
                  <p className="mt-1 font-bold text-slate-200">
                    {policy.interestModel === 'REDUCING_BALANCE' ? 'Reducing' : 'Flat'}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Validity</span>
                  <p className="mt-1 font-bold text-amber-400">{policy.maxValidityHours} Hours</p>
                </div>
              </div>

              {/* Risk Spread Matrix */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Risk Grade Pricing Adjustments
                </h4>
                <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                  {policy.riskAdjustments.map((ra) => (
                    <div
                      key={ra.riskGrade}
                      className={`rounded-lg p-2 border ${
                        ra.isOfferable
                          ? 'border-slate-800 bg-slate-950'
                          : 'border-rose-900/30 bg-rose-950/20 opacity-60'
                      }`}
                    >
                      <span className="font-bold text-slate-300">Grade {ra.riskGrade}</span>
                      <p className={`mt-1 font-semibold ${ra.spreadBps < 0 ? 'text-emerald-400' : ra.spreadBps > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        {ra.spreadBps > 0 ? `+${ra.spreadBps / 100}%` : `${ra.spreadBps / 100}%`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                <span className="text-slate-500 text-[11px]">
                  Updated {new Date(policy.updatedAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  {policy.status === 'DRAFT' && (
                    <button
                      onClick={() => handleActivate(policy.id)}
                      disabled={activateMutation.isPending}
                      className="rounded-lg bg-emerald-600/20 px-3 py-1.5 font-semibold text-emerald-400 hover:bg-emerald-600/30 transition"
                    >
                      Activate v{policy.version}
                    </button>
                  )}
                  {policy.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleCreateVersion(policy.id)}
                      disabled={versionMutation.isPending}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 font-semibold text-slate-300 hover:bg-slate-700 transition"
                    >
                      Draft v{policy.version + 1}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Policy Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create New Pricing Policy</h3>
            <p className="text-xs text-slate-400">Define code, base interest rate, and model for lending offers.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium">Policy Code</label>
                <input
                  type="text"
                  placeholder="e.g. PRICING_MSME_EXP"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Policy Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. MSME Express Working Capital Pricing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium">Description</label>
                <textarea
                  rows={2}
                  placeholder="Policy description and risk parameters..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium">Base Rack Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={baseRate}
                    onChange={(e) => setBaseRate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium">Interest Model</label>
                  <select
                    value={interestModel}
                    onChange={(e) => setInterestModel(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="REDUCING_BALANCE">Reducing Balance</option>
                    <option value="FIXED_FLAT">Fixed Flat Rate</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
