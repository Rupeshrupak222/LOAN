'use client';

import React, { useState } from 'react';
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Smartphone,
  Server,
  Building2,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface Endpoint {
  id: string;
  category: string;
  title: string;
  method: string;
  endpoint: string;
  description: string;
}

const ENDPOINTS: Endpoint[] = [
  {
    id: 'accounts',
    category: 'Deposit & Accounts',
    title: 'Core Account Operations',
    method: 'GET',
    endpoint: '/v1/accounts/{account_id}/balance',
    description: 'Fetch sub-second real-time balances, interest accruals, and ledger locks across corporate deposit vaults.',
  },
  {
    id: 'payments',
    category: 'Payments & Switch',
    title: 'Instant Rail Disbursal',
    method: 'POST',
    endpoint: '/v1/payments/disburse',
    description: 'Initiate atomic IMPS, NEFT, RTGS, or NPCI UPI 2.0 payouts with instant idempotency guarantees.',
  },
  {
    id: 'lending',
    category: 'Lending Solutions',
    title: 'Origination & Disbursal',
    method: 'POST',
    endpoint: '/v1/lending/originate',
    description: 'Automate loan underwriting, credit assessment calls, and split disbursement schedules.',
  },
  {
    id: 'cards',
    category: 'Card Issuance',
    title: 'Virtual & Physical Cards',
    method: 'POST',
    endpoint: '/v1/cards/virtual/issue',
    description: 'Provision tokenized virtual debit cards instantly with programmable MCC spending allowances.',
  },
  {
    id: 'webhooks',
    category: 'Event Notifications',
    title: 'Real-Time Webhooks',
    method: 'POST',
    endpoint: '/v1/webhooks/subscribe',
    description: 'Sub-second event streaming for transaction completions, risk flags, and ledger reconciliations.',
  },
  {
    id: 'audit',
    category: 'Audit & Compliance',
    title: '7-Year WORM Audit Logs',
    method: 'GET',
    endpoint: '/v1/audit/journals/export',
    description: 'Export immutable, cryptographically signed double-entry audit journals for statutory inspection.',
  },
];

export const ConnectOnceMatrix: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('payments');

  return (
    <section className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Layers className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>UNIFIED ARCHITECTURE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          Connect Once. Reach Every Financial Service.
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          One authentication token and one SDK grant your development team seamless access to the entire Adyapan banking mesh.
        </p>
      </div>

      {/* Grid of Endpoints */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
        {ENDPOINTS.map((ep) => {
          const isSelected = selectedEndpoint === ep.id;
          return (
            <div
              key={ep.id}
              onClick={() => setSelectedEndpoint(ep.id)}
              className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer space-y-4 shadow-sm ${
                isSelected
                  ? 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white border-[#155EEF] shadow-xl ring-2 ring-[#155EEF]/30 scale-[1.02]'
                  : 'bg-white text-[#071A33] border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                    isSelected ? 'bg-white/10 text-blue-200 border-white/20' : 'bg-blue-50 text-[#155EEF] border-blue-200'
                  }`}
                >
                  {ep.category}
                </span>

                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    ep.method === 'POST'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {ep.method}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold">{ep.title}</h3>
                <p
                  className={`font-mono text-[11px] mt-1 truncate ${
                    isSelected ? 'text-blue-300' : 'text-[#155EEF] font-bold'
                  }`}
                >
                  {ep.endpoint}
                </p>
              </div>

              <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                {ep.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
