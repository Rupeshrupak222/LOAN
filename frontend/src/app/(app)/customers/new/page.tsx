'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';
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
    city: '',
    state: '',
    employmentType: 'SALARIED',
    employerName: '',
    monthlyIncome: '',
  });
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
        monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : undefined,
      };
      const res = await api.post('/customers', payload);
      router.push(`/customers/${res.data.data.id}`);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        breadcrumb="Customers / New Profile"
        title="Add New Customer Profile"
        subtitle="Onboard a new borrower into the LMS and establish identity records"
      />

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              1. Basic Personal Information
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
                <label className="mb-1 block text-xs font-semibold text-slate-700">Email Address</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="e.g. rahul.sharma@example.com"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              2. Geographic Location
            </h3>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">City</label>
                <Input
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="e.g. Pune"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">State</label>
                <Input
                  value={form.state}
                  onChange={(e) => update('state', e.target.value)}
                  placeholder="e.g. Maharashtra"
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
                <label className="mb-1 block text-xs font-semibold text-slate-700">Employment Type</label>
                <select
                  value={form.employmentType}
                  onChange={(e) => update('employmentType', e.target.value)}
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
                <label className="mb-1 block text-xs font-semibold text-slate-700">Employer / Business Name</label>
                <Input
                  value={form.employerName}
                  onChange={(e) => update('employerName', e.target.value)}
                  placeholder="e.g. Tech Solutions Pvt Ltd"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Monthly Gross Income (INR)</label>
                <Input
                  type="number"
                  value={form.monthlyIncome}
                  onChange={(e) => update('monthlyIncome', e.target.value)}
                  placeholder="e.g. 65000"
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
