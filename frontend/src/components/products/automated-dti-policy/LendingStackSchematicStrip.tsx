'use client';

import React, { useState } from 'react';
import { ArrowRight, Cpu, CheckCircle2 } from 'lucide-react';

export const LendingStackSchematicStrip: React.FC = () => {
  const [selectedBlock, setSelectedBlock] = useState(2);

  const BLOCKS = [
    { num: '01', title: 'APPLICATION', category: 'ORIGINATION INGESTION', desc: 'Direct intake from mobile loan journey, partner API, or branch portal.' },
    { num: '02', title: 'DATA FABRIC', category: 'NORMALIZATION', desc: 'Multi-bureau trade lines and verified payroll cashflows unified to ISO baseline.' },
    { num: '03', title: 'POLICY CORE', category: 'DECISION ENGINE', desc: 'DTI bounds, debt caps, and risk rules evaluated in sub-second execution.' },
    { num: '04', title: 'DECISION', category: 'OUTCOME DISPATCH', desc: 'Atomic sanction, underwriter review packet, or counter-offer emitted.' },
    { num: '05', title: 'RECORD', category: 'IMMUTABLE AUDIT', desc: 'Cryptographically hashed snapshot permanently stored in compliance ledger.' },
  ];

  return (
    <section
      id="section-schematic-strip"
      className="relative py-28 sm:py-36 px-4 sm:px-8 lg:px-12 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      <div className="max-w-[1400px] mx-auto space-y-16 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto text-left sm:text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-mono font-bold uppercase tracking-widest">
            <Cpu className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>ARCHITECTURAL SCHEMATIC CIRCUIT</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tighter uppercase"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            POLICY AS A LAYER <br />
            <span className="text-[#155EEF]">IN THE LENDING STACK.</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            The policy engine operates as a headless, deterministic circuit board layer embedded between origination and servicing.
          </p>
        </div>

        {/* ── PRECISION HORIZONTAL SCHEMATIC CIRCUIT STRIP ── */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative text-left">
          {BLOCKS.map((b, idx) => {
            const isSelected = selectedBlock === idx;

            return (
              <div
                key={b.num}
                onClick={() => setSelectedBlock(idx)}
                className={`p-6 border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[220px] relative ${
                  isSelected
                    ? 'bg-[#071A33] text-white border-[#071A33] shadow-xl -translate-y-2'
                    : 'bg-[#F8FAFC] text-[#071A33] border-slate-300 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-300/60">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      BLOCK / {b.num}
                    </span>
                    <span className={`text-[9px] font-mono font-bold uppercase ${isSelected ? 'text-cyan-400' : 'text-[#155EEF]'}`}>
                      {b.category}
                    </span>
                  </div>

                  <div className="pt-3">
                    <h3
                      className="text-xl font-black uppercase tracking-tight"
                      style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
                    >
                      {b.title}
                    </h3>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-300/60">
                  <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                    {b.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
