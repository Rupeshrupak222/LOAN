'use client';

import React from 'react';
import { Building2, PhoneCall, Mail, Activity, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const DirectConnectionMatrix: React.FC = () => {
  const channels = [
    {
      title: 'Global Headquarters',
      tag: 'FINANCIAL DISTRICT // BENGALURU & MUMBAI',
      detail: 'Adyapan Technologies Pvt. Ltd., Level 14, Tower B, Embassy TechVillage, Outer Ring Road, Bengaluru, Karnataka 560103',
      sub: 'Mumbai Treasury Desk: Bandra Kurla Complex (BKC)',
      icon: Building2,
      depthZ: -800,
      rotX: 15,
      rotY: -14,
      stagger: 0.1,
    },
    {
      title: 'Direct Engineering Line',
      tag: 'DIRECT ACCESS // PRINCIPAL ARCHITECTS',
      detail: '+91 (080) 4000 8890',
      sub: 'Monday to Saturday · 09:00 to 20:00 IST (Dedicated Priority SLA for Active LMS Tenants)',
      icon: PhoneCall,
      depthZ: -1050,
      rotX: -10,
      rotY: 12,
      stagger: 0.25,
    },
    {
      title: 'Compliance & Audit Desk',
      tag: 'STATUTORY AUDIT // RBI & SOC-2 ENQUIRIES',
      detail: 'compliance-desk@adyapan.com',
      sub: 'Direct escalation to Chief Information Security Officer (CISO) & Legal Counsel',
      icon: ShieldCheck,
      depthZ: -1300,
      rotX: 18,
      rotY: -8,
      stagger: 0.4,
    },
    {
      title: '24/7 Production Operations NOC',
      tag: 'ACTIVE MONITORING // ZERO DOWNTIME',
      detail: 'noc-emergency@adyapan.com',
      sub: 'Real-time telemetry dispatch · Sub-5 minute response for Tier-1 Core Banking Incidents',
      icon: Activity,
      depthZ: -950,
      rotX: 8,
      rotY: 10,
      stagger: 0.55,
    },
  ];

  return (
    <ScrollStage3D
      id="direct-connection"
      perspective={1500}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto space-y-16 text-left">
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
            <span>STAGE 05 // DIRECT ACCESS CHANNELS</span>
          </div>

          <div
            data-depth-z="-850"
            data-rotate-x="32"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              DIRECT CHANNELS.{' '}
              <span className="text-[#155EEF] block">ZERO INTERMEDIARIES.</span>
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
              We operate an open, transparent communication architecture for enterprise partners, banks, and licensed NBFCs. Reach out directly through any verified channel below.
            </p>
          </div>
        </div>

        {/* 4 Direct Connection Blocks Rising from Layered Plane */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {channels.map((ch, idx) => {
            const Icon = ch.icon;
            return (
              <div
                key={idx}
                data-depth-z={ch.depthZ.toString()}
                data-rotate-x={ch.rotX.toString()}
                data-rotate-y={ch.rotY.toString()}
                data-scale="0.78"
                data-offset-y="70"
                data-blur="10"
                data-stagger={ch.stagger.toString()}
                className="p-8 rounded-2xl bg-slate-50 border border-slate-200/90 hover:bg-white hover:border-[#155EEF] transition-all duration-300 shadow-xs space-y-4 group"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                    {ch.tag}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#155EEF] flex items-center justify-center group-hover:bg-[#155EEF] group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-xl font-black text-[#071A33] font-sans">
                  {ch.title}
                </h3>

                <p className="text-sm font-bold font-mono text-[#155EEF]">
                  {ch.detail}
                </p>

                <p className="text-xs text-slate-500 font-sans leading-relaxed pt-1">
                  {ch.sub}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollStage3D>
  );
};
