'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  UserCheck,
  RotateCcw,
  Percent,
  Calculator,
  Sliders,
  Sparkles,
  FileCheck,
  Layers,
  ChevronRight,
  Receipt,
  Info,
} from 'lucide-react';
import { DecisionSnapshotRecord, DecisionOutcome, RiskGrade, RuleEvaluationItem } from '../types';
import { useOverrideDecision, useEvaluateApplication, useApplicationDecisions } from '../hooks/useDecisionEngine';
import { usePermission } from '@/lib/permissions';
import { Card, Button, Badge, Spinner } from '@/components/ui';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';

interface Props {
  decisions?: DecisionSnapshotRecord[];
  applicationId: string;
  onRefresh?: () => void;
  onReevaluateComplete?: () => void;
}

export function DecisionDetailView({ decisions, applicationId, onRefresh, onReevaluateComplete }: Props) {
  const { data: fetchedDecisions = [], isLoading: isFetching, refetch } = useApplicationDecisions(applicationId);
  const allDecisions = decisions && decisions.length > 0 ? decisions : fetchedDecisions;

  const [selectedVersionIndex, setSelectedVersionIndex] = useState<number>(0);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideDecision, setOverrideDecision] = useState<DecisionOutcome>('APPROVE');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideComments, setOverrideComments] = useState('');

  const canOverride = usePermission('decision.override');
  const canEvaluate = usePermission('decision.evaluate');

  const overrideMutation = useOverrideDecision();
  const evaluateMutation = useEvaluateApplication();

  if (isFetching && (!allDecisions || allDecisions.length === 0)) {
    return (
      <Card className="p-12 text-center bg-slate-900/40 border-slate-800 flex flex-col items-center justify-center">
        <Spinner size="lg" />
        <p className="text-xs text-slate-400 mt-3">Loading BRE evaluation history...</p>
      </Card>
    );
  }

  if (!allDecisions || allDecisions.length === 0) {
    return (
      <Card className="p-12 text-center bg-slate-900/40 border-slate-800">
        <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-slate-300">No BRE Decision Generated Yet</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          This application has not been evaluated against the active loan product policy. Run automated evaluation to generate an explainable credit decision.
        </p>
        {canEvaluate && (
          <Button
            onClick={() =>
              evaluateMutation.mutate(applicationId, {
                onSuccess: () => {
                  refetch();
                  onRefresh?.();
                  onReevaluateComplete?.();
                },
              })
            }
            disabled={evaluateMutation.isPending}
            className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            {evaluateMutation.isPending ? 'Evaluating...' : 'Run BRE Decision Engine'}
          </Button>
        )}
      </Card>
    );
  }

  const currentSnapshot = allDecisions[selectedVersionIndex] || allDecisions[0];
  const res = currentSnapshot.decisionResult;
  const isOverridden = !!currentSnapshot.override;

  const getDecisionBadge = (decision: DecisionOutcome) => {
    switch (decision) {
      case 'APPROVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-4 h-4" />
            APPROVE
          </span>
        );
      case 'APPROVE_WITH_CONDITIONS':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
            APPROVE WITH CONDITIONS
          </span>
        );
      case 'REFER':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-4 h-4" />
            REFER (MANUAL REVIEW)
          </span>
        );
      case 'REJECT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-4 h-4" />
            REJECT
          </span>
        );
    }
  };

  const getGradeBadge = (grade: RiskGrade) => {
    const map: Record<RiskGrade, { color: string; label: string }> = {
      A: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: 'Tier A • Super Prime' },
      B: { color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', label: 'Tier B • Prime' },
      C: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', label: 'Tier C • Near Prime' },
      D: { color: 'bg-orange-500/20 text-orange-300 border-orange-500/40', label: 'Tier D • Subprime' },
      E: { color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', label: 'Tier E • High Risk' },
    };
    const t = map[grade] || { color: 'bg-slate-700 text-slate-300', label: grade };
    return (
      <span className={cn('px-2.5 py-1 rounded-lg text-xs font-bold border', t.color)}>
        Grade {grade} ({t.label})
      </span>
    );
  };

  const handleOverrideSubmit = () => {
    overrideMutation.mutate(
      {
        decisionId: currentSnapshot.id,
        payload: {
          newDecision: overrideDecision,
          reason: overrideReason,
          comments: overrideComments,
        },
      },
      {
        onSuccess: () => {
          setIsOverrideModalOpen(false);
          if (onRefresh) onRefresh();
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Decision Outcome & Versions */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Authoritative BRE Decision:
              </span>
              {getDecisionBadge(currentSnapshot.finalDecision)}
              {isOverridden && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  OVERRIDDEN BY {currentSnapshot.override?.overrideRole}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 font-medium">{res.status}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>Policy: <strong className="text-white">{res.policyCode} (v{res.policyVersion})</strong></span>
              <span>Product: <strong className="text-white">{res.productId} (v{res.productVersion})</strong></span>
              <span>Evaluated: <strong className="text-slate-300">{formatDateTime(res.evaluatedAt)}</strong></span>
            </div>
          </div>

          {/* Action Buttons & Version Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {allDecisions.length > 1 && (
              <select
                value={selectedVersionIndex}
                onChange={(e) => setSelectedVersionIndex(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
              >
                {allDecisions.map((d, i) => (
                  <option key={d.id} value={i}>
                    Decision v{d.decisionVersion} ({d.finalDecision}) - {new Date(d.createdAt).toLocaleTimeString()}
                  </option>
                ))}
              </select>
            )}

            {canEvaluate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  evaluateMutation.mutate(applicationId, {
                    onSuccess: () => {
                      refetch();
                      onRefresh?.();
                      onReevaluateComplete?.();
                    },
                  })
                }
                disabled={evaluateMutation.isPending}
                className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5"
              >
                <RotateCcw className={cn('w-3.5 h-3.5', evaluateMutation.isPending && 'animate-spin')} />
                Re-Evaluate (v{allDecisions.length + 1})
              </Button>
            )}

            {canOverride && (
              <Button
                size="sm"
                onClick={() => setIsOverrideModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Manual Override
              </Button>
            )}
          </div>
        </div>

        {/* Override banner if present */}
        {isOverridden && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p>
                <strong>System Decision:</strong> {currentSnapshot.systemDecision} →{' '}
                <strong>Overridden to:</strong> {currentSnapshot.finalDecision} by{' '}
                <strong>{currentSnapshot.override?.overriddenBy}</strong> ({formatDateTime(currentSnapshot.override?.timestamp || '')})
              </p>
              <p className="mt-0.5 text-amber-300">
                <strong>Justification Reason:</strong> {currentSnapshot.override?.reason}
                {currentSnapshot.override?.comments ? ` — "${currentSnapshot.override?.comments}"` : ''}
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Metrics Row: Risk Grade, Eligible Amount & FOIR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <p className="text-xs uppercase font-semibold text-slate-400">Risk Assessment</p>
          <div className="mt-2 flex items-center justify-between">
            {getGradeBadge(res.riskGrade)}
            <span className="text-lg font-extrabold text-white font-mono">{res.riskScore}/100</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Weighted algorithmic risk score</p>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <p className="text-xs uppercase font-semibold text-slate-400">Sanction Capacity</p>
          <p className="text-lg font-bold text-white mt-1">₹{res.eligibleAmount.toLocaleString('en-IN')}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>Requested: ₹{res.requestedAmount.toLocaleString('en-IN')}</span>
            <span className="text-emerald-400 font-semibold">Recommended: ₹{res.recommendedAmount.toLocaleString('en-IN')}</span>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <p className="text-xs uppercase font-semibold text-slate-400">Debt Burden (FOIR)</p>
          <div className="mt-1 flex items-center justify-between">
            <span className={cn('text-lg font-bold font-mono', res.foirPct > 50 ? 'text-amber-400' : 'text-emerald-400')}>
              {res.foirPct}%
            </span>
            <span className="text-xs text-slate-400">Policy Cap: 55%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">DTI Ratio: {res.dtiPct}</p>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800">
          <p className="text-xs uppercase font-semibold text-slate-400">Proposed Monthly Installment</p>
          <p className="text-lg font-bold text-blue-400 mt-1">₹{res.proposedEmi.toLocaleString('en-IN')}</p>
          <p className="text-[11px] text-slate-400 mt-1">Disposable Surplus: ₹{res.disposableIncome.toLocaleString('en-IN')}</p>
        </Card>
      </div>

      {/* Knockout & Reasons Section */}
      {(res.reasons.length > 0 || res.conditions.length > 0 || res.warnings.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {res.reasons.length > 0 && (
            <Card className="p-4 bg-rose-950/20 border-rose-900/40 space-y-2">
              <h4 className="text-xs font-bold text-rose-300 uppercase flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                Knockout Breaches & Decision Reasons
              </h4>
              <ul className="text-xs text-rose-200/90 space-y-1 list-disc list-inside">
                {res.reasons.map((r, i) => (
                  <li key={i} className="leading-relaxed">{r}</li>
                ))}
              </ul>
            </Card>
          )}

          {res.conditions.length > 0 && (
            <Card className="p-4 bg-indigo-950/20 border-indigo-900/40 space-y-2">
              <h4 className="text-xs font-bold text-indigo-300 uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Pre-Disbursal Sanction Conditions
              </h4>
              <ul className="text-xs text-indigo-200/90 space-y-1 list-disc list-inside">
                {res.conditions.map((c, i) => (
                  <li key={i} className="leading-relaxed">{c}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Rule-by-Rule Evaluation Matrix */}
      <Card className="bg-slate-900/60 border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Rule-by-Rule Explainability Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated {res.rulesEvaluatedCount} rules • {res.passedCount} Passed • {res.failedCount} Failed • {res.referredCount} Referred
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="p-3">Category</th>
                <th className="p-3">Rule Definition</th>
                <th className="p-3">Actual Value</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Action</th>
                <th className="p-3">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {[...res.failedRules, ...res.referredRules, ...res.passedRules].map((rule) => {
                return (
                  <tr key={rule.ruleId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        {rule.category}
                      </span>
                    </td>
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-white">{rule.ruleName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{rule.ruleCode}</div>
                    </td>
                    <td className="p-3 font-semibold text-slate-100">
                      {String(rule.actualValue ?? 'N/A')}
                    </td>
                    <td className="p-3 text-slate-400">
                      {rule.operator} {String(rule.expectedValue)}
                    </td>
                    <td className="p-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-sans font-bold',
                          rule.severity === 'HARD_STOP' && 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
                          rule.severity === 'HIGH' && 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
                          rule.severity === 'MEDIUM' && 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                          rule.severity === 'LOW' && 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                          rule.severity === 'INFO' && 'bg-slate-800 text-slate-400'
                        )}
                      >
                        {rule.severity}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{rule.action}</td>
                    <td className="p-3">
                      {rule.passed ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Override Modal */}
      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-400" />
              Manual Credit Decision Override
            </h3>
            <p className="text-xs text-slate-400">
              As an authorized Underwriter, you can override the automated BRE decision. The original system evaluation and this justification reason will be permanently archived in the immutable audit log.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Target Decision</label>
              <select
                value={overrideDecision}
                onChange={(e) => setOverrideDecision(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
              >
                <option value="APPROVE">APPROVE (Full Sanction)</option>
                <option value="APPROVE_WITH_CONDITIONS">APPROVE WITH CONDITIONS</option>
                <option value="REFER">REFER (Committee Escalation)</option>
                <option value="REJECT">REJECT (Decline)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Primary Justification Reason *</label>
              <input
                type="text"
                placeholder="e.g. Compensating collateral / strong unlisted guarantor"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase">Underwriting Notes & Comments</label>
              <textarea
                rows={3}
                placeholder="Detailed credit committee memorandum remarks..."
                value={overrideComments}
                onChange={(e) => setOverrideComments(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-slate-400 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleOverrideSubmit}
                disabled={overrideMutation.isPending || overrideReason.trim().length < 5}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
              >
                {overrideMutation.isPending ? 'Executing Override...' : 'Confirm Override'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
