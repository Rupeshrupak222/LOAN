'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  UserPlus,
  LogIn,
  ArrowRight,
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
const DEMO_PASSWORD = 'Passw0rd!123';

export default function LoginPage() {
  const { login, register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect') || '/dashboard';

  // Mode: 'signin' or 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In state
  const [identifier, setIdentifier] = useState('admin@adyapan.dev');
  const [password, setPassword] = useState('Passw0rd!123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sign Up state
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    mobile: '',
  });
  const [signupShowPassword, setSignupShowPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  async function onSubmitLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      router.push(redirectUrl);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitSignup(e: React.FormEvent) {
    e.preventDefault();
    setSignupError(null);
    setSignupLoading(true);
    try {
      await register({
        email: signupData.email.trim(),
        password: signupData.password,
        firstName: signupData.firstName.trim() || 'Borrower',
        lastName: signupData.lastName.trim() || 'User',
        mobile: signupData.mobile.trim() || undefined,
      });
      router.push(redirectUrl);
    } catch (err) {
      setSignupError(apiErrorMessage(err));
    } finally {
      setSignupLoading(false);
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

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="inline-block transition-opacity hover:opacity-90">
            <Logo size={40} variant="light" />
          </Link>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-400 font-mono tracking-wider uppercase">
            ● Live System
          </span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-brand-400" />
            Enterprise FinTech Platform
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
            Manage the entire loan lifecycle in one modern platform.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            From customer onboarding and KYC to risk scoring, underwriting, instant disbursement,
            repayments and recovery collections.
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Live Portfolio Metrics</p>
                  <p className="text-[10px] text-slate-400">Core Banking Connected</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-300">
                ACTIVE
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">TOTAL DISBURSED</p>
                <p className="mt-0.5 text-sm font-bold text-white">₹24.85 Cr</p>
                <p className="text-[10px] text-emerald-400 font-medium font-mono">↑ +14.2% MoM</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">ACTIVE LOANS</p>
                <p className="mt-0.5 text-sm font-bold text-white">1,840</p>
                <p className="text-[10px] text-emerald-400 font-medium font-mono">99.2% Health</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">COLLECTIONS</p>
                <p className="mt-0.5 text-sm font-bold text-white">98.4%</p>
                <p className="text-[10px] text-slate-400 font-medium font-mono">₹18.40 Cr</p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Full audit logging & RBI regulatory compliance built-in</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">
          {[
            { icon: Lock, label: 'Bank-Grade Security', sub: 'Argon2id + JWT + HTTPS' },
            { icon: Layers, label: '9 LMS Roles', sub: 'Granular RBAC' },
            { icon: Wallet, label: 'Direct Disbursal', sub: 'RBI & Banking Core' },
          ].map((f, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/5 bg-white/5 p-3 backdrop-blur-sm"
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

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card space-y-5">
            {/* Tab Selector: Sign In vs Sign Up */}
            <div className="flex rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'signin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setSignupError(null);
                  if (identifier.includes('@') && !signupData.email) {
                    setSignupData((prev) => ({
                      ...prev,
                      email: identifier,
                      password: password !== DEMO_PASSWORD ? password : '',
                    }));
                  }
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'signup'
                    ? 'bg-[#155EEF] text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Header titles */}
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'signin' ? 'Sign In to Account' : 'Create New Account'}
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                {activeTab === 'signin'
                  ? 'Access your Adyapan LMS workspace or borrower profile'
                  : 'Register your borrower or customer credentials instantly'}
              </p>
            </div>

            {/* ── TAB 1: SIGN IN ── */}
            {activeTab === 'signin' && (
              <>
                <form onSubmit={onSubmitLogin} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Email / Corporate ID
                    </label>
                    <Input
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      autoComplete="username"
                      placeholder="e.g. sdew@gmail.com or admin@adyapan.dev"
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
                    <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 space-y-1.5">
                      <p className="font-semibold">{error}</p>
                      {identifier.includes('@') && (
                        <p className="text-[11px] text-rose-600">
                          Don&apos;t have an account with {identifier} yet?{' '}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('signup');
                              setSignupData((prev) => ({
                                ...prev,
                                email: identifier,
                                password: password !== DEMO_PASSWORD ? password : '',
                              }));
                              setError(null);
                            }}
                            className="font-bold underline cursor-pointer text-[#155EEF]"
                          >
                            Click here to Create Account with this email
                          </button>
                        </p>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full py-2.5 font-semibold text-xs" disabled={loading}>
                    {loading ? 'Authenticating...' : 'Sign In to Workspace'}
                  </Button>
                </form>

                {/* Quick Link to full borrower loan application */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Want to apply for a loan?</span>
                  <Link
                    href="/apply"
                    className="font-bold text-[#155EEF] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Borrower Intake Funnel</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Demo Accounts section */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Seeded Staff Accounts (Click to autofill)
                  </p>
                  <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto pr-1 scrollbar-thin">
                    {DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setIdentifier(acc.email);
                          setPassword(DEMO_PASSWORD);
                          setError(null);
                        }}
                        className="rounded-xl border border-slate-200 p-2 text-left transition-all hover:border-brand-300 hover:bg-brand-50/60 cursor-pointer"
                      >
                        <span className="block text-[11px] font-bold text-slate-800 truncate">
                          {ROLE_CONFIG[acc.role].label}
                        </span>
                        <span className="block truncate text-[10px] text-slate-400 font-mono">{acc.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── TAB 2: SIGN UP / CREATE ACCOUNT ── */}
            {activeTab === 'signup' && (
              <form onSubmit={onSubmitSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      First Name
                    </label>
                    <Input
                      value={signupData.firstName}
                      onChange={(e) =>
                        setSignupData((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                      placeholder="e.g. Harshitha"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Last Name
                    </label>
                    <Input
                      value={signupData.lastName}
                      onChange={(e) =>
                        setSignupData((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                      placeholder="e.g. Dewangan"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={signupData.email}
                    onChange={(e) =>
                      setSignupData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Mobile Number (Optional)
                  </label>
                  <Input
                    type="tel"
                    maxLength={10}
                    value={signupData.mobile}
                    onChange={(e) =>
                      setSignupData((prev) => ({
                        ...prev,
                        mobile: e.target.value.replace(/\D/g, ''),
                      }))
                    }
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Create Password
                  </label>
                  <div className="relative">
                    <Input
                      type={signupShowPassword ? 'text' : 'password'}
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="Min 6 characters"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setSignupShowPassword(!signupShowPassword)}
                      aria-label={signupShowPassword ? 'Hide password' : 'Show password'}
                      title={signupShowPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {signupShowPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {signupError && (
                  <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                    {signupError}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full py-2.5 font-semibold text-xs bg-[#155EEF] hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                  disabled={signupLoading}
                >
                  {signupLoading ? 'Creating Account...' : 'Create Account & Sign In'}
                </Button>

                <div className="pt-2 text-center text-xs text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('signin')}
                    className="font-bold text-[#155EEF] hover:underline cursor-pointer"
                  >
                    Switch to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
