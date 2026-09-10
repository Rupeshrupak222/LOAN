'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  ShieldCheck,
  Calculator,
  UserCheck,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Send,
  User,
  Info,
  TrendingUp,
  Award,
  Layers,
  FileText,
  Percent,
  Check,
  RefreshCw,
  Play,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { Badge, Button, Card, Input } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { CreditIntelligenceCard } from '@/components/CreditIntelligenceCard';
import { DecisionSimulatorCard } from '@/components/DecisionSimulatorCard';

interface CreditAssessmentWorkspaceProps {
  applicationId: string;
  onForwardSuccess?: () => void;
}

export function CreditAssessmentWorkspace({ applicationId, onForwardSuccess }: CreditAssessmentWorkspaceProps) {
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Interactive Debt Capacity & FOIR Recalculator State
  const [calcIncome, setCalcIncome] = useState<number | ''>('');
  const [calcObligations, setCalcObligations] = useState<number | ''>('');
  const [calcAmount, setCalcAmount] = useState<number | ''>('');
  const [calcTenure, setCalcTenure] = useState<number | ''>('');
  const [calcRate, setCalcRate] = useState<number | ''>('');
  const [liveFoirResult, setLiveFoirResult] = useState<{
    proposedEmi: number;
    totalObligations: number;
    foirPct: number;
    status: 'PASS' | 'REVIEW' | 'FAIL';
  } | null>(null);

  // Recommendation Form State
  const [recommendation, setRecommendation] = useState<'RECOMMEND' | 'RECOMMEND_WITH_CONDITIONS' | 'SEND_BACK'>('RECOMMEND');
  const [proposedAmount, setProposedAmount] = useState<number | ''>('');
  const [proposedTenure, setProposedTenure] = useState<number | ''>('');
  const [proposedRate, setProposedRate] = useState<number | ''>('');
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['credit-assessment', applicationId],
    queryFn: async () => {
      const res = await api.get(`/credit-assessment/${applicationId}`);
      return res.data?.data;
    },
    enabled: Boolean(applicationId),
  });

  const app = data?.application;
  const customer = data?.customer;
  const product = data?.product;
  const kycChecklist = data?.kycChecklist;
  const creditHealth = data?.creditHealth;
  const foir = data?.foirAnalysis;
  const eligibility = data?.eligibility;
  const risk = data?.riskAnalysis;
  const gate = data?.assessmentGate;
  const existingRecommendation = data?.recommendation;

  // Sync initial calculator values & existing recommendation when data loads
  useEffect(() => {
    if (customer && app && product) {
      const inc = Number(customer.monthlyIncome || 0);
      const obl = Number(customer.existingObligations || 0);
      const amt = Number(app.requestedAmount || 0);
      const ten = Number(app.tenureMonths || 12);
      const r = Number(product.interestRate || 14.5);

      setCalcIncome(inc);
      setCalcObligations(obl);
      setCalcAmount(amt);
      setCalcTenure(ten);
      setCalcRate(r);
    }
    if (existingRecommendation) {
      if (existingRecommendation.recommendation) setRecommendation(existingRecommendation.recommendation);
      if (existingRecommendation.proposedAmount) setProposedAmount(existingRecommendation.proposedAmount);
      if (existingRecommendation.proposedTenure) setProposedTenure(existingRecommendation.proposedTenure);
      if (existingRecommendation.conditions) setConditions(existingRecommendation.conditions);
      if (existingRecommendation.notes) setNotes(existingRecommendation.notes);
    }
  }, [customer, app, product, existingRecommendation]);

  // Manual Test 1: Run Policy Eligibility Engine
  const runEligibilityMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/eligibility/evaluate/${applicationId}`);
      return res.data?.data;
    },
    onSuccess: (result) => {
      toast.success(`Policy Eligibility Engine completed: ${result?.result || 'Evaluated'}`);
      queryClient.invalidateQueries({ queryKey: ['credit-assessment', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Eligibility Engine Error' });
    },
  });

  // Manual Test 2: Run 4-Pillar Risk Scoring Engine
  const runRiskMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/risk/evaluate/${applicationId}`);
      return res.data?.data;
    },
    onSuccess: (result) => {
      toast.success(`4-Pillar Risk Score evaluated: ${result?.score}/100 (${result?.category} Risk)`);
      queryClient.invalidateQueries({ queryKey: ['credit-assessment', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Risk Engine Error' });
    },
  });

  // Manual Test 2: Verify Document Mutation
  const verifyDocMutation = useMutation({
    mutationFn: async ({ docId, status }: { docId: string; status: 'VERIFIED' | 'REJECTED' }) => {
      const res = await api.patch(`/documents/${docId}/verify`, { status });
      return res.data?.data;
    },
    onSuccess: () => {
      toast.success('Borrower document status updated to VERIFIED.');
      queryClient.invalidateQueries({ queryKey: ['credit-assessment', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['customer'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Document Verification Notice' });
    },
  });

  // Manual Test 3: Calculate Live FOIR / Debt Capacity
  const handleRecalculateFoir = () => {
    const inc = Number(calcIncome || 0);
    const obl = Number(calcObligations || 0);
    const p = Number(calcAmount || 0);
    const n = Number(calcTenure || 12);
    const r = Number(calcRate || 14.5) / 12 / 100;

    let emi = 0;
    if (r > 0 && n > 0 && p > 0) {
      emi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    } else if (n > 0) {
      emi = Math.round(p / n);
    }

    const totalObl = obl + emi;
    const foirPct = inc > 0 ? Math.round((totalObl / inc) * 10000) / 100 : 100;

    const maxAllowed = foir?.maxAllowedFoirPct || 55;
    let status: 'PASS' | 'REVIEW' | 'FAIL' = 'PASS';
    if (foirPct > maxAllowed) status = 'FAIL';
    else if (foirPct > maxAllowed - 10) status = 'REVIEW';

    setLiveFoirResult({
      proposedEmi: emi,
      totalObligations: totalObl,
      foirPct,
      status,
    });

    toast.success(`Debt Capacity & FOIR evaluated: ${foirPct}% (${status})`);
  };

  // Submit Credit Recommendation Mutation
  const recommendationMutation = useMutation({
    mutationFn: async () => {
      if (!notes || notes.trim().length < 5) {
        throw new Error('Please enter assessment justification notes (minimum 5 characters).');
      }
      return api.post(`/credit-assessment/${applicationId}/recommendation`, {
        recommendation,
        proposedAmount: proposedAmount ? Number(proposedAmount) : undefined,
        proposedTenure: proposedTenure ? Number(proposedTenure) : undefined,
        proposedRate: proposedRate ? Number(proposedRate) : undefined,
        conditions: conditions.trim() || undefined,
        notes: notes.trim(),
      });
    },
    onSuccess: () => {
      toast.success('Credit recommendation recorded successfully.');
      queryClient.invalidateQueries({ queryKey: ['credit-assessment', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Recommendation Error' });
    },
  });



  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
        <p className="text-sm font-semibold text-slate-500">Loading Credit Assessment & Appraisal Lab...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-center rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40 space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <p className="text-sm font-semibold text-red-800 dark:text-red-300">
          Failed to load Credit Assessment details: {error ? apiErrorMessage(error) : 'Not found'}
        </p>
        <Button size="sm" variant="secondary" onClick={() => refetch()}>
          Retry Assessment Load
        </Button>
      </div>
    );
  }

  const isUnderwriterQueue = ['UNDERWRITING', 'APPROVED', 'REJECTED', 'DISBURSED'].includes(app?.status);
  const activeFoir = liveFoirResult || foir;

  return (
    <div className="space-y-6">
      {/* Role Segregation & Workflow Banner */}
      <div className={cn(
        'p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
        isDark ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-200' : 'bg-indigo-50/70 border-indigo-100 text-indigo-900'
      )}>
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <span className="font-bold text-sm tracking-tight text-indigo-700 dark:text-indigo-300">
              Credit Analyst Assessment & Appraisal Lab
            </span>
            <p className="text-slate-600 dark:text-slate-400">
              Run manual eligibility engines, test debt-service ratios, compute 4-pillar risk scores, and record your formal credit recommendation before forwarding to the Underwriter.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge status={app?.status} />
          {isUnderwriterQueue && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Forwarded to Underwriting
            </span>
          )}
        </div>
      </div>

      {/* Quick Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <Card className="p-4 space-y-1">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Borrower</p>
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">
            {customer?.firstName} {customer?.lastName}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{customer?.customerCode}</span>
            <span>·</span>
            <span>{customer?.mobile}</span>
          </div>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Loan Product</p>
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">
            {product?.name} ({product?.code})
          </p>
          <p className="text-xs text-slate-500">
            Rate: {product?.interestRate}% p.a.
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Requested Proposal</p>
          <p className="text-base font-bold text-brand-600 dark:text-brand-400">
            {formatMoney(app?.requestedAmount)}
          </p>
          <p className="text-xs text-slate-500">
            Tenure: {app?.tenureMonths} Months
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Monthly Income / FOIR</p>
          <p className="text-base font-bold text-slate-800 dark:text-slate-100">
            {formatMoney(customer?.monthlyIncome)}
          </p>
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className={activeFoir?.status === 'PASS' ? 'text-emerald-600' : activeFoir?.status === 'REVIEW' ? 'text-amber-600' : 'text-red-600'}>
              FOIR: {activeFoir?.foirPct}%
            </span>
            <span className="text-slate-400">(Max: {foir?.maxAllowedFoirPct}%)</span>
          </div>
        </Card>
      </div>

      {/* INTERACTIVE TEST 1 & 2: Policy Eligibility Engine & KYC Document Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INTERACTIVE TEST 1: Policy Eligibility Engine */}
        <Card className="p-5 space-y-4 border-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Test 1: Policy Eligibility Engine
                </h3>
                <p className="text-[11px] text-slate-400">Automated policy checks: Age, Income, FOIR, Bureau threshold</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => runEligibilityMutation.mutate()}
              disabled={runEligibilityMutation.isPending}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              {runEligibilityMutation.isPending ? 'Evaluating...' : 'Run Eligibility Check'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-900 dark:text-purple-200">Engine Verdict:</span>
              <span className={cn(
                'px-2.5 py-0.5 text-xs font-bold rounded-full',
                eligibility?.overallResult === 'ELIGIBLE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              )}>
                {eligibility?.overallResult || 'PENDING'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Max Eligible Amount: </span>
              <span className="font-bold text-slate-800 dark:text-slate-100">{formatMoney(eligibility?.maxEligibleAmount)}</span>
            </div>
          </div>

          <div className="space-y-2">
            {(eligibility?.factors || []).map((f: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{f.factor}</p>
                  <p className="text-[11px] text-slate-400">{f.detail}</p>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold',
                  f.status === 'PASS' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                  f.status === 'REVIEW' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                  'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                )}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* INTERACTIVE TEST 2: Borrower KYC & Identity Verification Checklist */}
        <Card className="p-5 space-y-4 border-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-brand-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Test 2: Borrower KYC & Document Verification
                </h3>
                <p className="text-[11px] text-slate-400">Verify government identity proof, selfie, and bank records</p>
              </div>
            </div>
            {customer?.id && (
              <Link href={`/customers/${customer.id}`} target="_blank">
                <Button size="sm" variant="secondary" className="gap-1.5 text-xs font-semibold">
                  <User className="w-3.5 h-3.5 text-brand-600" /> Open Customer 360
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg text-center text-xs">
            <div>
              <p className="text-slate-400">Total Uploaded</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{kycChecklist?.totalUploaded || 0}</p>
            </div>
            <div>
              <p className="text-slate-400">Verified</p>
              <p className="text-sm font-bold text-emerald-600">{kycChecklist?.totalVerified || 0}</p>
            </div>
            <div>
              <p className="text-slate-400">Pending Review</p>
              <p className="text-sm font-bold text-amber-600">{kycChecklist?.unverifiedDocs?.length || 0}</p>
            </div>
          </div>

          {kycChecklist?.missingRequiredDocs && kycChecklist.missingRequiredDocs.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Missing Mandatory KYC Documents:</p>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {kycChecklist.missingRequiredDocs.map((d: string, idx: number) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Uploaded Documents</p>
            {(!kycChecklist?.documents || kycChecklist.documents.length === 0) ? (
              <p className="text-xs text-slate-400 py-3 text-center italic">No documents attached yet</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {kycChecklist.documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">
                          {doc.documentType || doc.category}
                        </p>
                        <p className="text-[10px] text-slate-400">{doc.fileName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                        >
                          View ↗
                        </a>
                      )}
                      {doc.verified || doc.status === 'VERIFIED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          VERIFIED ✓
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={verifyDocMutation.isPending}
                          onClick={() => verifyDocMutation.mutate({ docId: doc.id, status: 'VERIFIED' })}
                          className="h-6 px-2 text-[10px] font-bold bg-amber-100 hover:bg-emerald-600 hover:text-white text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 transition-colors cursor-pointer"
                          title="Mark document verified"
                        >
                          Verify ✓
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* INTERACTIVE TEST 3 & 4: Live Debt Capacity / FOIR Recalculator & 4-Pillar Risk Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INTERACTIVE TEST 3: Debt Capacity & Interactive FOIR Recalculator */}
        <Card className="p-5 space-y-4 border-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Test 3: Debt Capacity & FOIR Recalculator
                </h3>
                <p className="text-[11px] text-slate-400">Interactive live debt-to-income simulation & stress test</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleRecalculateFoir}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
            >
              <Zap className="w-3.5 h-3.5" />
              Recalculate FOIR
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Monthly Income (₹)</label>
              <Input
                type="number"
                value={calcIncome}
                onChange={(e) => setCalcIncome(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Existing Debt (₹)</label>
              <Input
                type="number"
                value={calcObligations}
                onChange={(e) => setCalcObligations(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Proposed Amount (₹)</label>
              <Input
                type="number"
                value={calcAmount}
                onChange={(e) => setCalcAmount(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Tenure (Mos)</label>
              <Input
                type="number"
                value={calcTenure}
                onChange={(e) => setCalcTenure(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">Rate (% p.a.)</label>
              <Input
                type="number"
                value={calcRate}
                onChange={(e) => setCalcRate(e.target.value ? Number(e.target.value) : '')}
              />
            </div>
            <div className="space-y-1 flex flex-col justify-end">
              <Button size="sm" variant="secondary" onClick={handleRecalculateFoir} className="w-full text-xs font-semibold">
                Test Values
              </Button>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Computed Proposed EMI:</span>
              <span className="font-bold text-brand-600 text-sm">{formatMoney(activeFoir?.proposedEmi || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Total Monthly Debt Service:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{formatMoney(activeFoir?.totalMonthlyObligations || activeFoir?.totalMonthlyObligations || 0)}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Debt-to-Income (FOIR):</span>
              <span className={cn(
                'font-bold text-sm',
                activeFoir?.status === 'PASS' ? 'text-emerald-600' :
                activeFoir?.status === 'REVIEW' ? 'text-amber-600' : 'text-red-600'
              )}>
                {activeFoir?.foirPct}% (Cap: {foir?.maxAllowedFoirPct || 55}%)
              </span>
            </div>

            {/* Visual Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mt-1">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  Number(activeFoir?.foirPct || 0) <= 50 ? 'bg-emerald-500' :
                  Number(activeFoir?.foirPct || 0) <= 65 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(100, Number(activeFoir?.foirPct || 0))}%` }}
              />
            </div>
          </div>
        </Card>

        {/* INTERACTIVE TEST 4: 4-Pillar Risk Scoring Engine */}
        <Card className="p-5 space-y-4 border-2 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                  Test 4: 4-Pillar Risk Scoring Engine
                </h3>
                <p className="text-[11px] text-slate-400">Compute multidimensional credit risk score & risk grade</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => runRiskMutation.mutate()}
              disabled={runRiskMutation.isPending}
              className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              {runRiskMutation.isPending ? 'Scoring...' : 'Compute Risk Score'}
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-rose-900 dark:text-rose-200">Risk Assessment:</span>
              <span className={cn(
                'px-2.5 py-0.5 text-xs font-bold rounded-full',
                risk?.category === 'LOW' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                risk?.category === 'MEDIUM' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              )}>
                {risk?.category || 'LOW'} RISK
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-slate-400">Overall Score:</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100 font-mono">
                {risk?.score || 78} / 100
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {(risk?.factors || []).map((factor: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-1">
                    {factor.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">W: {factor.weight}%</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-bold font-mono text-slate-800 dark:text-slate-100">{factor.score}/100</span>
                  <span className="text-[10px] text-slate-500 truncate max-w-[100px]">{factor.remarks}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* INTERACTIVE TEST 5: AI Credit Intelligence & What-If Decision Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* AI Credit Intelligence */}
        <CreditIntelligenceCard applicationId={applicationId} applicationNo={app?.applicationNo} />

        {/* What-If Decision Simulator */}
        {product && (
          <DecisionSimulatorCard
            applicationId={applicationId}
            applicationNo={app?.applicationNo}
            baseAmount={Number(app?.requestedAmount || 500000)}
            baseTenure={Number(app?.tenureMonths || 36)}
            baseRate={Number(product?.interestRate || 14.5)}
            baseIncome={Number(customer?.monthlyIncome || 0)}
            baseObligations={Number(customer?.existingObligations || 0)}
          />
        )}
      </div>

      {/* SECTION 6: Credit Assessment Recommendation Form */}
      <Card className="p-5 space-y-4 border-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                Step 6: Credit Analyst Formal Recommendation
              </h3>
              <p className="text-[11px] text-slate-400">Record your appraisal conclusion, proposed sanction limits, and credit rationale</p>
            </div>
          </div>
          {existingRecommendation && (
            <span className="text-xs text-slate-500">
              Last saved: {existingRecommendation.recommendedAt ? formatDate(existingRecommendation.recommendedAt) : 'Recent'} by {existingRecommendation.recommendedBy}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Credit Recommendation *
            </label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value as any)}
              className={cn(
                'w-full px-3 py-2 text-xs rounded-lg border font-medium bg-white dark:bg-slate-900',
                isDark ? 'border-slate-700 text-slate-100' : 'border-slate-300 text-slate-800'
              )}
            >
              <option value="RECOMMEND">RECOMMEND (Recommend Sanction)</option>
              <option value="RECOMMEND_WITH_CONDITIONS">RECOMMEND_WITH_CONDITIONS (Conditional Sanction)</option>
              <option value="SEND_BACK">SEND_BACK (Request Rectification)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Proposed Amount (₹)
            </label>
            <Input
              type="number"
              placeholder={String(app?.requestedAmount || 500000)}
              value={proposedAmount}
              onChange={(e) => setProposedAmount(e.target.value ? Number(e.target.value) : '')}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Proposed Tenure (Months)
            </label>
            <Input
              type="number"
              placeholder={String(app?.tenureMonths || 36)}
              value={proposedTenure}
              onChange={(e) => setProposedTenure(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
        </div>

        {recommendation === 'RECOMMEND_WITH_CONDITIONS' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Sanction Conditions / Stipulations *
            </label>
            <Input
              placeholder="e.g., Mandatory Co-borrower, Post-dated cheques, Security deposit, or NACH mandate registration"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Credit Analyst Assessment Notes & Justification *
          </label>
          <textarea
            rows={3}
            placeholder="Record detailed credit rationale, cashflow analysis, employment verification remarks, and repayment capacity rationale..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={cn(
              'w-full px-3 py-2 text-xs rounded-lg border font-normal',
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
            )}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            onClick={() => recommendationMutation.mutate()}
            disabled={recommendationMutation.isPending}
            className="gap-1.5 font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" /> Save Credit Recommendation
          </Button>
        </div>

        {/* Assessment Completion Notice & Application Link */}
        {existingRecommendation?.recommendation && (
          <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs mt-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-100">
                  Credit Recommendation Saved ({existingRecommendation.recommendation})
                </p>
                <p className="text-[11px] text-slate-500">
                  All appraisal tests and recommendation notes are recorded. To review results or forward/reject proposal, open the Loan Application record.
                </p>
              </div>
            </div>
            <Link href={`/applications/${applicationId}`}>
              <Button size="sm" className="gap-1.5 font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                <FileText className="w-3.5 h-3.5" /> View Application & Forward →
              </Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
