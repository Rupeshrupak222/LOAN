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
      const res = await api.get<{ data: any }>('/api/v1/borrower/home');
      return res.data?.data || res.data;
    },
  });

  const { data: requirements = [], isLoading: loadingReqs } = useQuery({
    queryKey: ['documents-requirements'],
    queryFn: async () => {
      const res = await api.get<{ data: any }>('/api/v1/documents/applicable-requirements');
      return res.data?.data?.requirements || [];
    },
  });

  const { data: documents = [], isLoading: loadingDocs, refetch } = useQuery({
    queryKey: ['my-documents'],
    queryFn: async () => {
      const res = await api.get<{ data: any[] }>('/api/v1/documents');
      return res.data?.data || [];
    },
  });

  if (loadingReqs || loadingDocs) {
    return (
      <div className="py-24 text-center">
        <Spinner />
        <p className="text-xs text-slate-400 mt-2">Loading document requirements...</p>
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
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-400" />
              Document Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely upload and manage your KYC and income verification documents
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-400 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-blue-100">Bank-Grade Security</h3>
          <p className="text-xs text-blue-300/80 mt-1">
            All your documents are encrypted using AES-256 and stored securely. They are only accessed by authorized credit assessment systems for underwriting your loan.
          </p>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requirements.map((req: any) => {
          const { status, label, color } = getDocStatus(req.type);
          
          return (
            <div key={req.type} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{req.name}</h3>
                    {req.isMandatory && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold uppercase">Required</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{req.description}</p>
                </div>
                
                {status === 'VERIFIED' && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
                {status === 'UNDER_REVIEW' && <Clock className="w-6 h-6 text-blue-400" />}
                {status === 'REJECTED' && <XCircle className="w-6 h-6 text-red-500" />}
                {status === 'REQUIRED' && <AlertCircle className="w-6 h-6 text-amber-500" />}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <Badge variant={
                  color === 'emerald' ? 'success' : 
                  color === 'red' ? 'danger' : 
                  color === 'blue' ? 'info' : 'default'
                } className="text-xs">
                  {label}
                </Badge>

                {status !== 'VERIFIED' && status !== 'UNDER_REVIEW' && (
                  <Button size="sm" className="bg-slate-800 hover:bg-slate-700 text-xs text-white">
                    <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Upload File
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {requirements.length === 0 && (
         <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-white">No Documents Required Currently</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
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
