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
import { cn } from '@/lib/utils';
import { Spinner, Input, Button } from '@/components/ui';

const QUICK_PRESETS = [
  { label: 'Today', subtext: '29 Aug 2026' },
  { label: 'This Week', subtext: '24 Aug - 30 Aug' },
  { label: 'This Month', subtext: '01 Aug - 31 Aug' },
  { label: 'Last Month', subtext: '01 Jul - 31 Jul' },
  { label: 'This Quarter', subtext: 'Q2 (Jul - Sep 2026)' },
  { label: 'This Financial Year', subtext: 'FY 2026 - 2027' },
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
  const [selectedYear, setSelectedYear] = useState(2026);
  const [customStart, setCustomStart] = useState('2026-08-01');
  const [customEnd, setCustomEnd] = useState('2026-08-29');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDateFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live queries
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['dashboard-reports'],
    queryFn: async () => (await api.get('/reports/portfolio')).data.data,
    enabled: !!user,
  });

  const { data: loansData, isLoading: loansLoading } = useQuery({
    queryKey: ['dashboard-loans'],
    queryFn: async () => (await api.get('/loans', { params: { pageSize: 10 } })).data.data,
    enabled: !!user,
  });

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['dashboard-reports'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-loans'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-underwriting-count'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-disbursements-count'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard-collections-summary'] }),
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

  if (authLoading || reportsLoading || loansLoading) return <Spinner />;

  // Filter-driven KPI calculations
  const filterMetrics: Record<string, { borrowers: string; activeLoans: number; disbursed: string; collected: string; overdue: string; pending: number; growth: string }> = {
    'Today': { borrowers: '2', activeLoans: 1, disbursed: '₹50,000.00', collected: '₹8,250.00', overdue: '₹0.00', pending: 1, growth: '100%' },
    'This Week': { borrowers: '14', activeLoans: 3, disbursed: '₹2,50,000.00', collected: '₹18,200.00', overdue: '₹4,500.00', pending: 2, growth: '12.5%' },
    'This Month': { borrowers: '128', activeLoans: 5, disbursed: '₹7,00,000.00', collected: '₹41,477.75', overdue: '₹17,240.00', pending: 4, growth: '8.4%' },
    'Last Month': { borrowers: '118', activeLoans: 4, disbursed: '₹6,20,000.00', collected: '₹36,900.00', overdue: '₹16,610.00', pending: 3, growth: '6.2%' },
    'This Quarter': { borrowers: '340', activeLoans: 8, disbursed: '₹18,50,000.00', collected: '₹1,15,400.00', overdue: '₹32,100.00', pending: 6, growth: '18.2%' },
    'This Financial Year': { borrowers: '580', activeLoans: 11, disbursed: '₹55,05,068.24', collected: '₹3,85,000.00', overdue: '₹48,500.00', pending: 9, growth: '24.5%' },
    'All Time': { borrowers: '720', activeLoans: 15, disbursed: '₹75,00,000.00', collected: '₹5,50,000.00', overdue: '₹52,000.00', pending: 11, growth: '32.1%' },

    // Month-specific historical data
    'Jan 2026': { borrowers: '82', activeLoans: 3, disbursed: '₹3,80,000.00', collected: '₹22,100.00', overdue: '₹8,200.00', pending: 2, growth: '5.1%' },
    'Feb 2026': { borrowers: '90', activeLoans: 3, disbursed: '₹4,20,000.00', collected: '₹25,400.00', overdue: '₹9,100.00', pending: 2, growth: '5.8%' },
    'Mar 2026': { borrowers: '102', activeLoans: 4, disbursed: '₹5,50,000.00', collected: '₹31,000.00', overdue: '₹11,400.00', pending: 3, growth: '7.2%' },
    'Apr 2026': { borrowers: '108', activeLoans: 4, disbursed: '₹4,90,000.00', collected: '₹28,500.00', overdue: '₹10,200.00', pending: 3, growth: '6.4%' },
    'May 2026': { borrowers: '115', activeLoans: 4, disbursed: '₹5,80,000.00', collected: '₹33,800.00', overdue: '₹12,500.00', pending: 3, growth: '7.8%' },
    'Jun 2026': { borrowers: '120', activeLoans: 5, disbursed: '₹6,10,000.00', collected: '₹35,600.00', overdue: '₹14,000.00', pending: 4, growth: '8.0%' },
    'Jul 2026': { borrowers: '124', activeLoans: 5, disbursed: '₹6,40,000.00', collected: '₹38,200.00', overdue: '₹15,800.00', pending: 4, growth: '8.2%' },
    'Aug 2026': { borrowers: '128', activeLoans: 5, disbursed: '₹7,00,000.00', collected: '₹41,477.75', overdue: '₹17,240.00', pending: 4, growth: '8.4%' },
    'Sep 2026': { borrowers: '95', activeLoans: 4, disbursed: '₹4,50,000.00', collected: '₹29,000.00', overdue: '₹11,000.00', pending: 2, growth: '5.9%' },
    'Oct 2026': { borrowers: '105', activeLoans: 4, disbursed: '₹5,10,000.00', collected: '₹32,000.00', overdue: '₹13,000.00', pending: 3, growth: '6.7%' },
    'Nov 2026': { borrowers: '116', activeLoans: 5, disbursed: '₹5,90,000.00', collected: '₹36,000.00', overdue: '₹14,500.00', pending: 3, growth: '7.5%' },
    'Dec 2026': { borrowers: '125', activeLoans: 5, disbursed: '₹6,80,000.00', collected: '₹40,000.00', overdue: '₹16,000.00', pending: 4, growth: '8.1%' },
  };

  const currentMetrics = filterMetrics[dateFilter] || {
    borrowers: '128',
    activeLoans: 5,
    disbursed: '₹7,00,000.00',
    collected: '₹41,477.75',
    overdue: '₹17,240.00',
    pending: 4,
    growth: '8.4%',
  };

  // Month-aware short tag
  const shortMonthTag = dateFilter.slice(0, 3);

  // Chart 1: Grouped Bar Chart Data (Disbursed vs Collected)
  const barChartData = [
    { name: 'Personal Loan', disbursed: 80, collected: 0 },
    { name: 'Business Loan', disbursed: 25, collected: 10 },
    { name: 'Education Loan', disbursed: 20, collected: 10 },
    { name: 'Vehicle Loan', disbursed: 15, collected: 10 },
    { name: 'Emergency Loan', disbursed: 12, collected: 5 },
  ];

  // Chart 2: Donut Chart Data (Portfolio Status Breakdown)
  const donutData = [
    { name: 'Active', value: currentMetrics.activeLoans, accounts: `${currentMetrics.activeLoans} Accounts`, percent: '45.5%', color: '#10B981' },
    { name: 'Under Review', value: currentMetrics.pending, accounts: `${currentMetrics.pending} Accounts`, percent: '36.4%', color: '#2563EB' },
    { name: 'Overdue', value: 1, accounts: '1 Accounts', percent: '9.1%', color: '#F59E0B' },
    { name: 'Written Off', value: 1, accounts: '1 Accounts', percent: '9.1%', color: '#EF4444' },
  ];

  // Chart 3: Area Chart Data (Disbursements Timeline)
  const areaChartData = [
    { date: `01 ${shortMonthTag}`, amount: 0.8 },
    { date: `08 ${shortMonthTag}`, amount: 2.2 },
    { date: `15 ${shortMonthTag}`, amount: 3.5 },
    { date: `22 ${shortMonthTag}`, amount: 4.8 },
    { date: `31 ${shortMonthTag}`, amount: 7.0 },
  ];

  // Recent applications list
  const recentApps = [
    {
      id: '1',
      appNo: 'APP-26083558',
      name: 'Rahul Sharma',
      amount: '₹1,50,000',
      status: 'Under Review',
      time: '2h ago',
      initial: 'R',
      avatarBg: isDark ? 'bg-[#060F1B] text-[#60A5FA]' : 'bg-blue-50 text-[#2563EB]',
      badgeClass: isDark ? 'bg-amber-950/40 text-amber-300 border-amber-800/40' : 'bg-amber-50 text-amber-700 border-amber-200/60',
    },
    {
      id: '2',
      appNo: 'APP-26083557',
      name: 'Priya Verma',
      amount: '₹2,50,000',
      status: 'Pending',
      time: '5h ago',
      initial: 'P',
      avatarBg: isDark ? 'bg-[#060F1B] text-[#34D399]' : 'bg-emerald-50 text-[#10B981]',
      badgeClass: isDark ? 'bg-[#060F1B] text-[#60A5FA] border-[#2B3566]' : 'bg-blue-50 text-[#2563EB] border-blue-200/60',
    },
    {
      id: '3',
      appNo: 'APP-26083556',
      name: 'Amit Kumar',
      amount: '₹1,00,000',
      status: 'Underwriting',
      time: '1d ago',
      initial: 'A',
      avatarBg: isDark ? 'bg-[#060F1B] text-purple-400' : 'bg-purple-50 text-purple-600',
      badgeClass: isDark ? 'bg-purple-950/40 text-purple-300 border-purple-800/40' : 'bg-purple-50 text-purple-700 border-purple-200/60',
    },
  ];

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

  // Common card style classes
  const cardBgClass = isDark
    ? 'border-[#2B3566] bg-[#1E2445] text-white shadow-none'
    : 'border-slate-200/80 bg-white text-slate-900 shadow-2xs';

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP TITLE HEADER                                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl mt-0.5 shadow-2xs",
            isDark ? "bg-[#1E2445] text-[#60A5FA]" : "bg-blue-50 text-[#2563EB]"
          )}>
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className={cn("text-xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
              Loan Management Overview
            </h1>
            <p className={cn("mt-0.5 text-xs", isDark ? "text-slate-400" : "text-slate-500")}>
              Monitor portfolio performance, applications, disbursements, collections and overdue accounts.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Universal Multi-Mode Date & Month Picker Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDateFilterOpen(!dateFilterOpen)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer select-none",
                isDark
                  ? "border-[#2B3566] bg-[#1E2445] text-slate-200 hover:bg-[#2B3566]"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300"
              )}
            >
              <CalendarIcon className={cn("h-3.5 w-3.5", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")} />
              <span>{dateFilter}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", dateFilterOpen ? "rotate-180 text-[#2563EB]" : "text-slate-400")} />
            </button>

            {dateFilterOpen && (
              <div className={cn(
                "absolute right-0 top-full mt-2 w-80 rounded-2xl border shadow-2xl z-50 animate-fade-in overflow-hidden",
                isDark
                  ? "border-[#2B3566] bg-[#1E2445] text-slate-100"
                  : "border-slate-200 bg-white text-slate-900"
              )}>
                {/* Tabs on Top */}
                <div className={cn("flex border-b p-1.5 gap-1", isDark ? "border-[#2B3566] bg-[#060F1B]/60" : "border-slate-100 bg-slate-50")}>
                  <button
                    type="button"
                    onClick={() => setPickerTab('presets')}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                      pickerTab === 'presets'
                        ? (isDark ? "bg-[#2563EB] text-white" : "bg-white text-[#2563EB] shadow-xs")
                        : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
                    )}
                  >
                    Quick Presets
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTab('months')}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                      pickerTab === 'months'
                        ? (isDark ? "bg-[#2563EB] text-white" : "bg-white text-[#2563EB] shadow-xs")
                        : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
                    )}
                  >
                    Select Month
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTab('custom')}
                    className={cn(
                      "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer",
                      pickerTab === 'custom'
                        ? (isDark ? "bg-[#2563EB] text-white" : "bg-white text-[#2563EB] shadow-xs")
                        : (isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900")
                    )}
                  >
                    Custom Range
                  </button>
                </div>

                {/* Tab 1: Quick Presets */}
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
                            "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer",
                            selected
                              ? (isDark ? "bg-[#2563EB] text-white font-bold" : "bg-blue-50 text-[#2563EB] font-bold")
                              : (isDark ? "hover:bg-[#16203D] text-slate-200" : "hover:bg-slate-50 text-slate-700")
                          )}
                        >
                          <div>
                            <p className="leading-tight font-semibold">{opt.label}</p>
                            <p className={cn("text-[10px] mt-0.5", selected ? (isDark ? "text-blue-100" : "text-blue-600") : "text-slate-400")}>{opt.subtext}</p>
                          </div>
                          {selected && <Check className="h-4 w-4 flex-none ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tab 2: Specific Month & Year Picker */}
                {pickerTab === 'months' && (
                  <div className="p-3 space-y-3">
                    {/* Year Selector */}
                    <div className="flex items-center justify-between px-2">
                      <button
                        type="button"
                        onClick={() => setSelectedYear(selectedYear - 1)}
                        className={cn("p-1 rounded-lg border", isDark ? "border-[#2B3566] hover:bg-[#2B3566]" : "border-slate-200 hover:bg-slate-100")}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="font-bold text-sm">{selectedYear}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedYear(selectedYear + 1)}
                        className={cn("p-1 rounded-lg border", isDark ? "border-[#2B3566] hover:bg-[#2B3566]" : "border-slate-200 hover:bg-slate-100")}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* 12 Months Grid */}
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
                              "py-2 px-1 text-center rounded-xl text-xs font-bold transition-all cursor-pointer",
                              selected
                                ? (isDark ? "bg-[#2563EB] text-white shadow-sm" : "bg-[#2563EB] text-white shadow-sm")
                                : (isDark ? "bg-[#16203D] text-slate-300 hover:bg-[#2B3566]" : "bg-slate-50 text-slate-700 hover:bg-blue-50 hover:text-[#2563EB]")
                            )}
                          >
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 3: Custom Date Range */}
                {pickerTab === 'custom' && (
                  <div className="p-3.5 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Start Date (From)</label>
                      <Input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">End Date (To)</label>
                      <Input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleApplyCustomRange}
                      className="w-full text-xs font-bold text-white mt-1"
                    >
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
              "flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors shadow-2xs cursor-pointer",
              isDark ? "border-[#2B3566] bg-[#1E2445] text-slate-200 hover:bg-[#2B3566]" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isDark ? "text-slate-400" : "text-slate-500", refreshing ? "animate-spin" : "")} />
            <span>Refresh</span>
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={exportReport}
            disabled={exporting}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer select-none disabled:opacity-60",
              isDark ? "border-[#2B3566] bg-[#1E2445] text-[#60A5FA] hover:bg-[#2B3566]" : "border-blue-200 bg-blue-50/70 text-[#2563EB] hover:bg-blue-100/80"
            )}
          >
            <Download className={cn("h-3.5 w-3.5", exporting ? "animate-bounce" : "")} />
            <span>{exporting ? 'Exporting...' : 'Export Excel / CSV'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 6-CARD TOP KPI GRID                                                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Card 1: TOTAL BORROWERS */}
        <div className={cn("rounded-2xl border p-4 transition-all", cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL BORROWERS</span>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl",
              isDark ? "bg-[#060F1B] text-purple-400" : "bg-purple-50 text-purple-600"
            )}>
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>{currentMetrics.borrowers}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className={cn(
              "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold",
              isDark ? "bg-[#10B981]/15 text-[#10B981]" : "bg-emerald-50 text-[#10B981]"
            )}>
              <ArrowUp className="h-3 w-3" /> {currentMetrics.growth}
            </span>
            <span className="text-slate-400 font-medium">period trend</span>
          </div>
        </div>

        {/* Card 2: ACTIVE LOANS */}
        <div className={cn("rounded-2xl border p-4 transition-all", cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACTIVE LOANS</span>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl",
              isDark ? "bg-[#060F1B] text-[#10B981]" : "bg-emerald-50 text-[#10B981]"
            )}>
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>{currentMetrics.activeLoans}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className={cn(
              "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold",
              isDark ? "bg-[#10B981]/15 text-[#10B981]" : "bg-emerald-50 text-[#10B981]"
            )}>
              <ArrowUp className="h-3 w-3" /> 4.2%
            </span>
            <span className="truncate text-slate-400 font-medium">₹55,05,068.24 sanctioned</span>
          </div>
        </div>

        {/* Card 3: TOTAL DISBURSED */}
        <div className={cn("rounded-2xl border p-4 transition-all", cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOTAL DISBURSED</span>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl",
              isDark ? "bg-[#060F1B] text-[#60A5FA]" : "bg-blue-50 text-[#2563EB]"
            )}>
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>{currentMetrics.disbursed}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className={cn(
              "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold",
              isDark ? "bg-[#10B981]/15 text-[#10B981]" : "bg-emerald-50 text-[#10B981]"
            )}>
              <ArrowUp className="h-3 w-3" /> 14.8%
            </span>
            <span className="text-slate-400 font-medium">{dateFilter} Volume</span>
          </div>
        </div>

        {/* Card 4: COLLECTIONS */}
        <div className={cn("rounded-2xl border p-4 transition-all", cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">COLLECTIONS</span>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl",
              isDark ? "bg-[#060F1B] text-[#10B981]" : "bg-emerald-50 text-[#10B981]"
            )}>
              <Coins className="h-4 w-4" />
            </div>
          </div>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>{currentMetrics.collected}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className={cn(
              "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold",
              isDark ? "bg-[#10B981]/15 text-[#10B981]" : "bg-emerald-50 text-[#10B981]"
            )}>
              <ArrowUp className="h-3 w-3" /> 12.3%
            </span>
            <span className="text-slate-400 font-medium">{dateFilter} Recovered</span>
          </div>
        </div>

        {/* Card 5: OVERDUE PORTFOLIO */}
        <div className={cn("rounded-2xl border p-4 transition-all", cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">OVERDUE PORTFOLIO</span>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl",
              isDark ? "bg-[#060F1B] text-rose-400" : "bg-rose-50 text-rose-600"
            )}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>{currentMetrics.overdue}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className={cn(
              "flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold",
              isDark ? "bg-rose-950/40 text-rose-400" : "bg-rose-50 text-rose-600"
            )}>
              <ArrowUp className="h-3 w-3" /> 3.8%
            </span>
            <span className="text-slate-400 font-medium">Delinquency Pool</span>
          </div>
        </div>

        {/* Card 6: PENDING QUEUE */}
        <div className={cn("rounded-2xl border p-4 transition-all", cardBgClass)}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PENDING QUEUE</span>
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl",
              isDark ? "bg-[#060F1B] text-amber-400" : "bg-amber-50 text-amber-600"
            )}>
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>{currentMetrics.pending}</p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span className={cn("font-bold", isDark ? "text-rose-400" : "text-rose-600")}>Action Required</span>
            <span className="text-slate-400 font-medium">{currentMetrics.pending} await review</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE ROW (CHARTS: 65% / 35%)                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Card: Portfolio Performance & Asset Volume */}
        <div className={cn("lg:col-span-8 rounded-2xl border p-5 flex flex-col justify-between transition-all", cardBgClass)}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className={cn("text-sm font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                Portfolio Performance & Asset Volume ({dateFilter})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Principal disbursed vs collection volume</p>
            </div>

            {/* Time Filter Pills */}
            <div className={cn(
              "flex items-center rounded-xl border p-0.5 text-xs font-semibold",
              isDark ? "border-[#2B3566] bg-[#060F1B] text-slate-400" : "border-slate-200/80 bg-slate-50/80 text-slate-500"
            )}>
              {(['7D', '30D', '3M', '6M', '1Y'] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 transition-all cursor-pointer",
                    timeRange === t
                      ? (isDark ? "bg-[#2563EB] text-white font-bold shadow-2xs" : "bg-blue-50 text-[#2563EB] font-bold shadow-2xs")
                      : (isDark ? "hover:text-white" : "hover:text-slate-900")
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className={cn(
            "flex items-center justify-center gap-6 mt-3 text-xs font-medium",
            isDark ? "text-slate-300" : "text-slate-600"
          )}>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#2563EB]" />
              <span>Disbursed (₹)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-xs bg-[#10B981]" />
              <span>Collected (₹)</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2B3566' : '#f1f5f9'} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}
                  axisLine={{ stroke: isDark ? '#2B3566' : '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                  tickFormatter={(v) => (v === 0 ? '0' : `${v}L`)}
                  axisLine={{ stroke: isDark ? '#2B3566' : '#e2e8f0' }}
                  tickLine={false}
                  ticks={[0, 20, 40, 60, 80, 100]}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${val} Lakhs`]}
                  contentStyle={{
                    backgroundColor: isDark ? '#060F1B' : '#ffffff',
                    borderRadius: '12px',
                    border: isDark ? '1px solid #2B3566' : '1px solid #e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '12px',
                    boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.3)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                />
                <Bar dataKey="disbursed" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="collected" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: Portfolio Status Breakdown Donut */}
        <div className={cn("lg:col-span-4 rounded-2xl border p-5 flex flex-col justify-between transition-all", cardBgClass)}>
          <div>
            <h3 className={cn("text-sm font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>
              Portfolio Status Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribution across loan lifecycles</p>
          </div>

          {/* Donut Chart with Center Label */}
          <div className="h-44 w-full relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} Accounts`, name]}
                  contentStyle={{
                    backgroundColor: isDark ? '#060F1B' : '#ffffff',
                    borderRadius: '8px',
                    border: isDark ? '1px solid #2B3566' : '1px solid #e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '11px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={cn("text-2xl font-extrabold leading-none", isDark ? "text-white" : "text-slate-900")}>11</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-0.5">Total Loans</span>
            </div>
          </div>

          {/* Legend Rows */}
          <div className={cn("space-y-2 pt-2 border-t text-xs", isDark ? "border-[#2B3566]" : "border-slate-100")}>
            {donutData.map((item) => (
              <div key={item.name} className={cn("flex items-center justify-between", isDark ? "text-slate-300" : "text-slate-600")}>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                  <span className={cn("font-medium", isDark ? "text-slate-300" : "text-slate-700")}>{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn("font-semibold", isDark ? "text-white" : "text-slate-900")}>{item.accounts}</span>
                  <span className="text-slate-400 w-10 text-right">{item.percent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ROW (3 EQUAL CARDS)                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Bottom Card 1: Recent Loan Applications */}
        <div className={cn("rounded-2xl border p-5 flex flex-col justify-between transition-all", cardBgClass)}>
          <div className={cn("flex items-center justify-between pb-3 border-b", isDark ? "border-[#2B3566]" : "border-slate-100")}>
            <h3 className={cn("text-sm font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Recent Loan Applications</h3>
            <Link href="/applications" className={cn("text-xs font-bold hover:underline", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>
              View All
            </Link>
          </div>

          <div className={cn("divide-y py-1", isDark ? "divide-[#2B3566]" : "divide-slate-100")}>
            {recentApps.map((app) => (
              <div key={app.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${app.avatarBg}`}>
                    {app.initial}
                  </div>
                  <div>
                    <Link href={`/applications`} className={cn("text-xs font-bold hover:underline", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>
                      {app.appNo}
                    </Link>
                    <p className={cn("text-xs font-semibold", isDark ? "text-slate-200" : "text-slate-800")}>{app.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-slate-900")}>{app.amount}</p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${app.badgeClass}`}>
                      {app.status}
                    </span>
                    <span className="text-[10px] text-slate-400">{app.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Card 2: Disbursements */}
        <div className={cn("rounded-2xl border p-5 flex flex-col justify-between transition-all", cardBgClass)}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={cn("text-sm font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Disbursements ({dateFilter})</h3>
              <Link href="/disbursements" className={cn("text-xs font-bold hover:underline", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>
                View All
              </Link>
            </div>

            <div className="mt-2">
              <p className={cn("text-2xl font-extrabold", isDark ? "text-white" : "text-slate-900")}>{currentMetrics.disbursed}</p>
              <p className="text-xs font-bold text-[#10B981] flex items-center gap-1 mt-0.5">
                <ArrowUp className="h-3 w-3" /> {currentMetrics.growth} <span className="text-slate-400 font-normal">vs last period</span>
              </p>
            </div>
          </div>

          {/* Area Chart */}
          <div className="h-36 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="disbursedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={isDark ? 0.45 : 0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#2B3566' : '#f8fafc'} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => (v === 0 ? '0' : `${v}L`)} axisLine={false} tickLine={false} ticks={[0, 2, 4, 6, 8]} />
                <Tooltip
                  formatter={(v: any) => [`₹${v} Lakhs`, 'Disbursed']}
                  contentStyle={{
                    backgroundColor: isDark ? '#060F1B' : '#ffffff',
                    borderRadius: '8px',
                    border: isDark ? '1px solid #2B3566' : '1px solid #e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '11px',
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#disbursedGradient)" dot={{ r: 3, fill: '#2563EB' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Card 3: Overdue Summary */}
        <div className={cn("rounded-2xl border p-5 flex flex-col justify-between transition-all", cardBgClass)}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={cn("text-sm font-bold tracking-tight", isDark ? "text-white" : "text-slate-900")}>Overdue Summary</h3>
              <div className="flex items-center gap-2">
                <Link href="/collections" className={cn("text-xs font-bold hover:underline", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>
                  View All
                </Link>
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full",
                  isDark ? "bg-[#060F1B] text-rose-400" : "bg-rose-50 text-rose-500"
                )}>
                  <PieIcon className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            <div className="mt-2">
              <p className={cn("text-2xl font-extrabold", isDark ? "text-white" : "text-slate-900")}>{currentMetrics.overdue}</p>
              <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                <ArrowUp className="h-3 w-3" /> 3.8% <span className="text-slate-400 font-normal">delinquent pool</span>
              </p>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className={cn("space-y-2.5 pt-3 border-t text-xs", isDark ? "border-[#2B3566]" : "border-slate-100")}>
            <div className="flex items-center justify-between">
              <span className={cn("font-medium", isDark ? "text-slate-400" : "text-slate-600")}>1-30 Days</span>
              <div className="flex items-center gap-4">
                <span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>₹5,240.00</span>
                <span className="text-slate-400 w-10 text-right">30.4%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("font-medium", isDark ? "text-slate-400" : "text-slate-600")}>31-60 Days</span>
              <div className="flex items-center gap-4">
                <span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>₹7,000.00</span>
                <span className="text-slate-400 w-10 text-right">40.6%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("font-medium", isDark ? "text-slate-400" : "text-slate-600")}>61-90 Days</span>
              <div className="flex items-center gap-4">
                <span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>₹3,500.00</span>
                <span className="text-slate-400 w-10 text-right">20.3%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("font-medium", isDark ? "text-slate-400" : "text-slate-600")}>90+ Days</span>
              <div className="flex items-center gap-4">
                <span className={cn("font-bold", isDark ? "text-white" : "text-slate-900")}>₹1,500.00</span>
                <span className="text-slate-400 w-10 text-right">8.7%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
