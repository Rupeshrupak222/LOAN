'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  MapPin,
  Cloud,
  UploadCloud,
  Briefcase,
  Landmark,
  Calculator,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Layers,
  Percent,
  IndianRupee,
  Calendar,
  Send,
  Loader2,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input } from '@/components/ui';
import { CustomerOnboardingStepper, StepItem } from '@/components/CustomerOnboardingStepper';
import { cn } from '@/lib/utils';

const STEPS: StepItem[] = [
  {
    id: 1,
    shortLabel: '1. Personal',
    label: 'Personal & Credentials',
    icon: User,
    description: 'Basic personal details and borrower login credentials',
  },
  {
    id: 2,
    shortLabel: '2. Location',
    label: 'Geographic Location',
    icon: MapPin,
    description: 'City and state of residence',
  },
  {
    id: 3,
    shortLabel: '3. KYC Upload',
    label: 'Photo & KYC Docs',
    icon: Cloud,
    description: 'Cloudinary selfie photo and primary identity proof',
  },
  {
    id: 4,
    shortLabel: '4. Employment',
    label: 'Employment & Income',
    icon: Briefcase,
    description: 'Employment type, employer, and monthly income',
  },
  {
    id: 5,
    shortLabel: '5. Bank Details',
    label: 'Bank Account Payout',
    icon: Landmark,
    description: 'Primary bank account and IFSC code for disbursement',
  },
  {
    id: 6,
    shortLabel: '6. Loan Terms',
    label: 'Loan Terms & EMI',
    icon: Calculator,
    description: 'Loan amount, interest rate, tenure, and live EMI calculation',
  },
  {
    id: 7,
    shortLabel: '7. Underwriter',
    label: 'Audit & Forward',
    icon: ShieldCheck,
    description: 'Step-by-step checklist and transfer dossier to Underwriter',
  },
];

export default function NewCustomerPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Customer Form State
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: 'MALE',
    city: '',
    state: '',
    employmentType: 'SALARIED',
    employerName: '',
    monthlyIncome: '',
    bankName: '',
    bankAccountNo: '',
    bankIfsc: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedKycDoc, setSelectedKycDoc] = useState<File | null>(null);
  const [kycDocType, setKycDocType] = useState('PAN_CARD');

  // Loan Application Form State
  const [loanMode, setLoanMode] = useState<'CUSTOM' | 'PRESET'>('CUSTOM');
  const [productId, setProductId] = useState('');
  const [customLoanName, setCustomLoanName] = useState('Personal Loan');
  const [requestedAmount, setRequestedAmount] = useState<number | string>('');
  const [customInterestRate, setCustomInterestRate] = useState<number | string>('');
  const [tenureMonths, setTenureMonths] = useState<number | string>('');
  const [purpose, setPurpose] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch Preset Loan Products
  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => (await api.get('/loan-products')).data.data,
  });

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Live EMI Calculation (Reducing Balance Formula)
  const principalNum = Math.max(0, Number(requestedAmount) || 0);
  const rateNum = Math.max(0.1, Number(customInterestRate) || 12.0);
  const tenureNum = Math.max(1, Number(tenureMonths) || 1);

  const monthlyRate = rateNum / 12 / 100;
  const emi =
    principalNum > 0 && tenureNum > 0
      ? (
          (principalNum * monthlyRate * Math.pow(1 + monthlyRate, tenureNum)) /
          (Math.pow(1 + monthlyRate, tenureNum) - 1)
        ).toFixed(2)
      : '0.00';
  const totalRepayment = (Number(emi) * tenureNum).toFixed(2);
  const totalInterest = (Number(totalRepayment) - principalNum).toFixed(2);

  // Preset product click handler
  function handleSelectPreset(p: any) {
    setProductId(p.id);
    setCustomLoanName(p.name);
    setCustomInterestRate(Number(p.interestRate));
    setRequestedAmount(Math.max(Number(p.minAmount), Number(requestedAmount) || 50000));
    setTenureMonths(p.minTenureMonths || 12);
  }

  // Sequential Step Completion Logic (Only marks Done if previous steps are complete and current step is filled by Loan Officer)
  const isStep1Done =
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.mobile.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.dateOfBirth.length > 0 &&
    form.password.trim().length >= 6;

  const isStep2Done = isStep1Done && form.city.trim().length > 0 && form.state.trim().length > 0;

  const isStep3Done = isStep2Done && Boolean((selectedPhoto || photoPreview) && selectedKycDoc);

  const isStep4Done =
    isStep3Done &&
    form.employmentType.length > 0 &&
    form.employerName.trim().length > 0 &&
    Number(form.monthlyIncome) > 0;

  const isStep5Done =
    isStep4Done &&
    form.bankName.trim().length > 0 &&
    form.bankAccountNo.trim().length > 0 &&
    form.bankIfsc.trim().length >= 4;

  const isStep6Done =
    isStep5Done &&
    Boolean(requestedAmount) &&
    Number(requestedAmount) > 0 &&
    Boolean(customInterestRate) &&
    Number(customInterestRate) > 0 &&
    Boolean(tenureMonths) &&
    Number(tenureMonths) > 0 &&
    purpose.trim().length > 0;

  const completedSteps: number[] = [];
  if (isStep1Done) completedSteps.push(1);
  if (isStep2Done) completedSteps.push(2);
  if (isStep3Done) completedSteps.push(3);
  if (isStep4Done) completedSteps.push(4);
  if (isStep5Done) completedSteps.push(5);
  if (isStep6Done) completedSteps.push(6);

  // Handle Step Advance
  function nextStep() {
    setError(null);
    if (currentStep === 1 && !isStep1Done) {
      setError('Please complete all required personal information fields (including valid password min 6 chars).');
      return;
    }
    if (currentStep === 2 && !isStep2Done) {
      setError('Please provide City and State.');
      return;
    }
    if (currentStep === 3 && !isStep3Done) {
      setError('Please upload both the Applicant Photo and the Primary Identity Proof (PAN / Aadhaar / Passport / Voter ID) document (* Mandatory).');
      return;
    }
    if (currentStep === 4 && !isStep4Done) {
      setError('Please provide valid employment type, employer name, and monthly income.');
      return;
    }
    if (currentStep === 5 && !isStep5Done) {
      setError('Please provide bank name, account number, and IFSC code.');
      return;
    }
    if (currentStep === 6 && !isStep6Done) {
      setError('Please specify valid loan amount, interest rate, and tenure.');
      return;
    }
    if (currentStep < 7) {
      setCurrentStep((s) => s + 1);
    }
  }

    // Final Submit & Forward to Underwriter
  async function handleSubmitAndForward() {
    setError(null);
    if (!isStep1Done) {
      setError('Please complete Step 1 (Personal Information) first.');
      return;
    }
    if (!isStep2Done) {
      setError('Please complete Step 2 (Geographic Location) first.');
      return;
    }
    if (!isStep3Done) {
      setError('Please return to Step 3 and upload both the mandatory Applicant Photo and Identity Proof document.');
      return;
    }
    if (!isStep4Done) {
      setError('Please complete Step 4 (Employment & Income Profile) first.');
      return;
    }
    if (!isStep5Done) {
      setError('Please complete Step 5 (Bank Account Details) first.');
      return;
    }
    if (!isStep6Done) {
      setError('Please complete Step 6 (Loan Scheme, Requested Amount, Interest Rate, Tenure, and Purpose) before forwarding to Underwriter.');
      return;
    }
    setSaving(true);
    try {
      // 1. Create Customer
      const payload = {
        ...form,
        email: form.email || undefined,
        password: form.password && form.password.trim().length >= 6 ? form.password.trim() : undefined,
        dateOfBirth: form.dateOfBirth ? form.dateOfBirth : undefined,
        gender: form.gender || undefined,
        monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : undefined,
      };
      const res = await api.post('/customers', payload);
      const newCustomerId = res.data.data.id;

      // 2. Upload Photo (Cloudinary)
      if (selectedPhoto) {
        const photoData = new FormData();
        photoData.append('file', selectedPhoto);
        photoData.append('customerId', newCustomerId);
        photoData.append('category', 'APPLICANT_PHOTO');
        photoData.append('documentType', 'CUSTOMER_SELFIE_PHOTO');
        await api.post('/documents/upload', photoData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch((e) => console.warn('Photo upload warning:', e));
      }

      // 3. Upload KYC Document (Cloudinary)
      if (selectedKycDoc) {
        const kycData = new FormData();
        kycData.append('file', selectedKycDoc);
        kycData.append('customerId', newCustomerId);
        kycData.append('category', 'IDENTITY_PROOF');
        kycData.append('documentType', kycDocType);
        await api.post('/documents/upload', kycData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch((e) => console.warn('KYC upload warning:', e));
      }

      // 4. Register Bank Account
      if (form.bankName.trim() && form.bankAccountNo.trim() && form.bankIfsc.trim()) {
        await api.post(`/customers/${newCustomerId}/bank-accounts`, {
          bankName: form.bankName.trim(),
          accountNumber: form.bankAccountNo.trim(),
          ifscCode: form.bankIfsc.toUpperCase().trim(),
          accountHolderName: `${form.firstName} ${form.lastName}`.trim(),
          accountType: form.employmentType === 'SALARIED' ? 'SALARY' : 'SAVINGS',
          isPrimary: true,
        }).catch((e) => console.warn('Bank account registration warning:', e));
      }

      // 5. Originate Loan Application
      const appRes = await api.post('/applications', {
        customerId: newCustomerId,
        productId: loanMode === 'PRESET' && productId ? productId : undefined,
        productName: customLoanName.trim() || 'Custom Loan Scheme',
        requestedAmount: principalNum,
        interestRate: rateNum,
        tenureMonths: tenureNum,
        purpose,
      });
      const newAppId = appRes.data.data.id;

      // 6. Forward Application directly to Underwriting Queue
      await api.post(`/applications/${newAppId}/transition`, {
        toStatus: 'UNDERWRITING',
        reason: 'Forwarded by Loan Officer after complete step-by-step intake and document verification.',
      }).catch((e) => console.warn('Underwriter transition warning:', e));

      // Redirect to Application detail view in Underwriting
      router.push(`/applications/${newAppId}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white transition-colors group"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] shadow-2xs group-hover:border-brand-500 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/50 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </span>
          <span>Back to Customers Directory</span>
        </Link>
      </div>

      <PageHeader
        breadcrumb="Customers / Step-by-Step Onboarding"
        title="Add Customer & Forward to Underwriter"
        subtitle="Guided multi-step customer details intake, KYC document collection, and instant transfer to Underwriting"
      />

      {/* Stepper Navigation Bar */}
      <CustomerOnboardingStepper
        currentStep={currentStep}
        completedSteps={completedSteps}
        steps={STEPS}
        onStepClick={(stepId) => setCurrentStep(stepId)}
      />

      {/* STEP 1: Personal Information */}
      {currentStep === 1 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4 text-brand-600" />
                Step 1: Personal Information & Borrower Credentials
              </h3>
              <p className="text-xs text-slate-500">Provide legal name, contact numbers, and portal password</p>
            </div>
            {isStep1Done && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed ✓
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">First Name *</label>
              <Input
                value={form.firstName}
                onChange={(e) => update('firstName', e.target.value)}
                placeholder="e.g. Rahul"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name *</label>
              <Input
                value={form.lastName}
                onChange={(e) => update('lastName', e.target.value)}
                placeholder="e.g. Sharma"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Mobile Phone Number *</label>
              <Input
                value={form.mobile}
                onChange={(e) => update('mobile', e.target.value)}
                placeholder="e.g. 9876543210"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address (Portal Username) *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="e.g. rahul.sharma@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Date of Birth *</label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update('dateOfBirth', e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Gender *</label>
              <select
                value={form.gender}
                onChange={(e) => update('gender', e.target.value)}
                required
                className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] px-3 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:border-brand-600 focus:outline-hidden"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Portal Password (For Borrower Login) *</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Enter customer login password (min 6 chars)"
                  minLength={6}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Required: Customer will use this password and email to log into the borrower portal.</p>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 2: Geographic Location */}
      {currentStep === 2 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-600" />
                Step 2: Geographic Location & Residential Address
              </h3>
              <p className="text-xs text-slate-500">Record current place of residence for credit verification</p>
            </div>
            {isStep2Done && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed ✓
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">City / District *</label>
              <Input
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="e.g. Pune / Mumbai / Bengaluru"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">State *</label>
              <Input
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
                placeholder="e.g. Maharashtra / Karnataka"
                required
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: Applicant Photo & KYC Uploads */}
      {currentStep === 3 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Cloud className="h-4 w-4 text-sky-600" />
                Step 3: Applicant Photo & Identity Proof Upload (Cloudinary Cloud Vault)
              </h3>
              <p className="text-xs text-slate-500">Upload passport photo / selfie and primary identity proof (PAN / Aadhaar)</p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full">
              <Cloud className="h-3 w-3" /> Cloudinary Enabled
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Photo Upload */}
            <div className="rounded-2xl border border-dashed border-sky-300 bg-sky-50/40 dark:bg-sky-950/20 p-5 text-center space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                Applicant Passport Photo / Live Selfie <span className="text-rose-500 font-bold">*</span>
              </label>
              <p className="text-[11px] text-slate-500">
                Supports JPEG, PNG, WEBP formats (Max 10MB)
              </p>
              <div className="flex flex-col items-center justify-center gap-2">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Photo Preview"
                      className="h-24 w-24 object-cover rounded-2xl border-2 border-sky-400 shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full h-6 w-6 text-xs font-bold flex items-center justify-center shadow-md hover:bg-rose-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1E2445] border border-sky-300 text-xs font-bold text-sky-700 dark:text-sky-300 shadow-2xs hover:bg-sky-50 transition">
                    <UploadCloud className="h-4 w-4" /> Choose Photo File *
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setSelectedPhoto(f);
                          setPhotoPreview(URL.createObjectURL(f));
                        }
                      }}
                    />
                  </label>
                )}
                {selectedPhoto ? (
                  <span className="text-[11px] text-emerald-600 font-bold truncate max-w-[220px]">
                    ✓ Upload Ready: {selectedPhoto.name}
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-500 font-semibold">* Photo is required</span>
                )}
              </div>
            </div>

            {/* KYC Document Upload */}
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 p-5 text-center space-y-3">
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                Primary Identity Proof (PAN / Aadhaar / Passport) <span className="text-rose-500 font-bold">*</span>
              </label>
              <div>
                <select
                  value={kycDocType}
                  onChange={(e) => setKycDocType(e.target.value)}
                  className="h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E2445] px-3 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <option value="PAN_CARD">PAN Card</option>
                  <option value="AADHAAR_FRONT">Aadhaar Card (Front)</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="VOTER_ID">Voter ID</option>
                </select>
              </div>
              <div className="flex flex-col items-center justify-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1E2445] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 transition">
                  <UploadCloud className="h-4 w-4 text-slate-500" /> Select Document File *
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) setSelectedKycDoc(f);
                    }}
                  />
                </label>
                {selectedKycDoc ? (
                  <span className="text-[11px] text-emerald-600 font-bold truncate max-w-[220px]">
                    ✓ Upload Ready: {selectedKycDoc.name} ({(selectedKycDoc.size / 1024).toFixed(1)} KB)
                  </span>
                ) : (
                  <span className="text-[10px] text-rose-500 font-semibold">* Identity document is required</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 4: Employment & Financial Assessment */}
      {currentStep === 4 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-brand-600" />
                Step 4: Employment & Financial Income Profile
              </h3>
              <p className="text-xs text-slate-500">Employment type, employer organization name, and monthly gross income</p>
            </div>
            {isStep4Done && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed ✓
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Employment Type *</label>
              <select
                value={form.employmentType}
                onChange={(e) => update('employmentType', e.target.value)}
                required
                className="h-9 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1E2445] px-3 text-xs font-medium text-slate-700 dark:text-slate-200 focus:border-brand-600 focus:outline-none"
              >
                <option value="SALARIED">Salaried Employee</option>
                <option value="SELF_EMPLOYED">Self-Employed / Business Owner</option>
                <option value="PROFESSIONAL">Self-Employed Professional</option>
                <option value="STUDENT">Student</option>
                <option value="HOMEMAKER">Homemaker</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Employer / Business Name *</label>
              <Input
                value={form.employerName}
                onChange={(e) => update('employerName', e.target.value)}
                placeholder="e.g. Tech Solutions Pvt Ltd"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Monthly Gross Income (INR ₹) *</label>
              <Input
                type="number"
                value={form.monthlyIncome}
                onChange={(e) => update('monthlyIncome', e.target.value)}
                placeholder="e.g. 65000"
                required
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 5: Bank Account Payout Details */}
      {currentStep === 5 && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Landmark className="h-4 w-4 text-blue-600" />
                Step 5: Bank Account Details for Loan Disbursement
              </h3>
              <p className="text-xs text-slate-500">Record borrower bank account number and IFSC code for direct payout</p>
            </div>
            {isStep5Done && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" /> Completed ✓
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Bank Name *</label>
              <Input
                value={form.bankName}
                onChange={(e) => update('bankName', e.target.value)}
                placeholder="e.g. HDFC Bank / SBI / ICICI"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Account Number *</label>
              <Input
                value={form.bankAccountNo}
                onChange={(e) => update('bankAccountNo', e.target.value)}
                placeholder="e.g. 50100234567890"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">IFSC Code *</label>
              <Input
                value={form.bankIfsc}
                onChange={(e) => update('bankIfsc', e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                required
              />
            </div>
          </div>
        </Card>
      )}

      {/* STEP 6: Loan Scheme, Terms & Live EMI Calculation */}
      {currentStep === 6 && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Calculator className="h-4 w-4 text-brand-600" />
                Step 6: Loan Scheme, Custom Terms & Live Financial Assessment
              </h3>
              <p className="text-xs text-slate-500">Configure requested loan amount, interest rate (% p.a.), tenure, and purpose</p>
            </div>

            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-[#1E2445] p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLoanMode('CUSTOM')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                  loanMode === 'CUSTOM'
                    ? 'bg-white dark:bg-brand-600 text-brand-700 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <Sparkles className="h-3.5 w-3.5" /> Custom Terms
              </button>
              <button
                type="button"
                onClick={() => setLoanMode('PRESET')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer',
                  loanMode === 'PRESET'
                    ? 'bg-white dark:bg-brand-600 text-brand-700 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                )}
              >
                <Layers className="h-3.5 w-3.5" /> Preset Schemes
              </button>
            </div>
          </div>

          {/* Preset Schemes Selector */}
          {loanMode === 'PRESET' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Select Standard Product Template (Click to apply & edit)
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {productsData?.map((p: any) => {
                  const selected = productId === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectPreset(p)}
                      className={cn(
                        'cursor-pointer rounded-2xl border p-3.5 transition-all text-left',
                        selected
                          ? 'border-brand-600 bg-brand-50/80 dark:bg-brand-950/60 shadow-sm ring-2 ring-brand-600/30'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] hover:border-slate-300'
                      )}
                    >
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.productType} · <span className="font-bold text-emerald-600">{p.interestRate}% p.a.</span>
                      </p>
                      <p className="text-xs text-brand-700 dark:text-brand-300 font-semibold mt-2">
                        ₹{Number(p.minAmount).toLocaleString('en-IN')} - ₹{Number(p.maxAmount).toLocaleString('en-IN')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Editable Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Loan Scheme / Product Title *
              </label>
              <Input
                placeholder="e.g. Custom Personal Loan / Business Working Capital"
                value={customLoanName}
                onChange={(e) => setCustomLoanName(e.target.value)}
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5 text-brand-600" />
                  <span>Principal Loan Amount (INR ₹) *</span>
                </label>
                <span className="font-mono font-bold text-brand-700 dark:text-brand-400 text-base">
                  ₹{principalNum.toLocaleString('en-IN')}
                </span>
              </div>
              <Input
                type="number"
                min={1000}
                max={100000000}
                step={5000}
                placeholder="Enter custom loan amount (e.g. 250000)"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[25000, 50000, 100000, 250000, 500000, 1000000].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setRequestedAmount(amt)}
                    className={cn(
                      'text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer',
                      principalNum === amt
                        ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white dark:bg-[#1E2445] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    )}
                  >
                    ₹{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Annual Interest Rate (% p.a.) *</span>
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="100"
                  placeholder="e.g. 12.5"
                  value={customInterestRate}
                  onChange={(e) => setCustomInterestRate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>Tenure Duration (Months) *</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="360"
                  placeholder="e.g. 24"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Loan Purpose / Remarks *
              </label>
              <Input
                placeholder="e.g. Home renovation / business expansion / medical requirement"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              />
            </div>

            {/* Live Financial Calculation Box */}
            <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/60 to-emerald-50/40 dark:from-brand-950/40 dark:to-emerald-950/20 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Monthly EMI</p>
                <p className="text-lg font-bold text-brand-700 dark:text-brand-300">
                  ₹{Number(emi).toLocaleString('en-IN')} / mo
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Total Interest</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  ₹{Number(totalInterest).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Total Payable</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  ₹{Number(totalRepayment).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 7: Comprehensive Review Audit & Forward to Underwriter */}
      {currentStep === 7 && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Step 7: Verification Audit & Forward to Underwriter
              </h3>
              <p className="text-xs text-slate-500">Audit all completed steps and initiate transfer to Underwriter review queue</p>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Ready for Underwriting
            </span>
          </div>

          {/* Audit Summary Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Step-by-Step Completion Status Checklist
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className={cn('p-3 rounded-xl border flex items-center justify-between', isStep1Done ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50')}>
                <div>
                  <p className="font-bold text-slate-900">1. Personal Info & Credentials</p>
                  <p className="text-slate-600">{form.firstName} {form.lastName} · {form.mobile}</p>
                </div>
                <span className="font-bold text-emerald-700">{isStep1Done ? '✓ Completed' : '⚠️ Pending'}</span>
              </div>

              <div className={cn('p-3 rounded-xl border flex items-center justify-between', isStep2Done ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50')}>
                <div>
                  <p className="font-bold text-slate-900">2. Location Details</p>
                  <p className="text-slate-600">{form.city}, {form.state}</p>
                </div>
                <span className="font-bold text-emerald-700">{isStep2Done ? '✓ Completed' : '⚠️ Pending'}</span>
              </div>

              <div className={cn('p-3 rounded-xl border flex items-center justify-between', isStep3Done ? 'border-emerald-200 bg-emerald-50/50' : 'border-amber-200 bg-amber-50/50')}>
                <div>
                  <p className="font-bold text-slate-900">3. Photo & KYC Uploads</p>
                  <p className="text-slate-600">
                    Photo: {selectedPhoto ? 'Selected' : 'Optional'} · Doc: {selectedKycDoc ? kycDocType : 'Optional'}
                  </p>
                </div>
                <span className="font-bold text-emerald-700">{isStep3Done ? '✓ Attached' : 'Optional'}</span>
              </div>

              <div className={cn('p-3 rounded-xl border flex items-center justify-between', isStep4Done ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50')}>
                <div>
                  <p className="font-bold text-slate-900">4. Employment & Income</p>
                  <p className="text-slate-600">{form.employmentType} · ₹{Number(form.monthlyIncome || 0).toLocaleString('en-IN')}/mo</p>
                </div>
                <span className="font-bold text-emerald-700">{isStep4Done ? '✓ Completed' : '⚠️ Pending'}</span>
              </div>

              <div className={cn('p-3 rounded-xl border flex items-center justify-between', isStep5Done ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50')}>
                <div>
                  <p className="font-bold text-slate-900">5. Bank Account Details</p>
                  <p className="text-slate-600">{form.bankName} · Acc: {form.bankAccountNo}</p>
                </div>
                <span className="font-bold text-emerald-700">{isStep5Done ? '✓ Linked' : '⚠️ Pending'}</span>
              </div>

              <div className={cn('p-3 rounded-xl border flex items-center justify-between', isStep6Done ? 'border-emerald-200 bg-emerald-50/50' : 'border-rose-200 bg-rose-50/50')}>
                <div>
                  <p className="font-bold text-slate-900">6. Loan Terms & EMI</p>
                  <p className="text-slate-600">₹{principalNum.toLocaleString('en-IN')} @ {rateNum}% ({tenureNum} mos)</p>
                </div>
                <span className="font-bold text-emerald-700">{isStep6Done ? '✓ Calculated' : '⚠️ Pending'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-300 bg-brand-50/80 dark:bg-brand-950/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-brand-900 dark:text-brand-100 text-sm">
                Ready to forward dossier to Underwriting
              </p>
              <p className="text-xs text-brand-700 dark:text-brand-300">
                Submitting will create the customer profile, upload documents, register bank account, originate the loan application, and mark status as UNDERWRITING.
              </p>
            </div>
            <Button
              type="button"
              disabled={saving}
              onClick={handleSubmitAndForward}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex-none"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Forwarding...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Forward to Underwriter →
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-200">
          {error}
        </div>
      )}

      {/* Stepper Footer Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 dark:border-slate-800">
        <Button
          type="button"
          variant="secondary"
          disabled={currentStep === 1 || saving}
          onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
        >
          ← Previous Step
        </Button>

        {currentStep < 7 ? (
          <Button
            type="button"
            disabled={saving}
            onClick={nextStep}
            className="flex items-center gap-1.5"
          >
            Save & Continue to Step {currentStep + 1} <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
