'use client';

import React, { useState } from 'react';
import {
  FileCode2,
  Plus,
  Copy,
  CheckCircle2,
  Archive,
  Layers,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronRight,
  Shield,
  AlertTriangle,
  Info,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Tag,
  Percent,
} from 'lucide-react';
import {
  useDecisionPolicies,
  useActivatePolicy,
  useArchivePolicy,
  useCreatePolicyVersion,
  useUpdateDecisionPolicy,
  useCreateDecisionPolicy,
} from '../hooks/useDecisionEngine';
import {
  DecisionPolicy,
  DecisionRuleGroup,
  DecisionRule,
  RuleCategory,
  PolicyStatus,
} from '../types';
import { RuleBuilderModal } from './RuleBuilderModal';

export const PolicyManagement: React.FC = () => {
  const { data: policies = [], isLoading, refetch } = useDecisionPolicies();
  const activatePolicy = useActivatePolicy();
  const archivePolicy = useArchivePolicy();
  const createVersion = useCreatePolicyVersion();
  const updatePolicy = useUpdateDecisionPolicy();
  const createPolicy = useCreateDecisionPolicy();

  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Rule Editing Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DecisionRule | null>(null);
  const [activeTargetGroupId, setActiveTargetGroupId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<RuleCategory>('ELIGIBILITY');

  // Collapsed rule groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    ELIGIBILITY: true,
    CREDIT: true,
    FINANCIAL: true,
    BANKING: true,
    KYC_DOCS: true,
    FRAUD_RISK: true,
  });

  // Selected policy object
  const activePolicy =
    policies.find((p) => p.id === selectedPolicyId) ||
    policies.find((p) => p.status === 'ACTIVE') ||
    policies[0] ||
    null;

  const filteredPolicies = policies.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.productCode && p.productCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const handleOpenAddRule = (groupId: string, cat: RuleCategory) => {
    setEditingRule(null);
    setActiveTargetGroupId(groupId);
    setActiveCategory(cat);
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (groupId: string, rule: DecisionRule) => {
    setEditingRule(rule);
    setActiveTargetGroupId(groupId);
    setActiveCategory(rule.category);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (savedRule: DecisionRule) => {
    if (!activePolicy || !activeTargetGroupId) return;

    const updatedGroups = activePolicy.ruleGroups.map((group) => {
      if (group.id === activeTargetGroupId || group.category === activeCategory) {
        const ruleIndex = group.rules.findIndex((r) => r.id === savedRule.id);
        let newRules = [...group.rules];
        if (ruleIndex >= 0) {
          newRules[ruleIndex] = savedRule;
        } else {
          newRules.push(savedRule);
        }
        return { ...group, rules: newRules };
      }
      return group;
    });

    updatePolicy.mutate({
      id: activePolicy.id,
      dto: { ruleGroups: updatedGroups },
    });
  };

  const handleDeleteRule = (groupId: string, ruleId: string) => {
    if (!activePolicy) return;
    if (!confirm('Are you sure you want to remove this underwriting rule?')) return;

    const updatedGroups = activePolicy.ruleGroups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          rules: group.rules.filter((r) => r.id !== ruleId),
        };
      }
      return group;
    });

    updatePolicy.mutate({
      id: activePolicy.id,
      dto: { ruleGroups: updatedGroups },
    });
  };

  const handleToggleRule = (groupId: string, ruleId: string) => {
    if (!activePolicy) return;

    const updatedGroups = activePolicy.ruleGroups.map((group) => {
      if (group.id === groupId) {
        return {
          ...group,
          rules: group.rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r)),
        };
      }
      return group;
    });

    updatePolicy.mutate({
      id: activePolicy.id,
      dto: { ruleGroups: updatedGroups },
    });
  };

  const handleActivate = (policyId: string) => {
    if (confirm('Activate this Decision Policy as the current live production policy for this product?')) {
      activatePolicy.mutate(policyId);
    }
  };

  const handleCreateNewVersion = (policyId: string) => {
    if (confirm('Create a new incremental version (v+1) of this Decision Policy?')) {
      createVersion.mutate(policyId);
    }
  };

  const handleArchive = (policyId: string) => {
    if (confirm('Archive this Decision Policy version?')) {
      archivePolicy.mutate(policyId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-400" />
            Decision Policy Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure versioned, deterministic underwriting policy rulebooks linked to Loan Products
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700 transition-colors"
            title="Refresh policies"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              const code = prompt('Enter new Policy Code (e.g. MSME_BUSINESS_CREDIT_POLICY):');
              if (code) {
                createPolicy.mutate({
                  code: code.toUpperCase().trim(),
                  name: `${code.replace(/_/g, ' ')}`,
                  description: 'Configurable enterprise credit decision policy',
                  ruleGroups: [
                    {
                      id: `group_eligibility_${Date.now()}`,
                      code: 'ELIGIBILITY_CRITERIA',
                      name: 'Applicant Eligibility Group',
                      description: 'Basic borrower age, citizenship and tenure verification',
                      category: 'ELIGIBILITY',
                      logicalOperator: 'AND',
                      enabled: true,
                      rules: [],
                    },
                    {
                      id: `group_credit_${Date.now()}`,
                      code: 'CREDIT_CRITERIA',
                      name: 'Bureau & Credit History Group',
                      description: 'CIBIL / Experian score, DPD, delinquency rules',
                      category: 'CREDIT',
                      logicalOperator: 'AND',
                      enabled: true,
                      rules: [],
                    },
                  ],
                });
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Policy
          </button>
        </div>
      </div>

      {/* Main Grid: Policy Sidebar List + Policy Detail & Rule Groups */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Policy Selector & Filter (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search policies or products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* List of Policies */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredPolicies.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No matching decision policies found.
                </div>
              ) : (
                filteredPolicies.map((pol) => {
                  const isSelected = activePolicy?.id === pol.id;
                  const totalRules = (pol.ruleGroups || []).reduce(
                    (acc, g) => acc + (g.rules || []).length,
                    0
                  );

                  return (
                    <div
                      key={pol.id}
                      onClick={() => setSelectedPolicyId(pol.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-xs text-white truncate">{pol.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            pol.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : pol.status === 'DRAFT'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {pol.status} v{pol.version}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-mono text-indigo-300/80">{pol.code}</span>
                        <span>{totalRules} Rules in {pol.ruleGroups?.length || 0} Groups</span>
                      </div>

                      {pol.productCode && (
                        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-slate-500" />
                          <span>Product:</span>
                          <span className="font-semibold text-slate-300">{pol.productCode}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Policy Workspace & Rule Groups (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activePolicy ? (
            <div className="space-y-4">
              {/* Policy Header Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-lg font-bold text-white tracking-tight">
                        {activePolicy.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Version {activePolicy.version}.0
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{activePolicy.description}</p>
                  </div>

                  {/* Version Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {activePolicy.status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleActivate(activePolicy.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Activate Live
                      </button>
                    )}

                    <button
                      onClick={() => handleCreateNewVersion(activePolicy.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95"
                      title="Clone as new incremental version"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      New Version (v{activePolicy.version + 1})
                    </button>

                    {activePolicy.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleArchive(activePolicy.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 border border-slate-800 transition-colors"
                        title="Archive version"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Policy Metadata & Scoring Weights strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                  <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Policy Code</span>
                    <span className="font-mono text-indigo-300 font-semibold">{activePolicy.code}</span>
                  </div>

                  <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Target Product</span>
                    <span className="font-semibold text-slate-200">{activePolicy.productCode || 'ALL_PRODUCTS'}</span>
                  </div>

                  <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Effective Date</span>
                    <span className="text-slate-300">
                      {new Date(activePolicy.effectiveFrom || activePolicy.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Rule Count</span>
                    <span className="font-bold text-white">
                      {(activePolicy.ruleGroups || []).reduce((sum, g) => sum + (g.rules?.length || 0), 0)} Rules
                    </span>
                  </div>
                </div>
              </div>

              {/* Rule Groups Container */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Policy Rule Groups ({activePolicy.ruleGroups?.length || 0})
                  </h3>
                </div>

                {activePolicy.ruleGroups?.map((group) => {
                  const isExpanded = expandedGroups[group.category] ?? true;
                  const enabledCount = (group.rules || []).filter((r) => r.enabled).length;

                  return (
                    <div
                      key={group.id}
                      className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
                    >
                      {/* Group Header Bar */}
                      <div
                        onClick={() => toggleGroup(group.category)}
                        className="flex items-center justify-between p-4 bg-slate-950/40 hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-800/60"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{group.name}</span>
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800">
                                {group.logicalOperator}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs text-slate-400 font-medium">
                            {enabledCount}/{group.rules?.length || 0} active
                          </span>

                          <button
                            onClick={() => handleOpenAddRule(group.id, group.category)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Rule
                          </button>
                        </div>
                      </div>

                      {/* Rule Items Table / Cards */}
                      {isExpanded && (
                        <div className="p-4 space-y-3">
                          {(!group.rules || group.rules.length === 0) ? (
                            <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                              No rules defined in this group. Click &quot;Add Rule&quot; to configure criteria.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {group.rules.map((rule) => (
                                <div
                                  key={rule.id}
                                  className={`p-3.5 rounded-xl border transition-all ${
                                    rule.enabled
                                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                                      : 'bg-slate-950/20 border-slate-900 opacity-60'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    {/* Left: Code, Name & Condition */}
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-indigo-300">
                                          {rule.code}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-200">
                                          {rule.name}
                                        </span>
                                        <span
                                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                            rule.severity === 'HARD_STOP'
                                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                              : rule.severity === 'HIGH'
                                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                              : 'bg-slate-800 text-slate-400'
                                          }`}
                                        >
                                          {rule.severity}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                                        <span className="text-indigo-400">{rule.field}</span>
                                        <span className="text-amber-400">{rule.operator}</span>
                                        <span className="text-emerald-300">
                                          {Array.isArray(rule.expectedValue)
                                            ? `[${rule.expectedValue.join(', ')}]`
                                            : String(rule.expectedValue)}
                                        </span>
                                      </div>

                                      {rule.customerReason && (
                                        <p className="text-[11px] text-slate-500 italic">
                                          Customer Reason: {rule.customerReason}
                                        </p>
                                      )}
                                    </div>

                                    {/* Right: Actions */}
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleToggleRule(group.id, rule.id)}
                                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                                          rule.enabled
                                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                            : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                                        }`}
                                      >
                                        {rule.enabled ? 'Enabled' : 'Disabled'}
                                      </button>

                                      <button
                                        onClick={() => handleOpenEditRule(group.id, rule)}
                                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                                        title="Edit rule"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => handleDeleteRule(group.id, rule.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                                        title="Delete rule"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
              Select or create a Decision Policy to configure rules.
            </div>
          )}
        </div>
      </div>

      {/* Rule Builder Modal */}
      <RuleBuilderModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={handleSaveRule}
        initialRule={editingRule}
        category={activeCategory}
      />
    </div>
  );
};
