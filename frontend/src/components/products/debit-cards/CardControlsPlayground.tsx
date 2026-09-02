'use client';

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Sliders,
  ShieldCheck,
  Globe,
  Smartphone,
  CheckCircle2,
  Zap,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';

export const CardControlsPlayground: React.FC = () => {
  const [isFrozen, setIsFrozen] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState(125000);
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [intlEnabled, setIntlEnabled] = useState(false);
  const [atmEnabled, setAtmEnabled] = useState(true);
  const [contactlessEnabled, setContactlessEnabled] = useState(true);

  return (
    <section id="controls" className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Sliders className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>PROGRAMMABLE SPENDING RULES</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          Your Card. Your Rules. Zero Latency.
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Every spending channel, transaction ceiling, and security toggle updates in real-time across card networks in sub-200 milliseconds.
        </p>
      </div>

      {/* Main Controls Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
        {/* Left Column: Interactive Physical Card Canvas with Freeze State */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col justify-between items-center text-center shadow-sm relative overflow-hidden">
          <div className="w-full flex justify-between items-center pb-4 border-b border-slate-100">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Live Card State</span>
            <span
              className={`text-[10px] font-mono font-bold px-3 py-0.5 rounded-full border ${
                isFrozen
                  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse'
                  : 'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}
            >
              {isFrozen ? 'LOCKED / FROZEN' : 'ACTIVE / UNLOCKED'}
            </span>
          </div>

          {/* 3D Physical Card with Frost Effect */}
          <div className="relative my-8 w-[300px] sm:w-[340px] h-[190px] sm:h-[210px] rounded-3xl transition-all duration-500 select-none shadow-xl">
            {/* The Base Card */}
            <div
              className={`w-full h-full rounded-3xl p-5 text-white flex flex-col justify-between text-left transition-all duration-500 border ${
                isFrozen
                  ? 'bg-slate-800 border-cyan-400/60 grayscale-[70%] contrast-125'
                  : 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] border-blue-400/30'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono font-bold tracking-widest text-blue-200">ADYAPAN CONTROL</span>
                <ShieldCheck className="w-4 h-4 text-blue-300" />
              </div>

              <div className="flex justify-between items-center">
                <div className="w-10 h-7 rounded bg-amber-300 border border-amber-600/50" />
                <span className="text-[10px] font-mono text-slate-300">LIMIT: ₹{monthlyLimit.toLocaleString('en-IN')}</span>
              </div>

              <div className="space-y-1">
                <p className="font-mono text-sm tracking-widest font-bold text-slate-100">4532 •••• •••• 9812</p>
                <div className="flex justify-between text-[9px] font-mono text-slate-400">
                  <span>ADYAPAN ENTERPRISE</span>
                  <span>09/29</span>
                </div>
              </div>
            </div>

            {/* Frost Overlay on Freeze */}
            {isFrozen && (
              <div className="absolute inset-0 rounded-3xl bg-cyan-950/40 backdrop-blur-[2px] border-2 border-cyan-300 flex flex-col items-center justify-center text-cyan-200 font-mono text-xs font-bold space-y-2 animate-fade-in">
                <Lock className="w-8 h-8 text-cyan-300" />
                <span>CARD TEMPORARILY FROZEN</span>
                <span className="text-[9px] text-cyan-100 font-normal">All channels locked instantly</span>
              </div>
            )}
          </div>

          {/* 1-Tap Freeze Toggle Button */}
          <button
            onClick={() => setIsFrozen(!isFrozen)}
            className={`w-full py-3.5 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              isFrozen
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {isFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{isFrozen ? 'Unfreeze Card (Restore All Rails)' : 'Instant 1-Tap Freeze Card (Sub-200ms)'}</span>
          </button>
        </div>

        {/* Right Column: Spending Limits & Channel Controls */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8 flex flex-col justify-between text-left space-y-6 shadow-sm">
          {/* Spending Slider */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-600 font-bold">Monthly Spend Ceiling</span>
              <span className="text-[#155EEF] font-black text-sm">₹{monthlyLimit.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={10000}
              max={500000}
              step={10000}
              value={monthlyLimit}
              disabled={isFrozen}
              onChange={(e) => setMonthlyLimit(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF] disabled:opacity-40"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Min: ₹10,000</span>
              <span>Max: ₹5,00,000</span>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3">
            <p className="text-[11px] font-mono uppercase font-bold text-slate-400">Authorized Channels</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => !isFrozen && setOnlineEnabled(!onlineEnabled)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  onlineEnabled && !isFrozen ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-[#155EEF]" />
                  <span className="text-xs font-bold text-[#071A33]">Online E-Commerce</span>
                </div>
                <span className={`w-3 h-3 rounded-full ${onlineEnabled && !isFrozen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>

              <div
                onClick={() => !isFrozen && setContactlessEnabled(!contactlessEnabled)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  contactlessEnabled && !isFrozen ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-[#155EEF]" />
                  <span className="text-xs font-bold text-[#071A33]">Contactless POS</span>
                </div>
                <span className={`w-3 h-3 rounded-full ${contactlessEnabled && !isFrozen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>

              <div
                onClick={() => !isFrozen && setIntlEnabled(!intlEnabled)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  intlEnabled && !isFrozen ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-[#155EEF]" />
                  <span className="text-xs font-bold text-[#071A33]">International Roaming</span>
                </div>
                <span className={`w-3 h-3 rounded-full ${intlEnabled && !isFrozen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>

              <div
                onClick={() => !isFrozen && setAtmEnabled(!atmEnabled)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  atmEnabled && !isFrozen ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-[#155EEF]" />
                  <span className="text-xs font-bold text-[#071A33]">ATM Cash Draws</span>
                </div>
                <span className={`w-3 h-3 rounded-full ${atmEnabled && !isFrozen ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 text-[11px] font-mono text-[#155EEF]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Updates synced across Visa / RuPay networks in &lt; 200ms</span>
          </div>
        </div>
      </div>
    </section>
  );
};
