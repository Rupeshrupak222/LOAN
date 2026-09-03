'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Trash2,
  X,
  Check,
  Layers,
  AlertCircle,
  RefreshCw,
  Sliders,
  Calculator,
  Percent,
  Calendar,
  ShieldCheck,
  Sparkles,
  Info,
  TrendingUp,
  FileCheck,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Card, KpiCard, Badge, Button, Input, Spinner } from '@/components/ui';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface FeeSchedule {
  processingFeePct: number;
  processingFeeMinInr: number;
  documentationChargesInr: number;
  foreclosurePenaltyPct: number;
  lockInMonths: number;
  latePaymentPenaltyMonthlyPct: number;
  gracePeriodDays: number;
}

interface UnderwritingPolicyOverrides {
  maxFoirPct?: number;
  minCibilScore?: number;
  minMonthlyIncome?: number;
  requiredKycDocs?: string[];
}

interface DynamicLoanProduct {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string;
  category: 'PERSONAL' | 'SME_BUSINESS' | 'BNPL_LINE' | 'EDUCATION' | 'VEHICLE' | 'GOLD_SECURED' | 'HOME_LOAN';
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED';
  interestModel: 'FIXED_FLAT' | 'REDUCING_BALANCE' | 'FLOATING_MCLR_LINKED';
  baseInterestRateAnnualPct: number;
  mclrSpreadAnnualPct?: number;
  minLoanAmountInr: number;
  maxLoanAmountInr: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  feeSchedule: FeeSchedule;
  policyOverrides: UnderwritingPolicyOverrides;
  createdAt: string;
  updatedAt: string;
}

export default function LoanProductsPage() {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedProductForSim, setSelectedProductForSim] = useState<DynamicLoanProduct | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Simulator Inputs
  const [simLoanAmount, setSimLoanAmount] = useState<number>(500000);
  const [simTenureMonths, setSimTenureMonths] = useState<number>(24);
  const [simCibilScore, setSimCibilScore] = useState<number>(750);
  const [simMonthlyIncome, setSimMonthlyIncome] = useState<number>(65000);
  const [simExistingEmis, setSimExistingEmis] = useState<number>(8000);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  // Form State for New Product
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'PERSONAL',
    interestModel: 'REDUCING_BALANCE',
    baseInterestRateAnnualPct: 12.5,
    mclrSpreadAnnualPct: 0,
    minLoanAmountInr: 25000,
    maxLoanAmountInr: 1500000,
    minTenureMonths: 6,
    maxTenureMonths: 48,
    processingFeePct: 2.0,
    processingFeeMinInr: 1000,
    documentationChargesInr: 500,
    foreclosurePenaltyPct: 3.0,
    lockInMonths: 6,
    latePaymentPenaltyMonthlyPct: 2.0,
    gracePeriodDays: 3,
    minCibilScore: 680,
    maxFoirPct: 50,
    minMonthlyIncome: 30000,
  });

  // Query Dynamic Products Catalog
  const { data: products = [], isLoading, isFetching, refetch } = useQuery<DynamicLoanProduct[]>({
    queryKey: ['loan-products-catalog'],
    queryFn: async () => {
      const res = await api.get('/loan-products/catalog');
      return res.data?.data || [];
    },
  });

  // Simulator Mutation
  const simulateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProductForSim) return;
      const res = await api.post('/loan-products/simulate-pricing', {
        productId: selectedProductForSim.id,
        loanAmount: Number(simLoanAmount),
        tenureMonths: Number(simTenureMonths),
        applicantProfile: {
          cibilScore: Number(simCibilScore),
          monthlyIncome: Number(simMonthlyIncome),
          existingEmis: Number(simExistingEmis),
        },
      });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setSimulationResult(data);
    },
    onError: (err: any) => {
      alert(`Simulation error: ${apiErrorMessage(err)}`);
    },
  });

  // Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: async () => {
      await api.post('/loan-products/catalog', {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        interestModel: formData.interestModel,
        baseInterestRateAnnualPct: Number(formData.baseInterestRateAnnualPct),
        mclrSpreadAnnualPct: Number(formData.mclrSpreadAnnualPct) || undefined,
        minLoanAmountInr: Number(formData.minLoanAmountInr),
        maxLoanAmountInr: Number(formData.maxLoanAmountInr),
        minTenureMonths: Number(formData.minTenureMonths),
        maxTenureMonths: Number(formData.maxTenureMonths),
        feeSchedule: {
          processingFeePct: Number(formData.processingFeePct),
          processingFeeMinInr: Number(formData.processingFeeMinInr),
          documentationChargesInr: Number(formData.documentationChargesInr),
          foreclosurePenaltyPct: Number(formData.foreclosurePenaltyPct),
          lockInMonths: Number(formData.lockInMonths),
          latePaymentPenaltyMonthlyPct: Number(formData.latePaymentPenaltyMonthlyPct),
          gracePeriodDays: Number(formData.gracePeriodDays),
        },
        policyOverrides: {
          minCibilScore: Number(formData.minCibilScore),
          maxFoirPct: Number(formData.maxFoirPct),
          minMonthlyIncome: Number(formData.minMonthlyIncome),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-products-catalog'] });
      setIsCreateModalOpen(false);
    },
    onError: (err: any) => {
      alert(`Failed to create product: ${apiErrorMessage(err)}`);
    },
  });

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'ALL') return true;
    return p.category === selectedCategory;
  });

  const openSimulatorForProduct = (prod: DynamicLoanProduct) => {
    setSelectedProductForSim(prod);
    setSimLoanAmount(Math.min(Math.max(500000, prod.minLoanAmountInr), prod.maxLoanAmountInr));
    setSimTenureMonths(Math.min(Math.max(24, prod.minTenureMonths), prod.maxTenureMonths));
    setSimulationResult(null);
    setIsSimulatorOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Lending / Catalog"
        title="Enterprise Loan Product Studio"
        subtitle="Dynamic product definition, versioned interest calculation models, fee schedules, statutory RBI KFS generation, and underwriting policy overrides"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Launch New Product
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

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Loan Products"
          value={`${products.length} Products`}
          hint="Versioned Catalog"
          icon={Package}
        />
        <KpiCard
          title="Product Categories"
          value={`${new Set(products.map((p) => p.category)).size} Active`}
          hint="Personal, SME, BNPL, Commercial"
          icon={Layers}
        />
        <KpiCard
          title="Calculation Models"
          value="Reducing & Floating"
          hint="MCLR Spread & Fixed Flat"
          icon={Sliders}
        />
        <KpiCard
          title="Statutory KFS Engine"
          value="RBI Compliant"
          hint="APR & Fee Disclosure"
          icon={ShieldCheck}
          trend="Certified"
          trendPositive={true}
        />
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-[#1E2445] text-xs font-semibold gap-1">
        {['ALL', 'PERSONAL', 'SME_BUSINESS', 'BNPL_LINE', 'HOME_LOAN'].map((cat) => (
          <button
            type="button"
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              'px-3.5 py-2 border-b-2 transition-colors cursor-pointer',
              selectedCategory === cat
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Product Catalog Grid */}
      {isLoading ? (
        <div className="p-8 text-center"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="p-5 space-y-4 border hover:border-blue-300 dark:hover:border-blue-800 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                      {p.code}
                    </span>
                    <Badge variant="success" className="text-[10px] font-mono">v{p.version}.0 {p.status}</Badge>
                    <Badge variant="default" className="text-[10px] font-mono">{p.category}</Badge>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{p.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{p.description}</p>
                </div>
              </div>

              {/* Financial Attributes Matrix */}
              <div className="grid grid-cols-2 gap-2 text-xs p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] block">Interest Model:</span>
                  <strong className="text-blue-600 dark:text-blue-400">{p.interestModel}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Annual Rate (APR):</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {p.baseInterestRateAnnualPct}%
                    {p.mclrSpreadAnnualPct ? ` (+${p.mclrSpreadAnnualPct}% spread)` : ''}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Loan Amount Range:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {formatMoney(p.minLoanAmountInr)} - {formatMoney(p.maxLoanAmountInr)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Tenure Range:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {p.minTenureMonths} - {p.maxTenureMonths} Months
                  </strong>
                </div>
              </div>

              {/* Fee & Overrides Highlight */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  ⚡ Processing Fee: <strong>{p.feeSchedule.processingFeePct}%</strong> (Min {formatMoney(p.feeSchedule.processingFeeMinInr)})
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  🔒 Foreclosure: <strong>{p.feeSchedule.foreclosurePenaltyPct}%</strong> ({p.feeSchedule.lockInMonths}m lock-in)
                </span>
                {p.policyOverrides?.minCibilScore && (
                  <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono">
                    Min CIBIL: <strong>{p.policyOverrides.minCibilScore}</strong>
                  </span>
                )}
                {p.policyOverrides?.maxFoirPct && (
                  <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono">
                    Max FOIR: <strong>{p.policyOverrides.maxFoirPct}%</strong>
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  Created: {formatDateTime(p.createdAt)}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openSimulatorForProduct(p)}
                  className="text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Calculator className="h-3.5 w-3.5 text-blue-600" />
                  Simulate Pricing & KFS
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* REAL-TIME PRICING & STATUTORY KFS SIMULATOR MODAL */}
      {isSimulatorOpen && selectedProductForSim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  Product Pricing Simulator & Key Fact Statement (KFS)
                </h3>
                <p className="text-xs text-slate-400">
                  Evaluating {selectedProductForSim.name} ({selectedProductForSim.code} v{selectedProductForSim.version}.0)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSimulatorOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Loan Principal Amount (₹)</label>
                <input
                  type="number"
                  value={simLoanAmount}
                  onChange={(e) => setSimLoanAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Allowed: {formatMoney(selectedProductForSim.minLoanAmountInr)} - {formatMoney(selectedProductForSim.maxLoanAmountInr)}
                </span>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Tenure (Months)</label>
                <input
                  type="number"
                  value={simTenureMonths}
                  onChange={(e) => setSimTenureMonths(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Allowed: {selectedProductForSim.minTenureMonths} - {selectedProductForSim.maxTenureMonths} Months
                </span>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Applicant CIBIL Score</label>
                <input
                  type="number"
                  value={simCibilScore}
                  onChange={(e) => setSimCibilScore(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Applicant Monthly Income (₹)</label>
                <input
                  type="number"
                  value={simMonthlyIncome}
                  onChange={(e) => setSimMonthlyIncome(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Existing Monthly Obligations / EMIs (₹)</label>
                <input
                  type="number"
                  value={simExistingEmis}
                  onChange={(e) => setSimExistingEmis(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                variant="primary"
                size="sm"
                disabled={simulateMutation.isPending}
                onClick={() => simulateMutation.mutate()}
                className="text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {simulateMutation.isPending ? 'Simulating...' : 'Calculate Pricing & KFS'}
              </Button>
            </div>

            {/* SIMULATION RESULTS & KFS DISCLOSURE */}
            {simulationResult && (
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-fade-in text-xs">
                {/* Eligibility Status */}
                <div className={cn(
                  'p-3 rounded-xl border flex items-center justify-between',
                  simulationResult.eligibilityCheck.eligible
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                )}>
                  <div className="flex items-center gap-2 font-bold">
                    {simulationResult.eligibilityCheck.eligible ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-rose-600" />
                    )}
                    <span>
                      {simulationResult.eligibilityCheck.eligible
                        ? 'Applicant Meets Product Policy Criteria'
                        : 'Applicant Fails Product Policy Overrides'}
                    </span>
                  </div>
                  {simulationResult.eligibilityCheck.computedFoirPct !== undefined && (
                    <Badge variant="default" className="font-mono">
                      Projected FOIR: {simulationResult.eligibilityCheck.computedFoirPct}%
                    </Badge>
                  )}
                </div>

                {simulationResult.eligibilityCheck.reasons.length > 0 && (
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 text-rose-700 dark:text-rose-300 text-[11px]">
                    {simulationResult.eligibilityCheck.reasons.map((r: string, i: number) => (
                      <div key={i}>• {r}</div>
                    ))}
                  </div>
                )}

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <span className="text-slate-400 text-[10px] block">Monthly EMI:</span>
                    <strong className="text-blue-600 text-sm">{formatMoney(simulationResult.monthlyEmi)}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <span className="text-slate-400 text-[10px] block">Statutory APR:</span>
                    <strong className="text-emerald-600 text-sm">{simulationResult.annualPercentageRateApr}%</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <span className="text-slate-400 text-[10px] block">Total Processing Fees:</span>
                    <strong className="text-slate-900 dark:text-white text-sm">{formatMoney(simulationResult.totalFees)}</strong>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                    <span className="text-slate-400 text-[10px] block">Net Disbursed:</span>
                    <strong className="text-purple-600 text-sm">{formatMoney(simulationResult.netDisbursedAmount)}</strong>
                  </div>
                </div>

                {/* STATUTORY KEY FACT STATEMENT (KFS) TABLE */}
                <div className="border rounded-xl p-3 bg-white dark:bg-slate-900 space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-blue-600" />
                    Statutory Key Fact Statement (KFS) — RBI Digital Lending Guidelines
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-400">Sanctioned Principal:</span>
                      <strong className="text-slate-900 dark:text-white">{formatMoney(simulationResult.keyFactStatement.sanctionAmount)}</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-400">Interest Calculation Model:</span>
                      <strong className="text-blue-600">{simulationResult.keyFactStatement.rateOfInterestType}</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-400">Nominal Interest Rate:</span>
                      <strong className="text-slate-900 dark:text-white">{simulationResult.keyFactStatement.rateOfInterestPct}% p.a.</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-400">Total Repayment Amount:</span>
                      <strong className="text-slate-900 dark:text-white">{formatMoney(simulationResult.keyFactStatement.totalPayableAmount)}</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-400">Processing Fee (incl. 18% GST):</span>
                      <strong className="text-slate-900 dark:text-white">{formatMoney(simulationResult.keyFactStatement.processingFeeWithGst)}</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-slate-400">Cooling-Off / Look-In Period:</span>
                      <strong className="text-emerald-600">{simulationResult.keyFactStatement.coolingOffPeriodDays} Days</strong>
                    </div>
                    <div className="col-span-2 flex justify-between pt-1">
                      <span className="text-slate-400">Foreclosure Terms:</span>
                      <span className="text-slate-700 dark:text-slate-300">{simulationResult.keyFactStatement.foreclosureCharges}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DYNAMIC PRODUCT BUILDER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  Dynamic Product Builder Wizard
                </h3>
                <p className="text-xs text-slate-400">
                  Define new credit facility parameters, interest rate models, and KFS fee schedules
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Product Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. EDUCATION_FEE_LINE"
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Higher Education Tuition Loan"
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Product Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed product features and eligibility narrative"
                  rows={2}
                  className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs"
                  >
                    <option value="PERSONAL">PERSONAL</option>
                    <option value="SME_BUSINESS">SME_BUSINESS</option>
                    <option value="BNPL_LINE">BNPL_LINE</option>
                    <option value="EDUCATION">EDUCATION</option>
                    <option value="VEHICLE">VEHICLE</option>
                    <option value="GOLD_SECURED">GOLD_SECURED</option>
                    <option value="HOME_LOAN">HOME_LOAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Interest Calculation Model</label>
                  <select
                    value={formData.interestModel}
                    onChange={(e) => setFormData({ ...formData, interestModel: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border bg-white dark:bg-slate-900 text-xs font-mono"
                  >
                    <option value="REDUCING_BALANCE">REDUCING_BALANCE</option>
                    <option value="FIXED_FLAT">FIXED_FLAT</option>
                    <option value="FLOATING_MCLR_LINKED">FLOATING_MCLR_LINKED</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Base Interest Rate (% APR)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.baseInterestRateAnnualPct}
                    onChange={(e) => setFormData({ ...formData, baseInterestRateAnnualPct: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Min Principal (₹)</label>
                  <input
                    type="number"
                    value={formData.minLoanAmountInr}
                    onChange={(e) => setFormData({ ...formData, minLoanAmountInr: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Max Principal (₹)</label>
                  <input
                    type="number"
                    value={formData.maxLoanAmountInr}
                    onChange={(e) => setFormData({ ...formData, maxLoanAmountInr: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Min Tenure (Months)</label>
                  <input
                    type="number"
                    value={formData.minTenureMonths}
                    onChange={(e) => setFormData({ ...formData, minTenureMonths: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Max Tenure (Months)</label>
                  <input
                    type="number"
                    value={formData.maxTenureMonths}
                    onChange={(e) => setFormData({ ...formData, maxTenureMonths: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Processing Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.processingFeePct}
                    onChange={(e) => setFormData({ ...formData, processingFeePct: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded border bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E2445]">
              <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={createProductMutation.isPending}
                onClick={() => createProductMutation.mutate()}
                className="text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                {createProductMutation.isPending ? 'Launching...' : 'Launch Product (v1.0)'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
