'use client';

import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  Users,
  Smartphone,
  Zap,
  Building2,
} from 'lucide-react';

export const BusinessControlConsole: React.FC = () => {
  const [dualSignThreshold, setDualSignThreshold] = useState(100000);
  const [autoGstLock, setAutoGstLock] = useState(true);
  const [multiSignRequired, setMultiSignRequired] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [tallySync, setTallySync] = useState(true);

  return (
    <section id="controls" className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Sliders className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>AUTONOMOUS TREASURY GOVERNANCE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Control Without the Operational Clutter
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Automate spending ceilings, multi-sign approval policies, and tax allocations with granular programmable switches.
        </p>
      </div>

      {/* Main Controls Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-[1400px] mx-auto">
        {/* Left Column: Spending Threshold Gauge */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 flex flex-col justify-between text-left space-y-6 shadow-sm">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-600 font-bold">Dual-Sign Approval Trigger</span>
              <span className="text-[#155EEF] font-black text-sm">₹{dualSignThreshold.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-xs text-slate-500">
              Disbursements exceeding this threshold mandate secondary biometric sign-off by a designated Director or CFO.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <input
              type="range"
              min={25000}
              max={1000000}
              step={25000}
              value={dualSignThreshold}
              onChange={(e) => setDualSignThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>Min: ₹25,000</span>
              <span>Max: ₹10,00,000</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs font-mono text-[#155EEF] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Policy active across Web Portal, API, and Mobile App</span>
          </div>
        </div>

        {/* Right Column: Interactive Policy Toggles */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-7 sm:p-8 flex flex-col justify-between text-left space-y-4 shadow-sm">
          <p className="text-[11px] font-mono uppercase font-bold text-slate-400">Autonomous Treasury Automations</p>

          <div
            onClick={() => setAutoGstLock(!autoGstLock)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              autoGstLock ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#071A33] block">Automated 18% GST Sweep</span>
              <span className="text-[10px] text-slate-500">Auto-transfers tax component into isolated reserve vault</span>
            </div>
            <span className={`w-3 h-3 rounded-full shrink-0 ${autoGstLock ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>

          <div
            onClick={() => setMultiSignRequired(!multiSignRequired)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              multiSignRequired ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#071A33] block">Mandatory 2FA on Batch Payouts</span>
              <span className="text-[10px] text-slate-500">Requires OTP + biometric verification before switch release</span>
            </div>
            <span className={`w-3 h-3 rounded-full shrink-0 ${multiSignRequired ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>

          <div
            onClick={() => setSlackAlerts(!slackAlerts)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              slackAlerts ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#071A33] block">Instant Slack & WhatsApp Payout Alerts</span>
              <span className="text-[10px] text-slate-500">Sub-second webhook notification on high-value events</span>
            </div>
            <span className={`w-3 h-3 rounded-full shrink-0 ${slackAlerts ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>

          <div
            onClick={() => setTallySync(!tallySync)}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
              tallySync ? 'bg-white border-blue-200 shadow-xs' : 'bg-slate-100 border-slate-200 opacity-60'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-[#071A33] block">Real-Time Tally / Zoho ERP Ledger Sync</span>
              <span className="text-[10px] text-slate-500">Auto-reconciles bank statements against open invoices</span>
            </div>
            <span className={`w-3 h-3 rounded-full shrink-0 ${tallySync ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </div>
        </div>
      </div>
    </section>
  );
};
