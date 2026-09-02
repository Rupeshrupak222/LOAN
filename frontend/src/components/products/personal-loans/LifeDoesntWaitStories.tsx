'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  GraduationCap,
  HeartPulse,
  Plane,
  Home,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

interface Story {
  id: string;
  category: string;
  icon: React.ElementType;
  title: string;
  amount: string;
  description: string;
  tenure: string;
}

const STORIES: Story[] = [
  {
    id: 'education',
    category: 'Higher Education & Certifications',
    icon: GraduationCap,
    title: 'Executive Upskilling & Semester Tuition',
    amount: '₹1,50,000',
    description: 'Cover international tuition fees, coding bootcamps, or executive certifications without liquidating long-term investments.',
    tenure: '12 Months @ Flexible EMI',
  },
  {
    id: 'medical',
    category: 'Healthcare & Emergency',
    icon: HeartPulse,
    title: 'Hospitalization & Critical Care Support',
    amount: '₹2,00,000',
    description: 'Instant liquidity for unexpected medical procedures and health contingencies when immediate family support is paramount.',
    tenure: '18 Months @ Priority Disbursal',
  },
  {
    id: 'travel',
    category: 'Life Milestones & Travel',
    icon: Plane,
    title: 'Family Vacations & Weddings',
    amount: '₹3,00,000',
    description: 'Fund once-in-a-lifetime family celebrations, destination weddings, and overseas vacations with predictable repayments.',
    tenure: '24 Months @ Fixed Monthly Rate',
  },
  {
    id: 'home',
    category: 'Home Improvement & Living',
    icon: Home,
    title: 'Interior Renovation & Smart Furnishing',
    amount: '₹2,50,000',
    description: 'Upgrade home ergonomics, kitchen modular layouts, or energy-efficient appliances with dedicated home improvement credit.',
    tenure: '18 Months @ No Hidden Fees',
  },
  {
    id: 'career',
    category: 'Career & Tools',
    icon: Briefcase,
    title: 'Professional Hardware & Studio Workspaces',
    amount: '₹80,000',
    description: 'Equip your workstation with high-performance computing hardware, creative tools, and ergonomic essentials.',
    tenure: '6 Months @ Zero Preclosure Penalty',
  },
];

export const LifeDoesntWaitStories: React.FC = () => {
  const [selectedStory, setSelectedStory] = useState<string>('education');

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>HUMAN-CENTERED LENDING</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          When Life Doesn't Wait, Capital Moves Forward
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Personal milestones and urgent opportunities shouldn't be stalled by complex paperwork. Discover intuitive lending structured for real lives.
        </p>
      </div>

      {/* 5-Card Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1400px] mx-auto text-left">
        {STORIES.map((st) => {
          const Icon = st.icon;
          const isSelected = selectedStory === st.id;
          return (
            <div
              key={st.id}
              onClick={() => setSelectedStory(st.id)}
              className={`p-7 rounded-3xl border transition-all duration-300 cursor-pointer space-y-4 shadow-sm ${
                isSelected
                  ? 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white border-[#155EEF] shadow-xl ring-2 ring-[#155EEF]/30 scale-[1.02]'
                  : 'bg-white text-[#071A33] border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isSelected ? 'bg-white/10 text-blue-300' : 'bg-blue-50 text-[#155EEF]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    isSelected ? 'bg-white/10 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {st.amount}
                </span>
              </div>

              <div>
                <span className={`text-[10px] font-mono uppercase font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  {st.category}
                </span>
                <h3 className="text-base font-black mt-1">{st.title}</h3>
              </div>

              <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                {st.description}
              </p>

              <div className="pt-2 border-t border-slate-200/30 text-[10px] font-mono opacity-80">
                <span>Indicative: </span>
                <span className="font-bold">{st.tenure}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
