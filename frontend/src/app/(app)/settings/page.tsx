'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Coins,
  ArrowUpDown,
  Layers,
  Percent,
  Plus,
  Trash2,
  Code2,
  LayoutGrid,
  Info,
  Calendar,
  IndianRupee,
  Check,
  MoveUp,
  MoveDown,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, Button, Spinner, Badge } from '@/components/ui';
import { formatMoney } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'visual' | 'advanced'>('visual');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  if (isLoading) return <Spinner />;

  const settings = Array.isArray(data) ? data : [];
  const settingsMap = settings.reduce((acc: Record<string, any>, s: any) => {
    acc[s.key] = s;
    return acc;
  }, {});

  const categories = [
    { id: 'all', label: 'All Parameters', icon: LayoutGrid },
    { id: 'policy', label: 'Credit Eligibility', icon: Shield },
    { id: 'risk', label: 'Risk Weights', icon: Sliders },
    { id: 'underwriting', label: 'Sanction Limits', icon: Coins },
    { id: 'finance', label: 'Payment Waterfall', icon: ArrowUpDown },
    { id: 'collections', label: 'Delinquency DPD', icon: Layers },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeader
        breadcrumb="Administration / System Settings"
        title="System Parameters & Business Rules"
        subtitle="Configure credit policies, risk weights, sanction limits, and payment waterfall orders with intuitive visual controls."
        action={
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1E2445] p-1 rounded-xl border border-slate-200 dark:border-[#2B3566]">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'visual'
                  ? 'bg-white dark:bg-[#060F1B] text-brand-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" /> Visual Forms
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'advanced'
                  ? 'bg-white dark:bg-[#060F1B] text-brand-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" /> Advanced JSON
            </button>
          </div>
        }
      />

      {activeTab === 'visual' ? (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-brand-700 text-white border-brand-700 shadow-sm'
                      : 'bg-white dark:bg-[#060F1B] border-slate-200 dark:border-[#1E2445] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1E2445]'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* 1. Credit Eligibility Criteria */}
            {(selectedCategory === 'all' || selectedCategory === 'policy') && settingsMap['eligibility_criteria'] && (
              <EligibilityCriteriaEditor setting={settingsMap['eligibility_criteria']} />
            )}

            {/* 2. Risk Model Weights */}
            {(selectedCategory === 'all' || selectedCategory === 'risk') && settingsMap['risk_model_weights'] && (
              <RiskModelWeightsEditor setting={settingsMap['risk_model_weights']} />
            )}

            {/* 3. Sanction Approval Limits */}
            {(selectedCategory === 'all' || selectedCategory === 'underwriting') && settingsMap['approval_limits'] && (
              <ApprovalLimitsEditor setting={settingsMap['approval_limits']} />
            )}

            {/* 4. Payment Allocation Waterfall Order */}
            {(selectedCategory === 'all' || selectedCategory === 'finance') && settingsMap['payment_allocation_order'] && (
              <PaymentAllocationEditor setting={settingsMap['payment_allocation_order']} />
            )}

            {/* 5. Delinquency Buckets */}
            {(selectedCategory === 'all' || selectedCategory === 'collections') && settingsMap['delinquency_buckets'] && (
              <DelinquencyBucketsEditor setting={settingsMap['delinquency_buckets']} />
            )}
          </div>
        </div>
      ) : (
        /* Advanced JSON Mode */
        <div className="space-y-5">
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <Info className="h-4 w-4 flex-none mt-0.5" />
            <div>
              <p className="font-bold">Advanced Developer Mode</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                Directly edit system parameter JSON payloads. Any modifications will instantly update application validation rules and be recorded in audit logs.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5">
            {settings.map((s: any) => (
              <AdvancedJsonEditor key={s.id} setting={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// 1. ELIGIBILITY CRITERIA VISUAL EDITOR
// ----------------------------------------------------------------------
function EligibilityCriteriaEditor({ setting }: { setting: any }) {
  const queryClient = useQueryClient();
  const initVal = setting.value || {};
  const [minAge, setMinAge] = useState<number>(initVal.minAge ?? 21);
  const [maxAge, setMaxAge] = useState<number>(initVal.maxAge ?? 60);
  const [minSalaried, setMinSalaried] = useState<number>(initVal.minSalariedIncome ?? 25000);
  const [minBusiness, setMinBusiness] = useState<number>(initVal.minBusinessIncome ?? 50000);
  const [warningDti, setWarningDti] = useState<number>(Math.round((initVal.warningDtiRatio ?? 0.45) * 100));
  const [maxDti, setMaxDti] = useState<number>(Math.round((initVal.maxDtiRatio ?? 0.55) * 100));
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        minAge: Number(minAge),
        maxAge: Number(maxAge),
        minSalariedIncome: Number(minSalaried),
        minBusinessIncome: Number(minBusiness),
        warningDtiRatio: Number(warningDti) / 100,
        maxDtiRatio: Number(maxDti) / 100,
      };
      return api.put(`/settings/${setting.key}`, { value: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Borrower Eligibility Policy</h3>
            <p className="text-xs text-slate-500">Automated underwriting criteria for applicant age, income thresholds, and debt obligations</p>
          </div>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/15 border border-emerald-200 dark:border-[#10B981]/30 px-3 py-1 rounded-lg">
            <CheckCircle2 className="h-4 w-4" /> Policy Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Min Age */}
        <div className="space-y-1.5 p-4 rounded-xl bg-slate-50/60 dark:bg-[#060F1B]/60 border border-slate-200/70 dark:border-[#1E2445]">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Minimum Borrower Age</span>
            <span className="text-brand-700 dark:text-blue-400 font-bold">{minAge} Years</span>
          </label>
          <input
            type="range"
            min="18"
            max="30"
            value={minAge}
            onChange={(e) => setMinAge(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-700"
          />
          <p className="text-[11px] text-slate-400">Legal minimum applicant age at application</p>
        </div>

        {/* Max Age */}
        <div className="space-y-1.5 p-4 rounded-xl bg-slate-50/60 dark:bg-[#060F1B]/60 border border-slate-200/70 dark:border-[#1E2445]">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Maximum Borrower Age</span>
            <span className="text-brand-700 dark:text-blue-400 font-bold">{maxAge} Years</span>
          </label>
          <input
            type="range"
            min="50"
            max="75"
            value={maxAge}
            onChange={(e) => setMaxAge(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-700"
          />
          <p className="text-[11px] text-slate-400">Maximum permissible age at loan maturity</p>
        </div>

        {/* Min Salaried Income */}
        <div className="space-y-1.5 p-4 rounded-xl bg-slate-50/60 dark:bg-[#060F1B]/60 border border-slate-200/70 dark:border-[#1E2445]">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Min Monthly Salaried Income</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
            <input
              type="number"
              step="1000"
              value={minSalaried}
              onChange={(e) => setMinSalaried(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-[#2B3566] text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-[#060F1B] focus:border-brand-700 focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-400">{formatMoney(minSalaried)} / month minimum</p>
        </div>

        {/* Min Business Income */}
        <div className="space-y-1.5 p-4 rounded-xl bg-slate-50/60 dark:bg-[#060F1B]/60 border border-slate-200/70 dark:border-[#1E2445]">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Min Self-Employed Income</label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">₹</span>
            <input
              type="number"
              step="5000"
              value={minBusiness}
              onChange={(e) => setMinBusiness(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 dark:border-[#2B3566] text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-[#060F1B] focus:border-brand-700 focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-slate-400">{formatMoney(minBusiness)} / month minimum</p>
        </div>

        {/* Warning DTI */}
        <div className="space-y-1.5 p-4 rounded-xl bg-slate-50/60 dark:bg-[#060F1B]/60 border border-slate-200/70 dark:border-[#1E2445]">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>DTI Warning Level (FOIR)</span>
            <span className="text-amber-600 font-bold">{warningDti}%</span>
          </label>
          <input
            type="range"
            min="20"
            max="60"
            value={warningDti}
            onChange={(e) => setWarningDti(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <p className="text-[11px] text-slate-400">Triggers cautionary warning in eligibility report</p>
        </div>

        {/* Max DTI */}
        <div className="space-y-1.5 p-4 rounded-xl bg-slate-50/60 dark:bg-[#060F1B]/60 border border-slate-200/70 dark:border-[#1E2445]">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Max Allowed DTI (Hard Stop)</span>
            <span className="text-rose-600 font-bold">{maxDti}%</span>
          </label>
          <input
            type="range"
            min="30"
            max="75"
            value={maxDti}
            onChange={(e) => setMaxDti(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <p className="text-[11px] text-slate-400">Rejects application if obligations exceed this limit</p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="text-xs text-white"
        >
          {mutation.isPending ? 'Updating Policy...' : 'Save Eligibility Policy'}
        </Button>
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------
// 2. RISK MODEL WEIGHTS VISUAL EDITOR
// ----------------------------------------------------------------------
function RiskModelWeightsEditor({ setting }: { setting: any }) {
  const queryClient = useQueryClient();
  const initVal = setting.value || {};
  const [debtService, setDebtService] = useState<number>(initVal.debtServiceCapacity ?? 30);
  const [creditHist, setCreditHist] = useState<number>(initVal.creditHistory ?? 25);
  const [vintage, setVintage] = useState<number>(initVal.employmentVintage ?? 25);
  const [docs, setDocs] = useState<number>(initVal.documentCompleteness ?? 20);
  const [saved, setSaved] = useState(false);

  const totalWeight = Number(debtService) + Number(creditHist) + Number(vintage) + Number(docs);
  const isValidTotal = totalWeight === 100;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isValidTotal) throw new Error('Total risk weight must exactly equal 100%');
      const payload = {
        debtServiceCapacity: Number(debtService),
        creditHistory: Number(creditHist),
        employmentVintage: Number(vintage),
        documentCompleteness: Number(docs),
      };
      return api.put(`/settings/${setting.key}`, { value: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <Sliders className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">4-Pillar Credit Risk Model Weights</h3>
            <p className="text-xs text-slate-500">Distribution of relative score weights across debt capacity, bureau history, and documentation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded-lg text-xs font-bold border ${
              isValidTotal
                ? 'bg-emerald-50 dark:bg-[#10B981]/15 text-emerald-700 dark:text-[#10B981] border-emerald-200 dark:border-[#10B981]/30'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200'
            }`}
          >
            Total Weight: {totalWeight}% {isValidTotal ? '✓' : '(Must be 100%)'}
          </div>
          {saved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/15 border border-emerald-200 dark:border-[#10B981]/30 px-3 py-1 rounded-lg">
              <CheckCircle2 className="h-4 w-4" /> Weights Saved
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Pillar 1 */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 dark:bg-[#060F1B]/60 border border-slate-200/70 dark:border-[#1E2445]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">1. Debt Service Capacity (DTI/FOIR)</span>
            <span className="text-xs font-bold text-brand-700 dark:text-blue-400">{debtService}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            value={debtService}
            onChange={(e) => setDebtService(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-700"
          />
          <p className="text-[11px] text-slate-400">Assesses cash flow surplus after servicing active EMIs</p>
        </div>

        {/* Pillar 2 */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 dark:bg-[#060F1B]/60 border border-slate-200/70 dark:border-[#1E2445]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">2. Credit & Repayment History</span>
            <span className="text-xs font-bold text-brand-700 dark:text-blue-400">{creditHist}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            value={creditHist}
            onChange={(e) => setCreditHist(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-700"
          />
          <p className="text-[11px] text-slate-400">Bureau track record, past defaults, and on-time repayment behavior</p>
        </div>

        {/* Pillar 3 */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 dark:bg-[#060F1B]/60 border border-slate-200/70 dark:border-[#1E2445]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">3. Employment & Business Vintage</span>
            <span className="text-xs font-bold text-brand-700 dark:text-blue-400">{vintage}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            value={vintage}
            onChange={(e) => setVintage(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-700"
          />
          <p className="text-[11px] text-slate-400">Stability of employment vintage and business operational years</p>
        </div>

        {/* Pillar 4 */}
        <div className="space-y-2 p-4 rounded-xl bg-slate-50/60 dark:bg-[#060F1B]/60 border border-slate-200/70 dark:border-[#1E2445]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">4. KYC & Document Completeness</span>
            <span className="text-xs font-bold text-brand-700 dark:text-blue-400">{docs}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            value={docs}
            onChange={(e) => setDocs(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-700"
          />
          <p className="text-[11px] text-slate-400">Verification of bank statements, identity proofs, and address records</p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="sm"
          disabled={mutation.isPending || !isValidTotal}
          onClick={() => mutation.mutate()}
          className="text-xs text-white"
        >
          {mutation.isPending ? 'Updating Weights...' : 'Save Risk Model Weights'}
        </Button>
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------
// 3. SANCTION APPROVAL LIMITS VISUAL EDITOR
// ----------------------------------------------------------------------
function ApprovalLimitsEditor({ setting }: { setting: any }) {
  const queryClient = useQueryClient();
  const initTiers = Array.isArray(setting.value) ? setting.value : [];
  const [tiers, setTiers] = useState<any[]>(initTiers);
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      return api.put(`/settings/${setting.key}`, { value: tiers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const updateTierAmount = (index: number, newAmount: number | null) => {
    const next = [...tiers];
    next[index] = { ...next[index], maxAmount: newAmount };
    setTiers(next);
  };

  const ROLE_LABELS: Record<string, string> = {
    LOAN_OFFICER: 'Loan Officer',
    CREDIT_ANALYST: 'Credit Analyst',
    UNDERWRITER: 'Underwriter',
    BRANCH_MANAGER: 'Branch Manager',
    ADMIN: 'System Admin',
    SUPER_ADMIN: 'Super Admin',
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Underwriting Sanction Authority Matrix</h3>
            <p className="text-xs text-slate-500">Tiered approval hierarchy and maximum sanction limits for each credit authority</p>
          </div>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/15 border border-emerald-200 dark:border-[#10B981]/30 px-3 py-1 rounded-lg">
            <CheckCircle2 className="h-4 w-4" /> Authority Matrix Saved
          </span>
        )}
      </div>

      <div className="space-y-4">
        {tiers.map((tier, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl border border-slate-200/80 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#060F1B]/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-700 text-white text-xs font-bold">
                  {idx + 1}
                </span>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {tier.maxAmount ? `Up to ${formatMoney(tier.maxAmount)}` : 'Unlimited / Enterprise Escalation'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-8">
                <span className="text-[11px] text-slate-400 mr-1">Permitted Signers:</span>
                {Array.isArray(tier.chain) &&
                  tier.chain.map((role: string) => (
                    <span
                      key={role}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-[#1E2445] border border-slate-200 dark:border-[#2B3566] text-slate-700 dark:text-slate-300"
                    >
                      {ROLE_LABELS[role] || role}
                    </span>
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pl-8 md:pl-0">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Max Ceiling:</label>
              {tier.maxAmount !== null ? (
                <div className="relative w-36">
                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="100000"
                    value={tier.maxAmount}
                    onChange={(e) => updateTierAmount(idx, Number(e.target.value))}
                    className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 dark:border-[#2B3566] text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-[#060F1B] focus:border-brand-700 focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  Unlimited
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="text-xs text-white"
        >
          {mutation.isPending ? 'Updating Limits...' : 'Save Approval Limits'}
        </Button>
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------
// 4. PAYMENT WATERFALL ORDER VISUAL EDITOR
// ----------------------------------------------------------------------
function PaymentAllocationEditor({ setting }: { setting: any }) {
  const queryClient = useQueryClient();
  const initOrder = Array.isArray(setting.value) ? setting.value : ['FEES', 'PENALTY', 'INTEREST', 'PRINCIPAL'];
  const [order, setOrder] = useState<string[]>(initOrder);
  const [saved, setSaved] = useState(false);

  const ITEM_DESCRIPTIONS: Record<string, { label: string; desc: string; icon: string }> = {
    FEES: {
      label: 'Late & Administrative Fees',
      desc: 'Processing charges, bouncing fees, and incidental service costs',
      icon: '🏷️',
    },
    PENALTY: {
      label: 'Overdue Penalty Interest',
      desc: 'Accrued daily penal charges for delayed EMI payments',
      icon: '⚠️',
    },
    INTEREST: {
      label: 'Regular EMI Interest',
      desc: 'Current month amortized interest due on outstanding balance',
      icon: '📊',
    },
    PRINCIPAL: {
      label: 'Principal Outstanding',
      desc: 'Reduction of active loan balance and equity amortization',
      icon: '💰',
    },
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;
    const next = [...order];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setOrder(next);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      return api.put(`/settings/${setting.key}`, { value: order });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#10B981]">
            <ArrowUpDown className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Repayment Waterfall Allocation Hierarchy</h3>
            <p className="text-xs text-slate-500">Determines the exact order in which incoming borrower payments are settled against loan liabilities</p>
          </div>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/15 border border-emerald-200 dark:border-[#10B981]/30 px-3 py-1 rounded-lg">
            <CheckCircle2 className="h-4 w-4" /> Waterfall Saved
          </span>
        )}
      </div>

      <div className="space-y-3">
        {order.map((key, idx) => {
          const info = ITEM_DESCRIPTIONS[key] || { label: key, desc: 'Repayment allocation component', icon: '🔹' };
          return (
            <div
              key={key}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#060F1B]/60 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-700 text-white font-bold text-xs shadow-xs">
                  {idx + 1}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{info.icon}</span> {info.label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{info.desc}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveItem(idx, 'up')}
                  title="Move Priority Up"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-[#2B3566] text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1E2445] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <MoveUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === order.length - 1}
                  onClick={() => moveItem(idx, 'down')}
                  title="Move Priority Down"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-[#2B3566] text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-[#1E2445] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <MoveDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="text-xs text-white"
        >
          {mutation.isPending ? 'Updating Waterfall...' : 'Save Waterfall Order'}
        </Button>
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------
// 5. DELINQUENCY BUCKETS VISUAL EDITOR
// ----------------------------------------------------------------------
function DelinquencyBucketsEditor({ setting }: { setting: any }) {
  const queryClient = useQueryClient();
  const initBuckets = Array.isArray(setting.value) ? setting.value : ['0-30', '31-60', '61-90', '91-180', '180+'];
  const [buckets, setBuckets] = useState<string[]>(initBuckets);
  const [newBucket, setNewBucket] = useState('');
  const [saved, setSaved] = useState(false);

  const BUCKET_DESCRIPTIONS: Record<string, { label: string; rbiCategory: string; color: string }> = {
    '0-30': { label: 'Early Delinquency (0 - 30 DPD)', rbiCategory: 'Standard / SMA-0', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    '31-60': { label: 'Moderate Delinquency (31 - 60 DPD)', rbiCategory: 'SMA-1 Sub-Watch', color: 'text-orange-600 bg-orange-50 border-orange-200' },
    '61-90': { label: 'Critical Overdue (61 - 90 DPD)', rbiCategory: 'SMA-2 High Risk', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    '91-180': { label: 'Non-Performing Asset (91 - 180 DPD)', rbiCategory: 'NPA Substandard', color: 'text-rose-700 bg-rose-100 border-rose-300' },
    '180+': { label: 'Loss & Doubtful (> 180 DPD)', rbiCategory: 'NPA Doubtful / Loss', color: 'text-purple-700 bg-purple-100 border-purple-300' },
  };

  const removeBucket = (idx: number) => {
    setBuckets(buckets.filter((_, i) => i !== idx));
  };

  const addBucket = () => {
    if (!newBucket.trim() || buckets.includes(newBucket.trim())) return;
    setBuckets([...buckets, newBucket.trim()]);
    setNewBucket('');
  };

  const mutation = useMutation({
    mutationFn: async () => {
      return api.put(`/settings/${setting.key}`, { value: buckets });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-[#1E2445] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Delinquency Aging Buckets (DPD)</h3>
            <p className="text-xs text-slate-500">Days Past Due classification tiers for recovery queues and collection dashboards</p>
          </div>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/15 border border-emerald-200 dark:border-[#10B981]/30 px-3 py-1 rounded-lg">
            <CheckCircle2 className="h-4 w-4" /> DPD Buckets Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {buckets.map((b, idx) => {
          const info = BUCKET_DESCRIPTIONS[b] || {
            label: `${b} Days Past Due`,
            rbiCategory: 'Custom Bucket',
            color: 'text-slate-700 bg-slate-100 border-slate-200',
          };
          return (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-[#1E2445] bg-slate-50/50 dark:bg-[#060F1B]/60 space-y-2 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${info.color}`}>
                    {b} DPD
                  </span>
                  <p className="text-xs font-bold text-slate-900 dark:text-white mt-2">{info.label}</p>
                </div>
                {buckets.length > 2 && (
                  <button
                    onClick={() => removeBucket(idx)}
                    title="Remove bucket"
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">{info.rbiCategory}</p>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input
          type="text"
          placeholder="New DPD bucket (e.g. 181-365)"
          value={newBucket}
          onChange={(e) => setNewBucket(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-[#2B3566] text-xs text-slate-900 dark:text-white bg-white dark:bg-[#060F1B] focus:border-brand-700 focus:outline-none"
        />
        <Button size="sm" variant="secondary" onClick={addBucket} className="text-xs flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> Add Bucket
        </Button>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
          className="text-xs text-white"
        >
          {mutation.isPending ? 'Updating Buckets...' : 'Save Delinquency Buckets'}
        </Button>
      </div>
    </Card>
  );
}

// ----------------------------------------------------------------------
// ADVANCED JSON FALLBACK EDITOR
// ----------------------------------------------------------------------
function AdvancedJsonEditor({ setting }: { setting: any }) {
  const queryClient = useQueryClient();
  const [jsonText, setJsonText] = useState(JSON.stringify(setting.value, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (err: any) {
        throw new Error(`Invalid JSON syntax: ${err.message}`);
      }
      return api.put(`/settings/${setting.key}`, { value: parsed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: any) => {
      setError(err.message || apiErrorMessage(err));
    },
  });

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">{setting.key}</h3>
          <p className="text-xs text-slate-400 capitalize mt-0.5">Category: {setting.category || 'General'}</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/15 border border-emerald-200 dark:border-[#10B981]/30 px-2.5 py-0.5 rounded-md">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-[#10B981]" /> Saved
          </span>
        )}
      </div>

      <div>
        <textarea
          rows={6}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-[#2B3566] p-3 font-mono text-xs text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-[#060F1B] focus:border-[#2563EB] focus:outline-none"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-400 border border-rose-200">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="text-xs text-white"
        >
          {saveMutation.isPending ? 'Updating...' : 'Save JSON'}
        </Button>
      </div>
    </Card>
  );
}
