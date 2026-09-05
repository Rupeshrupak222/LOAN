'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Zap,
  Building2,
  CreditCard,
  FileText,
  User,
  MapPin,
  Check,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Calculator,
  Percent,
  Calendar,
  Smartphone,
  Mail,
  Send,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Briefcase,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { api, setAccessToken, apiErrorMessage } from '@/lib/api';

interface ProductItem {
  id: string;
  code: string;
  name: string;
  productType: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  interestMethod: string;
  minTenureMonths: number;
  maxTenureMonths: number;
  processingFeePct: number;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
];

function ApplyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Query param initialization
  const initialMobile = searchParams.get('mobile') || '';
  const initialPurpose = searchParams.get('purpose') || 'Personal Expenses';
  const initialAmount = Number(searchParams.get('amount')) || 250000;

  // Active step in the borrower journey: 1 to 7
  // 1: Loan Purpose & Target Amount
  // 2: Account Creation & Mobile OTP
  // 3: Personal Profile & KYC
  // 4: Employment & Residential Address
  // 5: Bank Details & Live Loan Customizer (EMI)
  // 6: Consents & Final Review
  // 7: Celebration / Application Submitted
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Available loan products from backend
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Goal / Purpose
    purpose: initialPurpose,
    targetAmount: initialAmount,

    // Step 2: Account
    firstName: '',
    lastName: '',
    email: '',
    mobile: initialMobile,
    password: '',
    confirmPassword: '',

    // OTP verification
    otp: '',
    isOtpSent: false,
    isOtpVerified: false,
    otpTimer: 0,

    // Step 3: Personal & KYC
    dateOfBirth: '1996-05-15',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    maritalStatus: 'SINGLE' as 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED',
    panNumber: '',
    aadhaarNumber: '',

    // Step 4: Employment & Address
    employmentType: 'SALARIED' as 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS' | 'OTHER',
    companyName: '',
    designation: '',
    monthlyIncome: 65000,
    existingEmi: 5000,
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',

    // Step 5: Bank & Product
    bankName: 'State Bank of India',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    selectedProductId: '',
    requestedAmount: initialAmount,
    tenureMonths: 24,

    // Step 6: Consents
    consentBureau: true,
    consentTerms: true,
  });

  // Submission / Loading states
  const [submitting, setSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [submissionResult, setSubmissionResult] = useState<{
    applicationId: string;
    applicationNo: string;
    customerCode: string;
    status: string;
    token?: string;
  } | null>(null);

  // Fetch live products on mount
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await api.get('/apply/products');
        if (res.data?.data && Array.isArray(res.data.data)) {
          setProducts(res.data.data);
          if (res.data.data.length > 0 && !formData.selectedProductId) {
            const first = res.data.data[0];
            setFormData(prev => ({
              ...prev,
              selectedProductId: first.id,
              requestedAmount: Math.min(Math.max(prev.targetAmount, first.minAmount), first.maxAmount),
              tenureMonths: Math.min(Math.max(24, first.minTenureMonths), first.maxTenureMonths)
            }));
          }
        }
      } catch (err) {
        console.warn('Could not load products from backend, using default fallback presets', err);
        // Fallback demo products
        const fallback: ProductItem[] = [
          {
            id: 'prod-pl',
            code: 'PL_STANDARD',
            name: 'Personal Loan Express',
            productType: 'PERSONAL',
            minAmount: 10000,
            maxAmount: 1000000,
            interestRate: 11.5,
            interestMethod: 'REDUCING_BALANCE',
            minTenureMonths: 6,
            maxTenureMonths: 60,
            processingFeePct: 1.5,
          },
          {
            id: 'prod-sme',
            code: 'SME_GROWTH',
            name: 'SME Business Credit',
            productType: 'BUSINESS',
            minAmount: 50000,
            maxAmount: 2500000,
            interestRate: 13.0,
            interestMethod: 'REDUCING_BALANCE',
            minTenureMonths: 12,
            maxTenureMonths: 48,
            processingFeePct: 2.0,
          }
        ];
        setProducts(fallback);
        setFormData(prev => ({ ...prev, selectedProductId: fallback[0].id }));
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  // OTP Timer countdown
  useEffect(() => {
    if (formData.otpTimer > 0) {
      const timer = setTimeout(() => {
        setFormData(prev => ({ ...prev, otpTimer: prev.otpTimer - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formData.otpTimer]);

  // Selected Product helper
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === formData.selectedProductId) || products[0];
  }, [products, formData.selectedProductId]);

  // Financial calculations (EMI, Interest, Fees)
  const calculation = useMemo(() => {
    const P = Number(formData.requestedAmount) || 100000;
    const rateAnnual = selectedProduct ? Number(selectedProduct.interestRate) : 12;
    const r = (rateAnnual / 100) / 12;
    const n = Number(formData.tenureMonths) || 12;

    let emi = 0;
    if (r === 0) {
      emi = P / n;
    } else {
      emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    }

    const totalRepay = emi * n;
    const totalInterest = Math.max(0, totalRepay - P);
    const procFeePct = selectedProduct ? Number(selectedProduct.processingFeePct) : 1.5;
    const processingFee = (P * procFeePct) / 100;
    const netDisbursal = P - processingFee;

    // FOIR & Pre-approved estimation
    const monthlyNet = Number(formData.monthlyIncome) || 50000;
    const curEmi = Number(formData.existingEmi) || 0;
    const maxAffordableEmi = Math.max(1000, (monthlyNet * 0.5) - curEmi);
    const estimatedEligibleAmount = Math.min(
      Math.round((maxAffordableEmi * n * 0.85) / 10000) * 10000,
      selectedProduct ? selectedProduct.maxAmount : 1500000
    );

    return {
      emi: Math.round(emi),
      totalRepay: Math.round(totalRepay),
      totalInterest: Math.round(totalInterest),
      processingFee: Math.round(processingFee),
      netDisbursal: Math.round(netDisbursal),
      estimatedEligibleAmount: Math.max(50000, estimatedEligibleAmount),
      foirPercent: Math.min(100, Math.round(((curEmi + emi) / monthlyNet) * 100)),
    };
  }, [formData.requestedAmount, formData.tenureMonths, formData.monthlyIncome, formData.existingEmi, selectedProduct]);

  // Handle Input Changes
  const handleChange = (field: string, value: any) => {
    setErrorMessage(null);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Trigger Send OTP
  const handleSendOtp = async () => {
    if (!formData.mobile || formData.mobile.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    setOtpSending(true);
    setErrorMessage(null);
    try {
      await api.post('/apply/send-otp', { mobile: formData.mobile });
      setFormData(prev => ({
        ...prev,
        isOtpSent: true,
        otpTimer: 30,
        otp: '123456', // Pre-fill standard sandbox demo OTP for instant ease
      }));
    } catch (err) {
      setErrorMessage(apiErrorMessage(err));
    } finally {
      setOtpSending(false);
    }
  };

  // Trigger Verify OTP
  const handleVerifyOtp = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }
    setOtpVerifying(true);
    setErrorMessage(null);
    try {
      await api.post('/apply/verify-otp', { mobile: formData.mobile, otp: formData.otp });
      setFormData(prev => ({ ...prev, isOtpVerified: true }));
    } catch (err) {
      setErrorMessage(apiErrorMessage(err));
    } finally {
      setOtpVerifying(false);
    }
  };

  // Step Validation & Next Trigger
  const handleNext = () => {
    setErrorMessage(null);

    // Step 1: Purpose & Amount
    if (currentStep === 1) {
      if (!formData.purpose) {
        setErrorMessage('Please specify the purpose of the loan.');
        return;
      }
      if (formData.targetAmount < 10000) {
        setErrorMessage('Minimum loan amount is ₹10,000.');
        return;
      }
      setCurrentStep(2);
      return;
    }

    // Step 2: Account Creation & OTP
    if (currentStep === 2) {
      if (!formData.firstName.trim() || formData.firstName.trim().length < 2) {
        setErrorMessage('Please enter a valid first name (at least 2 characters).');
        return;
      }
      if (!formData.lastName.trim()) {
        setErrorMessage('Please enter your last name.');
        return;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (!formData.mobile || formData.mobile.length !== 10) {
        setErrorMessage('Please provide a valid 10-digit mobile number.');
        return;
      }
      if (!formData.password || formData.password.length < 8) {
        setErrorMessage('Password must be at least 8 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      if (!formData.isOtpVerified) {
        setErrorMessage('Please verify your mobile number with OTP before continuing.');
        return;
      }
      setCurrentStep(3);
      return;
    }

    // Step 3: Personal & KYC
    if (currentStep === 3) {
      if (!formData.dateOfBirth) {
        setErrorMessage('Please select your Date of Birth.');
        return;
      }
      const birthYear = new Date(formData.dateOfBirth).getFullYear();
      const currentYear = new Date().getFullYear();
      if (currentYear - birthYear < 18) {
        setErrorMessage('Borrower must be at least 18 years of age.');
        return;
      }
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      const formattedPan = formData.panNumber.trim().toUpperCase();
      if (!panRegex.test(formattedPan)) {
        setErrorMessage('Please enter a valid 10-digit PAN (e.g. ABCDE1234F).');
        return;
      }
      setCurrentStep(4);
      return;
    }

    // Step 4: Employment & Address
    if (currentStep === 4) {
      if (!formData.companyName.trim()) {
        setErrorMessage('Please enter your employer or business name.');
        return;
      }
      if (!formData.monthlyIncome || Number(formData.monthlyIncome) < 10000) {
        setErrorMessage('Minimum required monthly net income is ₹10,000.');
        return;
      }
      if (!formData.addressLine1.trim() || formData.addressLine1.length < 5) {
        setErrorMessage('Please enter a complete residential address line 1.');
        return;
      }
      if (!formData.city.trim()) {
        setErrorMessage('Please enter your city.');
        return;
      }
      if (!formData.pincode || !/^\d{6}$/.test(formData.pincode)) {
        setErrorMessage('Please enter a valid 6-digit postal pincode.');
        return;
      }
      setCurrentStep(5);
      return;
    }

    // Step 5: Bank Account & Loan Product
    if (currentStep === 5) {
      if (!formData.bankName.trim()) {
        setErrorMessage('Please specify your bank name.');
        return;
      }
      if (!formData.accountNumber || formData.accountNumber.length < 8) {
        setErrorMessage('Please enter a valid bank account number.');
        return;
      }
      if (formData.accountNumber !== formData.confirmAccountNumber) {
        setErrorMessage('Bank account numbers do not match.');
        return;
      }
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      const formattedIfsc = formData.ifscCode.trim().toUpperCase();
      if (!ifscRegex.test(formattedIfsc)) {
        setErrorMessage('Please enter a valid 11-digit IFSC code (e.g. SBIN0001234).');
        return;
      }
      setCurrentStep(6);
      return;
    }

    // Step 6: Submit Final Application
    if (currentStep === 6) {
      if (!formData.consentBureau) {
        setErrorMessage('Credit Bureau inquiry consent is required to proceed.');
        return;
      }
      if (!formData.consentTerms) {
        setErrorMessage('You must accept the terms of service and digital lending guidelines.');
        return;
      }
      handleSubmitApplication();
    }
  };

  // Submit to Backend
  const handleSubmitApplication = async () => {
    setSubmitting(true);
    setErrorMessage(null);

    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      mobile: formData.mobile.trim(),
      password: formData.password,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      maritalStatus: formData.maritalStatus,
      panNumber: formData.panNumber.trim().toUpperCase(),
      aadhaarNumber: formData.aadhaarNumber ? formData.aadhaarNumber.trim() : undefined,
      employmentType: formData.employmentType,
      monthlyIncome: Number(formData.monthlyIncome),
      companyName: formData.companyName.trim(),
      designation: formData.designation ? formData.designation.trim() : undefined,
      addressLine1: formData.addressLine1.trim(),
      addressLine2: formData.addressLine2 ? formData.addressLine2.trim() : undefined,
      city: formData.city.trim(),
      state: formData.state,
      pincode: formData.pincode.trim(),
      bankName: formData.bankName.trim(),
      accountNumber: formData.accountNumber.trim(),
      ifscCode: formData.ifscCode.trim().toUpperCase(),
      productId: formData.selectedProductId || products[0]?.id,
      requestedAmount: Number(formData.requestedAmount),
      tenureMonths: Number(formData.tenureMonths),
      purpose: formData.purpose,
      consentBureau: formData.consentBureau,
      consentTerms: formData.consentTerms,
    };

    try {
      const res = await api.post('/apply/submit', payload);
      const data = res.data?.data;
      if (data) {
        setSubmissionResult({
          applicationId: data.applicationId || data.application?.id,
          applicationNo: data.applicationNo || data.application?.applicationNo,
          customerCode: data.customerCode || data.customer?.customerCode,
          status: data.status || data.application?.status || 'SUBMITTED',
          token: data.accessToken,
        });

        // Store JWT token so borrower is immediately authenticated in browser
        if (data.accessToken) {
          setAccessToken(data.accessToken);
        }

        // Transition to Step 7 (Celebration Screen)
        setCurrentStep(7);
      }
    } catch (err) {
      setErrorMessage(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Helper step indicators
  const stepTitles = [
    'Goal',
    'Account & Mobile',
    'Profile & KYC',
    'Income & Address',
    'Bank & Terms',
    'Final Review',
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#071A33] flex flex-col font-sans selection:bg-[#155EEF] selection:text-white">
      {/* ── Top Floating Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} variant="dark" />
            </Link>
            <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs font-mono font-bold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>DIGITAL BORROWER ONBOARDING</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="hidden md:flex items-center gap-2 text-slate-500">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-BIT SSL ENCRYPTED</span>
            </div>
            <Link
              href="/login"
              className="text-xs font-bold text-[#155EEF] hover:text-blue-800 transition-colors"
            >
              Sign In →
            </Link>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        {currentStep <= 6 && (
          <div className="w-full bg-slate-100 h-1 relative overflow-hidden">
            <div
              className="bg-[#155EEF] h-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            />
          </div>
        )}
      </header>

      {/* ── Main Application Container ── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Step Indicator Header (Steps 1 to 6) */}
        {currentStep <= 6 && (
          <div className="mb-8">
            <div className="hidden sm:flex items-center justify-between max-w-3xl mx-auto mb-6">
              {stepTitles.map((title, idx) => {
                const stepNum = idx + 1;
                const isDone = currentStep > stepNum;
                const isCurrent = currentStep === stepNum;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-[#155EEF] text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isDone ? <Check className="w-4 h-4" /> : stepNum}
                    </div>
                    <span
                      className={`text-xs font-bold font-mono ${
                        isCurrent
                          ? 'text-[#071A33]'
                          : isDone
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {title}
                    </span>
                    {idx < stepTitles.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-2" />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="sm:hidden text-center text-xs font-mono font-bold text-slate-500 uppercase mb-2">
              Stage {currentStep} of 6: <span className="text-[#155EEF]">{stepTitles[currentStep - 1]}</span>
            </div>
          </div>
        )}

        {/* Error Alert Message */}
        {errorMessage && (
          <div className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* ── STEP 1: Purpose & Target Loan Amount ── */}
        {currentStep === 1 && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] text-xs font-bold font-mono uppercase tracking-wider border border-blue-200">
                Stage 01 // Intent & Need
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#071A33]">
                What are you moving forward with?
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Select your financial purpose and estimated capital requirement to personalize your terms.
              </p>
            </div>

            {/* Purpose Selector Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Business Expansion', icon: Building2 },
                { label: 'Personal Expenses', icon: User },
                { label: 'Medical Emergency', icon: HeartHandshake },
                { label: 'Higher Education', icon: FileText },
                { label: 'Home Improvement', icon: MapPin },
                { label: 'Debt Consolidation', icon: CreditCard },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isSelected = formData.purpose === item.label;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChange('purpose', item.label)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#155EEF] bg-blue-50/50 shadow-md ring-2 ring-[#155EEF]/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#155EEF] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#155EEF]' : 'text-slate-800'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Amount Slider */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Target Loan Amount
                </span>
                <span className="text-2xl font-black text-[#155EEF] font-mono">
                  ₹{Number(formData.targetAmount).toLocaleString('en-IN')}
                </span>
              </div>

              <input
                type="range"
                min={25000}
                max={2500000}
                step={25000}
                value={formData.targetAmount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  handleChange('targetAmount', val);
                  handleChange('requestedAmount', val);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
              />

              <div className="flex justify-between text-[11px] font-mono text-slate-400 font-bold">
                <span>₹25,000</span>
                <span>₹10,00,000</span>
                <span>₹25,00,000</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-4 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Continue to Borrower Verification</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STEP 2: Account Creation & Mobile OTP Verification ── */}
        {currentStep === 2 && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] text-xs font-bold font-mono uppercase tracking-wider border border-blue-200">
                Stage 02 // Identity & Credentials
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#071A33]">
                Create your Borrower Account
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Secure your application with mobile OTP verification and credential setup.
              </p>
            </div>

            <div className="space-y-4">
              {/* Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aarav"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] focus:border-transparent font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] focus:border-transparent font-medium"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Official Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="aarav.sharma@example.com"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] focus:border-transparent font-medium"
                  />
                </div>
              </div>

              {/* Mobile with OTP Verification Panel */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="block text-xs font-bold text-slate-800">
                  Mobile Number Verification <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-3 text-xs font-mono font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="9876543210"
                      disabled={formData.isOtpVerified}
                      value={formData.mobile}
                      onChange={(e) =>
                        handleChange('mobile', e.target.value.replace(/\D/g, ''))
                      }
                      className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#155EEF] disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  {!formData.isOtpVerified ? (
                    <button
                      type="button"
                      disabled={otpSending || formData.mobile.length !== 10 || formData.otpTimer > 0}
                      onClick={handleSendOtp}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      {otpSending ? (
                        'Sending...'
                      ) : formData.otpTimer > 0 ? (
                        `Resend (${formData.otpTimer}s)`
                      ) : formData.isOtpSent ? (
                        'Resend OTP'
                      ) : (
                        'Send OTP'
                      )}
                    </button>
                  ) : (
                    <div className="px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>VERIFIED</span>
                    </div>
                  )}
                </div>

                {/* OTP Input box when sent & unverified */}
                {formData.isOtpSent && !formData.isOtpVerified && (
                  <div className="pt-2 border-t border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium">
                        Enter 6-digit OTP sent to +91 {formData.mobile}:
                      </span>
                      <span className="text-[11px] font-mono text-[#155EEF] font-bold">
                        Demo Code: 123456
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        value={formData.otp}
                        onChange={(e) =>
                          handleChange('otp', e.target.value.replace(/\D/g, ''))
                        }
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono tracking-widest font-black focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
                      />
                      <button
                        type="button"
                        disabled={otpVerifying || formData.otp.length !== 6}
                        onClick={handleVerifyOtp}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password setup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Account Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] focus:border-transparent font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Re-type password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] focus:border-transparent font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3.5 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Save & Continue to KYC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Personal Profile & KYC / Identity Verification ── */}
        {currentStep === 3 && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] text-xs font-bold font-mono uppercase tracking-wider border border-blue-200">
                Stage 03 // KYC & Demographics
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#071A33]">
                Identity & KYC Verification
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Required by RBI Digital Lending Regulations for real-time risk underwriting.
              </p>
            </div>

            <div className="space-y-4">
              {/* DOB & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Date of Birth <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] font-medium bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              {/* Marital Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Marital Status <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleChange('maritalStatus', status)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formData.maritalStatus === status
                          ? 'border-[#155EEF] bg-blue-50 text-[#155EEF]'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* PAN Number (Strict Indian Validation) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    PAN Card Number <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    10-digit Alphanumeric (e.g. ABCDE1234F)
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  value={formData.panNumber}
                  onChange={(e) =>
                    handleChange('panNumber', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono tracking-widest font-black uppercase focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
                />
                <p className="text-[11px] text-slate-500">
                  Instant real-time NSDL / Protean verification will attest your tax identification.
                </p>
              </div>

              {/* Aadhaar Number (Masked) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Aadhaar Card Number (Optional / DigiLocker e-KYC)
                </label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="12-digit Aadhaar (e.g. 5432 1098 7654)"
                  value={formData.aadhaarNumber}
                  onChange={(e) =>
                    handleChange('aadhaarNumber', e.target.value.replace(/\D/g, ''))
                  }
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm font-mono font-medium focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3.5 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue to Employment & Address</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Employment, Income & Residential Address ── */}
        {currentStep === 4 && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] text-xs font-bold font-mono uppercase tracking-wider border border-blue-200">
                Stage 04 // Affordability & Residence
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#071A33]">
                Employment & Address Details
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Determines repayment capacity (FOIR) and regulatory residence verification.
              </p>
            </div>

            <div className="space-y-4">
              {/* Employment Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Employment Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'SALARIED', label: 'Salaried' },
                    { id: 'SELF_EMPLOYED', label: 'Self-Employed' },
                    { id: 'BUSINESS', label: 'Business Owner' },
                    { id: 'OTHER', label: 'Professional' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleChange('employmentType', item.id)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formData.employmentType === item.id
                          ? 'border-[#155EEF] bg-blue-50 text-[#155EEF]'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Employer / Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Company / Employer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tata Consultancy Services"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.designation}
                    onChange={(e) => handleChange('designation', e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] font-medium"
                  />
                </div>
              </div>

              {/* Income & Existing EMI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Monthly Net Take-Home (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step={1000}
                    value={formData.monthlyIncome}
                    onChange={(e) => handleChange('monthlyIncome', Number(e.target.value))}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm font-mono font-bold text-[#071A33] focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Existing Monthly EMI Outflow (₹)
                  </label>
                  <input
                    type="number"
                    step={500}
                    value={formData.existingEmi}
                    onChange={(e) => handleChange('existingEmi', Number(e.target.value))}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm font-mono font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
                  />
                </div>
              </div>

              {/* Residential Address Section */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Permanent / Current Residence
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Address Line 1 (Flat, House No., Building) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 402, Sunshine Heights, MG Road"
                    value={formData.addressLine1}
                    onChange={(e) => handleChange('addressLine1', e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleChange('state', e.target.value)}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] font-medium bg-white"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Pincode <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="400001"
                      value={formData.pincode}
                      onChange={(e) =>
                        handleChange('pincode', e.target.value.replace(/\D/g, ''))
                      }
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3.5 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Save & Configure Loan Terms</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Bank Account & Live Loan Customizer (EMI) ── */}
        {currentStep === 5 && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] text-xs font-bold font-mono uppercase tracking-wider border border-blue-200">
                Stage 05 // Disbursement & Terms
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#071A33]">
                Disbursement Account & Loan Terms
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Select your loan product, customize tenure, and specify your primary bank account for instant transfer.
              </p>
            </div>

            {/* Product Catalog Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Select Loan Product Scheme <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {products.map((prod) => {
                  const isSelected = formData.selectedProductId === prod.id;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        handleChange('selectedProductId', prod.id);
                        handleChange(
                          'requestedAmount',
                          Math.min(Math.max(formData.requestedAmount, prod.minAmount), prod.maxAmount)
                        );
                        handleChange(
                          'tenureMonths',
                          Math.min(Math.max(formData.tenureMonths, prod.minTenureMonths), prod.maxTenureMonths)
                        );
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-[#155EEF] bg-blue-50/40 shadow-sm ring-2 ring-[#155EEF]/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold font-mono text-[#155EEF] uppercase px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200">
                            {prod.code}
                          </span>
                          <h4 className="text-sm font-bold text-[#071A33] mt-1">
                            {prod.name}
                          </h4>
                        </div>
                        <span className="text-sm font-black text-emerald-600 font-mono">
                          {prod.interestRate}% p.a.
                        </span>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>Limit: ₹{(prod.maxAmount / 100000).toFixed(1)}L</span>
                        <span>Tenure: Up to {prod.maxTenureMonths}m</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Interactive Sliders & EMI Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#071A33] text-white">
              {/* Sliders (Left 7 Cols) */}
              <div className="md:col-span-7 space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-mono font-bold mb-1">
                    <span className="text-slate-400">Principal Amount</span>
                    <span className="text-emerald-400 text-sm">
                      ₹{Number(formData.requestedAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={selectedProduct ? selectedProduct.minAmount : 10000}
                    max={selectedProduct ? selectedProduct.maxAmount : 1500000}
                    step={10000}
                    value={formData.requestedAmount}
                    onChange={(e) => handleChange('requestedAmount', Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>₹{(selectedProduct?.minAmount || 10000).toLocaleString('en-IN')}</span>
                    <span>₹{(selectedProduct?.maxAmount || 1500000).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono font-bold mb-1">
                    <span className="text-slate-400">Repayment Tenure</span>
                    <span className="text-[#4EA8FF] text-sm font-bold">
                      {formData.tenureMonths} Months
                    </span>
                  </div>
                  <input
                    type="range"
                    min={selectedProduct ? selectedProduct.minTenureMonths : 6}
                    max={selectedProduct ? selectedProduct.maxTenureMonths : 60}
                    step={6}
                    value={formData.tenureMonths}
                    onChange={(e) => handleChange('tenureMonths', Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#4EA8FF]"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                    <span>{selectedProduct?.minTenureMonths || 6}m</span>
                    <span>{selectedProduct?.maxTenureMonths || 60}m</span>
                  </div>
                </div>

                {/* Eligibility Scorecard Pill */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Estimated Pre-Approved Offer:</span>
                  <span className="text-emerald-400 font-bold">
                    ₹{calculation.estimatedEligibleAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Live EMI Breakdown (Right 5 Cols) */}
              <div className="md:col-span-5 flex flex-col justify-between p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Calculated Monthly EMI
                  </span>
                  <div className="text-3xl font-black text-white font-mono mt-1">
                    ₹{calculation.emi.toLocaleString('en-IN')}
                    <span className="text-xs text-slate-400 font-normal"> /mo</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10 text-xs font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Annual Interest</span>
                    <span>{selectedProduct?.interestRate || 12}% p.a.</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Interest</span>
                    <span>₹{calculation.totalInterest.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Processing Fee</span>
                    <span>₹{calculation.processingFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-white/10">
                    <span>Net Disbursal</span>
                    <span>₹{calculation.netDisbursal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Disbursement Details */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Building2 className="w-4 h-4 text-[#155EEF]" />
                <span>Primary Bank Account (For Instant Fund Disbursal)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    value={formData.bankName}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#155EEF] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bank IFSC Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="HDFC0000123"
                    value={formData.ifscCode}
                    onChange={(e) =>
                      handleChange('ifscCode', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter Account Number"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      handleChange('accountNumber', e.target.value.replace(/\D/g, ''))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Confirm Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Re-enter Account Number"
                    value={formData.confirmAccountNumber}
                    onChange={(e) =>
                      handleChange('confirmAccountNumber', e.target.value.replace(/\D/g, ''))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#155EEF]"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3.5 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white font-bold text-sm tracking-wide transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Review & Accept Consents</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Consents, Declarations & Final Review ── */}
        {currentStep === 6 && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-8">
            <div className="text-center space-y-2">
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#155EEF] text-xs font-bold font-mono uppercase tracking-wider border border-blue-200">
                Stage 06 // Review & Legal Consents
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#071A33]">
                Review your Application
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Please verify your details and accept regulatory statutory consents before one-click dispatch.
              </p>
            </div>

            {/* Summary Dossier Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 font-medium">Applicant</span>
                  <h3 className="text-base font-bold text-[#071A33]">
                    {formData.firstName} {formData.lastName}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-medium">Selected Scheme</span>
                  <p className="text-xs font-mono font-bold text-[#155EEF]">
                    {selectedProduct?.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">SANCTION AMOUNT</span>
                  <span className="font-bold text-slate-800">
                    ₹{Number(formData.requestedAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">TENURE</span>
                  <span className="font-bold text-slate-800">
                    {formData.tenureMonths} Months
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">MONTHLY EMI</span>
                  <span className="font-bold text-[#155EEF]">
                    ₹{calculation.emi.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">INTEREST RATE</span>
                  <span className="font-bold text-emerald-700">
                    {selectedProduct?.interestRate}% p.a.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">PAN CARD</span>
                  <span className="font-mono font-bold text-slate-700">{formData.panNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">MOBILE</span>
                  <span className="font-mono font-bold text-slate-700">+91 {formData.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">DISBURSEMENT BANK</span>
                  <span className="font-medium text-slate-700 truncate block">
                    {formData.bankName} (***{formData.accountNumber.slice(-4)})
                  </span>
                </div>
              </div>
            </div>

            {/* Statutory Consents Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.consentBureau}
                  onChange={(e) => handleChange('consentBureau', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#155EEF] focus:ring-[#155EEF] border-slate-300"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900 font-semibold">Credit Bureau Inquiries:</strong> I hereby grant explicit consent to Adyapan Financial Technologies and its regulated lending partners to fetch my credit information report from TransUnion CIBIL, Experian, or Equifax.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.consentTerms}
                  onChange={(e) => handleChange('consentTerms', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#155EEF] focus:ring-[#155EEF] border-slate-300"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-slate-900 font-semibold">RBI Fair Practices & Terms:</strong> I confirm all statements provided are true and accurate. I agree to the Digital Lending Guidelines, Electronic Repayment Terms, and Privacy Policy.
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setCurrentStep(5)}
                className="px-5 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={submitting || !formData.consentBureau || !formData.consentTerms}
                onClick={handleSubmitApplication}
                className="flex-1 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting to Loan Officer Queue...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Application Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 7: Application Submitted & Celebration Screen ── */}
        {currentStep === 7 && submissionResult && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-12 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-4 border-emerald-100 flex items-center justify-center mx-auto shadow-md">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold font-mono uppercase tracking-wider border border-emerald-200">
                Application Successfully Dispatched
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-[#071A33] tracking-tight">
                Congratulations, {formData.firstName}!
              </h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Your loan application has been registered into the Adyapan Underwriting Core and routed directly to the Loan Officer queue for immediate review.
              </p>
            </div>

            {/* Generated Identifiers Pill Box */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 max-w-lg mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                  Application Number
                </span>
                <span className="text-lg font-mono font-black text-[#155EEF] select-all">
                  {submissionResult.applicationNo}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                  Borrower Customer ID
                </span>
                <span className="text-sm font-mono font-bold text-slate-800 select-all">
                  {submissionResult.customerCode}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                  Initial Workflow Status
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#155EEF] font-bold text-xs font-mono border border-blue-200">
                  {submissionResult.status}
                </span>
              </div>
            </div>

            {/* What Happens Next Checklist */}
            <div className="text-left p-5 rounded-2xl bg-blue-50/50 border border-blue-200/70 max-w-lg mx-auto space-y-3">
              <h4 className="text-xs font-bold font-mono uppercase text-[#155EEF]">
                What Happens Next?
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Loan Officer Document Inspection:</strong> Assigned loan officer conducts automated bureau pull and income cross-verification.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Credit Decisioning:</strong> Credit analyst evaluates risk scorecard and sanctions terms.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Direct NACH & Disbursal:</strong> Once sanctioned, funds transfer directly to your {formData.bankName} account.</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 max-w-lg mx-auto">
              <Link
                href="/dashboard"
                className="flex-1 py-3.5 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Borrower Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="px-6 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center cursor-pointer"
              >
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">Loading application portal...</div>}>
      <ApplyPageContent />
    </Suspense>
  );
}
