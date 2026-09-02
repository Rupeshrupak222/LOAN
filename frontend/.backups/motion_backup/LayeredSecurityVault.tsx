'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ShieldCheck,
  Lock,
  Database,
  Layers,
  Cpu,
  KeyRound,
  CheckCircle2,
  Zap,
  Globe,
  FileCheck,
  Sparkles,
} from 'lucide-react';

const SECURITY_LAYERS = [
  {
    id: 'identity',
    title: 'Identity Shield',
    tag: 'DigiLocker & Aadhaar e-KYC',
    desc: 'Biometric & OTP zero-knowledge verification. Verified instantly via direct Government of India integration.',
    icon: KeyRound,
    telemetry: 'SHA-256 Hash Verified',
  },
  {
    id: 'documents',
    title: 'Financial Document Vault',
    tag: 'Account Aggregator Protocol',
    desc: 'Consent-driven bank statement sync without sharing banking passwords. Data is read-only and encrypted at rest.',
    icon: Database,
    telemetry: '256-Bit AES Encryption',
  },
  {
    id: 'payments',
    title: 'Direct Payment Rails',
    tag: 'NPCI UPI & e-NACH Network',
    desc: 'Direct account transfers with automated 24/7 bank settlement. Zero third-party escrow leakage.',
    icon: Zap,
    telemetry: 'PCI-DSS Level-1 Certified',
  },
  {
    id: 'privacy',
    title: 'Borrower Privacy Guard',
    tag: 'ISO 27001 & SOC 2 Aligned',
    desc: 'We never sell your phone number to telemarketers or credit card spammers. Zero harassing recovery bots.',
    icon: ShieldCheck,
    telemetry: 'Strict Zero-Spam Policy',
  },
];

export const LayeredSecurityVault: React.FC = () => {
  const [activeLayer, setActiveLayer] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);
  const vaultRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Header fade up
      if (headerRef.current) {
        const headerEls = headerRef.current.querySelectorAll('[data-reveal]');
        gsap.set(headerEls, { opacity: 0, y: 36 });
        ScrollTrigger.create({
          trigger: headerRef.current,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(headerEls, {
              opacity: 1, y: 0,
              duration: 0.8, stagger: 0.12, ease: 'power3.out',
            });
          },
        });
      }

      // Security layers: stack in from left with stagger
      if (layersRef.current) {
        const layers = layersRef.current.querySelectorAll('[data-security-layer]');
        gsap.set(layers, { opacity: 0, x: -40, rotateY: 8, transformOrigin: 'left center' });

        ScrollTrigger.create({
          trigger: layersRef.current,
          start: 'top 82%',
          once: true,
          onEnter: () => {
            gsap.to(layers, {
              opacity: 1, x: 0, rotateY: 0,
              duration: 0.75, stagger: 0.1, ease: 'power3.out',
            });
          },
        });
      }

      // Vault visual: enters from right with rotation reveal
      if (vaultRef.current) {
        gsap.set(vaultRef.current, { opacity: 0, x: 60, scale: 0.9 });

        ScrollTrigger.create({
          trigger: vaultRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(vaultRef.current, {
              opacity: 1, x: 0, scale: 1,
              duration: 0.9, ease: 'power3.out',
            });

            // Shield icon spin-in
            if (shieldRef.current) {
              gsap.fromTo(shieldRef.current,
                { rotation: -180, scale: 0.5, opacity: 0 },
                { rotation: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.5)', delay: 0.3 }
              );
            }
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Layer click animation
  const handleLayerClick = (idx: number) => {
    setActiveLayer(idx);

    // Pulse effect on vault core
    if (shieldRef.current) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reducedMotion) {
        gsap.fromTo(shieldRef.current,
          { scale: 1 },
          { scale: 1.1, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 }
        );
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-28 bg-[#FFFFFF] text-[#071A33] overflow-hidden border-t border-[#D3E5FA]/60"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div ref={headerRef} className="text-center max-w-3xl mx-auto mb-16">
          <div data-reveal className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EAF4FF] border border-[#D3E5FA] text-xs font-mono text-[#155EEF] uppercase tracking-widest mb-4 font-bold">
            <span>CHAPTER 05 : ZERO-TRUST ARCHITECTURE</span>
          </div>

          <h2 data-reveal className="text-3xl sm:text-5xl font-black tracking-tight text-[#071A33] mb-4">
            Your money matters.{' '}
            <span className="text-[#155EEF]">
              So does your data.
            </span>
          </h2>

          <p data-reveal className="text-[#526071] text-base sm:text-lg font-medium">
            Bank-grade encryption, RBI master compliance, and continuous audited privacy. Everything is engineered for radical security.
          </p>
        </div>

        {/* Security Layers Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: 4 Layers Stack */}
          <div ref={layersRef} className="lg:col-span-7 space-y-4">
            {SECURITY_LAYERS.map((layer, idx) => {
              const Icon = layer.icon;
              const isSelected = activeLayer === idx;

              return (
                <div
                  key={layer.id}
                  data-security-layer
                  onClick={() => handleLayerClick(idx)}
                  className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 ${
                    isSelected
                      ? 'bg-[#EAF4FF] border-[#155EEF] shadow-sm translate-x-1'
                      : 'bg-white border-[#D3E5FA] hover:border-[#155EEF]/50 hover:bg-[#EAF4FF]/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                          isSelected ? 'bg-[#155EEF] text-white rotate-6' : 'bg-[#EAF4FF] text-[#155EEF]'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-base font-bold text-[#071A33]">{layer.title}</h4>
                          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white text-[#155EEF] font-bold border border-[#D3E5FA]">
                            {layer.tag}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#526071] leading-relaxed font-normal">
                          {layer.desc}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-mono text-[#155EEF] font-bold whitespace-nowrap hidden sm:block">
                      {layer.telemetry}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Visual Central Security Engine */}
          <div className="lg:col-span-5 flex justify-center">
            <div ref={vaultRef} className="relative w-full max-w-md mx-auto aspect-square rounded-3xl p-8 bg-[#EAF4FF]/60 border border-[#D3E5FA] shadow-md flex flex-col items-center justify-between text-center overflow-hidden">
              <div className="w-full flex items-center justify-between text-xs font-mono text-[#526071] font-bold">
                <span>SECURITY PROTOCOL</span>
                <span className="text-[#155EEF]">● ACTIVE AES-256</span>
              </div>

              {/* Central Dynamic Vault Core */}
              <div className="my-auto relative flex items-center justify-center">
                {/* Pulse rings */}
                <div className="absolute w-32 h-32 rounded-full border-2 border-[#155EEF]/20 animate-vault-pulse" />
                <div className="absolute w-32 h-32 rounded-full border-2 border-[#155EEF]/10 animate-vault-pulse" style={{ animationDelay: '1s' }} />
                <div
                  ref={shieldRef}
                  className="w-28 h-28 rounded-full bg-[#155EEF] flex items-center justify-center shadow-lg shadow-[#155EEF]/25 text-white"
                >
                  <ShieldCheck className="w-14 h-14" />
                </div>
              </div>

              {/* Layer Telemetry Output */}
              <div className="w-full bg-white p-4 rounded-xl border border-[#D3E5FA] transition-all duration-300">
                <div className="text-sm font-bold text-[#071A33] mb-0.5">
                  {SECURITY_LAYERS[activeLayer].title}
                </div>
                <div className="text-xs font-mono text-[#155EEF] font-semibold">
                  {SECURITY_LAYERS[activeLayer].telemetry}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
