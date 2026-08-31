'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Landmark,
  HandCoins,
  CreditCard,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui';
import { cn } from '@/lib/utils';

const PRODUCT_COLUMNS = [
  {
    icon: Landmark,
    title: 'Banking',
    items: ['Core Banking', 'Debit Cards', 'Neobanking', 'Connect'],
  },
  {
    icon: HandCoins,
    title: 'Lending',
    items: [
      'Core Lending Suite',
      'Loan Origination System',
      'Loan Management System',
      'Microfinance',
      'Debt Collections',
      'BNPL',
      'Credit Line on UPI',
      'Credit Cards',
    ],
  },
  {
    icon: CreditCard,
    title: 'Payments',
    items: [
      'Prepaid Cards',
      'Cross-Border Payments',
      'Fleet Drive',
      'UPI',
      'Merchant Acquiring',
    ],
  },
  {
    icon: Sparkles,
    title: 'Value Added Services',
    items: ['Recon360', 'KYC Suite', 'ACS', 'FRM & AML', 'Rewards'],
  },
];

const RESOURCE_ITEMS = ['Blog', 'News', 'Newsletter', 'White papers', 'Brand assets'];

const SIMPLE_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#events', label: 'Events' },
  { href: '#contact', label: 'Contact' },
];

export function LandingNav({
  primaryCta,
  primaryLabel,
}: {
  primaryCta: string;
  primaryLabel: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | 'products' | 'resources'>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function open(menu: 'products' | 'resources') {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(menu);
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all',
        scrolled || openMenu
          ? 'border-b border-slate-200/70 bg-white/90 backdrop-blur'
          : 'bg-white border-b border-slate-100',
      )}
      onMouseLeave={scheduleClose}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        <Logo size={38} />

        <nav className="hidden items-center gap-7 md:flex">
          <DropdownTrigger
            label="Products"
            active={openMenu === 'products'}
            onOpen={() => open('products')}
          />
          <a href="#about" className="text-sm font-medium text-slate-600 hover:text-brand-600">
            About
          </a>
          <DropdownTrigger
            label="Resources"
            active={openMenu === 'resources'}
            onOpen={() => open('resources')}
          />
          <a href="#events" className="text-sm font-medium text-slate-600 hover:text-brand-600">
            Events
          </a>
          <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-brand-600">
            Contact
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm font-semibold text-slate-700 hover:text-brand-600">
            Sign in
          </Link>
          <Link href={primaryCta}>
            <Button>{primaryLabel}</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Products mega-menu */}
      {openMenu === 'products' && (
        <div
          className="absolute inset-x-0 top-16 hidden border-t border-slate-100 bg-white shadow-card md:block"
          onMouseEnter={() => open('products')}
          onMouseLeave={scheduleClose}
        >
          <div className="mx-auto grid max-w-7xl grid-cols-4 gap-8 px-8 py-8">
            {PRODUCT_COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <col.icon className="h-4 w-4 text-brand-600" />
                  <p className="text-sm font-semibold text-slate-900">{col.title}</p>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {col.items.map((item) => (
                    <li key={item}>
                      <Link
                        href="/login"
                        className="text-sm text-slate-600 transition hover:text-brand-600"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources dropdown */}
      {openMenu === 'resources' && (
        <div
          className="absolute left-1/2 top-16 hidden w-56 -translate-x-1/2 border-t border-slate-100 bg-white shadow-card md:block"
          onMouseEnter={() => open('resources')}
          onMouseLeave={scheduleClose}
        >
          <ul className="p-3">
            {RESOURCE_ITEMS.map((item) => (
              <li key={item}>
                <Link
                  href="/login"
                  className="block rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-brand-50 hover:text-brand-700"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <MobileGroup title="Products">
            {PRODUCT_COLUMNS.flatMap((c) => c.items).map((item) => (
              <MobileItem key={item} label={item} onClick={() => setMobileOpen(false)} />
            ))}
          </MobileGroup>
          <MobileGroup title="Resources">
            {RESOURCE_ITEMS.map((item) => (
              <MobileItem key={item} label={item} onClick={() => setMobileOpen(false)} />
            ))}
          </MobileGroup>
          <nav className="mt-2 flex flex-col gap-1">
            {SIMPLE_LINKS.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <Link href={primaryCta} className="mt-3 block">
            <Button className="w-full">{primaryLabel}</Button>
          </Link>
        </div>
      )}
    </header>
  );
}

function DropdownTrigger({
  label,
  active,
  onOpen,
}: {
  label: string;
  active: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      onMouseEnter={onOpen}
      onFocus={onOpen}
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium transition',
        active ? 'text-brand-600' : 'text-slate-600 hover:text-brand-600',
      )}
    >
      {label}
      <ChevronDown className={cn('h-4 w-4 transition-transform', active && 'rotate-180')} />
    </button>
  );
}

function MobileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 py-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-slate-800"
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="grid grid-cols-2 gap-x-2 pb-2">{children}</div>}
    </div>
  );
}

function MobileItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Link
      href="/login"
      onClick={onClick}
      className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
    >
      {label}
    </Link>
  );
}
