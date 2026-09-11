'use client';

import React, { useState } from 'react';
import {
  PlayCircle,
  Sliders,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  Percent,
  ShieldAlert,
  UserCheck,
  Building,
  CreditCard,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useSimulateDecision, useDecisionPolicies } from '../hooks/useDecisionEngine';
import { DecisionResult, RuleEvaluationItem } from '../types';

export const DecisionSimulator: React.FC = () => {
  const { data: policies = [] } = useDecisionPolicies();
  const simulateMutation = useSimulateDecision();

  // Form State
  const [productId, setProductId] = useState<string>('PROD_PL_PERSONAL_LOAN');
  const [loanAmount, setLoanAmount] = useState<number>(300000);
  const [tenureMonths, setTenureMonths] = useState<number>(36);

  // Borrower
  const [applicantAge, setApplicantAge] = useState<number>(29);
  const [employmentType, setEmploymentType] = useState<string>('SALARIED');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(65000);
  const [existingObligations, setExistingObligations] = useState<number>(12000);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(15000);
  const [totalDebt, setTotalDebt] = useState<number>(150000);

  // Credit
  const [cibilScore, setCibilScore] = useState<number>(745);
  const [maxDpd12m, setMaxDpd12m] = useState<number>(0);
  const [enquiries3m, setEnquiries3m] = useState<number>(1);
  const [writtenOffCount, setWrittenOffCount] = useState<number>(0);
  const [settledCount, setSettledCount] = useState<number>(0);
  const [activeOverdue, setActiveOverdue] = useState<number>(0);

  // Banking
  const [averageBankBalance, setAverageBankBalance] = useState<number>(18500);
  const [salaryCreditDetected, setSalaryCreditDetected] = useState<boolean>(true);
  const [bankBounces6m, setBankBounces6m] = useState<number>(0);

  // KYC / Fraud
  const [kycVerified, setKycVerified] = useState<boolean>(true);
  const [panVerified, setPanVerified] = useState<boolean>(true);
  const [aadhaarVerified, setAadhaarVerified] = useState<boolean>(true);
  const [isDuplicateApplicant, setIsDuplicateApplicant] = useState<boolean>(false);
  const [isHighRiskArea, setIsHighRiskArea] = useState<boolean>(false);
  const [fraudFlag, setFraudFlag] = useState<boolean>(false);

  // Result
  const [simulationResult, setSimulationResult] = useState<DecisionResult | null>(null);

  // Preset loaders
  const loadPreset = (preset: 'PRIME' | 'HIGH_FOIR' | 'SUBPRIME' | 'FRAUD') => {
    if (preset === 'PRIME') {
      setLoanAmount(300000);
      setTenureMonths(36);
      setApplicantAge(32);
      setEmploymentType('SALARIED');
      setMonthlyIncome(85000);
      setExistingObligations(10000);
      setCibilScore(760);
      setMaxDpd12m(0);
      setEnquiries3m(1);
      setWrittenOffCount(0);
      setAverageBankBalance(25000);
      setSalaryCreditDetected(true);
      setBankBounces6m(0);
      setKycVerified(true);
      setPanVerified(true);
      setAadhaarVerified(true);
      setIsDuplicateApplicant(false);
      setIsHighRiskArea(false);
      setFraudFlag(false);
    } else if (preset === 'HIGH_FOIR') {
      setLoanAmount(500000);
      setTenureMonths(24);
      setApplicantAge(28);
      setEmploymentType('SALARIED');
      setMonthlyIncome(40000);
      setExistingObligations(24000);
      setCibilScore(710);
      setMaxDpd12m(0);
      setEnquiries3m(2);
      setWrittenOffCount(0);
      setAverageBankBalance(4000);
      setSalaryCreditDetected(true);
      setBankBounces6m(1);
      setKycVerified(true);
      setPanVerified(true);
      setAadhaarVerified(true);
      setIsDuplicateApplicant(false);
      setIsHighRiskArea(false);
      setFraudFlag(false);
    } else if (preset === 'SUBPRIME') {
      setLoanAmount(200000);
      setTenureMonths(24);
      setApplicantAge(24);
      setEmploymentType('SELF_EMPLOYED');
      setMonthlyIncome(30000);
      setExistingObligations(12000);
      setCibilScore(610);
      setMaxDpd12m(45);
      setEnquiries3m(6);
      setWrittenOffCount(1);
      setAverageBankBalance(1500);
      setSalaryCreditDetected(false);
      setBankBounces6m(3);
      setKycVerified(true);
      setPanVerified(true);
      setAadhaarVerified(true);
      setIsDuplicateApplicant(false);
      setIsHighRiskArea(false);
      setFraudFlag(false);
    } else if (preset === 'FRAUD') {
      setLoanAmount(400000);
      setTenureMonths(36);
      setApplicantAge(27);
      setEmploymentType('SALARIED');
      setMonthlyIncome(90000);
      setExistingObligations(5000);
      setCibilScore(740);
      setMaxDpd12m(0);
      setEnquiries3m(2);
      setWrittenOffCount(0);
      setAverageBankBalance(20000);
      setSalaryCreditDetected(true);
      setBankBounces6m(0);
      setKycVerified(false);
      setPanVerified(false);
      setAadhaarVerified(false);
      setIsDuplicateApplicant(true);
      setIsHighRiskArea(true);
      setFraudFlag(true);
    }
  };

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();

    simulateMutation.mutate(
      {
        productId,
        loanAmount: Number(loanAmount),
        tenureMonths: Number(tenureMonths),
        applicantAge: Number(applicantAge),
        employmentType: employmentType as any,
        monthlyIncome: Number(monthlyIncome),
        existingObligations: Number(existingObligations),
        cibilScore: Number(cibilScore),
        cibilOverdueAccounts: Number(activeOverdue > 0 ? 1 : 0),
        cibilDPD30Last12m: Number(maxDpd12m),
        averageBankBalance: Number(averageBankBalance),
        bankBounces90d: Number(bankBounces6m),
        kycVerified: Boolean(kycVerified && panVerified && aadhaarVerified),
        fraudRiskScore: fraudFlag || isDuplicateApplicant ? 85 : 10,
      },
      {
        onSuccess: (data) => {
          setSimulationResult(data);
        },
      }
    );
  };

  const formatCurrency = (amt: number) => `₹${Math.round(amt).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Simulator Header & Preset Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-indigo-400" />
            Decision Engine Sandbox & Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Test policy rules, financial thresholds and risk scoring models with what-if loan scenarios
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => loadPreset('PRIME')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all"
          >
            Prime Salaried
          </button>
          <button
            type="button"
            onClick={() => loadPreset('HIGH_FOIR')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
          >
            High FOIR
          </button>
          <button
            type="button"
            onClick={() => loadPreset('SUBPRIME')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all"
          >
            Subprime Score
          </button>
          <button
            type="button"
            onClick={() => loadPreset('FRAUD')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-all"
          >
            Fraud Signal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <form onSubmit={handleSimulate} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                Scenario Inputs
              </span>
              <button
                type="button"
                onClick={() => loadPreset('PRIME')}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Product & Loan Amount */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Product / Policy Target
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="PROD_PL_PERSONAL_LOAN">Personal Loan (PROD_PL_PERSONAL_LOAN)</option>
                  <option value="PROD_BL_BUSINESS_LOAN">Business Loan (PROD_BL_BUSINESS_LOAN)</option>
                  <option value="PROD_SAL_SALARY_LOAN">Salary Advance Loan (PROD_SAL_SALARY_LOAN)</option>
                  <option value="PROD_ED_EDUCATION_LOAN">Education Loan (PROD_ED_EDUCATION_LOAN)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Loan Amount (₹)</label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Borrower & Employment */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Borrower Profile
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Age (Years)</label>
                  <input
                    type="number"
                    value={applicantAge}
                    onChange={(e) => setApplicantAge(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Employment</label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  >
                    <option value="SALARIED">Salaried</option>
                    <option value="SELF_EMPLOYED">Self Employed</option>
                    <option value="BUSINESS">Business Owner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Monthly Income (₹)</label>
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Existing EMI (₹)</label>
                  <input
                    type="number"
                    value={existingObligations}
                    onChange={(e) => setExistingObligations(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Credit Bureau Details */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Credit Bureau & Delinquency
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">CIBIL Score</label>
                  <input
                    type="number"
                    value={cibilScore}
                    onChange={(e) => setCibilScore(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Max DPD (12M)</label>
                  <input
                    type="number"
                    value={maxDpd12m}
                    onChange={(e) => setMaxDpd12m(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Enquiries (3M)</label>
                  <input
                    type="number"
                    value={enquiries3m}
                    onChange={(e) => setEnquiries3m(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Write-off Accounts</label>
                  <input
                    type="number"
                    value={writtenOffCount}
                    onChange={(e) => setWrittenOffCount(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Avg Bank Balance (₹)</label>
                  <input
                    type="number"
                    value={averageBankBalance}
                    onChange={(e) => setAverageBankBalance(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Risk & Fraud Flags */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                KYC & Fraud Checks
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={panVerified}
                    onChange={(e) => setPanVerified(e.target.checked)}
                    className="rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                  <span>PAN Verified</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={aadhaarVerified}
                    onChange={(e) => setAadhaarVerified(e.target.checked)}
                    className="rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                  <span>Aadhaar Verified</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-rose-300">
                  <input
                    type="checkbox"
                    checked={isDuplicateApplicant}
                    onChange={(e) => setIsDuplicateApplicant(e.target.checked)}
                    className="rounded text-rose-600 bg-slate-800 border-slate-700"
                  />
                  <span>Duplicate Match</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-rose-300">
                  <input
                    type="checkbox"
                    checked={fraudFlag}
                    onChange={(e) => setFraudFlag(e.target.checked)}
                    className="rounded text-rose-600 bg-slate-800 border-slate-700"
                  />
                  <span>Watchlist Flag</span>
                </label>
              </div>
            </div>

            {/* Submit Simulation */}
            <button
              type="submit"
              disabled={simulateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-xl shadow-indigo-600/30 transition-all active:scale-[0.98]"
            >
              <PlayCircle className={`w-4 h-4 ${simulateMutation.isPending ? 'animate-spin' : ''}`} />
              {simulateMutation.isPending ? 'Simulating Underwriting Decision...' : 'Run BRE Simulation'}
            </button>
          </form>
        </div>

        {/* Output Results Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {simulationResult ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 animate-in fade-in duration-300">
              {/* Outcome Badge Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  simulationResult.decision === 'APPROVE'
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : simulationResult.decision === 'APPROVE_WITH_CONDITIONS'
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                    : simulationResult.decision === 'REFER'
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                    : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {simulationResult.decision === 'APPROVE' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  ) : simulationResult.decision === 'REFER' ? (
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-rose-400" />
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                      BRE Decision Outcome
                    </span>
                    <h2 className="text-xl font-black tracking-tight">{simulationResult.decision}</h2>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-xs text-slate-400">Risk Grade:</span>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-slate-900 border border-slate-700 text-white">
                      {simulationResult.riskGrade}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Score: <strong className="text-indigo-300">{simulationResult.riskScore} / 100</strong>
                  </span>
                </div>
              </div>

              {/* Financial Metrics Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Calculated FOIR</span>
                  <span className={`text-base font-bold font-mono ${simulationResult.foirPct > 60 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {simulationResult.foirPct}%
                  </span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Proposed EMI</span>
                  <span className="text-base font-bold font-mono text-white">
                    {formatCurrency(simulationResult.proposedEmi)}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Max Eligible Loan</span>
                  <span className="text-base font-bold font-mono text-indigo-300">
                    {formatCurrency(simulationResult.eligibleAmount)}
                  </span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Recommended</span>
                  <span className="text-base font-bold font-mono text-emerald-300">
                    {formatCurrency(simulationResult.recommendedAmount)}
                  </span>
                </div>
              </div>

              {/* Reasons & Conditions */}
              {simulationResult.reasons.length > 0 && (
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-1.5">
                  <span className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Knockout / Adverse Decision Reasons ({simulationResult.reasons.length})
                  </span>
                  <ul className="space-y-1 text-xs text-rose-200">
                    {simulationResult.reasons.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-rose-400 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {simulationResult.conditions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-1.5">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Required Approval Conditions ({simulationResult.conditions.length})
                  </span>
                  <ul className="space-y-1 text-xs text-cyan-200">
                    {simulationResult.conditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-cyan-400 font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Rule Evaluation Breakdown Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Rule Evaluation Matrix ({simulationResult.rulesEvaluatedCount} Rules)
                  </h3>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-emerald-400">{simulationResult.passedCount} Passed</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-rose-400">{simulationResult.failedCount} Failed</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-amber-400">{simulationResult.referredCount} Referred</span>
                  </div>
                </div>

                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {[
                    ...simulationResult.failedRules,
                    ...simulationResult.referredRules,
                    ...simulationResult.passedRules,
                  ].map((rule, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs ${
                        rule.passed
                          ? 'bg-slate-950/40 border-slate-800'
                          : rule.action === 'REFER'
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-rose-950/20 border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              rule.passed
                                ? 'bg-emerald-400'
                                : rule.action === 'REFER'
                                ? 'bg-amber-400'
                                : 'bg-rose-400'
                            }`}
                          />
                          <span className="font-bold text-white">{rule.ruleName}</span>
                          <span className="font-mono text-[10px] text-slate-400">({rule.ruleCode})</span>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            rule.passed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : rule.action === 'REFER'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {rule.passed ? 'PASS' : rule.action}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                        <div>
                          Input: <strong className="text-slate-200">{String(rule.actualValue)}</strong>
                        </div>
                        <div>
                          Condition: <span className="text-indigo-300">{rule.operator} {String(rule.expectedValue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 space-y-3">
              <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-300">Ready for Simulation</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Configure the loan parameters on the left or select a quick preset, then click &quot;Run BRE Simulation&quot;.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
