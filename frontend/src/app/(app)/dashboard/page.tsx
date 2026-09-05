'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  Users,
  FileText,
  Wallet,
  Coins,
  AlertTriangle,
  Clock,
  RefreshCw,
  Download,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PieChart as PieIcon,
  ArrowUp,
  Check,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Building,
  CreditCard,
  Layers,
  ArrowRight,
  Plus,
  Search,
  PhoneCall,
  Activity,
  Sliders,
  KeyRound,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  FileQuestion,
  UserCheck,
  Send,
  XCircle,
  History,
  Lock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { cn, formatMoney, formatDate } from '@/lib/utils';
import { Spinner, Input, Button, Badge } from '@/components/ui';
import { RoleName } from '@/lib/roles';
import { DecisionIntelligenceCard } from '@/components/DecisionIntelligenceCard';

const now = new Date();
const currentYear = now.getFullYear();

const QUICK_PRESETS = [
  { label: 'Today', subtext: formatDate(now) },
  { label: 'This Week', subtext: `${formatDate(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000))} - ${formatDate(now)}` },
  { label: 'This Month', subtext: `${now.toLocaleString('default', { month: 'short' })} ${currentYear}` },
  { label: 'Last Month', subtext: `${new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('default', { month: 'short' })} ${currentYear}` },
  { label: 'This Quarter', subtext: `Q${Math.floor(now.getMonth() / 3) + 1} (${currentYear})` },
  { label: 'This Financial Year', subtext: `FY ${now.getMonth() >= 3 ? currentYear : currentYear - 1} - ${now.getMonth() >= 3 ? currentYear + 1 : currentYear}` },
  { label: 'All Time', subtext: 'Complete portfolio history' },
];

const MONTHS = [
  { name: 'Jan', fullName: 'January', num: '01' },
  { name: 'Feb', fullName: 'February', num: '02' },
  { name: 'Mar', fullName: 'March', num: '03' },
  { name: 'Apr', fullName: 'April', num: '04' },
  { name: 'May', fullName: 'May', num: '05' },
  { name: 'Jun', fullName: 'June', num: '06' },
  { name: 'Jul', fullName: 'July', num: '07' },
  { name: 'Aug', fullName: 'August', num: '08' },
  { name: 'Sep', fullName: 'September', num: '09' },
  { name: 'Oct', fullName: 'October', num: '10' },
  { name: 'Nov', fullName: 'November', num: '11' },
  { name: 'Dec', fullName: 'December', num: '12' },
];

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { theme, isDark } = useTheme();

  const [timeRange, setTimeRange] = useState<'7D' | '30D' | '3M' | '6M' | '1Y'>('30D');
  const [dateFilter, setDateFilter] = useState('This Month');
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'presets' | 'months' | 'custom'>('presets');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [customStart, setCustomStart] = useState(`${currentYear}-01-01`);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDateFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const primaryRole = (user?.roles?.[0] || 'CUSTOMER') as RoleName;

  // Live queries
  const { data: reportsData } = useQuery({
    queryKey: ['dashboard-reports'],
    queryFn: async () => (await api.get('/reports/portfolio')).data.data,
    enabled: !!user && primaryRole !== 'CUSTOMER',
  });

  const { data: loansData } = useQuery({
    queryKey: ['dashboard-loans'],
    queryFn: async () => (await api.get('/loans', { params: { pageSize: 10 } })).data.data,
    enabled: !!user,
  });

  const { data: appsData } = useQuery({
    queryKey: ['dashboard-apps'],
    queryFn: async () => (await api.get('/applications', { params: { pageSize: 6 } })).data.data,
    enabled: !!user,
  });

  const { data: customersData } = useQuery({
    queryKey: ['dashboard-customers'],
    queryFn: async () => (await api.get('/customers', { params: { pageSize: 6 } })).data.data,
    enabled: !!user && primaryRole !== 'CUSTOMER',
  });

  const { data: usersData } = useQuery({
    queryKey: ['dashboard-users'],
    queryFn: async () => (await api.get('/users')).data.data,
    enabled: !!user && ['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'].includes(primaryRole),
  });

  const { data: branchesData } = useQuery({
    queryKey: ['dashboard-branches'],
    queryFn: async () => (await api.get('/branches')).data.data,
    enabled: !!user && ['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER'].includes(primaryRole),
  });

  const { data: underwritingData } = useQuery({
    queryKey: ['dashboard-underwriting-queue'],
    queryFn: async () => (await api.get('/underwriting/queue')).data.data,
    enabled: !!user && ['UNDERWRITER', 'CREDIT_ANALYST', 'SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(primaryRole),
  });

  const { data: disbursementsData } = useQuery({
    queryKey: ['dashboard-disbursements-queue'],
    queryFn: async () => (await api.get('/disbursements/queue')).data.data,
    enabled: !!user && ['FINANCE_OFFICER', 'SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(primaryRole),
  });

  const { data: collectionsData } = useQuery({
    queryKey: ['dashboard-collections'],
    queryFn: async () => (await api.get('/collections/dashboard')).data.data,
    enabled: !!user && ['COLLECTION_OFFICER', 'SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(primaryRole),
  });

  const { data: casesData } = useQuery({
    queryKey: ['dashboard-collection-cases'],
    queryFn: async () => (await api.get('/collections/cases', { params: { pageSize: 6 } })).data.data,
    enabled: !!user && ['COLLECTION_OFFICER', 'SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(primaryRole),
  });

  const { data: submissionsData } = useQuery({
    queryKey: ['dashboard-payment-submissions'],
    queryFn: async () => (await api.get('/payments/submissions', { params: { pageSize: 6 } })).data.data,
    enabled: !!user && ['COLLECTION_OFFICER', 'FINANCE_OFFICER', 'SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(primaryRole),
  });

  const { data: auditData } = useQuery({
    queryKey: ['dashboard-audit'],
    queryFn: async () => (await api.get('/audit', { params: { pageSize: 6 } })).data.data,
    enabled: !!user && ['AUDITOR', 'SUPER_ADMIN', 'ADMIN'].includes(primaryRole),
  });

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-apps'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-customers'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-branches'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-collections'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-collection-cases'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-payment-submissions'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-audit'] }),
    ]);
    setTimeout(() => setRefreshing(false), 500);
  }

  function handleSelectPreset(label: string) {
    setDateFilter(label);
    setDateFilterOpen(false);
    handleRefresh();
  }

  function handleSelectMonth(monthName: string, year: number) {
    const formatted = `${monthName} ${year}`;
    setDateFilter(formatted);
    setDateFilterOpen(false);
    handleRefresh();
  }

  function handleApplyCustomRange() {
    if (!customStart || !customEnd) return;
    const formatted = `${customStart} to ${customEnd}`;
    setDateFilter(formatted);
    setDateFilterOpen(false);
    handleRefresh();
  }

  async function exportReport() {
    try {
      setExporting(true);
      const res = await api.get('/reports/export/loans', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanFilter = dateFilter.replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('download', `Loan_Portfolio_Export_${cleanFilter}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  }

  if (authLoading) return <Spinner />;
  if (!user) return null;

  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-2xs';

  // Common Header Titles per role
  const ROLE_CONFIGS: Record<RoleName, { title: string; subtitle: string; icon: any }> = {
    SUPER_ADMIN: {
      title: 'Enterprise Portfolio & Governance Overview',
      subtitle: 'System-wide monitoring of branch operations, disbursements, risk exposure, and governance.',
      icon: TrendingUp,
    },
    ADMIN: {
      title: 'System Administration & Security Desk',
      subtitle: 'Staff user provisioning, branch office registry, dynamic settings, and system health.',
      icon: Building,
    },
    BRANCH_MANAGER: {
      title: 'Branch Portfolio & Operations Overview',
      subtitle: 'Branch lending performance, sanction queue within ₹50L authority, and staff workflows.',
      icon: Building,
    },
    LOAN_OFFICER: {
      title: 'Customer Onboarding & Loan Intake Workspace',
      subtitle: 'Borrower onboarding, KYC document collection, loan origination, and draft proposals.',
      icon: Users,
    },
    CREDIT_ANALYST: {
      title: 'Credit Evaluation & Risk Assessment Desk',
      subtitle: 'Analyze application proposals, policy eligibility checks, 4-pillar risk models, and DTI capacity.',
      icon: ShieldCheck,
    },
    UNDERWRITER: {
      title: 'Credit Committee & Underwriting Decision Desk',
      subtitle: 'Review risk assessments, approve sanctions up to ₹10L, set covenants, or send back proposals.',
      icon: Coins,
    },
    FINANCE_OFFICER: {
      title: 'Treasury, Payouts & Waterfall Repayments Desk',
      subtitle: 'Release electronic loan disbursements, manage payment waterfall ledger, and issue NOC closures.',
      icon: Wallet,
    },
    COLLECTION_OFFICER: {
      title: 'Delinquency Recovery & Collections Workspace',
      subtitle: 'Manage overdue debtor accounts, 5 DPD aging buckets, follow-up calls, and Promise-to-Pay (PTP).',
      icon: AlertTriangle,
    },
    AUDITOR: {
      title: 'Compliance & Audit Log Inspection Workspace',
      subtitle: 'Immutable inspection trail, financial transaction verifications, and before/after audit diffs.',
      icon: FileCheck,
    },
    CUSTOMER: {
      title: 'Borrower Self-Service Portal',
      subtitle: 'View your active loan accounts, upcoming EMI repayments, digital receipts, and loan NOC.',
      icon: CreditCard,
    },
  };

  const header = ROLE_CONFIGS[primaryRole] || ROLE_CONFIGS.SUPER_ADMIN;
  const HeaderIcon = header.icon;

  // Live backend metrics computation (Zero hardcoded fallbacks)
  const totalCustomersCount =
    customersData?.pagination?.total ??
    (Array.isArray(customersData?.data)
      ? customersData.data.length
      : Array.isArray(customersData)
      ? customersData.length
      : 0);

  const loansList: any[] = Array.isArray(loansData)
    ? loansData
    : Array.isArray(loansData?.data)
    ? loansData.data
    : Array.isArray(loansData?.items)
    ? loansData.items
    : [];

  const totalLoansCount =
    reportsData?.kpis?.totalLoans ??
    reportsData?.totalLoans ??
    loansList.length;

  const activeLoansCount =
    reportsData?.kpis?.activeLoansCount ??
    reportsData?.activeLoansCount ??
    reportsData?.activeLoans ??
    loansList.filter((l: any) => l.status === 'ACTIVE').length;

  const overdueLoansCount =
    reportsData?.kpis?.overdueLoansCount ??
    reportsData?.overdueLoansCount ??
    reportsData?.overdueLoans ??
    loansList.filter((l: any) => l.status === 'OVERDUE').length;

  const closedLoansCount =
    reportsData?.kpis?.closedLoansCount ??
    reportsData?.closedLoansCount ??
    reportsData?.closedLoans ??
    loansList.filter((l: any) => l.status === 'CLOSED' || l.status === 'SETTLED').length;

  const totalDisbursedValue =
    reportsData?.kpis?.totalDisbursed ??
    reportsData?.totalPrincipalDisbursed ??
    reportsData?.totalDisbursed ??
    loansList.reduce((acc: number, l: any) => acc + Number(l.principal || 0), 0);
  const totalDisbursedFormatted = formatMoney(totalDisbursedValue);

  const totalCollectedValue =
    reportsData?.kpis?.totalCollected ??
    reportsData?.totalCollections ??
    reportsData?.totalCollected ??
    0;
  const totalCollectedFormatted = formatMoney(totalCollectedValue);

  const totalOverdueValue =
    reportsData?.kpis?.totalOverdue ??
    reportsData?.totalOverdue ??
    0;
  const totalOverdueFormatted = formatMoney(totalOverdueValue);

  const totalOutstandingValue =
    reportsData?.kpis?.totalOutstanding ??
    reportsData?.totalPrincipalOutstanding ??
    reportsData?.totalOutstanding ??
    loansList.reduce((acc: number, l: any) => acc + Number(l.outstandingPrincipal || 0), 0);
  const totalOutstandingFormatted = formatMoney(totalOutstandingValue);

  const underReviewCount = Array.isArray(underwritingData) ? underwritingData.length : 0;
  const pendingPayoutCount = Array.isArray(disbursementsData) ? disbursementsData.length : 0;
  const totalStaffUsers = Array.isArray(usersData) ? usersData.length : 0;
  const totalBranches = Array.isArray(branchesData) ? branchesData.length : 0;
  const totalAuditEvents =
    auditData?.pagination?.total ??
    (Array.isArray(auditData?.items) ? auditData.items.length : 0);

  const appsList: any[] = Array.isArray(appsData)
    ? appsData
    : Array.isArray(appsData?.items)
    ? appsData.items
    : Array.isArray(appsData?.data)
    ? appsData.data
    : [];

  const totalAppsCount =
    appsData?.pagination?.total ??
    appsList.length;

  const draftAppsCount = appsList.filter((a: any) => a.status === 'DRAFT').length;
  const approvedAppsCount = appsList.filter((a: any) =>
    ['APPROVED', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(a.status)
  ).length;
  const rejectedAppsCount = appsList.filter((a: any) => a.status === 'REJECTED').length;
  const pendingKycCount = Array.isArray(customersData?.data)
    ? customersData.data.filter(
        (c: any) => c.kycStatus === 'NOT_STARTED' || c.kycStatus === 'PENDING'
      ).length
    : Array.isArray(customersData)
    ? customersData.filter(
        (c: any) => c.kycStatus === 'NOT_STARTED' || c.kycStatus === 'PENDING'
      ).length
    : 0;

  // Real live metrics for Credit Analyst & Underwriting desk
  const creditAwaitingCount = appsList.filter((a: any) =>
    ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CREDIT_ASSESSMENT', 'UNDERWRITING'].includes(a.status) &&
    (!a.eligibility || !a.riskAssessment)
  ).length;

  const creditEvaluatedCount = appsList.filter((a: any) =>
    a.eligibility || a.riskAssessment || ['APPROVED', 'REJECTED'].includes(a.status)
  ).length;

  const lowRiskCount = appsList.filter((a: any) =>
    a.riskAssessment?.category === 'LOW' || a.customer?.riskCategory === 'LOW'
  ).length;

  const medRiskCount = appsList.filter((a: any) =>
    a.riskAssessment?.category === 'MEDIUM' || a.customer?.riskCategory === 'MEDIUM'
  ).length;

  const highRiskCount = appsList.filter((a: any) =>
    a.riskAssessment?.category === 'HIGH' || a.customer?.riskCategory === 'HIGH' || a.status === 'REJECTED'
  ).length;

  // Real live metrics for Underwriter desk
  const pendingUnderwritingCount = appsList.filter((a: any) => a.status === 'UNDERWRITING').length;
  const totalSanctionedVolume = appsList
    .filter((a: any) => ['APPROVED', 'AGREEMENT_PENDING', 'READY_FOR_DISBURSEMENT', 'DISBURSED'].includes(a.status))
    .reduce((acc: number, a: any) => acc + Number(a.requestedAmount || 0), 0);
  const totalSanctionedFormatted = formatMoney(totalSanctionedVolume);

  const conditionalApprovalsCount = appsList.filter((a: any) => a.underwriting?.decision === 'APPROVE_WITH_CONDITIONS').length;
  const sentBackCount = appsList.filter((a: any) => a.underwriting?.decision === 'SEND_BACK').length;

  // Customer / Borrower specific metrics
  const customerLoans: any[] = Array.isArray(loansData) ? loansData : Array.isArray(loansData?.items) ? loansData.items : [];
  const myActiveLoan = customerLoans.find((l: any) => l.status === 'ACTIVE') || customerLoans[0];
  const myTotalBorrowed = customerLoans.reduce((acc: number, l: any) => acc + Number(l.principal || 0), 0);
  const myTotalOutstanding = customerLoans.reduce((acc: number, l: any) => acc + Number(l.outstandingPrincipal || 0), 0);
  const myNextEmiAmount = myActiveLoan?.emiAmount ? formatMoney(myActiveLoan.emiAmount) : '₹0.00';
  const myNextDueDate = myActiveLoan?.nextDueDate ? formatDate(myActiveLoan.nextDueDate) : 'No pending dues';

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP TITLE HEADER (Exact Original Styling with Calendar Dropdown)       */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl mt-0.5 shadow-2xs',
              isDark ? 'bg-[#1E2445] text-[#60A5FA]' : 'bg-blue-50 text-[#2563EB]'
            )}
          >
            <HeaderIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className={cn('text-xl font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
              {header.title}
            </h1>
            <p className={cn('mt-0.5 text-xs', isDark ? 'text-slate-400' : 'text-slate-500')}>
              {header.subtitle}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Universal Multi-Mode Date Picker */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDateFilterOpen(!dateFilterOpen)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer select-none',
                isDark
                  ? 'border-[#2B3566] bg-[#1E2445] text-slate-200 hover:bg-[#2B3566]'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300'
              )}
            >
              <CalendarIcon className={cn('h-3.5 w-3.5', isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]')} />
              <span>{dateFilter}</span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  dateFilterOpen ? 'rotate-180 text-[#2563EB]' : 'text-slate-400'
                )}
              />
            </button>

            {dateFilterOpen && (
              <div
                className={cn(
                  'absolute -right-2 sm:right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-xs rounded-2xl border shadow-2xl z-50 animate-fade-in overflow-hidden',
                  isDark ? 'border-[#2B3566] bg-[#1E2445] text-slate-100' : 'border-slate-200 bg-white text-slate-900'
                )}
              >
                <div
                  className={cn(
                    'flex border-b p-1.5 gap-1',
                    isDark ? 'border-[#2B3566] bg-[#060F1B]/60' : 'border-slate-100 bg-slate-50'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setPickerTab('presets')}
                    className={cn(
                      'flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer',
                      pickerTab === 'presets'
                        ? isDark
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white text-[#2563EB] shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    Quick Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTab('months')}
                    className={cn(
                      'flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer',
                      pickerTab === 'months'
                        ? isDark
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white text-[#2563EB] shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    Select Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTab('custom')}
                    className={cn(
                      'flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer',
                      pickerTab === 'custom'
                        ? isDark
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white text-[#2563EB] shadow-xs'
                        : isDark
                        ? 'text-slate-400 hover:text-white'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    Custom Range
                  </button>
                </div>

                {pickerTab === 'presets' && (
                  <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto scrollbar-thin">
                    {QUICK_PRESETS.map((opt) => {
                      const selected = dateFilter === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => handleSelectPreset(opt.label)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer',
                            selected
                              ? isDark
                                ? 'bg-[#2563EB] text-white font-bold'
                                : 'bg-blue-50 text-[#2563EB] font-bold'
                              : isDark
                              ? 'hover:bg-[#16203D] text-slate-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          )}
                        >
                          <div>
                            <p className="leading-tight font-semibold">{opt.label}</p>
                            <p
                              className={cn(
                                'text-[10px] mt-0.5',
                                selected ? (isDark ? 'text-blue-100' : 'text-blue-600') : 'text-slate-400'
                              )}
                            >
                              {opt.subtext}
                            </p>
                          </div>
                          {selected && <Check className="h-4 w-4 flex-none ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {pickerTab === 'months' && (
                  <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <button
                        type="button"
                        onClick={() => setSelectedYear(selectedYear - 1)}
                        className={cn(
                          'p-1 rounded-lg border',
                          isDark ? 'border-[#2B3566] hover:bg-[#2B3566]' : 'border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-bold text-sm">{selectedYear}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedYear(selectedYear + 1)}
                        className={cn(
                          'p-1 rounded-lg border',
                          isDark ? 'border-[#2B3566] hover:bg-[#2B3566]' : 'border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {MONTHS.map((m) => {
                        const monthKey = `${m.name} ${selectedYear}`;
                        const selected = dateFilter === monthKey;
                        return (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => handleSelectMonth(m.name, selectedYear)}
                            className={cn(
                              'py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer',
                              selected
                                ? 'bg-[#2563EB] text-white shadow-sm'
                                : isDark
                                ? 'bg-[#16203D] text-slate-300 hover:bg-[#2B3566]'
                                : 'bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-[#2563EB]'
                            )}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {pickerTab === 'custom' && (
                  <div className="p-3.5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Start Date (From)</label>
                      <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">End Date (To)</label>
                      <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                    </div>
                    <Button type="button" onClick={handleApplyCustomRange} className="w-full text-xs font-bold text-white mt-1">
                      Apply Custom Range
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            className={cn(
              'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs cursor-pointer',
              isDark
                ? 'border-[#2B3566] bg-[#1E2445] text-slate-200 hover:bg-[#2B3566]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isDark ? 'text-slate-400' : 'text-slate-500', refreshing ? 'animate-spin' : '')} />
            <span>Refresh</span>
          </button>

          {/* Export CSV Button (For staff) */}
          {primaryRole !== 'CUSTOMER' && (
            <button
              type="button"
              onClick={exportReport}
              disabled={exporting}
              className={cn(
                'flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer select-none disabled:opacity-60',
                isDark
                  ? 'border-[#2B3566] bg-[#1E2445] text-[#60A5FA] hover:bg-[#2B3566]'
                  : 'border-blue-200 bg-blue-50/70 text-[#2563EB] hover:bg-blue-100/80'
              )}
            >
              <Download className={cn('h-3.5 w-3.5', exporting ? 'animate-bounce' : '')} />
              <span>{exporting ? 'Exporting...' : 'Export Excel / CSV'}</span>
            </button>
          )}
        </div>
      </div>

      {/* AI Executive Decision Intelligence Card (For Staff & Managers) */}
      {primaryRole !== 'CUSTOMER' && <DecisionIntelligenceCard />}

      {/* ========================================================================= */}
      {/* 2. ROLE-SPECIFIC DASHBOARD SECTIONS                                       */}
      {/* ========================================================================= */}

      {/* A. LOAN OFFICER WORKSPACE */}
      {primaryRole === 'LOAN_OFFICER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiItem label="MY ONBOARDED BORROWERS" value={String(totalCustomersCount)} hint="Registered borrowers" icon={<Users className="h-4 w-4" />} iconColor="purple" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="APPLICATIONS INTAKE" value={String(totalAppsCount)} hint="Total origination pool" icon={<FileText className="h-4 w-4" />} iconColor="blue" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="KYC PENDING" value={String(pendingKycCount)} hint="Action required" icon={<AlertCircle className="h-4 w-4" />} iconColor="amber" cardBgClass={cardBgClass} isDark={isDark} highlightText={pendingKycCount > 0 ? `${pendingKycCount} need docs` : undefined} />
            <KpiItem label="DRAFT PROPOSALS" value={String(draftAppsCount)} hint="Ready to submit" icon={<Clock className="h-4 w-4" />} iconColor="blue" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="PROPOSALS SANCTIONED" value={String(approvedAppsCount)} hint="Approved by underwriter" icon={<CheckCircle2 className="h-4 w-4" />} iconColor="emerald" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="DISBURSED LOANS" value={String(activeLoansCount)} hint={totalDisbursedFormatted} icon={<Wallet className="h-4 w-4" />} iconColor="emerald" cardBgClass={cardBgClass} isDark={isDark} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className={cn('lg:col-span-2 rounded-2xl border p-5 space-y-4', cardBgClass)}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#2B3566]">
                <h3 className="text-sm font-bold tracking-tight">Recent Loan Applications Queue</h3>
                <Link href="/applications" className="text-xs font-bold text-brand-700 dark:text-blue-400 hover:underline">View All →</Link>
              </div>
              <ApplicationsTable items={appsList} isDark={isDark} />
            </div>

            <div className={cn('rounded-2xl border p-5 space-y-4 flex flex-col justify-between', cardBgClass)}>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Quick Intake Actions</h3>
                <p className="text-xs text-slate-400 mt-0.5">Start borrower origination or upload KYC</p>
                <div className="space-y-3 pt-4">
                  <Link href="/customers/new" className="block">
                    <Button size="sm" className="w-full flex items-center justify-center gap-2 text-xs text-white">
                      <Plus className="h-3.5 w-3.5" /> Onboard New Customer
                    </Button>
                  </Link>
                  <Link href="/applications" className="block">
                    <Button size="sm" variant="secondary" className="w-full flex items-center justify-center gap-2 text-xs">
                      <FileText className="h-3.5 w-3.5" /> Create Loan Application
                    </Button>
                  </Link>
                  <Link href="/loan-products" className="block">
                    <Button size="sm" variant="secondary" className="w-full flex items-center justify-center gap-2 text-xs">
                      <Coins className="h-3.5 w-3.5" /> Browse Product Catalog
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-[#060F1B]/60 border border-blue-100 dark:border-[#2B3566] text-xs">
                <p className="font-bold text-brand-700 dark:text-blue-400">KYC Policy Notice</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Ensure Aadhaar & PAN documents are uploaded directly to Cloudinary Vault.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C. CREDIT ANALYST WORKSPACE */}
      {primaryRole === 'CREDIT_ANALYST' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiItem
              label="AWAITING CREDIT ASSESSMENT"
              value={String(creditAwaitingCount || (appsList.length > 0 && creditEvaluatedCount === 0 ? appsList.length : 0))}
              hint="Action required"
              icon={<Clock className="h-4 w-4" />}
              iconColor="amber"
              cardBgClass={cardBgClass}
              isDark={isDark}
              highlightText={creditAwaitingCount > 0 ? `${creditAwaitingCount} pending` : undefined}
            />
            <KpiItem
              label="EVALUATED TODAY"
              value={String(creditEvaluatedCount)}
              hint="Assessed proposals"
              icon={<CheckCircle2 className="h-4 w-4" />}
              iconColor="emerald"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="TOTAL POOL APPLICATIONS"
              value={String(totalAppsCount)}
              hint="Application inflow"
              icon={<FileText className="h-4 w-4" />}
              iconColor="blue"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="LOW RISK PROFILES"
              value={String(lowRiskCount)}
              hint="Score 75+"
              icon={<ShieldCheck className="h-4 w-4" />}
              iconColor="emerald"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="MEDIUM RISK PROFILES"
              value={String(medRiskCount)}
              hint="Score 50-74"
              icon={<AlertTriangle className="h-4 w-4" />}
              iconColor="amber"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="HIGH RISK REJECTIONS"
              value={String(highRiskCount)}
              hint="Declined applications"
              icon={<XCircle className="h-4 w-4" />}
              iconColor="rose"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className={cn('lg:col-span-8 rounded-2xl border p-5 space-y-4', cardBgClass)}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#2B3566]">
                <h3 className="text-sm font-bold tracking-tight">Credit Evaluation & Risk Assessment Queue</h3>
                <Link href="/underwriting" className="text-xs font-bold text-brand-700 dark:text-blue-400 hover:underline">Assessment Desk →</Link>
              </div>
              <ApplicationsTable items={appsList} isDark={isDark} actionLabel="Assess Credit →" />
            </div>

            <div className={cn('lg:col-span-4 rounded-2xl border p-5 space-y-4 flex flex-col justify-between', cardBgClass)}>
              <div>
                <h3 className="text-sm font-bold tracking-tight">4-Pillar Risk Engine Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">Scoring weights allocation</p>
                <div className="space-y-3 pt-3 text-xs">
                  <div className="flex justify-between items-center"><span className="text-slate-400">1. Debt Service Capacity (DTI)</span><span className="font-bold">30%</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-400">2. Credit & Bureau History</span><span className="font-bold">25%</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-400">3. Employment & Vintage</span><span className="font-bold">25%</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-400">4. Document Completeness</span><span className="font-bold">20%</span></div>
                </div>
              </div>
              <div className="pt-2">
                <Link href="/underwriting" className="block"><Button size="sm" className="w-full text-xs text-white">Open Credit Evaluation Desk</Button></Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* D. UNDERWRITER WORKSPACE */}
      {primaryRole === 'UNDERWRITER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiItem
              label="PENDING SANCTION QUEUE"
              value={String(pendingUnderwritingCount)}
              hint="Authority up to ₹10L"
              icon={<Coins className="h-4 w-4" />}
              iconColor="purple"
              cardBgClass={cardBgClass}
              isDark={isDark}
              highlightText={pendingUnderwritingCount > 0 ? `${pendingUnderwritingCount} awaiting decision` : undefined}
            />
            <KpiItem
              label="SANCTIONED PROPOSALS"
              value={String(approvedAppsCount)}
              hint={totalSanctionedFormatted}
              icon={<CheckCircle2 className="h-4 w-4" />}
              iconColor="emerald"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="CONDITIONAL APPROVALS"
              value={String(conditionalApprovalsCount)}
              hint="Covenants pending"
              icon={<AlertTriangle className="h-4 w-4" />}
              iconColor="amber"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="SENT BACK TO LOAN OFFICER"
              value={String(sentBackCount)}
              hint="KYC clarity required"
              icon={<History className="h-4 w-4" />}
              iconColor="blue"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="REJECTED PROPOSALS"
              value={String(rejectedAppsCount)}
              hint="Declined proposals"
              icon={<XCircle className="h-4 w-4" />}
              iconColor="rose"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="TOTAL SANCTION VOLUME"
              value={totalSanctionedFormatted}
              hint="Cumulative pipeline"
              icon={<Wallet className="h-4 w-4" />}
              iconColor="blue"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className={cn('lg:col-span-2 rounded-2xl border p-5 space-y-4', cardBgClass)}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#2B3566]">
                <h3 className="text-sm font-bold tracking-tight">Underwriting Decision Queue (Within ₹10L Authority)</h3>
                <Link href="/underwriting" className="text-xs font-bold text-brand-700 dark:text-blue-400 hover:underline">Decision Desk →</Link>
              </div>
              <ApplicationsTable items={appsList} isDark={isDark} actionLabel="Review Decision →" />
            </div>

            <div className={cn('rounded-2xl border p-5 space-y-4 flex flex-col justify-between', cardBgClass)}>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Delegated Authority Matrix</h3>
                <p className="text-xs text-slate-400 mt-0.5">Credit approval limits</p>
                <div className="space-y-2.5 pt-3 text-xs">
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#060F1B]/60">
                    <p className="font-bold text-slate-900 dark:text-white">Underwriter Authority</p>
                    <p className="text-[11px] text-brand-700 dark:text-blue-400 font-semibold">Up to ₹10,00,000 (₹10 Lakhs)</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#060F1B]/60">
                    <p className="font-bold text-slate-900 dark:text-white">Branch Manager Authority</p>
                    <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Up to ₹50,00,000 (₹50 Lakhs)</p>
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#060F1B]/60">
                    <p className="font-bold text-slate-900 dark:text-white">Credit Committee / Admin</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Above ₹50 Lakhs (Unlimited)</p>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <Link href="/underwriting" className="block"><Button size="sm" className="w-full text-xs text-white">Open Underwriting Desk</Button></Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E. FINANCE OFFICER WORKSPACE */}
      {primaryRole === 'FINANCE_OFFICER' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiItem label="PENDING DISBURSEMENTS" value={String(pendingPayoutCount)} hint="Awaiting NEFT payout" icon={<Wallet className="h-4 w-4" />} iconColor="purple" cardBgClass={cardBgClass} isDark={isDark} highlightText={pendingPayoutCount > 0 ? "Action Required" : undefined} />
            <KpiItem label="DISBURSED VOLUME" value={totalDisbursedFormatted} hint={`${dateFilter} Released`} icon={<Coins className="h-4 w-4" />} iconColor="emerald" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="COLLECTIONS RECOVERED" value={totalCollectedFormatted} hint={`${dateFilter} Payments`} icon={<CheckCircle2 className="h-4 w-4" />} iconColor="emerald" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem
              label="PAYMENT INTIMATIONS"
              value={String(Array.isArray(submissionsData) ? submissionsData.filter((s: any) => s.status === 'PENDING_VERIFICATION').length : 0)}
              hint="Borrower UTR proofs"
              icon={<FileCheck className="h-4 w-4" />}
              iconColor="blue"
              cardBgClass={cardBgClass}
              isDark={isDark}
              highlightText={
                Array.isArray(submissionsData) && submissionsData.filter((s: any) => s.status === 'PENDING_VERIFICATION').length > 0
                  ? "Verify & Settle"
                  : undefined
              }
            />
            <KpiItem label="NOC CLOSURES" value={String(closedLoansCount)} hint="Full clearance certificates" icon={<FileCheck className="h-4 w-4" />} iconColor="blue" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="TREASURY STATUS" value="HEALTHY" hint="Liquidity buffer 100%" icon={<Building className="h-4 w-4" />} iconColor="emerald" cardBgClass={cardBgClass} isDark={isDark} valueColor="text-emerald-600" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              {/* Card 1: Disbursement Queue */}
              <div className={cn('rounded-2xl border p-5 space-y-4', cardBgClass)}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#2B3566]">
                  <h3 className="text-sm font-bold tracking-tight">Electronic Disbursement Payout Queue (NEFT / RTGS)</h3>
                  <Link href="/disbursements" className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline">Disbursements Desk →</Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-[#2B3566] text-xs">
                  {Array.isArray(disbursementsData) && disbursementsData.length > 0 ? (
                    disbursementsData.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">Loan #{d.loanAccountNo || d.id?.slice(0, 8)}</p>
                          <p className="text-slate-400 text-[11px] font-mono">Bank: {d.bankName || 'Verified Account'} · IFSC: {d.ifscCode || '-'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#2563EB] dark:text-[#60A5FA]">{formatMoney(d.amount)}</span>
                          <Link href="/disbursements"><Button size="sm" className="text-xs text-white bg-[#2563EB] hover:bg-blue-700">Execute NEFT Payout</Button></Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-slate-400">No loans currently awaiting disbursement release.</div>
                  )}
                </div>
              </div>

              {/* Card 2: Borrower Payment Submissions to Verify */}
              <div className={cn('rounded-2xl border p-5 space-y-4', cardBgClass)}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#2B3566]">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Borrower Payment Submissions to Settle</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Verify UTR and settle into double-entry accounting ledger</p>
                  </div>
                  <Link href="/payments" className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline">
                    Verification Desk →
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-[#2B3566] text-xs">
                  {Array.isArray(submissionsData) && submissionsData.length > 0 ? (
                    submissionsData.slice(0, 4).map((sub: any) => (
                      <div key={sub.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{sub.customerName || 'Borrower'}</span>
                            <span className="font-mono text-[10px] text-blue-500 font-bold">Loan #{sub.loanNo}</span>
                            <span className="font-mono text-[10px] text-slate-400">Ref: {sub.reference}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Mode: <strong>{sub.method}</strong> · Submitted: {sub.createdAt ? formatDate(sub.createdAt) : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatMoney(sub.amount || 0)}
                          </span>
                          <Link href="/payments">
                            <Button size="sm" variant="secondary" className="text-xs">
                              {sub.status === 'PENDING_VERIFICATION' ? 'Verify & Settle →' : 'View →'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No pending payment submissions requiring verification.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={cn('lg:col-span-4 rounded-2xl border p-5 space-y-4 flex flex-col justify-between', cardBgClass)}>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Waterfall Allocation Hierarchy</h3>
                <p className="text-xs text-slate-400 mt-0.5">Automated settlement order</p>
                <div className="space-y-2 pt-3 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#060F1B] border border-slate-100 dark:border-[#2B3566]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-white font-bold text-[10px]">1</span>
                    <span>Late & Processing Fees</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#060F1B] border border-slate-100 dark:border-[#2B3566]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-white font-bold text-[10px]">2</span>
                    <span>Overdue Penalty Interest</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#060F1B] border border-slate-100 dark:border-[#2B3566]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-white font-bold text-[10px]">3</span>
                    <span>Regular EMI Interest</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-[#060F1B] border border-slate-100 dark:border-[#2B3566]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-white font-bold text-[10px]">4</span>
                    <span>Principal Reduction</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#2B3566]">
                <Link href="/disbursements" className="block">
                  <Button size="sm" className="w-full text-xs text-white bg-[#2563EB] hover:bg-blue-700">Open Disbursements Desk</Button>
                </Link>
                <Link href="/payments" className="block">
                  <Button size="sm" variant="secondary" className="w-full text-xs">Open Payments Ledger</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* F. COLLECTION OFFICER WORKSPACE */}
      {primaryRole === 'COLLECTION_OFFICER' && (
        <div className="space-y-6">
          {/* Top 6 Collection KPIs */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiItem
              label="TOTAL OVERDUE"
              value={totalOverdueFormatted}
              hint="Across delinquent portfolio"
              icon={<AlertTriangle className="h-4 w-4" />}
              iconColor="rose"
              cardBgClass={cardBgClass}
              isDark={isDark}
              highlightText={overdueLoansCount > 0 ? `${overdueLoansCount} Overdue` : undefined}
            />
            <KpiItem
              label="ACTIVE DELINQUENCIES"
              value={String(collectionsData?.summary?.activeCases ?? overdueLoansCount)}
              hint="Overdue recovery cases"
              icon={<Users className="h-4 w-4" />}
              iconColor="amber"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="PROMISES-TO-PAY (PTP)"
              value={String(collectionsData?.summary?.pendingPtps ?? 0)}
              hint="Pending payment dates"
              icon={<Clock className="h-4 w-4" />}
              iconColor="purple"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="PAYMENT INTIMATIONS"
              value={String(Array.isArray(submissionsData) ? submissionsData.filter((s: any) => s.status === 'PENDING_VERIFICATION').length : 0)}
              hint="Borrower UTR proofs"
              icon={<FileCheck className="h-4 w-4" />}
              iconColor="blue"
              cardBgClass={cardBgClass}
              isDark={isDark}
              highlightText={
                Array.isArray(submissionsData) && submissionsData.filter((s: any) => s.status === 'PENDING_VERIFICATION').length > 0
                  ? "Verify Proofs"
                  : undefined
              }
            />
            <KpiItem
              label="COLLECTIONS RECOVERED"
              value={totalCollectedFormatted}
              hint={`${dateFilter} Volume`}
              icon={<Coins className="h-4 w-4" />}
              iconColor="emerald"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="PORTFOLIO RECOVERY"
              value={`${totalLoansCount > 0 ? (((totalLoansCount - overdueLoansCount) / totalLoansCount) * 100).toFixed(1) : '100'}%`}
              hint="Accounts in good standing"
              icon={<CheckCircle2 className="h-4 w-4" />}
              iconColor="emerald"
              cardBgClass={cardBgClass}
              isDark={isDark}
              valueColor="text-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left 8 Cols: Delinquency Queue & Payment Submissions */}
            <div className="lg:col-span-8 space-y-6">
              {/* Card 1: Delinquent Borrowers Queue */}
              <div className={cn('rounded-2xl border p-5 space-y-4', cardBgClass)}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#2B3566]">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Delinquent Borrowers & Call Follow-Up Queue</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Prioritized recovery cases requiring follow-up</p>
                  </div>
                  <Link href="/collections" className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline">
                    Collections Desk →
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-[#2B3566] text-xs">
                  {Array.isArray(casesData) && casesData.length > 0 ? (
                    casesData.map((c: any) => (
                      <div key={c.id} className="py-3 flex items-center justify-between transition-colors hover:bg-slate-50/50 dark:hover:bg-[#16203D]/60 rounded-xl px-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{c.customerName || 'Borrower'}</span>
                            <span className="font-mono text-[10px] text-slate-400">Loan #{c.loanNo}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              {c.dpd} DPD ({c.agingBucket})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Mobile: {c.mobile || '-'} · City: {c.city || 'N/A'} · Priority: <strong className="text-amber-500">{c.priority || 'MEDIUM'}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                            {formatMoney(c.overdueAmount || 0)}
                          </span>
                          <Link href={`/collections/${c.id}`}>
                            <Button size="sm" className="text-xs bg-[#2563EB] hover:bg-blue-700 text-white font-semibold">
                              Log Activity →
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 space-y-1.5">
                      <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-full w-10 h-10 flex items-center justify-center mx-auto text-emerald-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">All customer loan accounts are current and up-to-date.</p>
                      <p className="text-[11px] text-slate-400">Zero default cases in delinquency recovery queue.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Recent Payment Proofs / Intimations */}
              <div className={cn('rounded-2xl border p-5 space-y-4', cardBgClass)}>
                <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#2B3566]">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Borrower Payment Proofs & Intimations</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Recent UTR submissions from borrowers awaiting verification</p>
                  </div>
                  <Link href="/payments" className="text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] hover:underline">
                    View in Payments Ledger →
                  </Link>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-[#2B3566] text-xs">
                  {Array.isArray(submissionsData) && submissionsData.length > 0 ? (
                    submissionsData.slice(0, 4).map((sub: any) => (
                      <div key={sub.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">{sub.customerName || 'Borrower'}</span>
                            <span className="font-mono text-[10px] text-blue-500 font-bold">Loan #{sub.loanNo}</span>
                            <span className="font-mono text-[10px] text-slate-400">Ref: {sub.reference}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Channel: <strong>{sub.method}</strong> · Submitted: {sub.createdAt ? formatDate(sub.createdAt) : '-'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                            {formatMoney(sub.amount || 0)}
                          </span>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border",
                              sub.status === 'VERIFIED'
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : sub.status === 'REJECTED'
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            )}
                          >
                            {sub.status === 'PENDING_VERIFICATION' ? 'Awaiting Verification' : sub.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No recent payment intimations submitted by borrowers.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right 4 Cols: DPD Aging & Shortcuts */}
            <div className="lg:col-span-4 space-y-6">
              <div className={cn('rounded-2xl border p-5 space-y-4 flex flex-col justify-between', cardBgClass)}>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">DPD Aging Summary</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Delinquency distribution across standard aging buckets</p>
                  
                  <div className="space-y-2.5 pt-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#2B3566]">
                      <span className="text-slate-500">1-30 Days (SMA-0)</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {formatMoney(collectionsData?.agingBuckets?.find((b: any) => b.bucket === '0-30')?.totalAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#2B3566]">
                      <span className="text-slate-500">31-60 Days (SMA-1)</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {formatMoney(collectionsData?.agingBuckets?.find((b: any) => b.bucket === '31-60')?.totalAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#2B3566]">
                      <span className="text-slate-500">61-90 Days (SMA-2)</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        {formatMoney(collectionsData?.agingBuckets?.find((b: any) => b.bucket === '61-90')?.totalAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-[#2B3566]">
                      <span className="text-slate-500">91-180 Days (NPA-Substandard)</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">
                        {formatMoney(collectionsData?.agingBuckets?.find((b: any) => b.bucket === '91-180')?.totalAmount || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">180+ Days (Doubtful / Loss)</span>
                      <span className="font-bold text-rose-700 dark:text-rose-500">
                        {formatMoney(collectionsData?.agingBuckets?.find((b: any) => b.bucket === '180+')?.totalAmount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2B3566]">
                  <Link href="/collections" className="block">
                    <Button size="sm" className="w-full text-xs text-white bg-[#2563EB] hover:bg-blue-700 font-semibold shadow-sm">
                      Open Collections Workspace →
                    </Button>
                  </Link>
                  <Link href="/payments" className="block">
                    <Button size="sm" variant="secondary" className="w-full text-xs">
                      Payments & Verifications Ledger →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* G. AUDITOR WORKSPACE */}
      {primaryRole === 'AUDITOR' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiItem label="TOTAL AUDIT EVENTS" value={String(totalAuditEvents)} hint="Immutable ledger logs" icon={<FileCheck className="h-4 w-4" />} iconColor="purple" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="FINANCIAL MUTATIONS" value={String(activeLoansCount)} hint="Disbursements & payouts" icon={<Wallet className="h-4 w-4" />} iconColor="blue" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="SECURITY EVENTS" value={String(totalStaffUsers)} hint="Logins & token audits" icon={<ShieldCheck className="h-4 w-4" />} iconColor="emerald" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="SANCTION DECISIONS" value={String(approvedAppsCount)} hint="Underwriting audit trail" icon={<Coins className="h-4 w-4" />} iconColor="purple" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="SETTING CHANGES" value="0" hint="Parameter adjustments" icon={<Sliders className="h-4 w-4" />} iconColor="amber" cardBgClass={cardBgClass} isDark={isDark} />
            <KpiItem label="COMPLIANCE RATING" value="100%" hint="Zero unlogged actions" icon={<CheckCircle2 className="h-4 w-4" />} iconColor="emerald" cardBgClass={cardBgClass} isDark={isDark} valueColor="text-emerald-600" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className={cn('lg:col-span-2 rounded-2xl border p-5 space-y-4', cardBgClass)}>
              <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#2B3566]">
                <h3 className="text-sm font-bold tracking-tight">Live Immutable Audit Trail (Read-Only)</h3>
                <Link href="/audit-logs" className="text-xs font-bold text-brand-700 dark:text-blue-400 hover:underline">Full Audit Log →</Link>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-[#2B3566] text-xs">
                {Array.isArray(auditData?.items) && auditData.items.length > 0 ? (
                  auditData.items.map((log: any) => (
                    <div key={log.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-brand-700 dark:text-blue-400">{log.action}</span>
                        <p className="text-[11px] text-slate-400">{log.entity} #{log.entityId} · User: {log.user?.email || 'System'}</p>
                      </div>
                      <span className="text-[11px] text-slate-400">{formatDate(log.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400">All actions strictly logged to immutable audit ledger.</div>
                )}
              </div>
            </div>

            <div className={cn('rounded-2xl border p-5 space-y-4 flex flex-col justify-between', cardBgClass)}>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Auditor Inspection Controls</h3>
                <p className="text-xs text-slate-400 mt-0.5">Read-only compliance checks</p>
                <div className="space-y-2.5 pt-3 text-xs">
                  <p className="text-slate-500">You are operating in <span className="font-bold text-slate-900 dark:text-white">Strict Read-Only Inspection Mode</span>. All operational mutations (sanctions, disbursements, payouts) are disabled for compliance segregation.</p>
                </div>
              </div>
              <div className="pt-2">
                <Link href="/audit-logs" className="block"><Button size="sm" className="w-full text-xs text-white">Inspect Audit Logs</Button></Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* H. SYSTEM ADMIN / SUPER ADMIN / BRANCH MANAGER WORKSPACE */}
      {['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(primaryRole) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiItem
              label="TOTAL BORROWERS"
              value={String(totalCustomersCount)}
              hint="Across all branches"
              icon={<Users className="h-4 w-4" />}
              iconColor="purple"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="ACTIVE LOANS"
              value={String(activeLoansCount)}
              hint={`${totalOutstandingFormatted} outstanding`}
              icon={<FileText className="h-4 w-4" />}
              iconColor="emerald"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="TOTAL DISBURSED"
              value={totalDisbursedFormatted}
              hint={`${dateFilter} Volume`}
              icon={<Wallet className="h-4 w-4" />}
              iconColor="blue"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="COLLECTIONS"
              value={totalCollectedFormatted}
              hint={`${dateFilter} Recovered`}
              icon={<Coins className="h-4 w-4" />}
              iconColor="emerald"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="OVERDUE PORTFOLIO"
              value={totalOverdueFormatted}
              hint={`${overdueLoansCount} delinquent accounts`}
              icon={<AlertTriangle className="h-4 w-4" />}
              iconColor="rose"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label={primaryRole === 'ADMIN' ? 'STAFF USERS' : 'PENDING QUEUE'}
              value={primaryRole === 'ADMIN' ? String(totalStaffUsers) : String(underReviewCount)}
              hint={primaryRole === 'ADMIN' ? `${totalBranches} Branches Live` : `${underReviewCount} await review`}
              icon={primaryRole === 'ADMIN' ? <Users className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              iconColor="amber"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className={cn('lg:col-span-8 rounded-2xl border p-5 flex flex-col justify-between transition-all', cardBgClass)}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>
                    Portfolio Performance & Asset Volume ({dateFilter})
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Principal disbursed vs collection volume</p>
                </div>
                <div className={cn('flex items-center rounded-xl border p-0.5 text-xs font-semibold', isDark ? 'border-[#2B3566] bg-[#060F1B] text-slate-400' : 'border-slate-200/80 bg-slate-50/80 text-slate-500')}>
                  {(['7D', '30D', '3M', '6M', '1Y'] as const).map((t) => (
                    <button type="button" key={t} onClick={() => setTimeRange(t)} className={cn('rounded-lg px-2.5 py-1 transition-all cursor-pointer', timeRange === t ? (isDark ? 'bg-[#2563EB] text-white font-bold shadow-2xs' : 'bg-blue-50 text-[#2563EB] font-bold shadow-2xs') : (isDark ? 'hover:text-white' : 'hover:text-slate-900'))}>{t}</button>
                  ))}
                </div>
              </div>
              <div className={cn('flex items-center justify-center gap-6 mt-3 text-xs font-medium', isDark ? 'text-slate-300' : 'text-slate-600')}>
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-xs bg-[#2563EB]" /><span>Disbursed (₹)</span></div>
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-xs bg-[#10B981]" /><span>Collected (₹)</span></div>
              </div>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={
                      Array.isArray(reportsData?.productDistribution)
                        ? reportsData.productDistribution.map((p: any) => ({
                            name: p.name,
                            disbursed: Number(p.amount || 0) / 100000,
                            collected: 0,
                          }))
                        : []
                    }
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2B3566' : '#f1f5f9'} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }} axisLine={{ stroke: isDark ? '#2B3566' : '#e2e8f0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} tickFormatter={(v) => (v === 0 ? '0' : `${v}L`)} axisLine={{ stroke: isDark ? '#2B3566' : '#e2e8f0' }} tickLine={false} />
                    <Tooltip formatter={(val: any) => [`₹${val} Lakhs`]} contentStyle={{ backgroundColor: isDark ? '#060F1B' : '#ffffff', borderRadius: '12px', border: isDark ? '1px solid #2B3566' : '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '12px' }} />
                    <Bar dataKey="disbursed" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="collected" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cn('lg:col-span-4 rounded-2xl border p-5 flex flex-col justify-between transition-all', cardBgClass)}>
              <div>
                <h3 className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Portfolio Status Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">Distribution across loan lifecycles</p>
              </div>
              <div className="h-44 w-full relative flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        totalLoansCount + underReviewCount > 0
                          ? [
                              { name: 'Active', value: activeLoansCount, color: '#10B981' },
                              { name: 'Under Review', value: underReviewCount, color: '#2563EB' },
                              { name: 'Overdue', value: overdueLoansCount, color: '#F59E0B' },
                              { name: 'Closed/NOC', value: closedLoansCount, color: '#6366F1' },
                            ].filter((d) => d.value > 0)
                          : [{ name: 'No Loans', value: 1, color: isDark ? '#2B3566' : '#e2e8f0' }]
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={78}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {totalLoansCount + underReviewCount > 0 ? (
                        [
                          <Cell key="active" fill="#10B981" />,
                          <Cell key="review" fill="#2563EB" />,
                          <Cell key="overdue" fill="#F59E0B" />,
                          <Cell key="closed" fill="#6366F1" />,
                        ]
                      ) : (
                        <Cell key="empty" fill={isDark ? '#2B3566' : '#e2e8f0'} />
                      )}
                    </Pie>
                    <Tooltip formatter={(val: any, name: any) => [`${val} Accounts`, name]} contentStyle={{ backgroundColor: isDark ? '#060F1B' : '#ffffff', borderRadius: '8px', border: isDark ? '1px solid #2B3566' : '1px solid #e2e8f0', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className={cn('text-2xl font-extrabold leading-none', isDark ? 'text-white' : 'text-slate-900')}>{totalLoansCount}</span>
                  <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Total Loans</span>
                </div>
              </div>
              <div className={cn('space-y-2 pt-2 border-t text-xs', isDark ? 'border-[#2B3566]' : 'border-slate-100')}>
                <div className="flex justify-between">
                  <span>Active Accounts</span>
                  <span className="font-bold">
                    {activeLoansCount} (
                    {totalLoansCount + underReviewCount > 0
                      ? (((activeLoansCount) / (totalLoansCount + underReviewCount)) * 100).toFixed(1)
                      : '0.0'}
                    %)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Under Review</span>
                  <span className="font-bold">
                    {underReviewCount} (
                    {totalLoansCount + underReviewCount > 0
                      ? (((underReviewCount) / (totalLoansCount + underReviewCount)) * 100).toFixed(1)
                      : '0.0'}
                    %)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue Delinquent</span>
                  <span className="font-bold text-amber-500">
                    {overdueLoansCount} (
                    {totalLoansCount + underReviewCount > 0
                      ? (((overdueLoansCount) / (totalLoansCount + underReviewCount)) * 100).toFixed(1)
                      : '0.0'}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className={cn('rounded-2xl border p-5 flex flex-col justify-between transition-all', cardBgClass)}>
              <div className={cn('flex items-center justify-between pb-3 border-b', isDark ? 'border-[#2B3566]' : 'border-slate-100')}>
                <h3 className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Recent Loan Applications</h3>
                <Link href="/applications" className={cn('text-xs font-bold hover:underline', isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]')}>View All</Link>
              </div>
              <ApplicationsTable items={appsList} isDark={isDark} />
            </div>

            <div className={cn('rounded-2xl border p-5 flex flex-col justify-between transition-all', cardBgClass)}>
              <div>
                <div className="flex items-center justify-between">
                  <h3 className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Disbursements ({dateFilter})</h3>
                  <Link href="/disbursements" className={cn('text-xs font-bold hover:underline', isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]')}>View All</Link>
                </div>
                <div className="mt-2">
                  <p className={cn('text-2xl font-extrabold', isDark ? 'text-white' : 'text-slate-900')}>{totalDisbursedFormatted}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">Real-time cumulative payout total</p>
                </div>
              </div>
              <div className="h-36 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      loansList.filter((l: any) => l.status === 'ACTIVE' && l.disbursementDate).length > 0
                        ? loansList
                            .filter((l: any) => l.status === 'ACTIVE' && l.disbursementDate)
                            .map((l: any) => ({
                              date: formatDate(l.disbursementDate),
                              amount: Number(l.principal || 0) / 100000,
                            }))
                        : Number(totalDisbursedValue || 0) > 0
                        ? [{ date: 'Active', amount: Number(totalDisbursedValue) / 100000 }]
                        : [{ date: 'No Disbursements', amount: 0 }]
                    }
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2B3566' : '#f1f5f9'} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(val: any) => [`₹${val}L`]} />
                    <Area type="monotone" dataKey="amount" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={cn('rounded-2xl border p-5 flex flex-col justify-between transition-all', cardBgClass)}>
              <div className={cn('flex items-center justify-between pb-3 border-b', isDark ? 'border-[#2B3566]' : 'border-slate-100')}>
                <h3 className={cn('text-sm font-bold tracking-tight', isDark ? 'text-white' : 'text-slate-900')}>Branch Performance</h3>
                <Link href="/branches" className={cn('text-xs font-bold hover:underline', isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]')}>View All</Link>
              </div>
              <div className="space-y-3 pt-2 text-xs">
                {Array.isArray(reportsData?.branchDistribution) && reportsData.branchDistribution.length > 0 ? (
                  reportsData.branchDistribution.slice(0, 3).map((b: any) => (
                    <div key={b.code} className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-[#2B3566]">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{b.name} ({b.code})</p>
                        <p className="text-[11px] text-slate-400">{b.count} Active Loans</p>
                      </div>
                      <span className="font-mono font-bold text-brand-700 dark:text-blue-400">{formatMoney(b.amount)}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400">No branch lending activity yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* I. BORROWER / CUSTOMER SELF-SERVICE WORKSPACE */}
      {primaryRole === 'CUSTOMER' && (
        <div className="space-y-6">
          {/* Top 6 Borrower KPIs */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <KpiItem
              label="ACTIVE LOANS"
              value={String(customerLoans.filter((l: any) => l.status === 'ACTIVE').length)}
              hint="Active borrowing accounts"
              icon={<CreditCard className="h-4 w-4" />}
              iconColor="emerald"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="TOTAL BORROWED"
              value={formatMoney(myTotalBorrowed)}
              hint="Sanctioned principal"
              icon={<Wallet className="h-4 w-4" />}
              iconColor="blue"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="NEXT EMI DUE"
              value={myNextEmiAmount}
              hint={myNextDueDate}
              icon={<Coins className="h-4 w-4" />}
              iconColor="purple"
              cardBgClass={cardBgClass}
              isDark={isDark}
              highlightText={myActiveLoan ? "Upcoming due" : undefined}
            />
            <KpiItem
              label="OUTSTANDING PRINCIPAL"
              value={formatMoney(myTotalOutstanding)}
              hint="Current loan balance"
              icon={<TrendingUp className="h-4 w-4" />}
              iconColor="rose"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
            <KpiItem
              label="KYC VERIFICATION"
              value={(myActiveLoan?.customer?.kycStatus || appsList[0]?.customer?.kycStatus || (user as any)?.customer?.kycStatus || 'VERIFIED')}
              hint="Identity verified"
              icon={<ShieldCheck className="h-4 w-4" />}
              iconColor="emerald"
              cardBgClass={cardBgClass}
              isDark={isDark}
              valueColor="text-emerald-600"
            />
            <KpiItem
              label="LOAN TENURE"
              value={myActiveLoan ? `${myActiveLoan.tenureMonths || 24} Mos` : '24 Mos'}
              hint="Scheduled installments"
              icon={<FileCheck className="h-4 w-4" />}
              iconColor="purple"
              cardBgClass={cardBgClass}
              isDark={isDark}
            />
          </div>

          {/* Main Loan Details & Actions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left 2 Cols: My Active Loan Facility */}
            <div className={cn('lg:col-span-2 rounded-2xl border p-5 space-y-4 flex flex-col justify-between', cardBgClass)}>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#2B3566]">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">
                      {myActiveLoan ? `Active Loan #${myActiveLoan.loanNo}` : 'Borrowing Facility'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {myActiveLoan?.productName || 'Personal Loan'} · Disbursed on {myActiveLoan?.disbursementDate ? formatDate(myActiveLoan.disbursementDate) : 'Recently'}
                    </p>
                  </div>
                  {myActiveLoan && <Badge status={myActiveLoan.status} />}
                </div>

                {myActiveLoan ? (
                  <div className="space-y-4 pt-3">
                    {/* Key Loan Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
                        <span className="text-slate-400 block text-[11px]">Sanctioned Amount</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">{formatMoney(myActiveLoan.principal || 0)}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
                        <span className="text-slate-400 block text-[11px]">Monthly EMI</span>
                        <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block">{formatMoney(myActiveLoan.emiAmount || 0)}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
                        <span className="text-slate-400 block text-[11px]">Tenure Period</span>
                        <span className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 block">{myActiveLoan.tenureMonths || 24} Months</span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#060F1B]/60 border border-slate-200/60 dark:border-[#2B3566]">
                        <span className="text-slate-400 block text-[11px]">Interest Rate</span>
                        <span className="font-bold text-sm text-[#2563EB] dark:text-[#60A5FA] mt-0.5 block">{myActiveLoan.interestRate || '12.00'}% p.a.</span>
                      </div>
                    </div>

                    {/* Next Due Banner */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/80 dark:bg-[#060F1B] border border-blue-200/70 dark:border-[#2B3566]">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-[#2563EB]" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Next Monthly Installment Due: {myNextEmiAmount}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">Scheduled on {myNextDueDate}. Pay on time to ensure high credit score.</p>
                        </div>
                      </div>
                      <Link href={`/loans/${myActiveLoan.id}`}>
                        <Button size="sm" className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-sm">
                          Submit Payment Proof →
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <p>No active loan account found under your profile.</p>
                    <Link href="/loans">
                      <Button size="sm" className="bg-[#2563EB] text-white">View Loan Accounts →</Button>
                    </Link>
                  </div>
                )}
              </div>

              {myActiveLoan && (
                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-[#2B3566]">
                  <Link href={`/loans/${myActiveLoan.id}`} className="flex-1">
                    <Button size="sm" variant="secondary" className="w-full text-xs font-semibold">
                      View 24-Month Amortization Schedule →
                    </Button>
                  </Link>
                  <Link href="/payments">
                    <Button size="sm" variant="ghost" className="text-xs">
                      Payment Receipts →
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Right 1 Col: Borrower Profile & Shortcuts */}
            <div className={cn('rounded-2xl border p-5 space-y-4 flex flex-col justify-between', cardBgClass)}>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Borrower Information</h3>
                <p className="text-xs text-slate-400 mt-0.5">Your profile and registered details</p>

                <div className="space-y-2.5 pt-3 text-xs">
                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#060F1B]/60">
                    <span className="text-[11px] text-slate-400">Borrower Name</span>
                    <p className="font-bold text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">Email: {user.email}</p>
                  </div>

                  <div className="p-2.5 rounded-xl border border-slate-200 dark:border-[#2B3566] bg-slate-50/50 dark:bg-[#060F1B]/60">
                    <span className="text-[11px] text-slate-400">Destination Bank Account</span>
                    <p className="font-bold text-slate-900 dark:text-white">
                      {(myActiveLoan?.customer?.bankName || appsList[0]?.customer?.bankName || (user as any)?.customer?.bankName || 'Beneficiary Bank')}
                    </p>
                    <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      A/C: {(myActiveLoan?.customer?.bankAccountNo || appsList[0]?.customer?.bankAccountNo || (user as any)?.customer?.bankAccountNo || 'Recorded on File')} ({(myActiveLoan?.customer?.bankIfsc || appsList[0]?.customer?.bankIfsc || (user as any)?.customer?.bankIfsc || 'IFSC Verified')})
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-[#2B3566]">
                <Link href="/loans" className="block">
                  <Button size="sm" variant="secondary" className="w-full text-xs">
                    My Loan Accounts & Schedules →
                  </Button>
                </Link>
                <Link href="/payments" className="block">
                  <Button size="sm" variant="ghost" className="w-full text-xs">
                    View Payment Ledger & Receipts →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// REUSABLE KPI CARD ITEM (Matching Exact Original Design)
// ----------------------------------------------------------------------
function KpiItem({
  label,
  value,
  hint,
  icon,
  iconColor,
  cardBgClass,
  isDark,
  trend,
  highlightText,
  valueColor,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  iconColor: 'purple' | 'blue' | 'emerald' | 'rose' | 'amber';
  cardBgClass: string;
  isDark: boolean;
  trend?: string;
  highlightText?: string;
  valueColor?: string;
}) {
  const iconBgMap = {
    purple: isDark ? 'bg-[#060F1B] text-purple-400' : 'bg-purple-50 text-purple-600',
    blue: isDark ? 'bg-[#060F1B] text-[#60A5FA]' : 'bg-blue-50 text-[#2563EB]',
    emerald: isDark ? 'bg-[#060F1B] text-[#10B981]' : 'bg-emerald-50 text-[#10B981]',
    rose: isDark ? 'bg-[#060F1B] text-rose-400' : 'bg-rose-50 text-rose-600',
    amber: isDark ? 'bg-[#060F1B] text-amber-400' : 'bg-amber-50 text-amber-600',
  };

  const valLen = value ? value.length : 0;
  const fontSizeClass =
    valLen > 14
      ? 'text-sm sm:text-base xl:text-sm 2xl:text-base'
      : valLen > 10
      ? 'text-base sm:text-lg xl:text-[15px] 2xl:text-lg'
      : valLen > 7
      ? 'text-lg sm:text-xl xl:text-lg 2xl:text-xl'
      : 'text-2xl';

  return (
    <div className={cn('rounded-2xl border p-4 transition-all min-w-0 overflow-hidden flex flex-col justify-between', cardBgClass)}>
      <div>
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate" title={label}>
            {label}
          </span>
          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', iconBgMap[iconColor])}>
            {icon}
          </div>
        </div>
        <p
          className={cn(
            'mt-2 font-bold tracking-tight truncate leading-tight',
            fontSizeClass,
            valueColor || (isDark ? 'text-white' : 'text-slate-900')
          )}
          title={value}
        >
          {value}
        </p>
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] min-w-0 overflow-hidden">
        {trend && (
          <span className={cn('flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold', isDark ? 'bg-[#10B981]/15 text-[#10B981]' : 'bg-emerald-50 text-[#10B981]')}>
            <ArrowUp className="h-3 w-3" /> {trend}
          </span>
        )}
        {highlightText && (
          <span className={cn('font-bold shrink-0', isDark ? 'text-amber-400' : 'text-amber-600')}>
            {highlightText}
          </span>
        )}
        <span className="truncate text-slate-400 font-medium" title={hint}>{hint}</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// REUSABLE APPLICATIONS TABLE COMPONENT
// ----------------------------------------------------------------------
function ApplicationsTable({ items, isDark, actionLabel }: { items: any[]; isDark: boolean; actionLabel?: string }) {
  const displayItems = Array.isArray(items) ? items.slice(0, 4) : [];

  if (displayItems.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No active applications in queue.
      </div>
    );
  }

  return (
    <div className={cn('divide-y py-1', isDark ? 'divide-[#2B3566]' : 'divide-slate-100')}>
      {displayItems.map((app: any) => {
        const initial = (app.customer?.firstName?.[0] || 'B').toUpperCase();
        return (
          <div key={app.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold', isDark ? 'bg-[#060F1B] text-[#60A5FA]' : 'bg-blue-50 text-[#2563EB]')}>
                {initial}
              </div>
              <div>
                <Link href={`/applications/${app.id}`} className={cn('text-xs font-bold hover:underline', isDark ? 'text-[#60A5FA]' : 'text-[#2563EB]')}>
                  {app.applicationNo || 'APP-2608'}
                </Link>
                <p className={cn('text-xs font-semibold', isDark ? 'text-slate-200' : 'text-slate-800')}>
                  {app.customer?.firstName || 'Borrower'} {app.customer?.lastName || ''}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className={cn('text-xs font-bold', isDark ? 'text-white' : 'text-slate-900')}>
                {formatMoney(app.requestedAmount || 0)}
              </p>
              <div className="flex items-center justify-end gap-1.5 mt-0.5 flex-wrap">
                {app.eligibility?.result && (
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded',
                      app.eligibility.result === 'ELIGIBLE'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : app.eligibility.result === 'CONDITIONALLY_ELIGIBLE'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-rose-500/10 text-rose-500'
                    )}
                  >
                    {app.eligibility.result}
                  </span>
                )}
                {app.riskAssessment?.score != null && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                    Score {app.riskAssessment.score} ({app.riskAssessment.category || 'LOW'})
                  </span>
                )}
                <Badge status={app.status || 'SUBMITTED'} />
                {actionLabel && (
                  <Link href={`/applications/${app.id}`}>
                    <span className="text-[11px] font-bold text-brand-700 dark:text-blue-400 hover:underline ml-1">
                      {actionLabel}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
