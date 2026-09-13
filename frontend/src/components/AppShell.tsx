'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  FileCheck,
  Building2,
  DollarSign,
  Receipt,
  AlertCircle,
  AlertTriangle,
  BarChart3,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ScrollText,
  LogOut,
  Menu,
  Search,
  Layers,
  Sun,
  Moon,
  Wallet,
  Calculator,
  Cpu,
  Scale,
  Handshake,
  Mail,
  Sliders,
  Palette,
  Activity,
  Workflow,
  Lock,
  RotateCcw,
  GitBranch,
  ChevronDown,
  Headphones,
  LifeBuoy,
  FileSpreadsheet,
  Coins,
  CheckCircle2,
  Sparkles,
  CreditCard,
  Send,
  Inbox,
  Clock,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { useBranding } from '@/lib/branding';
import { cn } from '@/lib/utils';
import { ROLE_CONFIG, NAV_ITEMS, RoleName } from '@/lib/roles';
import { Spinner } from './ui';
import { NotificationBell } from './NotificationBell';
import { CopilotDrawer } from './CopilotDrawer';
import { WorkflowExceptionCenterModal } from './WorkflowExceptionCenterModal';
import { NavigationProgressBar } from './NavigationProgressBar';
import { useNavigation, canAccessRoute, WorkspaceId, WORKSPACES } from '@/lib/navigation';

const NAV_ICONS: Record<string, any> = {
  dashboard: LayoutDashboard,
  'credit-queue': Inbox,
  applications: FileText,
  'credit-assessment': Calculator,
  documents: FileCheck,
  verifications: UserCheck,
  tasks: Clock,
  support: Headphones,
  customers: Users,
  'returned-applications': RotateCcw,
  products: Building2,
  'loan-products': Building2,
  'branch-review': FileCheck,
  underwriting: FileCheck,
  'approval-queue': FileCheck,
  'approval-tasks': FileCheck,
  loans: DollarSign,
  disbursements: Wallet,
  partners: Handshake,
  'partner-portal': Handshake,
  payments: Receipt,
  payouts: Send,
  'general-ledger': Scale,
  accounting: Scale,
  settlements: Coins,
  collections: AlertCircle,
  reconciliation: CheckCircle2,
  communications: Mail,
  'support-sla': LifeBuoy,
  'command-center': Cpu,
  operations: Activity,
  compliance: ShieldCheck,
  privacy: ShieldCheck,
  reports: FileSpreadsheet,
  analytics: BarChart3,
  'npa-monitoring': AlertTriangle,
  'fraud-intelligence': ShieldAlert,
  risk: Activity,
  'risk-queue': ShieldAlert,
  'risk-policies': Sliders,
  fraud: ShieldAlert,
  'fraud-queue': ShieldAlert,
  'fraud-cases': Search,
  'fraud-rules': Workflow,
  'fraud-graph': GitBranch,
  'credit-facilities': CreditCard,
  'credit-policies': Sliders,
  'pricing-policies': Sliders,
  offers: Sparkles,
  'authority-matrix': ShieldCheck,
  'tenant-settings': Sliders,
  'early-warnings': AlertTriangle,
  'emi-calculator': Calculator,
  users: KeyRound,
  roles: KeyRound,
  workflows: Workflow,
  'bre-studio': Sliders,
  settings: Sliders,
  permissions: KeyRound,
  branches: Building2,
  tenants: Building2,
  configuration: Sliders,
  branding: Palette,
  'audit-logs': ScrollText,
  integrations: Cpu,
  'customer-dashboard': LayoutDashboard,
  'customer-apply': FileText,
  'customer-credit': CreditCard,
  'customer-documents': FileCheck,
  'customer-loans': DollarSign,
  'customer-payments': Receipt,
  'customer-support': Headphones,
};

const WORKSPACE_ICONS: Record<WorkspaceId, any> = {
  ORIGINATION: FileText,
  CREDIT: ShieldCheck,
  FINANCE: DollarSign,
  COLLECTIONS: AlertTriangle,
  PARTNER: Handshake,
  SUPPORT: Headphones,
  PLATFORM: Layers,
  BORROWER: Users,
};

const GROUP_ORDER = [
  'OVERVIEW',
  'ORIGINATION',
  'CREDIT_ASSESSMENT',
  'RISK_FRAUD',
  'FINANCIAL_OPS',
  'SERVICING',
  'COLLECTIONS',
  'PARTNERSHIP',
  'SUPPORT',
  'GOVERNANCE',
  'ADMINISTRATION',
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { branding } = useBranding();
  const isDark = theme === 'dark';
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [exceptionCenterOpen, setExceptionCenterOpen] = useState(false);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);

  // Dynamic permission-driven navigation and active workspace state
  const {
    activeWorkspace,
    setActiveWorkspace,
    authorizedWorkspaces,
    authorizedItems: accessibleNav,
    groupedItems: groupedNav,
  } = useNavigation();

  // Automatic redirect if unauthenticated without blank screen hang
  useEffect(() => {
    if (!authLoading && !user && pathname && !pathname.startsWith('/login')) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [authLoading, user, pathname, router]);

  if (authLoading) {
    return (
      <div
        className={cn(
          'flex h-screen w-full items-center justify-center transition-colors',
          isDark ? 'bg-[#060F1B] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
        )}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        className={cn(
          'flex h-screen w-full items-center justify-center transition-colors',
          isDark ? 'bg-[#060F1B] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center px-4">
          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Lock className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Authenticating Session</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Redirecting to login portal...</p>
        </div>
      </div>
    );
  }

  const primaryRole = (user.roles?.[0] || 'CUSTOMER') as RoleName;
  const roleCfg = ROLE_CONFIG[primaryRole] || ROLE_CONFIG.CUSTOMER;
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';

  const currentItem = accessibleNav.find(
    (item) => item.href === pathname || (item.href !== '/dashboard' && pathname.startsWith(item.href))
  );
  const isDashboard = pathname === '/dashboard';
  const isAccessibleRoute = isDashboard || canAccessRoute(user, pathname);
  const currentLabel = currentItem?.label || 'Dashboard';
  const CurrentIcon = NAV_ICONS[currentItem?.key || 'dashboard'] || LayoutDashboard;

  const currentWorkspaceConfig = WORKSPACES[activeWorkspace] || WORKSPACES.ORIGINATION;
  const WorkspaceIcon = WORKSPACE_ICONS[activeWorkspace] || Layers;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = globalSearch.trim();
    if (!q) return;
    if (/^APP-/i.test(q)) {
      router.push(`/applications?search=${encodeURIComponent(q)}`);
    } else if (/^LN-/i.test(q)) {
      router.push(`/loans?search=${encodeURIComponent(q)}`);
    } else {
      router.push(`/customers?search=${encodeURIComponent(q)}`);
    }
  }

  return (
    <div className={cn("flex h-screen w-full overflow-hidden transition-colors duration-200", isDark ? "dark bg-[#060F1B] text-slate-100" : "bg-[#f8fafc] text-slate-900")}>
      {/* Instant Navigation Route Progress Bar */}
      <NavigationProgressBar />

      {/* Sidebar - Sleek Enterprise Navy */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex h-full w-64 flex-col flex-none border-r border-[#1E2445]/80 bg-[#060F1B] transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 flex-none items-center justify-between px-5 border-b border-[#1E2445]/80">
          <Link href={currentWorkspaceConfig.defaultRoute || '/dashboard'} className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold shadow-sm"
              style={{ backgroundColor: branding?.primaryColor || '#2563EB' }}
            >
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-tight leading-none truncate max-w-[170px]">
                {primaryRole === 'CUSTOMER'
                  ? `${branding.institutionName.split(' ')[0].toUpperCase()} PORTAL`
                  : primaryRole === 'AUDITOR'
                  ? `${branding.institutionName.split(' ')[0].toUpperCase()} AUDIT`
                  : (branding.portalTitle || branding.institutionName).toUpperCase()}
              </p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5 truncate max-w-[170px]">
                {primaryRole === 'CUSTOMER'
                  ? 'Borrower Self-Service'
                  : primaryRole === 'AUDITOR'
                  ? 'Compliance & Audit'
                  : branding.tagline || roleCfg.label}
              </p>
            </div>
          </Link>
        </div>

        {/* Workspace Switcher Pill (if user has access to multiple workspaces) */}
        {authorizedWorkspaces.length > 1 && primaryRole !== 'CUSTOMER' && primaryRole !== 'CREDIT_ANALYST' && (
          <div className="relative px-3 pt-3 flex-none">
            <button
              type="button"
              onClick={() => setWorkspaceDropdownOpen(!workspaceDropdownOpen)}
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-[#1E2445] bg-[#1E2445]/70 px-3 py-2 text-left text-xs transition-all hover:border-blue-500/50 hover:bg-[#1E2445]"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                  <WorkspaceIcon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white leading-tight">
                    {currentWorkspaceConfig.shortLabel}
                  </p>
                  <p className="truncate text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                    Workspace Hub
                  </p>
                </div>
              </div>
              <ChevronDown className={cn("h-3.5 w-3.5 text-slate-400 transition-transform", workspaceDropdownOpen ? "rotate-180" : "")} />
            </button>

            {/* Dropdown Menu */}
            {workspaceDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setWorkspaceDropdownOpen(false)}
                />
                <div className="absolute left-3 right-3 top-14 z-40 max-h-72 overflow-y-auto rounded-xl border border-[#1E2445] bg-[#0C152B] p-1.5 shadow-2xl space-y-1">
                  <p className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Business Hub
                  </p>
                  {authorizedWorkspaces.map((ws) => {
                    const WIcon = WORKSPACE_ICONS[ws.id] || Layers;
                    const isSelected = ws.id === activeWorkspace;
                    return (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => {
                          setActiveWorkspace(ws.id);
                          setWorkspaceDropdownOpen(false);
                          router.push(ws.defaultRoute);
                        }}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all text-left',
                          isSelected
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        <WIcon className="h-3.5 w-3.5 flex-none" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate leading-tight">{ws.shortLabel}</p>
                          <p className={cn("text-[9px] truncate", isSelected ? "text-blue-100" : "text-slate-400")}>
                            {ws.name}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Nav List */}
        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 space-y-5 scrollbar-thin scrollbar-thumb-[#1E2445]">
          {primaryRole === 'CREDIT_ANALYST' ? (
            <div className="space-y-1">
              <div className="space-y-0.5 pt-1">
                {roleCfg.nav.map((navKey) => {
                  const navItem = NAV_ITEMS[navKey];
                  if (!navItem) return null;
                  const active =
                    pathname === navItem.href ||
                    (navItem.href !== '/dashboard' && pathname.startsWith(navItem.href));
                  const Icon = NAV_ICONS[navKey] || LayoutDashboard;

                  return (
                    <Link
                      key={navItem.href}
                      href={navItem.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors',
                        active
                          ? 'bg-[#2563EB] text-white font-bold shadow-sm shadow-[#2563EB]/30'
                          : 'text-slate-300 font-medium hover:bg-white/6 hover:text-white'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 flex-none transition-colors stroke-[2]',
                          active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                        )}
                      />
                      <span className="truncate">{navItem.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            GROUP_ORDER.map((group) => {
              const items = groupedNav[group];
              if (!items || !items.length) return null;

              return (
                <div key={group} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {group.replace('_', ' ')}
                  </p>
                  <div className="space-y-0.5 pt-1">
                    {items.map((item) => {
                      const active =
                        pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      const Icon = NAV_ICONS[item.key] || LayoutDashboard;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs transition-colors',
                            active
                              ? 'bg-[#2563EB] text-white font-bold shadow-sm shadow-[#2563EB]/30'
                              : 'text-slate-300 font-medium hover:bg-white/6 hover:text-white'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 flex-none transition-colors stroke-[2]',
                              active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        {/* User Card at bottom of sidebar */}
        <div className="m-3 flex-none rounded-xl border border-[#1E2445] bg-[#1E2445]/60 p-3 shadow-2xs">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#2563EB] text-xs font-bold text-white shadow-sm shadow-[#2563EB]/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white leading-tight">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-[10px] font-medium text-slate-400 mt-0.5">{roleCfg.label}</p>
              </div>
            </div>
            <div className="h-2 w-2 rounded-full bg-[#10B981]" title="Online" />
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Content Area with independent scroll */}
      <div className={cn("flex flex-1 flex-col h-full min-w-0 overflow-y-auto overscroll-contain transition-colors", isDark ? "bg-[#060F1B]" : "bg-[#f8fafc]")}>
        {/* Top Header */}
        <header className={cn(
          "sticky top-0 z-30 flex h-16 flex-none items-center justify-between border-b px-4 sm:px-6 backdrop-blur transition-colors",
          isDark ? "border-[#1E2445] bg-[#060F1B]/90" : "border-slate-200/80 bg-white/90"
        )}>
          {/* Left: Mobile Menu + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border lg:hidden",
                isDark ? "border-[#1E2445] text-slate-300 hover:bg-[#1E2445]" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
              onClick={() => setOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs",
              isDark ? "border-[#1E2445] bg-[#1E2445]/70 text-white" : "border-slate-200/80 bg-slate-50/90 text-slate-800"
            )}>
              <CurrentIcon className={cn("h-3.5 w-3.5", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")} />
              <span>{currentLabel}</span>
            </div>
          </div>

          {/* Center: Global Search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <Search className={cn("absolute left-3.5 top-2.5 h-4 w-4", isDark ? "text-slate-400" : "text-slate-400")} />
              <input
                type="text"
                placeholder="Search borrower, customer ID (CUST-1), loan # (LN-..), application..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className={cn(
                  "h-9 w-full rounded-xl border pl-9 pr-14 text-xs placeholder:text-slate-400 transition-all focus:border-[#2563EB] focus:outline-none focus:ring-3 focus:ring-[#2563EB]/10",
                  isDark
                    ? "border-[#1E2445] bg-[#1E2445]/60 text-slate-100 focus:bg-[#1E2445]"
                    : "border-slate-200/90 bg-slate-50/70 text-slate-800 focus:bg-white"
                )}
              />
              <kbd className={cn(
                "absolute right-3 top-2 rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-semibold",
                isDark ? "border-[#1E2445] bg-[#060F1B] text-slate-400" : "border-slate-300/60 bg-slate-200/60 text-slate-500"
              )}>
                ctrl /
              </kbd>
            </div>
          </form>

          {/* Right Controls */}
          <div className="flex items-center gap-3.5">
            {/* Role-Specific Status Badge */}
            <div className={cn(
              "hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold shadow-2xs",
              primaryRole === 'AUDITOR'
                ? (isDark ? "border-slate-700 bg-slate-800/80 text-slate-300" : "border-slate-300 bg-slate-100 text-slate-700")
                : (isDark ? "border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981]" : "border-emerald-200/70 bg-emerald-50 text-emerald-700")
            )}>
              <span className={cn(
                "h-2 w-2 rounded-full",
                primaryRole === 'AUDITOR' ? "bg-slate-400" : "bg-[#10B981] animate-pulse"
              )} />
              {primaryRole === 'CUSTOMER' ? 'Borrower Account Active' : primaryRole === 'AUDITOR' ? 'Read-Only Audit Mode' : 'Core Banking Live'}
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className={cn(
                "flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border transition-colors shadow-2xs",
                isDark
                  ? "border-[#1E2445] bg-[#1E2445] text-amber-400 hover:bg-[#1E2445]/80"
                  : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            {/* AI Workflow & Exception Center Button (For Staff) */}
            {primaryRole !== 'CUSTOMER' && (
              <button
                type="button"
                onClick={() => setExceptionCenterOpen(true)}
                title="AI Workflow & Operational Exception Center"
                className={cn(
                  "flex h-8 items-center gap-1.5 px-2.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer",
                  isDark
                    ? "border-rose-900/50 bg-rose-950/40 text-rose-300 hover:bg-rose-900/40"
                    : "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                )}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                <span className="hidden md:inline">Exceptions</span>
              </button>
            )}

            {/* AI Copilot Gemini Assistant */}
            <CopilotDrawer />

            {/* Live Interactive Notification Bell */}
            <NotificationBell />

            {/* User Profile Badge */}
            <div className={cn("flex items-center gap-2 pl-2 border-l", isDark ? "border-[#1E2445]" : "border-slate-200")}>
              <div className="hidden sm:block text-right">
                <p className={cn("text-xs font-bold leading-tight", isDark ? "text-white" : "text-slate-900")}>
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{roleCfg.label}</p>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Logout"
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer",
                  isDark ? "text-slate-400 hover:text-rose-400 hover:bg-rose-950/30" : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                )}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
