'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers,
  ShieldCheck,
  Building2,
  Plus,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  Globe,
  RefreshCw,
  FileCheck,
  Award,
  Sparkles,
  Sliders,
  Play,
  ArrowRight,
  ArrowLeft,
  Server,
  UserCheck,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, KpiCard, Button, Badge, Spinner, Input } from '@/components/ui';
import { formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';

interface TenantOperationsOverview {
  totalTenants: number;
  activeTenantsCount: number;
  suspendedTenantsCount: number;
  enterpriseTierCount: number;
  tenants: Array<{
    id: string;
    code: string;
    name: string;
    tier: 'ENTERPRISE' | 'GROWTH' | 'STANDARD';
    status: 'ACTIVE' | 'SUSPENDED' | 'CONFIGURING';
    domain?: string;
    activeLoanAccounts: number;
    activeCustomersCount: number;
    integrationHealth: string;
    createdAt: string;
  }>;
}

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();

  // Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);

  // Certificate Modal State
  const [certificateModal, setCertificateModal] = useState<any | null>(null);

  // Wizard Form State
  const [formData, setFormData] = useState({
    // Step 1: Org
    code: 'ZENITH_CAPITAL',
    name: 'Zenith Capital Finance',
    cinNumber: 'U65922KA2024PTC123456',
    rbiRegistrationNo: 'RBI/NBFC/ND-NSI/2024/771',
    tier: 'ENTERPRISE' as 'ENTERPRISE' | 'GROWTH' | 'STANDARD',
    domain: 'zenithcap.dev',
    contactEmail: 'admin@zenithcap.dev',
    supportPhone: '+91 1800 500 8899',

    // Step 2: Admin
    adminEmail: 'institution.admin@zenithcap.dev',
    adminFirstName: 'Aditya',
    adminLastName: 'Varma',
    adminPhone: '+91 98200 99881',

    // Step 3: Policy & Products
    policyTemplate: 'DIGITAL_FINTECH_LENDER' as 'STANDARD_NBFC' | 'DIGITAL_FINTECH_LENDER' | 'ENTERPRISE_MICROFINANCE',
    loanProductTemplates: ['PERSONAL_LOAN', 'SME_BUSINESS_LOAN', 'BNPL_LINE'],

    // Step 4: Branch
    branchCode: 'B-BLR-01',
    branchName: 'Bengaluru Tech Park Headquarters',
    city: 'Bengaluru',
    state: 'Karnataka',

    // Step 5: Integrations
    creditBureau: 'CIBIL',
    paymentGateway: 'RAZORPAY',
    disbursementPayout: 'CASHFREE',
    kycProvider: 'DIGILOCKER',

    // Step 6: Branding
    brandName: 'Zenith Capital',
    primaryColorHex: '#0284C7',
    portalDomain: 'borrower.zenithcap.dev',
  });

  // 1. Fetch Tenant Operations Overview (Step 33)
  const { data: operations, isLoading, refetch, isFetching } = useQuery<TenantOperationsOverview>({
    queryKey: ['tenant-operations-overview'],
    queryFn: async () => (await api.get('/tenants/operations-overview')).data.data,
  });

  // 2. Fetch Current Tenant Context
  const { data: currentTenant } = useQuery({
    queryKey: ['tenant-current'],
    queryFn: async () => (await api.get('/tenants/current')).data.data,
  });

  // Multi-Step Onboard Mutation
  const onboardWizardMutation = useMutation({
    mutationFn: async () => {
      const dto = {
        organization: {
          code: formData.code,
          name: formData.name,
          cinNumber: formData.cinNumber,
          rbiRegistrationNo: formData.rbiRegistrationNo,
          tier: formData.tier,
          domain: formData.domain,
          contactEmail: formData.contactEmail,
          supportPhone: formData.supportPhone,
        },
        adminUser: {
          email: formData.adminEmail,
          firstName: formData.adminFirstName,
          lastName: formData.adminLastName,
          phone: formData.adminPhone,
        },
        policyTemplate: formData.policyTemplate,
        loanProductTemplates: formData.loanProductTemplates,
        defaultBranch: {
          code: formData.branchCode,
          name: formData.branchName,
          city: formData.city,
          state: formData.state,
        },
        integrations: {
          creditBureau: formData.creditBureau,
          paymentGateway: formData.paymentGateway,
          disbursementPayout: formData.disbursementPayout,
          kycProvider: formData.kycProvider,
        },
        branding: {
          brandName: formData.brandName,
          primaryColorHex: formData.primaryColorHex,
          portalDomain: formData.portalDomain,
        },
      };

      const res = await api.post('/tenants/onboard-wizard', dto);
      return res.data?.data;
    },
    onSuccess: (data) => {
      setWizardOpen(false);
      setWizardStep(1);
      queryClient.invalidateQueries({ queryKey: ['tenant-operations-overview'] });
      toast.success('Tenant Provisioned', `Institution '${data.name}' (${data.tenantCode}) successfully provisioned and activated!`);
    },
    onError: (err: any) => {
      toast.error('Provisioning Failed', apiErrorMessage(err));
    },
  });

  // Suspend Tenant Mutation
  const suspendMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/tenants/${id}/suspend`, { reason });
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-operations-overview'] });
      toast.info('Tenant Suspended', `Tenant '${data.name}' suspended.`);
    },
    onError: (err: any) => {
      toast.error('Suspension Failed', apiErrorMessage(err));
    },
  });

  // Reactivate Tenant Mutation
  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/tenants/${id}/reactivate`);
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-operations-overview'] });
      toast.success('Tenant Reactivated', `Tenant '${data.name}' reactivated.`);
    },
    onError: (err: any) => {
      toast.error('Reactivation Failed', apiErrorMessage(err));
    },
  });

  // Setup Certificate Fetch Mutation
  const fetchCertificate = async (tenantId: string) => {
    try {
      const res = await api.get(`/tenants/${tenantId}/setup-certificate`);
      setCertificateModal(res.data?.data);
    } catch (err: any) {
      toast.error('Certificate Fetch Failed', apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Enterprise / Governance"
        title="Enterprise Tenant Operations & Institutional Onboarding"
        subtitle="Automated multi-tenant institutional provisioning, isolated partition boundaries, default policy bootstrap, and compliance certification"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setWizardStep(1);
                setWizardOpen(true);
              }}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Provision New Institution
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Top Level Operations KPIs */}
      {operations && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Lending Institutions"
            value={`${operations.totalTenants} Tenants`}
            hint="Multi-Tenant Partition"
            icon={Building2}
          />
          <KpiCard
            title="Active Operational Tenants"
            value={`${operations.activeTenantsCount} Active`}
            hint="Fully Provisioned"
            icon={CheckCircle2}
            trend="Live Portfolios"
            trendPositive={true}
          />
          <KpiCard
            title="Enterprise Tier Tenants"
            value={`${operations.enterpriseTierCount} Enterprise`}
            hint="Dedicated Integration SLAs"
            icon={Award}
          />
          <KpiCard
            title="Suspended / Inactive"
            value={`${operations.suspendedTenantsCount} Suspended`}
            hint="Governance Locked"
            icon={ShieldCheck}
          />
        </div>
      )}

      {/* Operations Directory */}
      <Card className="p-4 space-y-3 border">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              Institutional Tenant Directory
            </h3>
            <p className="text-xs text-slate-400">
              Active lenders, isolated portfolio health, and statutory compliance status
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            {operations?.tenants.length || 0} Managed Institutions
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {operations?.tenants.map((t) => (
              <div
                key={t.id}
                className={cn(
                  'p-4 rounded-xl border space-y-3 text-xs',
                  t.status === 'ACTIVE'
                    ? 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-[#1E2445]'
                    : 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40 opacity-70'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {t.code}
                    </span>
                    <Badge variant={t.tier === 'ENTERPRISE' ? 'warning' : 'default'} className="text-[10px]">
                      {t.tier}
                    </Badge>
                  </div>

                  <Badge variant={t.status === 'ACTIVE' ? 'success' : 'danger'} className="text-[10px]">
                    {t.status}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{t.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono">{t.domain || 'Internal Cloud Network'}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-[10px] font-mono">
                  <div>
                    <span className="text-slate-400 block">Active Loans:</span>
                    <strong className="text-slate-900 dark:text-slate-100">{t.activeLoanAccounts}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Customers:</span>
                    <strong className="text-slate-900 dark:text-slate-100">{t.activeCustomersCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Integrations:</span>
                    <strong className="text-emerald-600">{t.integrationHealth}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fetchCertificate(t.id)}
                    className="text-[10px] h-6 px-2 flex items-center gap-1 cursor-pointer"
                  >
                    <FileCheck className="h-3 w-3" />
                    Certificate
                  </Button>

                  {t.id !== 'tenant-adyapan-default' && (
                    <div>
                      {t.status === 'ACTIVE' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={suspendMutation.isPending}
                          onClick={() => suspendMutation.mutate({ id: t.id, reason: 'Admin governance suspension' })}
                          className="text-[10px] h-6 px-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={reactivateMutation.isPending}
                          onClick={() => reactivateMutation.mutate(t.id)}
                          className="text-[10px] h-6 px-2 cursor-pointer"
                        >
                          Reactivate
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* MULTI-STEP GUIDED ONBOARDING WIZARD MODAL */}
      {wizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Institutional Onboarding Wizard — Step {wizardStep} of 6
                </h3>
                <p className="text-xs text-slate-400">
                  {wizardStep === 1 && '1. Organization Legal Profile & Statutory Details'}
                  {wizardStep === 2 && '2. Institutional Administrator Account'}
                  {wizardStep === 3 && '3. Policy Profile & Product Template Selection'}
                  {wizardStep === 4 && '4. Primary Headquarters Branch & Division'}
                  {wizardStep === 5 && '5. Multi-Tenant Integration Gateway Setup'}
                  {wizardStep === 6 && '6. White-Label Branding & Verification'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setWizardOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* STEP 1: ORGANIZATION PROFILE */}
            {wizardStep === 1 && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Institution Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Institution Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Corporate Identification Number (CIN)</label>
                    <input
                      type="text"
                      value={formData.cinNumber}
                      onChange={(e) => setFormData({ ...formData, cinNumber: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">RBI NBFC Registration Number</label>
                    <input
                      type="text"
                      value={formData.rbiRegistrationNo}
                      onChange={(e) => setFormData({ ...formData, rbiRegistrationNo: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Official Contact Email</label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Institutional Tier</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="ENTERPRISE">ENTERPRISE (Dedicated Custom SLAs)</option>
                      <option value="GROWTH">GROWTH (Standard NBFC)</option>
                      <option value="STANDARD">STANDARD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: ADMIN USER */}
            {wizardStep === 2 && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Admin First Name</label>
                    <input
                      type="text"
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Admin Last Name</label>
                    <input
                      type="text"
                      value={formData.adminLastName}
                      onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Admin Email Address</label>
                    <input
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Admin Phone Number</label>
                    <input
                      type="text"
                      value={formData.adminPhone}
                      onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: POLICY & PRODUCTS */}
            {wizardStep === 3 && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">Institutional Policy Template</label>
                  <select
                    value={formData.policyTemplate}
                    onChange={(e) => setFormData({ ...formData, policyTemplate: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs font-bold"
                  >
                    <option value="DIGITAL_FINTECH_LENDER">DIGITAL_FINTECH_LENDER (FOIR 50%, CIBIL 650+)</option>
                    <option value="STANDARD_NBFC">STANDARD_NBFC (FOIR 55%, CIBIL 700+)</option>
                    <option value="ENTERPRISE_MICROFINANCE">ENTERPRISE_MICROFINANCE (FOIR 65%, CIBIL 600+)</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-[11px] text-blue-900 dark:text-blue-300">
                  <Sliders className="h-3.5 w-3.5 inline mr-1" />
                  The selected template automatically initializes versioned FOIR limits, underwriting signoff rules, and statutory consent templates for this institution.
                </div>
              </div>
            )}

            {/* STEP 4: BRANCH */}
            {wizardStep === 4 && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Branch Code</label>
                    <input
                      type="text"
                      value={formData.branchCode}
                      onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Branch / Division Name</label>
                    <input
                      type="text"
                      value={formData.branchName}
                      onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: INTEGRATION GATEWAYS */}
            {wizardStep === 5 && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Credit Bureau Gateway</label>
                    <select
                      value={formData.creditBureau}
                      onChange={(e) => setFormData({ ...formData, creditBureau: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="CIBIL">TransUnion CIBIL Direct XML API</option>
                      <option value="EXPERIAN">Experian Credit Bureau</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Payment Gateway</label>
                    <select
                      value={formData.paymentGateway}
                      onChange={(e) => setFormData({ ...formData, paymentGateway: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="RAZORPAY">Razorpay Standard Checkout & eNACH</option>
                      <option value="CASHFREE">Cashfree Payment Gateway</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Disbursement Payout Provider</label>
                    <select
                      value={formData.disbursementPayout}
                      onChange={(e) => setFormData({ ...formData, disbursementPayout: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="CASHFREE">Cashfree Bank Payout API (IMPS/NEFT)</option>
                      <option value="RAZORPAY">RazorpayX Corporate Payout Gateway</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">eKYC & Identity Provider</label>
                    <select
                      value={formData.kycProvider}
                      onChange={(e) => setFormData({ ...formData, kycProvider: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                    >
                      <option value="DIGILOCKER">Digilocker Government Gateway API</option>
                      <option value="NSDL">NSDL Offline XML Engine</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: BRANDING & FINAL PROVISION */}
            {wizardStep === 6 && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">Primary Brand Color (Hex)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formData.primaryColorHex}
                        onChange={(e) => setFormData({ ...formData, primaryColorHex: e.target.value })}
                        className="h-8 w-10 rounded cursor-pointer border"
                      />
                      <input
                        type="text"
                        value={formData.primaryColorHex}
                        onChange={(e) => setFormData({ ...formData, primaryColorHex: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-[11px] space-y-1">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    AUTOMATED INSTITUTIONAL BOOTSTRAP READY
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-300/90">
                    Clicking &quot;Activate Institution&quot; will provision the tenant partition, create administrative roles, seed default policies, configure integration routes, setup branding, and record a cryptographic SHA-256 evidence node.
                  </p>
                </div>
              </div>
            )}

            {/* WIZARD ACTIONS */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#1E2445]">
              {wizardStep > 1 ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </Button>
              ) : <div />}

              {wizardStep < 6 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setWizardStep(wizardStep + 1)}
                  className="text-xs flex items-center gap-1 cursor-pointer"
                >
                  Next
                  <ArrowRight className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={onboardWizardMutation.isPending}
                  onClick={() => onboardWizardMutation.mutate()}
                  className="text-xs flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {onboardWizardMutation.isPending ? 'Provisioning...' : 'Activate Institution'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SETUP CERTIFICATE MODAL */}
      {certificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-600" />
                  Institutional Compliance & Setup Certificate
                </h3>
                <p className="text-xs text-slate-400">ID: {certificateModal.certificateId}</p>
              </div>
              <button
                type="button"
                onClick={() => setCertificateModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Institution:</span>
                <strong className="text-slate-900 dark:text-white">{certificateModal.institutionName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tenant Code:</span>
                <strong className="font-mono text-blue-600 dark:text-blue-400">{certificateModal.tenantCode}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Statutory Framework:</span>
                <strong className="text-slate-800 dark:text-slate-200">{certificateModal.governanceFramework}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Data Isolation:</span>
                <span className="font-mono text-emerald-600 font-bold">{certificateModal.isolationLevel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Certified Status:</span>
                <Badge variant="success" className="text-[10px]">ACTIVE & COMPLIANT</Badge>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setCertificateModal(null)}>
                Close Certificate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
