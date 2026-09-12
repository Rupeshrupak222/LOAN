'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, Plus, CheckCircle2, ShieldAlert, ToggleLeft, ToggleRight, Filter } from 'lucide-react';
import { FraudRule, FraudSignalCategory } from '../types';
import { getFraudRules, createFraudRule, updateFraudRule } from '../api';
import { useToast } from '@/lib/toast';

export function FraudRulesManager() {
  const toast = useToast();
  const [rules, setRules] = useState<FraudRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showNewModal, setShowNewModal] = useState<boolean>(false);

  // Form state
  const [code, setCode] = useState('FRAUD_RULE_CUSTOM');
  const [name, setName] = useState('Custom Fraud Detection Rule');
  const [description, setDescription] = useState('Flags anomalies based on configured business threshold');
  const [category, setCategory] = useState<FraudSignalCategory>('IDENTITY');
  const [field, setField] = useState('panNameMismatchScore');
  const [operator, setOperator] = useState('GREATER_THAN');
  const [expectedValue, setExpectedValue] = useState<any>('50');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [scoreImpact, setScoreImpact] = useState<number>(30);
  const [reasonCode, setReasonCode] = useState('WARN_CUSTOM_ANOMALY');

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await getFraudRules(selectedCategory !== 'ALL' ? selectedCategory : undefined);
      setRules(res.rules || []);
    } catch (err: any) {
      toast.error('Failed to load fraud rules.', 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [selectedCategory]);

  const handleToggle = async (rule: FraudRule) => {
    try {
      const updated = await updateFraudRule(rule.id, { enabled: !rule.enabled });
      toast.success(
        `Fraud rule ${rule.code} is now ${updated.enabled ? 'ACTIVE' : 'DISABLED'}.`,
        updated.enabled ? 'Rule Activated' : 'Rule Deactivated'
      );
      loadRules();
    } catch (err: any) {
      toast.error(err.message || 'Toggle Failed');
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createFraudRule({
        code,
        name,
        description,
        category,
        field,
        operator,
        expectedValue: isNaN(Number(expectedValue)) ? expectedValue : Number(expectedValue),
        severity,
        scoreImpact,
        reasonCode,
      });
      toast.success(`Fraud rule ${created.code} successfully registered.`, 'Rule Created');
      setShowNewModal(false);
      loadRules();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create rule');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Fraud Rule Engine & Threshold Configuration
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tenant-scoped configurable rules, operators, and severity penalty scores for automated anomaly detection.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-2 shadow-sm shadow-rose-600/30 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Fraud Rule
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
        {['ALL', 'IDENTITY', 'BANK_ACCOUNT', 'DEVICE', 'NETWORK', 'APPLICATION_VELOCITY'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rules Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs font-semibold text-slate-400">Loading Rules...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3 font-bold">Rule Code & Name</th>
                  <th className="px-4 py-3 font-bold">Category</th>
                  <th className="px-4 py-3 font-bold">Condition & Threshold</th>
                  <th className="px-4 py-3 font-bold">Severity</th>
                  <th className="px-4 py-3 font-bold">Penalty Impact</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-3.5">
                      <strong className="text-slate-900 dark:text-slate-100 block font-bold">{r.name}</strong>
                      <span className="font-mono text-[10px] text-slate-400">{r.code}</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{r.description}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {r.field} {r.operator} {String(r.expectedValue)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-600'
                            : r.severity === 'HIGH'
                            ? 'bg-orange-500/10 text-orange-600'
                            : r.severity === 'MEDIUM'
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-rose-600 dark:text-rose-400">
                      +{r.scoreImpact} pts
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.enabled
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleToggle(r)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          r.enabled
                            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {r.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Rule Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create Configurable Fraud Detection Rule</h4>
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Rule Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Rule Name</label>
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
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="IDENTITY">IDENTITY</option>
                  <option value="BANK_ACCOUNT">BANK_ACCOUNT</option>
                  <option value="DEVICE">DEVICE</option>
                  <option value="NETWORK">NETWORK</option>
                  <option value="APPLICATION_VELOCITY">APPLICATION_VELOCITY</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Context Field</label>
                  <input
                    type="text"
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Operator</label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="EQUALS">EQUALS</option>
                    <option value="NOT_EQUALS">NOT_EQUALS</option>
                    <option value="GREATER_THAN">GREATER_THAN</option>
                    <option value="GREATER_THAN_OR_EQUAL">GREATER_THAN_OR_EQUAL</option>
                    <option value="LESS_THAN">LESS_THAN</option>
                    <option value="CONTAINS">CONTAINS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Threshold</label>
                  <input
                    type="text"
                    value={expectedValue}
                    onChange={(e) => setExpectedValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Penalty Score Impact</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={scoreImpact}
                    onChange={(e) => setScoreImpact(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white"
                >
                  Save Fraud Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
