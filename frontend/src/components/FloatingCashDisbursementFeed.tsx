'use client';

import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle2, ShieldCheck, ArrowUpRight } from 'lucide-react';

const LIVE_EVENTS = [
  { name: 'Rahul S.', city: 'Bengaluru', amount: '₹ 25,000', type: 'Instant UPI Disbursal', time: '2s ago', upi: 'gpay' },
  { name: 'Priya M.', city: 'Mumbai', amount: '₹ 45,000', type: 'Split in 3 Months (0%)', time: '5s ago', upi: 'phonepe' },
  { name: 'Ankit K.', city: 'Delhi NCR', amount: '₹ 1,20,000', type: 'Personal Loan to HDFC', time: '9s ago', upi: 'bank' },
  { name: 'Sneha D.', city: 'Pune', amount: '₹ 15,000', type: 'Student Pocket Cash', time: '14s ago', upi: 'paytm' },
  { name: 'Vikram R.', city: 'Hyderabad', amount: '₹ 2,50,000', type: 'MSME Working Capital', time: '18s ago', upi: 'bank' },
  { name: 'Megha T.', city: 'Chennai', amount: '₹ 30,000', type: 'Instant 90s Disbursal', time: '22s ago', upi: 'phonepe' },
];

export function FloatingCashDisbursementFeed() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % LIVE_EVENTS.length);
        setVisible(true);
      }, 400);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const event = LIVE_EVENTS[index];

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/90 px-4 py-2 shadow-soft backdrop-blur-xl transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95'
      }`}
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm animate-pulse">
        <Zap className="h-3.5 w-3.5 fill-white" />
      </div>
      <div className="text-left text-xs">
        <span className="font-extrabold text-slate-900">{event.name}</span>
        <span className="text-slate-500"> ({event.city}) received </span>
        <span className="font-black text-emerald-600">{event.amount}</span>
        <span className="text-[10px] text-slate-400 font-medium"> • {event.time}</span>
      </div>
      <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Transferred
      </span>
    </div>
  );
}
