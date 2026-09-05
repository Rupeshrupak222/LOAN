'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Bookmark,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import { ResourceEmergence3D } from '../motion/ResourceEmergence3D';

interface FeaturedInsight3DProps {
  onOpenArticle: (articleId: string) => void;
}

export const FeaturedInsight3D: React.FC<FeaturedInsight3DProps> = ({ onOpenArticle }) => {
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section id="featured-insight" className="relative py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80 overflow-hidden">
      {/* Subtle Blueprint Grid Accent */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(#155EEF 1.5px, transparent 1.5px), linear-gradient(to right, #0F172A 1px, transparent 1px)',
          backgroundSize: '40px 40px, 120px 120px',
        }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <ResourceEmergence3D initialZ={-950} rotateX={14} duration={1.1}>
          
          {/* Editorial Eyebrow Tag */}
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#155EEF] text-white shadow-xs">
                FEATURED INSIGHT
              </span>
              <span className="text-xs font-mono text-slate-500 font-medium">
                SEPTEMBER 2026 // RESEARCH DOSSIER
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#155EEF]" />
                <span>5 MIN READ</span>
              </span>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-[#155EEF] transition-colors"
                title="Copy link to dossier"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'COPIED!' : 'SHARE'}</span>
              </button>
            </div>
          </div>

          {/* Editorial Layout: Left Narrative, Right Animated Technical Sketch */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left">
            
            {/* Left Column: Narrative Details */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF]">
                <span>CATEGORY:</span>
                <span className="underline decoration-blue-300 underline-offset-4">DIGITAL LENDING</span>
                <span>//</span>
                <span>UNDERWRITING RAILS</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight leading-[1.08] font-sans">
                THE NEXT GENERATION OF DIGITAL LENDING
              </h2>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Traditional Bureau scores are static mirrors of the past. Why real-time GST and banking cashflow streams are reshaping underwriting from delayed manual underwriting to autonomous, sub-30-second decisioning pipelines.
              </p>

              {/* Key Takeaway Callout Box */}
              <div className="p-5 rounded-2xl bg-white border border-blue-100 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>KEY ARCHITECTURAL TAKEAWAY</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  Continuous cashflow telemetry reduces borrower delinquency by 38% while approving 24% more creditworthy MSMEs overlooked by legacy credit scoring methods.
                </p>
              </div>

              {/* Author and Read Action Button */}
              <div className="pt-2 flex flex-wrap items-center gap-6">
                <button
                  onClick={() => onOpenArticle('digital-lending-generation')}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-[#155EEF] hover:bg-[#004EEB] transition-all shadow-md shadow-blue-500/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <span>READ INSIGHT</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-xs font-mono text-slate-500">
                  <div className="font-bold text-[#071A33]">Adyapan Systems Architecture Group</div>
                  <div>Lead Credit Infrastructure Team</div>
                </div>
              </div>

            </div>

            {/* Right Column: Self-Drawing Technical Sketch SVG */}
            <div className="lg:col-span-5 relative">
              <div className="relative p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-[10px] font-mono text-slate-400">
                  <span>FIG 2.0 // CREDIT TELEMETRY PIPELINE</span>
                  <span className="text-[#155EEF] font-bold">FLOW_VERIFIED</span>
                </div>

                {/* Animated Technical SVG Linework */}
                <div className="my-4 flex items-center justify-center">
                  <svg
                    ref={svgRef}
                    viewBox="0 0 420 280"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto"
                  >
                    {/* Background Blueprint Grid Lines */}
                    <path d="M 20 60 H 400 M 20 140 H 400 M 20 220 H 400" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
                    <path d="M 70 20 V 260 M 175 20 V 260 M 280 20 V 260 M 360 20 V 260" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Step 1: Customer Node */}
                    <g transform="translate(45, 100)">
                      <rect x="0" y="0" width="60" height="70" rx="8" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.5" />
                      <circle cx="30" cy="24" r="10" stroke="#0F172A" strokeWidth="1.5" fill="none" />
                      <path d="M 18 52 C 18 42 42 42 42 52" stroke="#0F172A" strokeWidth="1.5" fill="none" />
                      <text x="30" y="64" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#64748B" fontWeight="bold">BORROWER</text>
                    </g>

                    {/* Vector Arrow 1 */}
                    <path d="M 108 135 C 130 135, 130 135, 142 135" stroke="#155EEF" strokeWidth="2" strokeDasharray="3 3" />
                    <polygon points="144,135 138,131 138,139" fill="#155EEF" />

                    {/* Step 2: Financial System Hub */}
                    <g transform="translate(148, 85)">
                      <rect x="0" y="0" width="80" height="100" rx="10" fill="#EFF6FF" stroke="#155EEF" strokeWidth="1.75" />
                      <rect x="10" y="15" width="60" height="12" rx="3" fill="#DBEAFE" stroke="#155EEF" strokeWidth="1" />
                      <rect x="10" y="34" width="60" height="12" rx="3" fill="#DBEAFE" stroke="#155EEF" strokeWidth="1" />
                      <rect x="10" y="53" width="60" height="12" rx="3" fill="#DBEAFE" stroke="#155EEF" strokeWidth="1" />
                      <text x="40" y="82" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#155EEF" fontWeight="bold">TELEMETRY</text>
                      <text x="40" y="92" textAnchor="middle" fontSize="6.5" fontFamily="monospace" fill="#64748B">AA + GST</text>
                    </g>

                    {/* Vector Arrow 2 */}
                    <path d="M 230 135 C 245 135, 245 135, 256 135" stroke="#155EEF" strokeWidth="2" />
                    <polygon points="258,135 252,131 252,139" fill="#155EEF" />

                    {/* Step 3: Decision Engine Target */}
                    <g transform="translate(262, 95)">
                      <circle cx="36" cy="40" r="32" fill="#F0FDF4" stroke="#16A34A" strokeWidth="1.75" strokeDasharray="5 3" />
                      <circle cx="36" cy="40" r="22" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.25" />
                      <path d="M 28 40 L 34 46 L 46 32" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <text x="36" y="84" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="#16A34A" fontWeight="bold">DECISION</text>
                    </g>

                    {/* Vector Arrow 3 */}
                    <path d="M 336 135 C 348 135, 348 135, 356 135" stroke="#155EEF" strokeWidth="2" strokeDasharray="3 3" />
                    <polygon points="358,135 352,131 352,139" fill="#155EEF" />

                    {/* Step 4: Digital Experience */}
                    <g transform="translate(360, 95)">
                      <rect x="0" y="0" width="48" height="80" rx="8" fill="#071A33" stroke="#0F172A" strokeWidth="1.5" />
                      <rect x="6" y="10" width="36" height="52" rx="4" fill="#155EEF" />
                      <circle cx="24" cy="71" r="3" fill="#64748B" />
                      <path d="M 14 36 L 20 42 L 34 28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                </div>

                {/* Micro Technical Legend */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-[10px] font-mono text-center">
                  <div className="p-1.5 rounded bg-slate-50 text-slate-600">INPUT: REAL-TIME</div>
                  <div className="p-1.5 rounded bg-blue-50 text-[#155EEF] font-bold">LATENCY: &lt; 30S</div>
                  <div className="p-1.5 rounded bg-emerald-50 text-emerald-700 font-bold">BIAS: ZERO</div>
                </div>

              </div>
            </div>

          </div>

        </ResourceEmergence3D>
      </div>
    </section>
  );
};
