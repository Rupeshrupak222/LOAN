'use client';

import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  FileCheck,
  ShieldCheck,
  RefreshCw,
  FolderArchive,
} from 'lucide-react';
import type { BorrowerDocumentItem } from '../types';
import { borrowerApi } from '../api';

interface DocumentUploadCenterProps {
  documents: BorrowerDocumentItem[];
  onUploadSuccess?: () => void;
}

const REQUIRED_CATEGORIES = [
  { id: 'IDENTITY_PROOF', label: 'Identity Proof (PAN Card)', desc: 'Valid government PAN card' },
  { id: 'ADDRESS_PROOF', label: 'Address Proof (Aadhaar / Passport / Utility)', desc: 'Valid address documentation' },
  { id: 'INCOME_PROOF', label: 'Income Verification (Salary Slips / ITR)', desc: 'Latest 3 months salary slips or ITR V' },
  { id: 'BANK_STATEMENT', label: 'Bank Account Statements', desc: 'Last 6 months PDF statement' },
];

export const DocumentUploadCenter: React.FC<DocumentUploadCenterProps> = ({ documents, onUploadSuccess }) => {
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<BorrowerDocumentItem | null>(null);

  const handleFileUpload = async (category: string, file: File) => {
    try {
      setUploadingCategory(category);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('fileName', file.name);

      await borrowerApi.uploadDocument(formData);
      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Document upload failed.');
    } finally {
      setUploadingCategory(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-blue-400" />
            Borrower Document Vault
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Securely encrypted 256-bit cloud storage for regulatory compliance and instant underwriting verification.
          </p>
        </div>
      </div>

      {/* Grid of Document Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REQUIRED_CATEGORIES.map((cat) => {
          const existingDoc = documents.find((d) => d.category === cat.id || d.documentType === cat.id);
          const isUploading = uploadingCategory === cat.id;

          return (
            <div
              key={cat.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{cat.label}</h4>
                      <p className="text-xs text-slate-400">{cat.desc}</p>
                    </div>
                  </div>

                  {existingDoc ? (
                    existingDoc.verified || existingDoc.status === 'VERIFIED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : existingDoc.status === 'REJECTED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <AlertCircle className="w-3 h-3" />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        In Review
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">Pending Upload</span>
                  )}
                </div>

                {existingDoc && (
                  <div className="mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[200px] font-mono">{existingDoc.fileName}</span>
                    <span className="text-slate-500">
                      {new Date(existingDoc.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                )}

                {existingDoc?.rejectionReason && (
                  <p className="mt-2 text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                    Reason: {existingDoc.rejectionReason}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
                <label className="cursor-pointer flex-1">
                  <input
                    type="file"
                    disabled={isUploading}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(cat.id, file);
                    }}
                  />
                  <div className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all">
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        Uploading...
                      </>
                    ) : existingDoc ? (
                      <>
                        <UploadCloud className="w-3.5 h-3.5" />
                        Re-upload Document
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                        Upload PDF / Image
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
