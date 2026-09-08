'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { TableSkeleton } from '@/components/LoadingSkeletons';

interface ChecklistTask {
  code: string;
  name: string;
  category: string;
  description: string;
  isMandatory: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
  blockerReason?: string;
}

interface OnboardingDossier {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  tier: string;
  stage: string;
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  organizationDetails?: {
    cinNumber?: string;
    rbiRegistrationNo?: string;
    domain?: string;
  };
  completionPercentage: number;
  assignedOwnerEmail: string;
  checklist: ChecklistTask[];
  retentionYears: number;
}

export default function ClientOnboardingPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'CHECKLIST' | 'VALIDATION'>('CHECKLIST');
  const [selectedDossierId, setSelectedDossierId] = useState<string | null>(null);

  // Fetch real onboarding dossiers from backend API
  const { data: dossiers = [], isLoading, refetch } = useQuery<OnboardingDossier[]>({
    queryKey: ['client-onboardings'],
    queryFn: async () => {
      const res = await api.get('/client-onboarding');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as OnboardingDossier[];
    },
  });

  const activeDossier =
    dossiers.find((d) => d.id === selectedDossierId) ||
    dossiers[0] ||
    null;

  // Mutation to toggle task status
  const updateTaskMutation = useMutation({
    mutationFn: async ({ dossierId, code, nextStatus }: { dossierId: string; code: string; nextStatus: string }) => {
      return api.put(`/client-onboarding/${dossierId}/checklist`, {
        itemCode: code,
        status: nextStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-onboardings'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Checklist Update Failed' });
    },
  });

  const stages = [
    'PROSPECT',
    'ONBOARDING',
    'CONFIGURATION',
    'VALIDATION',
    'APPROVAL',
    'PROVISIONING',
    'ACTIVE',
  ];

  const toggleTask = (code: string) => {
    if (!activeDossier) return;
    const task = activeDossier.checklist?.find((t) => t.code === code);
    if (!task) return;
    const nextStatus = task.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
    updateTaskMutation.mutate({
      dossierId: activeDossier.id,
      code,
      nextStatus,
    });
  };

  if (isLoading) {
    return <TableSkeleton rows={5} cols={4} />;
  }

  if (!activeDossier) {
    return (
      <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-500 opacity-50" />
        <h3 className="text-lg font-bold text-white mb-1">No Onboarding Dossiers Found</h3>
        <p className="text-sm">No commercial clients are currently undergoing onboarding.</p>
      </div>
    );
  }

  const filteredTasks =
    selectedCategory === 'ALL'
      ? activeDossier.checklist || []
      : (activeDossier.checklist || []).filter((t) => t.category === selectedCategory);

  const pendingMandatory = (activeDossier.checklist || []).filter((t) => t.isMandatory && t.status !== 'COMPLETED');
  const completedCount = (activeDossier.checklist || []).filter((t) => t.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Commercial Client Onboarding</h1>
              <p className="text-sm text-slate-400">Institutional Onboarding, 16-Point Checklist, Dynamic Provisioning & Statutory Retention</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {dossiers.length > 1 && (
            <select
              value={activeDossier.id}
              onChange={(e) => setSelectedDossierId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
            >
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-xl"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-xs font-semibold text-emerald-400">Statutory 8-Year RBI Retention Lock Active</span>
          </div>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Current Client:</span>
            <span className="text-sm font-bold text-white">{activeDossier.name}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeDossier.tier}
            </span>
          </div>
          <span className="text-sm font-bold text-indigo-400">{activeDossier.completionPercentage || 0}% Onboarding Complete</span>
        </div>

        {/* 10-Stage Lifecycle Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {stages.map((st, idx) => {
            const currentIdx = stages.indexOf(activeDossier.stage);
            const isCompleted = idx < currentIdx || activeDossier.stage === 'ACTIVE';
            const isCurrent = st === activeDossier.stage;

            return (
              <div
                key={st}
                className={`p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold shadow-lg shadow-indigo-500/10'
                    : isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-xs">
                  {isCompleted && !isCurrent ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : null}
                  {isCurrent ? <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> : null}
                  <span>{st}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('CHECKLIST')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'CHECKLIST' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          16-Point Institutional Checklist ({completedCount}/16)
        </button>
        <button
          onClick={() => setActiveTab('VALIDATION')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'VALIDATION' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Go-Live Validation & Readiness ({pendingMandatory.length === 0 ? 'Ready' : `${pendingMandatory.length} Pending`})
        </button>
      </div>

      {activeTab === 'CHECKLIST' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'ORGANIZATION', 'SECURITY_RBAC', 'PRODUCT_WORKFLOW', 'COMPLIANCE_PRIVACY', 'INTEGRATIONS', 'GO_LIVE_APPROVAL'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Checklist Task Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
              <div
                key={task.code}
                onClick={() => toggleTask(task.code)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                  task.status === 'COMPLETED'
                    ? 'bg-emerald-950/10 border-emerald-500/30 hover:border-emerald-500/50'
                    : task.status === 'BLOCKED'
                    ? 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {task.status === 'COMPLETED' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : task.status === 'BLOCKED' ? (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{task.name}</span>
                        {task.isMandatory && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                            MANDATORY
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{task.description}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : task.status === 'BLOCKED'
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'VALIDATION' && (
        <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Go-Live Readiness Audit</h3>
              <p className="text-xs text-slate-400">Automated pre-activation clearance check across security, product, and statutory compliance.</p>
            </div>
            <div
              className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                pendingMandatory.length === 0
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}
            >
              {pendingMandatory.length === 0 ? 'READY FOR GO-LIVE' : `${pendingMandatory.length} BLOCKERS PENDING`}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Total Checklist Tasks</span>
              <p className="text-2xl font-bold text-white mt-1">16</p>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-xs text-emerald-400 font-medium">Completed Tasks</span>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{completedCount}</p>
            </div>
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="text-xs text-amber-400 font-medium">Pending Mandatory</span>
              <p className="text-2xl font-bold text-amber-400 mt-1">{pendingMandatory.length}</p>
            </div>
          </div>

          {pendingMandatory.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pending Action Items Before Go-Live:</span>
              <div className="space-y-2">
                {pendingMandatory.map((item) => (
                  <div key={item.code} className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-200">
                      [{item.category}] {item.name}
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold uppercase">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
