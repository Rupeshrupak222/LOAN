'use client';

import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Clock,
  Calendar,
  ArrowRight,
  Filter,
  Sparkles,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { RESOURCE_ITEMS, ResourceCategory, ResourceItem } from '../data/resourcesData';
import { ResourceArticleModal } from './ResourceArticleModal';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const CATEGORIES: ResourceCategory[] = [
  'ALL',
  'BANKING',
  'LENDING',
  'PAYMENTS',
  'RISK',
  'TECHNOLOGY',
];

interface ResourceStreamCascade3DProps {
  initialCategory?: ResourceCategory;
}

export const ResourceStreamCascade3D: React.FC<ResourceStreamCascade3DProps> = ({
  initialCategory = 'ALL',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory>(initialCategory);
  const [selectedArticle, setSelectedArticle] = useState<ResourceItem | null>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const itemsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  const filteredItems =
    selectedCategory === 'ALL'
      ? RESOURCE_ITEMS
      : RESOURCE_ITEMS.filter((item) => item.category === selectedCategory);

  // 3D Cascade Scroll Animation
  useEffect(() => {
    if (!itemsContainerRef.current) return;
    if (typeof window === 'undefined') return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const container = itemsContainerRef.current;
    const cards = container.querySelectorAll('[data-cascade-item]');

    const zDepths = [-700, -1000, -1200, -900, -800, -1100];
    const rotations = [14, -12, 16, -10, 12, -15];

    const ctx = gsap.context(() => {
      cards.forEach((card, idx) => {
        const depth = zDepths[idx % zDepths.length];
        const rotX = rotations[idx % rotations.length];

        gsap.set(card, {
          opacity: 0,
          z: depth,
          rotateX: rotX,
          scale: 0.72,
          filter: 'blur(10px)',
          transformPerspective: 1600,
        });

        ScrollTrigger.create({
          trigger: card,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            gsap.to(card, {
              opacity: 1,
              z: 0,
              rotateX: 0,
              scale: 1,
              filter: 'blur(0px)',
              duration: 1.05 + (idx % 3) * 0.15,
              ease: 'power3.out',
              delay: (idx % 2) * 0.1,
            });
          },
        });
      });
    }, itemsContainerRef);

    return () => ctx.revert();
  }, [filteredItems]);

  return (
    <section
      id="resource-stream"
      ref={streamRef}
      className="relative py-20 sm:py-28 bg-white border-b border-slate-200/80 overflow-hidden"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        
        {/* Section Heading & Category Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10 mb-12 border-b border-slate-200 text-left">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#155EEF] bg-blue-50 border border-blue-200/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE RESOURCE STREAM // SECTION 03</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight font-sans">
              EXPLORE THE THINKING.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-normal">
              An editorial stream of practical architectural papers, operational playbooks, and systems engineering analysis.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#155EEF] text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Editorial Cascading List */}
        <div
          ref={itemsContainerRef}
          className="space-y-6 text-left"
          style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
        >
          {filteredItems.map((item, index) => {
            const num = String(index + 1).padStart(2, '0');

            return (
              <div
                key={item.id}
                data-cascade-item
                onClick={() => setSelectedArticle(item)}
                className="group relative p-6 sm:p-8 rounded-3xl border border-slate-200 hover:border-[#155EEF] bg-white hover:bg-slate-50/70 transition-all duration-300 shadow-xs hover:shadow-xl cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  
                  {/* Col 1: Index Number & Line */}
                  <div className="lg:col-span-2 flex items-center gap-3">
                    <span className="text-3xl sm:text-4xl font-black text-slate-300 group-hover:text-[#155EEF] font-mono transition-colors">
                      {num}
                    </span>
                    <div className="h-[2px] w-12 bg-slate-200 group-hover:bg-[#155EEF] transition-colors" />
                  </div>

                  {/* Col 2: Content Details */}
                  <div className="lg:col-span-7 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-[#155EEF] border border-blue-200">
                        {item.category}
                      </span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-500 font-semibold">{item.type}</span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.readTime}
                      </span>
                      <span className="text-slate-400">/</span>
                      <span className="text-slate-400">{item.date}</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-[#071A33] tracking-tight group-hover:text-[#155EEF] transition-colors leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed font-normal">
                      {item.excerpt}
                    </p>
                  </div>

                  {/* Col 3: Author & Read CTA */}
                  <div className="lg:col-span-3 flex lg:flex-col items-center lg:items-end justify-between gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left lg:text-right text-xs">
                      <div className="font-bold text-[#071A33]">{item.author.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.author.role}</div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#155EEF] group-hover:translate-x-1 transition-transform">
                      <span>Read Dossier</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Deep-Dive Article Reader Modal */}
      <ResourceArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </section>
  );
};
