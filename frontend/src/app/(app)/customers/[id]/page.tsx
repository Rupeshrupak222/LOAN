'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  ShieldCheck,
  Building,
  CreditCard,
  FileText,
  Wallet,
  Receipt,
  AlertCircle,
  Plus,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Cloud,
  UploadCloud,
  ExternalLink,
  Image as ImageIcon,
  Landmark,
  Trash2,
  Pencil,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatMoney, formatDate, formatDateTime, cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'kyc_docs' | 'banking' | 'applications' | 'loans' | 'payments' | 'collections'
  >('overview');

  // KYC modal state
  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [kycStatusInput, setKycStatusInput] = useState('VERIFIED');
  const [riskCategoryInput, setRiskCategoryInput] = useState('LOW');
  const [kycRemarks, setKycRemarks] = useState('');

  // Document Upload Modal State (Cloudinary Integration)
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docCategory, setDocCategory] = useState('IDENTITY_PROOF');
  const [docType, setDocType] = useState('PAN_CARD');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [docExpiry, setDocExpiry] = useState('');

  // Document Verification Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [docDecisionStatus, setDocDecisionStatus] = useState<'VERIFIED' | 'REJECTED' | 'UNDER_REVIEW'>('VERIFIED');
  const [docRejectionReason, setDocRejectionReason] = useState('');
  const [docVerifyRemarks, setDocVerifyRemarks] = useState('');

  // Bank Account Modal State
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankNameInput, setBankNameInput] = useState('');
  const [accountNumberInput, setAccountNumberInput] = useState('');
  const [ifscCodeInput, setIfscCodeInput] = useState('');
  const [accountHolderInput, setAccountHolderInput] = useState('');
  const [accountTypeInput, setAccountTypeInput] = useState<'SAVINGS' | 'CURRENT' | 'SALARY'>('SAVINGS');
  const [isPrimaryBankInput, setIsPrimaryBankInput] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Edit Customer Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: 'MALE',
    addressLine: '',
    city: '',
    state: '',
    pincode: '',
    employmentType: 'SALARIED',
    employerName: '',
    monthlyIncome: '',
    bankName: '',
    bankAccountNo: '',
    bankIfsc: '',
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['customer', params.id],
    queryFn: async () => (await api.get(`/customers/${params.id}`)).data.data,
  });

  function openEditModal() {
    if (!data) return;
    const primaryAddr = data.addresses?.find((a: any) => a.isPrimary) || data.addresses?.[0];
    const primaryBank = data.bankAccounts?.find((b: any) => b.isPrimary) || data.bankAccounts?.[0];
    const primaryEmp = data.employmentDetails?.[0];

    setEditForm({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      mobile: data.mobile || '',
      email: data.email || '',
      password: '',
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
      gender: data.gender || 'MALE',
      addressLine: data.addressLine || primaryAddr?.addressLine || '',
      city: data.city || primaryAddr?.city || '',
      state: data.state || primaryAddr?.state || '',
      pincode: data.pincode || primaryAddr?.pincode || '',
      employmentType: data.employmentType || primaryEmp?.employmentType || 'SALARIED',
      employerName: data.employerName || primaryEmp?.employerName || '',
      monthlyIncome: data.monthlyIncome ? String(data.monthlyIncome) : primaryEmp?.monthlyIncome ? String(primaryEmp.monthlyIncome) : '',
      bankName: data.bankName || primaryBank?.bankName || '',
      bankAccountNo: data.bankAccountNo || primaryBank?.accountNumber || '',
      bankIfsc: data.bankIfsc || primaryBank?.ifscCode || '',
    });
    setEditModalOpen(true);
  }

  const updateCustomerMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...editForm,
        email: editForm.email || undefined,
        password: editForm.password && editForm.password.trim().length >= 6 ? editForm.password.trim() : undefined,
        dateOfBirth: editForm.dateOfBirth ? editForm.dateOfBirth : undefined,
        gender: editForm.gender || undefined,
        monthlyIncome: editForm.monthlyIncome ? Number(editForm.monthlyIncome) : undefined,
      };
      return api.patch(`/customers/${params.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', params.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setEditModalOpen(false);
    },
  });

  const bankAccountMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/customers/${params.id}/bank-accounts`, {
        bankName: bankNameInput,
        accountNumber: accountNumberInput,
        ifscCode: ifscCodeInput.toUpperCase().trim(),
        accountHolderName: accountHolderInput.trim() || `${data?.firstName || ''} ${data?.lastName || ''}`.trim(),
        accountType: accountTypeInput,
        isPrimary: isPrimaryBankInput,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', params.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setBankModalOpen(false);
      setBankNameInput('');
      setAccountNumberInput('');
      setIfscCodeInput('');
      setAccountHolderInput('');
    },
  });

  const kycMutation = useMutation({
    mutationFn: async () => {
      return api.patch(`/customers/${params.id}/kyc`, {
        kycStatus: kycStatusInput,
        riskCategory: riskCategoryInput,
        remarks: kycRemarks,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', params.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['underwriting-queue'] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setKycModalOpen(false);
    },
  });

  const docUploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error('Please select a file to upload to Cloudinary');
      }

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('customerId', params.id);
      formData.append('category', docCategory);
      formData.append('documentType', docType);
      if (docExpiry) formData.append('expiryDate', docExpiry);

      return api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', params.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDocModalOpen(false);
      setSelectedFile(null);
      setFilePreview(null);
      setDocExpiry('');
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async () => {
      return api.delete(`/customers/${params.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      router.push('/customers');
    },
  });

  const docVerifyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDoc) return;
      return api.patch(`/documents/${selectedDoc.id}/verify`, {
        status: docDecisionStatus,
        rejectionReason:
          docDecisionStatus === 'REJECTED'
            ? docRejectionReason.trim() || 'Document rejected by compliance officer'
            : docVerifyRemarks.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', params.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setVerifyModalOpen(false);
      setSelectedDoc(null);
      setDocRejectionReason('');
      setDocVerifyRemarks('');
    },
  });

  const docDeleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      return api.delete(`/documents/${docId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', params.id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-slate-700 font-semibold">Customer record not found or could not be loaded.</p>
        <p className="text-xs text-slate-400">{error ? apiErrorMessage(error) : 'Check customer ID or permissions'}</p>
        <Link href="/customers">
          <Button size="sm" variant="secondary">Back to Customers Directory</Button>
        </Link>
      </div>
    );
  }

  const addresses = Array.isArray(data.addresses) ? data.addresses : [];
  const documents = Array.isArray(data.documents) ? data.documents : [];
  const bankAccounts = Array.isArray(data.bankAccounts) ? data.bankAccounts : [];
  const applications = Array.isArray(data.applications) ? data.applications : [];
  const loans = Array.isArray(data.loans) ? data.loans : [];
  const payments = Array.isArray(data.payments) ? data.payments : [];
  const collectionCases = Array.isArray(data.collectionCases) ? data.collectionCases : [];
  const summary = data.summary || {};

  const tabs = [
    { id: 'overview', label: 'Overview & Profile', icon: User },
    { id: 'kyc_docs', label: 'KYC & Documents', icon: ShieldCheck },
    { id: 'banking', label: 'Employment & Bank', icon: Building },
    { id: 'applications', label: `Applications (${applications.length})`, icon: FileText },
    { id: 'loans', label: `Loans (${loans.length})`, icon: Wallet },
    { id: 'payments', label: `Payments (${payments.length})`, icon: Receipt },
    { id: 'collections', label: `Collections (${collectionCases.length})`, icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        breadcrumb="Customers / Borrower 360"
        title={`${data.firstName || 'Customer'} ${data.lastName || ''}`}
        subtitle={`${data.customerCode || 'CUST'} · Mobile: ${data.mobile || 'N/A'} · ${data.city || 'No city'}, ${data.state || 'No state'}`}
        action={
          <div className="flex items-center gap-2">
            <Badge status={data.status} />
            <Badge status={data.kycStatus} />
            {data.riskCategory && <Badge status={data.riskCategory} />}
            {user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'].includes(r)) && (
              <Button size="sm" variant="secondary" onClick={() => setKycModalOpen(true)}>
                Update KYC Status
              </Button>
            )}
            {user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'].includes(r)) && (
              <Button
                size="sm"
                variant="secondary"
                onClick={openEditModal}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </Button>
            )}
            {user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'].includes(r)) && (
              <Link href="/applications">
                <Button size="sm" className="flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Originate Loan
                </Button>
              </Link>
            )}
            {user?.roles?.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER'].includes(r)) && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDeleteModalOpen(true)}
                className="flex items-center gap-1.5 text-rose-600 hover:bg-rose-50 border-rose-200 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Profile
              </Button>
            )}
          </div>
        }
      />

      {/* Primary Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Borrowed"
          value={formatMoney(summary.totalBorrowed || 0)}
          hint="Cumulative sanctioned amount"
          icon={<Wallet className="h-4 w-4" />}
        />
        <KpiCard
          label="Current Outstanding"
          value={formatMoney(summary.currentOutstanding || 0)}
          hint={`${summary.activeLoans || loans.length || 0} active loan accounts`}
          icon={<CreditCard className="h-4 w-4 text-brand-700" />}
        />
        <KpiCard
          label="Total Repaid"
          value={formatMoney(summary.totalRepaid || 0)}
          hint="Principal & interest settled"
          icon={<CheckCircle className="h-4 w-4 text-emerald-600" />}
        />
        <KpiCard
          label="Risk Assessment"
          value={data.riskCategory || 'PENDING'}
          hint={data.kycStatus === 'VERIFIED' ? 'Identity verified' : 'KYC incomplete'}
          icon={<ShieldCheck className="h-4 w-4 text-slate-600" />}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                active
                  ? 'border-brand-600 text-brand-700 bg-brand-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Personal Information
            </h3>
            <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
              <Row label="Full Name" value={`${data.firstName || ''} ${data.lastName || ''}`} />
              <Row label="Customer ID" value={<span className="font-mono text-brand-700 font-semibold">{data.customerCode}</span>} />
              <Row label="Mobile Number" value={data.mobile} />
              <Row label="Email Address" value={data.email || 'Not provided'} />
              <Row
                label="Borrower Portal Login"
                value={
                  data.userId || data.email ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active (Login Enabled via {data.email})
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">No login credentials set</span>
                  )
                }
              />
              <Row label="Date of Birth" value={data.dateOfBirth ? formatDate(data.dateOfBirth) : '-'} />
              <Row label="Gender" value={data.gender || '-'} />
              <Row label="Registered Branch" value={data.branch?.name || 'Head Office'} />
              <Row label="Onboarded On" value={data.createdAt ? formatDateTime(data.createdAt) : '-'} />
            </dl>
          </Card>

          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Addresses on Record
            </h3>
            {addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map((addr: any) => (
                  <div key={addr.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                        {addr.addressType} ADDRESS
                      </span>
                      {addr.isPrimary && (
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 font-medium">{addr.addressLine}</p>
                    <p className="text-slate-500 mt-0.5">
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4">No structured address records found.</p>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: KYC & Documents */}
      {activeTab === 'kyc_docs' && (
        <Card noPadding className="p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                KYC Compliance & Document Vault
              </h3>
              <p className="text-xs text-slate-500">Identity proofs, income documents, bank statements, and signed mandates</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setDocModalOpen(true)}>
                + Upload Document
              </Button>
              <Button size="sm" onClick={() => setKycModalOpen(true)}>
                Update KYC Status
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Document Type</th>
                  <th className="py-2.5 px-3">File / Storage</th>
                  <th className="py-2.5 px-3">Verification</th>
                  <th className="py-2.5 px-3">Verified By</th>
                  <th className="py-2.5 px-3">Uploaded Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.length > 0 ? (
                  documents.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800 text-xs">
                        {doc.category}
                      </td>
                      <td className="py-3 px-3 text-slate-600 text-xs font-medium">
                        {doc.documentType || 'DOCUMENT'}
                      </td>
                      <td className="py-3 px-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-medium text-brand-700 truncate max-w-[160px]">
                            {doc.fileName}
                          </span>
                          {doc.storageKey?.startsWith('http') && (
                            <a
                              href={doc.storageKey}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded hover:bg-sky-100 transition"
                              title="Open on Cloudinary CDN"
                            >
                              <Cloud className="h-3 w-3" /> View ↗
                            </a>
                          )}
                        </div>
                        {doc.sizeBytes && (
                          <span className="text-[10px] text-slate-400">
                            {doc.sizeBytes > 1024 * 1024
                              ? `${(doc.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                              : `${Math.round(doc.sizeBytes / 1024)} KB`}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <Badge status={doc.status || (doc.verified ? 'VERIFIED' : 'PENDING')} />
                          {doc.status === 'REJECTED' && doc.rejectionReason && (
                            <span
                              className="text-[10px] text-rose-600 font-semibold block truncate max-w-[170px]"
                              title={doc.rejectionReason}
                            >
                              Reason: {doc.rejectionReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">{doc.verifiedBy || '-'}</td>
                      <td className="py-3 px-3 text-xs text-slate-400">{doc.createdAt ? formatDateTime(doc.createdAt) : '-'}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {doc.storageKey?.startsWith('http') && (
                            <a
                              href={doc.storageKey}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-brand-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
                            >
                              <ExternalLink className="h-3 w-3" /> Open
                            </a>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            className="text-xs h-7 px-2.5"
                            onClick={() => {
                              setSelectedDoc(doc);
                              const initialStatus = doc.status === 'REJECTED' ? 'REJECTED' : 'VERIFIED';
                              setDocDecisionStatus(initialStatus);
                              setDocRejectionReason(doc.rejectionReason || '');
                              setDocVerifyRemarks(doc.rejectionReason || '');
                              setVerifyModalOpen(true);
                            }}
                          >
                            {doc.status === 'VERIFIED' ? 'Review' : doc.status === 'REJECTED' ? 'Re-verify' : 'Verify'}
                          </Button>
                          <button
                            type="button"
                            title="Delete Document"
                            onClick={() => {
                              if (confirm(`Delete document "${doc.fileName}" from database?`)) {
                                docDeleteMutation.mutate(doc.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                      No documents uploaded yet for this borrower. Click <strong>+ Upload Document</strong> to upload photos or proofs to Cloudinary.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Banking & Employment */}
      {activeTab === 'banking' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Employment & Income Profile
            </h3>
            <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
              <Row label="Employment Type" value={data.employmentType || 'Not specified'} />
              <Row label="Employer / Company" value={data.employerName || '-'} />
              <Row label="Monthly Gross Income" value={data.monthlyIncome ? formatMoney(data.monthlyIncome) : '-'} />
              <Row label="Fixed Liabilities" value={data.existingObligations ? formatMoney(data.existingObligations) : '₹0.00'} />
            </dl>
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Bank Accounts on Record
                </h3>
                <p className="text-xs text-slate-500">Accounts verified for NEFT loan disbursements & repayments</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="text-xs flex items-center gap-1"
                onClick={() => {
                  setAccountHolderInput(`${data?.firstName || ''} ${data?.lastName || ''}`.trim());
                  setBankModalOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> Add Bank Account
              </Button>
            </div>

            {bankAccounts.length > 0 ? (
              <div className="space-y-3">
                {bankAccounts.map((acc: any) => (
                  <div key={acc.id} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold">
                          <Landmark className="h-3.5 w-3.5" />
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{acc.bankName}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {acc.isPrimary && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                            PRIMARY
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          {acc.accountType || 'SAVINGS'}
                        </span>
                        {acc.isVerified ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                            VERIFIED
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                            PENDING
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">Account Number</span>
                        <p className="font-mono font-bold text-brand-700 text-xs">{acc.accountNumber}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-medium">IFSC Code</span>
                        <p className="font-mono font-bold text-slate-800 text-xs">{acc.ifscCode}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 font-medium">Account Holder Name</span>
                        <p className="font-semibold text-slate-900 text-xs">{acc.accountHolderName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-2">
                <Landmark className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No bank accounts registered for this borrower yet.</p>
                <p className="text-[11px] text-slate-400">Add a bank account to enable electronic NEFT payouts and repayment auto-debit.</p>
                <Button
                  size="sm"
                  className="text-xs text-white mt-1"
                  onClick={() => {
                    setAccountHolderInput(`${data?.firstName || ''} ${data?.lastName || ''}`.trim());
                    setBankModalOpen(true);
                  }}
                >
                  + Add Bank Account
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 4: Applications */}
      {activeTab === 'applications' && (
        <Card noPadding className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Loan Applications History
              </h3>
              <p className="text-xs text-slate-500">Track all origination and underwriting requests</p>
            </div>
            <Link href="/applications/new">
              <Button size="sm">+ New Application</Button>
            </Link>
          </div>

          {applications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Application No</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Requested Amount</th>
                    <th className="py-2.5 px-3">Tenure</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app: any) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-brand-700 text-xs">{app.applicationNo}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium text-xs">{app.product?.name || 'Loan'}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 text-xs">{formatMoney(app.requestedAmount)}</td>
                      <td className="py-3 px-3 text-slate-600 text-xs">{app.tenureMonths} Months</td>
                      <td className="py-3 px-3"><Badge status={app.status} /></td>
                      <td className="py-3 px-3 text-right">
                        <Link href={`/applications/${app.id}`}>
                          <Button size="sm" variant="secondary" className="text-xs">
                            View 360 →
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No loan applications on record.</p>
          )}
        </Card>
      )}

      {/* Tab 5: Loans */}
      {activeTab === 'loans' && (
        <Card noPadding className="p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Loan Accounts & Servicing
          </h3>
          {loans.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {loans.map((loan: any) => (
                <div key={loan.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-base">{loan.loanNo}</p>
                      <p className="text-xs text-slate-500">{loan.product?.name || 'Loan'}</p>
                    </div>
                    <Badge status={loan.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400">Sanctioned Principal</p>
                      <p className="font-semibold text-slate-800 text-sm">{formatMoney(loan.principal)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Monthly EMI</p>
                      <p className="font-semibold text-slate-800 text-sm">{formatMoney(loan.emiAmount)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Outstanding Balance</p>
                      <p className="font-bold text-brand-700 text-sm">{formatMoney(loan.outstandingPrincipal)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Interest Rate</p>
                      <p className="font-semibold text-slate-800 text-sm">{loan.interestRate}% p.a.</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <Link href={`/loans/${loan.id}`}>
                      <Button size="sm" variant="secondary" className="text-xs">
                        Amortization & Pay →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No active or closed loan accounts.</p>
          )}
        </Card>
      )}

      {/* Tab 6: Payments */}
      {activeTab === 'payments' && (
        <Card noPadding className="p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Repayment Ledger & Transactions
          </h3>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Receipt No</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Reference / UTR</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((pmt: any) => (
                    <tr key={pmt.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-brand-700 text-xs">{pmt.paymentNo}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 text-xs">{formatMoney(pmt.amount)}</td>
                      <td className="py-3 px-3 text-slate-600 font-medium text-xs">{pmt.method}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">{pmt.reference || '-'}</td>
                      <td className="py-3 px-3"><Badge status={pmt.status} /></td>
                      <td className="py-3 px-3 text-xs text-slate-400">{pmt.paidAt ? formatDateTime(pmt.paidAt) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No payment transactions recorded.</p>
          )}
        </Card>
      )}

      {/* Tab 7: Collections */}
      {activeTab === 'collections' && (
        <Card className="p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Collections & Delinquency Record
          </h3>
          {collectionCases.length > 0 ? (
            <div className="space-y-3">
              {collectionCases.map((c: any) => (
                <div key={c.id} className="rounded-xl border border-rose-200 bg-rose-50/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-rose-900 text-sm">{c.caseNo}</p>
                      <p className="text-xs text-rose-700 font-medium mt-0.5">
                        DPD: {c.dpd} Days · Bucket: {c.agingBucket} DPD
                      </p>
                    </div>
                    <Badge status={c.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-900 font-bold">
                    Overdue Balance: {formatMoney(c.overdueAmount)}
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Link href="/collections">
                      <Button size="sm" variant="secondary" className="text-xs">
                        Delinquency Board →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-emerald-700 font-medium py-6 text-center bg-emerald-50/50 rounded-xl border border-emerald-200/60">
              ✓ Customer has zero collection cases or overdue delinquencies.
            </p>
          )}
        </Card>
      )}

      {/* KYC Update Modal */}
      {kycModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-dropdown animate-fade-in space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Update KYC Compliance Status</h3>
              <p className="text-xs text-slate-500">Set borrower verification state and risk categorization</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">KYC Status</label>
                <select
                  value={kycStatusInput}
                  onChange={(e) => setKycStatusInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-600 focus:outline-none"
                >
                  <option value="VERIFIED">VERIFIED (Full Approval)</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW (Pending Verification)</option>
                  <option value="SUBMITTED">SUBMITTED (Documents Received)</option>
                  <option value="REJECTED">REJECTED (Non-Compliant / Blocked)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Risk Category</label>
                <select
                  value={riskCategoryInput}
                  onChange={(e) => setRiskCategoryInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-600 focus:outline-none"
                >
                  <option value="LOW">LOW RISK</option>
                  <option value="MEDIUM">MEDIUM RISK</option>
                  <option value="HIGH">HIGH RISK</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Verification Remarks</label>
                <Input
                  placeholder="e.g. Identity and address proofs validated"
                  value={kycRemarks}
                  onChange={(e) => setKycRemarks(e.target.value)}
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <Button
                  onClick={() => kycMutation.mutate()}
                  disabled={kycMutation.isPending}
                  className="flex-1 text-white"
                >
                  {kycMutation.isPending ? 'Updating...' : 'Confirm Update'}
                </Button>
                <Button variant="secondary" onClick={() => setKycModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal (Cloudinary Storage) */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-dropdown animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Cloud className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Upload to Cloudinary Vault</h3>
                  <p className="text-xs text-slate-500">Secure cloud storage for borrower photos and proofs</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-700">
                Cloudinary CDN
              </span>
            </div>

            <div className="space-y-3.5">
              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Document or Capture Photo *
                </label>
                <div className="relative border-2 border-dashed border-sky-200 rounded-2xl p-4 bg-sky-50/40 hover:bg-sky-50/80 transition-colors text-center cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        if (file.type.startsWith('image/')) {
                          setFilePreview(URL.createObjectURL(file));
                        } else {
                          setFilePreview(null);
                        }
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <UploadCloud className="h-8 w-8 text-sky-500 animate-pulse" />
                    <p className="text-xs font-bold text-slate-800">
                      {selectedFile ? selectedFile.name : 'Click or Drag & Drop File Here'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready to upload`
                        : 'Supports PAN, Aadhaar, Salary Slips, Photos (JPG, PNG, PDF up to 10MB)'}
                    </p>
                  </div>
                </div>

                {/* Live Image Preview */}
                {filePreview && (
                  <div className="mt-2.5 p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <img
                      src={filePreview}
                      alt="Upload Preview"
                      className="h-16 w-16 object-cover rounded-lg border border-slate-300"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900 truncate max-w-[240px]">{selectedFile?.name}</p>
                      <p className="text-[11px] text-slate-500">Image thumbnail preview verified</p>
                      <span className="text-[10px] text-emerald-600 font-bold">✓ Ready for cloud stream</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-600 focus:outline-none"
                >
                  <option value="APPLICANT_PHOTO">APPLICANT PHOTO / SELFIE (Customer Passport Photo)</option>
                  <option value="IDENTITY_PROOF">IDENTITY PROOF (PAN Card, Aadhaar Card, Passport)</option>
                  <option value="ADDRESS_PROOF">ADDRESS PROOF (Utility Bill, Rental Agreement)</option>
                  <option value="INCOME_PROOF">INCOME PROOF (Salary Slips, Form 16, ITR 3Y)</option>
                  <option value="BANK_STATEMENT">BANK STATEMENT (3-6 Months Banking Record)</option>
                  <option value="EMPLOYMENT_PROOF">EMPLOYMENT PROOF (Offer Letter, Corporate ID)</option>
                  <option value="PROPERTY_DOCS">PROPERTY / COLLATERAL DOCUMENTS</option>
                  <option value="MANDATE_DOCS">NACH / E-MANDATE FORM</option>
                  <option value="OTHER">OTHER COMPLIANCE DOCUMENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Type / Label</label>
                <Input
                  placeholder="e.g. PAN_CARD, AADHAAR_FRONT, CUSTOMER_PHOTO, SALARY_SLIP_DEC_2025"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Expiry Date (Optional)</label>
                <Input
                  type="date"
                  value={docExpiry}
                  onChange={(e) => setDocExpiry(e.target.value)}
                />
              </div>

              {docUploadMutation.isError && (
                <p className="text-xs text-rose-600">{apiErrorMessage(docUploadMutation.error)}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button
                  onClick={() => docUploadMutation.mutate()}
                  disabled={!selectedFile || docUploadMutation.isPending}
                  className="flex-1 bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-1.5"
                >
                  {docUploadMutation.isPending ? (
                    'Uploading to Cloudinary...'
                  ) : (
                    <>
                      <Cloud className="h-4 w-4" /> Upload to Cloudinary
                    </>
                  )}
                </Button>
                <Button variant="secondary" onClick={() => setDocModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Verification Modal */}
      {verifyModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Verify / Reject Borrower Document</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedDoc.fileName}</p>
              </div>
              <Badge status={selectedDoc.status || (selectedDoc.verified ? 'VERIFIED' : 'PENDING')} />
            </div>

            {/* Cloudinary Document Preview */}
            {selectedDoc.storageKey?.startsWith('http') && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 space-y-2 text-center">
                {selectedDoc.contentType?.startsWith('image/') || selectedDoc.fileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                  <div className="max-h-56 overflow-hidden rounded-lg flex items-center justify-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <img
                      src={selectedDoc.storageKey}
                      alt={selectedDoc.fileName}
                      className="max-h-52 object-contain"
                    />
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center justify-center gap-1.5">
                    <FileText className="h-10 w-10 text-brand-700 dark:text-brand-400" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">PDF / Compliance Document</p>
                  </div>
                )}
                <div className="flex justify-center">
                  <a
                    href={selectedDoc.storageKey}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 bg-white dark:bg-[#1E2445] border border-sky-200 dark:border-sky-900 px-3 py-1.5 rounded-lg shadow-2xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View Original in Cloudinary CDN ↗
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Decision Choice */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Verification Decision *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDocDecisionStatus('VERIFIED')}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer',
                      docDecisionStatus === 'VERIFIED'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Approve (VERIFIED)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocDecisionStatus('REJECTED')}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer',
                      docDecisionStatus === 'REJECTED'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <XCircle className="h-3.5 w-3.5 text-rose-600" />
                      <span>Reject (REJECTED)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDocDecisionStatus('UNDER_REVIEW')}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer',
                      docDecisionStatus === 'UNDER_REVIEW'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      <span>Under Review</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* If Rejected: Show Rejection Presets & Input */}
              {docDecisionStatus === 'REJECTED' && (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/30 space-y-2.5 animate-in fade-in-50 duration-150">
                  <label className="block text-xs font-bold text-rose-800 dark:text-rose-300">
                    Select Reason for Document Rejection *
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Blurry / Unreadable Scan',
                      'Name Mismatch with Profile',
                      'Expired Document',
                      'Incomplete / Cut-off Pages',
                      'Wrong Document Uploaded',
                      'NSDL / UIDAI Verification Failed',
                    ].map((reason) => (
                      <button
                        type="button"
                        key={reason}
                        onClick={() => setDocRejectionReason(reason)}
                        className={cn(
                          'text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer',
                          docRejectionReason === reason
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'bg-white dark:bg-[#1E2445] text-slate-700 dark:text-slate-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100'
                        )}
                      >
                        {reason}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Detailed Rejection Remarks (Visible to borrower)
                    </label>
                    <Input
                      placeholder="e.g. Please upload a clear color photo of original PAN card"
                      value={docRejectionReason}
                      onChange={(e) => setDocRejectionReason(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* If Verified: Show Audit Remarks */}
              {docDecisionStatus === 'VERIFIED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Verification / Audit Note (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Cross-referenced against NSDL / UIDAI records"
                    value={docVerifyRemarks}
                    onChange={(e) => setDocVerifyRemarks(e.target.value)}
                  />
                </div>
              )}

              {docVerifyMutation.isError && (
                <p className="text-xs text-rose-600">{apiErrorMessage(docVerifyMutation.error)}</p>
              )}

              <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  onClick={() => docVerifyMutation.mutate()}
                  disabled={
                    docVerifyMutation.isPending ||
                    (docDecisionStatus === 'REJECTED' && !docRejectionReason.trim())
                  }
                  className={cn(
                    'flex-1 text-white font-bold',
                    docDecisionStatus === 'VERIFIED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : docDecisionStatus === 'REJECTED'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-amber-600 hover:bg-amber-700'
                  )}
                >
                  {docVerifyMutation.isPending
                    ? 'Submitting...'
                    : docDecisionStatus === 'VERIFIED'
                    ? 'Confirm Approval (VERIFIED)'
                    : docDecisionStatus === 'REJECTED'
                    ? 'Reject Document (REJECTED)'
                    : 'Mark as Under Review'}
                </Button>
                <Button variant="secondary" onClick={() => setVerifyModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {bankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-dropdown animate-fade-in space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold">
                  <Landmark className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Bank Account</h3>
                  <p className="text-xs text-slate-500">Record bank details for loan disbursements</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Name *
                </label>
                <Input
                  placeholder="e.g. HDFC Bank / State Bank of India / ICICI"
                  value={bankNameInput}
                  onChange={(e) => setBankNameInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Number *
                </label>
                <Input
                  placeholder="e.g. 50100234567890"
                  value={accountNumberInput}
                  onChange={(e) => setAccountNumberInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  IFSC Code (11 Digits) *
                </label>
                <Input
                  placeholder="e.g. HDFC0001234"
                  value={ifscCodeInput}
                  onChange={(e) => setIfscCodeInput(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Holder Name *
                </label>
                <Input
                  placeholder="Borrower's name as on bank passbook"
                  value={accountHolderInput}
                  onChange={(e) => setAccountHolderInput(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
                  <select
                    value={accountTypeInput}
                    onChange={(e) => setAccountTypeInput(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-brand-600 focus:outline-none"
                  >
                    <option value="SAVINGS">SAVINGS</option>
                    <option value="CURRENT">CURRENT</option>
                    <option value="SALARY">SALARY</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isPrimaryBankInput}
                      onChange={(e) => setIsPrimaryBankInput(e.target.checked)}
                      className="rounded text-brand-600 h-4 w-4"
                    />
                    <span>Set as Primary</span>
                  </label>
                </div>
              </div>

              {bankAccountMutation.isError && (
                <p className="text-xs text-rose-600">{apiErrorMessage(bankAccountMutation.error)}</p>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button
                  onClick={() => bankAccountMutation.mutate()}
                  disabled={
                    !bankNameInput.trim() ||
                    !accountNumberInput.trim() ||
                    !ifscCodeInput.trim() ||
                    bankAccountMutation.isPending
                  }
                  className="flex-1 text-white"
                >
                  {bankAccountMutation.isPending ? 'Saving...' : 'Save Bank Account'}
                </Button>
                <Button variant="secondary" onClick={() => setBankModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-md p-6 space-y-4 shadow-2xl border-rose-200 dark:border-rose-900/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Customer Profile</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Permanently erase from database</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong>{data.firstName} {data.lastName}</strong> ({data.customerCode})? This will permanently wipe their customer profile, documents, bank records, and borrower portal login credentials from the database.
            </p>

            {deleteCustomerMutation.isError && (
              <p className="text-xs text-rose-600">{apiErrorMessage(deleteCustomerMutation.error)}</p>
            )}

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteCustomerMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                onClick={() => deleteCustomerMutation.mutate()}
                disabled={deleteCustomerMutation.isPending}
              >
                {deleteCustomerMutation.isPending ? 'Deleting...' : 'Yes, Delete Customer'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Customer Profile Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB] dark:bg-blue-950/60 dark:text-[#60A5FA]">
                  <Pencil className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Customer Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update profile, demographic records, bank details, and portal login
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateCustomerMutation.mutate();
              }}
              className="space-y-4"
            >
              {/* 1. Basic Info */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Personal & Contact Information
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">First Name *</label>
                    <Input
                      value={editForm.firstName}
                      onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Last Name *</label>
                    <Input
                      value={editForm.lastName}
                      onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Mobile Number *</label>
                    <Input
                      value={editForm.mobile}
                      onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Email Address (Portal Username)</label>
                    <Input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Date of Birth</label>
                    <Input
                      type="date"
                      value={editForm.dateOfBirth}
                      onChange={(e) => setEditForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value }))}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-[#1E2445] dark:text-slate-200"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Update Portal Password (Optional)
                    </label>
                    <div className="relative">
                      <Input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editForm.password}
                        onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Leave blank to keep existing password unchanged"
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Location */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  2. Address & Location
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-3">
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Address Line</label>
                    <Input
                      value={editForm.addressLine}
                      onChange={(e) => setEditForm((f) => ({ ...f, addressLine: e.target.value }))}
                      placeholder="Street, locality, landmark"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">City</label>
                    <Input
                      value={editForm.city}
                      onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">State</label>
                    <Input
                      value={editForm.state}
                      onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Pincode</label>
                    <Input
                      value={editForm.pincode}
                      onChange={(e) => setEditForm((f) => ({ ...f, pincode: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* 3. Employment */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  3. Employment & Income
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Employment Type</label>
                    <select
                      value={editForm.employmentType}
                      onChange={(e) => setEditForm((f) => ({ ...f, employmentType: e.target.value }))}
                      className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-[#1E2445] dark:text-slate-200"
                    >
                      <option value="SALARIED">Salaried Employee</option>
                      <option value="SELF_EMPLOYED">Self-Employed / Business</option>
                      <option value="PROFESSIONAL">Self-Employed Professional</option>
                      <option value="STUDENT">Student</option>
                      <option value="HOMEMAKER">Homemaker</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Employer / Business</label>
                    <Input
                      value={editForm.employerName}
                      onChange={(e) => setEditForm((f) => ({ ...f, employerName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Monthly Income (INR)</label>
                    <Input
                      type="number"
                      value={editForm.monthlyIncome}
                      onChange={(e) => setEditForm((f) => ({ ...f, monthlyIncome: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Bank Account */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  4. Bank Account Details
                </h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Bank Name</label>
                    <Input
                      value={editForm.bankName}
                      onChange={(e) => setEditForm((f) => ({ ...f, bankName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">Account Number</label>
                    <Input
                      value={editForm.bankAccountNo}
                      onChange={(e) => setEditForm((f) => ({ ...f, bankAccountNo: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">IFSC Code</label>
                    <Input
                      value={editForm.bankIfsc}
                      onChange={(e) => setEditForm((f) => ({ ...f, bankIfsc: e.target.value.toUpperCase() }))}
                    />
                  </div>
                </div>
              </div>

              {updateCustomerMutation.isError && (
                <p className="text-xs text-rose-600">{apiErrorMessage(updateCustomerMutation.error)}</p>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditModalOpen(false)}
                  disabled={updateCustomerMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-white font-bold"
                  disabled={updateCustomerMutation.isPending}
                >
                  {updateCustomerMutation.isPending ? 'Saving Updates...' : 'Save & Sync Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-slate-500 font-medium">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{value ?? '-'}</dd>
    </div>
  );
}
