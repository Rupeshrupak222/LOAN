'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { FraudRulesManager } from '@/features/fraud/components/FraudRulesManager';

export default function FraudRulesPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/fraud" className="hover:text-rose-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Fraud Intelligence
        </Link>
      </div>

      <FraudRulesManager />
    </div>
  );
}
