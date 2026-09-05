'use client';

import React, { useState } from 'react';
import {
  Building2,
  Coins,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { RESOURCE_TOPICS, TopicCategory, ResourceCategory } from '../data/resourcesData';
import { ResourceEmergence3D } from '../motion/ResourceEmergence3D';

interface TopicExplorer3DProps {
  activeCategory: ResourceCategory;
  onSelectCategory: (category: ResourceCategory) => void;
}

export const TopicExplorer3D: React.FC<TopicExplorer3DProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  const [hoveredTopic, setHoveredTopic] = useState<string | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'building':
        return Building2;
      case 'coins':
        return Coins;
      case 'zap':
        return Zap;
      case 'shield-check':
        return ShieldCheck;
      case 'cpu':
        return Cpu;
      case 'layers':
      default:
        return Layers;
    }
  };

  return (
    <section className="relative py-20 sm:py-28 bg-white border-b border-slate-200/80 overflow-hidden">
      {/* Blueprint Grid Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #0F172A 1px, transparent 1px), linear-gradient(to bottom, #0F172A 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        <ResourceEmergence3D initialZ={-1000} rotateX={18} duration={1.2}>
          
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-[#155EEF] bg-blue-50 border border-blue-200/80">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TOPIC EXPLORATION // SECTION 01</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight font-sans">
              START WITH WHAT YOU&apos;RE BUILDING.
            </h2>

            <p className="text-base sm:text-lg text-slate-600 font-normal">
              Select a core fintech domain to explore architectural blueprints, production guides, and research insights.
            </p>
          </div>

          {/* Interactive Spatial Topic Grid */}
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            style={{ perspective: '1600px', transformStyle: 'preserve-3d' }}
          >
            {RESOURCE_TOPICS.map((topic) => {
              const Icon = getIcon(topic.blueprintIcon);
              const isHovered = hoveredTopic === topic.id;
              const isSelected = activeCategory === topic.category;
              const isDimmed = hoveredTopic !== null && !isHovered;

              return (
                <div
                  key={topic.id}
                  data-topic-card
                  onMouseEnter={() => setHoveredTopic(topic.id)}
                  onMouseLeave={() => setHoveredTopic(null)}
                  onClick={() => {
                    onSelectCategory(topic.category);
                    const el = document.getElementById('resource-stream');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`group relative p-7 rounded-2xl border transition-all duration-300 cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50/70 border-[#155EEF] shadow-xl shadow-blue-500/10'
                      : 'bg-white border-slate-200 hover:border-[#155EEF]/50 shadow-xs hover:shadow-xl'
                  }`}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isHovered
                      ? 'translateZ(45px) scale(1.02)'
                      : isDimmed
                      ? 'translateZ(-25px) scale(0.97)'
                      : 'translateZ(0px)',
                    opacity: isDimmed ? 0.6 : 1,
                  }}
                >
                  {/* Top Bar: Technical Label and Metric */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-[11px] font-mono">
                    <span className="text-slate-400 font-medium group-hover:text-[#155EEF] transition-colors">
                      {topic.technicalLabel}
                    </span>
                    <span className="font-bold text-[#155EEF] bg-blue-50/80 px-2 py-0.5 rounded">
                      {topic.articleCount} PAPERS
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3.5 my-5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isSelected || isHovered
                          ? 'bg-[#155EEF] text-white shadow-md shadow-blue-500/25'
                          : 'bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-[#155EEF]'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-[#071A33] tracking-tight group-hover:text-[#155EEF] transition-colors">
                        {topic.title}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">
                        {topic.highlightMetric}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[40px]">
                    {topic.description}
                  </p>

                  {/* Bottom Hover Action Indicator */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#155EEF] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1.5">
                      <span>Explore {topic.title}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>

                    <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-[#155EEF] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>

        </ResourceEmergence3D>
      </div>
    </section>
  );
};
