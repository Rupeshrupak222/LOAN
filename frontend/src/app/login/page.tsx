'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, TrendingUp, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiErrorMessage } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import { Logo, LogoMark } from '@/components/Logo';
import { DecorCircles } from '@/components/Decor';
import { ROLE_CONFIG, RoleName } from '@/lib/roles';

// Seeded demo accounts — one per role (see database/prisma/seed.ts).
const DEMO_ACCOUNTS: { role: RoleName; email: string }[] = [
  { role: 'SUPER_ADMIN', email: 'superadmin@adyapan.dev' },
  { role: 'ADMIN', email: 'admin@adyapan.dev' },
  { role: 'BRANCH_MANAGER', email: 'manager@adyapan.dev' },
  { role: 'LOAN_OFFICER', email: 'officer@adyapan.dev' },
  { role: 'CREDIT_ANALYST', email: 'analyst@adyapan.dev' },
  { role: 'UNDERWRITER', email: 'underwriter@adyapan.dev' },
  { role: 'FINANCE_OFFICER', email: 'finance@adyapan.dev' },
  { role: 'COLLECTION_OFFICER', email: 'collections@adyapan.dev' },
  { role: 'AUDITOR', email: 'auditor@adyapan.dev' },
  { role: 'CUSTOMER', email: 'customer@adyapan.dev' },
];
const DEMO_PASSWORD = 'Passw0rd!123';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('admin@adyapan.dev');
  const [password, setPassword] = useState('Passw0rd!123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier, password);
      router.push('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-ink-900 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-brand-radial" />
        <DecorCircles />

        <div className="relative z-10 p-10">
          <Logo variant="light" size={44} />
        </div>

        <div className="relative z-10 px-10 pb-4">
          <h2 className="max-w-md text-3xl font-bold leading-tight text-white">
            Manage the entire loan lifecycle in one modern platform.
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/60">
            From onboarding and KYC to disbursement, repayments and collections — built for banks,
            NBFCs and lending businesses.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3 p-10">
          {[
            { icon: ShieldCheck, label: 'Secure & audited' },
            { icon: TrendingUp, label: 'Real-time analytics' },
            { icon: Wallet, label: 'Accurate money engine' },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            >
              <f.icon className="h-5 w-5 text-accent-400" />
              <p className="mt-2 text-xs font-medium text-white/80">{f.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <LogoMark size={52} />
            <h1 className="mt-3 text-lg font-semibold text-slate-900">Adyapan IT Solution</h1>
            <p className="text-sm text-slate-500">Loan Management System</p>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-card">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-slate-900">Welcome back</h1>
              <p className="mt-1 text-sm text-slate-500">Sign in to your Adyapan LMS account</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email / Employee ID
                </label>
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/10">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="text-center">
                <a href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  Forgot Password?
                </a>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-medium text-slate-500">
                Demo accounts (password: {DEMO_PASSWORD}) — click to fill
              </p>
              <div className="grid max-h-52 grid-cols-1 gap-1.5 overflow-auto pr-1 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setIdentifier(acc.email);
                      setPassword(DEMO_PASSWORD);
                      setError(null);
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-left transition hover:border-brand-300 hover:bg-brand-50"
                  >
                    <span className="block text-xs font-semibold text-slate-700">
                      {ROLE_CONFIG[acc.role].label}
                    </span>
                    <span className="block truncate text-[11px] text-slate-400">{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Adyapan IT Solution. Demo environment.
          </p>
        </div>
      </div>
    </div>
  );
}
