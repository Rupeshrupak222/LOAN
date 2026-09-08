'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { BorrowerFormData, INDIAN_STATES } from './BorrowerTypes';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Props {
  formData: BorrowerFormData;
  updateField: <K extends keyof BorrowerFormData>(key: K, value: BorrowerFormData[K]) => void;
  onNext: () => void;
  onBack: () => void;
  isDark: boolean;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const PIN_REGEX = /^[1-9][0-9]{5}$/;
const MOBILE_REGEX = /^[6-9][0-9]{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const BorrowerPersonalStep: React.FC<Props> = ({
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

    if (!formData.firstName.trim()) errs.firstName = 'First name is required';
    if (!formData.lastName.trim()) errs.lastName = 'Last name is required';

    if (!formData.email.trim() || !EMAIL_REGEX.test(formData.email.trim())) {
      errs.email = 'Valid email address is required';
    }

    const cleanMobile = formData.mobile.replace(/\D/g, '');
    if (!cleanMobile || !MOBILE_REGEX.test(cleanMobile)) {
      errs.mobile = 'Enter a valid 10-digit Indian mobile number';
    }

    const upperPan = formData.pan.trim().toUpperCase();
    if (!upperPan || !PAN_REGEX.test(upperPan)) {
      errs.pan = 'Valid PAN is required (e.g., ABCDE1234F)';
    }

    if (!formData.dateOfBirth) {
      errs.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 18) {
        errs.dateOfBirth = 'Applicant must be at least 18 years old';
      }
    }

    if (!formData.addressLine1.trim()) errs.addressLine1 = 'Street address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.pincode.trim() || !PIN_REGEX.test(formData.pincode.trim())) {
      errs.pincode = 'Enter valid 6-digit postal PIN code';
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

  const isPanValid = PAN_REGEX.test(formData.pan.trim().toUpperCase());

  return (
    <form onSubmit={handleNext} className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Step Header */}
      <div className={cn('p-6 rounded-3xl border space-y-2', cardBgClass)}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Step 2: Personal & Identity Information</h2>
            <p className="text-xs text-slate-400">
              Please enter your full legal details as they appear on your government-issued documents
            </p>
          </div>
        </div>
      </div>

      {/* Basic Identity Grid */}
      <div className={cn('p-6 rounded-3xl border space-y-5', cardBgClass)}>
        <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300">
          Applicant Legal Identity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              First Name *
            </label>
            <Input
              type="text"
              placeholder="e.g. Rahul"
              value={formData.firstName}
              onChange={(e) => {
                updateField('firstName', e.target.value);
                if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: '' }));
              }}
              className="text-xs"
            />
            {errors.firstName && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.firstName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Middle Name (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Kumar"
              value={formData.middleName || ''}
              onChange={(e) => updateField('middleName', e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Last Name *
            </label>
            <Input
              type="text"
              placeholder="e.g. Sharma"
              value={formData.lastName}
              onChange={(e) => {
                updateField('lastName', e.target.value);
                if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: '' }));
              }}
              className="text-xs"
            />
            {errors.lastName && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.lastName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Date of Birth *</span>
            </label>
            <Input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => {
                updateField('dateOfBirth', e.target.value);
                if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: '' }));
              }}
              className="text-xs"
            />
            {errors.dateOfBirth && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.dateOfBirth}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Gender *
            </label>
            <select
              value={formData.gender}
              onChange={(e) => updateField('gender', e.target.value as any)}
              className={cn(
                'w-full h-10 rounded-xl border px-3 text-xs font-medium focus:outline-none focus:border-[#2563EB]',
                isDark
                  ? 'border-[#2B3566] bg-[#060F1B] text-slate-200'
                  : 'border-slate-200 bg-white text-slate-800'
              )}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                <span>Permanent Account Number (PAN) *</span>
              </span>
              {isPanValid && (
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Valid
                </span>
              )}
            </label>
            <Input
              type="text"
              maxLength={10}
              placeholder="e.g. ABCDE1234F"
              value={formData.pan}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                updateField('pan', val);
                if (errors.pan) setErrors((prev) => ({ ...prev, pan: '' }));
              }}
              className="text-xs font-mono tracking-wider uppercase"
            />
            {errors.pan && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.pan}
              </p>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-[#2B3566]">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              <span>Email Address (For e-Statements & Sanction Letters) *</span>
            </label>
            <Input
              type="email"
              placeholder="rahul.sharma@example.com"
              value={formData.email}
              onChange={(e) => {
                updateField('email', e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              className="text-xs"
            />
            {errors.email && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-500" />
              <span>Mobile Phone (10 digits) *</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">
                +91
              </span>
              <Input
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={formData.mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  updateField('mobile', val);
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: '' }));
                }}
                className="pl-12 text-xs font-mono"
              />
            </div>
            {errors.mobile && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.mobile}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Residential Address Grid */}
      <div className={cn('p-6 rounded-3xl border space-y-4', cardBgClass)}>
        <h3 className="text-sm font-bold tracking-tight text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span>Current Residential Address</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Flat / House No., Building Name, Street *
            </label>
            <Input
              type="text"
              placeholder="e.g. Flat 402, Lotus Residency, MG Road"
              value={formData.addressLine1}
              onChange={(e) => {
                updateField('addressLine1', e.target.value);
                if (errors.addressLine1) setErrors((prev) => ({ ...prev, addressLine1: '' }));
              }}
              className="text-xs"
            />
            {errors.addressLine1 && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.addressLine1}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Landmark / Area (Optional)
            </label>
            <Input
              type="text"
              placeholder="e.g. Near City Center Mall"
              value={formData.addressLine2 || ''}
              onChange={(e) => updateField('addressLine2', e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                City *
              </label>
              <Input
                type="text"
                placeholder="e.g. Mumbai"
                value={formData.city}
                onChange={(e) => {
                  updateField('city', e.target.value);
                  if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                }}
                className="text-xs"
              />
              {errors.city && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.city}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                State *
              </label>
              <select
                value={formData.state}
                onChange={(e) => updateField('state', e.target.value)}
                className={cn(
                  'w-full h-10 rounded-xl border px-3 text-xs font-medium focus:outline-none focus:border-[#2563EB]',
                  isDark
                    ? 'border-[#2B3566] bg-[#060F1B] text-slate-200'
                    : 'border-slate-200 bg-white text-slate-800'
                )}
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                PIN Code (6 digits) *
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="400001"
                value={formData.pincode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  updateField('pincode', val);
                  if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: '' }));
                }}
                className="text-xs font-mono"
              />
              {errors.pincode && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.pincode}
                </p>
              )}
            </div>
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
          <span>Back to Eligibility</span>
        </Button>

        <Button
          type="submit"
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-8 py-3 rounded-xl shadow-md flex items-center gap-2"
        >
          <span>Next: Employment Details</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};
