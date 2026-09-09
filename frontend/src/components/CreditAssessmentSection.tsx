'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Calculator,
  UserCheck,
  FileCheck,
  Send,
  Sparkles,
  TrendingUp,
  Clock,
  RotateCcw,
  IndianRupee,
  Layers,
  FileText,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { formatMoney, formatDate, cn } from '@/lib/utils';
import { Card, Button, Badge, Input, Spinner } from '@/components/ui';

interface Props {
  applicationId: string;
  applicationNo: string;
  currentStatus: string;
  customer: any;
  product: any;
  isCreditAnalyst: boolean;
  onDecisionSubmitted?: () => void;
}

export function CreditAssessmentSection({
  applicationId,
  applicationNo,
  currentStatus,
  customer,
  product,
  isCreditAnalyst,
  onDecisionSubmitted,
}: Props) {
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch live capacity data & calculations from backend
  const { data: capacity, isLoading, refetch } = useQuery({
    queryKey: ['credit-capacity', applicationId],
    queryFn: async () => {
      const res = await api.get(`/credit/applications/${applicationId}/capacity`);
      return res.data?.data;
    },
    enabled: !!applicationId,
  });

  // State for Income & Employment Verification
  const [verifiedIncome, setVerifiedIncome] = useState<number | string>('');
  const [employmentStatus, setEmploymentStatus] = useState<
    'PENDING' | 'VERIFIED' | 'FAILED' | 'REQUIRES_CLARIFICATION'
  >('VERIFIED');
  const [docStatus, setDocStatus] = useState<
    'PENDING' | 'VERIFIED' | 'REJECTED' | 'REQUIRES_CORRECTION'
  >('VERIFIED');

  // Risk Assessment State
  const [riskGrade, setRiskGrade] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [analystRemarks, setAnalystRemarks] = useState('');

  // Credit Decision Action State
  const [decision, setDecision] = useState<'ELIGIBLE' | 'NOT_ELIGIBLE' | 'FURTHER_REVIEW'>('ELIGIBLE');
  const [decisionReason, setDecisionReason] = useState('');
  const [requestedDocs, setRequestedDocs] = useState('');

  // Auto-fill from capacity once loaded
  useEffect(() => {
    if (capacity) {
      if (verifiedIncome === '') {
        setVerifiedIncome(capacity.verifiedMonthlyIncome || capacity.declaredMonthlyIncome || '');
      }
      if (capacity.employmentVerificationStatus) {
        setEmploymentStatus(capacity.employmentVerificationStatus);
      }
      if (capacity.riskCategory) {
        setRiskGrade(capacity.riskCategory as any);
      }
      if (capacity.previousDecision?.reason && !decisionReason) {
        setDecisionReason(capacity.previousDecision.reason);
      }
      if (capacity.previousDecision?.result) {
        setDecision(capacity.previousDecision.result as any);
      }
    }
  }, [capacity]);

  // Live Dynamic Calculations
  const numericVerifiedIncome = Number(verifiedIncome) || Number(capacity?.declaredMonthlyIncome) || 0;
  const existingObligations = Number(capacity?.existingMonthlyObligations || 0);
  const proposedEmi = Number(capacity?.proposedEmi || 0);
  const totalMonthlyObligations = existingObligations + proposedEmi;

  const liveDtiPct =
    numericVerifiedIncome > 0
      ? ((existingObligations / numericVerifiedIncome) * 100).toFixed(1)
      : '0.0';

  const liveFoirPct =
    numericVerifiedIncome > 0
      ? ((totalMonthlyObligations / numericVerifiedIncome) * 100).toFixed(1)
      : '0.0';

  const liveDisposableIncome = Math.max(0, numericVerifiedIncome - totalMonthlyObligations);

  // Quick reason presets
  const handlePresetReason = (type: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'FURTHER_REVIEW') => {
    setDecision(type);
    if (type === 'ELIGIBLE') {
      setDecisionReason(
        'Verified income and employment are satisfactory. Credit history is acceptable and existing obligations indicate reasonable repayment capacity.'
      );
      setRiskGrade('LOW');
    } else if (type === 'NOT_ELIGIBLE') {
      setDecisionReason(
        "Existing financial obligations are high relative to verified income and the customer's repayment capacity does not meet the required credit criteria."
      );
      setRiskGrade('HIGH');
    } else {
      setDecisionReason(
        'Income information and supporting documentation require additional verification before a final credit eligibility decision can be made.'
      );
      setRiskGrade('MEDIUM');
    }
  };

  // Submit Decision Mutation
  const decisionMutation = useMutation({
    mutationFn: async () => {
      if (!decisionReason.trim() || decisionReason.trim().length < 10) {
        throw new Error('A detailed decision reason is mandatory (at least 10 characters).');
      }

      return api.post(`/credit/applications/${applicationId}/decision`, {
        decision,
        reason: decisionReason.trim(),
        verifiedIncome: numericVerifiedIncome > 0 ? numericVerifiedIncome : undefined,
        employmentVerificationStatus: employmentStatus,
        documentVerificationStatus: docStatus,
        riskGrade,
        positiveFactors: [
          `Verified monthly income ₹${numericVerifiedIncome.toLocaleString('en-IN')}`,
          `Calculated FOIR of ${liveFoirPct}% with proposed EMI of ₹${proposedEmi.toLocaleString('en-IN')}`,
          `Risk grade evaluated as ${riskGrade}`,
        ],
        riskFactors:
          decision === 'NOT_ELIGIBLE'
            ? [
                `Total monthly obligations of ₹${totalMonthlyObligations.toLocaleString('en-IN')} exceed threshold`,
                `FOIR of ${liveFoirPct}% indicates severe debt burden`,
              ]
            : undefined,
        analystRemarks: analystRemarks.trim() || decisionReason.trim(),
        requestedDocuments: decision === 'FURTHER_REVIEW' ? requestedDocs.trim() : undefined,
      });
    },
    onSuccess: (res) => {
      const d = res.data?.data;
      toast.success(`Credit decision '${decision}' committed successfully.`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      if (onDecisionSubmitted) onDecisionSubmitted();
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Credit Decision Notice' });
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6 text-center space-y-3">
        <div className="flex justify-center">
          <Spinner size="md" />
        </div>
        <p className="text-xs text-slate-400">Loading credit capacity and repayment evaluation...</p>
      </Card>
    );
  }

  const previousDecision = capacity?.previousDecision;

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. DECISION BANNER (If Already Decided)                                    */}
      {/* ========================================================================= */}
      {previousDecision && (
        <div
          className={cn(
            'p-4 rounded-2xl border flex items-start justify-between gap-4 animate-in fade-in',
            previousDecision.result === 'ELIGIBLE'
              ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50'
              : previousDecision.result === 'NOT_ELIGIBLE'
              ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50'
              : 'bg-amber-50/80 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800/50'
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-xl shrink-0 mt-0.5',
                previousDecision.result === 'ELIGIBLE'
                  ? 'bg-emerald-600 text-white'
                  : previousDecision.result === 'NOT_ELIGIBLE'
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-600 text-white'
              )}
            >
              {previousDecision.result === 'ELIGIBLE' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : previousDecision.result === 'NOT_ELIGIBLE' ? (
                <XCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Credit Assessment: {previousDecision.result}
                </h4>
                <Badge status={previousDecision.result} />
                <span className="text-[11px] text-slate-500">
                  Evaluated {previousDecision.evaluatedAt ? formatDate(previousDecision.evaluatedAt) : ''}
                  {previousDecision.analyst ? ` by ${previousDecision.analyst}` : ''}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3 text-[11px]">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Risk Level: <strong className="text-[#2563EB] dark:text-[#60A5FA]">{previousDecision.riskGrade || 'LOW'}</strong>
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Repayment Capacity: <strong className={capacity.foirPct <= 45 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {capacity.foirPct <= 45 ? `SUFFICIENT (FOIR: ${capacity.foirPct.toFixed(1)}%)` : `INSUFFICIENT (FOIR: ${capacity.foirPct.toFixed(1)}%)`}
                  </strong>
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
                <strong>Reason:</strong> {previousDecision.reason || 'Automated policy evaluation criteria.'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <strong>Recommendation:</strong> {previousDecision.result === 'ELIGIBLE'
                  ? 'Proceed to next stage (Branch Manager & Underwriting sanction).'
                  : previousDecision.result === 'NOT_ELIGIBLE'
                  ? (capacity.foirPct <= 45
                      ? 'Action Required: Resolve flagged policy criteria (e.g. correct borrower Date of Birth or complete KYC verification).'
                      : 'Decline recommended to Underwriting committee due to debt service capacity.')
                  : 'Return to Loan Officer for required document resubmission & KYC completion.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CUSTOMER FINANCIAL SUMMARY & REPAYMENT CAPACITY                        */}
      {/* ========================================================================= */}
      <Card className="space-y-4 border-2 border-blue-500/20 dark:border-blue-500/30 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <div className="flex items-center justify-between pb-1 pt-1 border-b border-slate-100 dark:border-[#2B3566]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-[#1E2445] text-blue-600 dark:text-[#60A5FA]">
              <Calculator className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Customer Financial Summary & Repayment Capacity
              </h3>
              <p className="text-xs text-slate-400">
                Automated debt service verification, DTI / FOIR calculations & disposable cash flow
              </p>
            </div>
          </div>
          <Badge status={capacity?.creditRating || 'GOOD'} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Declared Monthly Income */}
          <div className="p-3 rounded-xl border border-slate-100 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#060F1B]/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Declared Income</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {formatMoney(capacity?.declaredMonthlyIncome || 0)}
            </p>
            <span className="text-[10px] text-slate-400">Per month</span>
          </div>

          {/* Verified Monthly Income */}
          <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Verified Income
            </span>
            <p className="text-sm font-bold text-blue-700 dark:text-blue-300 mt-1">
              {formatMoney(numericVerifiedIncome)}
            </p>
            <span className="text-[10px] text-blue-500/80">Analyst verified</span>
          </div>

          {/* Existing Monthly EMI */}
          <div className="p-3 rounded-xl border border-slate-100 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#060F1B]/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Existing EMI</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {formatMoney(existingObligations)}
            </p>
            <span className="text-[10px] text-slate-400">External loans</span>
          </div>

          {/* Proposed New EMI */}
          <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Proposed New EMI
            </span>
            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mt-1">
              {formatMoney(proposedEmi)}
            </p>
            <span className="text-[10px] text-indigo-500/80">
              {capacity?.tenureMonths || 12} mos @ {capacity?.interestRatePct || 14.5}%
            </span>
          </div>

          {/* Total Monthly Obligations */}
          <div className="p-3 rounded-xl border border-slate-100 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#060F1B]/40">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Obligations</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
              {formatMoney(totalMonthlyObligations)}
            </p>
            <span className="text-[10px] text-slate-400">Existing + Proposed</span>
          </div>

          {/* Net Disposable Income */}
          <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Disposable Income
            </span>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {formatMoney(liveDisposableIncome)}
            </p>
            <span className="text-[10px] text-emerald-500/80">Net cash buffer</span>
          </div>
        </div>

        {/* DTI, FOIR & Credit Score Visual Metres */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* DTI Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-white dark:bg-[#1E2445] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Debt-to-Income (DTI)</span>
              <span
                className={cn(
                  'text-xs font-extrabold px-2 py-0.5 rounded',
                  Number(liveDtiPct) <= 30
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : Number(liveDtiPct) <= 45
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                )}
              >
                {liveDtiPct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-[#060F1B] overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  Number(liveDtiPct) <= 30 ? 'bg-emerald-500' : Number(liveDtiPct) <= 45 ? 'bg-amber-500' : 'bg-rose-500'
                )}
                style={{ width: `${Math.min(100, Math.max(5, Number(liveDtiPct)))}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">Existing debt / verified monthly gross income</p>
          </div>

          {/* FOIR Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-white dark:bg-[#1E2445] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Fixed Obligation to Income (FOIR)
              </span>
              <span
                className={cn(
                  'text-xs font-extrabold px-2 py-0.5 rounded',
                  Number(liveFoirPct) <= 40
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : Number(liveFoirPct) <= 55
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                )}
              >
                {liveFoirPct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-[#060F1B] overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  Number(liveFoirPct) <= 40 ? 'bg-emerald-500' : Number(liveFoirPct) <= 55 ? 'bg-amber-500' : 'bg-rose-500'
                )}
                style={{ width: `${Math.min(100, Math.max(5, Number(liveFoirPct)))}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">Total monthly commitments / verified monthly income</p>
          </div>

          {/* Credit Score Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-white dark:bg-[#1E2445] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Credit Bureau Score</span>
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                {capacity?.creditScore || 750} ({capacity?.creditRating || 'GOOD'})
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-[#060F1B] overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 dark:bg-blue-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(10, (((capacity?.creditScore || 750) - 300) / 600) * 100))}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">{capacity?.creditScoreSource || 'CIBIL Verified Feed'}</p>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 3. VERIFICATION SUMMARY & COMPLIANCE CHECKLIST                            */}
      {/* ========================================================================= */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-[#2B3566]">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300">
            <UserCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Verification & Diligence Summary</h3>
            <p className="text-xs text-slate-400">
              Verify borrower declared income, employment vintage, and document completeness
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* KYC Status */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2B3566] space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">KYC Status</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Aadhaar & PAN</span>
              <Badge status={capacity?.kycStatus || 'NOT_STARTED'} />
            </div>
            <p className="text-[11px] text-slate-400">Identity & Residence compliance</p>
          </div>

          {/* Income Verification Field */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2B3566] space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Income Verification</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">₹</span>
              <input
                type="number"
                disabled={!isCreditAnalyst}
                value={verifiedIncome}
                onChange={(e) => setVerifiedIncome(e.target.value)}
                placeholder="Verified Amount"
                className="w-full text-xs font-bold bg-transparent border-b border-slate-300 dark:border-slate-700 py-0.5 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-400">Declared: {formatMoney(capacity?.declaredMonthlyIncome || 0)}</p>
          </div>

          {/* Employment Verification Selector */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2B3566] space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Employment Status</span>
            <select
              disabled={!isCreditAnalyst}
              value={employmentStatus}
              onChange={(e) => setEmploymentStatus(e.target.value as any)}
              className={cn(
                'w-full text-xs font-bold rounded-lg border px-2 py-1',
                isDark ? 'bg-[#1E2445] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-800'
              )}
            >
              <option value="VERIFIED">VERIFIED</option>
              <option value="PENDING">PENDING</option>
              <option value="REQUIRES_CLARIFICATION">REQUIRES CLARIFICATION</option>
              <option value="FAILED">FAILED</option>
            </select>
            <p className="text-[10px] text-slate-400">Employer: {capacity?.employerName || 'Undisclosed'}</p>
          </div>

          {/* Document Verification Status */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-[#2B3566] space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Document Verification</span>
            <select
              disabled={!isCreditAnalyst}
              value={docStatus}
              onChange={(e) => setDocStatus(e.target.value as any)}
              className={cn(
                'w-full text-xs font-bold rounded-lg border px-2 py-1',
                isDark ? 'bg-[#1E2445] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-800'
              )}
            >
              <option value="VERIFIED">VERIFIED</option>
              <option value="PENDING">PENDING</option>
              <option value="REQUIRES_CORRECTION">REQUIRES CORRECTION</option>
              <option value="REJECTED">REJECTED</option>
            </select>
            <p className="text-[10px] text-slate-400">Salary slips, bank statement & ITR</p>
          </div>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 4. RISK ASSESSMENT & RISK GRADE ASSIGNMENT                                */}
      {/* ========================================================================= */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2B3566]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Credit Risk Assessment</h3>
              <p className="text-xs text-slate-400">Assign institutional risk grade and document credit synthesis</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Risk Grade:</span>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-[#2B3566] p-0.5">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  disabled={!isCreditAnalyst}
                  onClick={() => setRiskGrade(grade)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer',
                    riskGrade === grade
                      ? grade === 'LOW'
                        ? 'bg-emerald-600 text-white'
                        : grade === 'MEDIUM'
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  )}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 block">
            Analyst Assessment Remarks
          </label>
          <textarea
            rows={2}
            disabled={!isCreditAnalyst}
            value={analystRemarks}
            onChange={(e) => setAnalystRemarks(e.target.value)}
            placeholder="Document key credit observations, compensating factors, or repayment risk rationale..."
            className={cn(
              'w-full text-xs rounded-xl border p-2.5 shadow-2xs focus:border-blue-500 focus:outline-none',
              isDark ? 'bg-[#1E2445] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-800'
            )}
          />
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* 5. CREDIT DECISION ACTION (ELIGIBLE, NOT ELIGIBLE, FURTHER REVIEW)         */}
      {/* ========================================================================= */}
      {isCreditAnalyst && (
        <Card className="space-y-4 border-2 border-[#2563EB]/40 dark:border-[#2563EB]/50 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-[#2B3566]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-[#2563EB]" /> Submit Credit Assessment & Recommendation
              </h3>
              <p className="text-xs text-slate-400">
                Official determination of borrower repayment capacity. Recommendation will be forwarded to Branch Manager & Underwriter.
              </p>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Credit Eligibility Assessor
            </span>
          </div>

          {/* Decision Buttons with visual distinction */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Select Eligibility Recommendation:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* ELIGIBLE Button */}
              <button
                type="button"
                onClick={() => handlePresetReason('ELIGIBLE')}
                className={cn(
                  'p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer',
                  decision === 'ELIGIBLE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/50 dark:text-white dark:border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-[#2B3566] hover:border-emerald-300 bg-white dark:bg-[#1E2445]'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full mt-0.5 shrink-0',
                    decision === 'ELIGIBLE' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  )}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">ELIGIBLE</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Adequate repayment capacity; recommend sanction to Branch Manager & Underwriting.
                  </p>
                </div>
              </button>

              {/* NOT ELIGIBLE Button */}
              <button
                type="button"
                onClick={() => handlePresetReason('NOT_ELIGIBLE')}
                className={cn(
                  'p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer',
                  decision === 'NOT_ELIGIBLE'
                    ? 'border-rose-600 bg-rose-50 text-rose-950 dark:bg-rose-950/50 dark:text-white dark:border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-[#2B3566] hover:border-rose-300 bg-white dark:bg-[#1E2445]'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full mt-0.5 shrink-0',
                    decision === 'NOT_ELIGIBLE' ? 'bg-rose-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  )}
                >
                  <XCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">NOT ELIGIBLE</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Obligations excessive or criteria failed; forward decline recommendation to Underwriting.
                  </p>
                </div>
              </button>

              {/* FURTHER REVIEW Button */}
              <button
                type="button"
                onClick={() => handlePresetReason('FURTHER_REVIEW')}
                className={cn(
                  'p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer',
                  decision === 'FURTHER_REVIEW'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950/50 dark:text-white dark:border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-[#2B3566] hover:border-amber-300 bg-white dark:bg-[#1E2445]'
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full mt-0.5 shrink-0',
                    decision === 'FURTHER_REVIEW' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold">FURTHER REVIEW</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Insufficient info or docs; send back to Loan Officer for correction.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Mandatory Decision Reason Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Decision Reason / Credit Assessment Justification <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">Mandatory (min 10 characters)</span>
            </div>
            <textarea
              rows={3}
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="State the detailed financial evaluation rationale, credit findings, and justification for this decision..."
              className={cn(
                'w-full text-xs rounded-xl border p-3 shadow-2xs focus:border-blue-500 focus:outline-none',
                isDark ? 'bg-[#1E2445] border-[#2B3566] text-white' : 'bg-white border-slate-200 text-slate-800'
              )}
            />
          </div>

          {/* If Further Review, allow specifying requested documents */}
          {decision === 'FURTHER_REVIEW' && (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Specific Documents / Clarification Requested from Loan Officer
              </label>
              <Input
                value={requestedDocs}
                onChange={(e) => setRequestedDocs(e.target.value)}
                placeholder="e.g. Latest 3 months salary slip, Form 16, Bank statement clarification..."
              />
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#2B3566]">
            <p className="text-[11px] text-slate-400">
              {decision === 'ELIGIBLE'
                ? 'Recommendation will forward to Branch Manager & Underwriting for sanction.'
                : decision === 'NOT_ELIGIBLE'
                ? 'Not Eligible recommendation will forward to Branch Manager & Underwriter for formal review.'
                : 'Application will be sent back to Loan Officer for required document resubmission.'}
            </p>

            <Button
              disabled={decisionMutation.isPending || !decisionReason.trim() || decisionReason.trim().length < 10}
              onClick={() => decisionMutation.mutate()}
              className={cn(
                'gap-2 font-bold text-white shadow-sm cursor-pointer',
                decision === 'ELIGIBLE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : decision === 'NOT_ELIGIBLE'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              )}
            >
              {decisionMutation.isPending ? (
                <>
                  <Spinner size="sm" />
                  <span>Submitting Assessment...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit [{decision === 'ELIGIBLE' ? 'ELIGIBLE' : decision === 'NOT_ELIGIBLE' ? 'NOT ELIGIBLE' : 'FURTHER REVIEW'}] Assessment</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
