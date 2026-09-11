'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
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
  Clock,
  UserCheck,
  Building,
  Scale,
} from 'lucide-react';
import {
  useApprovalPolicies,
  useActivateApprovalPolicy,
  useArchiveApprovalPolicy,
  useCreatePolicyVersion,
  useUpdateApprovalPolicy,
  useCreateApprovalPolicy,
} from '../hooks/useApprovalMatrix';
import {
  ApprovalAuthorityPolicy,
  ApprovalLevelDefinition,
  AuthorityScope,
} from '../types';
import { formatMoney } from '@/lib/utils';
import { RiskGrade } from '@/features/decision-engine/types';

export const AuthorityMatrixManagement: React.FC = () => {
  const { data: policies = [], isLoading, refetch } = useApprovalPolicies();
  const activatePolicy = useActivateApprovalPolicy();
  const archivePolicy = useArchiveApprovalPolicy();
  const createVersion = useCreatePolicyVersion();
  const updatePolicy = useUpdateApprovalPolicy();
  const createPolicy = useCreateApprovalPolicy();

  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Level Modal State
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<ApprovalLevelDefinition | null>(null);

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

  const handleActivate = (policyId: string) => {
    if (confirm('Activate this Approval Authority Matrix as the authoritative live sanction policy?')) {
      activatePolicy.mutate(policyId);
    }
  };

  const handleCreateNewVersion = (policyId: string) => {
    if (confirm('Create a new incremental version (v+1) of this Approval Authority Matrix?')) {
      createVersion.mutate(policyId);
    }
  };

  const handleArchive = (policyId: string) => {
    if (confirm('Archive this Approval Authority Matrix version?')) {
      archivePolicy.mutate(policyId);
    }
  };

  const handleSaveLevel = (levelData: ApprovalLevelDefinition) => {
    if (!activePolicy) return;
    const existingIndex = activePolicy.levels.findIndex((l) => l.level === levelData.level);
    let updatedLevels = [...activePolicy.levels];
    if (existingIndex >= 0) {
      updatedLevels[existingIndex] = levelData;
    } else {
      updatedLevels.push(levelData);
    }
    updatedLevels.sort((a, b) => a.level - b.level);

    updatePolicy.mutate({
      id: activePolicy.id,
      dto: { levels: updatedLevels },
    });
    setIsLevelModalOpen(false);
  };

  const handleDeleteLevel = (levelNumber: number) => {
    if (!activePolicy) return;
    if (!confirm(`Are you sure you want to remove Approval Level ${levelNumber}?`)) return;

    const updatedLevels = activePolicy.levels.filter((l) => l.level !== levelNumber);
    updatePolicy.mutate({
      id: activePolicy.id,
      dto: { levels: updatedLevels },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-5 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Approval Authority Matrix Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure hierarchical delegated sanction limits, risk grade boundaries, and Segregation of Duties (SoD) rules
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            title="Refresh policies"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              const code = prompt('Enter new Authority Matrix Code (e.g. AUTH_MATRIX_SECURED_MSME):');
              if (code) {
                createPolicy.mutate({
                  code: code.toUpperCase().trim(),
                  name: `${code.replace(/_/g, ' ')}`,
                  description: 'Configurable institutional approval authority matrix',
                  levels: [
                    {
                      level: 1,
                      code: 'LEVEL_1_BRANCH_MANAGER',
                      name: 'Branch Manager Authority',
                      description: 'Delegated sanction limit up to ₹5,00,000 for prime borrowers.',
                      roles: ['BRANCH_MANAGER'],
                      minAmount: 0,
                      maxAmount: 500000,
                      allowedRiskGrades: ['A', 'B'],
                      allowedDecisions: ['APPROVE', 'APPROVE_WITH_CONDITIONS'],
                      scope: 'BRANCH',
                      branchRestricted: true,
                      slaHours: 8,
                      requiresSequentialPreviousApproval: false,
                      canSendBack: true,
                    },
                    {
                      level: 2,
                      code: 'LEVEL_2_UNDERWRITER',
                      name: 'Senior Underwriter Authority',
                      description: 'Universal sanction limit up to ₹25,00,000 across all risk grades.',
                      roles: ['UNDERWRITER', 'ADMIN'],
                      minAmount: 500000.01,
                      maxAmount: 2500000,
                      allowedRiskGrades: ['A', 'B', 'C', 'D'],
                      allowedDecisions: ['APPROVE', 'APPROVE_WITH_CONDITIONS', 'REFER'],
                      scope: 'TENANT',
                      branchRestricted: false,
                      slaHours: 12,
                      requiresSequentialPreviousApproval: true,
                      canSendBack: true,
                      canOverrideBreRejection: true,
                    },
                  ],
                });
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New Authority Matrix
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Matrix Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search authority policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

            {/* List of Authority Matrices */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {filteredPolicies.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No matching authority matrices found.
                </div>
              ) : (
                filteredPolicies.map((pol) => {
                  const isSelected = activePolicy?.id === pol.id;
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

                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span className="text-indigo-300/80">{pol.code}</span>
                        <span>{pol.levels?.length || 0} Approval Levels</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Active Policy & Approval Hierarchy (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activePolicy ? (
            <div className="space-y-4">
              {/* Policy Header Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
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
                      title="Clone as new version"
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

                {/* Governance & SoD strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Multi-Level Mode</span>
                    <span className="font-semibold text-emerald-400">
                      {activePolicy.multiLevelApprovalEnabled ? 'Sequential Stage-Gated' : 'Single-Tier Direct'}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Max Delegation</span>
                    <span className="font-semibold text-indigo-300">{activePolicy.maxDelegationDays} Days Limit</span>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Applicant SoD</span>
                    <span className="font-semibold text-white">Self-Approval Blocked</span>
                  </div>

                  <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Four-Eyes Check</span>
                    <span className="font-semibold text-purple-300">Enforced on High Risk</span>
                  </div>
                </div>
              </div>

              {/* Hierarchy Levels Card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Approval Hierarchy Levels ({activePolicy.levels?.length || 0})
                  </h3>

                  <button
                    onClick={() => {
                      const nextLvlNum = (activePolicy.levels?.length || 0) + 1;
                      setEditingLevel({
                        level: nextLvlNum,
                        code: `LEVEL_${nextLvlNum}_AUTHORITY`,
                        name: `Level ${nextLvlNum} Sanction Authority`,
                        description: 'Configurable approval level tier',
                        roles: ['UNDERWRITER'],
                        minAmount: 0,
                        maxAmount: 1000000,
                        allowedRiskGrades: ['A', 'B', 'C'],
                        allowedDecisions: ['APPROVE', 'APPROVE_WITH_CONDITIONS'],
                        scope: 'TENANT',
                        branchRestricted: false,
                        slaHours: 12,
                        requiresSequentialPreviousApproval: nextLvlNum > 1,
                        canSendBack: true,
                        canOverrideBreRejection: false,
                      });
                      setIsLevelModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Hierarchy Level
                  </button>
                </div>

                {/* Level Cards */}
                <div className="space-y-3">
                  {activePolicy.levels?.map((lvl) => (
                    <div
                      key={lvl.level}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-xs font-black text-indigo-300">
                            L{lvl.level}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">{lvl.name}</h4>
                              <span className="font-mono text-[11px] text-slate-400">({lvl.code})</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">{lvl.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingLevel(lvl);
                              setIsLevelModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                            title="Edit level"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLevel(lvl.level)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                            title="Delete level"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Level Attributes Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-xs">
                        <div className="p-2 bg-slate-900/60 rounded-lg">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Amount Band:</span>
                          <span className="font-mono text-emerald-300 font-semibold">
                            {formatMoney(lvl.minAmount)} – {formatMoney(lvl.maxAmount)}
                          </span>
                        </div>

                        <div className="p-2 bg-slate-900/60 rounded-lg">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Authorized Roles:</span>
                          <span className="font-mono text-indigo-300 font-semibold truncate block">
                            {lvl.roles.join(', ')}
                          </span>
                        </div>

                        <div className="p-2 bg-slate-900/60 rounded-lg">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Permitted Risk:</span>
                          <span className="text-amber-300 font-semibold">
                            Grades {lvl.allowedRiskGrades.join(', ')}
                          </span>
                        </div>

                        <div className="p-2 bg-slate-900/60 rounded-lg">
                          <span className="text-[10px] text-slate-400 block mb-0.5">SLA Turnaround:</span>
                          <span className="text-slate-200 font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {lvl.slaHours} Hours
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
              Select or create an Approval Authority Policy to view configuration.
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Level Modal */}
      {isLevelModalOpen && editingLevel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Configure Approval Level {editingLevel.level}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Level Name</label>
                <input
                  type="text"
                  value={editingLevel.name}
                  onChange={(e) => setEditingLevel({ ...editingLevel, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Min Amount (₹)</label>
                  <input
                    type="number"
                    value={editingLevel.minAmount}
                    onChange={(e) => setEditingLevel({ ...editingLevel, minAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Max Amount (₹)</label>
                  <input
                    type="number"
                    value={editingLevel.maxAmount}
                    onChange={(e) => setEditingLevel({ ...editingLevel, maxAmount: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Authorized Roles (comma separated)</label>
                <input
                  type="text"
                  value={editingLevel.roles.join(', ')}
                  onChange={(e) =>
                    setEditingLevel({
                      ...editingLevel,
                      roles: e.target.value.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  placeholder="BRANCH_MANAGER, UNDERWRITER"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">SLA Turnaround (Hours)</label>
                  <input
                    type="number"
                    value={editingLevel.slaHours}
                    onChange={(e) => setEditingLevel({ ...editingLevel, slaHours: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Scope Jurisdiction</label>
                  <select
                    value={editingLevel.scope}
                    onChange={(e) => setEditingLevel({ ...editingLevel, scope: e.target.value as AuthorityScope })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="BRANCH">BRANCH (Local)</option>
                    <option value="TENANT">TENANT (Global)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingLevel.branchRestricted}
                    onChange={(e) => setEditingLevel({ ...editingLevel, branchRestricted: e.target.checked })}
                    className="rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                  <span>Branch Restricted (Actor branch must match application branch)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingLevel.canOverrideBreRejection}
                    onChange={(e) => setEditingLevel({ ...editingLevel, canOverrideBreRejection: e.target.checked })}
                    className="rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                  <span>Permitted to Override BRE Knockout Decisions</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsLevelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveLevel(editingLevel)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Save Level
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
