'use client';

import React, { useState } from 'react';
import {
  Wifi,
  BatteryCharging,
  QrCode,
  Volume2,
  RotateCcw,
  Sparkles,
  Signal,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export interface SoundboxDevice3DProps {
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  scale?: number;
  isVibrating?: boolean;
  showWaveform?: boolean;
  displayAmount?: string;
  displayStatus?: string;
  signalStrength?: number; // 1 to 4
  activeHotspot?: string | null;
  onHotspotHover?: (hotspotId: string | null) => void;
  interactiveButtons?: boolean;
  onButtonClick?: (buttonName: string) => void;
  showAnnotations?: boolean;
  className?: string;
}

export const SoundboxDevice3D: React.FC<SoundboxDevice3DProps> = ({
  rotationX = 12,
  rotationY = -15,
  rotationZ = 0,
  scale = 1,
  isVibrating = false,
  showWaveform = false,
  displayAmount = '₹500.00',
  displayStatus = 'PAYMENT VERIFIED',
  signalStrength = 4,
  activeHotspot = null,
  onHotspotHover,
  interactiveButtons = true,
  onButtonClick,
  showAnnotations = false,
  className = '',
}) => {
  const [internalHover, setInternalHover] = useState<string | null>(null);
  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const effectiveHotspot = activeHotspot || internalHover;

  const handleHover = (id: string | null) => {
    setInternalHover(id);
    onHotspotHover?.(id);
  };

  const handleBtnPress = (btnName: string) => {
    if (!interactiveButtons) return;
    setPressedButton(btnName);
    onButtonClick?.(btnName);
    setTimeout(() => setPressedButton(null), 250);
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        perspective: '1600px',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* ── Ground Contact Shadows ── */}
      <div
        className="absolute w-80 h-24 rounded-full bg-slate-950/40 blur-xl pointer-events-none transition-all duration-300"
        style={{
          bottom: '-30px',
          transform: `scale(${scale * 1.15}) rotateX(75deg) translateZ(-40px)`,
        }}
      />
      <div
        className="absolute w-64 h-12 rounded-full bg-blue-950/40 blur-md pointer-events-none"
        style={{
          bottom: '-15px',
          transform: `scale(${scale}) rotateX(75deg) translateZ(-25px)`,
        }}
      />

      {/* ── Outer 3D Device Shell ── */}
      <div
        className={`relative transition-transform duration-150 ease-out preserve-3d ${
          isVibrating ? 'animate-[soundbox-vibrate_0.12s_infinite]' : ''
        }`}
        style={{
          width: `${310 * scale}px`,
          height: `${510 * scale}px`,
          transform: `rotateX(${rotationX}deg) rotateY(${rotationY}deg) rotateZ(${rotationZ}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ── Acoustic Waveform Ripples ── */}
        {showWaveform && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none preserve-3d">
            <div
              className="absolute w-72 h-72 rounded-full border border-blue-400/50 animate-ping opacity-60"
              style={{ transform: 'translateZ(90px) translateY(-50px)' }}
            />
            <div
              className="absolute w-96 h-96 rounded-full border border-cyan-300/40 animate-[ping_1.8s_ease-out_infinite] opacity-40"
              style={{ transform: 'translateZ(110px) translateY(-50px)' }}
            />
            <div
              className="absolute w-[440px] h-[440px] rounded-full border border-indigo-400/30 animate-[ping_2.4s_ease-out_infinite] opacity-25"
              style={{ transform: 'translateZ(130px) translateY(-50px)' }}
            />
          </div>
        )}

        {/* ── Main Chassis Body: Ergonomic Counter Enclosure ── */}
        <div
          className="absolute inset-0 rounded-[34px] bg-gradient-to-b from-[#1E293B] via-[#0F172A] to-[#080D17] border-2 border-slate-700/80 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.25),0_0_0_1px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col justify-between"
          style={{ transform: 'translateZ(0px)' }}
        >
          {/* Top Specular Chamfer Highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

          {/* ── TOP CONTROL PANEL: Tactile Action Keys & Status ── */}
          <div
            className="px-5 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-800 bg-[#162031]/95 shrink-0"
            onMouseEnter={() => handleHover('buttons')}
            onMouseLeave={() => handleHover(null)}
          >
            {/* 4G IoT Cellular Status Indicator */}
            <div
              className="flex items-center gap-1.5 cursor-pointer group"
              onMouseEnter={() => handleHover('4g')}
              onMouseLeave={() => handleHover(null)}
            >
              <div className="flex items-end gap-0.5 h-3.5">
                {[1, 2, 3, 4].map((bar) => (
                  <span
                    key={bar}
                    className={`w-1 rounded-xs transition-colors duration-300 ${
                      bar <= signalStrength
                        ? 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                        : 'bg-slate-700'
                    }`}
                    style={{ height: `${bar * 3.5}px` }}
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">
                4G LTE
              </span>
            </div>

            {/* Hardware Tactile Keys (Replay, Volume, Battery) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBtnPress('replay')}
                aria-label="Replay Last Transaction Voice Audio"
                className={`p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all shadow-xs ${
                  pressedButton === 'replay' ? 'ring-2 ring-cyan-400 bg-cyan-950 scale-90' : ''
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleBtnPress('volume')}
                aria-label="Toggle Soundbox Volume Output"
                className={`p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 active:scale-95 transition-all shadow-xs ${
                  pressedButton === 'volume' ? 'ring-2 ring-cyan-400 bg-cyan-950 scale-90' : ''
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              {/* Battery Indicator */}
              <div className="flex items-center gap-1 pl-1 text-[10px] font-mono text-emerald-400">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[9px] font-bold">100%</span>
              </div>
            </div>
          </div>

          {/* ── OLED DUAL CONFIRMATION DISPLAY ── */}
          <div
            className="mx-4 mt-2.5 p-3 rounded-2xl bg-black border border-cyan-500/30 shadow-[inset_0_2px_8px_rgba(0,0,0,0.95),0_0_15px_rgba(6,182,212,0.15)] relative overflow-hidden transition-all duration-300 group cursor-pointer shrink-0"
            style={{ transform: 'translateZ(10px)' }}
            onMouseEnter={() => handleHover('display')}
            onMouseLeave={() => handleHover(null)}
          >
            {/* Scanline CRT glass overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

            <div className="flex items-center justify-between text-[9px] font-mono text-cyan-300/80 uppercase tracking-wider pb-1 border-b border-cyan-950">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ADYAPAN SWITCH</span>
              </span>
              <span className="text-slate-400">MQTT • ONLINE</span>
            </div>

            <div className="py-2 text-center">
              <div className="text-2xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]">
                {displayAmount}
              </div>
              <div className="text-[10px] font-mono font-semibold tracking-widest text-cyan-400 uppercase mt-0.5">
                {displayStatus}
              </div>
            </div>

            <div className="flex items-center justify-between text-[8px] font-mono text-slate-500 pt-1 border-t border-cyan-950">
              <span>TXN: ADY-88421</span>
              <span className="text-emerald-400 font-bold">T+1 SETTLED</span>
            </div>
          </div>

          {/* ── HIGH-OUTPUT ACOUSTIC SPEAKER GRILLE (Sound Chamber) ── */}
          <div
            className="mx-4 mt-2.5 p-3 rounded-2xl bg-gradient-to-b from-[#141C2B] to-[#0D131F] border border-slate-800 relative cursor-pointer group transition-all shrink-0"
            style={{ transform: 'translateZ(14px)' }}
            onMouseEnter={() => handleHover('grille')}
            onMouseLeave={() => handleHover(null)}
          >
            {/* Metallic Speaker Perforation Array Header */}
            <div className="flex items-center justify-between pb-1 px-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isVibrating
                      ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] animate-ping'
                      : 'bg-emerald-400'
                  }`}
                />
                <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  3W Neodymium Acoustic Engine
                </span>
              </div>
              <span className="text-[8px] font-mono text-cyan-400">85 dB CLEAR</span>
            </div>

            {/* Speaker Mesh Perforations */}
            <div className="w-full h-14 rounded-xl bg-black/70 border border-slate-800/80 p-1.5 flex flex-col justify-between overflow-hidden relative shadow-inner">
              {/* Concentric sound hole grid */}
              <div className="grid grid-cols-12 gap-1.5 place-items-center opacity-70">
                {Array.from({ length: 36 }).map((_, idx) => (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                      isVibrating
                        ? idx % 3 === 0
                          ? 'bg-cyan-400 shadow-[0_0_4px_#22d3ee]'
                          : 'bg-indigo-400'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              {/* Dynamic Sound Wave Bar Visualizer */}
              <div className="flex items-end justify-center gap-1 h-3 pt-0.5">
                {[4, 12, 8, 16, 10, 14, 6, 12, 16, 8, 14, 4].map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isVibrating ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-slate-700'
                    }`}
                    style={{
                      height: isVibrating ? `${Math.min(14, h * 1.1)}px` : '3px',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── DUAL DYNAMIC QR ACQUIRING FACEPLATE (Comfortably Fitted) ── */}
          <div
            className="mx-4 mt-2.5 mb-3.5 p-3 rounded-2xl bg-white border-2 border-slate-300 shadow-lg text-slate-900 cursor-pointer group transition-all relative overflow-hidden shrink-0"
            style={{ transform: 'translateZ(18px)' }}
            onMouseEnter={() => handleHover('qr')}
            onMouseLeave={() => handleHover(null)}
          >
            {/* Laser Scan Line simulation when active */}
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-[soundbox-scan_2.2s_ease-in-out_infinite] opacity-75 pointer-events-none" />

            <div className="flex items-center justify-between pb-1.5 text-[8px] font-mono font-bold text-slate-600 uppercase border-b border-slate-200">
              <span className="flex items-center gap-1">
                <QrCode className="w-3 h-3 text-[#155EEF]" />
                <span>BHARAT QR / UPI</span>
              </span>
              <span className="text-[#155EEF] font-bold">ALL APPS ACCEPTED</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              {/* High Contrast Stylized QR Plate */}
              <div className="w-16 h-16 bg-white p-1 rounded-lg border border-slate-300 shadow-xs flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-slate-900 rounded-sm p-1 flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-3.5 h-3.5 bg-white p-0.5"><div className="w-full h-full bg-slate-900" /></div>
                    <div className="w-3.5 h-3.5 bg-white p-0.5"><div className="w-full h-full bg-slate-900" /></div>
                  </div>
                  <div className="flex justify-center items-center">
                    <div className="w-2.5 h-2.5 bg-cyan-400 rounded-xs" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-3.5 h-3.5 bg-white p-0.5"><div className="w-full h-full bg-slate-900" /></div>
                    <div className="w-2 h-2 bg-white" />
                  </div>
                </div>
              </div>

              {/* Merchant Credentials & Instant Pay Badge */}
              <div className="space-y-1 text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  Adyapan Merchant Pay
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  VPA: adyapan.merchant@icici
                </div>
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] font-bold">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Verified Merchant Counter</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Integrated Industrial Design Leader Annotations (When Enabled) ── */}
        {showAnnotations && (
          <div className="absolute inset-0 pointer-events-none hidden md:block" style={{ transform: 'translateZ(30px)' }}>
            {/* Annotation 1: 4G Connectivity (Top Left) */}
            <div
              className={`absolute -left-36 top-6 transition-all duration-300 flex items-center gap-2 ${
                effectiveHotspot === '4g' ? 'opacity-100 scale-105' : 'opacity-70'
              }`}
            >
              <div className="text-right">
                <div className="text-[10px] font-mono font-bold tracking-widest text-[#155EEF] uppercase">
                  CONNECTIVITY
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  {effectiveHotspot === '4g' ? '4G LTE CAT-1 DUAL BAND' : '4G IoT TELEMETRY'}
                </div>
              </div>
              <div className="w-8 h-px bg-[#155EEF]/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#155EEF]" />
            </div>

            {/* Annotation 2: Device Controls (Top Right) */}
            <div
              className={`absolute -right-36 top-6 transition-all duration-300 flex items-center gap-2 ${
                effectiveHotspot === 'buttons' ? 'opacity-100 scale-105' : 'opacity-70'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#155EEF]" />
              <div className="w-8 h-px bg-[#155EEF]/50" />
              <div className="text-left">
                <div className="text-[10px] font-mono font-bold tracking-widest text-[#155EEF] uppercase">
                  DEVICE CONTROL
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  {effectiveHotspot === 'buttons' ? 'TACTILE REPLAY & VOLUME' : 'TACTILE INTERFACE'}
                </div>
              </div>
            </div>

            {/* Annotation 3: Status Display (Center Left) */}
            <div
              className={`absolute -left-40 top-36 transition-all duration-300 flex items-center gap-2 ${
                effectiveHotspot === 'display' ? 'opacity-100 scale-105' : 'opacity-70'
              }`}
            >
              <div className="text-right">
                <div className="text-[10px] font-mono font-bold tracking-widest text-[#155EEF] uppercase">
                  DISPLAY
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  {effectiveHotspot === 'display' ? 'OLED CONFIRMATION SCREEN' : 'STATUS DISPLAY'}
                </div>
              </div>
              <div className="w-10 h-px bg-[#155EEF]/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#155EEF]" />
            </div>

            {/* Annotation 4: Speaker (Center Right) */}
            <div
              className={`absolute -right-44 top-64 transition-all duration-300 flex items-center gap-2 ${
                effectiveHotspot === 'grille' ? 'opacity-100 scale-105' : 'opacity-70'
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#155EEF]" />
              <div className="w-12 h-px bg-[#155EEF]/50" />
              <div className="text-left">
                <div className="text-[10px] font-mono font-bold tracking-widest text-[#155EEF] uppercase">
                  SPEAKER
                </div>
                <div className="text-[9px] font-mono text-slate-500">
                  {effectiveHotspot === 'grille' ? 'AUDIO CONFIRMATION • 85dB' : 'ACOUSTIC BROADCAST'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
