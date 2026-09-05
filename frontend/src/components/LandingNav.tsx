'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Menu,
  X,
  Compass,
  Calculator,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

export function LandingNav({
  primaryCta = '/apply',
  primaryLabel = 'Check Offer in 60s',
}: {
  primaryCta?: string;
  primaryLabel?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300 py-3 sm:py-3.5',
        scrolled
          ? 'bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto flex h-12 sm:h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size={36} variant="dark" />
          </Link>

          {/* Desktop Narrative Pill Nav */}
          <nav className="hidden items-center gap-2 lg:flex">
            <a
              href="#branches"
              className="flex h-9 items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600" />
              <span>5 Directions</span>
            </a>
            <a
              href="#simulator"
              className="flex h-9 items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
            >
              <Calculator className="w-3.5 h-3.5 text-teal-600" />
              <span>Reality Simulator</span>
            </a>
            <a
              href="#branches"
              className="flex h-9 items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>90s Disbursal Rail</span>
            </a>
            <Link
              href="/dashboard"
              className="flex h-9 items-center gap-2 rounded-full border border-slate-200/90 bg-white/90 px-4 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>LMS Portal</span>
            </Link>
          </nav>
        </div>

        {/* Right CTA Actions */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/login"
            className="text-xs font-bold text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-xl transition-colors font-mono"
          >
            Sign In
          </Link>
          <a
            href={primaryCta}
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-black shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>{primaryLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="lg:hidden text-slate-700 hover:text-slate-900 p-2 rounded-xl bg-white border border-slate-200 shadow-xs"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-b border-slate-200 bg-white/95 backdrop-blur-2xl px-6 py-6 lg:hidden space-y-4 animate-fade-up shadow-xl">
          <div className="flex flex-col space-y-2">
            <a
              href="#branches"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-sm font-bold text-slate-800"
            >
              <Compass className="w-4 h-4 text-indigo-600" />
              <span>5 Goal Directions</span>
            </a>
            <a
              href="#simulator"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-sm font-bold text-slate-800"
            >
              <Calculator className="w-4 h-4 text-teal-600" />
              <span>Financial Reality Simulator</span>
            </a>
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-sm font-bold text-slate-800"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>LMS Management Suite</span>
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-sm font-bold text-slate-800 font-mono"
            >
              <span>Sign In to Account</span>
            </Link>
          </div>

          <a
            href={primaryCta}
            onClick={() => setMobileOpen(false)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg"
          >
            <span>{primaryLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      )}
    </header>
  );
}
