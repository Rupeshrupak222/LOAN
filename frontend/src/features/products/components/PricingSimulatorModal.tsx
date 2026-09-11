'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Calculator,
  Percent,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Receipt,
  DollarSign,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { LendingProduct, ProductPricingSimulationResult } from '../types';
import { useSimulatePricing } from '../hooks/useProducts';
import { Button, Card, Badge, Spinner } from '@/components/ui';
import { formatMoney, cn } from '@/lib/utils';

interface Props {
  product: LendingProduct;
  onClose: () => void;
}

export function PricingSimulatorModal({ product, onClose }: Props) {
  const [loanAmount, setLoanAmount] = useState<number>(
    product.defaultAmount || Math.round((product.minAmount + product.maxAmount) / 2)
  );
  const [tenureMonths, setTenureMonths] = useState<number>(
    product.allowedTenures?.[1] || product.minTenureMonths
  );
  const [cibilScore, setCibilScore] = useState<number>(750);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(65000);
  const [existingEmis, setExistingEmis] = useState<number>(8000);

  const simulateMutation = useSimulatePricing();

  const runSimulation = () => {
    simulateMutation.mutate({
      productId: product.id,
      loanAmount,
      tenureMonths,
      applicantProfile: {
        cibilScore,
        monthlyIncome,
        existingEmis,
      },
    });
  };

  useEffect(() => {
    runSimulation();
  }, [loanAmount, tenureMonths, cibilScore, monthlyIncome, existingEmis]);

  const sim = simulateMutation.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">RBI KFS & Pricing Simulator</h2>
                <Badge variant="info" className="text-[10px]">
                  {product.name}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate monthly installments, statutory APR, and Key Fact Statement breakdown.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/60">
          {/* Left: Interactive Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Loan Amount Slider */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase">Sanction Amount</label>
                <span className="text-sm font-bold text-white font-mono">₹{loanAmount.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={product.minAmount}
                max={product.maxAmount}
                step={product.amountIncrement || 5000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>₹{(product.minAmount / 1000).toFixed(0)}k</span>
                <span>₹{(product.maxAmount / 100000).toFixed(1)}L</span>
              </div>
            </div>

            {/* Tenure Slider */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-400 uppercase">Tenure (Months)</label>
                <span className="text-sm font-bold text-white font-mono">{tenureMonths} Months</span>
              </div>
              <input
                type="range"
                min={product.minTenureMonths}
                max={product.maxTenureMonths}
                step={1}
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{product.minTenureMonths}m</span>
                <span>{product.maxTenureMonths}m</span>
              </div>
            </div>

            {/* Applicant Bureau Profile */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Borrower Assessment Profile
              </h4>

              <div>
                <label className="text-[11px] text-slate-400">CIBIL Bureau Score</label>
                <input
                  type="number"
                  value={cibilScore}
                  onChange={(e) => setCibilScore(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Monthly Net Income (₹)</label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400">Existing Monthly Obligations / EMIs (₹)</label>
                <input
                  type="number"
                  value={existingEmis}
                  onChange={(e) => setExistingEmis(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Right: Simulation & KFS Output (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {simulateMutation.isPending && !sim ? (
              <div className="flex items-center justify-center p-16 text-slate-400">
                <Spinner />
                <span className="ml-2 text-xs">Simulating loan pricing...</span>
              </div>
            ) : sim ? (
              <>
                {/* Main KPI Highlight Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/20 shadow-lg text-center">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Monthly EMI</p>
                    <p className="text-xl font-extrabold text-blue-400 mt-1">₹{sim.monthlyEmi.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-500">per month</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Statutory APR</p>
                    <p className="text-xl font-extrabold text-emerald-400 mt-1">{sim.annualPercentageRateApr}%</p>
                    <p className="text-[10px] text-slate-500">effective annual</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <p className="text-[10px] uppercase font-semibold text-slate-400">Net Disbursement</p>
                    <p className="text-xl font-extrabold text-white mt-1">₹{sim.netDisbursedAmount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-500">post fee deduction</p>
                  </div>
                </div>

                {/* Key Fact Statement (KFS) Table */}
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-blue-400" />
                      Key Fact Statement (KFS)
                    </span>
                    <span className="text-[10px] font-normal text-slate-400">RBI Regulatory Format</span>
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs divide-y divide-slate-800">
                    <div className="pt-1.5 flex justify-between">
                      <span className="text-slate-400">Sanction Amount:</span>
                      <span className="font-semibold text-white">₹{sim.loanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-1.5 flex justify-between">
                      <span className="text-slate-400">Interest Type:</span>
                      <span className="font-semibold text-slate-200">{sim.keyFactStatement.rateOfInterestType}</span>
                    </div>
                    <div className="pt-1.5 flex justify-between">
                      <span className="text-slate-400">Applied Interest Rate:</span>
                      <span className="font-semibold text-emerald-400">{sim.appliedInterestRateAnnualPct}% p.a.</span>
                    </div>
                    <div className="pt-1.5 flex justify-between">
                      <span className="text-slate-400">Total Interest Payable:</span>
                      <span className="font-semibold text-white">₹{sim.totalInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-1.5 flex justify-between">
                      <span className="text-slate-400">Processing Fee (incl. 18% GST):</span>
                      <span className="font-semibold text-slate-200">₹{sim.keyFactStatement.processingFeeWithGst}</span>
                    </div>
                    <div className="pt-1.5 flex justify-between">
                      <span className="text-slate-400">Documentation Fee:</span>
                      <span className="font-semibold text-slate-200">₹{sim.keyFactStatement.documentationFee}</span>
                    </div>
                    <div className="pt-1.5 flex justify-between">
                      <span className="text-slate-400">Total Repayment:</span>
                      <span className="font-bold text-blue-300">₹{sim.totalRepaymentAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="pt-1.5 flex justify-between">
                      <span className="text-slate-400">Cooling-off Period:</span>
                      <span className="font-semibold text-slate-200">{sim.keyFactStatement.coolingOffPeriodDays} Business Days</span>
                    </div>
                  </div>
                </div>

                {/* Eligibility Check Banner */}
                <div
                  className={cn(
                    'p-4 rounded-xl border flex items-start gap-3',
                    sim.eligibilityCheck.eligible
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  )}
                >
                  {sim.eligibilityCheck.eligible ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="text-xs font-bold uppercase">
                      {sim.eligibilityCheck.eligible
                        ? 'Applicant Pre-Eligible Under Policy'
                        : 'Policy Variance Detected'}
                    </h5>
                    {sim.eligibilityCheck.computedFoirPct != null && (
                      <p className="text-[11px] mt-0.5 text-slate-300">
                        Computed FOIR: <strong>{sim.eligibilityCheck.computedFoirPct}%</strong> (Max Cap:{' '}
                        {product.creditPolicy?.maxFoirPct}%)
                      </p>
                    )}
                    {sim.eligibilityCheck.reasons.length > 0 && (
                      <ul className="text-[11px] list-disc list-inside mt-1 text-amber-200 space-y-0.5">
                        {sim.eligibilityCheck.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
