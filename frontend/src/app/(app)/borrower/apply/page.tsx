'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  User,
  Briefcase,
  ShieldCheck,
  CreditCard,
  FileCheck,
  Lock,
  Info,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Input } from '@/components/ui';
import { useToast } from '@/lib/toast';

const STEPS = [
  { id: 1, title: 'Loan Requirement', icon: Sparkles },
  { id: 2, title: 'Personal Details', icon: User },
  { id: 3, title: 'Income & Work', icon: Briefcase },
  { id: 4, title: 'Digital KYC', icon: ShieldCheck },
  { id: 5, title: 'Bank Account', icon: CreditCard },
  { id: 6, title: 'Review & Verify', icon: FileCheck },
];

export default function BorrowerApplyPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [formData, setFormData] = useState({
    productId: '',
    requestedAmount: 50000,
    tenureMonths: 12,
    purpose: 'Personal / Lifestyle Financing',
    firstName: 'Rahul',
    lastName: 'Sharma',
    dob: '1992-06-15',
    gender: 'MALE',
    addressLine1: 'Flat 402, Green Meadows',
    addressLine2: 'MG Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    employmentType: 'SALARIED',
    employerName: 'Infosys Limited',
    monthlyIncome: 65000,
    existingEmiObligations: 5000,
    panNumber: 'ABCDE1234F',
    aadhaarNumberMasked: '********9012',
    kycConsentGiven: true,
    accountHolderName: 'Rahul Sharma',
    accountNumber: '9182374928172',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank Ltd',
    accountType: 'SAVINGS',
    creditBureauConsent: true,
    termsAccepted: true,
  });

  // Fetch active products
  const { data: products = [], isLoading: isProductsLoading } = useQuery({
    queryKey: ['consumer-products'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/api/v1/borrower/products');
      const list = res.data?.data || res.data || [];
      if (list.length > 0 && !formData.productId) {
        setFormData((prev) => ({ ...prev, productId: list[0].id }));
      }
      return list;
    },
  });

  const selectedProduct = products.find((p: any) => p.id === formData.productId) || products[0];

  // Dynamic Indicative EMI calculation
  const rateAnnual = selectedProduct ? selectedProduct.interestRateAnnual : 14.5;
  const r = rateAnnual / (12 * 100);
  const tenure = formData.tenureMonths;
  const principal = formData.requestedAmount;
  const calculatedEmi = Math.round(
    (principal * r * Math.pow(1 + r, tenure)) / (Math.pow(1 + r, tenure) - 1)
  ) || 4500;

  // Submit Application Mutation
  const submitMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post<{ data: any }>('/api/v1/borrower/apply', payload);
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      success('Application Approved!', 'Instant AI decisioning completed. Generating your sanction offer & KFS.');
      router.push(`/borrower/offers/${data.offerId || data.applicationId}`);
    },
    onError: (err: any) => {
      error('Submission Failed', err.response?.data?.message || err.message || 'Error submitting application');
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      submitMutation.mutate({
        ...formData,
        productId: selectedProduct?.id || formData.productId,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (isProductsLoading) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-400 mt-2">Loading digital lending application wizard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              Instant Digital Loan Application
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              100% Paperless • Real-Time AI Underwriting • Instant Bank Disbursement
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-medium">
          <Lock className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
        </div>
      </div>

      {/* Stepper Header */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
        <div className="grid grid-cols-6 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400'
                    : isCompleted
                    ? 'text-emerald-400 opacity-80'
                    : 'text-slate-500 opacity-40'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : step.id}
                </div>
                <span className="text-[10px] font-medium hidden md:inline truncate max-w-full">
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Contents */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
        {/* STEP 1: Loan Requirement */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-white">Step 1: Select Loan Requirement</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Customize your requested loan amount and tenure.
              </p>
            </div>

            {/* Product Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Lending Product</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => setFormData({ ...formData, productId: p.id })}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      formData.productId === p.id
                        ? 'bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-sm">{p.name}</div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold">
                        {p.interestRateAnnual}% p.a.
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">
                      Limit: ₹{p.minAmount?.toLocaleString('en-IN')} - ₹{p.maxAmount?.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount Slider */}
            <div className="space-y-3 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-300">Requested Amount</span>
                <span className="text-xl font-bold text-white">
                  ₹{formData.requestedAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min={selectedProduct ? selectedProduct.minAmount : 10000}
                max={selectedProduct ? selectedProduct.maxAmount : 500000}
                step={5000}
                value={formData.requestedAmount}
                onChange={(e) => setFormData({ ...formData, requestedAmount: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>₹{selectedProduct?.minAmount?.toLocaleString('en-IN') || '10,000'}</span>
                <span>₹{selectedProduct?.maxAmount?.toLocaleString('en-IN') || '5,00,000'}</span>
              </div>
            </div>

            {/* Tenure Selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Loan Tenure (Months)</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {[3, 6, 9, 12, 18, 24].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, tenureMonths: t })}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                      formData.tenureMonths === t
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {t} Mo
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Indicative EMI Callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 to-slate-900 border border-blue-500/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider">Estimated Monthly EMI</span>
                <div className="text-xl font-bold text-emerald-400">₹{calculatedEmi.toLocaleString('en-IN')}/mo</div>
              </div>
              <div className="text-right text-[11px] text-slate-400">
                <span>Annual Rate: </span>
                <span className="font-semibold text-white">{rateAnnual}% reducing</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Personal Details */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-white">Step 2: Personal Information</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure details match your official Aadhaar and PAN documents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Current Residential Address</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">State & Pincode</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                    placeholder="Pincode"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Income & Work */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-white">Step 3: Employment & Income</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Provide verifiable income details to establish your credit eligibility.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Employment Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL'].map((emp) => (
                    <button
                      key={emp}
                      type="button"
                      onClick={() => setFormData({ ...formData, employmentType: emp as any })}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        formData.employmentType === emp
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {emp.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Employer / Company Name</label>
                <input
                  type="text"
                  value={formData.employerName}
                  onChange={(e) => setFormData({ ...formData, employerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Net Monthly In-Hand Salary (₹)</label>
                <input
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Existing Monthly EMIs (₹)</label>
                <input
                  type="number"
                  value={formData.existingEmiObligations}
                  onChange={(e) => setFormData({ ...formData, existingEmiObligations: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Digital KYC */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-white">Step 4: Digital KYC Verification</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Instant identity validation compliant with RBI Digital Lending Directives.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">PAN Card Number</span>
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> NSDL Verified
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-sm tracking-widest uppercase focus:border-blue-500 outline-none"
                  maxLength={10}
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Aadhaar DigiLocker Token</span>
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> UIDAI Linked
                  </span>
                </div>
                <input
                  type="text"
                  disabled
                  value={formData.aadhaarNumberMasked}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-mono text-sm tracking-widest"
                />
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-950/20 border border-blue-500/20">
                <input
                  type="checkbox"
                  id="kycConsent"
                  checked={formData.kycConsentGiven}
                  onChange={(e) => setFormData({ ...formData, kycConsentGiven: e.target.checked })}
                  className="mt-0.5 accent-blue-500"
                />
                <label htmlFor="kycConsent" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                  I hereby grant voluntary consent to fetch and verify my digital KYC records via DigiLocker / NSDL API rails for loan underwriting purposes.
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Bank Account Details */}
        {currentStep === 5 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-white">Step 5: Disbursement Bank Account</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                The sanctioned loan amount will be disbursed via IMPS to this verified account.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Account Holder Name (as per Bank)</label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Bank Name</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-blue-500 outline-none uppercase"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Bank Account Number</label>
                <input
                  type="password"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Penny-drop micro-deposit verification active (Instant verification).</span>
            </div>
          </div>
        )}

        {/* STEP 6: Review & Confirmation */}
        {currentStep === 6 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <h2 className="text-base font-bold text-white">Step 6: Review & Final Declaration</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Please review your application parameters before instant AI credit evaluation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="text-slate-400 font-medium">Loan Requirement</div>
                <div className="text-sm font-bold text-white">₹{formData.requestedAmount.toLocaleString('en-IN')}</div>
                <div className="text-slate-400">{formData.tenureMonths} Months • {selectedProduct?.name}</div>
                <div className="text-emerald-400 font-semibold mt-1">Indicative EMI: ₹{calculatedEmi.toLocaleString('en-IN')}/mo</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="text-slate-400 font-medium">Borrower & KYC Details</div>
                <div className="text-sm font-bold text-white">{formData.firstName} {formData.lastName}</div>
                <div className="text-slate-400">PAN: {formData.panNumber} • DOB: {formData.dob}</div>
                <div className="text-slate-400">{formData.city}, {formData.state} - {formData.pincode}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="text-slate-400 font-medium">Employment & Income</div>
                <div className="text-sm font-bold text-white">{formData.employerName}</div>
                <div className="text-slate-400">{formData.employmentType}</div>
                <div className="text-slate-400">Net Monthly: ₹{formData.monthlyIncome.toLocaleString('en-IN')}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                <div className="text-slate-400 font-medium">Disbursement Account</div>
                <div className="text-sm font-bold text-white">{formData.bankName}</div>
                <div className="text-slate-400 font-mono">A/C: ••••••••{formData.accountNumber.slice(-4)}</div>
                <div className="text-slate-400 font-mono">IFSC: {formData.ifscCode}</div>
              </div>
            </div>

            {/* Consents */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <input
                  type="checkbox"
                  id="bureauConsent"
                  checked={formData.creditBureauConsent}
                  onChange={(e) => setFormData({ ...formData, creditBureauConsent: e.target.checked })}
                  className="mt-0.5 accent-blue-500"
                />
                <label htmlFor="bureauConsent" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                  I authorize Adyapan Lending OS and regulated lender partners to fetch my credit bureau report (CIBIL / Experian / CRIF) to evaluate this application.
                </label>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  checked={formData.termsAccepted}
                  onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                  className="mt-0.5 accent-blue-500"
                />
                <label htmlFor="termsAccepted" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                  I agree to the RBI Fair Practice Code, Digital Lending Mandates, and Terms & Conditions.
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-8 pt-5 border-t border-slate-800/80 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || submitMutation.isPending}
            className="rounded-xl border-slate-800 bg-slate-950 text-xs text-slate-300 hover:text-white"
          >
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={submitMutation.isPending}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white px-6 shadow-lg shadow-blue-500/20"
          >
            {submitMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner /> Processing AI Evaluation...
              </span>
            ) : currentStep === STEPS.length ? (
              <span className="flex items-center gap-1.5">
                Submit & Check Decision <Sparkles className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                Continue to Step {currentStep + 1} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
