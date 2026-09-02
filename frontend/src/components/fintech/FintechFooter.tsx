'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Logo } from '../Logo';
import { ShieldCheck, Heart, ArrowUpRight, CheckCircle2 } from 'lucide-react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const FintechFooter: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!footerRef.current) return;
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const columns = footerRef.current?.querySelectorAll('[data-footer-col]');
      if (columns && columns.length > 0) {
        ScrollTrigger.create({
          trigger: footerRef.current,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            gsap.fromTo(
              columns,
              { opacity: 0, y: 20 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                stagger: 0.08,
                ease: 'power3.out',
                clearProps: 'all',
              }
            );
          },
        });
      }

      const regBox = footerRef.current?.querySelector('[data-reg-box]');
      if (regBox) {
        ScrollTrigger.create({
          trigger: regBox,
          start: 'top 95%',
          once: true,
          onEnter: () => {
            gsap.fromTo(
              regBox,
              { opacity: 0, y: 16 },
              {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: 'power3.out',
                clearProps: 'all',
              }
            );
          },
        });
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="bg-[#071A33] text-[#B8C7D9] text-xs border-t border-white/10 pt-16 pb-12 relative z-10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12 text-left">
          {/* Col 1: Brand & Manifesto */}
          <div data-footer-col className="lg:col-span-2 space-y-4">
            <Logo size={36} variant="light" />
            <p className="text-[#B8C7D9] text-xs leading-relaxed max-w-sm">
              Adyapan is an enterprise lending & core banking technology platform. Engineered to synchronize accounts, ledgers, transactions, and automated settlement across modern financial architectures.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#4EA8FF] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#4EA8FF] animate-pulse" />
              <span>100% RBI Compliant Digital Lending Architecture</span>
            </div>
          </div>

          {/* Col 2: Solutions */}
          <div data-footer-col>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-4">
              Financial Solutions
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <Link href="/products/personal-loans" className="hover:text-white transition-colors">
                  Personal Loans @ 10.5%
                </Link>
              </li>
              <li>
                <Link href="/products/sme-business-credit" className="hover:text-white transition-colors">
                  SME Business Credit Line
                </Link>
              </li>
              <li>
                <Link href="/products/home-mortgages" className="hover:text-white transition-colors">
                  Home Mortgages @ 8.5%
                </Link>
              </li>
              <li>
                <Link href="/products/bnpl" className="hover:text-white transition-colors">
                  0% 3-Month BNPL Credit
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Platform & LMS */}
          <div data-footer-col>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-4">
              Core Architecture
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <Link href="/products/core-banking-engine" className="hover:text-white transition-colors font-bold text-[#4EA8FF]">
                  Core Banking Engine →
                </Link>
              </li>
              <li>
                <Link href="/products/debit-prepaid-cards" className="hover:text-white transition-colors">
                  Debit & Prepaid Cards
                </Link>
              </li>
              <li>
                <Link href="/products/neobanking-portal" className="hover:text-white transition-colors">
                  Neobanking Portal
                </Link>
              </li>
              <li>
                <Link href="/products/npci-upi-network" className="hover:text-white transition-colors">
                  NPCI UPI Network
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors font-bold text-emerald-400">
                  Officer Sign In →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Regulatory & Legal */}
          <div data-footer-col>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-4">
              Transparency
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <span className="text-white">RBI Master Directions</span>
              </li>
              <li>
                <span className="text-white">Grievance Redressal Policy</span>
              </li>
              <li>
                <span className="text-white">Key Fact Statement (KFS)</span>
              </li>
              <li>
                <span className="text-white">ISO 27001 Security Audit</span>
              </li>
              <li>
                <span className="text-white">Privacy & Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory RBI NBFC Mandated Disclosures Box */}
        <div
          data-reg-box
          className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-[11px] text-[#B8C7D9] leading-relaxed mb-8 space-y-2 text-left"
        >
          <p>
            <strong className="text-white">Regulatory Disclaimer:</strong> Adyapan LMS acts as a digital lending facilitation platform (LSP) providing loan origination, technology infrastructure, and loan management services in partnership with RBI-registered Non-Banking Financial Companies (NBFCs).
          </p>
          <p>
            All loan decisions, disbursements, interest rate pricing, and underwriting are strictly executed by our RBI-licensed NBFC partners (including Meridian NBFC Ltd., Northbank Capital Pvt. Ltd., and Finroot Credit Ltd.). We never levy unauthorized charges or demand advance processing fees in cash.
          </p>
        </div>

        {/* Bottom copyright line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10 text-[#B8C7D9] text-xs font-medium">
          <div>
            © {new Date().getFullYear()} Adyapan Technologies Pvt. Ltd. All rights reserved.
          </div>
          <div className="font-mono text-[11px] text-white">
            Crafted for Ambitious Minds Across India.
          </div>
        </div>
      </div>
    </footer>
  );
};
