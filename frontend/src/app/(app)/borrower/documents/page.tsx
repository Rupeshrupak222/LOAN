'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  FolderOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  UploadCloud,
  Clock,
  ShieldCheck,
  HelpCircle,
  XCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Badge } from '@/components/ui';

export default function BorrowerDocumentsPage() {
  const { data: homeData } = useQuery({
    queryKey: ['borrower-home'],
    queryFn: async () => {
      const res = await api.get<{ data: any }>('/borrower/home');
      return res.data?.data || res.data;
    },
  });

  const { data: requirements = [], isLoading: loadingReqs } = useQuery({
    queryKey: ['documents-requirements'],
    queryFn: async () => {
      const res = await api.get<{ data: any }>('/documents/applicable-requirements');
      return res.data?.data?.requirements || [];
    },
  });

  const { data: documents = [], isLoading: loadingDocs, refetch } = useQuery({
    queryKey: ['my-documents'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/documents');
      return res.data?.data || [];
    },
  });

  if (loadingReqs || loadingDocs) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Loading document requirements...</p>
      </div>
    );
  }

  const getDocStatus = (docType: string) => {
    const uploadedDocs = documents.filter((d: any) => d.documentType === docType);
    if (uploadedDocs.length === 0) return { status: 'REQUIRED', label: 'Upload Required', color: 'slate' };
    
    // Sort by latest
    const latestDoc = uploadedDocs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    switch (latestDoc.verificationStatus) {
      case 'VERIFIED':
        return { status: 'VERIFIED', label: 'Verified', color: 'emerald' };
      case 'REJECTED':
        return { status: 'REJECTED', label: 'Rejected / Re-upload Required', color: 'red' };
      case 'PENDING':
      default:
        return { status: 'UNDER_REVIEW', label: 'Under Review', color: 'blue' };
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Document Center
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Securely upload and manage your KYC and income verification documents
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/80 dark:border-blue-500/30 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Bank-Grade Security</h3>
          <p className="text-xs text-blue-700/90 dark:text-blue-300/80 mt-1">
            All your documents are encrypted using AES-256 and stored securely. They are only accessed by authorized credit assessment systems for underwriting your loan.
          </p>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requirements.map((req: any) => {
          const { status, label, color } = getDocStatus(req.type);
          
          return (
            <div key={req.type} className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{req.name}</h3>
                    {req.isMandatory && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 font-semibold uppercase">Required</span>}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{req.description}</p>
                </div>
                
                {status === 'VERIFIED' && <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />}
                {status === 'UNDER_REVIEW' && <Clock className="w-6 h-6 text-blue-500 shrink-0" />}
                {status === 'REJECTED' && <XCircle className="w-6 h-6 text-red-500 shrink-0" />}
                {status === 'REQUIRED' && <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <Badge variant={
                  color === 'emerald' ? 'success' : 
                  color === 'red' ? 'danger' : 
                  color === 'blue' ? 'info' : 'default'
                } className="text-xs">
                  {label}
                </Badge>

                {status !== 'VERIFIED' && status !== 'UNDER_REVIEW' && (
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-xs text-white">
                    <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Upload File
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {requirements.length === 0 && (
         <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Documents Required Currently</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              Start an application to see the specific documents required for your profile and selected loan product.
            </p>
          </div>
          <Link href="/borrower/apply">
            <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white">
              Start Application
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
