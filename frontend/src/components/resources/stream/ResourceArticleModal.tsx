'use client';

import React, { useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  Bookmark,
  Share2,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { ResourceItem } from '../data/resourcesData';

interface ResourceArticleModalProps {
  article: ResourceItem | null;
  onClose: () => void;
}

export const ResourceArticleModal: React.FC<ResourceArticleModalProps> = ({
  article,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (article) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [article, onClose]);

  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-10 text-left font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
          aria-label="Close article modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Category & Read Time Eyebrow */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 pb-4 border-b border-slate-100">
          <span className="px-3 py-1 rounded-full font-bold bg-blue-50 text-[#155EEF] border border-blue-200">
            {article.category}
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            {article.type}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {article.readTime}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            {article.date}
          </span>
        </div>

        {/* Article Headline */}
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#071A33] tracking-tight leading-snug mt-6 mb-4">
          {article.title}
        </h2>

        {/* Author Details */}
        <div className="flex items-center gap-3 py-4 mb-6 border-y border-slate-100">
          <div className="w-10 h-10 rounded-full bg-[#155EEF]/10 flex items-center justify-center font-mono font-bold text-[#155EEF] text-sm">
            AD
          </div>
          <div>
            <div className="text-sm font-bold text-[#071A33]">{article.author.name}</div>
            <div className="text-xs text-slate-500 font-mono">{article.author.role}</div>
          </div>
        </div>

        {/* Key Architectural Takeaway */}
        <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 mb-6 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#155EEF]">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>EXECUTIVE SUMMARY // CORE INVARIANT</span>
          </div>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            {article.keyTakeaway}
          </p>
        </div>

        {/* Article Body */}
        <div className="space-y-4 text-slate-700 leading-relaxed text-sm sm:text-base font-normal">
          {article.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Architectural Note */}
        {article.architecturalNote && (
          <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
            <div className="font-bold text-slate-800">TECHNICAL OBSERVATION:</div>
            <div>{article.architecturalNote}</div>
          </div>
        )}

        {/* Tags */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">TAGS:</span>
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 text-slate-700"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Bottom CTA to Action */}
        <div className="mt-8 p-5 rounded-2xl bg-[#071A33] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold">Interested in implementing these rails?</div>
            <div className="text-xs text-slate-400">Explore Adyapan production engines and sandbox API.</div>
          </div>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#155EEF] hover:bg-[#004EEB] text-white transition-colors cursor-pointer"
          >
            <span>Talk to Engineers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
};
