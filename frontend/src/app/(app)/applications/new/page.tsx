'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Calculator,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Percent,
  Calendar,
  IndianRupee,
  Layers,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input } from '@/components/ui';
import { cn, formatMoney } from '@/lib/utils';

export default function NewApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [loanMode, setLoanMode] = useState<'CUSTOM' | 'PRESET'>('CUSTOM');
  const [productId, setProductId] = useState('');
  const [customLoanName, setCustomLoanName] = useState('Personal Loan');
  const [requestedAmount, setRequestedAmount] = useState<number | string>(100000);
  const [customInterestRate, setCustomInterestRate] = useState<number | string>(12.5);
  const [tenureMonths, setTenureMonths] = useState<number | string>(24);
  const [purpose, setPurpose] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Customers
  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => (await api.get('/customers')).data.data,
  });

  // Fetch Loan Products
  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: async () => (await api.get('/loan-products')).data.data,
  });

  const selectedCustomer = customersData?.find((c: any) => c.id === customerId);
  const selectedProduct = productsData?.find((p: any) => p.id === productId);

  // When a preset product is clicked, autofill custom inputs
  function handleSelectPreset(p: any) {
    setProductId(p.id);
    setCustomLoanName(p.name);
    setCustomInterestRate(Number(p.interestRate));
    setRequestedAmount(Math.max(Number(p.minAmount), Number(requestedAmount) || 50000));
    setTenureMonths(p.minTenureMonths || 12);
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

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      const res = await api.post('/applications', {
        customerId,
        productId: loanMode === 'PRESET' && productId ? productId : undefined,
        productName: customLoanName.trim() || 'Custom Loan Scheme',
        requestedAmount: principalNum,
        interestRate: rateNum,
        tenureMonths: tenureNum,
        purpose,
      });
      router.push(`/applications/${res.data.data.id}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Back to Applications Link */}
      <div>
        <Link
          href="/applications"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white transition-colors group"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E2445] shadow-2xs group-hover:border-brand-500 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/50 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </span>
          <span>Back to Loan Applications</span>
        </Link>
      </div>

      <PageHeader
        breadcrumb="Lending / Origination"
        title="Originate Loan Application"
        subtitle="Multi-step loan intake wizard with custom terms & real-time financial assessment"
      />

      {/* Stepper Header */}
      <div className="grid grid-cols-4 gap-2 border-b border-slate-200/80 pb-4">
        {[
          { num: 1, title: 'Borrower', icon: UserCheck },
          { num: 2, title: 'Custom Terms', icon: Calculator },
          { num: 3, title: 'Purpose & Info', icon: ShieldCheck },
          { num: 4, title: 'Review & Submit', icon: Check },
        ].map((s) => {
          const Icon = s.icon;
          const active = step === s.num;
          const done = step > s.num;
          return (
            <div
              key={s.num}
              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                active
                  ? 'border-brand-600 bg-brand-50/80 text-brand-900 font-semibold'
                  : done
                  ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-400'
              }`}
            >
              <div
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-lg text-xs font-bold ${
                  active
                    ? 'bg-brand-600 text-white'
                    : done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {done ? '✓' : s.num}
              </div>
              <span className="text-xs truncate">{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* Step 1: Select Customer */}
      {step === 1 && (
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Step 1: Select Borrower Account
            </h3>
            <p className="text-xs text-slate-500">Choose the registered customer for this application</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Borrower Account *</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium focus:border-brand-600 focus:outline-none"
            >
              <option value="">-- Select Registered Customer --</option>
              {customersData?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name || `${c.firstName} ${c.lastName}`} ({c.customerCode}) · {c.mobile} · KYC: {c.kycStatus}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomer && (
            <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4 text-xs space-y-1">
              <p className="font-bold text-brand-900 text-sm">Selected: {selectedCustomer.name}</p>
              <p className="text-slate-600">
                Mobile: {selectedCustomer.mobile} · Customer ID: {selectedCustomer.customerCode}
              </p>
              <p className="text-slate-600">
                KYC Status: <span className="font-semibold text-brand-800">{selectedCustomer.kycStatus}</span> · Risk:{' '}
                <span className="font-semibold">{selectedCustomer.riskCategory || 'PENDING'}</span>
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              disabled={!customerId}
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5"
            >
              Continue to Custom Terms <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Custom Loan Terms & Interest Rate */}
      {step === 2 && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Step 2: Custom Loan Amount & Interest Terms
              </h3>
              <p className="text-xs text-slate-500">
                Specify your custom loan amount, interest rate (% p.a.), and tenure
              </p>
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

          {/* Preset Schemes Selector if Preset mode is selected */}
          {loanMode === 'PRESET' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Select from Standard Product Templates (Click to apply & edit)
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
            {/* 1. Loan Name / Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Loan Scheme / Scheme Name *
              </label>
              <Input
                placeholder="e.g. Custom Personal Loan / Business Working Capital"
                value={customLoanName}
                onChange={(e) => setCustomLoanName(e.target.value)}
                required
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'Personal Loan',
                  'Business Loan',
                  'Vehicle Loan',
                  'Emergency Loan',
                  'Education Loan',
                  'Home Renovation Loan',
                  'Working Capital Loan',
                ].map((name) => (
                  <button
                    type="button"
                    key={name}
                    onClick={() => setCustomLoanName(name)}
                    className={cn(
                      'text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer',
                      customLoanName === name
                        ? 'bg-brand-600 text-white border-brand-600 font-bold shadow-2xs'
                        : 'border-slate-200 bg-white dark:bg-[#1E2445] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Principal Loan Amount */}
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
                {[25000, 50000, 100000, 250000, 500000, 1000000, 2500000].map((amt) => (
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

            {/* 3. Custom Annual Interest Rate & Tenure (2-column) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Interest Rate */}
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
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[8.5, 10.0, 12.0, 14.5, 18.0, 24.0].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setCustomInterestRate(r)}
                      className={cn(
                        'text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer',
                        rateNum === r
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white dark:bg-[#1E2445] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      )}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenure Months */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>Loan Tenure (Months) *</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  max={360}
                  step={1}
                  placeholder="e.g. 24"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value)}
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[6, 12, 18, 24, 36, 48, 60].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setTenureMonths(t)}
                      className={cn(
                        'text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer',
                        tenureNum === t
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white dark:bg-[#1E2445] text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      )}
                    >
                      {t} Mo
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live EMI & Financial Breakdown Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#16203D] p-4 grid grid-cols-3 gap-3 text-center shadow-inner">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Estimated Monthly EMI</p>
                <p className="text-lg font-bold text-brand-700 dark:text-brand-400">
                  ₹{Number(emi).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-slate-400">for {tenureNum} months</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Interest ({rateNum}%)</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  ₹{Number(totalInterest).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-emerald-600 font-semibold">Reducing Balance</span>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Repayment</p>
                <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                  ₹{Number(totalRepayment).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-slate-400">Principal + Interest</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              disabled={principalNum <= 0 || rateNum <= 0 || tenureNum <= 0}
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5"
            >
              Next: Purpose & Declarations <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Purpose */}
      {step === 3 && (
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Step 3: Purpose of Loan
            </h3>
            <p className="text-xs text-slate-500">Provide details about fund utilization</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Loan Purpose & Remarks *
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Working capital expansion, machinery purchase, home renovation, or personal financial requirements..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-brand-600 focus:outline-none dark:border-slate-800 dark:bg-[#1E2445] dark:text-slate-200"
              required
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setStep(2)} className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button disabled={!purpose.trim()} onClick={() => setStep(4)} className="flex items-center gap-1.5">
              Review & Submit <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Summary & Submit */}
      {step === 4 && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Step 4: Final Summary & Sanction Submission
            </h3>
            <p className="text-xs text-slate-500">Confirm application parameters before submitting to credit review</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5 space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Borrower:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedCustomer?.name} ({selectedCustomer?.customerCode})
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Loan Scheme:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {customLoanName} · <span className="text-emerald-600 font-bold">{rateNum}% p.a.</span>
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Sanction Amount:</span>
              <span className="font-bold text-brand-700 dark:text-brand-400 text-base">
                ₹{principalNum.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Tenure:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{tenureNum} Months</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Estimated Monthly EMI:</span>
              <span className="font-bold text-brand-700 dark:text-brand-400">
                ₹{Number(emi).toLocaleString('en-IN')} / month
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
              <span className="text-slate-500">Total Repayment (Principal + Interest):</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{Number(totalRepayment).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Purpose:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-right max-w-sm">{purpose}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setStep(3)} className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button disabled={saving} onClick={handleSubmit} className="px-6">
              {saving ? 'Originating Application...' : 'Confirm & Submit Application ✓'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
