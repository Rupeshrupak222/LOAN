'use client';

import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  Layers,
} from 'lucide-react';

interface StreamItem {
  id: string;
  type: 'inflow' | 'outflow';
  party: string;
  category: string;
  amount: number;
  time: string;
}

const STREAM_ITEMS: StreamItem[] = [
  { id: '1', type: 'inflow', party: 'FinTech Hub Client Payout', category: 'Customer Invoicing', amount: 28500, time: '16:42:10' },
  { id: '2', type: 'inflow', party: 'SaaS Subscription Ingest', category: 'Recurring Mandates', amount: 14200, time: '16:41:50' },
  { id: '3', type: 'inflow', party: 'Merchant QR Collection', category: 'Daily Settlements', amount: 5800, time: '16:40:15' },
  { id: '4', type: 'outflow', party: 'AWS Cloud Infrastructure', category: 'Hosting & Compute', amount: 12400, time: '16:39:20' },
  { id: '5', type: 'outflow', party: 'Logistics Vendor Disbursal', category: 'Supply Chain Payout', amount: 6800, time: '16:38:05' },
];

export const CashFlowRiverStream: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [hoveredStream, setHoveredStream] = useState<string | null>(null);

  const totalInflow = STREAM_ITEMS.filter((s) => s.type === 'inflow').reduce((acc, s) => acc + s.amount, 0);
  const totalOutflow = STREAM_ITEMS.filter((s) => s.type === 'outflow').reduce((acc, s) => acc + s.amount, 0);
  const netMovement = totalInflow - totalOutflow;

  const filteredItems = STREAM_ITEMS.filter((s) => (activeFilter === 'all' ? true : s.type === activeFilter));

  return (
    <section id="cash-river" className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Activity className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>REAL-TIME CAPITAL RIVER</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          See Money Move in Real Time
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Continuous liquidity streams connecting receivables, customer collections, payroll, and vendor disbursements into one dynamic treasury equilibrium.
        </p>
      </div>

      {/* Main Flow Canvas */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 max-w-5xl mx-auto shadow-sm space-y-8 text-left">
        {/* Top Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
          <div
            onClick={() => setActiveFilter('inflow')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              activeFilter === 'inflow' ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-slate-50 border-slate-200 hover:bg-emerald-50/50'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-mono text-emerald-700 font-bold">
              <span>TOTAL INFLOW</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600 mt-2">+₹{totalInflow.toLocaleString('en-IN')}.00</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1">3 Customer Collections</p>
          </div>

          <div
            onClick={() => setActiveFilter('outflow')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              activeFilter === 'outflow' ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20' : 'bg-slate-50 border-slate-200 hover:bg-rose-50/50'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-mono text-rose-700 font-bold">
              <span>TOTAL OUTFLOW</span>
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black font-mono text-rose-600 mt-2">-₹{totalOutflow.toLocaleString('en-IN')}.00</p>
            <p className="text-[10px] font-mono text-slate-500 mt-1">2 Vendor Payouts</p>
          </div>

          <div
            onClick={() => setActiveFilter('all')}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              activeFilter === 'all' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-400/20' : 'bg-slate-50 border-slate-200 hover:bg-blue-50/50'
            }`}
          >
            <div className="flex justify-between items-center text-xs font-mono text-[#155EEF] font-bold">
              <span>NET LIQUIDITY POSITION</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black font-mono text-[#071A33] mt-2">+₹{netMovement.toLocaleString('en-IN')}.00</p>
            <p className="text-[10px] font-mono text-emerald-600 font-bold mt-1">Positive Treasury Spread</p>
          </div>
        </div>

        {/* The Visual Stream River */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase">Live Capital Streams</span>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-all ${
                  activeFilter === 'all' ? 'bg-[#155EEF] text-white border-[#155EEF]' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                All Streams
              </button>
              <button
                onClick={() => setActiveFilter('inflow')}
                className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-all ${
                  activeFilter === 'inflow' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Inflows Only
              </button>
              <button
                onClick={() => setActiveFilter('outflow')}
                className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold border transition-all ${
                  activeFilter === 'outflow' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Outflows Only
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredStream(item.id)}
                onMouseLeave={() => setHoveredStream(null)}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs cursor-pointer ${
                  item.type === 'inflow'
                    ? 'hover:border-emerald-400 hover:bg-emerald-50/40 bg-slate-50/60 border-slate-200'
                    : 'hover:border-rose-400 hover:bg-rose-50/40 bg-slate-50/60 border-slate-200'
                } ${hoveredStream === item.id ? 'scale-[1.01] shadow-md' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                      item.type === 'inflow' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.type === 'inflow' ? '↗' : '↘'}
                  </div>
                  <div>
                    <p className="font-bold text-[#071A33] text-sm">{item.party}</p>
                    <p className="text-[10px] text-slate-400">{item.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <span className="text-slate-400 text-[10px]">{item.time}</span>
                  <span
                    className={`font-black text-sm sm:text-base ${
                      item.type === 'inflow' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {item.type === 'inflow' ? '+' : '-'}₹{item.amount.toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
