'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ShieldCheck,
  Zap,
  Sparkles,
  Compass,
  Calculator,
  Mail,
  Activity,
  Percent,
  Lock,
} from 'lucide-react';
import { Logo } from '../Logo';
import { MagneticButton } from '../fintech/MagneticButton';
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

  // 3D Capsule Tilt & Specular Cursor Follower Ref
  const navBarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const productsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 3D Gyro Physics state for the floating capsule
  const gyro = useRef({
    rx: 0,
    ry: 0,
    tx: 0,
    ty: 0,
    targetRx: 0,
    targetRy: 0,
    targetTx: 0,
    targetTy: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false,
    rafId: 0,
  });

  const updateGyroPhysics = useCallback(() => {
    const g = gyro.current;
    const factor = g.isHovered ? 0.12 : 0.08;

    g.rx += (g.targetRx - g.rx) * factor;
    g.ry += (g.targetRy - g.ry) * factor;
    g.tx += (g.targetTx - g.tx) * factor;
    g.ty += (g.targetTy - g.ty) * factor;

    if (navBarRef.current) {
      navBarRef.current.style.transform = `perspective(1200px) rotateX(${g.rx.toFixed(
        2
      )}deg) rotateY(${g.ry.toFixed(2)}deg) translate3d(${g.tx.toFixed(2)}px, ${g.ty.toFixed(
        2
      )}px, 0)`;
    }

    const isSettled =
      !g.isHovered &&
      Math.abs(g.rx) < 0.02 &&
      Math.abs(g.ry) < 0.02 &&
      Math.abs(g.tx) < 0.02 &&
      Math.abs(g.ty) < 0.02;

    if (!isSettled) {
      g.rafId = requestAnimationFrame(updateGyroPhysics);
    } else {
      g.rx = 0;
      g.ry = 0;
      g.tx = 0;
      g.ty = 0;
      if (navBarRef.current) {
        navBarRef.current.style.transform =
          'perspective(1200px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
      }
      g.rafId = 0;
    }
  }, []);

  const handleNavPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!navBarRef.current) return;
    const rect = navBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width - 0.5) * 2;
    const normY = (y / rect.height - 0.5) * 2;

    const g = gyro.current;
    g.isHovered = true;
    g.targetRy = normX * 4.5; // Max 4.5deg subtle tilt
    g.targetRx = -normY * 4.0;
    g.targetTx = normX * 2.0;
    g.targetTy = normY * 1.5;
    g.glareX = (x / rect.width) * 100;
    g.glareY = (y / rect.height) * 100;

    if (!g.rafId) {
      g.rafId = requestAnimationFrame(updateGyroPhysics);
    }
  };

  const handleNavPointerLeave = () => {
    const g = gyro.current;
    g.isHovered = false;
    g.targetRx = 0;
    g.targetRy = 0;
    g.targetTx = 0;
    g.targetTy = 0;

    if (!g.rafId) {
      g.rafId = requestAnimationFrame(updateGyroPhysics);
    }
  };

  /* ── Continuous scroll tracking for height compression & progress ── */
  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? currentY / docHeight : 0;
      setScrollProgress(progress);
      setScrolled(currentY > 60);
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
    }, 220);
  };

  useEffect(() => {
    if (dropdownRef.current && productsOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -12, scale: 0.96, rotateX: -6 },
        { opacity: 1, y: 0, scale: 1, rotateX: 0, duration: 0.3, ease: 'back.out(1.4)' }
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
      {/* Dimmed Backdrop Scrim for Crystal Clear Focus on Mega Menu */}
      {productsOpen && (
        <div
          onClick={() => setProductsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto"
        />
      )}

      <header
        ref={headerRef}
        className="fixed top-0 inset-x-0 z-50 flex justify-center px-3 sm:px-6 pointer-events-none transition-all duration-300"
        style={{ paddingTop: scrolled ? '10px' : '16px' }}
      >
        {/* 3D Floating Interactive Glass Capsule Bar */}
        <div
          ref={navBarRef}
          onPointerMove={handleNavPointerMove}
          onPointerLeave={handleNavPointerLeave}
          className="pointer-events-auto w-full max-w-7xl mx-auto rounded-full border flex items-center justify-between px-4 sm:px-6 relative shadow-2xl transition-all duration-300 group/navbar"
          style={{
            transformStyle: 'preserve-3d',
            backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(24px) saturate(180%)',
            borderColor: scrolled ? 'rgba(21, 94, 239, 0.35)' : 'rgba(211, 229, 250, 0.9)',
            boxShadow: scrolled
              ? '0 20px 45px -10px rgba(7, 26, 51, 0.15), 0 0 0 1px rgba(21, 94, 239, 0.2)'
              : '0 12px 35px -8px rgba(21, 94, 239, 0.12), 0 2px 8px rgba(16, 24, 40, 0.04)',
            padding: scrolled ? '8px 26px' : '12px 30px',
            willChange: 'transform',
          }}
        >
          {/* ── Left Cluster: 3D Brand Logo & Live Status Pulse ── */}
          <div
            className="flex items-center gap-4 sm:gap-6"
            style={{ transform: 'translateZ(12px)', transformStyle: 'preserve-3d' }}
          >
            <Link
              href="/"
              className="flex items-center gap-2 group transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <Logo size={scrolled ? 32 : 36} variant="dark" />
            </Link>

            {/* 3D Elevated Live Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold border font-mono bg-emerald-50/90 border-emerald-200 text-emerald-700 shadow-xs transition-all hover:scale-105">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LMS Disbursal Active</span>
            </div>
          </div>

          {/* ── Center Cluster: 3D Nav Tabs ── */}
          <nav
            className="hidden lg:flex items-center gap-1.5 font-sans"
            style={{ transform: 'translateZ(14px)', transformStyle: 'preserve-3d' }}
          >
            {/* 1. Products (3D Physical Item + 3D Mega-Menu Deck) */}
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

              {/* 3D Mega Menu Deck Dropdown */}
              {productsOpen && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[920px] rounded-3xl bg-[#FFFFFF] border-2 border-[#CBD5E1] p-6 z-50 text-[#071A33] shadow-[0_30px_90px_rgba(7,26,51,0.35)]"
                  style={{
                    backgroundColor: '#FFFFFF',
                    opacity: 1,
                    transformStyle: 'preserve-3d',
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

                  {/* 4 Category Columns with 3D Hover Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    {PRODUCTS_CATEGORIES.map((cat, idx) => {
                      const Icon = cat.icon;
                      return (
                        <div key={idx} className="space-y-2 rounded-2xl bg-slate-50/80 border border-slate-200/80 p-3">
                          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                            <div className="w-6 h-6 rounded-lg bg-[#155EEF] flex items-center justify-center text-white shadow-xs">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <h4 className="text-xs font-black text-[#071A33] tracking-tight">
                              {cat.title}
                            </h4>
                          </div>

                          <div className="space-y-1">
                            {cat.items.map((item, itemIdx) => (
                              <Link
                                key={itemIdx}
                                href={item.href}
                                onClick={() => setProductsOpen(false)}
                                className="group/item block p-2 rounded-xl text-left transition-all bg-white hover:bg-[#EAF4FF] hover:border-[#155EEF]/30 border border-slate-200/60 shadow-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#071A33] group-hover/item:text-[#155EEF] transition-transform duration-150 group-hover/item:translate-x-0.5">
                                    {item.name}
                                  </span>
                                  {item.badge && (
                                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#155EEF] text-white">
                                      {item.badge}
                                    </span>
                                  )}
                                </div>
                                {item.desc && (
                                  <p className="text-[10px] font-medium text-slate-500 group-hover/item:text-slate-700 mt-0.5 leading-tight">
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

                  {/* Mega Menu Footer Banner */}
                  <div className="mt-4 pt-3.5 px-4 py-3 rounded-2xl flex items-center justify-between bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#155EEF] text-white flex items-center justify-center shadow-xs">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#071A33]">Instant Digital Underwriting in 60s</p>
                        <p className="text-[10px] font-medium text-slate-600">Zero paperwork. Bank-grade 256-bit DigiLocker integration.</p>
                      </div>
                    </div>
                    <a
                      href="#launchpad"
                      onClick={() => setProductsOpen(false)}
                      className="text-xs font-black px-4 py-2 rounded-full bg-[#155EEF] text-white hover:bg-[#104ec8] transition-all shadow-md flex items-center gap-1.5"
                    >
                      <span>Check Rate</span>
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

          {/* ── Right Cluster: 3D Actions & Glowing Magnetic Button ── */}
          <div
            className="hidden sm:flex items-center gap-3"
            style={{ transform: 'translateZ(16px)', transformStyle: 'preserve-3d' }}
          >
            {/* Sign In 3D Item */}
            <Nav3DItem href="/login" showUnderline={false}>
              <span className="font-mono text-xs">Sign In</span>
            </Nav3DItem>

            {/* High-Impact 3D Magnetic Button */}
            <MagneticButton
              href="#launchpad"
              variant="primary"
              className="px-6 py-2.5 text-xs font-black rounded-full shadow-lg shadow-[#155EEF]/25 bg-gradient-to-r from-[#155EEF] via-[#2563EB] to-[#1d40d8] hover:opacity-95 text-white transition-all hover:scale-105 active:scale-95"
            >
              <span>Check Eligibility</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </MagneticButton>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className="lg:hidden text-[#071A33] hover:text-[#155EEF] p-2 rounded-xl bg-white border border-[#D3E5FA] shadow-xs cursor-pointer"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* ── Real-Time Scroll Progress Energy Line ── */}
          <div
            ref={progressRef}
            className="absolute bottom-0 left-6 right-6 h-[2px] origin-left hidden lg:block rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, #155EEF, #3B82F6, #60A5FA)',
              transform: 'scaleX(0)',
              opacity: scrolled ? 0.9 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />
        </div>

        {/* ── Mobile Navigation Drawer ── */}
        {mobileOpen && (
          <div
            ref={drawerRef}
            className="fixed top-20 inset-x-4 p-5 rounded-3xl bg-white/98 text-[#071A33] border border-[#D3E5FA] shadow-2xl lg:hidden space-y-3 pointer-events-auto backdrop-blur-2xl max-h-[82vh] overflow-y-auto"
          >
            {/* Products Accordion */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
              <button
                onClick={() => setMobileProductsOpen((v) => !v)}
                className="w-full flex items-center justify-between p-3.5 bg-[#EAF4FF] text-sm font-bold text-[#071A33]"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-[#155EEF]" />
                  <span>Products & Lending</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[#155EEF] transition-transform ${
                    mobileProductsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {mobileProductsOpen && (
                <div className="p-3 space-y-3 text-xs bg-white">
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
                            className="py-1.5 font-semibold text-slate-700 hover:text-[#155EEF] flex items-center justify-between"
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

            <a
              href="#story-scene"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 text-sm font-bold text-[#071A33] hover:bg-[#EAF4FF]"
            >
              <Compass className="w-4 h-4 text-[#155EEF]" />
              <span>About Us</span>
            </a>

            <a
              href="#calculator"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 text-sm font-bold text-[#071A33] hover:bg-[#EAF4FF]"
            >
              <Calculator className="w-4 h-4 text-[#155EEF]" />
              <span>Financial Resources</span>
            </a>

            <a
              href="#launchpad"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-50 text-sm font-bold text-[#071A33] hover:bg-[#EAF4FF]"
            >
              <Mail className="w-4 h-4 text-[#155EEF]" />
              <span>Contact Support</span>
            </a>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center py-3 text-xs font-bold text-[#071A33] border border-slate-200 rounded-2xl font-mono"
              >
                Sign In to LMS Suite
              </Link>
              <a
                href="#launchpad"
                onClick={() => setMobileOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#155EEF] text-white text-xs font-bold shadow-lg"
              >
                <span>Check Eligibility</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </header>

      {/* ── 3D Floating Go to Top Arrow (Bottom-Right) ── */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className={`fixed bottom-7 right-7 z-50 p-3.5 rounded-full bg-white/95 text-[#155EEF] border border-[#D3E5FA] shadow-2xl backdrop-blur-md transition-all duration-300 ease-out hover:bg-[#155EEF] hover:text-white hover:scale-110 active:scale-95 group cursor-pointer ${
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
