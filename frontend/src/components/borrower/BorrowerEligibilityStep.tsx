'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Calculator,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building,
  Briefcase,
  User,
  Coins,
  AlertCircle,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { BorrowerFormData, EligibilityResultData } from './BorrowerTypes';

interface Props {
  formData: BorrowerFormData;
  onChange: (fields: Partial<BorrowerFormData>) => void;
  onCalculated: (result: EligibilityResultData) => void;
  onBack?: () => void;
  isDark?: boolean;
}

export const BorrowerEligibilityStep: React.FC<Props> = ({
  formData,
  onChange,
  onCalculated,
  onBack,
  isDark,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckEligibility(e: React.FormEvent) {
    e.preventDefault();
    if (formData.monthlyIncome <= 0) {
      setError('Please enter a valid monthly in-hand income');
      return;
    }
    if (formData.requestedAmount <= 0) {
      setError('Please enter a valid requested loan amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        monthlyIncome: formData.monthlyIncome,
        employmentType: formData.employmentType,
        existingObligations: formData.existingObligations || 0,
        requestedAmount: formData.requestedAmount,
        tenureMonths: formData.tenureMonths,
        dateOfBirth: formData.dateOfBirth || undefined,
      };

      const res = await api.post('/eligibility/check', payload);
      if (res.data?.success && res.data?.data) {
        onCalculated(res.data.data);
      } else {
        throw new Error('Unexpected response format from eligibility engine');
      }
    } catch (err: any) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Instant Assessment Engine</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Check your loan eligibility
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Find out how much credit you can get based on your monthly income and current commitments in under 30 seconds.
        </p>
      </div>

      {/* Main Questionnaire Card */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-[#2B3566] bg-white dark:bg-[#0E1528] p-6 sm:p-8 shadow-card space-y-6">
        <form onSubmit={handleCheckEligibility} className="space-y-6">
          {/* 1. Monthly In-Hand Income */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
              1. Monthly In-Hand Income (₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative rounded-2xl shadow-xs">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min={10000}
                max={5000000}
                step={1000}
                required
                value={formData.monthlyIncome || ''}
                onChange={(e) => onChange({ monthlyIncome: Number(e.target.value) })}
                placeholder="e.g. 65,000"
                className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-[#2B3566] bg-slate-50 dark:bg-[#060F1B] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Net salary credited to your bank account or average monthly business profit.
            </p>
          </div>

          {/* 2. Employment Type */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
              2. Employment Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'SALARIED', label: 'Salaried', sub: 'Corporate / Govt' },
                { id: 'SELF_EMPLOYED', label: 'Self Employed', sub: 'Freelance / Trade' },
                { id: 'BUSINESS', label: 'Business', sub: 'Proprietor / MSME' },
                { id: 'PROFESSIONAL', label: 'Professional', sub: 'Doctor / CA / Lawyer' },
              ].map((item) => {
                const active = formData.employmentType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange({ employmentType: item.id as any })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-white shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-[#2B3566] bg-slate-50 dark:bg-[#060F1B] text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Existing Monthly Obligations / EMIs */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
              3. Total Existing Monthly EMIs (₹)
            </label>
            <div className="relative rounded-2xl shadow-xs">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min={0}
                max={2000000}
                step={500}
                value={formData.existingObligations || ''}
                onChange={(e) => onChange({ existingObligations: Number(e.target.value) })}
                placeholder="0 if you have no current loan EMIs"
                className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-[#2B3566] bg-slate-50 dark:bg-[#060F1B] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Combine existing home, car, or personal loan EMIs (used to calculate your debt-to-income ratio).
            </p>
          </div>

          {/* 4. Requested Amount & Preferred Tenure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Desired Loan (₹)
              </label>
              <div className="relative rounded-2xl shadow-xs">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min={25000}
                  max={1000000}
                  step={5000}
                  required
                  value={formData.requestedAmount || ''}
                  onChange={(e) => onChange({ requestedAmount: Number(e.target.value) })}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-[#2B3566] bg-slate-50 dark:bg-[#060F1B] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                Preferred Tenure
              </label>
              <select
                value={formData.tenureMonths}
                onChange={(e) => onChange({ tenureMonths: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-[#2B3566] bg-slate-50 dark:bg-[#060F1B] text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:border-blue-600 focus:bg-white transition-all font-mono"
              >
                <option value={6}>6 Months (Short Term)</option>
                <option value={12}>12 Months (1 Year)</option>
                <option value={18}>18 Months (1.5 Years)</option>
                <option value={24}>24 Months (2 Years)</option>
                <option value={36}>36 Months (3 Years)</option>
                <option value={48}>48 Months (4 Years)</option>
                <option value={60}>60 Months (5 Years)</option>
              </select>
            </div>
          </div>

          {/* Error notice */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Loading Animation or CTA Button */}
          {loading ? (
            <div className="py-6 text-center space-y-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
              <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Reviewing your information with Adyapan credit engine...
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Calculating debt-to-income capacity and fetching eligible schemes
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-5 py-4 rounded-2xl border border-slate-200 dark:border-[#2B3566] text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  ← Back
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Calculate My Loan Eligibility →</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Regulatory Disclaimer */}
          <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Soft eligibility check — does not impact your CIBIL credit score</span>
          </div>
        </form>
      </div>
    </div>
  );
};
