'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Plus, CheckCircle2, ShieldCheck, History, ArrowRight } from 'lucide-react';
import { RiskPolicy, CreateRiskPolicyDto } from '../types';
import { getRiskPolicies, createRiskPolicy, publishRiskPolicy } from '../api';
import { useToast } from '@/lib/toast';

export function RiskPolicyManager() {
  const toast = useToast();
  const [policies, setPolicies] = useState<RiskPolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<RiskPolicy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  // Form state for new draft
  const [code, setCode] = useState('RISK_POL_CUSTOM');
  const [name, setName] = useState('Custom Product Risk Policy');
  const [description, setDescription] = useState('Customized risk weights and scoring bands');
  const [weights, setWeights] = useState({
    CUSTOMER: 15,
    FINANCIAL: 25,
    CREDIT: 25,
    BANKING: 20,
    APPLICATION: 10,
    BEHAVIORAL: 5,
  });

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const res = await getRiskPolicies();
      setPolicies(res.policies || []);
      if (res.policies && res.policies.length > 0) {
        setSelectedPolicy(res.policies[0]);
      }
    } catch (err: any) {
      toast.error('Failed to load risk policies.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const totalWeight = Object.values(weights).reduce((a, b) => a + Number(b), 0);

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      toast.error(`Category weights must sum to 100% (currently ${totalWeight}%).`, 'Invalid Weights');
      return;
    }

    try {
      const created = await createRiskPolicy({
        code,
        name,
        description,
        categoryWeights: weights,
      });
      toast.success(`Risk policy ${created.code} drafted successfully.`, 'Draft Created');
      setCreating(false);
      loadPolicies();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create policy');
    }
  };

  const handlePublish = async (policyId: string) => {
    try {
      await publishRiskPolicy(policyId);
      toast.success('Institutional risk policy is now ACTIVE across all origination workflows.', 'Policy Published');
      loadPolicies();
    } catch (err: any) {
      toast.error(err.message || 'Publish failed');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs font-semibold text-slate-400">Loading Risk Policies...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Institutional Risk Policy Studio & Versioning
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure 6-pillar category scoring weights, deterministic risk bands, and manage policy release versions.
          </p>
        </div>
        <button
          onClick={() => setCreating(!creating)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-sm shadow-blue-600/30 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {creating ? 'Cancel Draft' : 'Draft New Policy'}
        </button>
      </div>

      {/* Policy List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Policy Selector */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Version History ({policies.length})
          </span>
          <div className="space-y-2">
            {policies.map((p) => {
              const isSelected = selectedPolicy?.id === p.id;
              const isActive = p.status === 'ACTIVE';
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPolicy(p)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {p.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : p.status === 'DRAFT'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {p.status} (v{p.version})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {p.description}
                  </p>
                  <span className="text-[10px] text-slate-400 block mt-2">
                    Effective From: {new Date(p.effectiveFrom).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Policy Details or Creation Form */}
        <div className="lg:col-span-2">
          {creating ? (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Draft New Institutional Risk Policy Version
              </h4>

              <form onSubmit={handleCreateDraft} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Policy Code</label>
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Policy Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                    required
                  />
                </div>

                {/* Weights Sliders */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Category Scoring Weights (%)</span>
                    <span className={`text-xs font-bold ${totalWeight === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Total: {totalWeight}% / 100%
                    </span>
                  </div>

                  {Object.entries(weights).map(([cat, val]) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{cat} Pillar</span>
                        <strong>{val}%</strong>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        value={val}
                        onChange={(e) => setWeights({ ...weights, [cat]: Number(e.target.value) })}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
                  >
                    Save Draft Policy
                  </button>
                </div>
              </form>
            </div>
          ) : selectedPolicy ? (
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedPolicy.name} ({selectedPolicy.code})
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedPolicy.description}
                  </p>
                </div>

                {selectedPolicy.status === 'DRAFT' && (
                  <button
                    onClick={() => handlePublish(selectedPolicy.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm shadow-emerald-600/30"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Publish Policy
                  </button>
                )}
              </div>

              {/* Scoring Weights Grid */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Category Weights Allocation
                </span>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(selectedPolicy.categoryWeights || {}).map(([cat, w]) => (
                    <div key={cat} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">{cat}</span>
                      <span className="text-lg font-black text-slate-900 dark:text-slate-100">{w}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Bands Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Deterministic Score Bands & Authoritative Grades
                </span>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 font-bold">Score Range</th>
                        <th className="px-4 py-2.5 font-bold">Risk Band</th>
                        <th className="px-4 py-2.5 font-bold">Risk Grade</th>
                        <th className="px-4 py-2.5 font-bold">Underwriting Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(selectedPolicy.bands || []).map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{b.minScore} – {b.maxScore}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {b.band}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-black text-blue-600 dark:text-blue-400">Grade {b.riskGrade}</td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{b.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
