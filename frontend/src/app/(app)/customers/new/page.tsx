'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Cloud, UploadCloud, Image as ImageIcon, Landmark, Eye, EyeOff, Lock, KeyRound } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input } from '@/components/ui';

export default function NewCustomerPage() {
  const router = useRouter();
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

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
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

      // If photo was selected, upload directly to Cloudinary
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

      // If KYC doc was selected, upload directly to Cloudinary
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

      // If bank details were provided, register bank account record
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

      router.push(`/customers/${newCustomerId}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
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
        breadcrumb="Customers / New Profile"
        title="Add New Customer Profile"
        subtitle="Onboard a new borrower into the LMS and establish identity records"
      />

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              1. Basic Personal Information & Credentials
            </h3>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">First Name *</label>
                <Input
                  value={form.firstName}
                  onChange={(e) => update('firstName', e.target.value)}
                  placeholder="e.g. Rahul"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Last Name *</label>
                <Input
                  value={form.lastName}
                  onChange={(e) => update('lastName', e.target.value)}
                  placeholder="e.g. Sharma"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Mobile Phone Number *</label>
                <Input
                  value={form.mobile}
                  onChange={(e) => update('mobile', e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Email Address (Portal Username) *</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="e.g. rahul.sharma@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Date of Birth *</label>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => update('dateOfBirth', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Gender *</label>
                <select
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                  required
                  className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-2xs focus:border-brand-600 focus:outline-hidden"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-slate-700">Portal Password (For Borrower Login) *</label>
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
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              2. Geographic Location
            </h3>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">City *</label>
                <Input
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="e.g. Pune"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">State *</label>
                <Input
                  value={form.state}
                  onChange={(e) => update('state', e.target.value)}
                  placeholder="e.g. Maharashtra"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              3. Employment & Income Details
            </h3>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Employment Type *</label>
                <select
                  value={form.employmentType}
                  onChange={(e) => update('employmentType', e.target.value)}
                  required
                  className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs focus:border-brand-600 focus:outline-none"
                >
                  <option value="SALARIED">Salaried Employee</option>
                  <option value="SELF_EMPLOYED">Self-Employed / Business</option>
                  <option value="PROFESSIONAL">Self-Employed Professional</option>
                  <option value="STUDENT">Student</option>
                  <option value="HOMEMAKER">Homemaker</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Employer / Business Name *</label>
                <Input
                  value={form.employerName}
                  onChange={(e) => update('employerName', e.target.value)}
                  placeholder="e.g. Tech Solutions Pvt Ltd"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Monthly Gross Income (INR) *</label>
                <Input
                  type="number"
                  value={form.monthlyIncome}
                  onChange={(e) => update('monthlyIncome', e.target.value)}
                  placeholder="e.g. 65000"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                4. Applicant Photo & KYC Document (Cloudinary Cloud Vault)
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                <Cloud className="h-3 w-3" /> Cloudinary Enabled
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Photo Upload */}
              <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/40 p-4 text-center">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Applicant Selfie / Photo
                </label>
                <p className="text-[11px] text-slate-500 mb-3">
                  Upload customer passport photo or live selfie
                </p>
                <div className="flex flex-col items-center justify-center gap-2">
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Photo Preview"
                        className="h-20 w-20 object-cover rounded-xl border border-sky-300 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPhoto(null);
                          setPhotoPreview(null);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full h-5 w-5 text-xs font-bold flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-sky-300 text-xs font-bold text-sky-700 shadow-2xs hover:bg-sky-50 transition">
                      <UploadCloud className="h-4 w-4" /> Choose Photo
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
                  {selectedPhoto && (
                    <span className="text-[10px] text-emerald-600 font-semibold truncate max-w-[200px]">
                      ✓ {selectedPhoto.name}
                    </span>
                  )}
                </div>
              </div>

              {/* KYC Document Upload */}
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Primary Identity Proof (PAN / Aadhaar)
                </label>
                <div className="mb-2">
                  <select
                    value={kycDocType}
                    onChange={(e) => setKycDocType(e.target.value)}
                    className="h-7 rounded-lg border border-slate-300 bg-white px-2 text-[11px] font-semibold text-slate-700"
                  >
                    <option value="PAN_CARD">PAN Card</option>
                    <option value="AADHAAR_FRONT">Aadhaar Card (Front)</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="VOTER_ID">Voter ID</option>
                  </select>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition">
                    <UploadCloud className="h-4 w-4 text-slate-500" /> Select Document File
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
                  {selectedKycDoc && (
                    <span className="text-[10px] text-emerald-600 font-semibold truncate max-w-[200px]">
                      ✓ {selectedKycDoc.name} ({(selectedKycDoc.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                5. Bank Account Details (Disbursement Payout)
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                <Landmark className="h-3 w-3" /> Payout Ready
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Bank Name *</label>
                <Input
                  value={form.bankName}
                  onChange={(e) => update('bankName', e.target.value)}
                  placeholder="e.g. HDFC Bank / SBI"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Account Number *</label>
                <Input
                  value={form.bankAccountNo}
                  onChange={(e) => update('bankAccountNo', e.target.value)}
                  placeholder="e.g. 50100234567890"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">IFSC Code *</label>
                <Input
                  value={form.bankIfsc}
                  onChange={(e) => update('bankIfsc', e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div className="flex gap-2.5 pt-3 border-t border-slate-100">
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating Profile...' : 'Save & Open Customer 360 →'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
