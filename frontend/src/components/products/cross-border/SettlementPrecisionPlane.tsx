'use client';

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Layers,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   SettlementPrecisionPlane — "THE SETTLEMENT PRECISION PLANE"
   ─────────────────────────────────────────────────────────────
   ▸ 5-Layer Architectural Alignment:
     1. Origin (KYC & OFAC Authenticated)
     2. FX (Interbank Mid-Market Fixed)
     3. Route (SWIFT GPI Direct Tunnel)
     4. Settlement (Central Bank RTGS Netting)
     5. Destination (Credited to Beneficiary IBAN)
   ══════════════════════════════════════════════════════════════ */

interface SettlementLayer {
  step: string;
  name: string;
  protocol: string;
  status: string;
}

const SETTLEMENT_LAYERS: SettlementLayer[] = [
  { step: '01', name: 'Origin KYC Verification', protocol: 'Sanctions & AML Automated Clear', status: 'Locked' },
  { step: '02', name: 'Interbank FX Conversion', protocol: 'Mid-Market USD/GBP Lock', status: 'Locked' },
  { step: '03', name: 'Direct Corridor Routing', protocol: 'Zero-Intermediary SWIFT Tunnel', status: 'Locked' },
  { step: '04', name: 'RTGS Central Clearing', protocol: 'Bank of England CHAPS Finality', status: 'Locked' },
  { step: '05', name: 'Beneficiary IBAN Credit', protocol: 'Instant Ledger Deposit', status: 'Complete' },
];

export const SettlementPrecisionPlane: React.FC = () => {
  return (
    <section className="relative py-16 sm:py-24 max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-slate-800 bg-[#071A33] text-white p-8 sm:p-14 max-w-[1400px] mx-auto text-left shadow-2xl relative overflow-hidden space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold font-mono text-blue-300 bg-blue-900/40 border border-blue-700 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>5-LAYER PRECISION ARCHITECTURE</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white">The Settlement Precision Plane</h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800 self-start sm:self-auto">
            100% ATOMIC SETTLEMENT FINALITY
          </span>
        </div>

        {/* 5 Layer Physical Locking Slices */}
        <div className="space-y-3 font-mono text-xs">
          {SETTLEMENT_LAYERS.map((layer) => (
            <div
              key={layer.step}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold flex items-center justify-center shrink-0">
                  {layer.step}
                </span>
                <div>
                  <span className="text-sm font-bold text-white block">{layer.name}</span>
                  <span className="text-[10px] text-slate-400">{layer.protocol}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-emerald-400 font-bold self-end sm:self-auto">
                <CheckCircle2 className="w-4 h-4" />
                <span>{layer.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>All 5 layers synchronize instantaneously, eliminating settlement risk and failed transfer recalls.</span>
          </div>
          <span className="text-blue-300 font-bold">ISO 20022 STP Standard</span>
        </div>
      </div>
    </section>
  );
};
