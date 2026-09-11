'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Building,
  User,
  CreditCard,
  Briefcase,
  ShieldCheck,
  Percent,
  Sliders,
  AlertCircle,
  Save,
} from 'lucide-react';
import type { BorrowerLendingProduct, BorrowerProfile, CreateBorrowerApplicationDto } from '../types';
import { useCreateBorrowerApplication, useSubmitBorrowerApplication } from '../hooks/useBorrower';

interface ApplicationWizardProps {
  products: BorrowerLendingProduct[];
  profile: BorrowerProfile;
  initialProductId?: string;
  onApplicationCompleted?: (applicationId: string) => void;
  onCancel?: () => void;
}

const STORAGE_KEY = 'ADYAPAN_BORROWER_APP_DRAFT';

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  products,
  profile,
  initialProductId,
  onApplicationCompleted,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProductId || products[0]?.id || ''
  );

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Form State initialized from borrower profile and product defaults
  const [formData, setFormData] = useState<CreateBorrowerApplicationDto>({
    customerId: profile.id,
    productId: selectedProduct?.id || '',
    requestedAmount: selectedProduct?.defaultAmount || selectedProduct?.minAmount || 50000,
    tenureMonths: selectedProduct?.minTenureMonths || 12,
    purpose: 'Personal financing and expenses',
    personalDetails: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      dateOfBirth: profile.dateOfBirth || '1992-05-15',
      gender: profile.gender || 'MALE',
      mobile: profile.mobile || '',
      email: profile.email || 'borrower@example.com',
    },
    employmentDetails: {
      employmentType: 'SALARIED',
      employerName: profile.employmentDetails?.[0]?.employerName || 'Acme Technologies Ltd',
      monthlyIncome: profile.employmentDetails?.[0]?.monthlyIncome || 75000,
      existingObligations: 0,
    },
    bankDetails: {
      accountHolderName: `${profile.firstName} ${profile.lastName}`.trim(),
      bankName: profile.bankAccounts?.[0]?.bankName || 'HDFC Bank',
      accountNumber: profile.bankAccounts?.[0]?.accountNumber || '50100234567890',
      ifscCode: profile.bankAccounts?.[0]?.ifscCode || 'HDFC0001234',
    },
  });

  // Load from LocalStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed, customerId: profile.id }));
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, [profile.id]);

  // Sync selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      setFormData((prev) => ({
        ...prev,
        productId: selectedProduct.id,
        requestedAmount: Math.max(
          selectedProduct.minAmount,
          Math.min(selectedProduct.maxAmount, prev.requestedAmount)
        ),
      }));
    }
  }, [selectedProductId, selectedProduct]);

  // Save to LocalStorage on change
  const updateFormData = (patch: Partial<CreateBorrowerApplicationDto>) => {
    setFormData((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const createMutation = useCreateBorrowerApplication();
  const submitMutation = useSubmitBorrowerApplication();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Approximate EMI calculation
  const r = (selectedProduct?.interestRate || 14) / 12 / 100;
  const n = formData.tenureMonths || 12;
  const estimatedEmi = Math.round(
    (formData.requestedAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  );

  const handleSubmitApplication = async () => {
    try {
      setIsSubmitting(true);
      // 1. Create or save application
      const createdApp = await createMutation.mutateAsync({
        ...formData,
        customerId: profile.id,
        productId: selectedProduct.id,
      });

      // 2. Submit for automated Underwriting & Decision Engine
      const submittedApp = await submitMutation.mutateAsync(createdApp.id);

      // Clear draft
      localStorage.removeItem(STORAGE_KEY);

      if (onApplicationCompleted) {
        onApplicationCompleted(submittedApp.id);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Application submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Product & Loan Amount', icon: Sliders },
    { num: 2, title: 'Personal Details', icon: User },
    { num: 3, title: 'Income & Employment', icon: Briefcase },
    { num: 4, title: 'Bank Account for Payout', icon: Building },
    { num: 5, title: 'Review & Underwriting', icon: ShieldCheck },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-10 shadow-2xl relative overflow-hidden">
      {/* Step Indicator Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
              Step {currentStep} of {steps.length}
            </span>
            <h2 className="text-2xl font-bold text-white mt-0.5">{steps[currentStep - 1].title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
                alert('Application draft saved locally!');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="grid grid-cols-5 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;

            return (
              <div
                key={step.num}
                className={`h-2 rounded-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-blue-500'
                    : isCurrent
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* STEP 1: Product & Amount */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Select Lending Product</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => setSelectedProductId(prod.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedProductId === prod.id
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-white text-sm">{prod.name}</h4>
                    <span className="text-xs text-blue-400 font-semibold">{prod.interestRate}% p.a.</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prod.description || 'Flexible credit option'}</p>
                  <div className="mt-3 text-xs font-medium text-slate-300">
                    ₹{prod.minAmount.toLocaleString('en-IN')} - ₹{prod.maxAmount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedProduct && (
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 space-y-6">
              {/* Amount Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-300">Loan Amount</label>
                  <span className="text-2xl font-extrabold text-blue-400">
                    ₹{formData.requestedAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={selectedProduct.minAmount}
                  max={selectedProduct.maxAmount}
                  step={5000}
                  value={formData.requestedAmount}
                  onChange={(e) => updateFormData({ requestedAmount: Number(e.target.value) })}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Min ₹{selectedProduct.minAmount.toLocaleString('en-IN')}</span>
                  <span>Max ₹{selectedProduct.maxAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Tenure Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">Repayment Tenure</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[6, 12, 18, 24, 36, 48, 60]
                    .filter(
                      (t) => t >= selectedProduct.minTenureMonths && t <= selectedProduct.maxTenureMonths
                    )
                    .map((tenure) => (
                      <button
                        key={tenure}
                        type="button"
                        onClick={() => updateFormData({ tenureMonths: tenure })}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                          formData.tenureMonths === tenure
                            ? 'bg-blue-600/30 border-blue-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {tenure} Mo
                      </button>
                    ))}
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Loan Purpose</label>
                <input
                  type="text"
                  value={formData.purpose || ''}
                  onChange={(e) => updateFormData({ purpose: e.target.value })}
                  placeholder="e.g. Higher Education, Medical Emergency, Business Working Capital"
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Real-time EMI Estimator Banner */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-blue-300 font-medium">Estimated Monthly Installment</span>
                  <div className="text-xl font-bold text-white mt-0.5">
                    ₹{estimatedEmi.toLocaleString('en-IN')} / month
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span>Interest Rate: </span>
                  <strong className="text-white">{selectedProduct.interestRate}% p.a.</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Personal Details */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={formData.personalDetails?.firstName || ''}
                onChange={(e) =>
                  updateFormData({
                    personalDetails: { ...formData.personalDetails!, firstName: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.personalDetails?.lastName || ''}
                onChange={(e) =>
                  updateFormData({
                    personalDetails: { ...formData.personalDetails!, lastName: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.personalDetails?.dateOfBirth || ''}
                onChange={(e) =>
                  updateFormData({
                    personalDetails: { ...formData.personalDetails!, dateOfBirth: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Gender</label>
              <select
                value={formData.personalDetails?.gender || 'MALE'}
                onChange={(e) =>
                  updateFormData({
                    personalDetails: { ...formData.personalDetails!, gender: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number</label>
              <input
                type="text"
                value={formData.personalDetails?.mobile || ''}
                onChange={(e) =>
                  updateFormData({
                    personalDetails: { ...formData.personalDetails!, mobile: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.personalDetails?.email || ''}
                onChange={(e) =>
                  updateFormData({
                    personalDetails: { ...formData.personalDetails!, email: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Income & Employment */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Employment Type</label>
            <div className="grid grid-cols-3 gap-3">
              {(['SALARIED', 'SELF_EMPLOYED', 'BUSINESS'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    updateFormData({
                      employmentDetails: { ...formData.employmentDetails!, employmentType: type },
                    })
                  }
                  className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all ${
                    formData.employmentDetails?.employmentType === type
                      ? 'bg-blue-600/30 border-blue-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Employer / Enterprise Name</label>
              <input
                type="text"
                value={formData.employmentDetails?.employerName || ''}
                onChange={(e) =>
                  updateFormData({
                    employmentDetails: { ...formData.employmentDetails!, employerName: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Net Monthly Take-Home Income (₹)</label>
              <input
                type="number"
                value={formData.employmentDetails?.monthlyIncome || 0}
                onChange={(e) =>
                  updateFormData({
                    employmentDetails: { ...formData.employmentDetails!, monthlyIncome: Number(e.target.value) },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Existing Monthly Loan EMIs / Obligations (₹)</label>
              <input
                type="number"
                value={formData.employmentDetails?.existingObligations || 0}
                onChange={(e) =>
                  updateFormData({
                    employmentDetails: { ...formData.employmentDetails!, existingObligations: Number(e.target.value) },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: Bank Details */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 mb-2">
            Disbursement will be wired directly via IMPS / RTGS to this designated verified bank account.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={formData.bankDetails?.accountHolderName || ''}
                onChange={(e) =>
                  updateFormData({
                    bankDetails: { ...formData.bankDetails!, accountHolderName: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Name</label>
              <input
                type="text"
                value={formData.bankDetails?.bankName || ''}
                onChange={(e) =>
                  updateFormData({
                    bankDetails: { ...formData.bankDetails!, bankName: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number</label>
              <input
                type="text"
                value={formData.bankDetails?.accountNumber || ''}
                onChange={(e) =>
                  updateFormData({
                    bankDetails: { ...formData.bankDetails!, accountNumber: e.target.value },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.bankDetails?.ifscCode || ''}
                onChange={(e) =>
                  updateFormData({
                    bankDetails: { ...formData.bankDetails!, ifscCode: e.target.value.toUpperCase() },
                  })
                }
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Final Review & Decision Submission */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">Application Summary</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Selected Product</span>
                <div className="text-sm font-bold text-white mt-0.5">{selectedProduct?.name}</div>
              </div>
              <div>
                <span className="text-slate-400">Requested Amount</span>
                <div className="text-sm font-bold text-blue-400 mt-0.5">
                  ₹{formData.requestedAmount.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Tenure</span>
                <div className="text-sm font-bold text-white mt-0.5">{formData.tenureMonths} Months</div>
              </div>
              <div>
                <span className="text-slate-400">Estimated EMI</span>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  ₹{estimatedEmi.toLocaleString('en-IN')}/mo
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400">Applicant Name</span>
                <div className="text-white font-medium">
                  {formData.personalDetails?.firstName} {formData.personalDetails?.lastName}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Disbursal Bank</span>
                <div className="text-white font-medium">
                  {formData.bankDetails?.bankName} (A/C: ••••{formData.bankDetails?.accountNumber?.slice(-4)})
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3 text-xs text-blue-300">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-400" />
            <div>
              <div className="font-bold text-white">Automated Underwriting & Credit Decisioning</div>
              <p className="mt-0.5 text-slate-300 leading-relaxed">
                By submitting this application, our Rule Engine (BRE) will instantly assess eligibility, check limits, and generate an official binding loan offer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < 5 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => prev + 1)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitApplication}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isSubmitting ? 'Evaluating Credit Decision...' : 'Submit Loan Application'}
          </button>
        )}
      </div>
    </div>
  );
};
