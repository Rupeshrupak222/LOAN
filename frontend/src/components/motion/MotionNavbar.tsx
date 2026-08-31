'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  ArrowUp,
  Building2,
  Landmark,
  CreditCard,
  Layers,
  ShieldCheck,
  Zap,
  Sparkles,
  Compass,
  Calculator,
  Mail,
} from 'lucide-react';
import { Logo } from '../Logo';
import { MagneticButton } from '../fintech/MagneticButton';
import { Nav3DItem } from './Nav3DItem';

/* ══════════════════════════════════════════════════════════════
   Adyapan Master 3D Physical Navigation System
   ─────────────────────────────────────────────────────────────
   ▸ Nav items: Products (Mega-Menu), About, Resources, Contact
   ▸ Physical 3D Surface & Inertial Damped Physics on Each Item
   ▸ 4 Category Columns in Mega-Menu:
       1. Banking
       2. Lending
       3. Payments
       4. Value Added Services
   ▸ Permanently visible floating navigation (stays fixed on scroll)
   ▸ Continuous scroll compression & dynamic glassmorphic state
   ▸ Scroll progress rail & Floating "Go to Top" button
   ▸ Fully responsive desktop dropdown + mobile accordion drawer
   ══════════════════════════════════════════════════════════════ */

interface ProductItem {
  name: string;
  badge?: string;
  href: string;
}

interface ProductCategory {
  title: string;
  icon: React.ElementType;
  items: ProductItem[];
}

const PRODUCTS_CATEGORIES: ProductCategory[] = [
  {
    title: 'Banking',
    icon: Landmark,
    items: [
      { name: 'Core Banking', href: '/dashboard' },
      { name: 'Debit Cards', href: '/dashboard' },
      { name: 'Neobanking', badge: 'New', href: '/dashboard' },
      { name: 'Connect API', href: '/dashboard' },
    ],
  },
  {
    title: 'Lending',
    icon: Building2,
    items: [
      { name: 'Core Lending Suite', href: '/dashboard' },
      { name: 'Loan Origination System', href: '#selector' },
      { name: 'Loan Management System', badge: 'Live', href: '/dashboard' },
      { name: 'Microfinance', href: '#selector' },
      { name: 'Debt Collections', href: '/dashboard' },
      { name: '0% 3-Month BNPL', badge: 'Hot', href: '#calculator' },
      { name: 'Credit Line on UPI', href: '#launchpad' },
    ],
  },
  {
    title: 'Payments',
    icon: CreditCard,
    items: [
      { name: 'Prepaid Cards', href: '/dashboard' },
      { name: 'Cross-Border Payments', href: '/dashboard' },
      { name: 'Fleet Drive', href: '/dashboard' },
      { name: 'NPCI UPI Network', href: '#security' },
      { name: 'Merchant Solutions', href: '#launchpad' },
    ],
  },
  {
    title: 'Value Added Services',
    icon: Layers,
    items: [
      { name: 'Recon360 Engine', href: '/dashboard' },
      { name: 'DigiLocker KYC Suite', badge: 'e-KYC', href: '#security' },
      { name: 'ACS & Authentication', href: '#security' },
      { name: 'FRM & AI Underwriting', href: '#security' },
      { name: 'Borrower Rewards', href: '#selector' },
    ],
  },
];

export const MotionNavbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const headerRef = useRef<HTMLElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const productsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const ticking = useRef(false);

  /* ── Continuous scroll tracking for height compression & progress ── */
  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? currentY / docHeight : 0;
      setScrollProgress(progress);

      setScrolled(currentY > 80);
      setShowScrollTop(currentY > 320);

      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /* ── Desktop Mega Menu Hover Handlers with Intent Delay ── */
  const handleProductsEnter = () => {
    if (productsTimeoutRef.current) {
      clearTimeout(productsTimeoutRef.current);
    }
    setProductsOpen(true);
  };

  const handleProductsLeave = () => {
    productsTimeoutRef.current = setTimeout(() => {
      setProductsOpen(false);
    }, 220);
  };

  /* ── Dropdown GSAP Animation ── */
  useEffect(() => {
    if (dropdownRef.current) {
      if (productsOpen) {
        gsap.fromTo(
          dropdownRef.current,
          { opacity: 0, y: -6, scale: 0.98 },
          { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power3.out' }
        );
      }
    }
  }, [productsOpen]);

  /* ── Initial entrance animation ── */
  useEffect(() => {
    if (navBarRef.current) {
      gsap.fromTo(
        navBarRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 }
      );
    }
  }, []);

  /* ── Mobile drawer animation ── */
  useEffect(() => {
    if (drawerRef.current && mobileOpen) {
      gsap.fromTo(
        drawerRef.current,
        { y: -16, opacity: 0, scale: 0.97 },
        { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }
      );
      const items = drawerRef.current.querySelectorAll('[data-drawer-item]');
      gsap.fromTo(
        items,
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.28, ease: 'power3.out', stagger: 0.04, delay: 0.08 }
      );
    }
  }, [mobileOpen]);

  /* ── Scroll progress bar animation ── */
  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        scaleX: scrollProgress,
        duration: 0.15,
        ease: 'none',
        overwrite: true,
      });
    }
  }, [scrollProgress]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 inset-x-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none"
        style={{
          paddingTop: scrolled ? '8px' : '12px',
          transform: 'translateY(0)',
          transition: 'padding-top 0.4s ease-out',
        }}
      >
        <div
          ref={navBarRef}
          className="pointer-events-auto w-full max-w-7xl mx-auto rounded-2xl border flex items-center justify-between px-4 sm:px-6 relative shadow-xs"
          style={{
            backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.97)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'blur(14px) saturate(150%)',
            borderColor: scrolled ? 'rgba(211, 229, 250, 0.95)' : 'rgba(211, 229, 250, 1)',
            boxShadow: scrolled
              ? '0 8px 32px -8px rgba(7, 26, 51, 0.12), 0 2px 4px rgba(7, 26, 51, 0.04)'
              : '0 2px 8px rgba(16, 24, 40, 0.05)',
            padding: scrolled ? '6px 24px' : '10px 24px',
            transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group transition-transform duration-200 hover:scale-105 active:scale-95">
              <Logo size={scrolled ? 32 : 36} variant="dark" />
            </Link>

            {/* Desktop Navigation with Physical 3D Surfaces */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {/* 1. Products (3D Physical Item + Mega-Menu Dropdown) */}
              <div
                className="relative py-1"
                onMouseEnter={handleProductsEnter}
                onMouseLeave={handleProductsLeave}
              >
                <Nav3DItem
                  asButton
                  onClick={() => setProductsOpen((v) => !v)}
                  isOpen={productsOpen}
                  showUnderline={false}
                >
                  <span>Products</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      productsOpen ? 'rotate-180 text-[#155EEF]' : 'text-slate-400'
                    }`}
                  />
                </Nav3DItem>

                {/* ── Products Mega-Menu Dropdown Panel ── */}
                {productsOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 mt-2 w-[860px] -translate-x-12 rounded-2xl bg-white border border-[#D3E5FA] shadow-2xl p-6 z-50 text-[#071A33]"
                    style={{
                      boxShadow: '0 20px 50px -12px rgba(7, 26, 51, 0.18), 0 0 0 1px rgba(211, 229, 250, 0.8)',
                    }}
                  >
                    {/* Header bar inside mega menu */}
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#155EEF] animate-pulse" />
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase font-mono">
                          Adyapan Fintech Architecture
                        </span>
                      </div>
                      <Link
                        href="/dashboard"
                        className="text-[11px] font-bold text-[#155EEF] hover:underline flex items-center gap-1 font-mono"
                      >
                        <span>Access LMS Suite</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* 4 Category Columns Grid */}
                    <div className="grid grid-cols-4 gap-6">
                      {PRODUCTS_CATEGORIES.map((cat, idx) => {
                        const Icon = cat.icon;
                        return (
                          <div key={idx} className="space-y-3">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-100/80">
                              <div className="w-6 h-6 rounded-lg bg-[#EAF4FF] flex items-center justify-center text-[#155EEF]">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <h4 className="text-xs font-black text-[#071A33] tracking-tight">
                                {cat.title}
                              </h4>
                            </div>

                            <ul className="space-y-1.5">
                              {cat.items.map((item, itemIdx) => (
                                <li key={itemIdx}>
                                  <Link
                                    href={item.href}
                                    onClick={() => setProductsOpen(false)}
                                    className="group/item flex items-center justify-between py-1 px-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-[#155EEF] hover:bg-[#EAF4FF]/60 transition-all"
                                  >
                                    <span className="transition-transform duration-150 group-hover/item:translate-x-0.5">
                                      {item.name}
                                    </span>
                                    {item.badge && (
                                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#155EEF]/10 text-[#155EEF] border border-[#155EEF]/20">
                                        {item.badge}
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>

                    {/* Mega Menu Footer Banner */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#EAF4FF]/70 to-white p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#155EEF] text-white flex items-center justify-center shadow-xs">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#071A33]">Instant Digital Underwriting in 60s</p>
                          <p className="text-[11px] text-slate-500">Zero paperwork. Bank-grade 256-bit DigiLocker integration.</p>
                        </div>
                      </div>
                      <a
                        href="#launchpad"
                        onClick={() => setProductsOpen(false)}
                        className="text-xs font-bold text-white bg-[#155EEF] hover:bg-[#104ec8] px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <span>Check Pre-Approval</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. About (3D Physical Item) */}
              <Nav3DItem href="#story-scene">
                <span>About</span>
              </Nav3DItem>

              {/* 3. Resources (3D Physical Item) */}
              <Nav3DItem href="#calculator">
                <span>Resources</span>
              </Nav3DItem>

              {/* 4. Contact (3D Physical Item) */}
              <Nav3DItem href="#launchpad">
                <span>Contact</span>
              </Nav3DItem>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Sign In with 3D Physical Item */}
            <Nav3DItem href="/login" showUnderline={false}>
              <span className="font-mono text-xs">Sign In</span>
            </Nav3DItem>

            {/* Check Eligibility CTA with Magnetic Button */}
            <MagneticButton
              href="#launchpad"
              variant="primary"
              className="px-5 py-2.5 text-xs font-black shadow-md shadow-[#155EEF]/20"
            >
              <span>Check Eligibility</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </MagneticButton>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="lg:hidden text-[#071A33] hover:text-[#155EEF] p-2 rounded-xl bg-white border border-[#D3E5FA] shadow-xs cursor-pointer"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Scroll Progress Line at Bottom */}
          <div
            ref={progressRef}
            className="absolute bottom-0 left-0 h-[2px] origin-left hidden lg:block"
            style={{
              background: 'linear-gradient(90deg, #155EEF, #3B82F6)',
              width: '100%',
              transform: 'scaleX(0)',
              opacity: scrolled ? 0.75 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />
        </div>

        {/* ── Mobile Navigation Drawer ── */}
        {mobileOpen && (
          <div
            ref={drawerRef}
            className="fixed top-20 inset-x-4 p-5 rounded-2xl bg-white border border-[#D3E5FA] shadow-2xl lg:hidden space-y-3 pointer-events-auto max-h-[82vh] overflow-y-auto"
          >
            {/* Products Accordion */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden" data-drawer-item>
              <button
                onClick={() => setMobileProductsOpen((v) => !v)}
                className="w-full flex items-center justify-between p-3 bg-[#EAF4FF] text-sm font-bold text-[#071A33]"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#155EEF]" />
                  <span>Products</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#155EEF] transition-transform ${
                    mobileProductsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileProductsOpen && (
                <div className="p-3 bg-white space-y-3 text-xs">
                  {PRODUCTS_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                        {cat.title}
                      </p>
                      <div className="grid grid-cols-1 gap-1 pl-2">
                        {cat.items.map((item, itemIdx) => (
                          <Link
                            key={itemIdx}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="py-1 font-semibold text-slate-700 hover:text-[#155EEF] flex items-center justify-between"
                          >
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-[#155EEF]/10 text-[#155EEF] rounded">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Links */}
            <a
              href="#story-scene"
              onClick={() => setMobileOpen(false)}
              data-drawer-item
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-sm font-bold text-[#071A33] hover:bg-[#EAF4FF]"
            >
              <Compass className="w-4 h-4 text-[#155EEF]" />
              <span>About</span>
            </a>

            <a
              href="#calculator"
              onClick={() => setMobileOpen(false)}
              data-drawer-item
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-sm font-bold text-[#071A33] hover:bg-[#EAF4FF]"
            >
              <Calculator className="w-4 h-4 text-[#155EEF]" />
              <span>Resources</span>
            </a>

            <a
              href="#launchpad"
              onClick={() => setMobileOpen(false)}
              data-drawer-item
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-sm font-bold text-[#071A33] hover:bg-[#EAF4FF]"
            >
              <Mail className="w-4 h-4 text-[#155EEF]" />
              <span>Contact</span>
            </a>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2" data-drawer-item>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center py-2.5 text-xs font-bold text-[#071A33] border border-slate-200 rounded-xl"
              >
                Sign In to LMS Suite
              </Link>
              <a
                href="#launchpad"
                onClick={() => setMobileOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#155EEF] text-white text-xs font-bold shadow-md shadow-[#155EEF]/20"
              >
                <span>Check Eligibility</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── Floating Go to Top Arrow (Bottom-Right) ── */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-7 right-7 z-50 p-3.5 rounded-2xl bg-white/95 text-[#155EEF] border border-[#D3E5FA] shadow-xl shadow-[#155EEF]/20 backdrop-blur-md transition-all duration-300 ease-out hover:bg-[#155EEF] hover:text-white hover:border-[#155EEF] hover:scale-110 active:scale-95 group cursor-pointer ${
          showScrollTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-1" />
      </button>
    </>
  );
};
