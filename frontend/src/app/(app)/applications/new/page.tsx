'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, ArrowRight, ArrowLeft, Calculator, ShieldCheck, UserCheck } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

export default function NewApplicationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');
  const [requestedAmount, setRequestedAmount] = useState(100000);
  const [tenureMonths, setTenureMonths] = useState(24);
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

  // Live EMI Calculation (Reducing Balance)
  const rate = selectedProduct ? Number(selectedProduct.interestRate) : 14.5;
  const monthlyRate = rate / 12 / 100;
  const emi =
    requestedAmount > 0 && tenureMonths > 0
      ? (
          (requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
          (Math.pow(1 + monthlyRate, tenureMonths) - 1)
        ).toFixed(2)
      : '0.00';
  const totalRepayment = (Number(emi) * tenureMonths).toFixed(2);
  const totalInterest = (Number(totalRepayment) - requestedAmount).toFixed(2);

  async function handleSubmit() {
    setError(null);
    setSaving(true);
    try {
      const res = await api.post('/applications', {
        customerId,
        productId,
        requestedAmount,
        tenureMonths,
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
      <PageHeader
        breadcrumb="Lending / Origination"
        title="Originate Loan Application"
        subtitle="Multi-step loan intake wizard with real-time financial assessment"
      />

      {/* Stepper Header */}
      <div className="grid grid-cols-4 gap-2 border-b border-slate-200/80 pb-4">
        {[
          { num: 1, title: 'Borrower', icon: UserCheck },
          { num: 2, title: 'Product & Loan', icon: Calculator },
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
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Step 1: Select Borrower Account</h3>
            <p className="text-xs text-slate-500">Choose the registered customer for this application</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Borrower Account</label>
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
              <p className="text-slate-600">Mobile: {selectedCustomer.mobile} · Customer ID: {selectedCustomer.customerCode}</p>
              <p className="text-slate-600">KYC Status: <span className="font-semibold text-brand-800">{selectedCustomer.kycStatus}</span> · Risk: <span className="font-semibold">{selectedCustomer.riskCategory || 'PENDING'}</span></p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              disabled={!customerId}
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5"
            >
              Continue to Product Selection <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Product & Amount */}
      {step === 2 && (
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Step 2: Loan Product & Terms</h3>
            <p className="text-xs text-slate-500">Select loan product and customize tenure & principal</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Select Loan Product</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {productsData?.map((p: any) => {
                const selected = productId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setProductId(p.id);
                      setRequestedAmount(Math.max(Number(p.minAmount), requestedAmount));
                    }}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      selected
                        ? 'border-brand-600 bg-brand-50/80 shadow-sm ring-2 ring-brand-600/30'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.productType} · {p.interestRate}% p.a.</p>
                    <p className="text-xs text-brand-700 font-semibold mt-2">
                      ₹{Number(p.minAmount).toLocaleString('en-IN')} - ₹{Number(p.maxAmount).toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedProduct && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Requested Principal Amount</label>
                  <span className="font-bold text-brand-700 text-base">₹{requestedAmount.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={Number(selectedProduct.minAmount)}
                  max={Number(selectedProduct.maxAmount)}
                  step={5000}
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Tenure (Months)</label>
                  <span className="font-bold text-slate-900 text-sm">{tenureMonths} Months</span>
                </div>
                <input
                  type="range"
                  min={selectedProduct.minTenureMonths}
                  max={selectedProduct.maxTenureMonths}
                  step={3}
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              {/* Live Calculator Box */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Estimated Monthly EMI</p>
                  <p className="text-lg font-bold text-brand-700">₹{Number(emi).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Total Interest</p>
                  <p className="text-base font-semibold text-slate-800">₹{Number(totalInterest).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Total Repayment</p>
                  <p className="text-base font-semibold text-slate-800">₹{Number(totalRepayment).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setStep(1)} className="flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button disabled={!productId} onClick={() => setStep(3)} className="flex items-center gap-1.5">
              Next: Purpose & Declarations <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Purpose */}
      {step === 3 && (
        <Card className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Step 3: Purpose of Loan</h3>
            <p className="text-xs text-slate-500">Provide details about fund utilization</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Loan Purpose & Remarks</label>
            <textarea
              rows={4}
              placeholder="e.g. Working capital expansion, home renovation, or equipment purchase..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:border-brand-600 focus:outline-none"
              required
            />
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
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
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Step 4: Final Summary & Sanction Submission</h3>
            <p className="text-xs text-slate-500">Confirm application parameters before submitting to credit review</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Borrower:</span>
              <span className="font-semibold text-slate-900">{selectedCustomer?.name} ({selectedCustomer?.customerCode})</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Loan Product:</span>
              <span className="font-semibold text-slate-900">{selectedProduct?.name} ({selectedProduct?.interestRate}% p.a.)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Sanction Amount:</span>
              <span className="font-bold text-brand-700 text-base">₹{requestedAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Tenure:</span>
              <span className="font-semibold text-slate-900">{tenureMonths} Months</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500">Estimated Monthly EMI:</span>
              <span className="font-bold text-slate-900">₹{Number(emi).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Purpose:</span>
              <span className="font-medium text-slate-800 text-right max-w-sm">{purpose}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {error}
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-slate-100">
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
