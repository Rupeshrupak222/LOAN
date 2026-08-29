'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
    employmentType: '',
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

  const field = (label: string, key: keyof typeof form, type = 'text', required = false) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => update(key, e.target.value)}
        required={required}
      />
    </div>
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title="New Customer" subtitle="Create a customer record" />
      <Card className="p-6">
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('First Name', 'firstName', 'text', true)}
          {field('Last Name', 'lastName', 'text', true)}
          {field('Mobile', 'mobile', 'text', true)}
          {field('Email', 'email', 'email')}
          {field('City', 'city')}
          {field('State', 'state')}
          {field('Employment Type', 'employmentType')}
          {field('Employer / Business', 'employerName')}
          {field('Monthly Income', 'monthlyIncome', 'number')}

          {error && (
            <div className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="sm:col-span-2 flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Create Customer'}
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
