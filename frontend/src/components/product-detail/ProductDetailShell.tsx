'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Building2,
  Layers,
  Cpu,
  Calculator,
  Percent,
  TrendingUp,
  Clock,
  FileCheck,
  ShoppingBag,
  QrCode,
  DollarSign,
  Globe,
  Smartphone,
  Users,
  Activity,
  Sparkles,
} from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionScrollReveal3D } from '@/components/motion/MotionScrollReveal3D';
import { ProductDetailData } from '@/lib/productData';
import { InteractiveHeroVisual } from './InteractiveHeroVisual';
import { PinnedWorkflowEngine } from './PinnedWorkflowEngine';
import { MotionNavbar } from '../motion/MotionNavbar';
import { FintechFooter } from '../fintech/FintechFooter';

// Dynamic icon mapper
const ICON_MAP: Record<string, React.ElementType> = {
  Zap,
  ShieldCheck,
  Lock,
  Building2,
  Layers,
  Cpu,
  Calculator,
  Percent,
  TrendingUp,
  Clock,
  FileCheck,
  ShoppingBag,
  QrCode,
  DollarSign,
  Globe,
  Smartphone,
  Users,
  Activity,
  Sparkles,
  CheckCircle2,
};

interface ProductDetailShellProps {
  product: ProductDetailData;
}

export const ProductDetailShell: React.FC<ProductDetailShellProps> = ({ product }) => {
  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* ── Global 3D Navigation Bar ── */}
        <MotionNavbar />

        {/* ── Top Context Breadcrumb & Back Link ── */}
        <div className="pt-28 sm:pt-32 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#155EEF] transition-colors py-1.5 px-3 rounded-full hover:bg-white border border-transparent hover:border-slate-200 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Financial Architecture</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Adyapan</span>
              <span>/</span>
              <span className="text-slate-600 font-bold">{product.category}</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">{product.name}</span>
            </div>
          </div>
        </div>

        {/* ── Main Content Body ── */}
        <main className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16 space-y-16">
          {/* ── Hero Section with Domain-Specific 3D Background & Interactive Visual ── */}
          <section className="relative rounded-3xl overflow-hidden p-6 sm:p-10 border border-slate-200/80 bg-gradient-to-b from-[#F8FAFC] via-white to-[#F0F7FF] shadow-xs">
            {/* Domain-Specific 3D Background Atmosphere */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {/* Isometric Perspective Grid */}
              <div
                className="absolute -bottom-28 left-1/2 -translate-x-1/2 w-[1850px] h-[920px] opacity-30"
                style={{
                  transform: 'perspective(850px) rotateX(62deg) translateZ(-40px)',
                  backgroundImage: product.slug === 'digilocker-ekyc'
                    ? `
                        linear-gradient(to right, rgba(16, 185, 129, 0.25) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(14, 165, 233, 0.22) 1px, transparent 1px)
                      `
                    : `
                        linear-gradient(to right, rgba(139, 92, 246, 0.25) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(21, 94, 239, 0.22) 1px, transparent 1px)
                      `,
                  backgroundSize: '46px 46px',
                  maskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 45%, black 20%, transparent 80%)',
                }}
              />

              {/* Volumetric Glowing Cones */}
              <div
                className={`absolute top-0 left-1/3 -translate-x-1/2 w-[650px] h-[500px] blur-[140px] rounded-full ${
                  product.slug === 'digilocker-ekyc'
                    ? 'bg-gradient-to-br from-emerald-400/18 via-teal-500/12 to-transparent'
                    : 'bg-gradient-to-br from-purple-500/18 via-blue-600/12 to-transparent'
                }`}
              />
              <div className="absolute top-10 right-1/3 translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-bl from-blue-600/15 via-indigo-500/10 to-transparent blur-[130px] rounded-full" />

              {/* Floating 3D Telemetry Badges */}
              {product.slug === 'digilocker-ekyc' ? (
                <>
                  <div className="absolute top-8 left-[6%] px-3 py-1.5 rounded-lg bg-white/85 border border-emerald-200 backdrop-blur-md shadow-md text-[10px] font-mono text-emerald-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>UIDAI_EKYC // 256-BIT_XML_VERIFIED</span>
                  </div>
                  <div className="absolute top-16 right-[6%] px-3 py-1.5 rounded-lg bg-white/85 border border-teal-200 backdrop-blur-md shadow-md text-[10px] font-mono text-teal-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7s' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>PAN_VERIFICATION // INSTANT_MATCH</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute top-8 left-[6%] px-3 py-1.5 rounded-lg bg-white/85 border border-purple-200 backdrop-blur-md shadow-md text-[10px] font-mono text-purple-800 font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '6s' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span>4_PILLAR_NEURAL_ENGINE // CALIBRATED</span>
                  </div>
                  <div className="absolute top-16 right-[6%] px-3 py-1.5 rounded-lg bg-white/85 border border-blue-200 backdrop-blur-md shadow-md text-[10px] font-mono text-[#155EEF] font-bold hidden lg:flex items-center gap-2 animate-bounce" style={{ animationDuration: '7s' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>BEHAVIORAL_RISK_SCORE // SUB_100MS</span>
                  </div>
                </>
              )}
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-center">
              {/* Left Column: Narrative Headline & Metrics */}
              <div className="lg:col-span-6 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-bold text-[#155EEF] font-mono shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
                  <span>{product.category} · {product.tagline}</span>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#071A33] leading-[1.12]">
                  {product.headline}{' '}
                  <span className="bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-indigo-700 bg-clip-text text-transparent">
                    {product.highlightText}
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                  {product.subheadline}
                </p>

                {/* Hero Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {product.heroMetrics.map((m, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-white/90 border border-slate-200 shadow-xs">
                      <p className="text-lg sm:text-xl font-black text-[#071A33] font-mono">{m.value}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Quick Action CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-4">
                  <Link
                    href={`/apply?purpose=${encodeURIComponent(product.name)}`}
                    className="px-6 py-3 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-lg shadow-[#155EEF]/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <span>Check Eligibility & Apply</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href="#specs"
                    className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs transition-all"
                  >
                    Explore Enterprise Specs
                  </a>
                </div>
              </div>

              {/* Right Column: Interactive Product Simulator */}
              <div className="lg:col-span-6">
                <InteractiveHeroVisual product={product} />
              </div>
            </div>
          </section>

          {/* ── Problem & Solution Card ── */}
          <MotionScrollReveal3D>
            <section className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50/90 to-white p-6 sm:p-10 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    The Bottleneck
                  </span>
                  <h3 className="text-base font-bold text-[#071A33]">Legacy Limitation</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {product.problemSolved.challenge}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#155EEF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    The Adyapan Solution
                  </span>
                  <h3 className="text-base font-bold text-[#071A33]">Architecture Innovation</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {product.problemSolved.solution}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Business Impact
                  </span>
                  <h3 className="text-base font-bold text-[#071A33]">Measurable Lift</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {product.problemSolved.impact}
                  </p>
                </div>
              </div>
            </section>
          </MotionScrollReveal3D>

          {/* ── Pinned Transaction & Lifecycle Engine ── */}
          <MotionScrollReveal3D>
            <PinnedWorkflowEngine
              title={product.workflowTitle}
              subtitle={product.workflowSubtitle}
              steps={product.workflowSteps}
            />
          </MotionScrollReveal3D>

          {/* ── Key Capabilities & Features Grid ── */}
          <MotionScrollReveal3D>
            <section className="space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#155EEF] font-mono">
                  Core Capabilities
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#071A33] tracking-tight">
                  Engineered for Enterprise Financial Scale
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {product.features.map((f, i) => {
                  const Icon = ICON_MAP[f.iconName] || Zap;
                  return (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-[#155EEF]/40 transition-all text-left space-y-3 group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center group-hover:bg-[#155EEF] group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-[#071A33]">{f.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </MotionScrollReveal3D>

          {/* ── Enterprise Specs Table ── */}
          <MotionScrollReveal3D>
            <section id="specs" className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#071A33]">Technical & Regulatory Specifications</h3>
                  <p className="text-xs text-slate-500">Certified architecture metrics and security protocols.</p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>ISO 27001 & RBI Spec Aligned</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {product.specs.map((s, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white border border-slate-200/80 text-left">
                    <p className="text-[11px] font-bold text-slate-400 uppercase font-mono">{s.label}</p>
                    <p className="text-base font-black text-[#071A33] mt-1 font-mono">{s.value}</p>
                    <span className="inline-block mt-2 text-[9px] font-extrabold px-2 py-0.5 rounded-md bg-blue-50 text-[#155EEF] border border-blue-200">
                      {s.badge}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </MotionScrollReveal3D>

          {/* ── Related Capabilities Cross-Navigation ── */}
          <MotionScrollReveal3D>
            <section className="space-y-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#071A33]">Explore Related Capabilities</h3>
                  <p className="text-xs text-slate-500">Connected modules across the Adyapan financial architecture.</p>
                </div>
                <Link href="/" className="text-xs font-bold text-[#155EEF] hover:underline flex items-center gap-1 font-mono">
                  <span>View Full Architecture</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {product.relatedProducts.map((rel, i) => (
                  <Link
                    key={i}
                    href={`/products/${rel.slug}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-[#155EEF] transition-all text-left space-y-2 group block"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{rel.category}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#155EEF] transition-transform group-hover:translate-x-1" />
                    </div>
                    <h4 className="text-sm font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">{rel.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{rel.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          </MotionScrollReveal3D>
        </main>

        {/* ── Regulatory Midnight Navy Footer ── */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
};
