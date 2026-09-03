'use client';

import React, { useState, useRef } from 'react';
import { ShieldCheck, FileCheck, Move } from 'lucide-react';
import { ScrollStage3D } from '@/components/motion/ScrollStage3D';

export const InteractiveDocumentSurface: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (cardRef.current) {
      cardRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !cardRef.current) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    const targetRy = Math.max(-12, Math.min(12, deltaX * 0.1));
    const targetRx = Math.max(-12, Math.min(12, -deltaY * 0.1));

    cardRef.current.style.transform = `perspective(1000px) rotateX(${targetRx}deg) rotateY(${targetRy}deg) scale(1.02)`;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    if (cardRef.current) {
      cardRef.current.releasePointerCapture(e.pointerId);
      cardRef.current.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
      setTimeout(() => {
        if (cardRef.current) cardRef.current.style.transition = '';
      }, 400);
    }
  };

  return (
    <ScrollStage3D
      id="section-document-surface"
      perspective={1500}
      className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 bg-white border-b border-slate-200 text-[#071A33] select-none"
    >
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Editorial Narrative */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div
            data-depth-z="-450"
            data-rotate-x="18"
            data-offset-y="30"
            data-scale="0.9"
            data-blur="4"
            className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-wider uppercase"
          >
            <span>STAGE 05 // TACTILE DIGITAL SURFACE</span>
          </div>

          <div
            data-depth-z="-750"
            data-rotate-x="30"
            data-offset-y="60"
            data-blur="8"
            data-stagger="0.1"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight leading-tight uppercase font-sans">
              ACCESS THE DOCUMENT.
            </h2>
          </div>

          <div
            data-depth-z="-1000"
            data-rotate-x="38"
            data-offset-y="90"
            data-blur="12"
            data-stagger="0.25"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight uppercase font-sans">
              <span className="text-[#155EEF] block">NOT THE PAPERWORK.</span>
            </h2>
          </div>

          <div
            data-depth-z="-650"
            data-rotate-y="-8"
            data-offset-y="40"
            data-blur="6"
            data-stagger="0.4"
          >
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed font-sans">
              Authentic digital documents are received in machine-readable, structured schemas directly signed by accredited issuers. This eliminates degraded photocopies, expired proofs, and unreadable scans.
            </p>
          </div>

          <div
            data-depth-z="-450"
            data-rotate-x="14"
            data-offset-y="30"
            data-blur="4"
            data-stagger="0.55"
            className="pt-2 flex items-center gap-3 text-xs font-mono text-slate-500"
          >
            <Move className="w-4 h-4 text-[#155EEF]" />
            <span>Interactive demonstration: Drag or hover the document sheet to inspect depth.</span>
          </div>
        </div>

        {/* Right Tactile 3D Document Sheet (Emerges from Z: -1100px, rotY: -14deg) */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <div
            ref={cardRef}
            data-depth-z="-1100"
            data-rotate-x="15"
            data-rotate-y="-14"
            data-scale="0.75"
            data-offset-y="80"
            data-blur="10"
            data-stagger="0.3"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full max-w-lg rounded-2xl bg-white border border-slate-300 shadow-2xl p-7 sm:p-9 space-y-6 cursor-grab active:cursor-grabbing relative select-none"
            style={{
              transformStyle: 'preserve-3d',
              boxShadow: isDragging
                ? '0 30px 60px -15px rgba(21,94,239,0.25), 0 0 0 1px rgba(21,94,239,0.4)'
                : '0 20px 45px -12px rgba(15,23,42,0.12), 0 0 0 1px rgba(226,232,240,0.9)',
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-[#155EEF]" />
                </div>
                <span className="text-xs font-mono font-bold text-[#071A33] uppercase">
                  STRUCTURED DIGITAL RECORD
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                VERIFICATION READY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[9px] font-mono uppercase text-slate-400 block">
                  DOCUMENT TYPE
                </span>
                <span className="text-xs font-bold text-[#071A33]">
                  IDENTITY DOCUMENT
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[9px] font-mono uppercase text-slate-400 block">
                  SOURCE
                </span>
                <span className="text-xs font-bold text-[#071A33]">
                  DIGITAL ISSUER
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[9px] font-mono uppercase text-slate-400 block">
                  REFERENCE
                </span>
                <span className="text-xs font-mono font-bold text-[#155EEF]">
                  DEMO-20491
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[9px] font-mono uppercase text-slate-400 block">
                  STATUS
                </span>
                <span className="text-xs font-bold text-emerald-700">
                  READY
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="space-y-1 text-left">
                <span className="text-[9px] font-mono text-slate-400 block">
                  CRYPTOGRAPHIC CHECKSUM
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-700">
                  SHA256: 4C2B •••• 9E1F
                </span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="pt-2 text-center text-[10px] font-mono text-slate-400">
              Demonstration document schema · Contains no actual government or personal identity data.
            </div>
          </div>
        </div>
      </div>
    </ScrollStage3D>
  );
};
