'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
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
  Zap,
  Sparkles,
} from 'lucide-react';
import { Logo } from '../Logo';
import { Nav3DItem } from './Nav3DItem';

interface ProductItem {
  name: string;
  badge?: string;
  desc?: string;
  href: string;
}

interface ProductCategory {
  title: string;
  icon: React.ElementType;
  items: ProductItem[];
}

const PRODUCTS_CATEGORIES: ProductCategory[] = [
  {
    title: 'Banking & Core',
    icon: Landmark,
    items: [
      { name: 'Core Banking Engine', desc: 'Real-time ledger & settlement', href: '/products/core-banking-engine' },
      { name: 'Debit & Prepaid Cards', desc: 'Virtual card issuance API', href: '/products/debit-prepaid-cards' },
      { name: 'Neobanking Portal', badge: 'New', desc: 'Full-stack SME banking', href: '/products/neobanking-portal' },
      { name: 'Connect API Gateway', desc: 'Plug & play core banking', href: '/products/connect-api-gateway' },
    ],
  },
  {
    title: 'Lending Solutions',
    icon: Building2,
    items: [
      { name: 'Personal Loans', badge: '10.5%', desc: 'Instant 60s disbursal', href: '/products/personal-loans' },
      { name: 'SME Business Credit', badge: '13.5%', desc: 'Working capital line', href: '/products/sme-business-credit' },
      { name: 'Home Mortgages', badge: '8.5%', desc: 'Long-tenure low EMI', href: '/products/home-mortgages' },
      { name: '0% 3-Month BNPL', badge: 'Hot', desc: 'Split checkout payments', href: '/products/bnpl' },
    ],
  },
  {
    title: 'Payments & Settlement',
    icon: CreditCard,
    items: [
      { name: 'NPCI UPI Network', desc: 'Direct UPI auto-debit & NACH', href: '/products/npci-upi-network' },
      { name: 'Cross-Border Wire', desc: 'Instant SWIFT/FX settlement', href: '/products/cross-border-wire' },
      { name: 'Merchant QR Soundbox', desc: '4G IoT audio payment alerts', href: '/products/merchant-qr-soundbox' },
      { name: 'Credit Line on UPI', badge: 'Live', desc: 'Draw down on GPay/PhonePe', href: '/products/credit-line-upi' },
    ],
  },
  {
    title: 'AI Risk & Compliance',
    icon: Layers,
    items: [
      { name: 'DigiLocker e-KYC', badge: 'Instant', desc: 'Aadhaar & PAN verification', href: '/products/digilocker-ekyc' },
      { name: 'AI Underwriting Scorecard', desc: '4-pillar risk engine', href: '/products/ai-underwriting' },
      { name: 'Immutable Audit Trail', desc: 'Append-only regulatory logs', href: '/products/immutable-audit-trail' },
      { name: 'Automated DTI Policy', desc: 'Real-time bureau rule engine', href: '/products/automated-dti-policy' },
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

  const dropdownRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const productsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* ── Continuous scroll tracking for height compression & progress ── */
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? currentY / docHeight : 0;
      setScrollProgress(progress);
      setScrolled(currentY > 40);
      setShowScrollTop(currentY > 320);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleProductsEnter = () => {
    if (productsTimeoutRef.current) clearTimeout(productsTimeoutRef.current);
    setProductsOpen(true);
  };

  const handleProductsLeave = () => {
    productsTimeoutRef.current = setTimeout(() => {
      setProductsOpen(false);
    }, 200);
  };

  useEffect(() => {
    if (dropdownRef.current && productsOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -6 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      );
    }
  }, [productsOpen]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Dimmed Backdrop Scrim for Focus on Mega Menu */}
      {productsOpen && (
        <div
          onClick={() => setProductsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[1px] transition-opacity duration-200 pointer-events-auto"
        />
      )}

      <header
        className="fixed top-0 inset-x-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none transition-all duration-300"
        style={{ paddingTop: scrolled ? '10px' : '16px' }}
      >
        {/* Solid, Stable, Flat Glass Capsule Bar (Zero 3D tilt, Zero floating) */}
        <div
          className="pointer-events-auto w-full max-w-7xl mx-auto rounded-full border flex items-center justify-between px-4 sm:px-6 relative shadow-xl transition-all duration-300"
          style={{
            backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderColor: scrolled ? 'rgba(21, 94, 239, 0.25)' : 'rgba(226, 232, 240, 0.9)',
            boxShadow: scrolled
              ? '0 10px 30px -5px rgba(7, 26, 51, 0.12), 0 0 0 1px rgba(21, 94, 239, 0.15)'
              : '0 8px 25px -6px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(16, 24, 40, 0.03)',
            padding: scrolled ? '8px 26px' : '12px 30px',
          }}
        >
          {/* ── Left Cluster: Brand Logo & Live Status Pulse ── */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 group transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <Logo size={scrolled ? 32 : 36} variant="dark" />
            </Link>

            {/* Elevated Live Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border font-mono bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LMS Disbursal Active</span>
            </div>
          </div>

          {/* ── Center Cluster: Nav Tabs ── */}
          <nav className="hidden lg:flex items-center gap-1.5 font-sans">
            {/* 1. Products Dropdown Trigger */}
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
                <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>Products</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    productsOpen ? 'rotate-180 text-[#155EEF]' : 'text-slate-400'
                  }`}
                />
              </Nav3DItem>

              {/* Mega Menu Deck Dropdown — Stable, Flat, Solid White */}
              {productsOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[920px] rounded-3xl bg-[#FFFFFF] border-2 border-[#CBD5E1] p-6 z-50 text-[#071A33] shadow-[0_25px_70px_rgba(7,26,51,0.22)]"
                  style={{
                    backgroundColor: '#FFFFFF',
                    transformOrigin: 'top center',
                  }}
                >
                  {/* Top Header Bar inside Mega Menu */}
                  <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-[#155EEF]" />
                      <span className="text-[11px] font-extrabold tracking-wider text-slate-600 uppercase font-mono">
                        Adyapan Financial Architecture
                      </span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setProductsOpen(false)}
                      className="text-xs font-bold text-[#155EEF] hover:text-[#0d47a1] flex items-center gap-1 font-mono hover:underline"
                    >
                      <span>Access LMS Suite</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* 4 Category Columns with Clean Hover Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    {PRODUCTS_CATEGORIES.map((cat, idx) => {
                      const Icon = cat.icon;
                      return (
                        <div key={idx} className="space-y-2 rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Icon className="w-3.5 h-3.5 text-[#155EEF]" />
                            </div>
                            <span className="text-xs font-black text-[#071A33] uppercase font-mono tracking-tight">
                              {cat.title}
                            </span>
                          </div>

                          <div className="space-y-1">
                            {cat.items.map((item, itemIdx) => (
                              <Link
                                key={itemIdx}
                                href={item.href}
                                onClick={() => setProductsOpen(false)}
                                className="block p-2 rounded-xl transition-all duration-150 hover:bg-white hover:border-slate-200 border border-transparent hover:shadow-xs group/item"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800 group-hover/item:text-[#155EEF] transition-colors">
                                    {item.name}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-blue-100 text-[#155EEF] border border-blue-200 font-mono">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                {item.desc && (
                                  <p className="text-[10px] text-slate-400 mt-0.5 group-hover/item:text-slate-600 transition-colors line-clamp-1">
                                    {item.desc}
                                  </p>
                                )}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Instant Underwriting Banner inside Mega Menu */}
                  <div className="mt-4 pt-3.5 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                        ⚡
                      </div>
                      <span className="text-xs text-slate-600 font-medium">
                        <strong className="text-slate-900 font-bold">Instant Digital Underwriting in 60s</strong> — zero paperwork, bank-grade 256-bit DigiLocker integration.
                      </span>
                    </div>

                    <Link
                      href="/products/personal-loans#calculator"
                      onClick={() => setProductsOpen(false)}
                      className="px-3.5 py-1.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white text-xs font-bold transition-all hover:scale-105 flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Check Rate</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Direct Architecture Links */}
            <Nav3DItem href="/#branches">About</Nav3DItem>
            <Nav3DItem href="/#simulator">Resources</Nav3DItem>
            <Nav3DItem href="/#launchpad">Contact</Nav3DItem>
          </nav>

          {/* ── Right Cluster: Auth & Action Buttons ── */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold text-slate-700 hover:text-[#155EEF] px-3.5 py-2 rounded-full hover:bg-slate-100/70 transition-all font-mono"
            >
              Sign In
            </Link>

            <Link
              href="/products/personal-loans#journey-sim"
              className="px-5 py-2.5 rounded-full bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-md shadow-[#155EEF]/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <span>Check Eligibility</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ── Mobile Hamburger Toggle Button ── */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-full border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Scroll Progress Bar along Capsule Bottom */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[92%] max-w-6xl h-[2px] bg-slate-100 overflow-hidden rounded-full pointer-events-none">
          <div
            ref={progressRef}
            className="h-full w-full bg-gradient-to-r from-[#155EEF] via-indigo-500 to-teal-400 origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </header>

      {/* ── Mobile Navigation Drawer Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md lg:hidden flex flex-col justify-end pointer-events-auto animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85vh] bg-white rounded-t-3xl border-t border-slate-200 p-6 overflow-y-auto space-y-5 shadow-2xl animate-fade-up"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <Logo size={32} variant="dark" />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Products Accordion */}
            <div className="space-y-2">
              <button
                onClick={() => setMobileProductsOpen((v) => !v)}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left font-bold text-sm text-[#071A33]"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#155EEF]" />
                  <span>Explore 16 LMS Products</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    mobileProductsOpen ? 'rotate-180 text-[#155EEF]' : ''
                  }`}
                />
              </button>

              {mobileProductsOpen && (
                <div className="space-y-4 pt-2 pl-2">
                  {PRODUCTS_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="space-y-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                        {cat.title}
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {cat.items.map((item, itemIdx) => (
                          <Link
                            key={itemIdx}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50 text-xs font-semibold text-slate-700"
                          >
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-[#155EEF]">
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

            {/* Direct Mobile Links */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/#branches"
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center font-bold text-xs text-slate-700"
              >
                About Architecture
              </Link>
              <Link
                href="/#simulator"
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center font-bold text-xs text-slate-700"
              >
                LMS Simulator
              </Link>
            </div>

            {/* Mobile CTAs */}
            <div className="pt-2 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3.5 rounded-2xl border border-slate-200 bg-white text-center font-bold text-sm text-[#071A33] block shadow-xs"
              >
                Sign In to Workspace
              </Link>
              <Link
                href="/products/personal-loans#journey-sim"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-[#155EEF] text-white text-center font-bold text-sm block shadow-lg shadow-[#155EEF]/25"
              >
                Check Loan Eligibility (60s)
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Scroll-To-Top Quick Action Button ── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-white text-[#155EEF] border border-slate-200 shadow-xl hover:shadow-2xl transition-all hover:scale-110 active:scale-90 animate-fade-in group"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
        </button>
      )}
    </>
  );
};
