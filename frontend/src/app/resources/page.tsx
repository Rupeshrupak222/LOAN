'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GsapProvider } from '@/components/motion/GsapProvider';
import { MotionNavbar } from '@/components/motion/MotionNavbar';
import { FintechFooter } from '@/components/fintech/FintechFooter';

// Modular Resources 3D Components
import { ResourceDeskHero3D } from '@/components/resources/hero/ResourceDeskHero3D';
import { TopicExplorer3D } from '@/components/resources/topics/TopicExplorer3D';
import { FeaturedInsight3D } from '@/components/resources/featured/FeaturedInsight3D';
import { ResourceStreamCascade3D } from '@/components/resources/stream/ResourceStreamCascade3D';
import { KnowledgeDeepDive3D } from '@/components/resources/deep-dive/KnowledgeDeepDive3D';
import { FintechExplainer3D } from '@/components/resources/explainer/FintechExplainer3D';
import { SystemArchitectureStory3D } from '@/components/resources/system-sketch/SystemArchitectureStory3D';
import { ProductKnowledgeBridge3D } from '@/components/resources/product-bridge/ProductKnowledgeBridge3D';
import { ResourceSearchHub3D } from '@/components/resources/search/ResourceSearchHub3D';
import { FromAdyapanUpdates3D } from '@/components/resources/updates/FromAdyapanUpdates3D';
import { ResourcesClosingCTA3D } from '@/components/resources/cta/ResourcesClosingCTA3D';
import { ResourceArticleModal } from '@/components/resources/stream/ResourceArticleModal';
import { RESOURCE_ITEMS, ResourceCategory, ResourceItem } from '@/components/resources/data/resourcesData';

export default function ResourcesPage() {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory>('ALL');
  const [activeModalArticle, setActiveModalArticle] = useState<ResourceItem | null>(null);

  const handleOpenArticleById = (id: string) => {
    const found = RESOURCE_ITEMS.find((item) => item.id === id);
    if (found) {
      setActiveModalArticle(found);
    }
  };

  return (
    <GsapProvider>
      <div className="min-h-screen bg-[#FFFFFF] text-[#071A33] selection:bg-[#155EEF] selection:text-white relative overflow-x-hidden font-sans">
        {/* Global Navigation Bar */}
        <MotionNavbar />

        {/* Top Editorial Breadcrumb */}
        <div className="pt-24 sm:pt-28 pb-4 border-b border-slate-100 bg-slate-50/70">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#155EEF] transition-colors py-1.5 px-3 rounded-full hover:bg-white border border-transparent hover:border-slate-200 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>← Back to Financial Architecture</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>Adyapan</span>
              <span>/</span>
              <span className="text-slate-600 font-bold">Intelligence Hub</span>
              <span>/</span>
              <span className="text-[#155EEF] font-bold">Resources</span>
            </div>
          </div>
        </div>

        {/* Master Resources Narrative Journey */}
        <main className="w-full">
          {/* Hero: 3D Digital Resource Desk */}
          <ResourceDeskHero3D />

          {/* Section 01: Explore by Topic */}
          <TopicExplorer3D
            activeCategory={activeCategory}
            onSelectCategory={(cat) => setActiveCategory(cat)}
          />

          {/* Section 02: Featured Insight with Drawing Technical Sketch */}
          <FeaturedInsight3D
            onOpenArticle={(id) => handleOpenArticleById(id)}
          />

          {/* Section 03: The Resource Stream with 3D Cascade */}
          <ResourceStreamCascade3D
            initialCategory={activeCategory}
          />

          {/* Section 04: Go Deeper — 3 Knowledge Pillars */}
          <KnowledgeDeepDive3D />

          {/* Section 05: Fintech Explainer — "Complex Finance. Clear Explanations." */}
          <FintechExplainer3D />

          {/* Section 06: Professional Sketch Story — "See How The System Fits Together" */}
          <SystemArchitectureStory3D />

          {/* Section 07: Product Knowledge Bridge */}
          <ProductKnowledgeBridge3D />

          {/* Section 08: Interactive Search Hub */}
          <ResourceSearchHub3D
            onOpenArticle={(id) => handleOpenArticleById(id)}
          />

          {/* Section 09: News & Verified Updates from Adyapan */}
          <FromAdyapanUpdates3D />

          {/* Section 10: Resource Closing CTA & Converging Sheets */}
          <ResourcesClosingCTA3D />
        </main>

        {/* Global Article Deep-Dive Modal */}
        <ResourceArticleModal
          article={activeModalArticle}
          onClose={() => setActiveModalArticle(null)}
        />

        {/* Global Footer */}
        <FintechFooter />
      </div>
    </GsapProvider>
  );
}
