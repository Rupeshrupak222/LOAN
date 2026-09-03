'use client';

import React, { useState } from 'react';
import {
  Home,
  Maximize2,
  Sparkles,
  Sun,
  Coffee,
  Briefcase,
  Layers,
  CheckCircle2,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   SpatialRoomModules — "START WITH THE HOME"
   ─────────────────────────────────────────────────────────────
   ▸ Spatial architectural room modules:
     - Great Living Room
     - Master Suite
     - Chef's Kitchen & Dining
     - Focus Studio / Workspace
     - Sunlit Deck & Balcony
   ▸ Interactive spatial elevation on selection.
   ▸ Zero ghosting / clean section isolation.
   ══════════════════════════════════════════════════════════════ */

interface RoomModule {
  id: string;
  tag: string;
  name: string;
  dimensions: string;
  area: string;
  finishing: string;
  lighting: string;
  mortgageShare: string;
  icon: React.ElementType;
  description: string;
}

const ROOM_SLICES: RoomModule[] = [
  {
    id: 'living',
    tag: 'ZONE 01',
    name: 'Great Living Room & Hearth',
    dimensions: '22′ × 16′ (352 sq ft)',
    area: '352 sq ft',
    finishing: 'Double-height glazing · Hardwood acoustic flooring',
    lighting: 'South-facing floor-to-ceiling daylight',
    mortgageShare: '28% of Property Valuation',
    icon: Home,
    description: 'The social anchor of the home, sized for family gatherings, open-concept circulation, and natural ventilation.',
  },
  {
    id: 'master',
    tag: 'ZONE 02',
    name: 'Master Suite & Private Bath',
    dimensions: '18′ × 14′ (252 sq ft)',
    area: '252 sq ft',
    finishing: 'Sound-insulated walls · Walk-in dressing closet',
    lighting: 'Gentle sunrise morning aperture',
    mortgageShare: '24% of Property Valuation',
    icon: Layers,
    description: 'A dedicated sanctuary designed with acoustic privacy, dual vanities, and built-in climate zones.',
  },
  {
    id: 'kitchen',
    tag: 'ZONE 03',
    name: 'Chef’s Kitchen & Island',
    dimensions: '14′ × 12′ (168 sq ft)',
    area: '168 sq ft',
    finishing: 'Quartz composite counters · Modular pantry',
    lighting: 'Overhead task lighting + under-cabinet LED',
    mortgageShare: '18% of Property Valuation',
    icon: Coffee,
    description: 'Ergonomic culinary layout engineered with continuous prep surfaces, high-capacity ventilation, and dining connectivity.',
  },
  {
    id: 'studio',
    tag: 'ZONE 04',
    name: 'Architectural Focus Studio',
    dimensions: '12′ × 10′ (120 sq ft)',
    area: '120 sq ft',
    finishing: 'High-speed fiber conduit · Acoustic ceiling baffles',
    lighting: 'Diffused northern natural light',
    mortgageShare: '14% of Property Valuation',
    icon: Briefcase,
    description: 'Dedicated professional workspace built for deep concentration, video conferences, and creative projects.',
  },
  {
    id: 'balcony',
    tag: 'ZONE 05',
    name: 'Sunlit Deck & Balcony',
    dimensions: '16′ × 6′ (96 sq ft)',
    area: '96 sq ft',
    finishing: 'Anti-skid porcelain pavers · Tempered glass railing',
    lighting: 'Golden hour panoramic exposure',
    mortgageShare: '16% of Property Valuation',
    icon: Sun,
  description: 'Outdoor extension of the living space offering panoramic skyline views, garden planters, and fresh airflow.',
  },
];

export const SpatialRoomModules: React.FC = () => {
  const [activeModuleId, setActiveModuleId] = useState<string>('living');
  const current = ROOM_SLICES.find((r) => r.id === activeModuleId) || ROOM_SLICES[0];
  const Icon = current.icon;

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Maximize2 className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>SPATIAL ARCHITECTURAL SLICES</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Every Home Starts with a Decision
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Explore the architectural zones of a contemporary home. Each room is designed for living today and long-term equity growth tomorrow.
        </p>
      </div>

      {/* 5 Spatial Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8 max-w-[1400px] mx-auto text-left">
        {ROOM_SLICES.map((rm) => {
          const isSelected = activeModuleId === rm.id;
          const RmIcon = rm.icon;

          return (
            <button
              key={rm.id}
              onClick={() => setActiveModuleId(rm.id)}
              className={`p-4 rounded-2xl border transition-all text-left cursor-pointer ${
                isSelected
                  ? 'bg-[#155EEF] text-white border-[#155EEF] shadow-lg shadow-[#155EEF]/20 scale-105'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[9px] font-mono font-bold uppercase ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  {rm.tag}
                </span>
                <RmIcon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <h4 className="text-xs font-bold leading-tight truncate">{rm.name}</h4>
              <span className={`text-[10px] font-mono mt-1 block ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                {rm.area}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Selected Room Module Arena */}
      <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-12 max-w-[1400px] mx-auto text-left shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#155EEF] flex items-center justify-center font-bold shadow-xs">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase">{current.tag} · ARCHITECTURAL PROFILE</span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#071A33]">{current.name}</h3>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400 self-start sm:self-auto">
            DIMENSION SPEC: {current.dimensions}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Description & Specifications */}
          <div className="lg:col-span-7 space-y-4">
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{current.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Finishes & Materials</span>
                <p className="text-xs text-slate-800 font-semibold">{current.finishing}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Natural Daylight Exposure</span>
                <p className="text-xs text-slate-800 font-semibold">{current.lighting}</p>
              </div>
            </div>
          </div>

          {/* Right Column: Mortgage Correlation Matrix */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-[#071A33] text-white flex flex-col justify-between space-y-4 font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">Mortgage Valuation Weight</span>
              <span className="font-bold text-emerald-400">{current.mortgageShare}</span>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400">RERA Carpet Compliance</span>
              <span className="font-bold text-blue-300">100% Certified Usable</span>
            </div>

            <div className="flex items-center gap-2 text-slate-300 text-[11px] pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Valuation backed by automated technical appraisal engines.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
