'use client';

import React, { useState } from 'react';
import { Users, ShieldCheck, CheckCircle2, Lock, Key, ArrowRight } from 'lucide-react';

interface RoleProfile {
  id: string;
  role: string;
  badge: string;
  description: string;
  permissions: string[];
}

const ROLES: RoleProfile[] = [
  {
    id: 'founder',
    role: 'Founder & Managing Director',
    badge: 'Super Admin',
    description: 'Full sovereign access to treasury accounts, multi-sign authorizations, and organizational banking partitions.',
    permissions: ['Sole Release for High-Value Transfers', 'Add/Remove Corporate Signatories', 'Full Multi-Tenant Audit Logs'],
  },
  {
    id: 'cfo',
    role: 'Head of Finance / CFO',
    badge: 'Treasury Admin',
    description: 'Manages batch payroll disbursements, credit facility lines, and vendor invoice settlements.',
    permissions: ['Schedule Vendor Batches', 'Approve Secondary Multi-Sign', 'Tax & GST Vault Management'],
  },
  {
    id: 'operations',
    role: 'Operations Lead',
    badge: 'Operator Role',
    description: 'Prepares utility payments, customer refunds, and card issuance requests with strict ceiling limits.',
    permissions: ['Prepare Draft Invoices & Payouts', 'Request Team Card Limits', 'No Direct Sovereign Vault Access'],
  },
  {
    id: 'auditor',
    role: 'External Statutory Auditor',
    badge: 'Read-Only Audit',
    description: 'Read-only inspection access to double-entry journal ledgers, trial balance snapshots, and bank statements.',
    permissions: ['Export 7-Year WORM Audit Logs', 'Inspect Ledger State Diffs', 'Zero Transaction Initiation Rights'],
  },
];

export const MultiUserWorkspaceMatrix: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<string>('founder');

  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      {/* Section Header */}
      <div className="max-w-4xl mx-auto text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold font-mono text-[#155EEF] bg-blue-50 border border-blue-200">
          <Users className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>COLLABORATIVE TREASURY GOVERNANCE</span>
        </div>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#071A33] tracking-tight">
          Granular Role-Based Access for Finance Teams
        </h2>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
          Delegate daily operational workflows while enforcing multi-sign policies and zero-trust auditability across your organization.
        </p>
      </div>

      {/* Interactive Role Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1400px] mx-auto text-left">
        {ROLES.map((r) => {
          const isSelected = selectedRole === r.id;
          return (
            <div
              key={r.id}
              onClick={() => setSelectedRole(r.id)}
              className={`p-7 rounded-3xl border transition-all duration-300 cursor-pointer space-y-4 shadow-sm ${
                isSelected
                  ? 'bg-gradient-to-tr from-[#071A33] via-[#0F294D] to-[#155EEF] text-white border-[#155EEF] shadow-xl ring-2 ring-[#155EEF]/30 scale-[1.02]'
                  : 'bg-white text-[#071A33] border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isSelected ? 'bg-white/10 text-blue-300 border-white/20' : 'bg-blue-50 text-[#155EEF] border-blue-200'
                  }`}
                >
                  {r.badge}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">RBAC Role</span>
              </div>

              <div>
                <h3 className="text-lg font-black">{r.role}</h3>
                <p className={`text-xs mt-1.5 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                  {r.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200/30 space-y-1.5 font-mono text-xs">
                {r.permissions.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-[#155EEF]'}`} />
                    <span className={isSelected ? 'text-slate-200' : 'text-slate-700'}>{p}</span>
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
