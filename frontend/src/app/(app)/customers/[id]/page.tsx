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
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, KpiCard, Spinner, Button, Input } from '@/components/ui';
import { formatMoney, formatDate } from '@/lib/utils';
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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['customer', params.id],
    queryFn: async () => (await api.get(`/customers/${params.id}`)).data.data,
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
            <Button size="sm" variant="secondary" onClick={() => setKycModalOpen(true)}>
              Update KYC Status
            </Button>
            <Link href="/applications/new">
              <Button size="sm" className="flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Originate Loan
              </Button>
            </Link>
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
              <Row label="Date of Birth" value={data.dateOfBirth ? formatDate(data.dateOfBirth) : '-'} />
              <Row label="Gender" value={data.gender || '-'} />
              <Row label="Registered Branch" value={data.branch?.name || 'Head Office'} />
              <Row label="Onboarded On" value={data.createdAt ? formatDate(data.createdAt) : '-'} />
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                KYC Compliance & Verification
              </h3>
              <p className="text-xs text-slate-500">Identity proofs, income documents and signed mandates</p>
            </div>
            <Button size="sm" onClick={() => setKycModalOpen(true)}>
              Update KYC Status
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Document Type</th>
                  <th className="py-2.5 px-3">File Name</th>
                  <th className="py-2.5 px-3">Verification Status</th>
                  <th className="py-2.5 px-3">Verified By</th>
                  <th className="py-2.5 px-3">Uploaded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.length > 0 ? (
                  documents.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800 text-xs">{doc.category}</td>
                      <td className="py-3 px-3 text-slate-600 text-xs">{doc.documentType || 'DOCUMENT'}</td>
                      <td className="py-3 px-3 text-brand-700 font-medium text-xs">{doc.fileName}</td>
                      <td className="py-3 px-3">
                        <Badge status={doc.status} />
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-500">{doc.verifiedBy || '-'}</td>
                      <td className="py-3 px-3 text-xs text-slate-400">{doc.createdAt ? formatDate(doc.createdAt) : '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      No documents uploaded yet for this borrower.
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
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Bank Accounts on Record
            </h3>
            {bankAccounts.length > 0 ? (
              <div className="space-y-3">
                {bankAccounts.map((acc: any) => (
                  <div key={acc.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-slate-900">{acc.bankName}</p>
                      {acc.isVerified && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-slate-700 mt-1">A/C: {acc.accountNumber}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">IFSC: {acc.ifscCode} · Holder: {acc.accountHolderName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
                <Row label="Bank Name" value={data.bankName || '-'} />
                <Row label="Account Number" value={data.bankAccountNo ? `••••${data.bankAccountNo.slice(-4)}` : '-'} />
                <Row label="IFSC Code" value={data.bankIfsc || '-'} />
              </dl>
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
                      <td className="py-3 px-3 text-xs text-slate-400">{pmt.paidAt ? formatDate(pmt.paidAt) : '-'}</td>
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
                  className="flex-1"
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
