'use client';

import React, { useState } from 'react';
import {
  Zap,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import type { BorrowerCreditFacility, BorrowerDrawdownItem } from '../types';
import { useRequestDrawdown } from '../hooks/useBorrower';

interface CreditLineManagerProps {
  facilities: BorrowerCreditFacility[];
  onRefresh?: () => void;
}

export const CreditLineManager: React.FC<CreditLineManagerProps> = ({ facilities, onRefresh }) => {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(facilities[0]?.id || '');
  const [isDrawdownModalOpen, setIsDrawdownModalOpen] = useState(false);
  const [drawdownAmount, setDrawdownAmount] = useState<number>(10000);
  const [drawdownTenure, setDrawdownTenure] = useState<number>(12);
  const [drawdownSuccessItem, setDrawdownSuccessItem] = useState<BorrowerDrawdownItem | null>(null);

  const drawdownMutation = useRequestDrawdown();

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId) || facilities[0];

  if (!facilities || facilities.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Zap className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Revolving Credit Facilities</h3>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          You do not have an active revolving credit facility or credit line sanctioned yet. Apply for a pre-approved line of credit for instant anytime drawdowns.
        </p>
      </div>
    );
  }

  const utilizationPercent = selectedFacility
    ? Math.min(100, Math.round((selectedFacility.utilizedAmount / selectedFacility.approvedLimit) * 100))
    : 0;

  // Real-time fee and disbursement calculations
  const processingFee = Math.round(drawdownAmount * 0.005); // 0.5% drawdown fee
  const feeGst = Math.round(processingFee * 0.18); // 18% GST
  const netDisbursed = drawdownAmount - (processingFee + feeGst);

  // Approximate monthly EMI calculation for preview (P * r * (1+r)^n / ((1+r)^n - 1))
  const monthlyRate = (selectedFacility?.interestRatePct || 14.5) / 12 / 100;
  const estimatedEmi = Math.round(
    (drawdownAmount * monthlyRate * Math.pow(1 + monthlyRate, drawdownTenure)) /
      (Math.pow(1 + monthlyRate, drawdownTenure) - 1)
  );

  const handleExecuteDrawdown = async () => {
    if (!selectedFacility || drawdownAmount <= 0) return;
    try {
      const res = await drawdownMutation.mutateAsync({
        facilityId: selectedFacility.id,
        amount: drawdownAmount,
        tenureMonths: drawdownTenure,
      });
      setDrawdownSuccessItem(res);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Drawdown request failed.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Selector if multiple credit lines */}
      {facilities.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {facilities.map((fac) => (
            <button
              key={fac.id}
              onClick={() => setSelectedFacilityId(fac.id)}
              className={`px-5 py-3 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedFacilityId === fac.id
                  ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Facility #{fac.facilityNo}</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {fac.status}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Main Credit Line Card */}
      {selectedFacility && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Facility Limits & Utilization */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 rounded-3xl p-6 lg:p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 flex items-center gap-1.5 w-fit">
                  <Sparkles className="w-3.5 h-3.5" />
                  Revolving Credit Facility
                </span>
                <h2 className="text-2xl font-bold text-white mt-2 flex items-center gap-3">
                  Facility #{selectedFacility.facilityNo}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {selectedFacility.status}
                  </span>
                </h2>
              </div>

              <button
                disabled={selectedFacility.availableLimit <= 0}
                onClick={() => {
                  setDrawdownAmount(Math.min(25000, selectedFacility.availableLimit));
                  setIsDrawdownModalOpen(true);
                  setDrawdownSuccessItem(null);
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                Instant Drawdown
              </button>
            </div>

            {/* Capacity Visualizer */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 mb-6">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Available Credit Limit</div>
                  <div className="text-3xl font-extrabold text-emerald-400 mt-0.5">
                    ₹{selectedFacility.availableLimit.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Total Sanctioned Limit</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    ₹{selectedFacility.approvedLimit.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden mt-3 p-0.5">
                <div
                  className="bg-gradient-to-r from-amber-400 to-rose-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${utilizationPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 mt-2">
                <span>Utilized: ₹{selectedFacility.utilizedAmount.toLocaleString('en-IN')} ({utilizationPercent}%)</span>
                <span>Interest: {selectedFacility.interestRatePct}% p.a.</span>
              </div>
            </div>

            {/* Facility Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5">
                <div className="text-xs text-slate-400">Interest Model</div>
                <div className="text-sm font-bold text-white mt-1">Charged on Utilized Sum Only</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5">
                <div className="text-xs text-slate-400">Restoration Mode</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">Instant Limit Top-up on Repayment</div>
              </div>
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3.5">
                <div className="text-xs text-slate-400">Drawdown Speed</div>
                <div className="text-sm font-bold text-amber-400 mt-1">Direct Bank Payout (2 Mins)</div>
              </div>
            </div>
          </div>

          {/* Quick Perks / Limit Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4" />
                Credit Line Benefits
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Anytime Liquidity</h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Withdraw only what you need, multiple times up to ₹{selectedFacility.availableLimit.toLocaleString('en-IN')}.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Zero interest charged on unutilized credit balance.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Each monthly repayment automatically restores your available credit limit.</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                disabled={selectedFacility.availableLimit <= 0}
                onClick={() => {
                  setDrawdownAmount(Math.min(25000, selectedFacility.availableLimit));
                  setIsDrawdownModalOpen(true);
                  setDrawdownSuccessItem(null);
                }}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                Request Instant Drawdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawdown History Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Drawdown & Disbursement Log</h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological record of all funds drawn from your credit line</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Drawdown #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Fee + GST</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Tenure / EMI</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {selectedFacility?.drawdowns && selectedFacility.drawdowns.length > 0 ? (
                selectedFacility.drawdowns.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-amber-400">{item.drawdownNo}</td>
                    <td className="py-3.5 px-4 text-slate-300 font-medium">
                      {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">₹{item.requestedAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-slate-400">₹{(item.feeAmount + item.feeGst).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">₹{item.netDisbursedAmount.toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {item.tenureMonths} Mo • ₹{item.monthlyEmi?.toLocaleString('en-IN') || '—'}/mo
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'ACTIVE' || item.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          Disbursed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          Processing
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No drawdowns made from this facility yet. Click &quot;Instant Drawdown&quot; to withdraw funds.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawdown Request Modal */}
      {isDrawdownModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 lg:p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Direct Bank Transfer</span>
                <h3 className="text-xl font-bold text-white mt-1">Instant Drawdown Portal</h3>
              </div>
              <Zap className="w-6 h-6 text-amber-400" />
            </div>

            {drawdownSuccessItem ? (
              <div className="space-y-4">
                <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-lg font-bold text-emerald-300">Drawdown Sanctioned & Queued!</h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Drawdown Reference #{drawdownSuccessItem.drawdownNo}
                  </p>
                  <div className="text-2xl font-extrabold text-white mt-3">
                    ₹{drawdownSuccessItem.requestedAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Net Disbursed to Bank:</span>
                    <span className="text-emerald-400 font-bold">₹{drawdownSuccessItem.netDisbursedAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Repayment EMI:</span>
                    <span className="text-white font-semibold">₹{drawdownSuccessItem.monthlyEmi?.toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tenure:</span>
                    <span className="text-white font-semibold">{drawdownSuccessItem.tenureMonths} Months</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawdownModalOpen(false)}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
                >
                  Done & View Updated Facility
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Drawdown Amount Slider */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-semibold text-slate-300">Drawdown Amount</label>
                    <span className="text-xs text-slate-400">
                      Available: ₹{selectedFacility.availableLimit.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={1000}
                      max={selectedFacility.availableLimit}
                      value={drawdownAmount}
                      onChange={(e) => setDrawdownAmount(Math.min(selectedFacility.availableLimit, Math.max(0, Number(e.target.value))))}
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={selectedFacility.availableLimit}
                    step={1000}
                    value={drawdownAmount}
                    onChange={(e) => setDrawdownAmount(Number(e.target.value))}
                    className="w-full mt-3 accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Tenure Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Repayment Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 6, 12, 24].map((tenure) => (
                      <button
                        key={tenure}
                        type="button"
                        onClick={() => setDrawdownTenure(tenure)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          drawdownTenure === tenure
                            ? 'bg-amber-500/20 border-amber-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {tenure} Months
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transparency Breakdown */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Drawdown Requested:</span>
                    <span className="text-white font-semibold">₹{drawdownAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Drawdown Fee (0.5% + 18% GST):</span>
                    <span className="text-rose-400 font-semibold">- ₹{(processingFee + feeGst).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                    <span className="font-semibold text-white">Net Credit to Bank Account:</span>
                    <span className="text-emerald-400 font-bold text-sm">₹{netDisbursed.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Estimated Monthly Installment:</span>
                    <span className="text-amber-300 font-semibold">≈ ₹{estimatedEmi.toLocaleString('en-IN')}/mo</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDrawdownModalOpen(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={drawdownMutation.isPending || drawdownAmount <= 0 || drawdownAmount > selectedFacility.availableLimit}
                    onClick={handleExecuteDrawdown}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {drawdownMutation.isPending ? 'Processing...' : `Disburse ₹${netDisbursed.toLocaleString('en-IN')}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
