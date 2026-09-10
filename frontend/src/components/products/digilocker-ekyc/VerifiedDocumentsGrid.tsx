'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  CreditCard,
  FileText,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock,
} from 'lucide-react';

export const VerifiedDocumentsGrid: React.FC = () => {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const toggleDetails = (id: string) => {
    setExpandedDoc(expandedDoc === id ? null : id);
  };

  const documents = [
    {
      id: 'aadhaar',
      name: 'Aadhaar Card',
      authority: 'UIDAI',
      maskId: '•••• •••• 8921',
      icon: UserCheck,
      details: {
        docType: 'Official Digital e-KYC XML',
        authMethod: 'OTP Consent & Biometric Face Match',
        pkiSignature: 'Valid UIDAI CA Root Certificate',
        timestamp: 'Verified via DigiLocker API',
      },
    },
    {
      id: 'pan',
      name: 'PAN Card',
      authority: 'NSDL',
      maskId: '•••••1234F',
      icon: CreditCard,
      details: {
        docType: 'National Tax ID Record',
        authMethod: 'Direct Income Tax Department Database',
        pkiSignature: 'NSDL Encrypted Signature Verified',
        timestamp: 'Active Status Confirmed',
      },
    },
    {
      id: 'dl',
      name: 'Driving Licence',
      authority: 'MoRTH',
      maskId: 'DL-••••••••918',
      icon: FileText,
      details: {
        docType: 'Central Motor Vehicle Register',
        authMethod: 'Sarathi National Registry Query',
        pkiSignature: 'MoRTH Central Digital Stamp',
        timestamp: 'Clear Driving Record Validated',
      },
    },
    {
      id: 'bank',
      name: 'Bank Account',
      authority: 'NPCI / AA',
      maskId: 'A/C •••• 4912',
      icon: Building2,
      details: {
        docType: 'Account Aggregator & Penny-Drop Verification',
        authMethod: '₹1 Penny Drop Name Match (100% Match)',
        pkiSignature: 'NPCI IMPS Instant Bank Settlement',
        timestamp: 'Disbursal Account Whitelisted',
      },
    },
  ];

  return (
    <section className="space-y-6 w-full text-left">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#071A33] tracking-tight">
          Government-Verified Documents
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Documents securely retrieved and verified through DigiLocker.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {documents.map((doc) => {
          const Icon = doc.icon;
          const isExpanded = expandedDoc === doc.id;
          return (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-[#155EEF]/30 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#071A33] tracking-tight">
                    {doc.name}
                  </h3>
                  <p className="text-[11px] font-mono font-medium text-slate-400">
                    {doc.authority}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600 font-bold">{doc.maskId}</span>
                  <button
                    onClick={() => toggleDetails(doc.id)}
                    className="text-[11px] font-sans font-semibold text-[#155EEF] hover:text-[#0d47a1] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{isExpanded ? 'Hide' : 'View Details'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expandable Details Drawer */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600 bg-slate-50/80 p-2.5 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Format:</span>
                    <span className="font-medium text-slate-800 text-right">{doc.details.docType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Security:</span>
                    <span className="font-medium text-emerald-600 text-right">PKI Signed</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Match:</span>
                    <span className="font-medium text-slate-800 text-right">100% Validated</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
