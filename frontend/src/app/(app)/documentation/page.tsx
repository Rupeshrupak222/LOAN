'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  Shield,
  Server,
  Layers,
  Terminal,
  FileText,
  Users,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Zap,
} from 'lucide-react';

export default function DocumentationPage() {
  const [activeDoc, setActiveDoc] = useState<string>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const docSections = [
    { id: 'OVERVIEW', title: 'Platform Architecture', icon: Layers, file: 'A_PLATFORM_OVERVIEW.md' },
    { id: 'ADMIN', title: 'Administrator Guide', icon: Users, file: 'B_ADMIN_GUIDE.md' },
    { id: 'RUNBOOKS', title: 'Operations & Runbooks', icon: Terminal, file: 'C_OPERATIONS_AND_RUNBOOKS.md' },
    { id: 'API', title: 'Developer & REST API', icon: Code2, file: 'D_DEVELOPER_AND_API_REFERENCE.md' },
    { id: 'INTEGRATIONS', title: 'Integration Hub', icon: Zap, file: 'E_INTEGRATION_HUB_GUIDE.md' },
    { id: 'SECURITY', title: 'Security & DPDP', icon: Shield, file: 'F_SECURITY_AND_COMPLIANCE.md' },
    { id: 'DEPLOYMENT', title: 'Deployment & DR', icon: Server, file: 'G_DEPLOYMENT_AND_RECOVERY.md' },
    { id: 'MANUALS', title: 'End-User Role Manuals', icon: FileText, file: 'H_END_USER_ROLE_MANUALS.md' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Documentation & Runbooks</h1>
            <p className="text-sm text-slate-400">Production-Grade Architecture, Developer REST APIs, Operational Runbooks & User Manuals</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-xs font-semibold text-emerald-400">Documentation Version v2.4.0 (Synchronized)</span>
          </div>
        </div>
      </div>

      {/* Doc Browser Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-2">
          {docSections.map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeDoc === sec.id;

            return (
              <button
                key={sec.id}
                onClick={() => setActiveDoc(sec.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 font-bold shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span className="text-sm">{sec.title}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>

        {/* Content Viewer */}
        <div className="md:col-span-3 bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6">
          {activeDoc === 'OVERVIEW' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Platform Overview & Architecture</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Adyapan is a multi-tenant digital lending platform engineered for institutional scale, security, and strict regulatory compliance.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-indigo-400 uppercase">Deterministic Financial Math</span>
                  <p className="text-xs text-slate-400 mt-1">Reducing-balance EMI calculations and statutory repayment priority allocations execute with zero decimal drift.</p>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 uppercase">Strict Multi-Tenant Isolation</span>
                  <p className="text-xs text-slate-400 mt-1">Kernel-level row partitioning guarantees zero cross-institution data or context leakage.</p>
                </div>
              </div>
            </div>
          )}

          {activeDoc === 'RUNBOOKS' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Operational Runbooks & Incident Response</h2>
              <div className="space-y-3">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-amber-400 uppercase">RUNBOOK 03: Provider Timeout & Automatic Failover</span>
                  <p className="text-xs text-slate-300 mt-1">If CRIF High Mark times out with 504, Integration Hub automatically switches routing to Experian with zero downtime.</p>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-rose-400 uppercase">RUNBOOK 04: Disbursement Saga Reversal</span>
                  <p className="text-xs text-slate-300 mt-1">If payout gateway reservation fails to write to the ledger, automatic compensating reversals void the transaction and log to DLQ.</p>
                </div>
              </div>
            </div>
          )}

          {activeDoc === 'API' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Developer REST API Reference</h2>
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
                <p className="text-emerald-400">POST /api/v1/auth/login</p>
                <p className="text-indigo-400">POST /api/v1/loan-products/simulate-pricing</p>
                <p className="text-amber-400">POST /api/v1/workflows/evaluate-transition</p>
                <p className="text-cyan-400">POST /api/v1/client-onboarding/initiate</p>
                <p className="text-purple-400">POST /api/v1/audit/verify-chain</p>
              </div>
            </div>
          )}

          {activeDoc !== 'OVERVIEW' && activeDoc !== 'RUNBOOKS' && activeDoc !== 'API' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">{docSections.find((s) => s.id === activeDoc)?.title}</h2>
              <p className="text-sm text-slate-300">
                Full documentation content is synchronized with <code className="text-xs text-indigo-400 bg-slate-950 px-2 py-1 rounded">docs/{docSections.find((s) => s.id === activeDoc)?.file}</code>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
