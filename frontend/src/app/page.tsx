'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart3,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  Cpu,
  MapPin,
  FileCheck2,
  Gauge,
  Globe,
  Layers,
  Lock,
  Rocket,
  ShieldCheck,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { LandingNav } from '@/components/LandingNav';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';

const STATS = [
  { value: '₹2,400 Cr+', label: 'Loans processed' },
  { value: '120K+', label: 'Active borrowers' },
  { value: '99.98%', label: 'Uptime' },
  { value: '40+', label: 'Lending partners' },
];

// Value-proposition pillars (inspired by M2P Fintech's "Built for Speed, Scale & Intelligence").
const PILLARS = [
  { icon: Cpu, title: 'Intelligent Core', desc: 'Smart workflows and decisioning across the loan lifecycle.' },
  { icon: Layers, title: 'Unified Stack', desc: 'Onboarding, lending, repayments and collections in one platform.' },
  { icon: ShieldCheck, title: 'Compliant by Design', desc: 'Built for control, auditability and scalable expansion.' },
  { icon: Rocket, title: 'Faster Go-Live', desc: 'Configurable modules shorten launch cycles, no re-deploys.' },
  { icon: Globe, title: 'API-Driven', desc: 'Embed lending into any app or business process via REST APIs.' },
  { icon: Gauge, title: 'Built for Scale', desc: 'Handles growing portfolios with real-time performance.' },
];

// Trust strip — text logos (no external brand assets to avoid trademark issues).
const PARTNERS = ['MERIDIAN NBFC', 'NORTHBANK', 'FINROOT', 'CREDITLY', 'PAYARC', 'LENDVISTA'];

const COMPLIANCE = [
  { icon: Award, label: 'ISO 27001' },
  { icon: Lock, label: 'PCI DSS Ready' },
  { icon: ShieldCheck, label: 'SOC 2 Aligned' },
  { icon: BadgeCheck, label: 'RBI-Aware Design' },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Customer 360 & KYC',
    desc: 'Onboard borrowers, capture KYC and documents, and see a complete profile in one place.',
  },
  {
    icon: FileCheck2,
    title: 'Applications & Underwriting',
    desc: 'Multi-step applications with eligibility, risk scoring and a configurable approval workflow.',
  },
  {
    icon: Wallet,
    title: 'Disbursement & Repayments',
    desc: 'Accurate EMI schedules, transaction-safe disbursement and automated repayment tracking.',
  },
  {
    icon: BarChart3,
    title: 'Collections & Analytics',
    desc: 'Aging buckets, delinquency alerts, and real-time portfolio dashboards for every role.',
  },
  {
    icon: ShieldCheck,
    title: 'Security & Audit',
    desc: 'RBAC, encryption, append-only audit logs and compliance-ready architecture.',
  },
  {
    icon: Calculator,
    title: 'Accurate Money Engine',
    desc: 'Decimal-precise calculations with unit-tested EMI and amortization logic.',
  },
];

const STEPS = [
  { title: 'Onboard & verify', desc: 'Register customers and complete KYC with document workflows.' },
  { title: 'Apply & assess', desc: 'Capture applications, run eligibility and risk assessment.' },
  { title: 'Approve & disburse', desc: 'Underwrite, generate agreements and disburse securely.' },
  { title: 'Collect & report', desc: 'Track repayments, manage collections and analyze the portfolio.' },
];

const PRODUCTS = [
  { name: 'Personal Loan', rate: 'from 10.5%', img: 'photo-1554224155-6726b3ff858f' },
  { name: 'Business Loan', rate: 'from 14%', img: 'photo-1664575602554-2087b04935a5' },
  { name: 'Home & Vehicle', rate: 'from 8.9%', img: 'photo-1560518883-ce09059eeffa' },
];

const EVENTS = [
  {
    date: 'Sep 18, 2026',
    tag: 'Webinar',
    title: 'Modern underwriting: automating credit decisions',
    location: 'Online',
  },
  {
    date: 'Oct 07, 2026',
    tag: 'Conference',
    title: 'Adyapan at the India FinTech Forum',
    location: 'Mumbai',
  },
  {
    date: 'Nov 22, 2026',
    tag: 'Workshop',
    title: 'Collections & delinquency management best practices',
    location: 'Bengaluru',
  },
];

const IMG = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export default function LandingPage() {
  const { user } = useAuth();

  const primaryCta = user ? '/dashboard' : '/login';
  const primaryLabel = user ? 'Go to dashboard' : 'Get started';

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* NAV with mega-menu */}
      <LandingNav primaryCta={primaryCta} primaryLabel={primaryLabel} />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-brand-radial" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-100 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-600/10">
              <BadgeCheck className="h-3.5 w-3.5" /> Trusted by banks, NBFCs & fintechs
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              The modern platform to run your{' '}
              <span className="bg-brand-gradient bg-clip-text text-transparent">entire loan lifecycle</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              From onboarding and KYC to underwriting, disbursement, repayments and collections —
              Adyapan LMS unifies your lending operations in one secure, real-time system.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href={primaryCta}>
                <Button className="px-6 py-3 text-base">
                  {primaryLabel} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="secondary" className="px-6 py-3 text-base">
                  Explore features
                </Button>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              {['No card required', 'Role-based dashboards', 'Bank-grade security'].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-accent-500" /> {t}
                </span>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-up">
            <div className="absolute -inset-4 rounded-[2rem] bg-brand-gradient opacity-20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-card">
              <Image
                src={IMG('photo-1573164713988-8665fc963095', 1200)}
                alt="Finance team reviewing loan analytics"
                width={1200}
                height={800}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            {/* Floating stat card */}
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:block">
              <p className="text-xs font-medium text-slate-500">Portfolio outstanding</p>
              <p className="text-xl font-bold text-slate-900">₹18.3 Cr</p>
              <p className="mt-1 text-xs font-medium text-emerald-600">▲ 12.4% this quarter</p>
            </div>
            <div className="absolute -right-4 top-8 hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-card sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 text-accent-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900">KYC verified</p>
                <p className="text-[11px] text-slate-400">Audit logged</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-slate-900 sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Trusted by leading banks, NBFCs & fintechs
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {PARTNERS.map((p) => (
            <span
              key={p}
              className="text-sm font-bold tracking-wide text-slate-400 transition hover:text-slate-600"
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="resources" className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Features</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Everything you need to lend with confidence
          </h2>
          <p className="mt-3 text-slate-600">
            A complete, configurable loan management suite built for modern lending teams.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-glow">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PILLARS BAND (M2P-inspired) */}
      <section className="relative overflow-hidden bg-ink-900">
        <div className="absolute inset-0 bg-brand-radial" />
        <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-400">
              Built for speed, scale & intelligence
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
              An AI-ready, unified lending platform
            </h2>
            <p className="mt-3 text-white/60">
              Composable modules and API-driven infrastructure that grow with your business.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:bg-white/10"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-accent-400">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-white">{p.title}</h3>
                <p className="mt-1.5 text-sm text-white/60">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS / ABOUT */}
      <section id="about" className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:px-8">
          <div className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-card">
              <Image
                src={IMG('photo-1600880292203-757bb62b4baf', 1000)}
                alt="Loan officers collaborating"
                width={1000}
                height={750}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              A guided flow from application to closure
            </h2>
            <div className="mt-8 space-y-6">
              {STEPS.map((s, i) => (
                <div key={s.title} className="flex gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{s.title}</h3>
                    <p className="mt-0.5 text-sm text-slate-600">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Products</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Configurable loan products</h2>
          <p className="mt-3 text-slate-600">Launch and manage any loan product with fully configurable rules.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {PRODUCTS.map((p) => (
            <div key={p.name} className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={IMG(p.img, 700)}
                  alt={p.name}
                  width={700}
                  height={440}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-500">Interest {p.rate} p.a.</p>
                <Link href="/login" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                  Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Events</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Meet us & learn with us
            </h2>
            <p className="mt-3 text-slate-600">
              Webinars, conferences and workshops for lending teams.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {EVENTS.map((e) => (
              <div
                key={e.title}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                    {e.tag}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Calendar className="h-3.5 w-3.5" /> {e.date}
                  </span>
                </div>
                <h3 className="mt-4 flex-1 text-lg font-semibold text-slate-900">{e.title}</h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" /> {e.location}
                  </span>
                  <a href="#contact" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
                    Register <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="bg-white">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center lg:px-8">
          <div className="mb-4 flex justify-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <blockquote className="text-2xl font-medium leading-relaxed text-slate-900">
            “Adyapan LMS cut our loan processing time in half and gave every team a real-time view of
            the portfolio. The audit trail alone made our compliance reviews effortless.”
          </blockquote>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
              RN
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">Rohan Nair</p>
              <p className="text-xs text-slate-500">Head of Credit, Meridian NBFC</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-ink-900 p-10 text-center shadow-card sm:p-16">
          <div className="absolute inset-0 bg-brand-radial" />
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-16 right-0 h-64 w-64 rounded-full bg-accent-500/25 blur-3xl" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to modernize your lending?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/70">
              Sign in to the demo environment and explore the full loan management experience.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href={primaryCta}>
                <Button className="px-6 py-3 text-base">
                  {primaryLabel} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="mailto:contact@adyapan.dev">
                <Button variant="secondary" className="px-6 py-3 text-base">
                  <Building2 className="h-4 w-4" /> Talk to sales
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* COMPLIANCE STRIP */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Certified. Compliant. Secure.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            {COMPLIANCE.map((c) => (
              <div
                key={c.label}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-soft"
              >
                <c.icon className="h-4 w-4 text-brand-600" />
                {c.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-4 lg:px-8">
          <div>
            <Logo size={38} />
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Adyapan IT Solution — a modern loan management system for banks, NBFCs and fintechs.
            </p>
          </div>
          <FooterCol title="Product" links={['Features', 'Products', 'Security', 'Pricing']} />
          <FooterCol title="Company" links={['About', 'Careers', 'Contact', 'Blog']} />
          <FooterCol title="Legal" links={['Privacy', 'Terms', 'Compliance']} />
        </div>
        <div className="border-t border-slate-100 py-6">
          <p className="text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Adyapan IT Solution. Demo environment — uses synthetic data.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l}>
            <span className="cursor-pointer text-sm text-slate-500 hover:text-brand-600">{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
