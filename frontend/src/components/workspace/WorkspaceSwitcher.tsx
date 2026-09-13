'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  ChevronDown,
  Check,
  Activity,
  Calculator,
  AlertCircle,
  Scale,
  Cpu,
  ShieldCheck,
  User,
  Handshake,
  Building2,
  FileText,
  Users,
  ShieldAlert,
  Wallet,
  Receipt,
  BarChart3,
  AlertTriangle,
  KeyRound,
  Workflow,
  Sliders,
} from 'lucide-react';
import { useWorkspace } from '@/lib/workspace/useWorkspace';
import { WorkspaceDefinition, WorkspaceKey } from '@/lib/workspace/workspace.types';
import { cn } from '@/lib/utils';

const WS_ICONS: Record<string, any> = {
  FileText,
  Building2,
  Users,
  Calculator,
  FileCheck: FileText,
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  Scale,
  Wallet,
  Receipt,
  Cpu,
  BarChart3,
  KeyRound,
  Workflow,
  Sliders,
  ShieldCheck,
  User,
  Handshake,
  Activity,
  Layers,
};

export function WorkspaceSwitcher({ className }: { className?: string }) {
  const { activeWorkspace, availableWorkspaces, switchWorkspace, loading } = useWorkspace();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const IconComponent = WS_ICONS[activeWorkspace.iconName] || Layers;

  // Group available workspaces by portal
  const groupedWorkspaces = availableWorkspaces.reduce((acc, ws) => {
    const portal = ws.portal;
    if (!acc[portal]) acc[portal] = [];
    acc[portal].push(ws);
    return acc;
  }, {} as Record<string, WorkspaceDefinition[]>);

  const handleSelect = async (wsKey: WorkspaceKey) => {
    setOpen(false);
    if (wsKey !== activeWorkspace.key) {
      await switchWorkspace(wsKey);
    }
  };

  return (
    <div className={cn('relative inline-block text-left', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md hover:bg-slate-50 dark:hover:bg-slate-850 transition-all text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <div className="w-5 h-5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <IconComponent className="w-3.5 h-3.5" />
        </div>
        <div className="text-left flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold leading-none">Workspace</span>
          <span className="truncate max-w-[140px] leading-tight font-bold">{activeWorkspace.shortLabel || activeWorkspace.name}</span>
        </div>
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform duration-200', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 w-72 origin-top-left rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Switch Workspace</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Select an authorized lending domain</p>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 py-1">
            {Object.entries(groupedWorkspaces).map(([portalName, workspaces]) => (
              <div key={portalName} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {portalName.replace('_', ' ')} PORTAL
                </div>
                {workspaces.map((ws) => {
                  const ItemIcon = WS_ICONS[ws.iconName] || Layers;
                  const isSelected = ws.key === activeWorkspace.key;

                  return (
                    <button
                      key={ws.key}
                      onClick={() => handleSelect(ws.key)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
                      )}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={cn(
                            'w-6 h-6 rounded-lg flex items-center justify-center shrink-0',
                            isSelected
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          )}
                        >
                          <ItemIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <p className="truncate leading-none">{ws.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">{ws.description}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
