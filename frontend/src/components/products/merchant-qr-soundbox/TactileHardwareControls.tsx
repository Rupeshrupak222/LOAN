'use client';

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Languages,
  BatteryCharging,
  Radio,
  Sliders,
  Sparkles,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { useWebAudioChime, REGIONAL_LANGUAGES } from './useWebAudioChime';

export const TactileHardwareControls: React.FC = () => {
  const [knobPercent, setKnobPercent] = useState(80); // 0 to 100%
  const [selectedLang, setSelectedLang] = useState('ta'); // Default to Tamil as in user test
  const [lastReplayActive, setLastReplayActive] = useState(false);
  const { playVoiceConfirmation, playChime } = useWebAudioChime();

  const knobDegrees = Math.round((knobPercent / 100) * 270);
  const calculatedDb = knobPercent === 0 ? 0 : Math.round(35 + (knobPercent / 100) * 50); // 0 -> 85 dB

  const activeLangObj = REGIONAL_LANGUAGES.find((l) => l.code === selectedLang) || REGIONAL_LANGUAGES[0];

  const handleReplayClick = () => {
    setLastReplayActive(true);
    playVoiceConfirmation(selectedLang, knobPercent / 100);
    setTimeout(() => setLastReplayActive(false), 1400);
  };

  const handleLanguageChange = (code: string) => {
    setSelectedLang(code);
    playVoiceConfirmation(code, knobPercent / 100);
  };

  const handleKnobRelease = () => {
    if (knobPercent > 0) {
      playChime(knobPercent / 100);
    }
  };

  return (
    <section
      id="section-hardware-controls"
      className="relative py-28 sm:py-36 px-4 sm:px-8 bg-[#FFFFFF] text-[#071A33] overflow-hidden border-b border-slate-200 select-none"
      style={{ contain: 'paint layout' }}
    >
      {/* ── Studio Ambient Wash ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      <div className="max-w-6xl mx-auto space-y-16 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-mono font-bold tracking-widest uppercase shadow-xs">
            <Sliders className="w-3.5 h-3.5 text-[#155EEF]" />
            <span>MERCHANT CONTROL DESK</span>
          </div>

          <h2 className="text-3xl sm:text-6xl font-black text-[#071A33] tracking-tight uppercase leading-[1.08]">
            PHYSICAL HARDWARE <br />
            <span className="bg-gradient-to-r from-[#071A33] via-[#155EEF] to-[#0284C7] bg-clip-text text-transparent">
              CONTROL DESK.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Engineered for rapid cashier adjustments. Calibrate acoustic volume via knurled rotary knob,
            toggle 8 regional voice dialects, and verify device telemetry.
          </p>
        </div>

        {/* ── THE PHYSICAL HARDWARE CONTROL DESK ── */}
        <div className="p-8 sm:p-14 rounded-3xl bg-[#F8FAFC] border-2 border-slate-200 shadow-xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: 1. Knurled Rotary Knob & 3. Replay Button */}
            <div className="lg:col-span-6 space-y-8 text-left">
              {/* 1. Knurled Rotary Volume Knob Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#155EEF] uppercase flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-[#155EEF]" />
                    <span>Knurled Rotary Volume Knob</span>
                  </span>
                  <div className="text-right">
                    <div className="text-lg font-black font-mono text-[#071A33]">
                      {knobPercent === 0 ? 'MUTE' : `${calculatedDb} dB`}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {knobDegrees}° ANGLE • {knobPercent}% LEVEL
                    </div>
                  </div>
                </div>

                {/* Tactile Rotary Knob Visual Representation */}
                <div
                  onClick={() => playChime(knobPercent / 100)}
                  className="flex items-center justify-center py-4 cursor-pointer group"
                  title="Click knob to test audio volume"
                >
                  <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-slate-100 to-slate-300 border-4 border-slate-300 shadow-xl flex items-center justify-center group-hover:border-blue-400 transition-colors">
                    {/* Outer Knurled Rim Teeth */}
                    <div className="absolute inset-1 rounded-full border-2 border-dashed border-slate-400 opacity-60" />

                    {/* Rotating Dial Face */}
                    <div
                      className="w-24 h-24 rounded-full bg-gradient-to-b from-[#131B2B] to-[#0A0F1A] border-2 border-slate-700 shadow-inner relative transition-transform duration-75 flex items-center justify-center"
                      style={{
                        transform: `rotate(${knobDegrees - 135}deg)`,
                      }}
                    >
                      {/* Notch Indicator */}
                      <div className="absolute top-1.5 w-1.5 h-4 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
                      <span className="text-[9px] font-mono font-bold text-slate-400 -rotate-90">VOL</span>
                    </div>
                  </div>
                </div>

                {/* Knob Drag Range Slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={knobPercent}
                  onChange={(e) => setKnobPercent(parseInt(e.target.value, 10))}
                  onMouseUp={handleKnobRelease}
                  onTouchEnd={handleKnobRelease}
                  aria-label="Adjust Knurled Soundbox Rotary Volume Knob"
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
                />

                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>MUTE (0°)</span>
                  <span>45 dB (135°)</span>
                  <span className="text-[#155EEF] font-bold">85 dB (270°)</span>
                </div>
              </div>

              {/* 3. Replay Button: Large Tactile Rubber Key */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-[#155EEF]" />
                    <span>Large Rubber Replay Key</span>
                  </span>
                  <p className="text-xs text-slate-600">
                    Tactile mechanical key. Re-announces last completed counter payment instantly.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReplayClick}
                  className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shrink-0 flex items-center gap-2 ${
                    lastReplayActive
                      ? 'bg-emerald-600 text-white shadow-none translate-y-1'
                      : 'bg-slate-900 hover:bg-black text-white shadow-[0_6px_0_#0f172a] active:translate-y-1 active:shadow-[0_2px_0_#0f172a] cursor-pointer'
                  }`}
                >
                  <RotateCcw className={`w-4 h-4 ${lastReplayActive ? 'animate-spin' : ''}`} />
                  <span>{lastReplayActive ? 'REPLAYING AUDIO...' : 'REPLAY'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: 2. Regional Voice Dialects & 4. Diagnostics Panel */}
            <div className="lg:col-span-6 space-y-8 text-left">
              {/* 2. Language Dialect Selector (8 Interactive Keys) */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#155EEF] uppercase flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-[#155EEF]" />
                    <span>Regional Dialect Selector</span>
                  </span>
                  <span className="text-xs font-mono text-slate-500">8 Indian Languages</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {REGIONAL_LANGUAGES.map((lang) => {
                    const isSelected = selectedLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-[#155EEF] text-[#155EEF] font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs">{lang.label}</div>
                        <div className="text-[9px] font-mono text-slate-400 uppercase mt-0.5">
                          {lang.code}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Active Dialect Sound Sample Text with Interactive Test Button */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Speech Output:</span>
                    <span className="text-[#155EEF] font-bold font-sans text-sm">&ldquo;{activeLangObj.nativeText}&rdquo;</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => playVoiceConfirmation(selectedLang, knobPercent / 100)}
                    className="px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-[#155EEF] font-bold text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Play Sample</span>
                  </button>
                </div>
              </div>

              {/* 4. Device Diagnostics Panel */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#155EEF]" />
                    <span>Hardware Diagnostics Panel</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">
                      Battery Level
                    </span>
                    <div className="text-sm font-black font-mono text-emerald-600 flex items-center gap-1">
                      <BatteryCharging className="w-4 h-4" />
                      <span>100% HEALTH</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">
                      Cellular Signal
                    </span>
                    <div className="text-sm font-black font-mono text-[#155EEF] flex items-center gap-1">
                      <Radio className="w-4 h-4" />
                      <span>-68 dBm (4G)</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block">
                      Firmware Build
                    </span>
                    <div className="text-sm font-black font-mono text-[#071A33]">
                      v2.4.1 OTA
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
