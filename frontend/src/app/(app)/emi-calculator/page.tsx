'use client';

import { useState } from 'react';
import { Calculator, ArrowRight, Table } from 'lucide-react';
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
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Insights / Financial Tools"
        title="EMI & Amortization Calculator"
        subtitle="Precision reducing-balance repayment schedule computation"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-1 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Loan Parameters</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure sanction amount, interest, and tenure</p>
          </div>

          <form onSubmit={calculate} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Principal Amount (INR)</label>
              <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Annual Interest Rate (% p.a.)</label>
              <Input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Tenure (Months)</label>
              <Input
                type="number"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-xs text-rose-500">{error}</p>}

            <Button type="submit" className="w-full text-white" disabled={loading}>
              {loading ? 'Calculating...' : 'Compute Amortization Schedule'}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <KpiCard
                  label="Monthly EMI"
                  value={formatMoney(result.emi)}
                  hint="Reducing installment"
                  icon={<Calculator className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />}
                />
                <KpiCard
                  label="Total Interest"
                  value={formatMoney(result.totalInterest)}
                  hint="Cumulative interest cost"
                  icon={<ArrowRight className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
                />
                <KpiCard
                  label="Total Outflow"
                  value={formatMoney(result.totalRepayment)}
                  hint="Principal + Interest"
                  icon={<Table className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />}
                />
              </div>

              <Card noPadding className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Month-by-Month Amortization Schedule
                </h3>

                <div className="max-h-96 overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-[#16203D] border-b border-slate-200 dark:border-[#2B3566] text-[11px] font-bold uppercase text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">Principal</th>
                        <th className="px-3 py-2">Interest</th>
                        <th className="px-3 py-2">Total EMI</th>
                        <th className="px-3 py-2">Remaining Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#2B3566] text-xs text-slate-700 dark:text-slate-200">
                      {result.schedule.map((r) => (
                        <tr key={r.emiNumber} className="hover:bg-slate-50/70 dark:hover:bg-[#16203D]/60 transition-colors">
                          <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-300">{r.emiNumber}</td>
                          <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{formatMoney(r.principal)}</td>
                          <td className="px-3 py-2 text-slate-800 dark:text-slate-200">{formatMoney(r.interest)}</td>
                          <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">{formatMoney(r.emi)}</td>
                          <td className="px-3 py-2 font-bold text-[#2563EB] dark:text-[#60A5FA]">{formatMoney(r.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            <Card className="flex h-full min-h-[300px] flex-col items-center justify-center p-10 text-center">
              <Calculator className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Enter loan terms to generate schedule</p>
              <p className="text-xs text-slate-400 mt-1">
                Configure principal, rate, and tenure on the left panel to calculate live reducing-balance amortization.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
