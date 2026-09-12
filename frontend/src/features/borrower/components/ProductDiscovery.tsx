import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Sliders,
  CreditCard,
  Building,
  ShieldCheck,
} from 'lucide-react';
import type { BorrowerLendingProduct } from '../types';
import { useBorrowerProducts } from '../hooks/useBorrower';

interface ProductDiscoveryProps {
  onSelectProduct: (product: BorrowerLendingProduct, amount: number, tenure: number) => void;
}

export const ProductDiscovery: React.FC<ProductDiscoveryProps> = ({ onSelectProduct }) => {
  const { data: products = [], isLoading } = useBorrowerProducts();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(100000);
  const [tenure, setTenure] = useState<number>(24);

  const activeProducts = products.filter((p) => p.isActive);
  const currentProduct = activeProducts.find((p) => p.id === selectedProductId) || activeProducts[0];

  // Calculate indicative monthly EMI
  const calculateIndicativeEmi = (principal: number, annualRatePct: number, tenureMonths: number): number => {
    if (principal <= 0 || tenureMonths <= 0) return 0;
    const monthlyRate = annualRatePct / 12 / 100;
    if (monthlyRate === 0) return Math.round(principal / tenureMonths);
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    return Math.round(emi);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const estimatedEmi = currentProduct
    ? calculateIndicativeEmi(amount, currentProduct.interestRate, tenure)
    : 0;

  return (
    <div className="space-y-6">
      {/* Discovery Hero Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Instant Digital Credit Discovery</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Select Your Tailored Credit Solution
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Transparent, competitive interest rates with instant decisioning and direct bank disbursement
            </p>
          </div>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeProducts.map((prod) => {
          const isSelected = (currentProduct?.id || '') === prod.id;
          return (
            <div
              key={prod.id}
              onClick={() => {
                setSelectedProductId(prod.id);
                setAmount(Math.min(Math.max(amount, prod.minAmount), prod.maxAmount));
                setTenure(Math.min(Math.max(tenure, prod.minTenureMonths), prod.maxTenureMonths));
              }}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-xl'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Layers className="w-5 h-5" />
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {prod.interestRate}% p.a.
                  </span>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">{prod.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {prod.description || 'Flexible digital credit facility with transparent terms.'}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Limit Range</div>
                    <div className="text-slate-200 font-semibold mt-0.5">
                      ₹{(prod.minAmount / 1000).toFixed(0)}k - ₹{(prod.maxAmount / 100000).toFixed(1)}L
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Tenure Window</div>
                    <div className="text-slate-200 font-semibold mt-0.5">
                      {prod.minTenureMonths} - {prod.maxTenureMonths} Mos
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-400">
                  {isSelected ? '✓ Selected Plan' : 'Choose Scheme'}
                </span>
                <span className="text-xs text-slate-400">
                  Fee: {prod.processingFeePct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Loan Customizer Card */}
      {currentProduct && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <span>Customize Your {currentProduct.name}</span>
              </h3>
              <p className="text-xs text-slate-400">Adjust amount and tenure to estimate your monthly EMI</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Amount Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">Required Loan Amount</label>
                  <span className="text-lg font-black text-white font-mono">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={currentProduct.minAmount}
                  max={currentProduct.maxAmount}
                  step={5000}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>₹{currentProduct.minAmount.toLocaleString('en-IN')}</span>
                  <span>₹{currentProduct.maxAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Tenure Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">Repayment Tenure</label>
                  <span className="text-lg font-black text-white font-mono">{tenure} Months</span>
                </div>
                <input
                  type="range"
                  min={currentProduct.minTenureMonths}
                  max={currentProduct.maxTenureMonths}
                  step={1}
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{currentProduct.minTenureMonths} Mos</span>
                  <span>{currentProduct.maxTenureMonths} Mos</span>
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Indicative Monthly EMI
                </div>
                <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
                  ₹{estimatedEmi.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  At {currentProduct.interestRate}% annual reducing rate
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Principal Amount:</span>
                    <span className="font-semibold text-white">₹{amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Total Tenure:</span>
                    <span className="font-semibold text-white">{tenure} Months</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Est. Processing Fee:</span>
                    <span className="font-semibold text-white">
                      ₹{Math.round((amount * currentProduct.processingFeePct) / 100).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectProduct(currentProduct, amount, tenure)}
                className="mt-6 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <span>Apply for this Loan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
