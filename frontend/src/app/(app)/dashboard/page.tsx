'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircle2 } from 'lucide-react';
import { Card, KpiCard, Spinner } from '@/components/ui';
import { DecorRingsLight } from '@/components/Decor';
import { useAuth } from '@/lib/auth';
import { dashboardPresetFor, roleConfigFor } from '@/lib/roles';

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) return <Spinner />;

  const preset = dashboardPresetFor(user.roles);
  const roleCfg = roleConfigFor(user.roles);

  return (
    <div>
      {/* Gradient welcome banner with decorative rings */}
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-brand-gradient p-6 shadow-glow sm:p-7">
        <DecorRingsLight />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
            {roleCfg.label}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            Welcome, {user.firstName} 👋
          </h1>
          <p className="mt-1 max-w-xl text-sm text-white/70">{preset.subtitle}</p>
        </div>
      </div>

      {/* KPIs tailored to this role */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {preset.kpis.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} hint={k.hint} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Role workflow */}
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Your workflow</h3>
          <ol className="space-y-4">
            {preset.flow.map((f, i) => (
              <li key={f.step} className="flex gap-3">
                <div className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                  {i + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{f.step}</p>
                  <p className="text-xs text-slate-400">{f.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {/* Role chart */}
        {preset.chart && (
          <Card className="p-5 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold text-slate-700">{preset.chart.title}</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={preset.chart.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1f4fd8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* What this role can access */}
      <div className="mt-6">
        <Card className="p-5">
          <h3 className="mb-1 text-sm font-semibold text-slate-700">Your access</h3>
          <p className="mb-4 text-xs text-slate-400">{roleCfg.description}</p>
          <div className="flex flex-wrap gap-2">
            {roleCfg.nav.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-brand-600" />
                {key.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
