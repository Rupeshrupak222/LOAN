'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Building,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  UserCheck,
  Sparkles,
  Layers,
  ChevronRight,
  Send,
  Sliders,
  Radio,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Card, KpiCard, Button, Badge, Spinner } from '@/components/ui';

interface ConsentPurpose {
  purposeCode: string;
  tenantId: string;
  title: string;
  description: string;
  category: string;
  isMandatory: boolean;
  activeVersion: string;
  wordingText: string;
  updatedAt: string;
}

interface ConsentRecord {
  id: string;
  tenantId: string;
  customerId: string;
  consentType: string;
  purposeCode: string;
  version: string;
  status: 'GRANTED' | 'WITHDRAWN' | 'EXPIRED' | 'REVOKED' | 'SUPERSEDED';
  grantedAt: string;
  withdrawnAt?: string;
  withdrawnReason?: string;
  channel: string;
  ipAddress?: string;
}

interface PrivacyOverview {
  tenantId: string;
  totalConsentsRecorded: number;
  activeGrantedConsentsCount: number;
  withdrawnConsentsCount: number;
  purposesCount: number;
  marketingOptInRate: number;
  aiAnalysisOptInRate: number;
  recentConsents: ConsentRecord[];
}

interface CustomerPrivacyPreference {
  customerId: string;
  tenantId: string;
  allowMarketing: boolean;
  allowAiAnalysis: boolean;
  allowThirdPartySharing: boolean;
  preferredChannel: 'EMAIL' | 'SMS' | 'WHATSAPP';
}

export default function PrivacyConsentPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Tab State
  const [activeTab, setActiveTab] = useState<'PURPOSES' | 'CONSENTS' | 'PREFERENCES' | 'AI_MINIMIZATION'>('PURPOSES');

  // Customer Self-Service or Search Context
  const isBorrower = Boolean(user?.roles.includes('CUSTOMER'));
  const targetCustomerId = isBorrower && user?.id ? user.id : 'cust-demo-001';

  // Enforcement Test State
  const [testCustomerId, setTestCustomerId] = useState(targetCustomerId);
  const [testRequiredType, setTestRequiredType] = useState('AI_ASSISTED_ANALYSIS');
  const [enforceResult, setEnforceResult] = useState<any>(null);

  // AI Minimization Simulator State
  const [rawName, setRawName] = useState('Vikram Malhotra');
  const [rawPan, setRawPan] = useState('ABCDE1234F');
  const [rawAadhaar, setRawAadhaar] = useState('987654321098');
  const [rawBank, setRawBank] = useState('50100234567890');
  const [rawPhone, setRawPhone] = useState('+91 98200 12345');
  const [rawIncome, setRawIncome] = useState(120000);
  const [sanitizedOutput, setSanitizedOutput] = useState<any>(null);

  // 1. Fetch Current Tenant
  const { data: currentTenant } = useQuery({
    queryKey: ['tenant-current'],
    queryFn: async () => (await api.get('/tenants/current')).data.data,
  });

  // 2. Fetch Privacy Overview
  const {
    data: overview,
    isLoading: overviewLoading,
    refetch: refetchOverview,
    isFetching,
  } = useQuery<PrivacyOverview>({
    queryKey: ['privacy-overview', currentTenant?.id],
    queryFn: async () => (await api.get('/privacy/overview')).data.data,
    enabled: !isBorrower,
  });

  // 3. Fetch Purpose Catalog
  const { data: purposes = [], isLoading: purposesLoading } = useQuery<ConsentPurpose[]>({
    queryKey: ['privacy-purposes', currentTenant?.id],
    queryFn: async () => (await api.get('/privacy/purposes')).data.data || [],
  });

  // 4. Fetch Consents
  const { data: consents = [], isLoading: consentsLoading, refetch: refetchConsents } = useQuery<ConsentRecord[]>({
    queryKey: ['privacy-consents', currentTenant?.id, targetCustomerId],
    queryFn: async () => {
      const url = isBorrower ? '/privacy/consents' : `/privacy/consents?customerId=${targetCustomerId}`;
      return (await api.get(url)).data.data || [];
    },
  });

  // 5. Fetch Privacy Preferences
  const { data: preferences, isLoading: prefsLoading, refetch: refetchPrefs } = useQuery<CustomerPrivacyPreference>({
    queryKey: ['privacy-preferences', currentTenant?.id, targetCustomerId],
    queryFn: async () => (await api.get(`/privacy/preferences?customerId=${targetCustomerId}`)).data.data,
  });

  // Grant Consent Mutation
  const grantMutation = useMutation({
    mutationFn: async (purposeCode: string) => {
      const res = await api.post('/privacy/consents/grant', {
        customerId: targetCustomerId,
        purposeCode,
        channel: 'WEB_PORTAL',
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-consents'] });
      queryClient.invalidateQueries({ queryKey: ['privacy-overview'] });
    },
    onError: (err: any) => {
      alert(`Grant failed: ${apiErrorMessage(err)}`);
    },
  });

  // Withdraw Consent Mutation
  const withdrawMutation = useMutation({
    mutationFn: async (consentId: string) => {
      const res = await api.post(`/privacy/consents/${consentId}/withdraw`, {
        reason: 'Customer initiated consent withdrawal',
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-consents'] });
      queryClient.invalidateQueries({ queryKey: ['privacy-overview'] });
    },
    onError: (err: any) => {
      alert(`Withdrawal failed: ${apiErrorMessage(err)}`);
    },
  });

  // Update Preferences Mutation
  const updatePrefsMutation = useMutation({
    mutationFn: async (updates: Partial<CustomerPrivacyPreference>) => {
      const res = await api.put('/privacy/preferences', {
        customerId: targetCustomerId,
        ...updates,
      });
      return res.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-preferences'] });
    },
    onError: (err: any) => {
      alert(`Update failed: ${apiErrorMessage(err)}`);
    },
  });

  // Enforce Check Mutation
  const enforceMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/privacy/enforce', {
        customerId: testCustomerId,
        requiredType: testRequiredType,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setEnforceResult(data);
    },
    onError: (err: any) => {
      alert(`Enforce check failed: ${apiErrorMessage(err)}`);
    },
  });

  // AI Sanitize Mutation
  const aiSanitizeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/privacy/ai-sanitize', {
        id: targetCustomerId,
        name: rawName,
        pan: rawPan,
        aadhaar: rawAadhaar,
        bankAccount: rawBank,
        phone: rawPhone,
        income: Number(rawIncome),
        loanAmount: 500000,
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setSanitizedOutput(data);
    },
    onError: (err: any) => {
      alert(`Sanitize failed: ${apiErrorMessage(err)}`);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Governance / Privacy"
        title="Privacy & Consent Governance Center"
        subtitle="Granular purpose-bound consent lifecycles, DPDP Act compliance, versioned consent templates, and AI prompt minimization"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                refetchOverview();
                refetchConsents();
                refetchPrefs();
              }}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* Scope Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-200 dark:border-[#1E2445]">
        <div className="flex items-center gap-2.5">
          <Lock className="h-5 w-5 text-blue-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Institutional Privacy Scope: <span>{currentTenant?.name || 'Adyapan Prime Lending'}</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Statutory Framework: Digital Personal Data Protection (DPDP) Act & RBI Master Directions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Consent Enforcement Active
          </span>
        </div>
      </div>

      {/* Top Level KPIs (Visible to staff) */}
      {!isBorrower && overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Active Granted Consents"
            value={`${overview.activeGrantedConsentsCount} Active`}
            hint={`Total Records: ${overview.totalConsentsRecorded}`}
            icon={UserCheck}
          />
          <KpiCard
            title="Consent Purposes & Templates"
            value={`${overview.purposesCount} Purposes`}
            hint="Version-Controlled Policies"
            icon={FileText}
          />
          <KpiCard
            title="Marketing Opt-In Rate"
            value={`${overview.marketingOptInRate}%`}
            hint="Customer Explicit Consent"
            icon={Radio}
            trend="Configurable Channel"
            trendPositive={overview.marketingOptInRate > 0}
          />
          <KpiCard
            title="AI Profiling Consent Rate"
            value={`${overview.aiAnalysisOptInRate}%`}
            hint="Decision Copilot Allowed"
            icon={Sparkles}
            trend="Purpose-Bound"
            trendPositive={overview.aiAnalysisOptInRate > 0}
          />
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#1E2445] pb-2">
        <button
          onClick={() => setActiveTab('PURPOSES')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
            activeTab === 'PURPOSES'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          Purpose Catalog ({purposes.length})
        </button>
        <button
          onClick={() => setActiveTab('CONSENTS')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
            activeTab === 'CONSENTS'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          Customer Consents ({consents.length})
        </button>
        <button
          onClick={() => setActiveTab('PREFERENCES')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
            activeTab === 'PREFERENCES'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          Privacy Preferences
        </button>
        <button
          onClick={() => setActiveTab('AI_MINIMIZATION')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1',
            activeTab === 'AI_MINIMIZATION'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          AI Prompt Minimization Simulator
        </button>
      </div>

      {/* TAB 1: PURPOSE CATALOG */}
      {activeTab === 'PURPOSES' && (
        <Card className="p-4 space-y-3 border">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Statutory Consent Purposes & Templates
              </h3>
              <p className="text-xs text-slate-400">
                Granular purpose codes with immutable active versions and clear legal wording
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              {purposes.length} Configured Purposes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {purposes.map((p) => {
              const activeGrant = consents.find((c) => c.purposeCode === p.purposeCode && c.status === 'GRANTED');

              return (
                <div
                  key={p.purposeCode}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1E2445] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {p.purposeCode}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                        {p.activeVersion}
                      </span>
                    </div>

                    <Badge variant={p.isMandatory ? 'danger' : 'default'} className="text-[10px]">
                      {p.isMandatory ? 'MANDATORY' : 'OPTIONAL'}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-white">{p.title}</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px]">{p.description}</p>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-[10px] text-slate-700 dark:text-slate-300 italic border border-slate-100 dark:border-slate-800">
                    &quot;{p.wordingText}&quot;
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400 font-mono">
                      Category: {p.category}
                    </span>

                    {activeGrant ? (
                      <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Consented ({activeGrant.version})
                      </span>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={grantMutation.isPending}
                        onClick={() => grantMutation.mutate(p.purposeCode)}
                        className="text-[10px] h-6 px-2 cursor-pointer"
                      >
                        Grant Consent
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* TAB 2: CUSTOMER CONSENTS REGISTRY & ENFORCEMENT */}
      {activeTab === 'CONSENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-4 space-y-3 border">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  Recorded Consent History
                </h3>
                <p className="text-xs text-slate-400">
                  Customer ID: <strong className="text-slate-700 dark:text-slate-300 font-mono">{targetCustomerId}</strong>
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {consents.length} Total Grants
              </span>
            </div>

            {consentsLoading ? (
              <div className="p-8 text-center">
                <Spinner />
              </div>
            ) : consents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No consent records recorded for this customer yet.
              </div>
            ) : (
              <div className="space-y-2">
                {consents.map((c) => (
                  <div
                    key={c.id}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border text-xs',
                      c.status === 'GRANTED'
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                        : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                    )}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">[{c.purposeCode}]</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                          {c.version}
                        </span>
                        <Badge
                          variant={c.status === 'GRANTED' ? 'success' : 'default'}
                          className="text-[10px]"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Granted: {new Date(c.grantedAt).toLocaleString()} via {c.channel}
                      </p>
                    </div>

                    <div>
                      {c.status === 'GRANTED' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={withdrawMutation.isPending}
                          onClick={() => withdrawMutation.mutate(c.id)}
                          className="text-[10px] h-6 px-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          Withdraw
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Enforcement Engine Tester */}
          <Card className="p-4 space-y-3 border">
            <div className="border-b pb-2 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="h-4 w-4 text-blue-600" />
                Consent Enforcement Tester
              </h3>
              <p className="text-[11px] text-slate-400">
                Check whether an operation is permitted under active consent
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] mb-1">Customer ID</label>
                <input
                  type="text"
                  value={testCustomerId}
                  onChange={(e) => setTestCustomerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border text-xs bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] mb-1">Operation Category</label>
                <select
                  value={testRequiredType}
                  onChange={(e) => setTestRequiredType(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border text-xs bg-white dark:bg-slate-900"
                >
                  <option value="KYC_VERIFICATION">KYC_VERIFICATION</option>
                  <option value="CREDIT_ASSESSMENT">CREDIT_ASSESSMENT</option>
                  <option value="BANK_ACCOUNT_ACCESS">BANK_ACCOUNT_ACCESS</option>
                  <option value="AI_ASSISTED_ANALYSIS">AI_ASSISTED_ANALYSIS</option>
                  <option value="MARKETING_PROMOTIONS">MARKETING_PROMOTIONS</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="sm"
                disabled={enforceMutation.isPending}
                onClick={() => enforceMutation.mutate()}
                className="w-full text-xs mt-2 cursor-pointer"
              >
                {enforceMutation.isPending ? 'Checking...' : 'Evaluate Enforcement'}
              </Button>

              {enforceResult && (
                <div
                  className={cn(
                    'p-2.5 rounded-lg border text-[11px] mt-2 space-y-1',
                    enforceResult.granted
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  )}
                >
                  <div className="font-bold flex items-center gap-1">
                    {enforceResult.granted ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {enforceResult.granted ? 'OPERATION PERMITTED' : 'OPERATION BLOCKED'}
                  </div>
                  <p className="text-[10px]">{enforceResult.reason || 'Active unexpired consent verified.'}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: PRIVACY PREFERENCES */}
      {activeTab === 'PREFERENCES' && (
        <Card className="max-w-2xl p-5 space-y-4 border">
          <div className="border-b pb-3 border-slate-100 dark:border-[#1E2445]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-600" />
              Customer Privacy Preferences
            </h3>
            <p className="text-xs text-slate-400">
              Manage data sharing permissions and communication channels
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">AI-Assisted Processing</div>
                <p className="text-[11px] text-slate-400">
                  Allow automated copilot analysis for underwriting acceleration
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences?.allowAiAnalysis || false}
                onChange={(e) => updatePrefsMutation.mutate({ allowAiAnalysis: e.target.checked })}
                className="h-4 w-4 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Promotional Communications</div>
                <p className="text-[11px] text-slate-400">
                  Receive personalized pre-approved offers and rate reduction alerts
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences?.allowMarketing || false}
                onChange={(e) => updatePrefsMutation.mutate({ allowMarketing: e.target.checked })}
                className="h-4 w-4 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Third-Party Data Sharing</div>
                <p className="text-[11px] text-slate-400">
                  Allow sharing attributes with co-lending institutional partners
                </p>
              </div>
              <input
                type="checkbox"
                checked={preferences?.allowThirdPartySharing || false}
                onChange={(e) => updatePrefsMutation.mutate({ allowThirdPartySharing: e.target.checked })}
                className="h-4 w-4 rounded cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border space-y-2">
              <div className="font-bold text-slate-900 dark:text-white">Preferred Communication Channel</div>
              <div className="flex items-center gap-4">
                {(['EMAIL', 'SMS', 'WHATSAPP'] as const).map((ch) => (
                  <label key={ch} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="channel"
                      value={ch}
                      checked={preferences?.preferredChannel === ch}
                      onChange={() => updatePrefsMutation.mutate({ preferredChannel: ch })}
                    />
                    <span>{ch}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: AI PROMPT MINIMIZATION SIMULATOR */}
      {activeTab === 'AI_MINIMIZATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4 border">
            <div className="border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <EyeOff className="h-4 w-4 text-blue-600" />
                Raw Customer Attributes (Inbound)
              </h3>
              <p className="text-xs text-slate-400">
                Sensitive identifiers that must NEVER be exposed in raw form to AI models
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 text-[10px] mb-1">Full Customer Name</label>
                <input
                  type="text"
                  value={rawName}
                  onChange={(e) => setRawName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={rawPan}
                    onChange={(e) => setRawPan(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Aadhaar Number</label>
                  <input
                    type="text"
                    value={rawAadhaar}
                    onChange={(e) => setRawAadhaar(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={rawBank}
                    onChange={(e) => setRawBank(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={rawPhone}
                    onChange={(e) => setRawPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                disabled={aiSanitizeMutation.isPending}
                onClick={() => aiSanitizeMutation.mutate()}
                className="w-full mt-2 cursor-pointer"
              >
                {aiSanitizeMutation.isPending ? 'Sanitizing...' : 'Simulate AI Context Minimization'}
              </Button>
            </div>
          </Card>

          {/* Sanitized Output */}
          <Card className="p-5 space-y-4 border">
            <div className="border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Sanitized & Minimized AI Context (Outbound)
              </h3>
              <p className="text-xs text-slate-400">Masked PII and consent-scoped payload</p>
            </div>

            {!sanitizedOutput ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Click &quot;Simulate AI Context Minimization&quot; to inspect sanitized JSON payload.
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <span className="text-slate-500">AI Consent Scoping:</span>
                  <Badge variant={sanitizedOutput.aiConsentGranted ? 'success' : 'warning'}>
                    {sanitizedOutput.purposeScope}
                  </Badge>
                </div>

                <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] max-h-60 overflow-y-auto whitespace-pre">
                  {JSON.stringify(sanitizedOutput, null, 2)}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
