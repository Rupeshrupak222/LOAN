'use client';

import { useState } from 'react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Button, Card, Input, KpiCard } from '@/components/ui';
import { formatMoney } from '@/lib/utils';

interface AmortizationRow {
  emiNumber: number;
  principal: string;
  interest: string;
  emi: string;
  balance: string;
}
interface EmiResult {
  emi: string;
  totalInterest: string;
  totalRepayment: string;
  schedule: AmortizationRow[];
}

export default function EmiCalculatorPage() {
  const [principal, setPrincipal] = useState('500000');
  const [interestRate, setInterestRate] = useState('12');
  const [tenureMonths, setTenureMonths] = useState('24');
  const [result, setResult] = useState<EmiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/finance/emi', {
        principal: Number(principal),
        interestRate: Number(interestRate),
        tenureMonths: Number(tenureMonths),
      });
      setResult(res.data.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader title="EMI Calculator" subtitle="Reducing-balance amortization" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1">
          <form onSubmit={calculate} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Principal</label>
              <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Annual Interest Rate (%)
              </label>
              <Input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Tenure (months)</label>
              <Input
                type="number"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Calculating...' : 'Calculate'}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          {result ? (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <KpiCard label="Monthly EMI" value={formatMoney(result.emi)} />
                <KpiCard label="Total Interest" value={formatMoney(result.totalInterest)} />
                <KpiCard label="Total Repayment" value={formatMoney(result.totalRepayment)} />
              </div>
              <Card className="mt-4">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-2">#</th>
                        <th className="px-4 py-2">Principal</th>
                        <th className="px-4 py-2">Interest</th>
                        <th className="px-4 py-2">EMI</th>
                        <th className="px-4 py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.schedule.map((r) => (
                        <tr key={r.emiNumber} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-2">{r.emiNumber}</td>
                          <td className="px-4 py-2">{formatMoney(r.principal)}</td>
                          <td className="px-4 py-2">{formatMoney(r.interest)}</td>
                          <td className="px-4 py-2">{formatMoney(r.emi)}</td>
                          <td className="px-4 py-2">{formatMoney(r.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            <Card className="flex h-full items-center justify-center p-10 text-sm text-slate-400">
              Enter values and calculate to see the amortization schedule.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
