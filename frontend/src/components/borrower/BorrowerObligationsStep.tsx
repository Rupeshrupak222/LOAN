'use client';

import React from 'react';
import {
  ShieldAlert,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  PieChart,
  HelpCircle,
  Coins,
} from 'lucide-react';
import { BorrowerFormData } from './BorrowerTypes';
import { Button, Input } from '@/components/ui';
import { cn, formatMoney } from '@/lib/utils';

interface Props {
  formData: BorrowerFormData;
  updateField: <K extends keyof BorrowerFormData>(key: K, value: BorrowerFormData[K]) => void;
  onNext: () => void;
  onBack: () => void;
  isDark: boolean;
}

export const BorrowerObligationsStep: React.FC<Props> = ({
  formData,
  updateField,
  onNext,
  onBack,
  isDark,
}) => {
  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const monthlyIncome = formData.monthlyIncome || 1;
  const obligations = formData.hasExistingLoans ? formData.existingObligations || 0 : 0;
  const dtiRatio = Math.round((obligations / monthlyIncome) * 100);

  const isDtiHealthy = dtiRatio <= 35;
  const isDtiModerate = dtiRatio > 35 && dtiRatio <= 50;

  const handleToggleLoans = (hasLoans: boolean) => {
    updateField('hasExistingLoans', hasLoans);
    if (!hasLoans) {
      updateField('existingObligations', 0);
      updateField('totalMonthlyEmi', 0);
      updateField('totalOutstandingAmount', 0);
      updateField('activeLoansCount', 0);
    } else {
      if (!formData.existingObligations) {
        updateField('existingObligations', 10000);
        updateField('totalMonthlyEmi', 10000);
        updateField('activeLoansCount', 1);
      }
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleNext} className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Step Header */}
      <div className={cn('p-6 rounded-3xl border space-y-2', cardBgClass)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Step 4: Financial Obligations & Existing Loans</h2>
            <p className="text-xs text-slate-400">
              Disclose active borrowing to help us evaluate your debt-to-income (DTI) capacity accurately
            </p>
          </div>
        </div>
      </div>

      {/* Main Binary Toggle Card */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
          Do you currently have any running loans or credit card EMIs?
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleToggleLoans(false)}
            className={cn(
              'p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-32',
              !formData.hasExistingLoans
                ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                : isDark
                ? 'border-[#2B3566] bg-[#060F1B]/60 text-slate-400 hover:border-slate-700'
                : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                No Existing Loans
              </span>
              {!formData.hasExistingLoans && (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              I have zero active personal loans, car loans, home loans, or running credit card EMIs.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleToggleLoans(true)}
            className={cn(
              'p-5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-32',
              formData.hasExistingLoans
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20'
                : isDark
                ? 'border-[#2B3566] bg-[#060F1B]/60 text-slate-400 hover:border-slate-700'
                : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Yes, Servicing Loans / EMIs
              </span>
              {formData.hasExistingLoans && (
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              I currently pay monthly installments towards one or more existing active loans or credit cards.
            </p>
          </button>
        </div>
      </div>

      {/* Conditional Details If Existing Loans */}
      {formData.hasExistingLoans && (
        <div className={cn('p-6 rounded-3xl border space-y-5 animate-fade-in', cardBgClass)}>
          <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Coins className="w-4 h-4 text-blue-500" />
            <span>Active Loan Commitments</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Number of Active Loans
              </label>
              <select
                value={formData.activeLoansCount || 1}
                onChange={(e) => updateField('activeLoansCount', Number(e.target.value))}
                className={cn(
                  'w-full h-10 rounded-xl border px-3 text-xs font-medium focus:outline-none focus:border-[#2563EB]',
                  isDark
                    ? 'border-[#2B3566] bg-[#060F1B] text-slate-200'
                    : 'border-slate-200 bg-white text-slate-800'
                )}
              >
                <option value={1}>1 Active Loan / Card</option>
                <option value={2}>2 Active Loans</option>
                <option value={3}>3 Active Loans</option>
                <option value={4}>4 or More Loans</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Total Monthly EMI Paid (₹) *
              </label>
              <Input
                type="number"
                step={500}
                min={0}
                value={formData.existingObligations}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateField('existingObligations', val);
                  updateField('totalMonthlyEmi', val);
                }}
                className="text-xs font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Declared: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatMoney(formData.existingObligations)}</span> / mo
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Estimated Total Outstanding Debt (₹)
              </label>
              <Input
                type="number"
                step={10000}
                min={0}
                placeholder="e.g. 150000"
                value={formData.totalOutstandingAmount || ''}
                onChange={(e) => updateField('totalOutstandingAmount', Number(e.target.value))}
                className="text-xs font-mono"
              />
            </div>
          </div>

          {/* DTI Capacity Gauge */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/80 dark:border-[#2B3566] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5 text-blue-500" />
                <span>Debt-to-Income (DTI) Utilization</span>
              </span>
              <span
                className={cn(
                  'font-bold font-mono',
                  isDtiHealthy ? 'text-emerald-500' : isDtiModerate ? 'text-amber-500' : 'text-rose-500'
                )}
              >
                {dtiRatio}% of Income
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  isDtiHealthy ? 'bg-emerald-500' : isDtiModerate ? 'bg-amber-500' : 'bg-rose-500'
                )}
                style={{ width: `${Math.min(dtiRatio, 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400">
              {isDtiHealthy
                ? 'Your DTI ratio is within the optimal regulatory zone (under 35%), allowing maximum borrowing eligibility.'
                : isDtiModerate
                ? 'Your DTI ratio is moderate (35% - 50%). Loans can be approved with standard underwriting.'
                : 'Your DTI ratio is above 50%. A longer tenure is recommended to reduce monthly EMI burden.'}
            </p>
          </div>
        </div>
      )}

      {/* Bureau Transparency Note */}
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <span>
          <strong>Why is this needed?</strong> We cross-verify credit commitments with registered Credit Information Companies (CIBIL / Experian / CRIF High Mark) to calculate precise loan affordability without manual paperwork.
        </span>
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
          <span>Back: Employment</span>
        </Button>

        <Button
          type="submit"
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-8 py-3 rounded-xl shadow-md flex items-center gap-2"
        >
          <span>Next: KYC Identity Verification</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};
