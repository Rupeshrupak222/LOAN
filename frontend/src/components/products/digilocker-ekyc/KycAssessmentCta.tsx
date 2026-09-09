'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Sparkles, FileText } from 'lucide-react';

export const KycAssessmentCta: React.FC = () => {
  return (
    <div className="w-full rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6 text-center">
      {/* 5. Verification Status Section */}
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-[#071A33] tracking-tight">
          Verification Complete
        </h2>

        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          All required documents have been successfully verified and are ready for AI-powered loan assessment.
        </p>
      </div>

      {/* 6. Next Step / CTA */}
      <div className="pt-2 max-w-xl mx-auto space-y-3">
        <Link
          href="/products/ai-underwriting"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#155EEF] hover:bg-[#104ec8] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#155EEF]/25 hover:shadow-xl hover:shadow-[#155EEF]/35 transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>Continue to AI Loan Assessment →</span>
        </Link>

        <p className="text-xs text-slate-400 font-medium">
          Proceed with your personalized loan eligibility assessment.
        </p>

        <div className="pt-2">
          <Link
            href="/applications/new"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#155EEF] transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Or proceed directly to Loan Origination Workspace</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};
