'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import {
  Menu,
  X,
  ChevronDown,
  ArrowRight,
  ArrowUp,
  Landmark,
  Building2,
  CreditCard,
  Layers,
} from 'lucide-react';
import { Logo } from '../Logo';

interface ProductItem {
  name: string;
  badge?: string;
  desc: string;
  previewTag: string;
  previewText: string;
  href: string;
}

interface ProductCategory {
  title: string;
  icon: React.ElementType;
  items: ProductItem[];
}

const PRODUCTS_CATEGORIES: ProductCategory[] = [
  {
    title: 'BANKING & CORE',
    icon: Landmark,
    items: [
      {
        name: 'Core Banking Engine',
        desc: 'Real-time ledger & settlement',
        previewTag: 'CORE BANKING',
        previewText: 'REAL-TIME FINANCIAL CORE & DEPOSITS',
        href: '/products/core-banking-engine',
      },
      {
        name: 'Debit & Prepaid Cards',
        desc: 'Card issuance & program management',
        previewTag: 'CARDS ENGINE',
        previewText: 'PROGRAM MANAGEMENT & VIRTUAL CARDS',
        href: '/products/debit-prepaid-cards',
      },
      {
        name: 'Neobanking Portal',
        badge: 'New',
        desc: 'Digital deposit & retail accounts',
        previewTag: 'NEOBANKING',
        previewText: 'FULL-STACK DIGITAL COMMERCIAL BANKING',
        href: '/products/neobanking-portal',
      },
      {
        name: 'Connect API Gateway',
        desc: 'Unified financial integration fabric',
        previewTag: 'CONNECT API',
        previewText: 'PLUG & PLAY FINANCIAL API GATEWAY',
        href: '/products/connect-api-gateway',
      },
    ],
  },
  {
    title: 'LENDING',
    icon: Building2,
    items: [
      {
        name: 'Personal Loans',
        badge: 'Instant',
        desc: 'Instant automated disbursal',
        previewTag: 'PERSONAL LOANS',
        previewText: 'SUB-MINUTE END-TO-END RETAIL LENDING',
        href: '/products/personal-loans',
      },
      {
        name: 'SME Business Credit',
        desc: 'Working capital & revenue finance',
        previewTag: 'SME CREDIT',
        previewText: 'WORKING CAPITAL & INVOICE DISCOUNTING',
        href: '/products/sme-business-credit',
      },
      {
        name: 'Home Mortgages',
        desc: 'Digital property collateral valuation',
        previewTag: 'MORTGAGES',
        previewText: 'LONG-TENURE COLLATERAL & LIEN WORKFLOWS',
        href: '/products/home-mortgages',
      },
      {
        name: 'BNPL',
        badge: '0% APR',
        desc: 'Split-pay checkout credit rails',
        previewTag: 'BNPL CHECKOUT',
        previewText: 'DYNAMIC TRANSACTION LEVEL FINANCING',
        href: '/products/bnpl',
      },
      {
        name: 'Credit Line on UPI',
        badge: 'Live',
        desc: 'Pre-sanctioned revolving credit',
        previewTag: 'CREDIT LINE ON UPI',
        previewText: 'REVOLVING CREDIT ON PAYMENT JOURNEYS',
        href: '/products/credit-line-upi',
      },
    ],
  },
  {
    title: 'PAYMENTS',
    icon: CreditCard,
    items: [
      {
        name: 'NPCI UPI Network',
        desc: 'Sub-second switch & QR rails',
        previewTag: 'UPI NETWORK',
        previewText: 'DIRECT NPCI AUTO-DEBIT & NACH CLEARING',
        href: '/products/npci-upi-network',
      },
      {
        name: 'Cross-Border Wire',
        desc: 'Global multi-currency remittances',
        previewTag: 'CROSS-BORDER',
        previewText: 'INSTANT SWIFT & FX CORRIDOR SETTLEMENT',
        href: '/products/cross-border-wire',
      },
      {
        name: 'Merchant QR Soundbox',
        desc: 'Dynamic acoustic payment alerts',
        previewTag: 'SOUNDBOX IoT',
        previewText: '4G IOT HARDWARE PAYMENT CONFIRMATION',
        href: '/products/merchant-qr-soundbox',
      },
    ],
  },
  {
    title: 'RISK & COMPLIANCE',
    icon: Layers,
    items: [
      {
        name: 'DigiLocker e-KYC',
        badge: 'Paperless',
        desc: 'Instant paperless identity verification',
        previewTag: 'DIGILOCKER',
        previewText: 'AADHAAR & PAN VERIFIED IDENTITY ATTESTATION',
        href: '/products/digilocker-ekyc',
      },
      {
        name: 'AI Underwriting Scorecard',
        desc: '4-pillar predictive risk engine',
        previewTag: 'AI SCORECARD',
        previewText: 'MULTI-DIMENSIONAL FINANCIAL PORTRAIT & RISK SCORING',
        href: '/products/ai-underwriting-scorecard',
      },
      {
        name: 'Immutable Audit Trail',
        badge: 'WORM',
        desc: 'Append-only regulatory logs',
        previewTag: 'IMMUTABLE AUDIT',
        previewText: 'APPEND-ONLY FINANCIAL LEDGER FORENSICS',
        href: '/products/immutable-audit-trail',
      },
      {
        name: 'Automated DTI Policy',
        desc: 'Real-time bureau rule engine',
        previewTag: 'DTI ENGINE',
        previewText: 'REAL-TIME BUREAU RULE CALIBRATION',
        href: '/products/automated-dti-policy',
      },
    ],
  },
];

export const MotionNavbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Active preview state for the mega menu
  const [activePreview, setActivePreview] = useState<{ tag: string; text: string }>({
    tag: 'FINANCIAL INFRASTRUCTURE',
    text: 'UNIFIED, MODULAR LENDING & AUDIT CORE',
  });

  const megaMenuRef = useRef<HTMLDivElement>(null);
  const productsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll detection only for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard accessibility: Close menus on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProductsOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Mega menu hover entrance
  const handleProductsEnter = () => {
    if (productsTimerRef.current) clearTimeout(productsTimerRef.current);
    setProductsOpen(true);
  };

  const handleProductsLeave = () => {
    productsTimerRef.current = setTimeout(() => {
      setProductsOpen(false);
    }, 180);
  };

  useEffect(() => {
    if (megaMenuRef.current && productsOpen) {
      gsap.fromTo(
        megaMenuRef.current,
        { opacity: 0, y: -4 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      );
    }
  }, [productsOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isProductsActive = pathname ? pathname.startsWith('/products') : false;

  return (
    <>
      {/* ── Dimmed Backdrop Scrim for Mega Menu ── */}
      {productsOpen && (
        <div
          onClick={() => setProductsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/15 backdrop-blur-[1px] transition-opacity duration-200 pointer-events-auto"
        />
      )}

      {/* ── ROCK-SOLID FIXED EDITORIAL HEADER (STATIONARY, NO SHRINKING OR JUMPING) ── */}
      <header className="fixed top-0 inset-x-0 z-50 w-full h-[72px] bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs select-none">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 h-full flex items-center justify-between">
          {/* ── LEFT CLUSTER: REFINED BRAND LOCKUP ── */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2"
            >
              <Logo size={34} variant="dark" />
            </Link>

            {/* Systems-Grade LMS Status Indicator */}
            <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono font-bold text-slate-600 uppercase tracking-wider pl-4 border-l border-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LMS DISBURSAL ACTIVE</span>
            </div>
          </div>

          {/* ── CENTER CLUSTER: EDITORIAL NAVIGATION TABS ── */}
          <nav className="hidden lg:flex items-center gap-8 font-sans">
            {/* 1. Products Dropdown Trigger */}
            <div
              className="relative py-2"
              onMouseEnter={handleProductsEnter}
              onMouseLeave={handleProductsLeave}
            >
              <button
                type="button"
                onClick={() => setProductsOpen((v) => !v)}
                aria-expanded={productsOpen}
                className={`group flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer py-1 ${
                  productsOpen || isProductsActive
                    ? 'text-[#155EEF] font-semibold'
                    : 'text-slate-700 hover:text-[#071A33]'
                }`}
              >
                <span>Products</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    productsOpen ? 'rotate-180 text-[#155EEF]' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                />
              </button>

              {/* Steady Indicator for Active State */}
              {isProductsActive && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#155EEF] pointer-events-none" />
              )}
            </div>

            {/* 2. Direct Editorial Links */}
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors py-1 ${
                pathname === '/about' ? 'text-[#155EEF] font-semibold' : 'text-slate-700 hover:text-[#071A33]'
              }`}
            >
              About
            </Link>

            <Link
              href="/resources"
              className={`text-sm font-medium transition-colors py-1 ${
                pathname.startsWith('/resources') ? 'text-[#155EEF] font-semibold' : 'text-slate-700 hover:text-[#071A33]'
              }`}
            >
              Resources
            </Link>

            <Link
              href="/contact"
              className={`text-sm font-medium transition-colors py-1 ${
                pathname === '/contact' ? 'text-[#155EEF] font-semibold' : 'text-slate-700 hover:text-[#071A33]'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* ── RIGHT CLUSTER: AUTH & CHECK ELIGIBILITY CTA ── */}
          <div className="hidden sm:flex items-center gap-5 font-sans">
            {/* Simple Sign In text */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-[#155EEF] transition-colors py-1.5"
            >
              <span>Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            {/* Premium Compact Check Eligibility CTA (Stationary rounded rectangle) */}
            <Link
              href="/products/personal-loans#journey-sim"
              className="px-5 py-2.5 rounded-xl bg-[#155EEF] hover:bg-blue-700 text-white font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Check Eligibility</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* ── MOBILE HAMBURGER BUTTON ── */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="p-2 rounded-lg text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* ── FULL-WIDTH PRODUCTS MEGA MENU LAYER ── */}
        {productsOpen && (
          <div
            ref={megaMenuRef}
            onMouseEnter={handleProductsEnter}
            onMouseLeave={handleProductsLeave}
            className="absolute top-full inset-x-0 w-full bg-white border-b border-slate-200 shadow-xl z-50 text-[#071A33]"
            style={{ contain: 'paint layout' }}
          >
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 py-8">
              {/* 4 Vertical Editorial Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-6 border-b border-slate-200">
                {PRODUCTS_CATEGORIES.map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <div key={idx} className="space-y-4 text-left">
                      {/* Column Title with Fine Rule */}
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                        <Icon className="w-3.5 h-3.5 text-[#155EEF]" />
                        <span className="text-xs font-black text-[#071A33] tracking-wider uppercase font-mono">
                          {cat.title}
                        </span>
                      </div>

                      {/* Product Links */}
                      <div className="space-y-1">
                        {cat.items.map((item, itemIdx) => (
                          <Link
                            key={itemIdx}
                            href={item.href}
                            onClick={() => setProductsOpen(false)}
                            onMouseEnter={() =>
                              setActivePreview({
                                tag: item.previewTag,
                                text: item.previewText,
                              })
                            }
                            className="group block p-2 rounded-lg transition-colors hover:bg-slate-50"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 group-hover:text-[#155EEF] transition-colors">
                                {item.name}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {item.badge && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-[#155EEF] border border-blue-200 font-mono">
                                    {item.badge}
                                  </span>
                                )}
                                <span className="text-xs text-[#155EEF] opacity-0 group-hover:opacity-100 transition-opacity">
                                  →
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 group-hover:text-slate-700 transition-colors line-clamp-1">
                              {item.desc}
                            </p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Typography-Driven Active Preview & Direct Access Strip */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
                <div className="flex items-center gap-3 text-slate-500">
                  <span className="px-2 py-0.5 bg-blue-50 text-[#155EEF] font-bold text-[10px] rounded border border-blue-200">
                    {activePreview.tag}
                  </span>
                  <span className="font-bold text-slate-800 tracking-wide text-[11px]">
                    {activePreview.text}
                  </span>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setProductsOpen(false)}
                  className="text-xs font-bold text-[#155EEF] hover:text-blue-800 flex items-center gap-1.5 transition-colors group"
                >
                  <span>Explore Financial Suite</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── MOBILE NAVIGATION DRAWER ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden flex flex-col justify-start pointer-events-auto"
          onClick={() => setMobileOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white border-b border-slate-200 p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto text-left font-sans"
          >
            {/* Mobile Header Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <Logo size={32} variant="dark" />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Status Readout */}
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LMS Disbursal Active // Production Rails</span>
            </div>

            {/* Mobile Products Accordion */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setMobileProductsOpen((v) => !v)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm text-[#071A33]"
              >
                <span>Financial Products (16 Solutions)</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    mobileProductsOpen ? 'rotate-180 text-[#155EEF]' : 'text-slate-400'
                  }`}
                />
              </button>

              {mobileProductsOpen && (
                <div className="space-y-4 pt-2 pl-2">
                  {PRODUCTS_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="space-y-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-mono">
                        {cat.title}
                      </span>
                      <div className="grid grid-cols-1 gap-1">
                        {cat.items.map((item, itemIdx) => (
                          <Link
                            key={itemIdx}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-blue-50 text-xs font-semibold text-slate-700"
                          >
                            <span>{item.name}</span>
                            {item.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-[#155EEF]">
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
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs font-semibold text-slate-700">
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100"
              >
                About
              </Link>
              <Link
                href="/resources"
                onClick={() => setMobileOpen(false)}
                className={`p-2.5 rounded-lg border transition-colors ${
                  pathname.startsWith('/resources')
                    ? 'bg-blue-50/80 border-blue-200 text-[#155EEF] font-semibold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Resources
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileOpen(false)}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100"
              >
                Contact
              </Link>
            </div>

            {/* Mobile CTAs */}
            <div className="pt-2 space-y-2.5">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-xl border border-slate-300 text-center font-bold text-xs text-[#071A33] block hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                href="/products/personal-loans#journey-sim"
                onClick={() => setMobileOpen(false)}
                className="w-full py-3 rounded-xl bg-[#155EEF] text-white text-center font-bold text-xs tracking-wider uppercase block shadow-sm"
              >
                Check Eligibility
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Scroll-To-Top Quick Action Button ── */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-xl bg-white text-[#155EEF] border border-slate-200 shadow-lg hover:shadow-xl transition-all group"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
};
