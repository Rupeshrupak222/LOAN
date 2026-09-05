'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { ResourceEmergence3D } from '../motion/ResourceEmergence3D';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const SystemArchitectureStory3D: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !sectionRef.current) return;
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const paths = svgRef.current.querySelectorAll('[data-draw-path]');
    const labels = svgRef.current.querySelectorAll('[data-draw-label]');

    const ctx = gsap.context(() => {
      // Set all paths with strokeDasharray and dashoffset
      paths.forEach((p) => {
        const path = p as SVGPathElement;
        const len = path.getTotalLength ? path.getTotalLength() : 300;
        gsap.set(path, {
          strokeDasharray: len,
          strokeDashoffset: len,
        });
      });

      gsap.set(labels, { opacity: 0, y: 10 });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 75%',
        once: true,
        onEnter: () => {
          const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

          // Progressively draw lines
          tl.to(paths, {
            strokeDashoffset: 0,
            duration: 1.8,
            stagger: 0.15,
          });

          // Labels reveal
          tl.to(
            labels,
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.1,
            },
            '-=1.0'
          );
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <ResourceEmergence3D initialZ={-950} rotateX={16} duration={1.2}>
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#155EEF] bg-blue-50 border border-blue-200/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SYSTEM TOPOLOGY // SECTION 06</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight font-sans">
              SEE HOW THE SYSTEM FITS TOGETHER.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-normal">
              An architectural blueprint of the six interconnected layers that transform raw consumer events into guaranteed financial settlement.
            </p>
          </div>

          {/* Master Architectural Blueprint Sketch Canvas */}
          <div className="p-6 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl overflow-hidden text-left relative">
            
            {/* Header Metadata */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-[11px] font-mono text-slate-400">
              <span>BLUEPRINT: ADYAPAN-SYSTEM-TOPOLOGY-2026 // MASTER SCHEMATIC</span>
              <span className="text-[#155EEF] font-bold">END-TO-END VERIFIED</span>
            </div>

            {/* Master SVG linework blueprint */}
            <div className="my-8 flex items-center justify-center">
              <svg
                ref={svgRef}
                viewBox="0 0 960 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto"
              >
                {/* Architectural Blueprint Grid Pattern */}
                <path d="M 40 100 H 920 M 40 200 H 920 M 40 300 H 920" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="6 6" />
                <path d="M 180 30 V 370 M 340 30 V 370 M 500 30 V 370 M 660 30 V 370 M 820 30 V 370" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="6 6" />

                {/* Primary Continuous Horizontal Backbone Line */}
                <path
                  data-draw-path
                  d="M 120 200 H 840"
                  stroke="#155EEF"
                  strokeWidth="2.5"
                />

                {/* NODE 01: CUSTOMER */}
                <g transform="translate(60, 130)">
                  <rect x="0" y="0" width="110" height="140" rx="10" fill="#F8FAFC" stroke="#071A33" strokeWidth="1.75" />
                  <circle cx="55" cy="45" r="20" fill="#EFF6FF" stroke="#155EEF" strokeWidth="1.5" />
                  <path data-draw-path d="M 40 85 C 40 68 70 68 70 85" stroke="#155EEF" strokeWidth="2" fill="none" />
                  <g data-draw-label>
                    <text x="55" y="108" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#071A33" fontWeight="bold">01. CUSTOMER</text>
                    <text x="55" y="124" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#64748B">EVENT INITIATION</text>
                  </g>
                </g>

                {/* NODE 02: DIGITAL EXPERIENCE */}
                <g transform="translate(220, 130)">
                  <rect x="0" y="0" width="110" height="140" rx="10" fill="#FFFFFF" stroke="#071A33" strokeWidth="1.75" />
                  <rect x="15" y="20" width="80" height="60" rx="6" fill="#071A33" />
                  <rect x="25" y="30" width="60" height="40" rx="3" fill="#155EEF" />
                  <g data-draw-label>
                    <text x="55" y="108" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#071A33" fontWeight="bold">02. CLIENT SDK</text>
                    <text x="55" y="124" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#64748B">EDGE WORKSPACE</text>
                  </g>
                </g>

                {/* NODE 03: FINANCIAL INFRASTRUCTURE */}
                <g transform="translate(380, 130)">
                  <rect x="0" y="0" width="110" height="140" rx="10" fill="#EFF6FF" stroke="#155EEF" strokeWidth="2" />
                  <rect x="18" y="25" width="74" height="14" rx="3" fill="#DBEAFE" stroke="#155EEF" strokeWidth="1" />
                  <rect x="18" y="45" width="74" height="14" rx="3" fill="#DBEAFE" stroke="#155EEF" strokeWidth="1" />
                  <rect x="18" y="65" width="74" height="14" rx="3" fill="#DBEAFE" stroke="#155EEF" strokeWidth="1" />
                  <g data-draw-label>
                    <text x="55" y="108" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#155EEF" fontWeight="bold">03. CORE ENGINE</text>
                    <text x="55" y="124" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#64748B">STATE INVARIANTS</text>
                  </g>
                </g>

                {/* NODE 04: RISK & TELEMETRY */}
                <g transform="translate(540, 130)">
                  <rect x="0" y="0" width="110" height="140" rx="10" fill="#FFFFFF" stroke="#071A33" strokeWidth="1.75" />
                  <polygon points="55,20 85,45 85,75 55,88 25,75 25,45" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
                  <text x="55" y="58" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#B45309" fontWeight="bold">SHAP</text>
                  <g data-draw-label>
                    <text x="55" y="108" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#071A33" fontWeight="bold">04. 4-PILLAR RISK</text>
                    <text x="55" y="124" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#64748B">CASHFLOW AUDIT</text>
                  </g>
                </g>

                {/* NODE 05: DECISION */}
                <g transform="translate(700, 130)">
                  <rect x="0" y="0" width="110" height="140" rx="10" fill="#F0FDF4" stroke="#16A34A" strokeWidth="1.75" />
                  <circle cx="55" cy="52" r="28" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5" strokeDasharray="4 2" />
                  <path data-draw-path d="M 44 52 L 51 59 L 66 44" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <g data-draw-label>
                    <text x="55" y="108" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#16A34A" fontWeight="bold">05. DECISION</text>
                    <text x="55" y="124" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#64748B">&lt; 30S SANCTION</text>
                  </g>
                </g>

                {/* NODE 06: PAYMENT & SETTLEMENT */}
                <g transform="translate(860, 130)">
                  <rect x="0" y="0" width="90" height="140" rx="10" fill="#071A33" stroke="#071A33" strokeWidth="1.75" />
                  <rect x="15" y="30" width="60" height="42" rx="6" fill="#155EEF" />
                  <text x="45" y="55" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#FFFFFF" fontWeight="bold">SETTLED</text>
                  <g data-draw-label>
                    <text x="45" y="108" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#FFFFFF" fontWeight="bold">06. SETTLE</text>
                    <text x="45" y="124" textAnchor="middle" fontSize="7.5" fontFamily="monospace" fill="#94A3B8">ZERO-DRIFT</text>
                  </g>
                </g>

                {/* Feedback Loop Arc */}
                <path
                  data-draw-path
                  d="M 860 290 C 800 350, 200 350, 120 290"
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                  strokeDasharray="5 5"
                  fill="none"
                />
                <g data-draw-label>
                  <text x="490" y="345" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#64748B" fontWeight="bold">
                    RECONCILIATION &amp; CONTINUOUS INVARIANT FEEDBACK LOOP
                  </text>
                </g>
              </svg>
            </div>

            {/* Bottom System Annotations */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-xs font-mono text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#155EEF]" />
                <span>Deterministic Invariants Across All Layers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Sub-Second Response Pipeline End-to-End</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#071A33]" />
                <span>Zero Visual or Ledger Discrepancy</span>
              </div>
            </div>

          </div>

        </ResourceEmergence3D>
      </div>
    </section>
  );
};
