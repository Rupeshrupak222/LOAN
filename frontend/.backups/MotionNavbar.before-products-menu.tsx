'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Menu,
  X,
  Compass,
  Calculator,
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowUp,
} from 'lucide-react';
import { Logo } from '../Logo';
import { MagneticButton } from '../fintech/MagneticButton';

/* ══════════════════════════════════════════════════════════════
   MotionNavbar — Premium Adaptive Navigation System
   ─────────────────────────────────────────────────────────────
   ▸ Permanently visible floating navigation (stays fixed on scroll)
   ▸ Scroll-responsive: compresses height, deepens shadow & blur
   ▸ Active section indicator: blue pill slides behind current link
   ▸ Scroll progress bar: thin blue line at bottom edge
   ▸ Floating "Go to Top" button at bottom-right of viewport
   ▸ Animated underlines with stagger timing
   ▸ Mobile: staggered drawer entrance
   ══════════════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { href: '#story-scene', label: 'Narrative Arc', icon: Compass, sectionId: 'story-scene' },
  { href: '#selector', label: 'Loan Pathways', icon: Compass, sectionId: 'selector' },
  { href: '#calculator', label: 'Tactile Simulator', icon: Calculator, sectionId: 'calculator' },
  { href: '/dashboard', label: 'LMS Suite', icon: ShieldCheck, sectionId: '' },
];

export const MotionNavbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState(-1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const ticking = useRef(false);

  /* ── Scroll tracking for compression, progress & Go-To-Top button ── */
  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const currentY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? currentY / docHeight : 0;
      setScrollProgress(progress);

      const isScrolled = currentY > 80;
      setScrolled(isScrolled);
      setShowScrollTop(currentY > 320);

      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /* ── Active section indicator tracking via ScrollTrigger ── */
  useEffect(() => {
    const sectionIds = ['hero', 'story-scene', 'selector', 'calculator'];
    const triggers: ScrollTrigger[] = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => {
          if (self.isActive) {
            const navIdx =
              id === 'hero' ? -1 :
              id === 'story-scene' ? 0 :
              id === 'selector' ? 1 :
              id === 'calculator' ? 2 : -1;
            setActiveSection(navIdx);
          }
        },
      });
      triggers.push(trigger);
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  /* ── Animate the sliding active indicator pill ── */
  useEffect(() => {
    if (!indicatorRef.current || activeSection < 0) {
      if (indicatorRef.current) {
        gsap.to(indicatorRef.current, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
      return;
    }

    const activeLink = linkRefs.current[activeSection];
    if (!activeLink || !navBarRef.current) return;

    const navRect = navBarRef.current.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    gsap.to(indicatorRef.current, {
      x: linkRect.left - navRect.left,
      width: linkRect.width,
      opacity: 1,
      duration: 0.4,
      ease: 'power3.out',
    });
  }, [activeSection]);

  /* ── Navbar entrance animation ── */
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
    if (drawerRef.current) {
      if (mobileOpen) {
        gsap.fromTo(
          drawerRef.current,
          { y: -16, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }
        );
        const items = drawerRef.current.querySelectorAll('[data-drawer-item]');
        gsap.fromTo(
          items,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out', stagger: 0.05, delay: 0.1 }
        );
      }
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

  /* ── Smooth Scroll to Top handler ── */
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
        className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none"
        style={{
          paddingTop: scrolled ? '8px' : '12px',
          transform: 'translateY(0)',
          transition: 'padding-top 0.5s ease-out',
        }}
      >
        <div
          ref={navBarRef}
          className="pointer-events-auto w-full max-w-7xl mx-auto rounded-2xl border flex items-center justify-between px-4 sm:px-6 relative overflow-hidden"
          style={{
            backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.97)' : 'rgba(255, 255, 255, 0.92)',
            backdropFilter: scrolled ? 'blur(24px) saturate(180%)' : 'blur(14px) saturate(150%)',
            borderColor: scrolled ? 'rgba(211, 229, 250, 0.9)' : 'rgba(211, 229, 250, 1)',
            boxShadow: scrolled
              ? '0 8px 32px -8px rgba(7, 26, 51, 0.10), 0 2px 4px rgba(7, 26, 51, 0.04)'
              : '0 1px 3px rgba(16, 24, 40, 0.04)',
            padding: scrolled ? '6px 24px' : '10px 24px',
            transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        >
          {/* ── Sliding Active Section Indicator (Blue pill behind active link) ── */}
          <div
            ref={indicatorRef}
            className="absolute top-1/2 -translate-y-1/2 h-[70%] rounded-xl pointer-events-none hidden lg:block"
            style={{
              background: 'rgba(21, 94, 239, 0.08)',
              border: '1px solid rgba(21, 94, 239, 0.12)',
              opacity: 0,
              width: 0,
            }}
          />

          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo size={scrolled ? 32 : 36} variant="dark" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1.5 relative">
              {NAV_LINKS.map((link, idx) => {
                const Icon = link.icon;
                const isActive = activeSection === idx;
                return (
                  <a
                    key={idx}
                    ref={(el) => { linkRefs.current[idx] = el; }}
                    href={link.href}
                    className={`px-3.5 py-1.5 text-xs font-bold transition-all rounded-xl flex items-center gap-1.5 relative group/link z-10 ${
                      isActive
                        ? 'text-[#155EEF]'
                        : 'text-[#071A33] hover:text-[#155EEF]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 transition-colors duration-300 ${
                      isActive ? 'text-[#155EEF]' : 'text-[#155EEF]/70'
                    }`} />
                    <span>{link.label}</span>
                    {!isActive && (
                      <span className="absolute bottom-0 left-3.5 right-3.5 h-px bg-[#155EEF] origin-left scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 ease-out" />
                    )}
                  </a>
                );
              })}
            </nav>
          </div>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-bold text-[#071A33] hover:text-[#155EEF] px-3 py-2 rounded-xl transition-colors font-mono relative group/signin"
            >
              Sign In
              <span className="absolute bottom-1 left-3 right-3 h-px bg-[#155EEF] origin-left scale-x-0 group-hover/signin:scale-x-100 transition-transform duration-300 ease-out" />
            </Link>
            <MagneticButton
              href="#launchpad"
              variant="primary"
              className="px-5 py-2.5 text-xs font-black shadow-md shadow-[#155EEF]/20"
            >
              <span>Check Eligibility</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
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

          {/* ── Scroll Progress Bar (Thin blue line at bottom edge) ── */}
          <div
            ref={progressRef}
            className="absolute bottom-0 left-0 h-[2px] origin-left hidden lg:block"
            style={{
              background: 'linear-gradient(90deg, #155EEF, #3B82F6)',
              width: '100%',
              transform: 'scaleX(0)',
              opacity: scrolled ? 0.7 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div
            ref={drawerRef}
            className="fixed top-20 inset-x-4 p-6 rounded-2xl bg-white border border-[#D3E5FA] shadow-2xl lg:hidden space-y-4 pointer-events-auto"
          >
            <div className="flex flex-col space-y-2">
              {NAV_LINKS.map((link, idx) => (
                <a
                  key={idx}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  data-drawer-item
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#EAF4FF] text-sm font-bold text-[#071A33]"
                >
                  <link.icon className="w-4 h-4 text-[#155EEF]" />
                  <span>{link.label}</span>
                </a>
              ))}
            </div>

            <a
              href="#launchpad"
              onClick={() => setMobileOpen(false)}
              data-drawer-item
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#155EEF] text-white text-sm font-bold shadow-md shadow-[#155EEF]/20"
            >
              <span>Check Eligibility</span>
              <ArrowRight className="w-4 h-4" />
            </a>
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
