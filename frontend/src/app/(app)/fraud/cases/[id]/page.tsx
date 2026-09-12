'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { FraudCaseDesk } from '@/features/fraud/components/FraudCaseDesk';
import { FraudCase } from '@/features/fraud/types';
import { getFraudCaseById } from '@/features/fraud/api';
export default function FraudCaseDetailPage() {
  const params = useParams();
  const caseId = params?.id as string;

  const [fraudCase, setFraudCase] = useState<FraudCase | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCase = async () => {
    setLoading(true);
    try {
      const res = await getFraudCaseById(caseId);
      setFraudCase(res);
    } catch (err: any) {
      // Fallback demo state
      setFraudCase({
        id: caseId,
        caseNo: caseId,
        tenantId: 'tenant-adyapan-default',
        applicationId: 'app-demo-001',
        applicationNo: 'APP-2026-001',
        customerId: 'cust-demo-002',
        customerCode: 'CUST-002',
        customerName: 'Rohan Verma',
        riskScore: 40,
        fraudScore: 65,
        outcome: 'HIGH_RISK',
        status: 'IN_REVIEW',
        triggeringSignals: [
          {
            id: 'sig-1',
            code: 'FRAUD_BANK_ACCOUNT_REUSE',
            name: 'Shared Bank Account Reuse',
            category: 'BANK_ACCOUNT',
            actualValue: 'HDFC0001928374',
            thresholdValue: 'Single Profile Account',
            severity: 'HIGH',
            scoreImpact: 35,
            reason: 'Bank account is linked to another existing borrower profile (Aarav Sharma).',
            recommendedAction: 'Verify cancelled cheque and physically verify account ownership.',
          },
        ],
        evidence: [
          {
            id: 'ev-1',
            type: 'BANK_STATEMENT',
            title: 'Penny Drop Verification Record',
            description: 'Name returned by penny-drop API diverges from borrower declaration.',
            addedBy: 'SYSTEM_AUTOMATION',
            addedAt: new Date().toISOString(),
          },
        ],
        notes: [
          {
            id: 'n-1',
            userId: 'user-investigator',
            userName: 'Fraud Desk Officer',
            userRole: 'FRAUD_ANALYST',
            note: 'Case initiated for investigation into shared bank account and lexical name divergence.',
            timestamp: new Date().toISOString(),
          },
        ],
        assignedToUserId: 'user-investigator',
        assignedToName: 'Fraud Desk Officer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      loadCase();
    }
  }, [caseId]);

  if (loading) {
    return <div className="p-12 text-center text-xs font-semibold text-slate-400">Loading Case #{caseId}...</div>;
  }

  if (!fraudCase) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Case not found.</p>
        <Link href="/fraud/cases" className="text-xs text-blue-600 font-semibold hover:underline">Return to Cases</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link href="/fraud/cases" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Fraud Cases
        </Link>
      </div>

      <FraudCaseDesk fraudCase={fraudCase} onRefresh={loadCase} />
    </div>
  );
}
