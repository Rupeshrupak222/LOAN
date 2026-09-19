import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { Card, Badge, Button, Spinner } from '@/components/ui';
import { ShieldCheck, CheckCircle2, AlertTriangle, UserCheck, FileCheck, RefreshCw } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

interface VerificationWorkspaceProps {
  applicationId: string;
}

export function VerificationWorkspace({ applicationId }: VerificationWorkspaceProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const isCreditAnalyst = user?.roles?.includes('CREDIT_ANALYST');
  const isAdmin = user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN'].includes(r));
  const canTriggerVerification = isCreditAnalyst || isAdmin;

  // 1. Fetch Verification Summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['verification-summary', applicationId],
    queryFn: async () => (await api.get(`/verification/application/${applicationId}/summary`)).data.summary,
  });

  // 2. Fetch Application for Document List
  const { data: appData, isLoading: appLoading } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => (await api.get(`/applications/${applicationId}`)).data.data,
  });

  // Mutations for Provider APIs
  const verifyDocMutation = useMutation({
    mutationFn: async (documentId: string) => await api.post(`/verification/document/${documentId}/verify`),
    onSuccess: () => {
      toast.success('Document verification provider check completed.');
      queryClient.invalidateQueries({ queryKey: ['verification-summary', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Provider Error' });
    }
  });

  const verifyKycMutation = useMutation({
    mutationFn: async (customerId: string) => await api.post(`/verification/customer/${customerId}/kyc`),
    onSuccess: () => {
      toast.success('KYC verification provider check completed.');
      queryClient.invalidateQueries({ queryKey: ['verification-summary', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
    onError: (err: any) => {
      toast.error(apiErrorMessage(err), { title: 'Provider Error' });
    }
  });

  if (summaryLoading || appLoading) return <div className="p-10 text-center"><Spinner size="lg" /></div>;
  if (!summaryData || !appData) return <div className="p-10 text-center">Failed to load verification workspace.</div>;

  const customerId = appData.customer?.id || appData.customerId;
  const docs = [...(appData.customer?.documents || []), ...(appData.documents || [])];
  
  // Deduplicate docs by ID
  const uniqueDocs = Array.from(new Map(docs.map((d: any) => [d.id, d])).values());

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <Card className="p-5 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Verification Engine Status</h3>
              <p className="text-xs text-slate-500">Automated system verification status for KYC and Documents</p>
            </div>
          </div>
          <Badge status={summaryData.isComplete ? 'VERIFIED' : 'PENDING'} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={cn("p-4 rounded-xl border flex flex-col gap-3", summaryData.kyc.isVerified ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50" : "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50")}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="w-4 h-4" /> KYC Status
                </h4>
                <p className="text-xs text-slate-500 mt-1">Provider matching via NSDL/UIDAI</p>
              </div>
              <Badge status={summaryData.kyc.status} />
            </div>
            {canTriggerVerification && !summaryData.kyc.isVerified && (
              <Button 
                size="sm" 
                className="w-full mt-2" 
                onClick={() => verifyKycMutation.mutate(customerId)}
                disabled={verifyKycMutation.isPending}
              >
                {verifyKycMutation.isPending ? <Spinner size="sm" className="mr-2" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
                Run KYC Verification API
              </Button>
            )}
          </div>

          <div className={cn("p-4 rounded-xl border flex flex-col gap-3", summaryData.documents.isComplete ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50" : "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50")}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <FileCheck className="w-4 h-4" /> Mandatory Documents
                </h4>
                <p className="text-xs text-slate-500 mt-1">Rule-based mandatory fulfillment</p>
              </div>
              <Badge status={summaryData.documents.isComplete ? 'VERIFIED' : 'PENDING'} />
            </div>
            {!summaryData.documents.isComplete && summaryData.documents.missingMandatory.length > 0 && (
              <div className="text-xs text-amber-700 bg-amber-100/50 p-2 rounded">
                Missing: {summaryData.documents.missingMandatory.join(', ')}
              </div>
            )}
          </div>
        </div>
      </Card>

      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 px-1 pt-4">Uploaded Documents Verification</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {uniqueDocs.map((doc: any) => (
          <Card key={doc.id} className="p-4 flex flex-col justify-between gap-4">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase text-slate-500">{doc.category || 'DOCUMENT'}</span>
                <Badge status={doc.status} />
              </div>
              <p className="text-sm font-bold truncate" title={doc.fileName}>{doc.fileName || doc.documentType}</p>
              {doc.rejectionReason && (
                <p className="text-[10px] text-rose-600 mt-1 line-clamp-2 bg-rose-50 p-1 rounded">
                  Reason: {doc.rejectionReason}
                </p>
              )}
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Updated: {doc.updatedAt ? formatDate(doc.updatedAt) : 'N/A'}</span>
                {doc.verifiedBy && <span>By: {doc.verifiedBy}</span>}
              </div>
              {canTriggerVerification && doc.status !== 'VERIFIED' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => verifyDocMutation.mutate(doc.id)}
                  disabled={verifyDocMutation.isPending}
                  className="w-full mt-1"
                >
                  {verifyDocMutation.isPending && verifyDocMutation.variables === doc.id ? <Spinner size="sm" className="mr-2" /> : <RefreshCw className="w-3.5 h-3.5 mr-2" />}
                  Verify via Provider API
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
