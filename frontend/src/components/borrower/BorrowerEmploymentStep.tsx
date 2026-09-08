'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  Building,
  Calendar,
  Wallet,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileSpreadsheet,
  Award,
  CheckCircle2,
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

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const BorrowerEmploymentStep: React.FC<Props> = ({
  formData,
  updateField,
  onNext,
  onBack,
  isDark,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-sm';

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (formData.employmentType === 'SALARIED') {
      if (!formData.employerName.trim()) {
        errs.employerName = 'Employer / Company name is required';
      }
    } else if (formData.employmentType === 'BUSINESS' || formData.employmentType === 'SELF_EMPLOYED') {
      if (!formData.employerName.trim()) {
        errs.employerName = 'Registered Business / Enterprise name is required';
      }
      if (formData.gstin && formData.gstin.trim()) {
        const cleanGst = formData.gstin.trim().toUpperCase();
        if (!GSTIN_REGEX.test(cleanGst)) {
          errs.gstin = 'Invalid GSTIN format (e.g. 27AAAAA0000A1Z5)';
        }
      }
    } else if (formData.employmentType === 'PROFESSIONAL') {
      if (!formData.profession || !formData.profession.trim()) {
        errs.profession = 'Professional specialization is required';
      }
      if (!formData.employerName.trim()) {
        errs.employerName = 'Firm / Clinic / Practice name is required';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleNext} className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Step Header */}
      <div className={cn('p-6 rounded-3xl border space-y-2', cardBgClass)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Step 3: Employment & Income Profile</h2>
            <p className="text-xs text-slate-400">
              Provide your occupation and income source details for credit appraisal
            </p>
          </div>
        </div>
      </div>

      {/* Employment Category Selector */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
          Employment Category
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { type: 'SALARIED', label: 'Salaried Employee', desc: 'MNC, Govt, Pvt Ltd' },
            { type: 'SELF_EMPLOYED', label: 'Self-Employed', desc: 'Freelance, Sole Trader' },
            { type: 'BUSINESS', label: 'Business Owner', desc: 'MSME, Enterprise, Partnership' },
            { type: 'PROFESSIONAL', label: 'Professional', desc: 'Doctor, CA, Lawyer, Architect' },
          ].map((item) => {
            const isSelected = formData.employmentType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => updateField('employmentType', item.type as any)}
                className={cn(
                  'p-3.5 rounded-2xl border text-left transition-all relative',
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                    : isDark
                    ? 'border-[#2B3566] bg-[#060F1B]/60 text-slate-400 hover:border-slate-700'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300'
                )}
              >
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 absolute top-3 right-3" />
                )}
                <p className="font-bold text-xs text-slate-900 dark:text-white">{item.label}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Fields Based on Category */}
      <div className={cn('p-6 rounded-3xl border space-y-5', cardBgClass)}>
        <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Building className="w-4 h-4 text-blue-500" />
          <span>
            {formData.employmentType === 'SALARIED'
              ? 'Corporate & Salary Information'
              : formData.employmentType === 'PROFESSIONAL'
              ? 'Professional Practice Information'
              : 'Enterprise & Business Information'}
          </span>
        </h3>

        {/* Salaried Fields */}
        {formData.employmentType === 'SALARIED' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Employer / Company Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Tata Consultancy Services Ltd"
                  value={formData.employerName}
                  onChange={(e) => {
                    updateField('employerName', e.target.value);
                    if (errors.employerName) setErrors((prev) => ({ ...prev, employerName: '' }));
                  }}
                  className="text-xs"
                />
                {errors.employerName && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.employerName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Total Work Experience (Years)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={45}
                  value={formData.workExperienceYears || 1}
                  onChange={(e) => updateField('workExperienceYears', Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Net Monthly In-Hand Salary (₹)
                </label>
                <Input
                  type="number"
                  step={1000}
                  value={formData.monthlyIncome}
                  onChange={(e) => updateField('monthlyIncome', Number(e.target.value))}
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Formatted: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatMoney(formData.monthlyIncome)}</span> / month
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Office Location / Landmark (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. BKC, Bandra East, Mumbai"
                  value={formData.officeAddress || ''}
                  onChange={(e) => updateField('officeAddress', e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Business / Self Employed Fields */}
        {(formData.employmentType === 'BUSINESS' || formData.employmentType === 'SELF_EMPLOYED') && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Business / Trading Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Apex Engineering Solutions"
                  value={formData.employerName}
                  onChange={(e) => {
                    updateField('employerName', e.target.value);
                    if (errors.employerName) setErrors((prev) => ({ ...prev, employerName: '' }));
                  }}
                  className="text-xs"
                />
                {errors.employerName && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.employerName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Business Vintage (Years in Operation)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.businessDurationYears || 3}
                  onChange={(e) => updateField('businessDurationYears', Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Monthly Net Profit / Income (₹)
                </label>
                <Input
                  type="number"
                  step={5000}
                  value={formData.monthlyIncome}
                  onChange={(e) => updateField('monthlyIncome', Number(e.target.value))}
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Equivalent to <span className="font-semibold text-blue-600 dark:text-blue-400">{formatMoney(formData.monthlyIncome * 12)}</span> annual income
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  GSTIN (Optional, for MSME fast-track)
                </label>
                <Input
                  type="text"
                  maxLength={15}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={formData.gstin || ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    updateField('gstin', val);
                    if (errors.gstin) setErrors((prev) => ({ ...prev, gstin: '' }));
                  }}
                  className="text-xs font-mono uppercase"
                />
                {errors.gstin && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.gstin}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Professional Fields */}
        {formData.employmentType === 'PROFESSIONAL' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Profession *
                </label>
                <select
                  value={formData.profession || 'Doctor / Medical Practitioner'}
                  onChange={(e) => updateField('profession', e.target.value)}
                  className={cn(
                    'w-full h-10 rounded-xl border px-3 text-xs font-medium focus:outline-none focus:border-[#2563EB]',
                    isDark
                      ? 'border-[#2B3566] bg-[#060F1B] text-slate-200'
                      : 'border-slate-200 bg-white text-slate-800'
                  )}
                >
                  <option value="Doctor / Medical Practitioner">Doctor / Medical Practitioner</option>
                  <option value="Chartered Accountant (CA)">Chartered Accountant (CA)</option>
                  <option value="Advocate / Legal Consultant">Advocate / Legal Consultant</option>
                  <option value="Architect / Civil Consultant">Architect / Civil Consultant</option>
                  <option value="Management Consultant">Management Consultant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Practice / Clinic / Firm Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. City Dental & Healthcare Clinic"
                  value={formData.employerName}
                  onChange={(e) => {
                    updateField('employerName', e.target.value);
                    if (errors.employerName) setErrors((prev) => ({ ...prev, employerName: '' }));
                  }}
                  className="text-xs"
                />
                {errors.employerName && (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.employerName}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Monthly Professional Earnings (₹)
                </label>
                <Input
                  type="number"
                  step={5000}
                  value={formData.monthlyIncome}
                  onChange={(e) => updateField('monthlyIncome', Number(e.target.value))}
                  className="text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Declared: <span className="font-semibold text-blue-600 dark:text-blue-400">{formatMoney(formData.monthlyIncome)}</span> / month
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Years of Professional Practice
                </label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.workExperienceYears || 3}
                  onChange={(e) => updateField('workExperienceYears', Number(e.target.value))}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        )}
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
          <span>Back: Personal Info</span>
        </Button>

        <Button
          type="submit"
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-8 py-3 rounded-xl shadow-md flex items-center gap-2"
        >
          <span>Next: Financial Obligations</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};
