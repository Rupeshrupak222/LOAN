'use client';

import React, { useState } from 'react';
import { useOfferSimulation } from '../hooks/useOffers';
import type { RiskGrade, InterestModelType, OfferSimulationResult } from '../types';
import {
  Sparkles,
  Calculator,
  X,
  ArrowRight,
  ShieldCheck,
  Percent,
  Calendar,
  IndianRupee,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface OfferSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  defaultTenure?: number;
  defaultRiskGrade?: RiskGrade;
}

export const OfferSimulatorModal: React.FC<OfferSimulatorModalProps> = ({
  isOpen,
  onClose,
  defaultAmount = 250000,
  defaultTenure = 24,
  defaultRiskGrade = 'B',
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(defaultAmount);
  const [tenureMonths, setTenureMonths] = useState<number>(defaultTenure);
  const [riskGrade, setRiskGrade] = useState<RiskGrade>(defaultRiskGrade);
  const [interestModel, setInterestModel] = useState<InterestModelType>('REDUCING_BALANCE');
  const [customRate, setCustomRate] = useState<string>('');
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  const simulateMutation = useOfferSimulation();
  const result: OfferSimulationResult | undefined = simulateMutation.data;

  if (!isOpen) return null;

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    simulateMutation.mutate({
      loanAmount,
      tenureMonths,
      riskGrade,
      interestModel,
      customRatePct: customRate ? parseFloat(customRate) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Loan Offer & Pricing Simulator</h3>
              <p className="text-xs text-slate-400">Stateless simulation of EMI, fee breakdown, GST, APR, and KFS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Controls Form */}
          <form onSubmit={handleSimulate} className="col-span-12 p-6 md:col-span-5 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300">Sanction / Loan Amount (₹)</label>
              <div className="relative mt-1">
                <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  min={10000}
                  max={10000000}
                  step={5000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                <span>₹50K</span>
                <span>₹2.5L</span>
                <span>₹5.0L</span>
                <span>₹10L+</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Tenure (Months)</label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="number"
                  min={3}
                  max={84}
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-9 pr-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
              <div className="mt-2 flex gap-1.5">
                {[6, 12, 24, 36, 48].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTenureMonths(t)}
                    className={`flex-1 rounded py-1 text-xs font-medium transition ${
                      tenureMonths === t ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {t}M
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300">Applicant Risk Grade</label>
              <div className="mt-1.5 grid grid-cols-5 gap-1.5">
                {(['A', 'B', 'C', 'D', 'E'] as RiskGrade[]).map((rg) => (
                  <button
                    key={rg}
                    type="button"
                    onClick={() => setRiskGrade(rg)}
                    className={`rounded-lg py-2 text-xs font-bold transition ${
                      riskGrade === rg
                        ? rg === 'A' || rg === 'B'
                          ? 'bg-emerald-600 text-white'
                          : rg === 'C'
                          ? 'bg-amber-600 text-white'
                          : 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    Grade {rg}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Interest Model</label>
                <select
                  value={interestModel}
                  onChange={(e) => setInterestModel(e.target.value as InterestModelType)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="REDUCING_BALANCE">Reducing Balance</option>
                  <option value="FIXED_FLAT">Fixed Flat Rate</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Custom Rate (% p.a.)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Auto (Policy)"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={simulateMutation.isPending}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {simulateMutation.isPending ? 'Simulating...' : 'Run Simulation'}
            </button>
          </form>

          {/* Results Display */}
          <div className="col-span-12 flex flex-col p-6 md:col-span-7 overflow-y-auto">
            {result ? (
              <div className="space-y-5">
                {/* Highlight Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <p className="text-[11px] font-medium text-slate-400">Monthly EMI</p>
                    <p className="mt-1 text-lg font-bold text-white">₹{result.monthlyEmi.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-emerald-400">/{result.tenureMonths} months</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <p className="text-[11px] font-medium text-slate-400">Annual Rate</p>
                    <p className="mt-1 text-lg font-bold text-indigo-400">{result.annualInterestRatePct.toFixed(2)}%</p>
                    <p className="text-[10px] text-slate-500">{result.interestModel === 'REDUCING_BALANCE' ? 'Reducing' : 'Flat'}</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <p className="text-[11px] font-medium text-slate-400">Statutory APR</p>
                    <p className="mt-1 text-lg font-bold text-amber-400">{result.annualPercentageRateApr.toFixed(2)}%</p>
                    <p className="text-[10px] text-slate-500">RBI Regulated</p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
                    <p className="text-[11px] font-medium text-slate-400">Net Disbursed</p>
                    <p className="mt-1 text-lg font-bold text-emerald-400">₹{result.netDisbursedAmount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-500">After Deductions</p>
                  </div>
                </div>

                {/* Financial Deductions & Repayment Summary */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Transparent Deduction & Repayment Summary</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Sanctioned Principal</span>
                      <span className="font-semibold text-white">₹{result.loanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Processing Fee ({result.processingFee.toLocaleString('en-IN')} + ₹{result.processingFeeGst} GST)</span>
                      <span className="text-rose-400">- ₹{(result.processingFee + result.processingFeeGst).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Documentation Charges (incl. 18% GST)</span>
                      <span className="text-rose-400">- ₹{(result.documentationCharges + result.documentationChargesGst).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2 font-medium text-slate-200">
                      <span>Net Cash in Bank</span>
                      <span className="text-emerald-400">₹{result.netDisbursedAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-800 pt-2 text-slate-400">
                      <span>Total Interest Over {result.tenureMonths} Months</span>
                      <span className="text-indigo-300">₹{result.totalInterest.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white">
                      <span>Total Repayment Amount</span>
                      <span>₹{result.totalRepayment.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Preview Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    {showSchedule ? 'Hide Amortization Schedule' : 'View First 6 Months Repayment Schedule'}
                  </button>
                </div>

                {showSchedule && (
                  <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-medium text-slate-400">
                        <tr>
                          <th className="px-3 py-2">Month</th>
                          <th className="px-3 py-2">Principal</th>
                          <th className="px-3 py-2">Interest</th>
                          <th className="px-3 py-2">EMI</th>
                          <th className="px-3 py-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {result.schedulePreview.slice(0, 6).map((row) => (
                          <tr key={row.emiNumber} className="hover:bg-slate-900/50">
                            <td className="px-3 py-1.5 font-medium text-white">#{row.emiNumber}</td>
                            <td className="px-3 py-1.5">₹{parseFloat(row.principal).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5">₹{parseFloat(row.interest).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 font-semibold text-emerald-400">₹{parseFloat(row.emi).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-slate-400">₹{parseFloat(row.balance).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-500">
                <Calculator className="h-12 w-12 stroke-[1.2] text-slate-700" />
                <p className="mt-3 text-sm font-medium text-slate-400">Configure parameters on the left</p>
                <p className="text-xs text-slate-600">Click &quot;Run Simulation&quot; to calculate EMI, APR, and KFS key metrics</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
