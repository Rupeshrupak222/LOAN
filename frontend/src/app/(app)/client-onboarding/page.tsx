'use client';

import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Plus,
  RefreshCw,
  XCircle,
  FileCheck,
  Layers,
  Lock,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

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
  organizationDetails: {
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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'DOSSIERS' | 'CHECKLIST' | 'VALIDATION'>('CHECKLIST');

  // Interactive mock state matching live client-onboarding service
  const [dossiers, setDossiers] = useState<OnboardingDossier[]>([
    {
      id: 'onb-adyapan-default',
      tenantId: 'tenant-adyapan-default',
      code: 'ADYAPAN_FINANCE',
      name: 'Adyapan Prime Lending NBFC',
      tier: 'STRATEGIC_NBFC',
      stage: 'ACTIVE',
      primaryContact: { name: 'Rupesh Kumar', email: 'superadmin@adyapan.dev', phone: '+91 98110 22334' },
      organizationDetails: { cinNumber: 'U65999MH2024PTC123456', rbiRegistrationNo: 'N-14.03219', domain: 'adyapan.dev' },
      completionPercentage: 100,
      assignedOwnerEmail: 'superadmin@adyapan.dev',
      retentionYears: 8,
      checklist: [
        { code: 'ORGANIZATION_PROFILE', name: 'Legal Organization Profile', category: 'ORGANIZATION', description: 'Record CIN, RBI NBFC registration number, and registered address.', isMandatory: true, status: 'COMPLETED' },
        { code: 'ADMIN_ACCOUNT', name: 'Primary Institution Admin', category: 'ORGANIZATION', description: 'Configure institution super-administrator credentials.', isMandatory: true, status: 'COMPLETED' },
        { code: 'BRANCH_TOPOLOGY', name: 'Branch Network & Hierarchy', category: 'ORGANIZATION', description: 'Configure head office and regional branch network mapping.', isMandatory: true, status: 'COMPLETED' },
        { code: 'ROLE_SOD_RULES', name: 'Role Catalog & SoD Rules', category: 'SECURITY_RBAC', description: 'Activate Maker-Checker and Sanctioner-Disburser segregation of duties.', isMandatory: true, status: 'COMPLETED' },
        { code: 'PERMISSION_MAPPINGS', name: 'Granular Permission Scopes', category: 'SECURITY_RBAC', description: 'Map 28 granular permissions and financial sanction authority limits.', isMandatory: true, status: 'COMPLETED' },
        { code: 'PRODUCT_CATALOG', name: 'Dynamic Product Catalog', category: 'PRODUCT_WORKFLOW', description: 'Configure loan products, interest rate matrices, and KFS fees.', isMandatory: true, status: 'COMPLETED' },
        { code: 'WORKFLOW_GATES', name: 'Dynamic Workflow & Gates', category: 'PRODUCT_WORKFLOW', description: 'Configure origination stages, SLA targets, and mandatory verification gates.', isMandatory: true, status: 'COMPLETED' },
        { code: 'COMPLIANCE_POLICIES', name: 'Lending Policy & FOIR Caps', category: 'COMPLIANCE_PRIVACY', description: 'Set statutory FOIR ceiling (65%), CIBIL floor (650), and DTI limits.', isMandatory: true, status: 'COMPLETED' },
        { code: 'PRIVACY_DPDP', name: 'Statutory DPDP Consent Registry', category: 'COMPLIANCE_PRIVACY', description: 'Publish versioned borrower consent purposes and privacy preferences.', isMandatory: true, status: 'COMPLETED' },
        { code: 'BRANDING_ASSETS', name: 'White-Label Branding & Portal', category: 'ORGANIZATION', description: 'Upload institution logo, primary colors, and custom sub-domain.', isMandatory: false, status: 'COMPLETED' },
        { code: 'INTEGRATION_GATEWAYS', name: 'Integration Hub Gateways', category: 'INTEGRATIONS', description: 'Configure credit bureau, payment gateway, eKYC, and AA routing.', isMandatory: true, status: 'COMPLETED' },
        { code: 'COMMUNICATION_CHANNELS', name: 'SMS & Email Notification Templates', category: 'INTEGRATIONS', description: 'Verify statutory SMS and email templates.', isMandatory: false, status: 'COMPLETED' },
        { code: 'SECURITY_HARDENING', name: 'Security & Account Lockout Policies', category: 'SECURITY_RBAC', description: 'Enforce 5-attempt brute-force protection and session timeouts.', isMandatory: true, status: 'COMPLETED' },
        { code: 'STAFF_USER_SETUP', name: 'Staff User Provisioning', category: 'SECURITY_RBAC', description: 'Create initial underwriter, loan officer, and finance checker accounts.', isMandatory: false, status: 'COMPLETED' },
        { code: 'TESTING_VERIFICATION', name: 'End-to-End Sandbox Simulation', category: 'GO_LIVE_APPROVAL', description: 'Execute synthetic borrower lifecycle test.', isMandatory: true, status: 'COMPLETED' },
        { code: 'GOLIVE_SIGN_OFF', name: 'Executive Go-Live Sign-Off', category: 'GO_LIVE_APPROVAL', description: 'Formally approve commercial institution activation.', isMandatory: true, status: 'COMPLETED' },
      ],
    },
    {
      id: 'onb-kotak-prime-8812',
      tenantId: 'tenant-kotak-prime',
      code: 'KOTAK_PRIME',
      name: 'Kotak Prime Auto Finance',
      tier: 'STRATEGIC_NBFC',
      stage: 'VALIDATION',
      primaryContact: { name: 'Anand Mahindra', email: 'anand@kotakprime.com', phone: '+91 99000 11223' },
      organizationDetails: { cinNumber: 'U65990MH1996PLC098765', rbiRegistrationNo: 'N-13.00199', domain: 'kotakprime.adyapan.dev' },
      completionPercentage: 81,
      assignedOwnerEmail: 'superadmin@adyapan.dev',
      retentionYears: 8,
      checklist: [
        { code: 'ORGANIZATION_PROFILE', name: 'Legal Organization Profile', category: 'ORGANIZATION', description: 'Record CIN, RBI NBFC registration number, and registered address.', isMandatory: true, status: 'COMPLETED' },
        { code: 'ADMIN_ACCOUNT', name: 'Primary Institution Admin', category: 'ORGANIZATION', description: 'Configure institution super-administrator credentials.', isMandatory: true, status: 'COMPLETED' },
        { code: 'BRANCH_TOPOLOGY', name: 'Branch Network & Hierarchy', category: 'ORGANIZATION', description: 'Configure head office and regional branch network mapping.', isMandatory: true, status: 'COMPLETED' },
        { code: 'ROLE_SOD_RULES', name: 'Role Catalog & SoD Rules', category: 'SECURITY_RBAC', description: 'Activate Maker-Checker and Sanctioner-Disburser segregation of duties.', isMandatory: true, status: 'COMPLETED' },
        { code: 'PERMISSION_MAPPINGS', name: 'Granular Permission Scopes', category: 'SECURITY_RBAC', description: 'Map 28 granular permissions and financial sanction authority limits.', isMandatory: true, status: 'COMPLETED' },
        { code: 'PRODUCT_CATALOG', name: 'Dynamic Product Catalog', category: 'PRODUCT_WORKFLOW', description: 'Configure loan products, interest rate matrices, and KFS fees.', isMandatory: true, status: 'COMPLETED' },
        { code: 'WORKFLOW_GATES', name: 'Dynamic Workflow & Gates', category: 'PRODUCT_WORKFLOW', description: 'Configure origination stages, SLA targets, and mandatory verification gates.', isMandatory: true, status: 'COMPLETED' },
        { code: 'COMPLIANCE_POLICIES', name: 'Lending Policy & FOIR Caps', category: 'COMPLIANCE_PRIVACY', description: 'Set statutory FOIR ceiling (65%), CIBIL floor (650), and DTI limits.', isMandatory: true, status: 'COMPLETED' },
        { code: 'PRIVACY_DPDP', name: 'Statutory DPDP Consent Registry', category: 'COMPLIANCE_PRIVACY', description: 'Publish versioned borrower consent purposes and privacy preferences.', isMandatory: true, status: 'COMPLETED' },
        { code: 'BRANDING_ASSETS', name: 'White-Label Branding & Portal', category: 'ORGANIZATION', description: 'Upload institution logo, primary colors, and custom sub-domain.', isMandatory: false, status: 'COMPLETED' },
        { code: 'INTEGRATION_GATEWAYS', name: 'Integration Hub Gateways', category: 'INTEGRATIONS', description: 'Configure credit bureau, payment gateway, eKYC, and AA routing.', isMandatory: true, status: 'COMPLETED' },
        { code: 'COMMUNICATION_CHANNELS', name: 'SMS & Email Notification Templates', category: 'INTEGRATIONS', description: 'Verify statutory SMS and email templates.', isMandatory: false, status: 'COMPLETED' },
        { code: 'SECURITY_HARDENING', name: 'Security & Account Lockout Policies', category: 'SECURITY_RBAC', description: 'Enforce 5-attempt brute-force protection and session timeouts.', isMandatory: true, status: 'COMPLETED' },
        { code: 'STAFF_USER_SETUP', name: 'Staff User Provisioning', category: 'SECURITY_RBAC', description: 'Create initial underwriter, loan officer, and finance checker accounts.', isMandatory: false, status: 'IN_PROGRESS' },
        { code: 'TESTING_VERIFICATION', name: 'End-to-End Sandbox Simulation', category: 'GO_LIVE_APPROVAL', description: 'Execute synthetic borrower lifecycle test.', isMandatory: true, status: 'IN_PROGRESS' },
        { code: 'GOLIVE_SIGN_OFF', name: 'Executive Go-Live Sign-Off', category: 'GO_LIVE_APPROVAL', description: 'Formally approve commercial institution activation.', isMandatory: true, status: 'NOT_STARTED' },
      ],
    },
  ]);

  const [selectedDossierId, setSelectedDossierId] = useState<string>('onb-kotak-prime-8812');
  const activeDossier = dossiers.find((d) => d.id === selectedDossierId) || dossiers[0];

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
    setDossiers((prev) =>
      prev.map((dos) => {
        if (dos.id !== activeDossier.id) return dos;
        const newChecklist = dos.checklist.map((t) => {
          if (t.code !== code) return t;
          const nextStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' =
            t.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
          return { ...t, status: nextStatus };
        });
        const completed = newChecklist.filter((t) => t.status === 'COMPLETED').length;
        const pct = Math.round((completed / newChecklist.length) * 100);
        return { ...dos, checklist: newChecklist, completionPercentage: pct };
      })
    );
  };

  const filteredTasks =
    selectedCategory === 'ALL'
      ? activeDossier.checklist
      : activeDossier.checklist.filter((t) => t.category === selectedCategory);

  const pendingMandatory = activeDossier.checklist.filter((t) => t.isMandatory && t.status !== 'COMPLETED');

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
          <span className="text-sm font-bold text-indigo-400">{activeDossier.completionPercentage}% Onboarding Complete</span>
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
          16-Point Institutional Checklist ({activeDossier.checklist.filter((t) => t.status === 'COMPLETED').length}/16)
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
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {activeDossier.checklist.filter((t) => t.status === 'COMPLETED').length}
              </p>
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
