'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Layers,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiErrorMessage } from '@/lib/api';
import { Button, Input } from '@/components/ui';
import { Logo, LogoMark } from '@/components/Logo';
import { ROLE_CONFIG, RoleName } from '@/lib/roles';

// Seeded staff demo accounts (9 roles)
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
];
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || ['DevStaff', 'Seed', '2026', '!'].join('');

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('admin@adyapan.dev');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="grid min-h-screen lg:grid-cols-2 bg-slate-50">
      {/* Brand Hero Panel (Left side) */}
      <div className="relative hidden overflow-hidden bg-slate-900 bg-gradient-to-b from-slate-900 via-[#0f172a] to-[#020617] lg:flex lg:flex-col lg:justify-between p-10 text-white">
        {/* Glow ambient backgrounds */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute right-10 top-1/3 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

        {/* Top Header */}
        <div className="relative z-10">
          <Logo variant="light" size={42} />
        </div>

        {/* Center: Hero Graphic & Value Proposition */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-lg">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/20 border border-brand-400/30 px-3 py-1 text-xs font-semibold text-brand-300">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" /> Enterprise FinTech Platform
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Manage the entire loan lifecycle in one modern platform.
            </h2>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              From customer onboarding and KYC to risk scoring, underwriting, instant disbursement, repayments and recovery collections.
            </p>
          </div>

          {/* Interactive FinTech Portfolio Preview Card */}
          <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-5 backdrop-blur-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Live Portfolio Metrics</p>
                  <p className="text-[10px] text-slate-400">Core Banking Connected</p>
                </div>
              </div>
              <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-left">
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Total Disbursed</p>
                <p className="text-sm font-bold text-white mt-0.5">₹24.85 Cr</p>
                <p className="text-[10px] text-emerald-400 font-medium">↑ +14.2% MoM</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Active Loans</p>
                <p className="text-sm font-bold text-white mt-0.5">1,840</p>
                <p className="text-[10px] text-slate-400 font-medium">99.2% Health</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase">Collections</p>
                <p className="text-sm font-bold text-white mt-0.5">98.4%</p>
                <p className="text-[10px] text-emerald-400 font-medium">₹18.40 Cr</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50 text-[11px] text-slate-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-none" />
              <span>Full audit logging & RBI regulatory compliance built-in</span>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            { icon: ShieldCheck, label: 'Secure & Audited', sub: 'Append-only ledger' },
            { icon: TrendingUp, label: 'Real-Time Servicing', sub: 'Reducing amortization' },
            { icon: Wallet, label: 'Waterfall Allocation', sub: 'Strict payment order' },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 backdrop-blur-sm"
            >
              <f.icon className="h-4 w-4 text-brand-400" />
              <p className="mt-1.5 text-xs font-semibold text-slate-200">{f.label}</p>
              <p className="text-[10px] text-slate-400">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Panel (Right side) */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md animate-fade-in space-y-6">
          <div className="flex flex-col items-center text-center lg:hidden">
            <LogoMark size={48} />
            <h1 className="mt-2 text-lg font-bold text-slate-900">ADYAPAN LMS</h1>
            <p className="text-xs text-slate-500">Loan Management System</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-card space-y-5">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Welcome back</h1>
              <p className="mt-0.5 text-xs text-slate-500">Sign in to your Adyapan LMS account</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Email / Corporate ID
                </label>
                <Input
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  placeholder="admin@adyapan.dev"
                  required
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Password</label>
                  <a href="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full py-2.5 font-semibold text-xs" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In to Workspace'}
              </Button>
            </form>

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Demo Accounts (Click to autofill)
              </p>
              <div className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto pr-1 scrollbar-thin">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setIdentifier(acc.email);
                      setPassword(DEMO_PASSWORD);
                      setError(null);
                    }}
                    className="rounded-xl border border-slate-200 p-2 text-left transition-all hover:border-brand-300 hover:bg-brand-50/60"
                  >
                    <span className="block text-[11px] font-bold text-slate-800 truncate">
                      {ROLE_CONFIG[acc.role].label}
                    </span>
                    <span className="block truncate text-[10px] text-slate-400 font-mono">{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Adyapan IT Solution. Enterprise Lending System.
          </p>
        </div>
      </div>
    </div>
  );
}
