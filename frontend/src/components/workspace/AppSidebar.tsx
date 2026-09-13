'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Search,
  Layers,
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
  RotateCcw,
  GitBranch,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace/useWorkspace';
import { useBranding } from '@/lib/branding';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
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
  Search,
  Layers,
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
  RotateCcw,
  GitBranch,
};

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AppSidebar({ open, onClose, collapsed = false }: AppSidebarProps) {
  const pathname = usePathname();
  const { branding } = useBranding();
  const { activeWorkspace, navigationGroups, navigationItems, loading } = useWorkspace();

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#081220]/95 backdrop-blur-xl transition-all duration-300',
          collapsed ? 'w-20' : 'w-72',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Branding Section */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-850">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white font-black shadow-lg shadow-blue-500/25">
              {branding?.institutionName?.charAt(0) || 'A'}
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white truncate">
                  {branding?.institutionName || 'Adyapan Lending'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Lending OS
                </span>
              </div>
            )}
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace Switcher Header */}
        {!collapsed && (
          <div className="px-3 py-3 border-b border-slate-100 dark:border-slate-850/80 bg-slate-50/50 dark:bg-slate-900/30">
            <WorkspaceSwitcher className="w-full" />
          </div>
        )}

        {/* Dynamic Navigation Groups */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {navigationGroups && navigationGroups.length > 0 ? (
            navigationGroups.map((group) => (
              <div key={group.key} className="space-y-1">
                {!collapsed && (
                  <p className="px-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => {
                  const ItemIcon = ICON_MAP[item.icon] || FileText;
                  const isActive =
                    pathname === item.route ||
                    (item.route !== '/dashboard' && pathname.startsWith(item.route));

                  return (
                    <Link
                      key={item.id}
                      href={item.route}
                      onClick={onClose}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150',
                        isActive
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                      )}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <ItemIcon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform group-hover:scale-110',
                            isActive
                              ? 'text-white'
                              : 'text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                          )}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!collapsed && item.badge && (
                        <span
                          className={cn(
                            'px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0',
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                          )}
                        >
                          {item.badge.text}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))
          ) : (
            /* Fallback single-level rendering if no groups returned */
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const ItemIcon = ICON_MAP[item.icon] || FileText;
                const isActive = pathname === item.route;

                return (
                  <Link
                    key={item.id}
                    href={item.route}
                    onClick={onClose}
                    className={cn(
                      'group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all',
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
                    )}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <ItemIcon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Security Badge */}
        {!collapsed && (
          <div className="p-3 border-t border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-900/20">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-slate-100/60 dark:bg-slate-850/60 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="truncate">
                <p className="font-bold text-slate-700 dark:text-slate-300 leading-tight">RBI Regulated Core</p>
                <p className="text-[10px] text-slate-400 truncate">Multi-Tenant Vault</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
