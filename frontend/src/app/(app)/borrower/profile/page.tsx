'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  User,
  ArrowLeft,
  ShieldCheck,
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Save,
  RefreshCw,
  FileText,
  BadgeCheck,
  Building,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Badge } from '@/components/ui';

interface ProfileSectionStatus {
  sectionKey: 'personal' | 'address' | 'employment' | 'kyc' | 'bank';
  title: string;
  isComplete: boolean;
  missingFields: string[];
}

interface BorrowerDetailedProfile {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dateOfBirth: string | null;
  gender: string | null;
  kycStatus: string;
  riskCategory: string | null;
  status: string;
  panNumberMasked: string | null;
  aadhaarMasked: string | null;
  primaryAddress: {
    addressLine: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    addressType: string;
  } | null;
  primaryEmployment: {
    employmentType: string | null;
    employerName: string | null;
    designation: string | null;
    monthlyIncome: number | null;
    existingObligations: number | null;
    workExperienceYears: number | null;
    institutionName: string | null;
    courseName: string | null;
    rollNumber: string | null;
    graduationYear: number | null;
    businessName: string | null;
    annualTurnover: number | null;
  } | null;
  primaryBank: {
    bankName: string | null;
    accountNumberMasked: string | null;
    ifscCode: string | null;
    accountHolderName: string | null;
    accountType: string | null;
    isVerified: boolean;
  } | null;
  completion: {
    percentage: number;
    isComplete: boolean;
    sections: ProfileSectionStatus[];
    missingFields: string[];
  };
  consentsCount: number;
}

interface BorrowerConsent {
  id: string;
  consentType: string;
  purpose: string;
  version: string;
  grantedAt: string;
  status: string;
}

export default function BorrowerProfilePage() {
  const queryClient = useQueryClient();

  // 1. Fetch Authoritative Detailed Profile
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isError: isProfileError,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<BorrowerDetailedProfile>({
    queryKey: ['borrower-profile'],
    queryFn: async () => {
      const res = await api.get<{ data: BorrowerDetailedProfile }>('/borrower/profile');
      return res.data?.data || (res.data as any);
    },
  });

  // 2. Fetch Active Consents
  const { data: consentsData } = useQuery<BorrowerConsent[]>({
    queryKey: ['borrower-consents'],
    queryFn: async () => {
      const res = await api.get<{ data: BorrowerConsent[] }>('/borrower/consents');
      return res.data?.data || (res.data as any);
    },
  });

  // Local Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'MALE',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    addressType: 'CURRENT' as 'CURRENT' | 'PERMANENT' | 'OFFICE',
    employmentType: 'SALARIED' as 'SALARIED' | 'STUDENT' | 'SELF_EMPLOYED' | 'BUSINESS' | 'PROFESSIONAL' | 'FREELANCER' | 'FARMER' | 'OTHER',
    employerName: '',
    designation: '',
    monthlyIncome: 0,
    existingEmiObligations: 0,
    workExperienceYears: 0,
    institutionName: '',
    courseName: '',
    rollNumber: '',
    graduationYear: 2026,
    businessName: '',
    annualTurnover: 0,
    professionType: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when profile data arrives
  useEffect(() => {
    if (profileData) {
      const emp = profileData.primaryEmployment;
      const addr = profileData.primaryAddress;

      const detectedEmpType = (emp?.employmentType as any) || 'SALARIED';

      setFormData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        dob: profileData.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : '',
        gender: profileData.gender || 'MALE',
        addressLine1: addr?.addressLine1 || (addr?.addressLine ? addr.addressLine.split(',')[0] : ''),
        addressLine2: addr?.addressLine2 || '',
        city: addr?.city || '',
        state: addr?.state || '',
        pincode: addr?.pincode || '',
        addressType: (addr?.addressType as any) || 'CURRENT',
        employmentType: detectedEmpType,
        employerName: emp?.employerName || '',
        designation: emp?.designation || '',
        monthlyIncome: emp?.monthlyIncome || 0,
        existingEmiObligations: emp?.existingObligations || 0,
        workExperienceYears: emp?.workExperienceYears || 0,
        institutionName: emp?.institutionName || (detectedEmpType === 'STUDENT' ? emp?.employerName || '' : ''),
        courseName: emp?.courseName || (detectedEmpType === 'STUDENT' ? emp?.designation || '' : ''),
        rollNumber: emp?.rollNumber || '',
        graduationYear: emp?.graduationYear || 2026,
        businessName: emp?.businessName || (detectedEmpType === 'BUSINESS' || detectedEmpType === 'SELF_EMPLOYED' ? emp?.employerName || '' : ''),
        annualTurnover: emp?.annualTurnover || 0,
        professionType: (detectedEmpType === 'PROFESSIONAL' || detectedEmpType === 'FREELANCER' ? emp?.designation || '' : ''),
      });
    }
  }, [profileData]);

  // Profile Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.patch<{ data: any }>('/borrower/profile', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setSuccessMessage('Profile saved and updated successfully.');
      setErrorMessage(null);
      setValidationErrors({});
      queryClient.invalidateQueries({ queryKey: ['borrower-profile'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-home'] });
      queryClient.invalidateQueries({ queryKey: ['borrower-journey'] });
      setTimeout(() => setSuccessMessage(null), 5000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile. Please check the inputs.';
      setErrorMessage(msg);
      setSuccessMessage(null);
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required.';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required.';
    }
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode.trim())) {
      errors.pincode = 'Pincode must be a 6-digit number.';
    }
    if (formData.employmentType === 'STUDENT') {
      if (!formData.institutionName.trim()) {
        errors.institutionName = 'College / Institution name is required for student persona.';
      }
    } else if (formData.employmentType === 'SALARIED') {
      if (!formData.employerName.trim()) {
        errors.employerName = 'Employer company name is required.';
      }
    } else if (formData.employmentType === 'BUSINESS' || formData.employmentType === 'SELF_EMPLOYED') {
      if (!formData.businessName.trim()) {
        errors.businessName = 'Business or firm name is required.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setErrorMessage('Please fix the highlighted validation errors before saving.');
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isProfileLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Spinner />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading authenticated borrower profile...</p>
      </div>
    );
  }

  if (isProfileError || !profileData) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unable to Load Borrower Profile</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {(profileError as any)?.message || 'There was an error communicating with the profile service. Please verify your authentication or retry.'}
        </p>
        <Button onClick={() => refetchProfile()} variant="outline" className="gap-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Retry Loading
        </Button>
      </div>
    );
  }

  const isKycVerified = profileData.kycStatus === 'VERIFIED';
  const completion = profileData.completion;

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Borrower Profile & Persona
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {profileData.customerCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage verified identity, living address, and employment or student details
            </p>
          </div>
        </div>

        {/* KYC Badge from Backend */}
        <div className="flex items-center gap-2">
          {isKycVerified ? (
            <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> KYC Verified
            </span>
          ) : (
            <span className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 font-semibold border border-amber-200 dark:border-amber-500/20 flex items-center gap-1.5 shadow-xs">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" /> KYC {profileData.kycStatus.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-xs animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-xs animate-in slide-in-from-top-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Completion Card (Calculated authoritatively by backend) */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-100">Profile Readiness</span>
            </div>
            <h3 className="text-base font-bold mt-0.5">
              {completion.percentage}% Profile Complete
            </h3>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
              {completion.isComplete ? 'Fully Ready for Loan Application' : 'Action Required for Eligibility'}
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completion.percentage}%` }}
          />
        </div>

        {/* Section Checklist Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
          {completion.sections.map((section) => (
            <div
              key={section.sectionKey}
              className={`p-2.5 rounded-xl backdrop-blur-md flex items-center gap-2 transition-all ${
                section.isComplete
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-black/20 text-white/70 border border-white/10'
              }`}
            >
              {section.isComplete ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              )}
              <span className="font-medium truncate">{section.title}</span>
            </div>
          ))}
        </div>

        {completion.missingFields.length > 0 && (
          <div className="text-2xs text-blue-100/90 pt-1 flex items-center gap-1.5">
            <span className="font-semibold">Missing to complete profile:</span>
            <span>{completion.missingFields.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Personal Details */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              1. Basic Personal Information
            </h3>
            {isKycVerified && (
              <span className="text-2xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Legal name locked by KYC
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* First Name */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isKycVerified}
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition ${
                  isKycVerified ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''
                } ${validationErrors.firstName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                placeholder="First name"
              />
              {validationErrors.firstName && (
                <p className="text-2xs text-rose-500 mt-1">{validationErrors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={isKycVerified}
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden transition ${
                  isKycVerified ? 'opacity-70 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : ''
                } ${validationErrors.lastName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'}`}
                placeholder="Last name"
              />
              {validationErrors.lastName && (
                <p className="text-2xs text-rose-500 mt-1">{validationErrors.lastName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange('dob', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Registered Mobile (Authoritative from Auth) */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Registered Mobile (OTP Verified)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  value={profileData.mobile}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 font-mono text-slate-700 dark:text-slate-300 cursor-not-allowed"
                />
                <span className="absolute right-3 top-2.5 text-2xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
            </div>

            {/* Registered Email */}
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Registered Email
              </label>
              <input
                type="email"
                disabled
                value={profileData.email}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Living & Communication Address */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              2. Address Information
            </h3>
            <span className="text-2xs text-slate-500 dark:text-slate-400">
              Used for physical KYC & correspondence
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Flat / House / Building & Street (Address Line 1)
              </label>
              <input
                type="text"
                value={formData.addressLine1}
                onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                placeholder="e.g. Flat 402, Sunshine Heights, MG Road"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Locality / Landmark (Address Line 2)
              </label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                placeholder="e.g. Near Metro Station"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Address Type
              </label>
              <select
                value={formData.addressType}
                onChange={(e) => handleInputChange('addressType', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
              >
                <option value="CURRENT">Current Residence</option>
                <option value="PERMANENT">Permanent Residence</option>
                <option value="OFFICE">Office / Business</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                City / Town
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                State / UT
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                placeholder="State"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                PIN Code (6 Digits)
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border bg-slate-50/50 dark:bg-slate-950 font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden ${
                  validationErrors.pincode ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                placeholder="e.g. 560001"
              />
              {validationErrors.pincode && (
                <p className="text-2xs text-rose-500 mt-1">{validationErrors.pincode}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: Persona & Employment / Student Profile */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {formData.employmentType === 'STUDENT' ? (
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              )}
              3. Persona & Occupation Profile
            </h3>
            <span className="text-2xs text-slate-500 dark:text-slate-400">
              Select your primary occupation category
            </span>
          </div>

          {/* Persona Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: 'STUDENT', label: 'College Student', icon: GraduationCap },
              { key: 'SALARIED', label: 'Salaried Employee', icon: Briefcase },
              { key: 'SELF_EMPLOYED', label: 'Self Employed', icon: Building2 },
              { key: 'FREELANCER', label: 'Freelancer / Gig', icon: Sparkles },
            ].map((persona) => {
              const Icon = persona.icon;
              const isSelected = formData.employmentType === persona.key;
              return (
                <button
                  key={persona.key}
                  type="button"
                  onClick={() => handleInputChange('employmentType', persona.key)}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all text-xs font-semibold ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 shadow-xs ring-1 ring-blue-500/20'
                      : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                  <span>{persona.label}</span>
                </button>
              );
            })}
          </div>

          {/* Conditional Persona Fields */}
          {formData.employmentType === 'STUDENT' ? (
            /* Student Mode */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 animate-in fade-in">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  College / Institution Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => handleInputChange('institutionName', e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    validationErrors.institutionName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  placeholder="e.g. Indian Institute of Technology / Delhi University"
                />
                {validationErrors.institutionName && (
                  <p className="text-2xs text-rose-500 mt-1">{validationErrors.institutionName}</p>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Degree / Program Name
                </label>
                <input
                  type="text"
                  value={formData.courseName}
                  onChange={(e) => handleInputChange('courseName', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="e.g. B.Tech Computer Science / B.Com"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Student Roll / Enrollment No.
                </label>
                <input
                  type="text"
                  value={formData.rollNumber}
                  onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="e.g. 2023CS0192"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expected Graduation Year
                </label>
                <input
                  type="number"
                  min={2024}
                  max={2032}
                  value={formData.graduationYear || 2026}
                  onChange={(e) => handleInputChange('graduationYear', parseInt(e.target.value) || 2026)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Allowance / Stipend (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="0"
                />
              </div>
            </div>
          ) : formData.employmentType === 'SALARIED' ? (
            /* Salaried Mode */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 animate-in fade-in">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Employer / Company Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employerName}
                  onChange={(e) => handleInputChange('employerName', e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    validationErrors.employerName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  placeholder="e.g. Infosys / Tata Consultancy Services"
                />
                {validationErrors.employerName && (
                  <p className="text-2xs text-rose-500 mt-1">{validationErrors.employerName}</p>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => handleInputChange('designation', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Net Monthly In-Hand Salary (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="e.g. 50000"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Total Work Experience (Years)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={formData.workExperienceYears}
                  onChange={(e) => handleInputChange('workExperienceYears', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Existing Monthly EMI Obligations (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.existingEmiObligations}
                  onChange={(e) => handleInputChange('existingEmiObligations', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="0"
                />
              </div>
            </div>
          ) : (
            /* Business / Freelancer / Self-Employed */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 animate-in fade-in">
              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Business / Trading Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden ${
                    validationErrors.businessName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  placeholder="e.g. Sharma Enterprises"
                />
                {validationErrors.businessName && (
                  <p className="text-2xs text-rose-500 mt-1">{validationErrors.businessName}</p>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Profession / Nature of Work
                </label>
                <input
                  type="text"
                  value={formData.professionType}
                  onChange={(e) => handleInputChange('professionType', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="e.g. Retailer / Consultant / Designer"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Monthly Income (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.monthlyIncome}
                  onChange={(e) => handleInputChange('monthlyIncome', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="e.g. 45000"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20"
          >
            {updateMutation.isPending ? (
              <>
                <Spinner size="sm" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Information</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* SECTION 4 & 5: Read-only Authoritative Backend Cards (KYC, Bank, Consents) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* KYC & Regulatory Status Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Authoritative KYC Status
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">KYC Status:</span>
              <span
                className={`font-bold flex items-center gap-1 ${
                  isKycVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {profileData.kycStatus.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">PAN Identification:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {profileData.panNumberMasked || 'Not Linked'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Aadhaar Token:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {profileData.aadhaarMasked || 'Not Linked'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500 dark:text-slate-400">Regulatory Risk Category:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {profileData.riskCategory || 'STANDARD_RETAIL'}
              </span>
            </div>
          </div>
        </div>

        {/* Linked Bank Account Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            Disbursement & Mandate Bank
          </h3>

          {profileData.primaryBank ? (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Bank Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {profileData.primaryBank.bankName || 'Linked Bank'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Account Number:</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {profileData.primaryBank.accountNumberMasked || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">IFSC Code:</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                  {profileData.primaryBank.ifscCode || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Verification:</span>
                <span
                  className={`font-semibold ${
                    profileData.primaryBank.isVerified
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {profileData.primaryBank.isVerified ? 'VERIFIED (Penny Drop)' : 'PENDING'}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 text-xs text-center py-6 text-slate-500 dark:text-slate-400">
              No bank account linked yet. Link your bank account during loan application or mandate setup.
            </div>
          )}
        </div>
      </div>

      {/* Digital Consents & DPDP Ledger */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Digital Consents & Regulatory Audit Trail
          </h3>
          <span className="text-2xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {profileData.consentsCount} Active Consents
          </span>
        </div>

        {consentsData && consentsData.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {consentsData.map((consent) => (
              <div key={consent.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {consent.consentType.replace(/_/g, ' ')}
                  </span>
                  <p className="text-2xs text-slate-500 dark:text-slate-400">{consent.purpose}</p>
                </div>
                <div className="flex items-center gap-3 text-2xs text-slate-400">
                  <span className="font-mono">v{consent.version}</span>
                  <span>{new Date(consent.grantedAt).toLocaleDateString()}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800/40">
                    {consent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic">
            Consents are captured dynamically during onboarding, KYC authentication, and loan submission.
          </p>
        )}
      </div>
    </div>
  );
}
