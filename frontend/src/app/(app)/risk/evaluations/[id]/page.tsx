'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, History, Scale, Shield, AlertTriangle } from 'lucide-react';
import { RiskScoreCard } from '@/features/risk/components/RiskScoreCard';
import { RiskSignalBreakdown } from '@/features/risk/components/RiskSignalBreakdown';
import { RiskOverrideModal } from '@/features/risk/components/RiskOverrideModal';
import { RiskEvaluationResult } from '@/features/risk/types';
import { getRiskEvaluation, evaluateRisk } from '@/features/risk/api';
import { useToast } from '@/lib/toast';

export default function RiskEvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const applicationId = params?.id as string;

  const [evaluation, setEvaluation] = useState<RiskEvaluationResult | null>(null);
  const [history, setHistory] = useState<RiskEvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getRiskEvaluation(applicationId);
      setEvaluation(res.latest || null);
      setHistory(res.history || []);
    } catch (err: any) {
      // Fallback for demonstration if ID not found
      try {
        const evalRes = await evaluateRisk(applicationId);
        setEvaluation(evalRes);
      } catch {
        toast.info('Loaded fallback evaluation state.', 'Notice');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      loadData();
    }
  }, [applicationId]);

  const handleReEvaluate = async () => {
    try {
      const res = await evaluateRisk(applicationId);
      setEvaluation(res);
      toast.success(`Generated snapshot v${res.evaluationVersion}.`, 'Re-Evaluation Completed');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Evaluation Failed');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs font-semibold text-slate-400">Loading Risk Evaluation Snapshot...</div>;
  }

  if (!evaluation) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No evaluation found for Application #{applicationId}</p>
        <Link href="/risk" className="text-xs text-blue-600 font-semibold hover:underline">Return to Risk Center</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link href="/risk/queue" className="hover:text-blue-600 text-xs font-semibold text-slate-500 flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Risk Queue
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Snapshot ID: {evaluation.id}
        </span>
      </div>

      {/* Main Score Card */}
      <RiskScoreCard
        evaluation={evaluation}
        onReEvaluate={handleReEvaluate}
        onOpenOverride={() => setOverrideModalOpen(true)}
      />

      {/* Snapshot Version History pills */}
      {history.length > 1 && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3">
          <History className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Evaluation History:</span>
          <div className="flex items-center gap-2 overflow-x-auto">
            {history.map((h) => (
              <button
                key={h.id}
                onClick={() => setEvaluation(h)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  evaluation.id === h.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                v{h.evaluationVersion} (Score: {h.riskScore} • Grade {h.riskGrade})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6-Pillar Signal Breakdown */}
      <RiskSignalBreakdown evaluation={evaluation} />

      {/* Override Modal */}
      <RiskOverrideModal
        evaluation={evaluation}
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        onSuccess={(updated) => {
          setEvaluation(updated);
          loadData();
        }}
      />
    </div>
  );
}
