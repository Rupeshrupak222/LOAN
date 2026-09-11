'use client';

import React, { useState } from 'react';
import {
  Cpu,
  FileCode2,
  PlayCircle,
  Search,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  GitBranch,
  RefreshCw,
  Sliders,
  History,
  Info,
  Scale,
  Lock,
} from 'lucide-react';
import {
  PolicyManagement,
  DecisionSimulator,
  DecisionDetailView,
  useEvaluateApplication,
} from '@/features/decision-engine';
import { useAuth } from '@/lib/auth';

export default function BreStudioPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'POLICIES' | 'SIMULATOR' | 'INSPECTOR' | 'GOVERNANCE'>('POLICIES');

  // Live Inspector Search & Evaluation State
  const [inspectAppId, setInspectAppId] = useState<string>('app_demo_01');
  const [selectedAppIdForView, setSelectedAppIdForView] = useState<string>('app_demo_01');
  const evaluateMutation = useEvaluateApplication();

  const handleEvaluateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectAppId.trim()) return;

    evaluateMutation.mutate(inspectAppId.trim(), {
      onSuccess: () => {
        setSelectedAppIdForView(inspectAppId.trim());
      },
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-400 shadow-inner">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-white tracking-tight">
                BRE & Decision Engine Studio
              </h1>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Phase 2 Production
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Deterministic, explainable credit decisioning engine with decimal-safe calculations,
              multi-dimensional underwriting rules, policy versioning, and immutable audit snapshots.
            </p>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/90 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('POLICIES')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'POLICIES'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            Policies & Rules
          </button>

          <button
            onClick={() => setActiveTab('SIMULATOR')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'SIMULATOR'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            Sandbox Simulator
          </button>

          <button
            onClick={() => setActiveTab('INSPECTOR')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'INSPECTOR'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            Live Evaluation
          </button>

          <button
            onClick={() => setActiveTab('GOVERNANCE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'GOVERNANCE'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Architecture & SoD
          </button>
        </div>
      </div>

      {/* Tab 1: Policies & Rules */}
      {activeTab === 'POLICIES' && <PolicyManagement />}

      {/* Tab 2: Sandbox Simulator */}
      {activeTab === 'SIMULATOR' && <DecisionSimulator />}

      {/* Tab 3: Live Application Evaluation Inspector */}
      {activeTab === 'INSPECTOR' && (
        <div className="space-y-6">
          {/* Application Search & Evaluate Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <form onSubmit={handleEvaluateApp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Application Identifier / ID
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={inspectAppId}
                    onChange={(e) => setInspectAppId(e.target.value)}
                    placeholder="Enter Application ID e.g. app_demo_01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setSelectedAppIdForView(inspectAppId)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  Load History
                </button>

                <button
                  type="submit"
                  disabled={evaluateMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${evaluateMutation.isPending ? 'animate-spin' : ''}`} />
                  {evaluateMutation.isPending ? 'Evaluating BRE...' : 'Evaluate Live'}
                </button>
              </div>
            </form>
          </div>

          {/* Decision Detail View with Version History & Manual Override */}
          <DecisionDetailView
            applicationId={selectedAppIdForView}
            onReevaluateComplete={() => setSelectedAppIdForView(selectedAppIdForView)}
          />
        </div>
      )}

      {/* Tab 4: BRE Architecture & Governance */}
      {activeTab === 'GOVERNANCE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Pipeline Flow */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-400">
                <GitBranch className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Decision Pipeline Architecture
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deterministic flow ensuring that no credit rule is hardcoded inside controllers.
              </p>
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-[11px] font-mono text-slate-300 space-y-1.5">
                <div className="text-emerald-400 font-bold">Tenant</div>
                <div className="pl-2">↓ Loan Product</div>
                <div className="pl-4">↓ Product Version</div>
                <div className="pl-6">↓ Decision Policy (v1..vN)</div>
                <div className="pl-8">↓ Context Normalization</div>
                <div className="pl-10">↓ Rule Group Evaluator</div>
                <div className="pl-12">↓ Decision Aggregator</div>
                <div className="pl-14 text-indigo-300 font-bold">→ Decision Result + Snapshot</div>
                <div className="pl-16 text-cyan-300 font-bold">→ Workflow Engine Transition</div>
              </div>
            </div>

            {/* Card 2: Precision & Calculations */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Scale className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Financial Precision & Logic
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                All financial calculations leverage <strong className="text-slate-200">Decimal.js</strong> to prevent floating-point rounding errors.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-slate-300 block mb-0.5">FOIR Formula</span>
                  <code className="text-indigo-300 text-[11px] font-mono">
                    (Existing EMI + Proposed EMI) / Income * 100
                  </code>
                </div>
                <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-slate-300 block mb-0.5">Reducing Balance EMI</span>
                  <code className="text-indigo-300 text-[11px] font-mono">
                    P * r * (1+r)^n / ((1+r)^n - 1)
                  </code>
                </div>
                <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="font-bold text-slate-300 block mb-0.5">Multi-Cap Eligibility</span>
                  <code className="text-indigo-300 text-[11px] font-mono">
                    MIN(ProductMax, IncomeMax, RiskMax)
                  </code>
                </div>
              </div>
            </div>

            {/* Card 3: Governance, SoD & Isolation */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Governance & Audit Controls
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strict multi-tenant boundary checks and immutable snapshot evidence.
              </p>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Tenant Isolation:</strong> Anti-spoofing header and JWT scope validation prevents cross-tenant access.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Immutable Snapshots:</strong> Historical decisions store full input contexts and rule versions.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Audit Trail:</strong> Manual overrides record reason, comments, user ID, role, and before/after verdict.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
