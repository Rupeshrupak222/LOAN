'use client';

import React from 'react';
import {
  Building2,
  Database,
  Zap,
  CreditCard,
  RefreshCw,
  Sliders,
  Lock,
  Cpu,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface CapabilityItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ElementType;
  specs: string;
  points: string[];
}

const CAPABILITIES: CapabilityItem[] = [
  {
    id: 'account-lifecycle',
    title: 'Account Management & Multi-Tenant Partitioning',
    category: 'Deposit Architecture',
    description: 'Instantly create, manage, and maintain customer, escrow, and corporate accounts across multi-tenant banking partitions.',
    icon: Building2,
    specs: 'Sub-5ms Provisioning',
    points: ['Logical & Cryptographic Tenant Isolation', 'Virtual Account & Dynamic IBAN Allocation', 'Automated Daily Balance Snapshots'],
  },
  {
    id: 'double-entry',
    title: 'Real-Time Double-Entry Journal Engine',
    category: 'Ledger Invariants',
    description: 'Enforces mathematically verified debit and credit equality on every single financial event before state commit.',
    icon: Database,
    specs: 'NUMERIC(14,2) Exact Math',
    points: ['Zero Floating-Point Drift', 'ACID Transactional Isolation', 'Append-Only Mutation Event Log'],
  },
  {
    id: 'tx-orchestration',
    title: 'Atomic Transaction Orchestration',
    category: 'Execution Pipeline',
    description: 'Coordinates multi-step transaction lifecycles with distributed idempotency locks and automated rollback guarantees.',
    icon: Zap,
    specs: '< 8ms p99 Commit SLA',
    points: ['Distributed Idempotency Protection', 'Live DTI & Anti-Overdraft Policy', 'Sub-Second Webhook Dispatches'],
  },
  {
    id: 'payment-rails',
    title: 'Direct Multi-Rail Payment Gateway',
    category: 'Switch Connectivity',
    description: 'Connects core accounts to high-throughput clearing switches including NPCI UPI, RTGS, NEFT, and IMPS.',
    icon: CreditCard,
    specs: '99.98% Gateway Uptime',
    points: ['Active-Active Bank Failover Routing', 'Direct e-NACH Recurring Mandates', 'Sub-650ms UPI Switch Turnaround'],
  },
  {
    id: 'settlement-recon',
    title: 'Automated Day-End Settlement & Reconciliation',
    category: 'Clearing & Trial Balance',
    description: 'Eliminates manual spreadsheet reconciliation with continuous automated trial balance checks and partner bank batch matching.',
    icon: RefreshCw,
    specs: 'Zero Manual Recon Drift',
    points: ['Automated End-of-Day (EOD) Batch', 'Dispute & Reversal Workflows', 'Real-Time Trial Balance Sync'],
  },
  {
    id: 'product-engine',
    title: 'Configurable Financial Products & Interest Engine',
    category: 'Rule Engine',
    description: 'Deploy custom lending, savings, and overdraft products with configurable reducing-balance interest formulas.',
    icon: Sliders,
    specs: '100% Rule Configurable',
    points: ['Daily Reducing Balance Interest Accrual', 'Waterfall Fee & Penalty Allocation', 'Custom Grace Period Boundaries'],
  },
  {
    id: 'immutable-audit',
    title: 'Immutable Compliance & Event Auditability',
    category: 'Regulatory Governance',
    description: 'Every financial mutation is cryptographically signed and archived into tamper-proof 7-year WORM storage vaults.',
    icon: Lock,
    specs: 'SHA-256 Crypto Chains',
    points: ['Tamper-Evident WORM Vault Storage', '1-Click RBI Inspection Export Packages', 'Role-Based State Diff Tracking'],
  },
  {
    id: 'api-mesh',
    title: 'High-Throughput API-First Integration Mesh',
    category: 'Developer Platform',
    description: 'Expose core banking capabilities through high-speed gRPC protobuf endpoints and clean OpenAPI 3.0 REST schemas.',
    icon: Cpu,
    specs: 'gRPC & REST Ready',
    points: ['Zero-Trust mTLS Authentication', 'Interactive Sandbox Test Harness', 'Deterministic Mock Testing Stubs'],
  },
];

export const CoreCapabilitiesEditorial: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>ENTERPRISE CAPABILITIES</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
          Engineered for Financial Resilience & Scale
        </h2>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Eight architectural pillars supporting mission-critical banking operations for banks, NBFCs, and FinTechs.
        </p>
      </div>

      {/* Editorial 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon;

          return (
            <div
              key={cap.id}
              className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 shadow-xs hover:shadow-xl hover:border-[#155EEF]/50 transition-all duration-300 space-y-4 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#155EEF] flex items-center justify-center group-hover:bg-[#155EEF] group-hover:text-white transition-colors shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{cap.category}</span>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {cap.specs}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-[#071A33] group-hover:text-[#155EEF] transition-colors">
                  {cap.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {cap.description}
                </p>
              </div>

              {/* Bullet Points */}
              <div className="pt-4 border-t border-slate-100 space-y-1.5 font-mono text-xs text-slate-500">
                {cap.points.map((pt, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#155EEF] shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
