import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Users,
  Settings,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import type { Tenant, CreateTenantDto, TenantTier } from './types';
import {
  useTenants,
  useTenantOperationsOverview,
  useCreateTenant,
  useSuspendTenant,
  useReactivateTenant,
} from './hooks/useTenants';

export const TenantList: React.FC = () => {
  const { data: tenants = [], isLoading: isTenantsLoading } = useTenants();
  const { data: overview, isLoading: isOverviewLoading } = useTenantOperationsOverview();

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // New Tenant Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTenantDto>({
    code: '',
    name: '',
    tier: 'GROWTH',
    contactEmail: '',
    supportPhone: '',
    cinNumber: '',
    rbiRegistrationNo: '',
    domain: '',
    seedDefaults: true,
  });

  const createTenantMutation = useCreateTenant();
  const suspendTenantMutation = useSuspendTenant();
  const reactivateTenantMutation = useReactivateTenant();

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.domain && t.domain.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTier = tierFilter === 'ALL' || t.tier === tierFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTenantMutation.mutate(createForm, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setCreateForm({
          code: '',
          name: '',
          tier: 'GROWTH',
          contactEmail: '',
          supportPhone: '',
          cinNumber: '',
          rbiRegistrationNo: '',
          domain: '',
          seedDefaults: true,
        });
      },
    });
  };

  const handleToggleStatus = (tenant: Tenant) => {
    if (tenant.status === 'ACTIVE') {
      const reason = window.prompt(`Enter suspension reason for ${tenant.name}:`, 'Regulatory compliance review');
      if (reason) {
        suspendTenantMutation.mutate({ id: tenant.id, reason });
      }
    } else if (tenant.status === 'SUSPENDED') {
      if (window.confirm(`Reactivate lending operations for ${tenant.name}?`)) {
        reactivateTenantMutation.mutate(tenant.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Building2 className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Multi-Tenant Institutions
              </h1>
              <p className="text-sm text-slate-400">
                Manage independent lender tenants, configure products, policies, and assess institutional readiness
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Institution</span>
        </button>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Institutions</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {overview?.totalTenants ?? tenants.length}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-blue-400 font-semibold">100% Isolated</span>
            <span>PostgreSQL Scoped</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Lenders</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {overview?.activeTenantsCount ?? tenants.filter((t) => t.status === 'ACTIVE').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Live origination and servicing</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Enterprise Tiers</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 mt-2">
            {overview?.enterpriseTierCount ?? tenants.filter((t) => t.tier === 'ENTERPRISE').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Dedicated compute & policies</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Suspended Institutions</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">
            {overview?.suspendedTenantsCount ?? tenants.filter((t) => t.status === 'SUSPENDED').length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Origination halted safely</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search institutions by name, code, domain..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Tiers</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="GROWTH">Growth</option>
              <option value="STANDARD">Standard</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PROVISIONING">Provisioning</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Institution</th>
                <th className="py-3.5 px-4">Code</th>
                <th className="py-3.5 px-4">Tier</th>
                <th className="py-3.5 px-4">Domain</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No institutions found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                          {t.code.slice(0, 2)}
                        </div>
                        <div>
                          <Link
                            href={`/tenants/${t.id}`}
                            className="font-bold text-white hover:text-blue-400 transition-colors text-sm"
                          >
                            {t.name}
                          </Link>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {t.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-blue-400">{t.code}</td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-semibold text-[11px] border ${
                          t.tier === 'ENTERPRISE'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : t.tier === 'GROWTH'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {t.tier}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-slate-300 font-mono text-[11px]">
                      {t.domain || 'institution.adyapan.dev'}
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-white">{t.contactEmail}</div>
                      {t.supportPhone && <div className="text-[11px] text-slate-400">{t.supportPhone}</div>}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                          t.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : t.status === 'SUSPENDED'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/tenants/${t.id}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 font-semibold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Studio</span>
                        </Link>

                        {t.id !== 'tenant-adyapan-default' && (
                          <button
                            onClick={() => handleToggleStatus(t)}
                            className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all border ${
                              t.status === 'ACTIVE'
                                ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-white border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white border-emerald-500/20'
                            }`}
                          >
                            {t.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ONBOARD NEW INSTITUTION */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Onboard New Enterprise Institution</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Institution Code</label>
                  <input
                    type="text"
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                    placeholder="FINTECH_FINANCE"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-blue-500 focus:outline-none uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tier</label>
                  <select
                    value={createForm.tier}
                    onChange={(e) => setCreateForm({ ...createForm, tier: e.target.value as TenantTier })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ENTERPRISE">Enterprise</option>
                    <option value="GROWTH">Growth</option>
                    <option value="STANDARD">Standard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Legal Entity Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="Fintech Credit Solutions Ltd."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={createForm.contactEmail}
                    onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                    placeholder="admin@fintechcredit.dev"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Support Phone</label>
                  <input
                    type="tel"
                    value={createForm.supportPhone || ''}
                    onChange={(e) => setCreateForm({ ...createForm, supportPhone: e.target.value })}
                    placeholder="+91 1800 500 1000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CIN (Optional)</label>
                  <input
                    type="text"
                    value={createForm.cinNumber || ''}
                    onChange={(e) => setCreateForm({ ...createForm, cinNumber: e.target.value })}
                    placeholder="U65999MH2024PTC123456"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">RBI Registration No.</label>
                  <input
                    type="text"
                    value={createForm.rbiRegistrationNo || ''}
                    onChange={(e) => setCreateForm({ ...createForm, rbiRegistrationNo: e.target.value })}
                    placeholder="N-13.00999"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Initialize Canonical Engines</div>
                  <div className="text-[11px] text-slate-400">Seed default products, workflows, decision rules, and branch</div>
                </div>
                <input
                  type="checkbox"
                  checked={createForm.seedDefaults}
                  onChange={(e) => setCreateForm({ ...createForm, seedDefaults: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTenantMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30"
                >
                  {createTenantMutation.isPending ? 'Provisioning...' : 'Provision Institution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
