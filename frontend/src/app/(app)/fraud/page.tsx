'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Sliders,
  Share2,
  Lock,
  ArrowRight,
  Eye,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
} from 'lucide-react';
import { FraudScoreGauge } from '@/features/fraud/components/FraudScoreGauge';
import { IdentityGraphVisualizer } from '@/features/fraud/components/IdentityGraphVisualizer';
import { FraudEvaluationResult } from '@/features/fraud/types';

export default function FraudDashboardPage() {
  const [evaluation] = useState<FraudEvaluationResult>({
    id: 'fraud-eval-demo-001',
    applicationId: 'app-demo-fraud-001',
    customerId: 'cust-demo-002',
    tenantId: 'tenant-adyapan-default',
    evaluationVersion: 1,
    fraudScore: 65,
    fraudBand: 'HIGH',
    outcome: 'HIGH_RISK',
    categorySummaries: {
      IDENTITY: { category: 'IDENTITY', score: 30, signalsCount: 1, criticalSignalsCount: 0, topReasons: ['Applicant name vs PAN record reflects 42% lexical divergence.'] },
      BANK_ACCOUNT: { category: 'BANK_ACCOUNT', score: 70, signalsCount: 1, criticalSignalsCount: 0, topReasons: ['Disbursement account HDFC0001928374 is shared with Aarav Sharma (CUST-001).'] },
      DEVICE: { category: 'DEVICE', score: 20, signalsCount: 0, criticalSignalsCount: 0, topReasons: [] },
      NETWORK: { category: 'NETWORK', score: 25, signalsCount: 1, criticalSignalsCount: 0, topReasons: ['Same IP subnet used by 2 active customer profiles.'] },
      APPLICATION_VELOCITY: { category: 'APPLICATION_VELOCITY', score: 20, signalsCount: 0, criticalSignalsCount: 0, topReasons: [] },
    },
    signals: [
      {
        id: 'sig-bank-reuse',
        code: 'FRAUD_BANK_ACCOUNT_REUSE',
        name: 'Shared Bank Account Reuse',
        category: 'BANK_ACCOUNT',
        actualValue: 'Disbursement account HDFC0001928374 linked to 2 borrowers',
        thresholdValue: '1 customer per account',
        severity: 'HIGH',
        scoreImpact: 35,
        reason: 'Disbursement bank account matches Aarav Sharma (CUST-001).',
        recommendedAction: 'Conduct physical verification of cancelled cheque.',
      },
      {
        id: 'sig-pan-name-divergence',
        code: 'FRAUD_IDENTITY_NAME_MISMATCH',
        name: 'Name vs PAN Divergence Index',
        category: 'IDENTITY',
        actualValue: '42% divergence',
        thresholdValue: '< 40% divergence',
        severity: 'MEDIUM',
        scoreImpact: 20,
        reason: 'Lexical difference detected between submitted name and PAN database.',
        recommendedAction: 'Verify secondary identity proof.',
      },
    ],
    rulesTriggered: [
      { ruleCode: 'FRAUD_RULE_BANK_NAME_MISMATCH', ruleName: 'Disbursement Bank Account Holder Mismatch', severity: 'HIGH', scoreImpact: 35 },
    ],
    identityClusterSummary: {
      primaryCustomerId: 'cust-demo-002',
      nodes: [
        { id: 'node-cust-002', type: 'CUSTOMER', label: 'Rohan Verma', value: 'cust-demo-002', isPrimary: true },
        { id: 'node-pan-002', type: 'PAN', label: 'PAN Card', value: 'XYZPV9876K' },
        { id: 'node-bank-002', type: 'BANK_ACCOUNT', label: 'Disbursement Account', value: 'HDFC0001928374' },
        { id: 'node-ip-002', type: 'IP', label: 'Origination IP', value: '103.21.14.88' },
        { id: 'node-cust-001', type: 'CUSTOMER', label: 'Aarav Sharma (Linked)', value: 'cust-demo-001' },
      ],
      edges: [
        { id: 'edge-1', sourceNodeId: 'node-cust-002', targetNodeId: 'node-bank-002', relationType: 'LINKED_BANK_ACCOUNT', severity: 'LOW', discoveredAt: new Date().toISOString() },
        { id: 'edge-2', sourceNodeId: 'node-cust-001', targetNodeId: 'node-bank-002', relationType: 'SHARED_BANK_ACCOUNT', severity: 'HIGH', discoveredAt: new Date().toISOString() },
      ],
      linkedCustomersCount: 1,
      linkedDevicesCount: 0,
      linkedAccountsCount: 1,
      linkedIpsCount: 1,
      clusterRiskScore: 65,
      maxSeverity: 'HIGH',
      clusterSummary: 'Cluster Alert: Linked with 1 other customer profile (Aarav Sharma) via shared disbursement bank account.',
    },
    keyFraudFlags: ['Shared disbursement bank account across multiple applicants'],
    recommendation: 'High fraud indicators detected. Mandate comprehensive fraud desk investigation before credit decisioning.',
    override: null,
    evaluatedAt: new Date().toISOString(),
    executionTimeMs: 14,
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Fraud & Anomaly Intelligence Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              Identity & AML Protection
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            5-Pillar anomaly telemetry, identity cluster graph linking, and configurable fraud rule governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/fraud/graph"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Share2 className="h-3.5 w-3.5" />
            Graph Explorer
          </Link>
          <Link
            href="/fraud/rules"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1.5 shadow-sm shadow-rose-600/30"
          >
            <Sliders className="h-3.5 w-3.5" />
            Fraud Rules Engine
          </Link>
        </div>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/fraud/cases"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-rose-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Investigation Cases</span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
          </div>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 block mt-2">
            6 Open Cases
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Assigned to fraud & AML investigators
          </span>
        </Link>

        <Link
          href="/fraud/graph"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-indigo-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identity Clusters</span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 block mt-2">
            3 High-Risk Clusters
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
            Shared bank account & device hardware linkages
          </span>
        </Link>

        <Link
          href="/fraud/rules"
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-blue-500 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rule Engine Catalog</span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 block mt-2">
            10 Active Rules
          </span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block mt-0.5">
            Live anomaly detection across origination flow
          </span>
        </Link>
      </div>

      {/* Main Fraud Score Dial */}
      <FraudScoreGauge evaluation={evaluation} />

      {/* Identity Graph Visualizer */}
      <IdentityGraphVisualizer cluster={evaluation.identityClusterSummary} />
    </div>
  );
}
