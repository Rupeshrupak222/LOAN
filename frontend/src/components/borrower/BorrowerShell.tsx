'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Sparkles,
  CreditCard,
  Wallet,
  HelpCircle,
  User,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';

interface BorrowerShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: '/borrower', label: 'Home', icon: Home },
  { href: '/borrower/apply', label: 'Apply', icon: Sparkles },
  { href: '/borrower/loans', label: 'My Loans', icon: CreditCard },
  { href: '/borrower/payments', label: 'Payments', icon: Wallet },
  { href: '/borrower/support', label: 'Support', icon: HelpCircle },
  { href: '/borrower/profile', label: 'Profile', icon: User },
];

export function BorrowerShell({ children }: BorrowerShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'B';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDark ? 'bg-[#060F1B] text-slate-100' : 'bg-[#f8fafc] text-slate-900'}`}>
      {/* Top Consumer Navigation Bar */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b transition-colors ${isDark ? 'bg-[#060F1B]/90 border-slate-800/80' : 'bg-white/90 border-slate-200/80'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/borrower" className="flex items-center gap-2.5">
              <Logo />
              <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Borrower Portal
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/borrower' && (pathname?.startsWith(`${item.href}/`) || pathname?.startsWith(`${item.href}?`)));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold'
                        : isDark
                        ? 'text-slate-400 hover:text-white hover:bg-slate-900'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs ${isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium">RBI Fair Practice Protected</span>
            </div>

            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className={`p-2 rounded-xl border transition-colors ${isDark ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900' : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              href="/borrower/profile"
              className="w-8 h-8 rounded-full bg-blue-600/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs hover:scale-105 transition-transform"
              title={user?.email || 'My Profile'}
            >
              {initials}
            </Link>

            <button
              onClick={() => logout()}
              title="Sign Out"
              aria-label="Sign Out"
              className={`p-2 rounded-xl border transition-colors ${isDark ? 'border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-900' : 'border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-slate-100'}`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t px-2 py-2 ${isDark ? 'bg-[#060F1B]/95 border-slate-800/80 text-slate-300' : 'bg-white/95 border-slate-200/80 text-slate-700'}`}>
        <div className="grid grid-cols-6 gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/borrower' && (pathname?.startsWith(`${item.href}/`) || pathname?.startsWith(`${item.href}?`)));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
