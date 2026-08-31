'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Zap,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import { GoalType } from '../motion/MotionGoalSelector';

interface Props {
  selectedGoal: GoalType;
}

export const FintechLaunchpad: React.FC<Props> = ({ selectedGoal }) => {
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const linkRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/applications?purpose=${selectedGoal}&amount=250000`);
  };

  useEffect(() => {
    if (!sectionRef.current) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      // Header: line-by-line mask reveal
      if (headerRef.current) {
        const lines = headerRef.current.querySelectorAll('[data-reveal-line]');
        gsap.set(lines, {
          opacity: 0, y: 50,
          clipPath: 'inset(100% 0 0 0)',
        });

        ScrollTrigger.create({
          trigger: headerRef.current,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.to(lines, {
              opacity: 1, y: 0,
              clipPath: 'inset(0% 0 0 0)',
              duration: 0.85, stagger: 0.15, ease: 'power3.out',
            });
          },
        });
      }

      // Form box: emerges from depth with rotateX
      if (formRef.current) {
        gsap.set(formRef.current, {
          opacity: 0, scale: 0.92, y: 40,
          rotateX: 6,
          transformPerspective: 1200,
          transformOrigin: 'bottom center',
        });

        ScrollTrigger.create({
          trigger: formRef.current,
          start: 'top 85%',
          once: true,
          onEnter: () => {
            gsap.to(formRef.current, {
              opacity: 1, scale: 1, y: 0, rotateX: 0,
              duration: 0.9, ease: 'power3.out',
            });

            // Stagger trust badges
            const badges = formRef.current?.querySelectorAll('[data-trust-badge]');
            if (badges) {
              gsap.fromTo(badges,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out', delay: 0.4 }
              );
            }
          },
        });
      }

      // Link
      if (linkRef.current) {
        gsap.set(linkRef.current, { opacity: 0, y: 14 });
        ScrollTrigger.create({
          trigger: linkRef.current,
          start: 'top 92%',
          once: true,
          onEnter: () => {
            gsap.to(linkRef.current, {
              opacity: 1, y: 0,
              duration: 0.6, ease: 'power3.out',
            });
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="launchpad"
      ref={sectionRef}
      className="relative py-32 bg-[#071A33] text-white overflow-hidden"
    >
      {/* Subtle ambient gradient drift */}
      <div
        className="absolute inset-0 pointer-events-none animate-ambient-drift"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(21,94,239,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(78,168,255,0.08) 0%, transparent 50%)',
          backgroundSize: '200% 200%',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Header with line-by-line mask reveal */}
        <div ref={headerRef}>
          <div data-reveal-line className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono uppercase tracking-widest text-[#4EA8FF] mb-6 backdrop-blur-md font-bold">
            <span className="w-2 h-2 rounded-full bg-[#4EA8FF] animate-pulse" />
            <span>YOUR NEXT MOVE STARTS NOW</span>
          </div>

          <h2 data-reveal-line className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Ready to make your next move?{' '}
            <span className="block text-[#4EA8FF]">
              Check pre-approved limits in 60 seconds.
            </span>
          </h2>

          <p data-reveal-line className="text-base sm:text-xl text-[#B8C7D9] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Join over 120,000 borrowers across India. Unlock up to ₹25 Lakhs with zero paperwork, zero physical branch visits, and zero fine print traps.
          </p>
        </div>

        {/* Interactive Quick Launch Box */}
        <div ref={formRef} className="max-w-xl mx-auto rounded-3xl bg-white/10 border border-white/15 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 text-sm font-mono font-bold">
                  +91
                </div>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-14 pr-4 py-3.5 rounded-xl bg-white text-[#071A33] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#155EEF] text-sm font-mono font-bold"
                  required
                />
              </div>

              <MagneticButton
                type="submit"
                variant="primary"
                className="px-7 py-3.5 text-sm font-bold shadow-md whitespace-nowrap"
              >
                <span>Check Offer in 60s</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </MagneticButton>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-[#B8C7D9] font-mono font-medium flex-wrap pt-2">
              <span data-trust-badge className="flex items-center gap-1 text-white font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4EA8FF]" />
                Zero Impact on CIBIL Score
              </span>
              <span data-trust-badge className="flex items-center gap-1 text-white font-bold">
                <Lock className="w-3.5 h-3.5 text-[#4EA8FF]" />
                256-Bit SSL Encrypted
              </span>
              <span data-trust-badge className="flex items-center gap-1 text-white font-bold">
                <Zap className="w-3.5 h-3.5 text-[#F5B942]" />
                Instant 90s Disbursal
              </span>
            </div>
          </form>
        </div>

        {/* Existing LMS Portal Access Shortcut */}
        <div ref={linkRef} className="mt-8 text-xs text-[#B8C7D9] font-medium">
          Already an existing borrower or partner?{' '}
          <Link href="/login" className="text-[#4EA8FF] hover:text-white font-bold underline underline-offset-4">
            Sign into your LMS Account →
          </Link>
        </div>
      </div>
    </section>
  );
};
