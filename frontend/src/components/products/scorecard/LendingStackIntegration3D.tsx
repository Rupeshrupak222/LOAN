'use client';

import React from 'react';
import { Layers, ArrowRight, CheckCircle2, User, Database, Cpu, FileCheck, Landmark } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const LendingStackIntegration3D: React.FC = () => {
  const journeyStages = [
    {
      num: '01',
      title: 'APPLICATION',
      desc: 'Applicant initiates personal or SME loan request via portal or mobile SDK.',
      icon: User,
      depthZ: -750,
      rotX: 18,
    },
    {
      num: '02',
      title: 'TELEMETRY DATA',
      desc: 'Consent-driven ingestion of bureau records, GSTN returns, and banking feeds.',
      icon: Database,
      depthZ: -950,
      rotX: 14,
    },
    {
      num: '03',
      title: 'UNDERWRITING',
      desc: '4-pillar scorecard transforms multi-stream signals into a calibrated index.',
      icon: Cpu,
      depthZ: -1150,
      rotX: 10,
    },
    {
      num: '04',
      title: 'DECISION GATING',
      desc: 'Risk policy filters verify credit ceiling, pricing band, and tenure constraints.',
      icon: FileCheck,
      depthZ: -1350,
      rotX: 8,
    },
    {
      num: '05',
      title: 'AUTOMATED NEXT STEP',
      desc: 'Pre-sanction letter dispatched; instant disbursal packet pushed to core ledger.',
      icon: Landmark,
      depthZ: -1550,
      rotX: 6,
    },
  ];

  const architecturalLayers = [
    { name: '01. DATA INGESTION', desc: 'Bureau APIs, Account Aggregators, DigiLocker KYC' },
    { name: '02. SCORECARD ENGINE', desc: '4-Pillar Multi-Dimensional Behavioral Evaluation' },
    { name: '03. STATUTORY POLICY', desc: 'Lender-Configurable Credit & Regulatory Gating' },
    { name: '04. DECISION SYNTHESIS', desc: 'Real-Time Sanction, Pricing & Sub-Limit Assignment' },
    { name: '05. LENDING WORKFLOW', desc: 'Loan Servicing, Disbursals & Repayment Collection' },
  ];

  return (
    <ScrollStage3D
      id="scorecard-lending-stack"
      perspective={1600}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-slate-50/70 border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-20 text-left">
        {/* Header Block */}
        <div className="max-w-3xl space-y-4">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
          >
            <span>STAGE 09 // PRODUCTION LENDING PIPELINE</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              TURN UNDERWRITING{' '}
              <span className="text-[#155EEF] block">INTO ACTION.</span>
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
              Scorecards are meaningless if they do not cleanly trigger the next operational step. See how our 4-pillar risk engine integrates into the broader institutional lending workflow.
            </p>
          </div>
        </div>

        {/* 5-Stage Spatial Journey Emerging from Depth */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {journeyStages.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                data-depth-z={st.depthZ.toString()}
                data-rotate-x={st.rotX.toString()}
                data-scale="0.76"
                data-offset-y="70"
                data-blur="8"
                data-stagger={(idx * 0.12).toFixed(2)}
                className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#155EEF] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      STEP {st.num}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#155EEF] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-[#071A33] font-sans tracking-wide pt-2">
                    {st.title}
                  </h3>

                  <p className="text-xs text-slate-500 font-sans mt-2 leading-relaxed">
                    {st.desc}
                  </p>
                </div>

                <div className="pt-2 text-[10px] font-mono text-emerald-700 font-bold">
                  ✓ SUB-SECOND PASS
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Built for the Lending Stack Architectural View ── */}
        <div
          data-depth-z="-950"
          data-rotate-x="22"
          data-scale="0.8"
          data-offset-y="60"
          data-blur="8"
          data-stagger="0.4"
          className="p-8 sm:p-10 rounded-3xl bg-[#071A33] text-white shadow-xl space-y-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
                STAGE 10 // INFRASTRUCTURE VIEW
              </span>
              <h3 className="text-2xl font-black font-sans text-white mt-1">
                BUILT FOR THE LENDING STACK.
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              MODULAR API FABRIC // ZERO LOCK-IN
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {architecturalLayers.map((layer, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1.5 font-mono text-xs hover:bg-white/10 transition-colors"
              >
                <span className="text-[10px] text-cyan-300 font-bold block">
                  {layer.name}
                </span>
                <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                  {layer.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollStage3D>
  );
};
