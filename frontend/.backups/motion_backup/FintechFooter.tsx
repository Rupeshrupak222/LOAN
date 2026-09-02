'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Logo } from '../Logo';
import { ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';

export const FintechFooter: React.FC = () => {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!footerRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      const columns = footerRef.current!.querySelectorAll('[data-footer-col]');
      gsap.set(columns, { opacity: 0, y: 30 });

      ScrollTrigger.create({
        trigger: footerRef.current,
        start: 'top 90%',
        once: true,
        onEnter: () => {
          gsap.to(columns, {
            opacity: 1, y: 0,
            duration: 0.7, stagger: 0.08, ease: 'power3.out',
          });
        },
      });

      const regBox = footerRef.current!.querySelector('[data-reg-box]');
      if (regBox) {
        gsap.set(regBox, { opacity: 0, y: 24, scale: 0.98 });
        ScrollTrigger.create({
          trigger: regBox,
          start: 'top 92%',
          once: true,
          onEnter: () => {
            gsap.to(regBox, {
              opacity: 1, y: 0, scale: 1,
              duration: 0.7, ease: 'power3.out',
            });
          },
        });
      }
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="bg-[#071A33] text-[#B8C7D9] text-xs border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Col 1: Brand & Manifesto */}
          <div data-footer-col className="lg:col-span-2 space-y-4">
            <Logo size={36} variant="light" />
            <p className="text-[#B8C7D9] text-xs leading-relaxed max-w-sm">
              Adyapan Loan is a next-generation lending technology platform. We believe money is not just numbers on a screen — it is the momentum that turns human ambitions into reality.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#4EA8FF] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#4EA8FF] animate-pulse" />
              <span>100% RBI Compliant Digital Lending Architecture</span>
            </div>
          </div>

          {/* Col 2: Solutions */}
          <div data-footer-col>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-4">
              Financing Solutions
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <a href="#selector" className="hover:text-white transition-colors">
                  Personal & 0% Split
                </a>
              </li>
              <li>
                <a href="#selector" className="hover:text-white transition-colors">
                  Merchant & SME Credit Line
                </a>
              </li>
              <li>
                <a href="#selector" className="hover:text-white transition-colors">
                  Education & AI Upskilling
                </a>
              </li>
              <li>
                <a href="#selector" className="hover:text-white transition-colors">
                  24/7 Medical Emergency Buffer
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Platform & LMS */}
          <div data-footer-col>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-4">
              LMS Suite
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Borrower Dashboard
                </Link>
              </li>
              <li>
                <Link href="/applications" className="hover:text-white transition-colors">
                  Loan Applications
                </Link>
              </li>
              <li>
                <Link href="/loans" className="hover:text-white transition-colors">
                  Active Facilities
                </Link>
              </li>
              <li>
                <Link href="/loan-products" className="hover:text-white transition-colors">
                  Credit Catalog
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors font-bold text-[#4EA8FF]">
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
        <div data-reg-box className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-[11px] text-[#B8C7D9] leading-relaxed mb-8 space-y-2">
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
