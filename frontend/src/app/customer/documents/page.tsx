'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderLock,
  Upload,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FilePlus,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CustomerDocumentsPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState('IDENTITY_PROOF');
  const [documentType, setDocumentType] = useState('AADHAAR_CARD');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers/me');
      setCustomer(res.data.data);
    } catch (err: any) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !customer?.id) return;

    try {
      setUploading(true);
      setUploadError(null);
      setUploadSuccess(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customerId', customer.id);
      formData.append('category', category);
      formData.append('documentType', documentType);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadSuccess(`Document "${selectedFile.name}" uploaded successfully to secure Cloud Vault!`);
      setSelectedFile(null);
      fetchProfile();
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || 'Document upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading document vault...</p>
        </div>
      </div>
    );
  }

  const documents = customer?.documents || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Secure Documents Vault
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Store, verify, and download KYC identity proofs, loan agreements, and sanction letters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Document Upload Form */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload New Document</h3>
                <p className="text-xs text-slate-500">AES-256 encrypted storage</p>
              </div>
            </div>

            {uploadSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                {uploadSuccess}
              </div>
            )}

            {uploadError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-xs font-semibold text-rose-800 dark:text-rose-300">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Document Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E2445] px-3 text-xs font-medium focus:border-brand-500 focus:outline-none"
                >
                  <option value="IDENTITY_PROOF">Identity Proof (Aadhaar / PAN / Passport)</option>
                  <option value="ADDRESS_PROOF">Address Proof (Utility Bill / Rent)</option>
                  <option value="INCOME_PROOF">Income Proof (Salary Slip / ITR)</option>
                  <option value="BANK_STATEMENT">Bank Account Statement</option>
                  <option value="OTHER">Other Verification File</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Document Type Label *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E2445] px-3 text-xs font-medium focus:border-brand-500 focus:outline-none"
                >
                  <option value="AADHAAR_CARD">Aadhaar Card (UIDAI)</option>
                  <option value="PAN_CARD">PAN Card (ITD)</option>
                  <option value="PASSPORT">Passport Document</option>
                  <option value="SALARY_SLIP">Recent Salary Slip</option>
                  <option value="BANK_STATEMENT">6-Month Bank Statement</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  File Attachment (PDF/Image) *
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept="image/*,application/pdf"
                  required
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-500/10 file:text-brand-600 hover:file:bg-brand-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {uploading ? 'Encrypting & Uploading...' : 'Upload File to Vault →'}
              </button>
            </form>
          </div>
        </div>

        {/* Right 2 Cols: Documents List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <FolderLock className="h-4 w-4 text-brand-600" />
                Uploaded Documents ({documents.length})
              </h3>
            </div>

            {documents.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No files uploaded to your document vault yet.
              </p>
            ) : (
              <div className="space-y-3">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1E2445]/40 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {doc.originalName || doc.fileName || doc.documentType}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {doc.category} • {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                        VERIFIED ✓
                      </span>
                      {doc.fileUrl && (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
                          title="Download File"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
