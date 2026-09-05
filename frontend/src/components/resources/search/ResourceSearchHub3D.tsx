'use client';

import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  FileQuestion,
  X,
} from 'lucide-react';
import { RESOURCE_ITEMS, ResourceItem } from '../data/resourcesData';
import { ResourceEmergence3D } from '../motion/ResourceEmergence3D';

interface ResourceSearchHub3DProps {
  onOpenArticle: (articleId: string) => void;
}

export const ResourceSearchHub3D: React.FC<ResourceSearchHub3DProps> = ({ onOpenArticle }) => {
  const [query, setQuery] = useState('');

  const trimmed = query.trim().toLowerCase();

  const matchingItems = trimmed
    ? RESOURCE_ITEMS.filter((item) => {
        const inTitle = item.title.toLowerCase().includes(trimmed);
        const inExcerpt = item.excerpt.toLowerCase().includes(trimmed);
        const inTags = item.tags.some((t) => t.toLowerCase().includes(trimmed));
        const inCategory = item.category.toLowerCase().includes(trimmed);
        return inTitle || inExcerpt || inTags || inCategory;
      })
    : [];

  const suggestedTags = ['Underwriting', 'Double-Entry', 'UPI', 'SHAP', 'e-KYC', 'Embedded Finance'];

  return (
    <section className="relative py-20 sm:py-28 bg-[#F8FAFC] border-b border-slate-200/80 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <ResourceEmergence3D initialZ={-900} rotateX={14} duration={1.1}>
          
          {/* Section Heading */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#155EEF] bg-blue-50 border border-blue-200/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>INTELLIGENCE SEARCH // SECTION 08</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight font-sans">
              LOOKING FOR SOMETHING SPECIFIC?
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-normal">
              Query our architectural repository for specialized financial engineering playbooks and compliance invariants.
            </p>
          </div>

          {/* Search Input Bar */}
          <div className="max-w-3xl mx-auto relative mb-8">
            <div className="relative flex items-center">
              <Search className="absolute left-6 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search insights, guides and explainers..."
                className="w-full pl-14 pr-12 py-5 rounded-2xl bg-white border border-slate-200 shadow-lg text-slate-800 placeholder-slate-400 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[#155EEF] focus:border-transparent transition-all font-sans"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search query"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Keyword Tag Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-mono">
              <span className="text-slate-400">COMMON TOPICS:</span>
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#155EEF] hover:border-blue-200 transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Results Display Area */}
          {trimmed && (
            <div className="max-w-3xl mx-auto space-y-4 text-left">
              {matchingItems.length > 0 ? (
                <>
                  <div className="text-xs font-mono text-slate-400 pb-2 border-b border-slate-200">
                    FOUND {matchingItems.length} MATCHING PAPERS FOR &quot;{query}&quot;
                  </div>
                  {matchingItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onOpenArticle(item.id)}
                      className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#155EEF] shadow-xs hover:shadow-lg transition-all cursor-pointer flex items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="text-[#155EEF] font-bold">{item.category}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500">{item.readTime}</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {item.excerpt}
                        </p>
                      </div>

                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#155EEF] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                  ))}
                </>
              ) : (
                /* Empty State as explicitly specified */
                <div className="p-10 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <FileQuestion className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-[#071A33] font-sans">
                    WE COULDN&apos;T FIND THAT YET.
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                    Try another topic or explore the categories above.
                  </p>
                </div>
              )}
            </div>
          )}

        </ResourceEmergence3D>
      </div>
    </section>
  );
};
