'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle2,
  Smartphone,
  Briefcase,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  Check,
  KeyRound,
  TrendingUp,
  Wallet,
  Building2,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiErrorMessage } from '@/lib/api';
import { otpApi } from '@/lib/otpApi';
import { Button, Input } from '@/components/ui';
import { Logo, LogoMark } from '@/components/Logo';
import { ROLE_CONFIG, RoleName } from '@/lib/roles';

// Seeded operational staff & admin demo accounts
const DEMO_ACCOUNTS: { role: RoleName; email: string }[] = [
  { role: 'SUPER_ADMIN', email: 'superadmin@adyapan.dev' },
  { role: 'ADMIN', email: 'admin@adyapan.dev' },
  { role: 'LOAN_OFFICER', email: 'officer@adyapan.dev' },
  { role: 'CREDIT_ANALYST', email: 'analyst@adyapan.dev' },
  { role: 'UNDERWRITER', email: 'underwriter@adyapan.dev' },
  { role: 'RISK_ANALYST', email: 'risk.analyst@adyapan.dev' },
  { role: 'FRAUD_ANALYST', email: 'fraud.investigator@adyapan.dev' },
  { role: 'RISK_MANAGER', email: 'risk.manager@adyapan.dev' },
  { role: 'FINANCE_OFFICER', email: 'finance@adyapan.dev' },
  { role: 'COLLECTION_OFFICER', email: 'collections@adyapan.dev' },
  { role: 'AUDITOR', email: 'auditor@adyapan.dev' },
];

const DEMO_PASSWORD = 'Password@123';

export default function LoginPage() {
  const { login, loginWithOtp } = useAuth();
  const router = useRouter();

  // Portal tab selection: 'borrower' vs 'staff'
  const [portalTab, setPortalTab] = useState<'borrower' | 'staff'>('borrower');

  // Staff login state
  const [identifier, setIdentifier] = useState('admin@adyapan.dev');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Borrower Mobile OTP state
  const [mobile, setMobile] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Initialize portal tab from URL parameters if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      const portal = params.get('portal');
      if (portal === 'staff' || (redirect && !redirect.startsWith('/borrower') && !redirect.startsWith('/apply'))) {
        setPortalTab('staff');
      } else if (portal === 'borrower' || (redirect && redirect.startsWith('/borrower'))) {
        setPortalTab('borrower');
      }
    }
  }, []);

  // Cooldown countdown effect for OTP resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(DEMO_PASSWORD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function handleStaffLogin(e: React.FormEvent) {
    e.preventDefault();
    setStaffError(null);
    setStaffLoading(true);
    try {
      await login(identifier, password);
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const redirectUrl = params?.get('redirect');
      if (redirectUrl && !redirectUrl.startsWith('/borrower')) {
        router.push(redirectUrl);
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setStaffError(apiErrorMessage(err));
    } finally {
      setStaffLoading(false);
    }
  }

  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setOtpError(null);
    setOtpSuccessMsg(null);

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
      setOtpError('Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).');
      return;
    }

    setOtpSending(true);
    try {
      const res = await otpApi.send(cleanMobile, 'MOBILE', 'LOGIN');
      setOtpSent(true);
      setCooldown(res.cooldownSeconds || 30);
      setOtpSuccessMsg(res.message || `OTP sent successfully to +91 ${cleanMobile}`);
    } catch (err: any) {
      setOtpError(apiErrorMessage(err));
    } finally {
      setOtpSending(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError(null);

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 4) {
      setOtpError('Please enter the 6-digit OTP received on your mobile.');
      return;
    }

    setOtpVerifying(true);
    try {
      const authResult = await loginWithOtp(mobile, cleanOtp);
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const redirectUrl = params?.get('redirect');
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        const isOnlyCustomer =
          authResult?.user?.roles?.length === 1 && authResult.user.roles[0] === 'CUSTOMER';
        if (isOnlyCustomer || authResult?.user?.roles?.includes('CUSTOMER')) {
          router.push('/borrower');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setOtpError(apiErrorMessage(err));
    } finally {
      setOtpVerifying(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2 bg-slate-50">
      {/* Brand Hero Panel (Left side) */}
      <div className="relative hidden overflow-hidden bg-slate-900 bg-gradient-to-b from-slate-900 via-[#0f172a] to-[#020617] lg:flex lg:flex-col lg:justify-between p-10 text-white">
        {/* Ambient glow backgrounds */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute right-10 top-1/3 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />

        {/* Top Header */}
        <div className="relative z-10">
          <Logo variant="light" size={42} />
        </div>

        {/* Center: Dynamic Hero Content based on active portal tab */}
        <div className="relative z-10 my-auto py-8 space-y-6 max-w-lg">
          {portalTab === 'borrower' ? (
            <>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-xs font-semibold text-blue-300">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" /> Instant Digital Lending
                </span>
                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                  Get instant personal loans up to ₹5,00,000 in minutes.
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  100% paperless application with real-time approval, transparent interest rates, and direct bank disbursement.
                </p>
              </div>

              {/* Borrower Key Features Card */}
              <div className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-5 backdrop-blur-md shadow-2xl space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Fast Real-Time Approval</p>
                    <p className="text-xs text-slate-400">Automated credit decisioning in under 3 minutes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Bank-Grade 256-Bit Security</p>
                    <p className="text-xs text-slate-400">RBI compliant data protection & secure digital agreement</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Direct Account Disbursement</p>
                    <p className="text-xs text-slate-400">Funds transferred directly to your verified bank account</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-300">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Enterprise FinTech Platform
                </span>
                <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                  Manage the entire loan lifecycle in one modern platform.
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  From customer onboarding and KYC to risk scoring, underwriting, instant disbursement, repayments and recovery collections.
                </p>
              </div>

              {/* Staff Live Metrics Preview Card */}
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
            </>
          )}
        </div>

        {/* Bottom Feature Badges */}
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[
            { icon: Zap, label: 'Instant Eligibility', sub: 'Zero branch visits' },
            { icon: ShieldCheck, label: 'Safe & Secure', sub: '256-bit encryption' },
            { icon: Clock, label: 'Fast Payouts', sub: 'Direct bank transfer' },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-xl border border-slate-800 bg-slate-800/40 p-3 backdrop-blur-sm"
            >
              <f.icon className="h-4 w-4 text-blue-400" />
              <p className="mt-1.5 text-xs font-semibold text-slate-200">{f.label}</p>
              <p className="text-[10px] text-slate-400">{f.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form Panel (Right side) */}
      <div className="flex items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md animate-fade-in space-y-5">
          {/* Mobile Top Brand Header */}
          <div className="flex flex-col items-center text-center lg:hidden">
            <LogoMark size={48} />
            <h1 className="mt-2 text-lg font-bold text-slate-900">Adyapan Lending Platform</h1>
            <p className="text-xs text-slate-500">Digital Lending & Enterprise LMS</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-card space-y-4">
            {/* Dual Portal Switcher Tabs */}
            <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setPortalTab('borrower');
                  setOtpError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  portalTab === 'borrower'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/70'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Borrower Portal</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPortalTab('staff');
                  setStaffError(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  portalTab === 'staff'
                    ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/70'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Staff & Officers</span>
              </button>
            </div>

            {/* TAB 1: BORROWER SIGN IN */}
            {portalTab === 'borrower' ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                    Borrower Sign In
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Enter your registered mobile number to check loan offers or manage your active loan.
                  </p>
                </div>

                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        10-Digit Mobile Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                          +91
                        </div>
                        <Input
                          type="tel"
                          maxLength={10}
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                          placeholder="9876543210"
                          className="pl-12 font-mono text-sm tracking-wide"
                          required
                          autoFocus
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        We will send a 6-digit one-time verification code via SMS
                      </p>
                    </div>

                    {otpError && (
                      <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                        {otpError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full py-2.5 font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                      disabled={otpSending || mobile.length !== 10}
                    >
                      {otpSending ? 'Sending OTP Code...' : 'Get Instant Verification OTP'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-slate-500">OTP dispatched to:</span>{' '}
                        <span className="font-bold text-slate-900 font-mono">+91 {mobile}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                          setOtpError(null);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        Change Number
                      </button>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Enter 6-Digit OTP Code
                      </label>
                      <Input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="font-mono text-center text-lg tracking-[0.4em] font-bold"
                        required
                        autoFocus
                      />
                    </div>

                    {otpSuccessMsg && (
                      <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{otpSuccessMsg}</span>
                      </div>
                    )}

                    {otpError && (
                      <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                        {otpError}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full py-2.5 font-semibold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                      disabled={otpVerifying || otpCode.length < 4}
                    >
                      {otpVerifying ? 'Verifying Credentials...' : 'Verify OTP & Continue'}
                    </Button>

                    <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                      <span>Didn&apos;t receive code?</span>
                      {cooldown > 0 ? (
                        <span className="text-slate-400 font-medium">Resend in {cooldown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendOtp()}
                          disabled={otpSending}
                          className="font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* TAB 2: STAFF & OFFICERS SIGN IN */
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    Staff & Management Sign In
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Access core LMS, underwriting, credit queue, risk, finance & collections.
                  </p>
                </div>

                <form onSubmit={handleStaffLogin} className="space-y-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Official Email or Username
                    </label>
                    <Input
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="officer@adyapan.dev"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Password
                      </label>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {staffError && (
                    <div className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                      {staffError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full py-2.5 font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                    disabled={staffLoading}
                  >
                    {staffLoading ? 'Signing In...' : 'Sign In to Operations'}
                  </Button>
                </form>

                {/* 1-Click Demo Accounts Selector */}
                <div className="border-t border-slate-100 pt-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Demo Accounts (Click to autofill)
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                      title="Copy demo password"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Password</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Password badge */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-3 py-1.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
                      <span className="text-slate-500 text-[11px]">Password:</span>
                      <code className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[11px] tracking-wide select-all">
                        {DEMO_PASSWORD}
                      </code>
                    </div>
                    <span className="text-[10px] text-slate-400 hidden sm:inline font-medium">All accounts</span>
                  </div>

                  {/* Clickable Demo Roles Grid */}
                  <div className="grid max-h-48 grid-cols-2 gap-1.5 overflow-y-auto pr-1 scrollbar-thin">
                    {DEMO_ACCOUNTS.map((acc) => {
                      const isSelected = identifier === acc.email;
                      return (
                        <button
                          key={acc.email}
                          type="button"
                          onClick={() => {
                            setIdentifier(acc.email);
                            setPassword(DEMO_PASSWORD);
                            setStaffError(null);
                          }}
                          className={`rounded-xl border p-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50/80 shadow-xs ring-1 ring-indigo-400/50'
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`block text-[11px] font-bold truncate ${isSelected ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {ROLE_CONFIG[acc.role]?.label ?? acc.role}
                          </span>
                          <span className="block truncate text-[10px] text-slate-400 font-mono">{acc.email}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Security Guarantee Note */}
            <div className="border-t border-slate-100 pt-3.5 flex items-center gap-2 text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Your session is protected with 256-bit encryption & strict audit logging.</span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Adyapan Lending Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
