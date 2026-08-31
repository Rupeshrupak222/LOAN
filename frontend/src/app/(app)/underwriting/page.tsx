'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCheck, ArrowRight, ShieldAlert, UserCheck, Calculator } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, KpiCard, Spinner } from '@/components/ui';
import { formatMoney, formatDate, cn } from '@/lib/utils';

export default function UnderwritingQueuePage() {
  const { isDark } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['underwriting-queue'],
    queryFn: async () => {
      const res = await api.get('/underwriting/queue');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  if (isLoading) return <Spinner />;

  const queue = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Lending / Underwriting"
        title="Underwriting & Credit Assessment Queue"
        subtitle="Review loan proposals, credit eligibility factors, and authorize sanction limits"
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <KpiCard
          label="Pending Underwriting"
          value={String(queue.length)}
          hint="Awaiting credit decision"
          icon={<ClipboardCheck className="h-4 w-4" />}
        />
        <KpiCard
          label="Total Value in Queue"
          value={formatMoney(queue.reduce((acc: number, q: any) => acc + Number(q.requestedAmount || 0), 0))}
          hint="Aggregate sanction pipeline"
          icon={<Calculator className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />}
        />
        <KpiCard
          label="SLA Compliance"
          value="100%"
          hint="Average turnaround < 6 hrs"
          icon={<UserCheck className="h-4 w-4 text-emerald-600 dark:text-[#10B981]" />}
        />
      </div>

      <Card noPadding className="p-5 space-y-4">
        <h3 className={cn("text-xs font-bold uppercase tracking-wider", isDark ? "text-white" : "text-slate-900")}>
          Active Assessment Queue
        </h3>
        {queue.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className={cn(
                "border-b text-[11px] font-bold uppercase",
                isDark ? "border-[#2B3566] bg-[#16203D] text-slate-400" : "border-slate-200 bg-slate-50/80 text-slate-500"
              )}>
                <tr>
                  <th className="py-2.5 px-3">Application</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Requested Amount</th>
                  <th className="py-2.5 px-3">Eligibility</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className={cn(
                "divide-y text-xs",
                isDark ? "divide-[#2B3566] text-slate-200" : "divide-slate-100 text-slate-700"
              )}>
                {queue.map((app: any) => (
                  <tr key={app.id} className={cn("transition-colors", isDark ? "hover:bg-[#16203D]/60" : "hover:bg-slate-50/70")}>
                    <td className="py-3 px-3 font-bold text-[#2563EB] dark:text-[#60A5FA]">
                      <Link href={`/applications/${app.id}`} className="hover:underline">
                        {app.applicationNo || 'N/A'}
                      </Link>
                    </td>
                    <td className="py-3 px-3">
                      <p className={cn("font-semibold leading-tight", isDark ? "text-white" : "text-slate-900")}>
                        {app.customer?.firstName || 'Borrower'} {app.customer?.lastName || ''}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{app.customer?.customerCode || '-'}</p>
                    </td>
                    <td className={cn("py-3 px-3 font-medium", isDark ? "text-slate-300" : "text-slate-700")}>{app.product?.name || 'Loan'}</td>
                    <td className={cn("py-3 px-3 font-bold", isDark ? "text-white" : "text-slate-900")}>{formatMoney(app.requestedAmount || 0)}</td>
                    <td className="py-3 px-3">
                      {app.eligibility?.result ? (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-bold border",
                            app.eligibility.result === 'ELIGIBLE'
                              ? (isDark ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                              : (isDark ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-50 text-amber-700 border-amber-200')
                          )}
                        >
                          {app.eligibility.result}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Pending Run</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {app.riskAssessment ? (
                        <span className="font-bold text-[#2563EB] dark:text-[#60A5FA] text-xs">{app.riskAssessment.score}/100</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Unscored</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <Badge status={app.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link href={`/applications/${app.id}`}>
                        <Button size="sm" className="text-xs text-white">
                          Underwrite →
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-8 text-center">No applications currently waiting in the underwriting queue.</p>
        )}
      </Card>
    </div>
  );
}
