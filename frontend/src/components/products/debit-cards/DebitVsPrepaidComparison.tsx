'use client';

import React, { useState } from 'react';
import { CreditCard, CheckCircle2, ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';

export const DebitVsPrepaidComparison: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'debit' | 'prepaid'>('debit');

  return (
    <section className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>DUAL CARD PRODUCT SUITE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          Debit vs. Prepaid Architecture
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Switch between linked account spending and controlled pre-funded corporate wallets with zero core schema friction.
        </p>

        {/* Dual Tab Switcher */}
        <div className="inline-flex rounded-full bg-slate-100 p-1 border border-slate-200 shadow-inner mt-4">
          <button
            onClick={() => setSelectedType('debit')}
            className={`px-6 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedType === 'debit' ? 'bg-[#155EEF] text-white shadow-md' : 'text-slate-600 hover:text-[#071A33]'
            }`}
          >
            Adyapan Platinum Debit
          </button>
          <button
            onClick={() => setSelectedType('prepaid')}
            className={`px-6 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
              selectedType === 'prepaid' ? 'bg-[#155EEF] text-white shadow-md' : 'text-slate-600 hover:text-[#071A33]'
            }`}
          >
            Corporate Expense Prepaid
          </button>
        </div>
      </div>

      {/* Interactive Card Presentation Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
        {/* Left Column: Dynamically Morphed 3D Physical Card */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-4">
          <div
            className={`w-[320px] sm:w-[360px] h-[200px] sm:h-[225px] rounded-3xl p-6 text-white flex flex-col justify-between text-left shadow-2xl transition-all duration-700 border ${
              selectedType === 'debit'
                ? 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] border-blue-400/30 ring-2 ring-blue-400/20'
                : 'bg-gradient-to-tr from-[#1E1B4B] via-[#312E81] to-[#4F46E5] border-indigo-400/40 ring-2 ring-indigo-400/20'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono font-bold tracking-widest text-blue-200">
                {selectedType === 'debit' ? 'PLATINUM DEBIT' : 'FLEET PREPAID'}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 border border-white/20">
                {selectedType === 'debit' ? 'CORE LINKED' : 'PRE-FUNDED'}
              </span>
            </div>

            <div className="w-10 h-7 rounded bg-amber-300 border border-amber-600/50" />

            <div className="space-y-1">
              <p className="font-mono text-sm tracking-widest font-bold text-slate-100">
                {selectedType === 'debit' ? '4532 •••• •••• 9812' : '5241 •••• •••• 4120'}
              </p>
              <div className="flex justify-between text-[9px] font-mono text-slate-300">
                <span>{selectedType === 'debit' ? 'RETAIL ACCOUNT HOLDER' : 'CORP FLEET EXPENSE'}</span>
                <span>EXP 09/29</span>
              </div>
            </div>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {selectedType === 'debit' ? 'Direct Core Banking Debit Rail' : 'Isolated Corporate Wallet Rail'}
          </span>
        </div>

        {/* Right Column: Comparative Feature Breakdown */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 text-left shadow-sm space-y-6">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#155EEF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {selectedType === 'debit' ? 'Primary Use Case: Core Banking' : 'Primary Use Case: Expense & Gifting'}
            </span>
            <h3 className="text-2xl font-black text-[#071A33] mt-2">
              {selectedType === 'debit' ? 'Instant Account-Linked Debit Cards' : 'Programmable Corporate Prepaid Cards'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2">
              {selectedType === 'debit'
                ? 'Directly debits the borrower or customer primary bank account balance with zero float delay and automated interest accrual.'
                : 'Isolated pre-funded balances ideal for employee travel allowances, vendor disbursements, gift cards, and strict budget caps.'}
            </p>
          </div>

          <div className="space-y-2.5 font-mono text-xs text-slate-700">
            {selectedType === 'debit' ? (
              <>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-[#155EEF] shrink-0" />
                  <span>Direct double-entry ledger balance debiting in real-time</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-[#155EEF] shrink-0" />
                  <span>Full access to overdraft boundaries and interest accounts</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-[#155EEF] shrink-0" />
                  <span>ATM cash withdrawal and universal global acceptance</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Hard spending ceiling restricted strictly to pre-loaded funds</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Merchant Category Code (MCC) locks (e.g. Fuel, Airlines only)</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Automated batch top-up and auto-sweep of unspent funds</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
