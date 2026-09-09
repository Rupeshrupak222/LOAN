'use client';

import React, { useState } from 'react';
import { CreditCard, ArrowRight, Store, Zap, CheckCircle2, Play } from 'lucide-react';

export const UpiTransactionConveyor: React.FC = () => {
  const [packetStage, setPacketStage] = useState<'origin' | 'in-transit' | 'delivered'>('origin');
  const [conveyorCount, setConveyorCount] = useState(1);

  const handleDispatchPacket = () => {
    if (packetStage !== 'origin') return;

    setPacketStage('in-transit');
    setTimeout(() => {
      setPacketStage('delivered');
      setTimeout(() => {
        setPacketStage('origin');
        setConveyorCount((prev) => prev + 1);
      }, 1600);
    }, 1100);
  };

  return (
    <section
      id="section-conveyor"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-white text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[400px] bg-blue-500/5 rounded-full blur-[180px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10 text-center">
        {/* Section Header */}
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Zap className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>TRANSACTION CONVEYOR</span>
          </div>

          <h2
            className="text-3xl sm:text-5xl md:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.04]"
            style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
          >
            DRAW DOWN <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              ON UPI.
            </span>
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-slate-500 uppercase tracking-wider pt-1">
            <span className="font-bold text-[#071A33]">Designed for UPI payment journeys</span>
            <span className="text-slate-300">•</span>
            <span>Illustrative UPI payment experience</span>
          </div>
        </div>

        {/* ── PRECISION TRANSACTION CONVEYOR ── */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#F8FAFC] border border-slate-200 shadow-md relative overflow-hidden">
          {/* Conveyor Rulers & Physical Beam Track */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative">
            {/* Stage 1: CREDIT LINE */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-left space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#155EEF] uppercase tracking-wider">
                  OBJECT 01
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#155EEF]" />
              </div>
              <div className="text-lg font-black text-[#071A33] uppercase">
                Credit Line Core
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pre-approved revolving limit stands provisioned on Adyapan core. Awaiting payment trigger.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                BALANCE: ₹50,000 ACTIVE
              </div>
            </div>

            {/* Stage 2: UPI PAYMENT GATEWAY */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-left space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-cyan-600 uppercase tracking-wider">
                  OBJECT 02
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    packetStage === 'in-transit' ? 'bg-cyan-400 animate-ping' : 'bg-slate-300'
                  }`}
                />
              </div>
              <div className="text-lg font-black text-[#071A33] uppercase">
                UPI Switch Rail
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Single-tap UPI PIN authorization binds the draw to standard QR scan & checkout rail.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                STATUS: {packetStage === 'in-transit' ? 'ROUTING PACKET...' : 'LISTENING'}
              </div>
            </div>

            {/* Stage 3: MERCHANT SETTLEMENT */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-left space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-600 uppercase tracking-wider">
                  OBJECT 03
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    packetStage === 'delivered' ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                />
              </div>
              <div className="text-lg font-black text-[#071A33] uppercase">
                Merchant Counter
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Merchant receives instant credit notification. Goods released without checkout stall.
              </p>
              <div className="pt-2 border-t border-slate-100 text-[10px] font-mono text-slate-500">
                STATUS: {packetStage === 'delivered' ? 'FUNDS SETTLED ✓' : 'STANDBY'}
              </div>
            </div>

            {/* Moving Laser Conveyor Track Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 pointer-events-none hidden md:block" />
          </div>

          {/* Interactive Trigger Button */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={handleDispatchPacket}
              disabled={packetStage !== 'origin'}
              className="px-8 py-3.5 rounded-full bg-[#155EEF] hover:bg-[#004EEB] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/25 flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>
                {packetStage === 'origin'
                  ? 'Dispatch ₹1,500 Payment Packet'
                  : packetStage === 'in-transit'
                  ? 'Transiting UPI Rail...'
                  : 'Packet Delivered to Merchant!'}
              </span>
            </button>

            <span className="text-xs font-mono text-slate-500">
              Transactions Dispatched: <strong className="text-slate-800">{conveyorCount}</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
