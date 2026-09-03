'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sliders,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  FileCheck,
  Percent,
  TrendingDown,
  Scale,
  Users,
  Building2,
  ArrowRight,
  Layers,
  Save,
  Sparkles,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, Button, Input, Spinner } from '@/components/ui';
import { formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

type ConfigArea =
  | 'FOIR_DTI'
  | 'ELIGIBILITY'
  | 'RISK'
  | 'UNDERWRITING'
  | 'DOCUMENTS'
  | 'COLLECTIONS';

interface AreaConfig {
  key: ConfigArea;
  label: string;
  description: string;
}

const AREAS: AreaConfig[] = [
  { key: 'FOIR_DTI', label: 'FOIR & DTI Policy', description: 'Debt-to-income caps and repayment capacity limits' },
  { key: 'ELIGIBILITY', label: 'Eligibility Rules', description: 'Borrower age, minimum income, and employment criteria' },
  { key: 'RISK', label: 'Risk & Bureau Scoring', description: 'Credit score cutoffs and automated field verification triggers' },
  { key: 'UNDERWRITING', label: 'Underwriting Hierarchy', description: 'Single-officer sign-off limits and committee thresholds' },
  { key: 'DOCUMENTS', label: 'Document Checklists', description: 'Mandatory KYC, income, and bank statement duration' },
  { key: 'COLLECTIONS', label: 'Collections & Delinquency', description: 'Grace period, soft collection cutoffs, and legal escalations' },
];

export default function ConfigurationPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedArea, setSelectedArea] = useState<ConfigArea>('FOIR_DTI');
  const [changelog, setChangelog] = useState('');
  const [paramsForm, setParamsForm] = useState<Record<string, any>>({});
  const [rollbackModalTarget, setRollbackModalTarget] = useState<any | null>(null);
  const [rollbackReason, setRollbackReason] = useState('');

  // 1. Fetch Active Tenant Context
  const { data: currentTenant } = useQuery({
    queryKey: ['tenant-current'],
    queryFn: async () => (await api.get('/tenants/current')).data.data,
  });

  // 2. Fetch Active Policy for Selected Area
  const { data: activeConfigData, isLoading: configLoading } = useQuery({
    queryKey: ['configuration-active', selectedArea, currentTenant?.id],
    queryFn: async () => (await api.get(`/configuration/active?area=${selectedArea}`)).data.data,
    enabled: Boolean(selectedArea),
  });

  // 3. Fetch Version History for Selected Area
  const { data: versions = [], isLoading: versionsLoading } = useQuery({
    queryKey: ['configuration-versions', selectedArea, currentTenant?.id],
    queryFn: async () => (await api.get(`/configuration/versions?area=${selectedArea}`)).data.data,
    enabled: Boolean(selectedArea),
  });

  // Keep form in sync when active configuration loads or area changes
  useEffect(() => {
    if (activeConfigData?.parameters) {
      setParamsForm({ ...activeConfigData.parameters });
    }
  }, [activeConfigData, selectedArea]);

  // Draft Save Mutation
  const draftMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/configuration/draft', {
        area: selectedArea,
        parameters: paramsForm,
        changelog: changelog || `Draft updates for ${selectedArea}`,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['configuration-versions', selectedArea] });
      alert(`Draft configuration Version ${data.version} saved. You can now review and publish.`);
    },
    onError: (err: any) => {
      alert(`Save draft failed: ${apiErrorMessage(err)}`);
    },
  });

  // Publish Mutation
  const publishMutation = useMutation({
    mutationFn: async (configId: string) => {
      const res = await api.post('/configuration/publish', { configId });
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['configuration-active', selectedArea] });
      queryClient.invalidateQueries({ queryKey: ['configuration-versions', selectedArea] });
      alert(`Configuration Version ${data.version} is now active and enforced in core lending engines.`);
    },
    onError: (err: any) => {
      alert(`Publish failed: ${apiErrorMessage(err)}`);
    },
  });

  // Rollback Mutation
  const rollbackMutation = useMutation({
    mutationFn: async () => {
      if (!rollbackModalTarget) return;
      const res = await api.post('/configuration/rollback', {
        area: selectedArea,
        targetVersion: rollbackModalTarget.version,
        reason: rollbackReason || 'Administrative rollback to approved version',
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setRollbackModalTarget(null);
      setRollbackReason('');
      queryClient.invalidateQueries({ queryKey: ['configuration-active', selectedArea] });
      queryClient.invalidateQueries({ queryKey: ['configuration-versions', selectedArea] });
      alert(`Policy rolled back to Version ${data.version}. Active policy parameters updated.`);
    },
    onError: (err: any) => {
      alert(`Rollback failed: ${apiErrorMessage(err)}`);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Administration / Policy Engine"
        title="Lender Policy Configuration"
        subtitle="Configure institution-specific credit policies, FOIR limits, and approval hierarchies with complete version auditability"
      />

      {/* Tenant Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-200 dark:border-[#1E2445]">
        <div className="flex items-center gap-2.5">
          <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              Active Institutional Scope: <span>{currentTenant?.name || 'Adyapan Prime Lending'}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Tenant ID: {currentTenant?.id || currentTenant?.tenantId || 'tenant-adyapan-default'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            PRECEDENCE: TENANT OVERRIDE
          </span>
          <span className="text-[10px] text-slate-400">Deterministic Financial Rule Enforcement</span>
        </div>
      </div>

      {/* Area Selector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {AREAS.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => setSelectedArea(a.key)}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border',
              selectedArea === a.key
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white dark:bg-[#0E1528] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Parameter Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4 border">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-600" />
                  {AREAS.find((a) => a.key === selectedArea)?.label} Settings
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {AREAS.find((a) => a.key === selectedArea)?.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  Version {activeConfigData?.version || 1} (Active)
                </span>
              </div>
            </div>

            {configLoading ? (
              <div className="p-8 text-center space-y-2">
                <Spinner />
                <p className="text-xs text-slate-400">Loading policy parameters...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Specific Parameter Fields per Area */}
                {selectedArea === 'FOIR_DTI' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Maximum Allowable DTI / FOIR Ratio
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="1.0"
                        value={paramsForm.maxDtiRatio ?? 0.55}
                        onChange={(e) =>
                          setParamsForm({ ...paramsForm, maxDtiRatio: parseFloat(e.target.value) })
                        }
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Current: {(Number(paramsForm.maxDtiRatio || 0.55) * 100).toFixed(0)}% ceiling limit
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Warning DTI Ratio (Policy Caution)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.1"
                        max="1.0"
                        value={paramsForm.warningDtiRatio ?? 0.45}
                        onChange={(e) =>
                          setParamsForm({ ...paramsForm, warningDtiRatio: parseFloat(e.target.value) })
                        }
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Current: {(Number(paramsForm.warningDtiRatio || 0.45) * 100).toFixed(0)}% warning cutoff
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Rental Income Haircut (%)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.rentalIncomeHaircutPct ?? 20}
                        onChange={(e) =>
                          setParamsForm({
                            ...paramsForm,
                            rentalIncomeHaircutPct: parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {selectedArea === 'ELIGIBILITY' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Minimum Age (Years)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.minAge ?? 21}
                        onChange={(e) =>
                          setParamsForm({ ...paramsForm, minAge: parseInt(e.target.value, 10) })
                        }
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Maximum Age (Years)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.maxAge ?? 60}
                        onChange={(e) =>
                          setParamsForm({ ...paramsForm, maxAge: parseInt(e.target.value, 10) })
                        }
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Minimum Salaried Income (₹ / Month)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.minSalariedIncome ?? 25000}
                        onChange={(e) =>
                          setParamsForm({
                            ...paramsForm,
                            minSalariedIncome: parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Minimum Business Income (₹ / Month)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.minBusinessIncome ?? 50000}
                        onChange={(e) =>
                          setParamsForm({
                            ...paramsForm,
                            minBusinessIncome: parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {selectedArea === 'UNDERWRITING' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Single Officer Sign-Off Ceiling (₹)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.singleSignoffLimit ?? 50000}
                        onChange={(e) =>
                          setParamsForm({
                            ...paramsForm,
                            singleSignoffLimit: parseInt(e.target.value, 10),
                          })
                        }
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Amounts above this limit require multi-officer committee escalation
                      </span>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Committee Sign-Off Ceiling (₹)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.committeeSignoffLimit ?? 500000}
                        onChange={(e) =>
                          setParamsForm({
                            ...paramsForm,
                            committeeSignoffLimit: parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Max Decision Turnaround SLA (Hours)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.maxTurnaroundHours ?? 24}
                        onChange={(e) =>
                          setParamsForm({
                            ...paramsForm,
                            maxTurnaroundHours: parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {selectedArea === 'COLLECTIONS' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Repayment Grace Period (Days)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.gracePeriodDays ?? 3}
                        onChange={(e) =>
                          setParamsForm({
                            ...paramsForm,
                            gracePeriodDays: parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Soft Collection Cutoff (DPD)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.softCollectionDpdCutoff ?? 30}
                        onChange={(e) =>
                          setParamsForm({
                            ...paramsForm,
                            softCollectionDpdCutoff: parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Hard Collection Cutoff (DPD)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.hardCollectionDpdCutoff ?? 60}
                        onChange={(e) =>
                          setParamsForm({
                            ...paramsForm,
                            hardCollectionDpdCutoff: parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Legal Escalation Threshold (DPD)
                      </label>
                      <Input
                        type="number"
                        value={paramsForm.legalEscalationDpd ?? 90}
                        onChange={(e) =>
                          setParamsForm({
                            ...paramsForm,
                            legalEscalationDpd: parseInt(e.target.value, 10),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {selectedArea !== 'FOIR_DTI' &&
                  selectedArea !== 'ELIGIBILITY' &&
                  selectedArea !== 'UNDERWRITING' &&
                  selectedArea !== 'COLLECTIONS' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        JSON Parameter Configuration
                      </label>
                      <textarea
                        rows={6}
                        value={JSON.stringify(paramsForm, null, 2)}
                        onChange={(e) => {
                          try {
                            setParamsForm(JSON.parse(e.target.value));
                          } catch {}
                        }}
                        className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent"
                      />
                    </div>
                  )}

                {/* Changelog Rationale Input */}
                <div className="pt-2 border-t border-slate-100 dark:border-[#1E2445]">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mandatory Governance Changelog Rationale *
                  </label>
                  <Input
                    placeholder="e.g. 'Credit committee approved 5% tighter FOIR tolerance for Q3'"
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={draftMutation.isPending}
                    onClick={() => draftMutation.mutate()}
                    className="text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {draftMutation.isPending ? 'Saving...' : 'Save as Draft'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Version History & Rollback Timeline */}
        <div className="space-y-4">
          <Card className="p-4 space-y-3 border">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-100 dark:border-[#1E2445]">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <History className="h-4 w-4 text-purple-600" />
                Version Audit History
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">
                {versions.length} records
              </span>
            </div>

            {versionsLoading ? (
              <div className="p-4 text-center">
                <Spinner />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No versions recorded.</p>
            ) : (
              <div className="space-y-2.5">
                {versions.map((v: any) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        v{v.version}
                        <span
                          className={cn(
                            'text-[9px] font-bold px-1.5 py-0.2 rounded',
                            v.state === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : v.state === 'DRAFT'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          )}
                        >
                          {v.state}
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDateTime(v.updatedAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      &ldquo;{v.changelog}&rdquo;
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px]">
                      <span className="text-slate-400">By: {v.createdBy}</span>
                      <div className="flex items-center gap-1.5">
                        {v.state === 'DRAFT' && (
                          <button
                            type="button"
                            onClick={() => publishMutation.mutate(v.id)}
                            className="font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            Publish
                          </button>
                        )}
                        {v.state === 'ARCHIVED' && (
                          <button
                            type="button"
                            onClick={() => setRollbackModalTarget(v)}
                            className="font-bold text-purple-600 hover:text-purple-700 cursor-pointer flex items-center gap-0.5"
                          >
                            <RotateCcw className="h-3 w-3" /> Rollback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ROLLBACK CONFIRMATION MODAL */}
      {rollbackModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-purple-600" />
                Rollback Policy to Version {rollbackModalTarget.version}
              </h3>
              <button
                type="button"
                onClick={() => setRollbackModalTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                This operation will restore the parameters of{' '}
                <strong>Version {rollbackModalTarget.version}</strong> as the new active policy for{' '}
                <strong>{selectedArea}</strong>.
              </p>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Audit Rollback Justification *
                </label>
                <textarea
                  rows={3}
                  value={rollbackReason}
                  onChange={(e) => setRollbackReason(e.target.value)}
                  placeholder="State reason for policy rollback for immutable compliance logging..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-xs focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setRollbackModalTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!rollbackReason.trim() || rollbackMutation.isPending}
                onClick={() => rollbackMutation.mutate()}
                className="text-xs cursor-pointer"
              >
                {rollbackMutation.isPending ? 'Rolling back...' : 'Confirm Rollback'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
