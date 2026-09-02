'use client';

import React from 'react';
import Link from 'next/link';
import { Logo } from '../Logo';
import { ShieldCheck, Heart, ArrowUpRight } from 'lucide-react';
import { DirectionId, DIRECTIONS } from './directionData';

interface Props {
  activeDirection: DirectionId;
  onSelectDirection: (id: DirectionId) => void;
}

export const DirectionFooter: React.FC<Props> = ({
  activeDirection,
  onSelectDirection,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Col 1: Brand & Manifesto */}
          <div className="lg:col-span-2 space-y-4">
            <Logo size={36} variant="light" />
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Adyapan Loan is a next-generation lending technology platform. We believe money is not just numbers on a screen — it is the momentum that turns human ambitions into reality.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>100% RBI Compliant Digital Lending Architecture</span>
            </div>
          </div>

          {/* Col 2: Pathways */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-4">
              5 Directions
            </h4>
            <ul className="space-y-2.5">
              {(Object.keys(DIRECTIONS) as DirectionId[]).map((key) => (
                <li key={key}>
                  <button
                    onClick={() => {
                      onSelectDirection(key);
                      const el = document.getElementById('branches');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-white transition-colors text-left font-medium"
                  >
                    {DIRECTIONS[key].label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Platform & LMS */}
          <div>
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
                <Link href="/login" className="hover:text-white transition-colors font-bold text-indigo-400">
                  Officer Sign In →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Regulatory & Legal */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-4">
              Transparency
            </h4>
            <ul className="space-y-2.5 font-medium">
              <li>
                <span className="text-slate-300">RBI Master Directions</span>
              </li>
              <li>
                <span className="text-slate-300">Grievance Redressal Policy</span>
              </li>
              <li>
                <span className="text-slate-300">Key Fact Statement (KFS)</span>
              </li>
              <li>
                <span className="text-slate-300">ISO 27001 Security Audit</span>
              </li>
              <li>
                <span className="text-slate-300">Privacy & Terms of Service</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Regulatory RBI NBFC Mandated Disclosures Box */}
        <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed mb-8 space-y-2">
          <p>
            <strong className="text-slate-200">Regulatory Disclaimer:</strong> Adyapan LMS acts as a digital lending facilitation platform (LSP) providing loan origination, technology infrastructure, and loan management services in partnership with RBI-registered Non-Banking Financial Companies (NBFCs).
          </p>
          <p>
            All loan decisions, disbursements, interest rate pricing, and underwriting are strictly executed by our RBI-licensed NBFC partners (including Meridian NBFC Ltd., Northbank Capital Pvt. Ltd., and Finroot Credit Ltd.). We never levy unauthorized charges or demand advance processing fees in cash.
          </p>
        </div>

        {/* Bottom copyright line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800 text-slate-500 text-xs font-medium">
          <div>
            © {new Date().getFullYear()} Adyapan Technologies Pvt. Ltd. All rights reserved.
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Crafted for Ambitious Minds Across India.
          </div>
        </div>
      </div>
    </footer>
  );
};
