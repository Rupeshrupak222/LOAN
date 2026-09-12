'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Sliders,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Layers,
  Activity,
  Plus,
} from 'lucide-react';
import { RiskScoreCard } from '@/features/risk/components/RiskScoreCard';
import { RiskSignalBreakdown } from '@/features/risk/components/RiskSignalBreakdown';
import { RiskOverrideModal } from '@/features/risk/components/RiskOverrideModal';
import { RiskEvaluationResult } from '@/features/risk/types';
import { simulateRisk } from '@/features/risk/api';
import { useToast } from '@/lib/toast';

export default function RiskDashboardPage() {
  const toast = useToast();
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);

  // Demo evaluation state for interactive dashboard exploration
  const [evaluation, setEvaluation] = useState<RiskEvaluationResult>({
    id: 'risk-eval-demo-001',
    applicationId: 'app-demo-retail-001',
    customerId: 'cust-demo-001',
    tenantId: 'tenant-adyapan-default',
    evaluationVersion: 1,
    riskScore: 28,
    riskBand: 'MODERATE',
    riskGrade: 'B',
    categorySummaries: {
      CUSTOMER: { category: 'CUSTOMER', score: 20, weight: 15, contribution: 3, signalsCount: 1, criticalSignalsCount: 0, topReasons: ['Applicant has 2 years experience in current role.'] },
      FINANCIAL: { category: 'FINANCIAL', score: 30, weight: 25, contribution: 8, signalsCount: 1, criticalSignalsCount: 0, topReasons: ['FOIR is 28%, well within the 50% benchmark.'] },
      CREDIT: { category: 'CREDIT', score: 25, weight: 25, contribution: 6, signalsCount: 1, criticalSignalsCount: 0, topReasons: ['CIBIL score of 745 with no overdue history.'] },
      BANKING: { category: 'BANKING', score: 35, weight: 20, contribution: 7, signalsCount: 1, criticalSignalsCount: 0, topReasons: ['AMB ₹24,000 with clean debit history.'] },
      APPLICATION: { category: 'APPLICATION', score: 20, weight: 10, contribution: 2, signalsCount: 0, criticalSignalsCount: 0, topReasons: [] },
      BEHAVIORAL: { category: 'BEHAVIORAL', score: 10, weight: 5, contribution: 1, signalsCount: 0, criticalSignalsCount: 0, topReasons: [] },
    },
    signals: [
      {
        id: 'sig-exp-2yr',
        code: 'RISK_CUST_EXPERIENCE',
        name: 'Work Experience & Stability',
        category: 'CUSTOMER',
        actualValue: '24 months',
        benchmarkValue: '>= 12 months',
        severity: 'LOW',
        weight: 15,
        scoreContribution: 10,
        reason: '2 years continuous salaried employment confirmed.',
        recommendation: 'Standard validation of latest 3 salary slips.',
      },
      {
        id: 'sig-foir-28',
        code: 'RISK_FIN_FOIR',
        name: 'Fixed Obligation Ratio (FOIR)',
        category: 'FINANCIAL',
        actualValue: '28%',
        benchmarkValue: '<= 50%',
        severity: 'LOW',
        weight: 25,
        scoreContribution: 15,
        reason: 'FOIR provides comfortable buffer against monthly income.',
        recommendation: 'Recommend standard loan amount sanction.',
      },
    ],
    keyRiskDrivers: ['Standard income vintage', 'Acceptable debt service capacity'],
    recommendation: 'Low-to-moderate risk profile. Recommend standard automated sanction within delegated authority limits.',
    policyId: 'risk-policy-standard',
    policyCode: 'RISK_POL_STANDARD_RETAIL',
    policyVersion: 1,
    override: null,
    evaluatedAt: new Date().toISOString(),
    executionTimeMs: 12,
  });

  const handleSimulateNewScenario = async () => {
    try {
      const simulated = await simulateRisk({
        applicantAge: 32,
        monthlyIncome: 85000,
        existingObligations: 20000,
        workExperienceMonths: 48,
        bureauScore: 780,
        averageMonthlyBalance: 45000,
        chequeBouncesLast90d: 0,
        requestedAmount: 300000,
        requestedTenureMonths: 36,
        applicationVelocity24h: 1,
      });
      setEvaluation(simulated);
      toast.success(`Simulated prime borrower profile (Score: ${simulated.riskScore}).`, 'Risk Scenario Simulated');
    } catch (err: any) {
      toast.error(err.message || 'Simulation failed');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Enterprise Risk Intelligence Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              6-Pillar Intelligence
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deterministic risk score calibration, authoritative A–E grading, and explainable signal telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateNewScenario}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Activity className="h-3.5 w-3.5" />
            Simulate Scenario
          </button>
          <Link
            href="/risk/policies"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-600/30"
          >
            <Sliders className="h-3.5 w-3.5" />
            Policy Studio
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/risk/queue"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Underwriting Queue</span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-2">
            18 Applications
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Pending risk evaluation and signal analysis
          </span>
        </Link>

        <Link
          href="/risk/policies"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Risk Policies</span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-2">
            Standard Retail v1
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
            Active across all retail origination channels
          </span>
        </Link>

        <Link
          href="/fraud"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-rose-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fraud Intelligence Center</span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
          </div>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 block mt-2">
            5 Active Cases
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Identity mismatch & device abuse investigations
          </span>
        </Link>
      </div>

      {/* Main Score Showcase Card */}
      <RiskScoreCard
        evaluation={evaluation}
        onReEvaluate={() => handleSimulateNewScenario()}
        onOpenOverride={() => setOverrideModalOpen(true)}
      />

      {/* 6-Pillar Signal Breakdown Component */}
      <RiskSignalBreakdown evaluation={evaluation} />

      {/* Override Modal */}
      <RiskOverrideModal
        evaluation={evaluation}
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        onSuccess={(updated) => setEvaluation(updated)}
      />
    </div>
  );
}
