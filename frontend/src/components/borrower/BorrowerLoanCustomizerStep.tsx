'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Coins,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';
import { BorrowerFormData, LoanProductOption } from './BorrowerTypes';
import { api } from '@/lib/api';
import { Button } from '@/components/ui';
import { cn, formatMoney } from '@/lib/utils';

interface Props {
  formData: BorrowerFormData;
  updateField: <K extends keyof BorrowerFormData>(key: K, value: BorrowerFormData[K]) => void;
  onNext: () => void;
  onBack: () => void;
  isDark: boolean;
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 300000, 500000, 1000000];
const TENURE_OPTIONS = [6, 12, 18, 24, 36, 48, 60];

export const BorrowerLoanCustomizerStep: React.FC<Props> = ({
  formData,
  updateField,
  onNext,
  onBack,
  isDark,
}) => {
  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  // Fetch real loan products from backend
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['public-loan-products'],
    queryFn: async () => {
      const res = await api.get('/apply/products');
      return res.data.data as LoanProductOption[];
    },
  });

  const products = productsData || [];
  const selectedProduct =
    products.find((p) => p.id === formData.selectedProductId) ||
    products[0] || {
      id: 'default-product',
      code: 'PL01',
      name: 'Adyapan Prime Personal Loan',
      productType: 'PERSONAL',
      minAmount: 25000,
      maxAmount: 1500000,
      interestRate: 12.5,
      interestMethod: 'REDUCING',
      minTenureMonths: 6,
      maxTenureMonths: 60,
      processingFeePct: 1.5,
    };

  // Set default product ID if empty
  useEffect(() => {
    if (!formData.selectedProductId && products.length > 0) {
      updateField('selectedProductId', products[0].id);
    }
  }, [products, formData.selectedProductId, updateField]);

  // Actuarial Reducing Balance EMI formula
  const principal = formData.requestedAmount || 100000;
  const annualRate = selectedProduct.interestRate || 12.5;
  const monthlyRate = annualRate / 12 / 100;
  const tenure = formData.tenureMonths || 24;

  const emi = Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
      (Math.pow(1 + monthlyRate, tenure) - 1)
  );

  const totalRepayment = emi * tenure;
  const totalInterest = totalRepayment - principal;
  const processingFee = Math.round((principal * (selectedProduct.processingFeePct || 1.5)) / 100);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.selectedProductId && selectedProduct.id) {
      updateField('selectedProductId', selectedProduct.id);
    }
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Step Header */}
      <div className={cn('p-6 rounded-3xl border space-y-2', cardBgClass)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Step 7: Customize Loan Amount & Tenure</h2>
            <p className="text-xs text-slate-400">
              Select your loan product scheme, fine-tune the borrowing amount, and inspect live EMI breakdown
            </p>
          </div>
        </div>
      </div>

      {/* Product Selection Cards */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
            Select Loan Scheme
          </h3>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {products.length} Active Schemes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {products.map((p) => {
            const isSelected = selectedProduct.id === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => updateField('selectedProductId', p.id)}
                className={cn(
                  'p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-36',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : isDark
                    ? 'border-[#2B3566] bg-[#060F1B]/60 text-slate-400 hover:border-slate-700'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono">
                      {p.code}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                      {p.name}
                    </h4>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-[#2B3566]/60 text-[11px] space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Interest Rate:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {p.interestRate}% p.a.
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Max Borrowing:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatMoney(p.maxAmount)}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Amount Slider & Presets */}
      <div className={cn('p-6 rounded-3xl border space-y-6', cardBgClass)}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
              Select Desired Loan Amount
            </h3>
            <p className="text-xs text-slate-400">Adjust the slider or pick a quick amount preset</p>
          </div>
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
              {formatMoney(formData.requestedAmount)}
            </span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min={selectedProduct.minAmount || 25000}
            max={selectedProduct.maxAmount || 1500000}
            step={5000}
            value={formData.requestedAmount}
            onChange={(e) => updateField('requestedAmount', Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Min: {formatMoney(selectedProduct.minAmount || 25000)}</span>
            <span>Max: {formatMoney(selectedProduct.maxAmount || 1500000)}</span>
          </div>
        </div>

        {/* Quick Amount Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {PRESET_AMOUNTS.map((amt) => {
            const isCurrent = formData.requestedAmount === amt;
            return (
              <button
                key={amt}
                type="button"
                onClick={() => updateField('requestedAmount', amt)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                  isCurrent
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : isDark
                    ? 'bg-[#060F1B] border border-[#2B3566] text-slate-300 hover:border-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                {formatMoney(amt)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tenure Selector */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
              Loan Repayment Tenure
            </h3>
            <p className="text-xs text-slate-400">Select total duration in months</p>
          </div>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
            {formData.tenureMonths} Months ({Math.round(formData.tenureMonths / 12)} Years)
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-7 gap-2.5">
          {TENURE_OPTIONS.map((t) => {
            const isSelected = formData.tenureMonths === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => updateField('tenureMonths', t)}
                className={cn(
                  'p-3 rounded-2xl border text-center transition-all',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold ring-2 ring-blue-500/20'
                    : isDark
                    ? 'border-[#2B3566] bg-[#060F1B]/60 text-slate-400 hover:border-slate-700'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300'
                )}
              >
                <span className="text-xs block">{t} Mo</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {t >= 12 ? `${(t / 12).toFixed(1)} yr` : `${t} m`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Actuarial EMI Breakdown Grid */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Live Actuarial Repayment Summary</span>
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            Method: {selectedProduct.interestMethod || 'Reducing Balance'}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium block">
              Monthly Installment (EMI)
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-1 block">
              {formatMoney(emi)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">per month</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/80 dark:border-[#2B3566]">
            <span className="text-slate-400 text-[11px] font-medium block">Total Interest</span>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono mt-1 block">
              {formatMoney(totalInterest)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">over {tenure} months</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/80 dark:border-[#2B3566]">
            <span className="text-slate-400 text-[11px] font-medium block">Processing Fee</span>
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-mono mt-1 block">
              {formatMoney(processingFee)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              ({selectedProduct.processingFeePct || 1.5}% + GST)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/80 dark:border-[#2B3566]">
            <span className="text-slate-400 text-[11px] font-medium block">Total Repayment</span>
            <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
              {formatMoney(totalRepayment)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Principal + Interest</span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="text-xs flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back: Bank Account</span>
        </Button>

        <Button
          type="submit"
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-8 py-3 rounded-xl shadow-md flex items-center gap-2"
        >
          <span>Next: Document Upload</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};
