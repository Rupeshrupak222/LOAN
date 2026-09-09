'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

interface FaqItem {
  q: string;
  a: string;
  depthZ: number;
  rotX: number;
  stagger: number;
}

const FAQS: FaqItem[] = [
  {
    q: 'What is the typical implementation timeline for a commercial lender or NBFC?',
    a: 'For standard lending journeys utilizing pre-configured underwriting rules and DigiLocker e-KYC, sandbox provisioning is completed in under 24 hours, and production pilot disbursals are routinely achieved within 14 business days.',
    depthZ: -800,
    rotX: 18,
    stagger: 0.1,
  },
  {
    q: 'Can Adyapan LMS run inside our private AWS/Azure VPC or on-premises data centers?',
    a: 'Yes. We support three deployment models: Multi-Tenant Dedicated Cloud (ISO 27001 certified), Customer Virtual Private Cloud (AWS, Azure, GCP with Kubernetes Terraform operators), and Air-Gapped On-Premises bare metal for Tier-1 Scheduled Commercial Banks.',
    depthZ: -1000,
    rotX: 14,
    stagger: 0.25,
  },
  {
    q: 'How does Adyapan satisfy RBI regulatory data localization and statutory compliance?',
    a: '100% of data storage, cryptographic keys (FIPS 140-2 Level 3 HSM), transaction ledgers, and KYC records reside strictly within sovereign Indian data centers (MeitY empaneled). We undergo bi-annual external CERT-In audits.',
    depthZ: -1200,
    rotX: 10,
    stagger: 0.4,
  },
  {
    q: 'What high-availability and disaster recovery SLAs are backed contractually?',
    a: 'Adyapan provides a 99.999% uptime SLA for Core Banking and Disbursal rails with active-active geographical redundancy across Mumbai and Hyderabad, backed by financial penalties for downtime exceeding 26 seconds per month.',
    depthZ: -1400,
    rotX: 8,
    stagger: 0.55,
  },
];

export const ContactFaqAccordion3D: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <ScrollStage3D
      id="contact-faq"
      perspective={1500}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1200px] mx-auto space-y-16 text-left">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
          >
            <span>STAGE 07 // TECHNICAL CLARITY</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              ARCHITECTURAL CLARITY{' '}
              <span className="text-[#155EEF] block">BEFORE ENGAGEMENT.</span>
            </h2>
          </div>

          <div
            data-depth-z="-600"
            data-rotate-y="-8"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.2"
          >
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Key technical, operational, and regulatory parameters addressed transparently for enterprise decision makers.
            </p>
          </div>
        </div>

        {/* Accordion List Unfolding from Depth */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                data-depth-z={faq.depthZ.toString()}
                data-rotate-x={faq.rotX.toString()}
                data-scale="0.8"
                data-offset-y="60"
                data-blur="8"
                data-stagger={faq.stagger.toString()}
                className="rounded-2xl bg-slate-50 border border-slate-200/90 overflow-hidden transition-all duration-300 shadow-2xs hover:border-slate-300"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full p-6 sm:p-7 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-base sm:text-lg font-bold text-[#071A33] font-sans">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#155EEF] border-[#155EEF]' : 'text-slate-400'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 sm:px-7 sm:pb-7 text-sm text-slate-600 font-sans leading-relaxed border-t border-slate-200/60 pt-4">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ScrollStage3D>
  );
};
