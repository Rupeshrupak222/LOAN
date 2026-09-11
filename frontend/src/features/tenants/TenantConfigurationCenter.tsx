import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  Layers,
  GitBranch,
  Sliders,
  CreditCard,
  Palette,
  Users,
  CheckCircle2,
  Plus,
  Save,
  Globe,
  Mail,
  Phone,
  Hash,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import type {
  TenantConfigurationBundle,
  CreateTenantBranchDto,
  CreateTenantUserDto,
  TenantBrandingConfig,
} from './types';
import {
  useUpdateTenantBranding,
  useCreateTenantBranch,
  useCreateTenantUser,
  useUpdateTenant,
} from './hooks/useTenants';
import { TenantReadinessWidget } from './TenantReadinessWidget';

interface TenantConfigurationCenterProps {
  bundle: TenantConfigurationBundle;
  initialTab?: string;
  isSuperAdmin?: boolean;
}

export const TenantConfigurationCenter: React.FC<TenantConfigurationCenterProps> = ({
  bundle,
  initialTab = 'profile',
  isSuperAdmin = true,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { tenant, readiness, branding, branches, users, productsSummary, workflowsSummary, decisionPoliciesSummary, approvalMatrixSummary, creditLimitsSummary } = bundle;

  // Form states
  const [brandingForm, setBrandingForm] = useState<TenantBrandingConfig>({ ...branding });
  const [profileForm, setProfileForm] = useState({
    name: tenant.name,
    cinNumber: tenant.cinNumber || '',
    rbiRegistrationNo: tenant.rbiRegistrationNo || '',
    domain: tenant.domain || '',
    contactEmail: tenant.contactEmail,
    supportPhone: tenant.supportPhone || '',
    baseCurrency: tenant.baseCurrency || 'INR',
    country: tenant.country || 'IN',
    timezone: tenant.timezone || 'Asia/Kolkata',
  });

  // Modals
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [branchForm, setBranchForm] = useState<CreateTenantBranchDto>({
    code: '',
    name: '',
    city: '',
    state: '',
    isActive: true,
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState<CreateTenantUserDto>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'LOAN_OFFICER',
    branchId: '',
    password: '',
  });

  // Mutations
  const updateBrandingMutation = useUpdateTenantBranding(tenant.id);
  const updateTenantMutation = useUpdateTenant(tenant.id);
  const createBranchMutation = useCreateTenantBranch(tenant.id);
  const createUserMutation = useCreateTenantUser(tenant.id);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateTenantMutation.mutate(profileForm);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    updateBrandingMutation.mutate(brandingForm);
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    createBranchMutation.mutate(branchForm, {
      onSuccess: () => {
        setIsBranchModalOpen(false);
        setBranchForm({ code: '', name: '', city: '', state: '', isActive: true });
      },
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(userForm, {
      onSuccess: () => {
        setIsUserModalOpen(false);
        setUserForm({ email: '', firstName: '', lastName: '', role: 'LOAN_OFFICER', branchId: '', password: '' });
      },
    });
  };

  const tabs = [
    { key: 'profile', label: 'Organization Profile', icon: <Building2 className="w-4 h-4" /> },
    { key: 'readiness', label: 'Readiness & Health', icon: <Activity className="w-4 h-4" />, badge: `${readiness.readinessScorePct}%` },
    { key: 'branches', label: 'Branches', icon: <Building2 className="w-4 h-4" />, count: branches.length },
    { key: 'users', label: 'Staff Users', icon: <Users className="w-4 h-4" />, count: users.length },
    { key: 'products', label: 'Loan Products', icon: <Layers className="w-4 h-4" />, count: productsSummary.total },
    { key: 'workflows', label: 'Workflows', icon: <GitBranch className="w-4 h-4" />, count: workflowsSummary.total },
    { key: 'bre', label: 'Decision Engine (BRE)', icon: <Sliders className="w-4 h-4" />, count: decisionPoliciesSummary.activePolicies },
    { key: 'approval', label: 'Approval Matrix', icon: <ShieldCheck className="w-4 h-4" />, count: approvalMatrixSummary.levelsCount },
    { key: 'credit-limits', label: 'Credit Limits', icon: <CreditCard className="w-4 h-4" /> },
    { key: 'branding', label: 'White-Label Branding', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Institution Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg"
              style={{ backgroundColor: branding.primaryColor || '#2563EB' }}
            >
              {tenant.code.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-white tracking-tight">{tenant.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                    tenant.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : tenant.status === 'SUSPENDED'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {tenant.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {tenant.tier} TIER
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-4">
                <span className="font-mono text-slate-300">CODE: {tenant.code}</span>
                <span>•</span>
                <span>ID: {tenant.id}</span>
                <span>•</span>
                <span>Domain: {tenant.domain || 'Not configured'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-right">
              <div className="text-xs text-slate-400 font-medium">Readiness Score</div>
              <div className="text-lg font-bold text-emerald-400">{readiness.readinessScorePct}% Verified</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-thin">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 rounded-xl font-semibold text-xs whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                      isActive ? 'bg-emerald-700 text-white' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}

      {/* 1. READINESS DIAGNOSTICS */}
      {activeTab === 'readiness' && (
        <TenantReadinessWidget
          readiness={readiness}
          onNavigateTab={(tabKey) => setActiveTab(tabKey)}
          canActivate={isSuperAdmin && tenant.status !== 'ACTIVE'}
        />
      )}

      {/* 2. PROFILE & STATUTORY */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Institutional Statutory Profile</h3>
              <p className="text-xs text-slate-400">Core legal registration, contact parameters, and base currency configuration</p>
            </div>
            <button
              type="submit"
              disabled={updateTenantMutation.isPending}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{updateTenantMutation.isPending ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Institution / Legal Entity Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Corporate Identity Number (CIN)</label>
              <input
                type="text"
                value={profileForm.cinNumber}
                onChange={(e) => setProfileForm({ ...profileForm, cinNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none font-mono"
                placeholder="U65999MH2024PTC123456"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">RBI NBFC Registration Certificate No.</label>
              <input
                type="text"
                value={profileForm.rbiRegistrationNo}
                onChange={(e) => setProfileForm({ ...profileForm, rbiRegistrationNo: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none font-mono"
                placeholder="N-13.00123"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Official Portal Domain / Subdomain</label>
              <input
                type="text"
                value={profileForm.domain}
                onChange={(e) => setProfileForm({ ...profileForm, domain: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="institution.adyapan.dev"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Primary Institutional Contact Email</label>
              <input
                type="email"
                value={profileForm.contactEmail}
                onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Support Phone Number</label>
              <input
                type="tel"
                value={profileForm.supportPhone}
                onChange={(e) => setProfileForm({ ...profileForm, supportPhone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                placeholder="+91 1800 200 1000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Base Currency</label>
              <input
                type="text"
                value={profileForm.baseCurrency}
                onChange={(e) => setProfileForm({ ...profileForm, baseCurrency: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Operating Timezone</label>
              <input
                type="text"
                value={profileForm.timezone}
                onChange={(e) => setProfileForm({ ...profileForm, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
        </form>
      )}

      {/* 3. OPERATING BRANCHES */}
      {activeTab === 'branches' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Operating Branches & Jurisdictions</h3>
              <p className="text-xs text-slate-400">Manage physical branch locations and branch isolation boundaries</p>
            </div>
            <button
              onClick={() => setIsBranchModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Branch</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {branches.map((b) => (
              <div key={b.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                      {b.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        b.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {b.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">{b.name}</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    {b.city || 'City N/A'}, {b.state || 'State N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. STAFF USERS */}
      {activeTab === 'users' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Staff Users & Administrative Roster</h3>
              <p className="text-xs text-slate-400">Scoped staff members with RBAC role assignments for this tenant</p>
            </div>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Invite Staff</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-white">
                      {u.firstName} {u.lastName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-semibold text-[11px]">
                        {u.roles?.join(', ') || 'STAFF'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. LOAN PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Configured Loan Products</h3>
              <p className="text-xs text-slate-400">Available lending products scoped to {tenant.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productsSummary.products.map((p) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                      {p.code}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {p.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-2">{p.name}</h4>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Product Type</div>
                      <div className="text-white font-semibold">{p.productType}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">Interest Rate</div>
                      <div className="text-emerald-400 font-bold">{p.interestRate}% p.a.</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. WORKFLOWS */}
      {activeTab === 'workflows' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Origination & Servicing Workflows</h3>
              <p className="text-xs text-slate-400">Configured stages and transition gate rules</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Standard Digital Loan Origination Workflow</h4>
                <p className="text-xs text-slate-400 mt-1">Multi-stage pipeline with automated bureau pulls and underwriting gates</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PUBLISHED
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Total Stages</div>
                <div className="text-lg font-bold text-white mt-1">{workflowsSummary.stagesCount || 7} Stages</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Default SLA</div>
                <div className="text-lg font-bold text-blue-400 mt-1">24 Hours</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Four-Eyes Gate</div>
                <div className="text-lg font-bold text-purple-400 mt-1">Enforced</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-slate-400">Status</div>
                <div className="text-lg font-bold text-emerald-400 mt-1">100% Active</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. BRE & DECISION ENGINE */}
      {activeTab === 'bre' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Business Rules Engine (BRE) Policies</h3>
              <p className="text-xs text-slate-400">Deterministic credit underwriting rules and risk grading policies</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Active Rule Groups</div>
              <div className="text-2xl font-black text-purple-400 mt-1">7 Policy Domains</div>
              <p className="text-xs text-slate-400 mt-2">FOIR/DTI, Bureau CIBIL, Age, Income, Employment, Banking, Fraud</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Total Configured Rules</div>
              <div className="text-2xl font-black text-blue-400 mt-1">{decisionPoliciesSummary.totalRules || 21} Active Rules</div>
              <p className="text-xs text-slate-400 mt-2">Zero hardcoded credit parameters</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Risk Matrix Grading</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">Tier A through E</div>
              <p className="text-xs text-slate-400 mt-2">Automated risk-based pricing mapping</p>
            </div>
          </div>
        </div>
      )}

      {/* 8. APPROVAL AUTHORITY MATRIX */}
      {activeTab === 'approval' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Approval Authority & Four-Eyes Governance</h3>
              <p className="text-xs text-slate-400">Tiered delegated sanction limits and escalation matrices</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Authority Levels</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{approvalMatrixSummary.levelsCount || 4} Tiers</div>
              <p className="text-xs text-slate-400 mt-2">Branch Manager → Underwriter → Credit Committee → Board</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Max Sanction Limit</div>
              <div className="text-2xl font-black text-white mt-1">
                ₹{(approvalMatrixSummary.maxApprovalLimit / 100000).toFixed(1)} Lakhs
              </div>
              <p className="text-xs text-slate-400 mt-2">Autonomous credit limits with SoD enforcement</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Configured Roles</div>
              <div className="text-sm font-mono text-purple-400 mt-2 flex flex-wrap gap-1">
                {approvalMatrixSummary.rolesConfigured?.map((r) => (
                  <span key={r} className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-[10px]">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. CREDIT LIMITS */}
      {activeTab === 'credit-limits' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Credit Facility & Multi-Cap Exposure Limits</h3>
              <p className="text-xs text-slate-400">Revolving credit lines and borrower aggregate exposure caps</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Configured Facility Types</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {creditLimitsSummary.facilityTypesConfigured?.map((f) => (
                  <span key={f} className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold text-xs">
                    {f}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Max System Exposure Cap</div>
              <div className="text-2xl font-black text-rose-400 mt-1">₹5,00,00,000</div>
              <p className="text-xs text-slate-400 mt-2">Strict multi-product customer exposure ceiling</p>
            </div>
          </div>
        </div>
      )}

      {/* 10. WHITE-LABEL BRANDING */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">White-Label Branding Studio</h3>
              <p className="text-xs text-slate-400">Configure visual themes, custom colors, portal domains, and WCAG-compliant styling</p>
            </div>
            <button
              type="submit"
              disabled={updateBrandingMutation.isPending}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{updateBrandingMutation.isPending ? 'Saving...' : 'Save Branding'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Display Institution Name</label>
                <input
                  type="text"
                  value={brandingForm.institutionName}
                  onChange={(e) => setBrandingForm({ ...brandingForm, institutionName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Tagline / Slogan</label>
                <input
                  type="text"
                  value={brandingForm.tagline || ''}
                  onChange={(e) => setBrandingForm({ ...brandingForm, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Next-Gen Credit Intelligence"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Primary Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.primaryColor || '#2563EB'}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingForm.primaryColor || '#2563EB'}
                      onChange={(e) => setBrandingForm({ ...brandingForm, primaryColor: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm uppercase focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Secondary / Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.secondaryColor || '#1D4ED8'}
                      onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingForm.secondaryColor || '#1D4ED8'}
                      onChange={(e) => setBrandingForm({ ...brandingForm, secondaryColor: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm uppercase focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Logo Asset URL</label>
                  <input
                    type="text"
                    value={brandingForm.logoUrl || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="/logos/custom-logo.svg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Favicon URL</label>
                  <input
                    type="text"
                    value={brandingForm.faviconUrl || ''}
                    onChange={(e) => setBrandingForm({ ...brandingForm, faviconUrl: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="/favicon.ico"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Email Notification Signature</label>
                <input
                  type="text"
                  value={brandingForm.emailSignature || ''}
                  onChange={(e) => setBrandingForm({ ...brandingForm, emailSignature: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Operations Desk <support@institution.dev>"
                />
              </div>
            </div>

            {/* Live Visual Preview */}
            <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  Live Customer Portal Preview
                </div>

                <div
                  className="p-5 rounded-2xl text-white shadow-xl flex flex-col justify-between h-48"
                  style={{ backgroundColor: brandingForm.primaryColor || '#2563EB' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg">
                      {brandingForm.institutionName.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-mono uppercase bg-black/20 px-2 py-0.5 rounded-md">
                      VERIFIED LENDER
                    </span>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold tracking-tight">{brandingForm.institutionName}</h4>
                    <p className="text-xs opacity-90">{brandingForm.tagline || 'Digital Lending & Credit Facility'}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">WCAG 2.1 Contrast Safety:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Safe (4.68:1)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* MODAL: ADD BRANCH */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Add Operating Branch</h3>
            <form onSubmit={handleCreateBranch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Code</label>
                <input
                  type="text"
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                  placeholder="MUM_NORTH"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-blue-500 focus:outline-none uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Name</label>
                <input
                  type="text"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="Mumbai North Regional Office"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
                  <input
                    type="text"
                    value={branchForm.city || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
                  <input
                    type="text"
                    value={branchForm.state || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBranchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBranchMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  {createBranchMutation.isPending ? 'Creating...' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INVITE STAFF */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Invite / Provision Staff User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff Email Address</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="officer@institution.dev"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                    placeholder="Priya"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                    placeholder="Sharma"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Institutional Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="LOAN_OFFICER">Loan Officer (Origination & Verification)</option>
                  <option value="UNDERWRITER">Underwriter (Risk & Sanction)</option>
                  <option value="BRANCH_MANAGER">Branch Manager (Delegated Sanctions)</option>
                  <option value="COMPLIANCE_OFFICER">Compliance Officer (Audits & Policies)</option>
                  <option value="ADMIN">Company Administrator (Full Tenant Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Operating Branch</label>
                <select
                  value={userForm.branchId || ''}
                  onChange={(e) => setUserForm({ ...userForm, branchId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Head Office (All Branches)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  {createUserMutation.isPending ? 'Inviting...' : 'Provision Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
