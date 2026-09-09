'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sliders,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Zap,
  Info,
  Building2,
  Users,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, KpiCard, Button, Badge, Spinner, Input } from '@/components/ui';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

interface CustomRole {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  isSystemRole: boolean;
  parentRoleCode?: string;
  permissions: string[];
  scope: 'GLOBAL' | 'TENANT' | 'REGION' | 'BRANCH';
  sanctionLimitAmount?: number;
  payoutLimitAmount?: number;
  createdAt: string;
  updatedAt: string;
}

interface PermissionDefinition {
  code: string;
  category: string;
  name: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface SodRule {
  id: string;
  code: string;
  name: string;
  description: string;
  conflictingPermissions: [string, string];
  severity: 'CRITICAL_BLOCK' | 'WARNING';
}

export default function RolesStudioPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'ROLES_MATRIX' | 'PERMISSION_CATALOG' | 'SOD_RULES' | 'MY_PERMISSIONS'>('ROLES_MATRIX');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Custom Role Modal State
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    description: string;
    parentRoleCode: string;
    permissions: string[];
    scope: 'GLOBAL' | 'TENANT' | 'REGION' | 'BRANCH';
    sanctionLimitAmount: number;
    payoutLimitAmount: number;
    allowSodOverride: boolean;
    overrideJustification: string;
  }>({
    code: '',
    name: '',
    description: '',
    parentRoleCode: '',
    permissions: [],
    scope: 'BRANCH',
    sanctionLimitAmount: 5000000,
    payoutLimitAmount: 0,
    allowSodOverride: false,
    overrideJustification: '',
  });

  // 1. Fetch Roles
  const { data: roles = [], isLoading: rolesLoading, refetch: refetchRoles, isFetching } = useQuery<CustomRole[]>({
    queryKey: ['roles-list'],
    queryFn: async () => (await api.get('/roles')).data.data,
  });

  // 2. Fetch Permission Catalog
  const { data: catalog = [] } = useQuery<PermissionDefinition[]>({
    queryKey: ['permissions-catalog'],
    queryFn: async () => (await api.get('/roles/permissions-matrix')).data.data,
  });

  // 3. Fetch SoD Rules
  const { data: sodRules = [] } = useQuery<SodRule[]>({
    queryKey: ['sod-rules'],
    queryFn: async () => (await api.get('/roles/sod-rules')).data.data,
  });

  // 4. Fetch Effective Permissions for Current Session User
  const { data: myPermsData } = useQuery<{ roles: string[]; effectivePermissions: string[]; total: number }>({
    queryKey: ['my-effective-permissions'],
    queryFn: async () => (await api.get('/roles/effective-permissions')).data.data,
  });

  // Create Custom Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/roles', {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        parentRoleCode: formData.parentRoleCode || undefined,
        permissions: formData.permissions,
        scope: formData.scope,
        sanctionLimitAmount: formData.sanctionLimitAmount > 0 ? formData.sanctionLimitAmount : undefined,
        payoutLimitAmount: formData.payoutLimitAmount > 0 ? formData.payoutLimitAmount : undefined,
        allowSodOverride: formData.allowSodOverride,
        overrideJustification: formData.overrideJustification,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setRoleModalOpen(false);
      setFormData({
        code: '',
        name: '',
        description: '',
        parentRoleCode: '',
        permissions: [],
        scope: 'BRANCH',
        sanctionLimitAmount: 5000000,
        payoutLimitAmount: 0,
        allowSodOverride: false,
        overrideJustification: '',
      });
      queryClient.invalidateQueries({ queryKey: ['roles-list'] });
      toast.success('Custom Role Created', `Role '${data.name}' (${data.code}) created successfully with ${data.permissions.length} permissions.`);
    },
    onError: (err: any) => {
      toast.error('Role Creation Failed', apiErrorMessage(err));
    },
  });

  // Compute live SoD conflicts for form
  const getFormSodConflicts = () => {
    const permSet = new Set(formData.permissions);
    const conflicts: SodRule[] = [];
    for (const rule of sodRules) {
      const [p1, p2] = rule.conflictingPermissions;
      if (permSet.has(p1) && permSet.has(p2)) {
        conflicts.push(rule);
      }
    }
    return conflicts;
  };

  const activeConflicts = getFormSodConflicts();

  // Parent role selection helper
  const handleParentSelect = (parentCode: string) => {
    if (!parentCode) {
      setFormData((prev) => ({ ...prev, parentRoleCode: '' }));
      return;
    }
    const parent = roles.find((r) => r.code === parentCode);
    if (parent) {
      const merged = Array.from(new Set([...parent.permissions, ...formData.permissions]));
      setFormData((prev) => ({
        ...prev,
        parentRoleCode: parentCode,
        permissions: merged,
        sanctionLimitAmount: parent.sanctionLimitAmount || prev.sanctionLimitAmount,
      }));
    }
  };

  const togglePermission = (code: string) => {
    setFormData((prev) => {
      const exists = prev.permissions.includes(code);
      return {
        ...prev,
        permissions: exists ? prev.permissions.filter((p) => p !== code) : [...prev.permissions, code],
      };
    });
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const categories = ['ALL', ...Array.from(new Set(catalog.map((p) => p.category)))];

  const filteredCatalog = catalog.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Enterprise / Governance"
        title="Role & Permission Studio"
        subtitle="Dynamic granular permission matrix, custom role hierarchy builder, Segregation of Duties (SoD) conflict guards, and sign-off authority limits"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setRoleModalOpen(true)}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Build Custom Role
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchRoles()}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Top Level Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active System & Custom Roles"
          value={`${roles.length} Roles`}
          hint="Role Hierarchy"
          icon={KeyRound}
        />
        <KpiCard
          title="Granular Permissions"
          value={`${catalog.length} Permissions`}
          hint="Across 7 Lending Domains"
          icon={Sliders}
          trend="Dynamic Matrix"
          trendPositive={true}
        />
        <KpiCard
          title="Segregation of Duties (SoD)"
          value={`${sodRules.length} Active Rules`}
          hint="Banking Separation Enforced"
          icon={ShieldAlert}
        />
        <KpiCard
          title="My Effective Permissions"
          value={`${myPermsData?.total || 0} Granted`}
          hint={`Roles: ${user?.roles?.join(', ')}`}
          icon={ShieldCheck}
        />
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1E2445] text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('ROLES_MATRIX')}
          className={cn(
            'px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer',
            activeTab === 'ROLES_MATRIX'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Layers className="h-4 w-4" />
          Roles & Sign-off Hierarchy ({roles.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PERMISSION_CATALOG')}
          className={cn(
            'px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer',
            activeTab === 'PERMISSION_CATALOG'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <Sliders className="h-4 w-4" />
          Granular Permission Matrix ({catalog.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('SOD_RULES')}
          className={cn(
            'px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer',
            activeTab === 'SOD_RULES'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <ShieldAlert className="h-4 w-4" />
          SoD Compliance Rules ({sodRules.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MY_PERMISSIONS')}
          className={cn(
            'px-4 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer',
            activeTab === 'MY_PERMISSIONS'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          My Effective Authority
        </button>
      </div>

      {/* TAB 1: ROLES DIRECTORY & SIGN-OFF HIERARCHY */}
      {activeTab === 'ROLES_MATRIX' && (
        <Card className="p-4 space-y-3 border">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-blue-600" />
                Institutional Role Registry & Sign-off Limits
              </h3>
              <p className="text-xs text-slate-400">
                System default templates and custom created roles with granular scope boundaries
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">{roles.length} Configured Roles</span>
          </div>

          {rolesLoading ? (
            <div className="p-8 text-center"><Spinner /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-white dark:bg-slate-900/40 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{r.code}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={r.isSystemRole ? 'default' : 'warning'} className="text-[10px]">
                        {r.isSystemRole ? 'SYSTEM' : 'CUSTOM'}
                      </Badge>
                      <Badge variant="info" className="text-[10px] font-mono">{r.scope}</Badge>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{r.name}</h4>
                    <p className="text-slate-400 text-[11px] line-clamp-2">{r.description}</p>
                  </div>

                  {r.parentRoleCode && (
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                      ↳ Inherits from: <strong>{r.parentRoleCode}</strong>
                    </div>
                  )}

                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-[10px] space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Granted Permissions:</span>
                      <strong className="text-slate-900 dark:text-white">{r.permissions.length} perms</strong>
                    </div>
                    {r.sanctionLimitAmount !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sanction Authority:</span>
                        <strong className="text-emerald-600">{formatMoney(r.sanctionLimitAmount)}</strong>
                      </div>
                    )}
                    {r.payoutLimitAmount !== undefined && r.payoutLimitAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payout Execution Limit:</span>
                        <strong className="text-blue-600">{formatMoney(r.payoutLimitAmount)}</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: GRANULAR PERMISSION MATRIX */}
      {activeTab === 'PERMISSION_CATALOG' && (
        <Card className="p-4 space-y-4 border">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search permissions by code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border bg-white dark:bg-slate-900 text-xs"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <span className="text-xs font-mono font-bold text-slate-500">
              Showing {filteredCatalog.length} of {catalog.length} Permissions
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {filteredCatalog.map((p) => (
              <div
                key={p.code}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-white dark:bg-slate-900/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-[11px]">{p.code}</span>
                  <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border', getRiskBadge(p.riskLevel))}>
                    {p.riskLevel} RISK
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">{p.name}</h4>
                <p className="text-slate-400 text-[11px]">{p.description}</p>
                <Badge variant="default" className="text-[9px] font-mono">{p.category}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 3: SOD COMPLIANCE RULES */}
      {activeTab === 'SOD_RULES' && (
        <Card className="p-4 space-y-3 border">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                Banking Segregation of Duties (SoD) Rules
              </h3>
              <p className="text-xs text-slate-400">
                Statutory risk controls preventing conflicting privilege assignments in institutional roles
              </p>
            </div>
            <Badge variant="danger" className="text-[10px]">STRICT BLOCKING</Badge>
          </div>

          <div className="space-y-3">
            {sodRules.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    <strong className="font-bold text-slate-900 dark:text-white">{rule.name}</strong>
                  </div>
                  <Badge variant="danger" className="text-[10px] font-mono">{rule.code}</Badge>
                </div>

                <p className="text-slate-600 dark:text-slate-300 text-[11px]">{rule.description}</p>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-[11px] font-mono">
                  <span className="text-rose-600 font-bold">{rule.conflictingPermissions[0]}</span>
                  <span className="text-slate-400 font-bold">⇹ CONFLICTS WITH ⇹</span>
                  <span className="text-rose-600 font-bold">{rule.conflictingPermissions[1]}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: MY EFFECTIVE PERMISSIONS */}
      {activeTab === 'MY_PERMISSIONS' && (
        <Card className="p-4 space-y-3 border">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Session Authority & Effective Privileges
              </h3>
              <p className="text-xs text-slate-400">
                User: <strong className="text-slate-700 dark:text-slate-200">{user?.email}</strong> | Roles: {user?.roles?.join(', ')}
              </p>
            </div>
            <Badge variant="success" className="text-[10px]">{myPermsData?.total || 0} Permissions Active</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {myPermsData?.effectivePermissions.map((perm) => (
              <div
                key={perm}
                className="p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 font-mono text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{perm}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CUSTOM ROLE BUILDER MODAL */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-blue-600" />
                  Custom Role Builder & Granular Matrix
                </h3>
                <p className="text-xs text-slate-400">Define custom institutional role with inheritance and SoD checks</p>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Role Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SENIOR_RISK_ANALYST"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Role Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Risk Analyst"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Role Description</label>
                <input
                  type="text"
                  placeholder="Describes duties and authorization scope"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Inherit from Template</label>
                  <select
                    value={formData.parentRoleCode}
                    onChange={(e) => handleParentSelect(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="">(None - Custom Fresh)</option>
                    {roles.filter((r) => r.isSystemRole).map((r) => (
                      <option key={r.code} value={r.code}>{r.name} ({r.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Resource Scope</label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData({ ...formData, scope: e.target.value as any })}
                    className="w-full px-2.5 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs font-mono"
                  >
                    <option value="BRANCH">BRANCH (Assigned branch only)</option>
                    <option value="REGION">REGION (Regional cluster)</option>
                    <option value="TENANT">TENANT (Institution-wide)</option>
                    <option value="GLOBAL">GLOBAL (Platform-wide)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">Sanction Authority (₹)</label>
                  <input
                    type="number"
                    value={formData.sanctionLimitAmount}
                    onChange={(e) => setFormData({ ...formData, sanctionLimitAmount: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs font-mono"
                  />
                </div>
              </div>

              {/* LIVE SOD CONFLICT WARNING */}
              {activeConflicts.length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-300 dark:border-rose-900 space-y-1.5 text-xs text-rose-900 dark:text-rose-200">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400">
                    <ShieldAlert className="h-4 w-4" />
                    Segregation of Duties (SoD) Conflict Detected ({activeConflicts.length})
                  </div>
                  {activeConflicts.map((c) => (
                    <div key={c.code} className="text-[11px] font-mono">
                      • <strong>{c.name}</strong>: {c.conflictingPermissions[0]} ⇹ {c.conflictingPermissions[1]}
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="sodOverride"
                      checked={formData.allowSodOverride}
                      onChange={(e) => setFormData({ ...formData, allowSodOverride: e.target.checked })}
                    />
                    <label htmlFor="sodOverride" className="text-[11px] cursor-pointer">
                      Super Admin Dual Authorization Override (Audited)
                    </label>
                  </div>
                </div>
              )}

              {/* GRANULAR PERMISSIONS SELECTOR */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1E2445]">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-800 dark:text-slate-200">
                    Assign Permissions ({formData.permissions.length} Selected)
                  </label>
                  <span className="text-[10px] text-slate-400">Click to toggle permissions</span>
                </div>

                <div className="max-h-48 overflow-y-auto p-2 border rounded-xl bg-slate-50 dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  {catalog.map((p) => {
                    const isSelected = formData.permissions.includes(p.code);
                    return (
                      <button
                        type="button"
                        key={p.code}
                        onClick={() => togglePermission(p.code)}
                        className={cn(
                          'p-2 rounded-lg text-left border flex items-center justify-between transition-colors cursor-pointer',
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-300 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        )}
                      >
                        <div className="truncate mr-2">
                          <div className="font-mono text-[10px] truncate">{p.code}</div>
                          <div className="text-[11px] truncate">{p.name}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={createRoleMutation.isPending || (activeConflicts.length > 0 && !formData.allowSodOverride)}
                onClick={() => createRoleMutation.mutate()}
                className="text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {createRoleMutation.isPending ? 'Creating...' : 'Save Custom Role'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
