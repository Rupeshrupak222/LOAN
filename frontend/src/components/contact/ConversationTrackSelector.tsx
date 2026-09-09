'use client';

import React, { useState } from 'react';
import { Landmark, CreditCard, ShieldCheck, Cpu, ArrowRight, Check } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

interface Track {
  id: string;
  name: string;
  tag: string;
  icon: React.ElementType;
  description: string;
  depthZ: number;
  rotX: number;
  rotY: number;
  stagger: number;
}

const TRACKS: Track[] = [
  {
    id: 'lending',
    name: 'Lending & Disbursal Engines',
    tag: 'SANCTION // UNDERWRITING',
    icon: Cpu,
    description: 'Automated policy decisioning, 60s personal loans, SME business lines, and instant BNPL infrastructure.',
    depthZ: -900,
    rotX: 10,
    rotY: -18,
    stagger: 0.1,
  },
  {
    id: 'core-banking',
    name: 'Core Banking & Ledgers',
    tag: 'DOUBLE-ENTRY // ACID',
    icon: Landmark,
    description: 'High-concurrency accounts, real-time balance reservations, multi-entity escrows, and treasury automation.',
    depthZ: -1200,
    rotX: -8,
    rotY: 14,
    stagger: 0.3,
  },
  {
    id: 'payments',
    name: 'Cards & Payment Switching',
    tag: 'NPCI // SWIFT // EMV',
    icon: CreditCard,
    description: 'Debit/prepaid card issuance, Credit Line on UPI, cross-border settlements, and merchant QR soundboxes.',
    depthZ: -1500,
    rotX: 12,
    rotY: -10,
    stagger: 0.5,
  },
  {
    id: 'risk',
    name: 'AI Risk & DigiLocker e-KYC',
    tag: 'CONSENT // FORENSIC LOGS',
    icon: ShieldCheck,
    description: 'Digital document verification, automated DTI bureau rules, and WORM-sealed immutable audit trails.',
    depthZ: -1000,
    rotX: 8,
    rotY: 8,
    stagger: 0.7,
  },
];

interface Props {
  selectedTrack?: string;
  onSelectTrack?: (id: string) => void;
}

export const ConversationTrackSelector: React.FC<Props> = ({
  selectedTrack = 'lending',
  onSelectTrack,
}) => {
  const [activeId, setActiveId] = useState(selectedTrack);

  const handleSelect = (id: string) => {
    setActiveId(id);
    if (onSelectTrack) onSelectTrack(id);
  };

  return (
    <ScrollStage3D
      id="conversation-track"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16">
        {/* Section Header (Emerges from depth) */}
        <div className="max-w-3xl space-y-4 text-left">
          <div
            data-depth-z="-500"
            data-rotate-x="20"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="5"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-mono font-bold tracking-wider uppercase shadow-2xs"
          >
            <span>STAGE 02 // SELECTION MATRIX</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              SELECT YOUR{' '}
              <span className="text-[#155EEF] block">ARCHITECTURAL TRACK.</span>
            </h2>
          </div>

          <div
            data-depth-z="-600"
            data-rotate-y="-8"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.2"
          >
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Our engineering leadership maps inquiries to dedicated solution principals. Choose your domain to route your requirements directly into the corresponding architecture desk.
            </p>
          </div>
        </div>

        {/* ── 4 Cards Cascading in from 3D Space ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRACKS.map((t) => {
            const isSelected = activeId === t.id;
            const Icon = t.icon;

            return (
              <div
                key={t.id}
                data-depth-z={t.depthZ.toString()}
                data-rotate-x={t.rotX.toString()}
                data-rotate-y={t.rotY.toString()}
                data-scale="0.75"
                data-offset-y="70"
                data-blur="10"
                data-stagger={t.stagger.toString()}
                onClick={() => handleSelect(t.id)}
                className={`p-7 rounded-2xl transition-all duration-300 cursor-pointer text-left flex flex-col justify-between space-y-6 border ${
                  isSelected
                    ? 'bg-white border-[#155EEF] shadow-xl shadow-[#155EEF]/15 scale-[1.03]'
                    : 'bg-white/80 border-slate-200/90 hover:bg-white hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#155EEF] text-white shadow-xs' : 'bg-blue-50 text-[#155EEF]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                        isSelected
                          ? 'border-[#155EEF] bg-[#155EEF] text-white'
                          : 'border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </div>
                  </div>

                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    {t.tag}
                  </span>

                  <h3 className="text-lg font-black text-[#071A33] font-sans tracking-tight">
                    {t.name}
                  </h3>

                  <p className="text-xs text-slate-500 font-sans leading-relaxed">
                    {t.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <span className={isSelected ? 'text-[#155EEF] font-bold' : 'text-slate-400'}>
                    {isSelected ? 'TRACK SELECTED' : 'SELECT DOMAIN'}
                  </span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'text-[#155EEF]' : 'text-slate-400'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollStage3D>
  );
};
