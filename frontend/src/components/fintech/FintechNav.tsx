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
import { Logo } from '../Logo';
import { MagneticButton } from './MagneticButton';
import { cn } from '@/lib/utils';

export function FintechNav() {
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
          ? 'bg-white/90 backdrop-blur-2xl border-b border-[#D3E5FA] shadow-xs'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-12 sm:h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size={36} variant="dark" />
          </Link>

          {/* Desktop Narrative Navigation */}
          <nav className="hidden items-center gap-2 lg:flex">
            <a
              href="#selector"
              className="flex h-9 items-center gap-2 rounded-xl border border-[#D3E5FA] bg-white px-4 text-xs font-bold text-[#071A33] hover:text-[#155EEF] hover:bg-[#EAF4FF] transition-all shadow-2xs"
            >
              <Compass className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>Loan Pathways</span>
            </a>
            <a
              href="#calculator"
              className="flex h-9 items-center gap-2 rounded-xl border border-[#D3E5FA] bg-white px-4 text-xs font-bold text-[#071A33] hover:text-[#155EEF] hover:bg-[#EAF4FF] transition-all shadow-2xs"
            >
              <Calculator className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>Tactile Simulator</span>
            </a>
            <a
              href="#launchpad"
              className="flex h-9 items-center gap-2 rounded-xl border border-[#D3E5FA] bg-white px-4 text-xs font-bold text-[#071A33] hover:text-[#155EEF] hover:bg-[#EAF4FF] transition-all shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-[#F5B942]" />
              <span>90s Instant Disbursal</span>
            </a>
            <Link
              href="/dashboard"
              className="flex h-9 items-center gap-2 rounded-xl border border-[#D3E5FA] bg-white px-4 text-xs font-bold text-[#071A33] hover:text-[#155EEF] hover:bg-[#EAF4FF] transition-all shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF]" />
              <span>LMS Suite</span>
            </Link>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="hidden items-center gap-4 sm:flex">
          <Link
            href="/login"
            className="text-xs font-bold text-[#071A33] hover:text-[#155EEF] px-3 py-2 rounded-xl transition-colors font-mono"
          >
            Sign In
          </Link>
          <MagneticButton
            href="/apply"
            variant="primary"
            className="px-5 py-2.5 text-xs font-black"
          >
            <span>Check Eligibility</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </MagneticButton>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="lg:hidden text-[#071A33] hover:text-[#155EEF] p-2 rounded-xl bg-white border border-[#D3E5FA] shadow-xs"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-b border-[#D3E5FA] bg-white/95 backdrop-blur-2xl px-6 py-6 lg:hidden space-y-4 animate-fade-up shadow-xl">
          <div className="flex flex-col space-y-2">
            <a
              href="#selector"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#EAF4FF] text-sm font-bold text-[#071A33]"
            >
              <Compass className="w-4 h-4 text-[#155EEF]" />
              <span>Loan Pathways</span>
            </a>
            <a
              href="#calculator"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#EAF4FF] text-sm font-bold text-[#071A33]"
            >
              <Calculator className="w-4 h-4 text-[#155EEF]" />
              <span>Tactile Calculator</span>
            </a>
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#EAF4FF] text-sm font-bold text-[#071A33]"
            >
              <ShieldCheck className="w-4 h-4 text-[#155EEF]" />
              <span>LMS Suite</span>
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3 rounded-xl bg-[#EAF4FF] text-sm font-bold text-[#071A33] font-mono"
            >
              <span>Sign In</span>
            </Link>
          </div>

          <Link
            href="/apply"
            onClick={() => setMobileOpen(false)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#155EEF] text-white text-sm font-bold shadow-md cursor-pointer"
          >
            <span>Check Eligibility</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </header>
  );
}
