'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sliders,
  Sparkles,
  RefreshCw,
  BookmarkPlus,
  History,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Info,
  Scale,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { cn, formatMoney } from '@/lib/utils';
import { Button, Card, Badge, Spinner, Input } from './ui';

export interface DecisionSimulatorCardProps {
  applicationId: string;
  applicationNo?: string;
  applicantName?: string;
  baseAmount: number;
  baseTenure: number;
  baseRate: number;
  baseIncome?: number;
  baseObligations?: number;
  baseBureauScore?: number;
  readOnly?: boolean;
}

export function DecisionSimulatorCard({
  applicationId,
  applicationNo,
  applicantName,
  baseAmount,
  baseTenure,
  baseRate,
  baseIncome = 85000,
  baseObligations = 22000,
  baseBureauScore = 740,
  readOnly = false,
}: DecisionSimulatorCardProps) {
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [hypAmount, setHypAmount] = useState<number>(baseAmount);
  const [hypTenure, setHypTenure] = useState<number>(baseTenure);
  const [hypRate, setHypRate] = useState<number>(baseRate);
  const [hypIncome, setHypIncome] = useState<number>(baseIncome);
  const [hypObligations, setHypObligations] = useState<number>(baseObligations);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scenarioName, setScenarioName] = useState('');

  // Fetch saved scenario snapshots
  const { data: savedSnapshots = [] } = useQuery<any[]>({
    queryKey: ['saved-simulations', applicationId],
    queryFn: async () => {
      try {
        const res = await api.get(`/decision-simulator/saved/${applicationId}`);
        return res.data?.data || [];
      } catch {
        return [];
      }
    },
  });

  const simMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/decision-simulator/simulate', {
        applicationId,
        hypotheticalAmount: hypAmount,
        hypotheticalTenureMonths: hypTenure,
        hypotheticalInterestRate: hypRate,
        hypotheticalMonthlyIncome: hypIncome,
        hypotheticalMonthlyObligations: hypObligations,
      });
      return res.data?.data;
    },
    onError: (err: any) => {
      toast.error('Simulation Error', apiErrorMessage(err));
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ simulationId, name }: { simulationId: string; name: string }) => {
      const res = await api.post('/decision-simulator/save', { simulationId, name });
      return res.data?.data;
    },
    onSuccess: () => {
      setShowSaveModal(false);
      setScenarioName('');
      queryClient.invalidateQueries({ queryKey: ['saved-simulations', applicationId] });
      toast.success('Simulation Saved', 'Simulation scenario snapshot saved successfully.');
    },
    onError: (err: any) => {
      toast.error('Save Simulation Notice', apiErrorMessage(err));
    },
  });

  const simResult = simMutation.data;

  const handleReset = () => {
    setHypAmount(baseAmount);
    setHypTenure(baseTenure);
    setHypRate(baseRate);
    setHypIncome(baseIncome);
    setHypObligations(baseObligations);
    simMutation.reset();
  };

  const handleLoadSnapshot = (snap: any) => {
    if (snap.assumptions) {
      if (snap.assumptions.requestedAmount) setHypAmount(Number(snap.assumptions.requestedAmount));
      if (snap.assumptions.tenureMonths) setHypTenure(Number(snap.assumptions.tenureMonths));
      if (snap.assumptions.interestRate) setHypRate(Number(snap.assumptions.interestRate));
      if (snap.assumptions.monthlyIncome) setHypIncome(Number(snap.assumptions.monthlyIncome));
      if (snap.assumptions.monthlyObligations) setHypObligations(Number(snap.assumptions.monthlyObligations));
    }
  };

  return (
    <Card className="p-5 space-y-4 border border-blue-200 dark:border-blue-900/40 bg-gradient-to-b from-blue-50/20 via-transparent to-transparent">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Decision Simulator & What-If Modeler
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                NON-DESTRUCTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Hypothetical credit parameter adjustment without modifying actual database records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleReset}
            className="text-xs h-7 px-2.5 cursor-pointer"
          >
            Reset
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={simMutation.isPending}
            onClick={() => simMutation.mutate()}
            className="text-xs h-7 px-3 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', simMutation.isPending && 'animate-spin')} />
            {simMutation.isPending ? 'Simulating...' : 'Run Simulation'}
          </Button>
        </div>
      </div>

      {/* Interactive Parameter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-slate-50/60 dark:bg-[#0E1528]/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-[#1E2445]">
        {/* Loan Amount */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Requested Amount
            </label>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              ₹{Number(hypAmount).toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            min={20000}
            max={Math.max(500000, baseAmount * 1.5)}
            step={5000}
            value={hypAmount}
            onChange={(e) => setHypAmount(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Tenure */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Tenure (Months)
            </label>
            <span className="font-bold text-blue-600 dark:text-blue-400">{hypTenure} mos</span>
          </div>
          <input
            type="range"
            min={6}
            max={60}
            step={3}
            value={hypTenure}
            onChange={(e) => setHypTenure(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Interest Rate */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Annual Interest Rate
            </label>
            <span className="font-bold text-blue-600 dark:text-blue-400">{hypRate}%</span>
          </div>
          <input
            type="range"
            min={8}
            max={28}
            step={0.5}
            value={hypRate}
            onChange={(e) => setHypRate(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Monthly Income */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Verified Monthly Income
            </label>
            <span className="font-bold text-slate-900 dark:text-white">
              ₹{Number(hypIncome).toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            min={15000}
            max={300000}
            step={5000}
            value={hypIncome}
            onChange={(e) => setHypIncome(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Existing Obligations */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="font-semibold text-slate-700 dark:text-slate-300">
              Monthly Obligations
            </label>
            <span className="font-bold text-slate-900 dark:text-white">
              ₹{Number(hypObligations).toLocaleString('en-IN')}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100000}
            step={2000}
            value={hypObligations}
            onChange={(e) => setHypObligations(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Preset Scenarios */}
        <div className="flex flex-col justify-end space-y-1">
          <span className="text-[11px] font-semibold text-slate-400">Quick Scenarios:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setHypAmount(Math.round(baseAmount * 0.8));
                setHypTenure(Math.min(60, baseTenure + 6));
              }}
              className="text-[10px] px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer"
            >
              Lower FOIR (-20% Amt)
            </button>
            <button
              type="button"
              onClick={() => {
                setHypTenure(36);
                setHypAmount(baseAmount);
              }}
              className="text-[10px] px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200 hover:border-blue-500 cursor-pointer"
            >
              Extend Tenure (36m)
            </button>
          </div>
        </div>
      </div>

      {/* Comparative State Matrix */}
      {simResult && (
        <div className="space-y-3.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-blue-600" />
              Comparative Impact Analysis (Actual vs Simulated)
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowSaveModal(true)}
              className="text-xs h-7 px-2.5 flex items-center gap-1 text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-blue-600" /> Save Scenario Snapshot
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Monthly EMI */}
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0E1528] space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Monthly EMI
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ₹{Number(simResult.metrics.emi.simulated).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 line-through">
                  ₹{Number(simResult.metrics.emi.actual).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-semibold">
                {Number(simResult.metrics.emi.delta) < 0 ? (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <TrendingDown className="h-3 w-3" /> -₹
                    {Math.abs(Number(simResult.metrics.emi.delta)).toLocaleString('en-IN')}/mo
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-0.5">
                    <TrendingUp className="h-3 w-3" /> +₹
                    {Math.abs(Number(simResult.metrics.emi.delta)).toLocaleString('en-IN')}/mo
                  </span>
                )}
              </div>
            </div>

            {/* FOIR % */}
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0E1528] space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Debt-to-Income (FOIR)
              </span>
              <div className="flex items-baseline justify-between">
                <span
                  className={cn(
                    'text-sm font-bold',
                    simResult.metrics.foirPercent.simulated <= 50
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                >
                  {simResult.metrics.foirPercent.simulated}%
                </span>
                <span className="text-[11px] text-slate-400 line-through">
                  {simResult.metrics.foirPercent.actual}%
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Policy Limit: &lt;= 55%
              </span>
            </div>

            {/* Eligibility Result */}
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0E1528] space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Rule Eligibility
              </span>
              <div className="flex items-baseline justify-between">
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded',
                    simResult.metrics.eligibilityResult.simulated === 'ELIGIBLE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                  )}
                >
                  {simResult.metrics.eligibilityResult.simulated}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {simResult.metrics.eligibilityScore.simulated}/100
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Base: {simResult.metrics.eligibilityResult.actual}
              </span>
            </div>

            {/* Total Interest Outflow */}
            <div className="p-3 rounded-xl border border-slate-200/80 dark:border-[#1E2445] bg-white dark:bg-[#0E1528] space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Interest Cost
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  ₹{Number(simResult.metrics.totalInterest.simulated).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 line-through">
                  ₹{Number(simResult.metrics.totalInterest.actual).toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block">
                Total Payout: ₹{Number(simResult.metrics.totalRepayment.simulated).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Changed Conditions & Warnings */}
          {simResult.changedConditions.length > 0 && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-200/60 dark:border-[#1E2445] text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Detected Underwriting Impact & Changes:
              </span>
              {simResult.changedConditions.map((c: any, i: number) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  {c.impact === 'POSITIVE' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : c.impact === 'NEGATIVE' ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                  )}
                  <span className="text-slate-700 dark:text-slate-300">{c.detail}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Tradeoff Synthesis */}
          {simResult.aiExplanation && (
            <div className="p-3.5 rounded-xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold">
                <Sparkles className="h-4 w-4" /> AI Tradeoff Analysis & Underwriter Takeaway
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                {simResult.aiExplanation.summary}
              </p>
              <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                {simResult.aiExplanation.tradeoffs.map((t: string, i: number) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-1.5 border-t border-purple-200/50 dark:border-purple-900/30 text-[11px] text-purple-900 dark:text-purple-200 font-medium">
                <strong>Underwriter Action:</strong> {simResult.aiExplanation.underwriterTakeaway}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Snapshots Drawer / History */}
      {savedSnapshots.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-[#1E2445] space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-slate-400" />
            Saved Simulation Snapshots ({savedSnapshots.length})
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {savedSnapshots.map((snap: any) => (
              <button
                key={snap.id}
                type="button"
                onClick={() => handleLoadSnapshot(snap)}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1528] text-left shrink-0 hover:border-blue-500 transition-colors text-[11px] space-y-0.5 cursor-pointer"
              >
                <div className="font-bold text-slate-800 dark:text-slate-200">{snap.name}</div>
                <div className="text-[10px] text-slate-400">
                  ₹{Number(snap.assumptions?.requestedAmount || 0).toLocaleString('en-IN')} •{' '}
                  {snap.assumptions?.tenureMonths}m • by {snap.createdBy?.split('@')[0]}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SAVE SNAPSHOT MODAL */}
      {showSaveModal && simResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Save Hypothetical Scenario Snapshot
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Give this scenario a recognizable name for underwriting committee review (e.g. &quot;Tenure Extension 36m&quot;).
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scenario Name *
                </label>
                <Input
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g. Approved with ₹20,000 Downpayment"
                  className="text-xs"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                <strong>Assumptions:</strong> ₹{Number(hypAmount).toLocaleString('en-IN')} amount, {hypTenure} mos tenure, {hypRate}% interest rate.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setShowSaveModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!scenarioName.trim() || saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate({
                    simulationId: simResult.simulationId,
                    name: scenarioName,
                  })
                }
                className="text-xs cursor-pointer"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Snapshot'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
