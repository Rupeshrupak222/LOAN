'use client';

import { useState } from 'react';
import {
  X,
  Package,
  ArrowRight,
  ArrowLeft,
  Check,
  Percent,
  Layers,
  ShieldCheck,
  Receipt,
  Users,
  Sparkles,
} from 'lucide-react';
import { CreateProductDto, ProductType, InterestCalculationModel, LendingChannel } from '../types';
import { useCreateProduct } from '../hooks/useProducts';
import { Button, Card, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Props {
  onClose: () => void;
}

export function CreateProductModal({ onClose }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const createMutation = useCreateProduct();

  const [formData, setFormData] = useState<CreateProductDto>({
    code: '',
    name: '',
    description: '',
    productType: 'PERSONAL_LOAN',
    minAmount: 25000,
    maxAmount: 1000000,
    defaultAmount: 200000,
    amountIncrement: 5000,
    minTenureMonths: 6,
    maxTenureMonths: 36,
    allowedTenures: [6, 12, 18, 24, 36],
    interestModel: 'REDUCING_BALANCE',
    baseInterestRateAnnualPct: 14.0,
    feeSchedule: {
      processingFeePct: 2.0,
      processingFeeMinInr: 1000,
      documentationChargesInr: 500,
      platformFeeInr: 250,
      foreclosurePenaltyPct: 3.0,
      lockInMonths: 6,
      latePaymentPenaltyMonthlyPct: 2.0,
      gracePeriodDays: 3,
      bounceChargeInr: 500,
    },
    eligibility: {
      minAge: 21,
      maxAge: 58,
      minMonthlyIncome: 25000,
      allowedEmploymentTypes: ['SALARIED', 'SELF_EMPLOYED'],
      residenceRequirement: 'INDIAN_RESIDENT',
    },
    documents: [
      { category: 'IDENTITY', documentType: 'PAN', mandatory: true, description: 'PAN Card Verification' },
      { category: 'IDENTITY', documentType: 'AADHAAR', mandatory: true, description: 'Aadhaar eKYC Verification' },
      { category: 'INCOME', documentType: 'SALARY_SLIP', mandatory: true, description: '3 Months Salary Slips' },
    ],
    creditPolicy: {
      minCibilScore: 650,
      maxFoirPct: 50,
      bureauProvider: 'CIBIL',
    },
    riskPolicy: {
      riskGrade: 'LOW',
      maxFraudScore: 40,
      pennyDropRequired: true,
      livenessCheckRequired: true,
    },
    workflowId: 'wf-orig-standard',
    allowedChannels: ['DIRECT_BORROWER', 'LOAN_OFFICER', 'BRANCH'],
    isDefault: false,
  });

  const steps = [
    { number: 1, title: 'Basic Identity' },
    { number: 2, title: 'Financial Bounds' },
    { number: 3, title: 'Fees & Penalties' },
    { number: 4, title: 'Policy & Workflow' },
    { number: 5, title: 'Review & Submit' },
  ];

  const handleSubmit = () => {
    createMutation.mutate(formData, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Lending Product Draft</h2>
              <p className="text-xs text-slate-400">Step {currentStep} of 5: {steps[currentStep - 1].title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Header */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-950/30 flex items-center justify-between gap-2 overflow-x-auto">
          {steps.map((s) => (
            <div key={s.number} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  currentStep === s.number
                    ? 'bg-blue-600 text-white ring-2 ring-blue-500/30'
                    : currentStep > s.number
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-500'
                )}
              >
                {currentStep > s.number ? <Check className="w-3.5 h-3.5" /> : s.number}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap',
                  currentStep === s.number ? 'text-white font-semibold' : 'text-slate-500'
                )}
              >
                {s.title}
              </span>
              {s.number < 5 && <div className="w-4 h-0.5 bg-slate-800 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Step Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* STEP 1: BASIC IDENTITY */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Product Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. PERSONAL_PRIME_2026"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Product Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Prime Salaried Personal Loan"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Product Category</label>
                <select
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                >
                  <option value="PERSONAL_LOAN">Personal Loan</option>
                  <option value="INSTANT_PERSONAL_LOAN">Instant Personal Loan (STP)</option>
                  <option value="SALARY_LOAN">Salary Advance</option>
                  <option value="BUSINESS_LOAN">SME Business Loan</option>
                  <option value="MERCHANT_LOAN">Merchant Cash Advance</option>
                  <option value="CREDIT_LINE">Credit Line</option>
                  <option value="BNPL">BNPL</option>
                  <option value="EDUCATION_LOAN">Education Loan</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe target demographic, collateral requirements, and core value proposition..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500"
                />
              </div>
            </div>
          )}

          {/* STEP 2: FINANCIAL BOUNDS */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Min Loan Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Max Loan Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Min Tenure (Months)</label>
                  <input
                    type="number"
                    value={formData.minTenureMonths}
                    onChange={(e) => setFormData({ ...formData, minTenureMonths: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Max Tenure (Months)</label>
                  <input
                    type="number"
                    value={formData.maxTenureMonths}
                    onChange={(e) => setFormData({ ...formData, maxTenureMonths: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Interest Model</label>
                  <select
                    value={formData.interestModel}
                    onChange={(e) => setFormData({ ...formData, interestModel: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  >
                    <option value="REDUCING_BALANCE">Reducing Balance (Standard)</option>
                    <option value="FIXED_FLAT">Fixed Flat Rate</option>
                    <option value="FLOATING_MCLR_LINKED">Floating (MCLR Linked)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Base Interest Rate (% p.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.baseInterestRateAnnualPct}
                    onChange={(e) => setFormData({ ...formData, baseInterestRateAnnualPct: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: FEES & PENALTIES */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Processing Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.feeSchedule.processingFeePct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, processingFeePct: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Min Processing Fee (₹)</label>
                  <input
                    type="number"
                    value={formData.feeSchedule.processingFeeMinInr}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, processingFeeMinInr: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Documentation Charges (₹)</label>
                  <input
                    type="number"
                    value={formData.feeSchedule.documentationChargesInr}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, documentationChargesInr: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Foreclosure Penalty (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.feeSchedule.foreclosurePenaltyPct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, foreclosurePenaltyPct: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Lock-in Period (Months)</label>
                  <input
                    type="number"
                    value={formData.feeSchedule.lockInMonths}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, lockInMonths: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Monthly Late Fee (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.feeSchedule.latePaymentPenaltyMonthlyPct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, latePaymentPenaltyMonthlyPct: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: POLICY & WORKFLOW */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Min Monthly Income (₹)</label>
                  <input
                    type="number"
                    value={formData.eligibility.minMonthlyIncome}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        eligibility: { ...formData.eligibility, minMonthlyIncome: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Min CIBIL Bureau Score</label>
                  <input
                    type="number"
                    value={formData.creditPolicy.minCibilScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        creditPolicy: { ...formData.creditPolicy, minCibilScore: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Workflow Assignment</label>
                <select
                  value={formData.workflowId}
                  onChange={(e) => setFormData({ ...formData, workflowId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white font-mono"
                >
                  <option value="wf-orig-standard">wf-orig-standard (Assisted Lending Flow)</option>
                  <option value="wf-orig-digital">wf-orig-digital (Instant Digital STP Flow)</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW */}
          {currentStep === 5 && (
            <div className="space-y-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                Review Product Configuration Summary
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Product Code:</span>{' '}
                  <span className="text-white font-mono font-bold">{formData.code || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Product Name:</span>{' '}
                  <span className="text-white font-bold">{formData.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Amount Bounds:</span>{' '}
                  <span className="text-white font-bold">₹{formData.minAmount} - ₹{formData.maxAmount}</span>
                </div>
                <div>
                  <span className="text-slate-400">Tenure Bounds:</span>{' '}
                  <span className="text-white font-bold">{formData.minTenureMonths} - {formData.maxTenureMonths} Months</span>
                </div>
                <div>
                  <span className="text-slate-400">Base Interest Rate:</span>{' '}
                  <span className="text-emerald-400 font-bold">{formData.baseInterestRateAnnualPct}% p.a.</span>
                </div>
                <div>
                  <span className="text-slate-400">Min CIBIL Score:</span>{' '}
                  <span className="text-white font-bold">{formData.creditPolicy.minCibilScore}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
                This product will be created in <strong>DRAFT</strong> status. You can review, test pricing simulations, and explicitly activate it when ready for live originations.
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
            className="text-slate-400 text-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {currentStep < 5 ? (
            <Button
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.min(prev + 1, 5))}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={createMutation.isPending || !formData.code || !formData.name}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
            >
              {createMutation.isPending ? 'Creating Draft...' : 'Confirm & Save Draft'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
