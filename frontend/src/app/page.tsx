'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle2,
  Cpu,
  FileCheck2,
  Gauge,
  Globe,
  Layers,
  Lock,
  Rocket,
  ShieldCheck,
  Users,
  Wallet,
  Sparkles,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LandingNav } from '@/components/LandingNav';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';

const STATS = [
  { value: '₹2,400 Cr+', label: 'Cumulative Sanctions' },
  { value: '120K+', label: 'Active Borrowers' },
  { value: '99.98%', label: 'Core System Uptime' },
  { value: '40+', label: 'Enterprise Branches' },
];

const PILLARS = [
  {
    icon: Cpu,
    title: 'Intelligent Rule Engine',
    desc: 'Real-time DTI, age, income threshold and bureau track record policy evaluation.',
  },
  {
    icon: Layers,
    title: 'Unified Loan Lifecycle',
    desc: 'From customer intake and KYC to underwriting, disbursement and digital NOC closure.',
  },
  {
    icon: ShieldCheck,
    title: 'RBI & Regulatory Compliant',
    desc: 'Strict role-based governance, immutable audit trail, and fair recovery practices.',
  },
  {
    icon: Rocket,
    title: 'Instant Fund Release',
    desc: 'Pre-disbursement verification checklist with instant NEFT/RTGS gateway support.',
  },
  {
    icon: Globe,
    title: 'Waterfall Repayments',
    desc: 'Strict allocation hierarchy: Fees → Penalty → Interest → Principal Balance.',
  },
  {
    icon: Gauge,
    title: 'Delinquency & PAR Analytics',
    desc: 'Automated 5-tier DPD aging buckets (0-30, 31-60, 61-90, 91-180, 180+ Days Past Due).',
  },
];

const COMPLIANCE = [
  { icon: Award, label: 'ISO 27001 Certified' },
  { icon: Lock, label: 'PCI DSS Ready' },
  { icon: ShieldCheck, label: 'SOC 2 Aligned' },
  { icon: BadgeCheck, label: 'RBI Compliant' },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Customer 360 & KYC',
    desc: 'Capture identity proofs, income documents, employment history, and multiple bank accounts.',
  },
  {
    icon: FileCheck2,
    title: 'Applications & Underwriting',
    desc: 'Multi-step loan intake wizard with policy criteria and 4-pillar credit risk scoring.',
  },
  {
    icon: Wallet,
    title: 'Disbursement & Servicing',
    desc: 'Transaction-safe payout execution, reducing amortization schedules, and live balance tracking.',
  },
  {
    icon: BarChart3,
    title: 'Collections & Delinquency',
    desc: 'Overdue case queue, telephonic/field activity logs, and Promise-to-Pay (PTP) commitments.',
  },
  {
    icon: ShieldCheck,
    title: 'Immutable Compliance Audit',
    desc: 'Append-only audit trail capturing all disbursements, approvals, and repayment receipts.',
  },
  {
    icon: Calculator,
    title: 'Precision Money Engine',
    desc: 'PostgreSQL NUMERIC(14,2) decimal arithmetic. Zero floating-point roundoff errors.',
  },
];

const PRODUCTS = [
  { name: 'Personal Loan', rate: 'from 10.5%', desc: 'Instant unsecured loans for salaried & self-employed individuals' },
  { name: 'SME Business Loan', rate: 'from 13.5%', desc: 'Working capital and asset expansion for registered enterprises' },
  { name: 'Home & Property Loan', rate: 'from 8.5%', desc: 'Long-tenure secured mortgages with reducing-balance EMI schedules' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [calcAmount, setCalcAmount] = useState(500000);
  const [calcTenure, setCalcTenure] = useState(24);
  const [calcRate, setCalcRate] = useState(12.5);

  const primaryCta = user ? '/dashboard' : '/login';
  const primaryLabel = user ? 'Go to Dashboard' : 'Open Workspace →';

  // Live reducing EMI calculation
  const monthlyRate = calcRate / 12 / 100;
  const emi =
    calcAmount > 0 && calcTenure > 0
      ? (
          (calcAmount * monthlyRate * Math.pow(1 + monthlyRate, calcTenure)) /
          (Math.pow(1 + monthlyRate, calcTenure) - 1)
        ).toFixed(2)
      : '0.00';
  const totalRepayment = (Number(emi) * calcTenure).toFixed(2);
  const totalInterest = (Number(totalRepayment) - calcAmount).toFixed(2);

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans">
      {/* Navigation */}
      <LandingNav primaryCta={primaryCta} primaryLabel={primaryLabel} />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/50 via-white to-white -z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-brand-200/30 blur-[140px] rounded-full -z-10" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200/80 px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              <span>Next-Generation Enterprise Lending Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              The modern operating system for{' '}
              <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 bg-clip-text text-transparent">
                lending & credit servicing
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              From customer onboarding and KYC to risk scoring, underwriting, instant disbursement, waterfall repayments and recovery collections.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link href={primaryCta}>
                <Button className="px-6 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all">
                  {primaryLabel}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" className="px-6 py-3 text-sm font-bold">
                  Explore Demo Portals
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 pt-4 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 10 Role-Based Dashboards
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Waterfall Repayment Hierarchy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> RBI & Regulatory Compliant
              </span>
            </div>
          </div>

          {/* Live Dashboard Mockup Graphic */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-2xl ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-mono font-semibold text-slate-400">app.adyapan.dev/dashboard</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Core Banking Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Active Portfolio</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">₹18.42 Cr</p>
                <p className="text-xs font-semibold text-emerald-600 mt-0.5">↑ +14.8% this month</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Monthly Collections</p>
                <p className="text-2xl font-bold text-brand-700 mt-1">₹4.20 Cr</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">98.4% On-time efficiency</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Underwriting SLA</p>
                <p className="text-2xl font-bold text-emerald-700 mt-1">&lt; 4.2 Hours</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">Automated policy checks</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-slate-200 bg-slate-50/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Comprehensive Capabilities</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Engineered for Modern Enterprise Lending
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            A battle-tested Loan Management Suite built for Banks, NBFCs, and Digital Lending FinTechs.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-card hover:border-brand-300 transition-all"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 font-bold mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* High-Precision FinTech Pillars */}
      <section className="relative overflow-hidden bg-slate-900 py-20 text-white">
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-400">
              Built for Scale, Speed & Control
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              High-Precision FinTech Architecture
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              Modular components, transactional data integrity, and real-time ledger accounting.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-slate-800 bg-slate-800/40 p-6 backdrop-blur-sm transition hover:bg-slate-800/70"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700/60 text-brand-400">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-bold text-white text-base">{p.title}</h3>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Catalog */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Catalog</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Configurable Loan Products</h2>
          <p className="mt-3 text-sm text-slate-600">Launch and configure custom loan products with customizable interest rates and tenure boundaries.</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {PRODUCTS.map((p) => (
            <div key={p.name} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-card transition-all space-y-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 font-bold">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs font-bold text-brand-700 mt-0.5">Interest {p.rate} p.a.</p>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
              <div className="pt-2 border-t border-slate-100">
                <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800">
                  Originate Loan <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Reducing-Balance EMI Simulator */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 sm:p-10 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-700">Financial Simulator</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Test Loan Amortization in Real-Time
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Experience our reducing-balance amortization engine. Adjust principal, interest, and tenure to see live monthly EMI and repayment schedule breakdown.
            </p>

            <div className="space-y-4 pt-2">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-700">Principal Amount</span>
                  <span className="text-brand-700 font-bold text-sm">₹{calcAmount.toLocaleString('en-IN')}</span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={5000000}
                  step={25000}
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-700">Tenure</span>
                  <span className="text-slate-900 font-bold text-sm">{calcTenure} Months</span>
                </div>
                <input
                  type="range"
                  min={6}
                  max={60}
                  step={3}
                  value={calcTenure}
                  onChange={(e) => setCalcTenure(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-slate-700">Interest Rate</span>
                  <span className="text-brand-700 font-bold text-sm">{calcRate}% p.a.</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={24}
                  step={0.5}
                  value={calcRate}
                  onChange={(e) => setCalcRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card space-y-6 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly Reducing EMI</p>
              <p className="text-4xl font-extrabold text-brand-700 mt-1 tracking-tight">
                ₹{Number(emi).toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Per month for {calcTenure} installments</p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-left">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Interest</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">₹{Number(totalInterest).toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Repayment</p>
                <p className="text-base font-bold text-slate-900 mt-0.5">₹{Number(totalRepayment).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <Link href="/applications/new" className="block">
              <Button className="w-full py-2.5 font-bold text-xs">
                Apply for this Loan →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="border-t border-slate-200 bg-slate-50/60 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Certified · Compliant · Secure
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {COMPLIANCE.map((c) => (
              <div
                key={c.label}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs"
              >
                <c.icon className="h-4 w-4 text-brand-600" />
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={36} />
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Adyapan IT Solution. Enterprise Loan Management System.
          </p>
        </div>
      </footer>
    </div>
  );
}
