'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { Logo } from '../Logo';
import { MagneticButton } from '../fintech/MagneticButton';

const NAV_LINKS = [
  { href: '#story-scene', label: 'Narrative Arc', icon: Compass },
  { href: '#selector', label: 'Loan Pathways', icon: Compass },
  { href: '#calculator', label: 'Tactile Simulator', icon: Calculator },
  { href: '/dashboard', label: 'LMS Suite', icon: ShieldCheck },
];

export const MotionNavbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const navBarRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll-responsive navbar state using ScrollTrigger
    const trigger = ScrollTrigger.create({
      start: '80px top',
      end: '99999px top',
      onUpdate: (self) => {
        const isScrolled = self.isActive;
        setScrolled(isScrolled);
      },
    });

    // Entrance animation
    if (navBarRef.current) {
      gsap.fromTo(
        navBarRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 }
      );
    }

    return () => {
      trigger.kill();
    };
  }, []);

  // Animate mobile drawer
  useEffect(() => {
    if (drawerRef.current) {
      if (mobileOpen) {
        gsap.fromTo(
          drawerRef.current,
          { y: -16, opacity: 0, scale: 0.97 },
          { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' }
        );
        // Stagger drawer items
        const items = drawerRef.current.querySelectorAll('[data-drawer-item]');
        gsap.fromTo(
          items,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out', stagger: 0.05, delay: 0.1 }
        );
      }
    }
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none py-3"
    >
      <div
        ref={navBarRef}
        className="pointer-events-auto w-full max-w-7xl mx-auto rounded-2xl border flex items-center justify-between px-4 sm:px-6 transition-all duration-500 ease-out"
        style={{
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.97)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(12px)',
          borderColor: scrolled ? 'rgba(211, 229, 250, 0.8)' : 'rgba(211, 229, 250, 1)',
          boxShadow: scrolled
            ? '0 4px 24px -4px rgba(7, 26, 51, 0.08), 0 1px 2px rgba(7, 26, 51, 0.04)'
            : '0 1px 2px rgba(16, 24, 40, 0.04)',
          padding: scrolled ? '8px 24px' : '10px 24px',
        }}
      >
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <Logo size={36} variant="dark" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {NAV_LINKS.map((link, idx) => {
              const Icon = link.icon;
              return (
                <a
                  key={idx}
                  href={link.href}
                  className="px-3.5 py-1.5 text-xs font-bold text-[#071A33] hover:text-[#155EEF] hover:bg-[#EAF4FF] transition-all rounded-xl flex items-center gap-1.5 relative group/link"
                >
                  <Icon className="w-3.5 h-3.5 text-[#155EEF]" />
                  <span>{link.label}</span>
                  {/* Animated underline */}
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-px bg-[#155EEF] origin-left scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 ease-out" />
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
  );
};
