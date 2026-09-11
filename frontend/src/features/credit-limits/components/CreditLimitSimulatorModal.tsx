'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Calculator,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useCreditLimitSimulation } from '../hooks/useCreditLimits';
import { CreditLimitSimulationResult, RiskGrade } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CreditLimitSimulatorModal({ isOpen, onClose }: Props) {
  const [income, setIncome] = useState<number>(75000);
  const [obligations, setObligations] = useState<number>(15000);
  const [cibilScore, setCibilScore] = useState<number>(760);
  const [riskGrade, setRiskGrade] = useState<RiskGrade>('A');
  const [existingExposure, setExistingExposure] = useState<number>(50000);
  const [requestedLimit, setRequestedLimit] = useState<number>(200000);

  const simulateMutation = useCreditLimitSimulation();
  const [simResult, setSimResult] = useState<CreditLimitSimulationResult | null>(null);

  if (!isOpen) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await simulateMutation.mutateAsync({
      declaredMonthlyIncome: income,
      existingMonthlyObligations: obligations,
      cibilScore,
      riskGrade,
      existingExposure,
      requestedLimit,
    });
    setSimResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Credit Line Capacity Simulator</h2>
              <p className="text-xs text-slate-500">
                Stateless simulation of risk-based limits, FOIR bounds, and multi-facility exposure caps.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSimulate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Declared Monthly Income (₹)
              </label>
              <input
                type="number"
                step="5000"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Existing Monthly Obligations (₹)
              </label>
              <input
                type="number"
                step="2000"
                value={obligations}
                onChange={(e) => setObligations(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                CIBIL Bureau Score
              </label>
              <input
                type="number"
                min="300"
                max="900"
                value={cibilScore}
                onChange={(e) => {
                  const score = Number(e.target.value);
                  setCibilScore(score);
                  if (score >= 750) setRiskGrade('A');
                  else if (score >= 700) setRiskGrade('B');
                  else if (score >= 650) setRiskGrade('C');
                  else if (score >= 600) setRiskGrade('D');
                  else setRiskGrade('E');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Risk Grade
              </label>
              <select
                value={riskGrade}
                onChange={(e) => setRiskGrade(e.target.value as RiskGrade)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="A">Grade A (Prime / Super Clean)</option>
                <option value="B">Grade B (Good / Standard)</option>
                <option value="C">Grade C (Moderate Risk)</option>
                <option value="D">Grade D (Sub-Prime / High Risk)</option>
                <option value="E">Grade E (Critical Ineligible)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Existing Institutional Exposure (₹)
              </label>
              <input
                type="number"
                step="5000"
                value={existingExposure}
                onChange={(e) => setExistingExposure(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Requested Credit Limit (₹)
              </label>
              <input
                type="number"
                step="10000"
                value={requestedLimit}
                onChange={(e) => setRequestedLimit(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={simulateMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all"
            >
              <Calculator className="w-4 h-4" />
              {simulateMutation.isPending ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </form>

        {/* Simulation Output */}
        {simResult && (
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50/80 border border-indigo-100">
              <div>
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                  Authoritative Eligible Limit
                </span>
                <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
                  ₹{simResult.approvedLimit.toLocaleString('en-IN')}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-indigo-600 text-white">
                  Risk Grade {simResult.riskGrade}
                </span>
                <div className="text-xs text-indigo-800 mt-1.5 font-medium">
                  Max FOIR: {simResult.maxFoirAllowedPct}%
                </div>
              </div>
            </div>

            {/* Constraints Table */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="font-semibold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>Multi-Cap Derivation Matrix</span>
                <span className="text-slate-500">Binding = Active Bottleneck</span>
              </div>
              {simResult.constraintsApplied.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-none">
                  <span className={c.isBinding ? 'font-bold text-indigo-700 flex items-center gap-1' : 'text-slate-600'}>
                    {c.isBinding && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {c.constraint}:
                  </span>
                  <span className={`font-mono ${c.isBinding ? 'font-extrabold text-indigo-700' : 'text-slate-800'}`}>
                    ₹{c.value.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Sample Drawdown Terms */}
            {simResult.isApproved && (
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Sample ₹50,000 Drawdown Preview (12 Months @ {simResult.drawdownSimulation.annualInterestRatePct}%)
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Platform Fee + GST:</span>
                    <strong className="text-slate-900">₹{(simResult.drawdownSimulation.drawdownFee + simResult.drawdownSimulation.drawdownFeeGst).toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Net Disbursed:</span>
                    <strong className="text-emerald-700">₹{simResult.drawdownSimulation.netDisbursed.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Monthly EMI:</span>
                    <strong className="text-slate-900">₹{simResult.drawdownSimulation.estimatedMonthlyEmi.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
