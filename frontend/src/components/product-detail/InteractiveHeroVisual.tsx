'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  ShieldCheck,
  Lock,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  QrCode,
  Smartphone,
  Layers,
  Cpu,
  Calculator,
  Percent,
  Activity,
  Globe,
} from 'lucide-react';
import { ProductDetailData } from '@/lib/productData';

interface InteractiveHeroVisualProps {
  product: ProductDetailData;
}

export const InteractiveHeroVisual: React.FC<InteractiveHeroVisualProps> = ({ product }) => {
  // Simulator states
  const [activeTab, setActiveTab] = useState(0);
  const [sliderVal, setSliderVal] = useState(500000);
  const [tenureVal, setTenureVal] = useState(24);
  const [rateVal, setRateVal] = useState(10.5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('System Idle · Ready');
  const [cardLimit, setCardLimit] = useState(75000);
  const [isCardFrozen, setIsCardFrozen] = useState(false);
  const [txLog, setTxLog] = useState<Array<{ id: string; time: string; type: string; amount: string; status: string }>>([
    { id: 'TX-8910', time: '12:04:12', type: 'LEDGER_CREDIT', amount: '+₹50,000.00', status: 'COMMITTED' },
    { id: 'TX-8909', time: '12:03:55', type: 'INTEREST_ACCRUAL', amount: '+₹412.50', status: 'COMMITTED' },
    { id: 'TX-8908', time: '12:01:20', type: 'DISBURSAL_SETTLE', amount: '-₹2,50,000.00', status: 'COMMITTED' },
  ]);

  const triggerSimulateAction = () => {
    setIsProcessing(true);
    setStatusMsg('Executing Atomic Request...');
    setTimeout(() => {
      setIsProcessing(false);
      setStatusMsg('Committed Successfully · Sub-10ms');
      setTxLog((prev) => [
        {
          id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
          time: new Date().toTimeString().split(' ')[0],
          type: 'LIVE_SIMULATION',
          amount: `+₹${(Math.random() * 50000 + 10000).toFixed(2)}`,
          status: 'COMMITTED',
        },
        ...prev.slice(0, 3),
      ]);
    }, 600);
  };

  // Reducing EMI calculation
  const monthlyRate = rateVal / 12 / 100;
  const emi =
    sliderVal > 0 && tenureVal > 0
      ? (
          (sliderVal * monthlyRate * Math.pow(1 + monthlyRate, tenureVal)) /
          (Math.pow(1 + monthlyRate, tenureVal) - 1)
        ).toFixed(0)
      : '0';
  const totalPayable = (Number(emi) * tenureVal).toFixed(0);
  const totalInterest = (Number(totalPayable) - sliderVal).toFixed(0);

  return (
    <div className="relative w-full rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-7 shadow-2xl text-white overflow-hidden group">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#155EEF]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

      {/* Header bar of visualizer */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold font-mono text-slate-300">
            {product.name} · Interactive Simulator
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700">
            DEMO MODE
          </span>
        </div>
      </div>

      {/* Dynamic Visualizer based on Simulator Type */}
      {/* ── Type 1: Core Banking Double-Entry Ledger Simulator ── */}
      {product.simulatorType === 'core-ledger' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60">
              <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Ledger Asset Balance</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 font-mono">₹48,92,410.00</p>
              <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">✓ 100% In-Sync (Zero Float Drift)</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60">
              <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">Liability Journal</p>
              <p className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5 font-mono">₹48,92,410.00</p>
              <p className="text-[10px] text-blue-400 font-semibold mt-0.5">✓ Double-Entry Balanced</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-left font-mono text-xs space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Live Double-Entry Journal Feed</p>
            <div className="space-y-1.5">
              {txLog.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-[11px] py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">{tx.time}</span>
                  <span className="text-blue-300 font-bold">{tx.type}</span>
                  <span className={tx.amount.startsWith('+') ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {tx.amount}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={triggerSimulateAction}
            disabled={isProcessing}
            className="w-full py-3 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>{isProcessing ? 'Writing Immutable Block...' : 'Simulate Live Transaction Commit'}</span>
          </button>
        </div>
      )}

      {/* ── Type 2: Card Customizer ── */}
      {product.simulatorType === 'card-customizer' && (
        <div className="space-y-4">
          <div className="relative rounded-2xl p-5 bg-gradient-to-tr from-slate-950 via-blue-950 to-indigo-900 border border-blue-500/30 text-left shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-mono font-black tracking-widest text-blue-300">ADYAPAN PLATINUM</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{isCardFrozen ? 'FROZEN' : 'ACTIVE'}</span>
            </div>
            <p className="text-lg sm:text-xl font-mono tracking-widest font-bold text-white mb-4">
              4532 •••• •••• 9812
            </p>
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-300">
              <span>EXP: 09/29</span>
              <span>CVV: *** (DYNAMIC)</span>
            </div>
          </div>

          <div className="space-y-3 text-left">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Monthly Spending Limit:</span>
              <span className="text-emerald-400 font-bold">₹{cardLimit.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={10000}
              max={250000}
              step={5000}
              value={cardLimit}
              onChange={(e) => setCardLimit(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
            />
          </div>

          <button
            onClick={() => setIsCardFrozen(!isCardFrozen)}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isCardFrozen ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isCardFrozen ? 'Unfreeze Card' : 'Instant Freeze Card (Sub-200ms)'}</span>
          </button>
        </div>
      )}

      {/* ── Type 3: Lending / Mortgages / BNPL EMI Simulators ── */}
      {(product.simulatorType === 'personal-loan-calc' ||
        product.simulatorType === 'sme-revolving-line' ||
        product.simulatorType === 'mortgage-schedule' ||
        product.simulatorType === 'bnpl-split') && (
        <div className="space-y-4">
          <div className="space-y-3 text-left">
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Sanction Principal:</span>
                <span className="text-emerald-400 font-bold">₹{sliderVal.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={product.simulatorType === 'bnpl-split' ? 3000 : 50000}
                max={product.simulatorType === 'mortgage-schedule' ? 10000000 : 2500000}
                step={5000}
                value={sliderVal}
                onChange={(e) => setSliderVal(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Tenure:</span>
                <span className="text-blue-300 font-bold">
                  {product.simulatorType === 'bnpl-split' ? '3 Months (0% Interest)' : `${tenureVal} Months`}
                </span>
              </div>
              {product.simulatorType !== 'bnpl-split' && (
                <input
                  type="range"
                  min={6}
                  max={product.simulatorType === 'mortgage-schedule' ? 360 : 60}
                  step={6}
                  value={tenureVal}
                  onChange={(e) => setTenureVal(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#155EEF]"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
              <p className="text-[10px] font-mono uppercase text-slate-400">
                {product.simulatorType === 'bnpl-split' ? 'Per Month Split (x3)' : 'Monthly Reducing EMI'}
              </p>
              <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                ₹{product.simulatorType === 'bnpl-split' ? Math.round(sliderVal / 3).toLocaleString('en-IN') : Number(emi).toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
              <p className="text-[10px] font-mono uppercase text-slate-400">Interest Payable</p>
              <p className="text-xl font-black text-blue-400 font-mono mt-0.5">
                {product.simulatorType === 'bnpl-split' ? '₹0.00 (0% BNPL)' : `₹${Number(totalInterest).toLocaleString('en-IN')}`}
              </p>
            </div>
          </div>

          <button
            onClick={triggerSimulateAction}
            className="w-full py-3 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Proceed to Digital Sanction Check</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Type 4: Default Fallback Interactive Risk / Tech Simulator ── */}
      {product.simulatorType !== 'core-ledger' &&
        product.simulatorType !== 'card-customizer' &&
        product.simulatorType !== 'personal-loan-calc' &&
        product.simulatorType !== 'sme-revolving-line' &&
        product.simulatorType !== 'mortgage-schedule' &&
        product.simulatorType !== 'bnpl-split' && (
          <div className="space-y-4 text-left">
            <div className="grid grid-cols-2 gap-3">
              {product.specs.slice(0, 2).map((spec, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700">
                  <p className="text-[10px] uppercase font-bold text-slate-400 font-mono">{spec.label}</p>
                  <p className="text-base font-bold text-emerald-400 mt-0.5 font-mono">{spec.value}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 font-bold">Protocol Status</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ONLINE 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {product.problemSolved.impact}
              </p>
            </div>

            <button
              onClick={triggerSimulateAction}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Executing Protocol...' : `Test ${product.name} Workflow`}</span>
            </button>
          </div>
        )}

      {/* Footer status message */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Security: 256-Bit SSL Encrypted</span>
        <span className="text-emerald-400 font-bold">{statusMsg}</span>
      </div>
    </div>
  );
};
