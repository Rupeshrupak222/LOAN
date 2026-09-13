'use client';

import React from 'react';
import Link from 'next/link';
import { User, Phone, Mail, MapPin, ShieldCheck, AlertCircle, ExternalLink } from 'lucide-react';

interface Props {
  customer: any;
  identifiers?: any[];
}

export function Customer360Snapshot({ customer, identifiers }: Props) {
  if (!customer) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
            {customer.firstName?.[0]}{customer.lastName?.[0]}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {customer.firstName} {customer.lastName}
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">{customer.customerCode}</span>
          </div>
        </div>
        <Link
          href={`/customers/${customer.id}`}
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Customer 360 <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Phone className="h-3.5 w-3.5 text-slate-400" />
          <span>{customer.mobile || 'No mobile recorded'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
          <span className="truncate">{customer.email || 'No email recorded'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 col-span-2">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">
            {customer.city || customer.state ? `${customer.city || ''}, ${customer.state || ''}` : 'Address pending'}
          </span>
        </div>
      </div>

      {/* KYC Identifiers Snapshot */}
      {identifiers && identifiers.length > 0 && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Verified Identity Proofs
          </span>
          <div className="flex flex-wrap gap-2">
            {identifiers.map((ident) => (
              <div
                key={ident.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
              >
                {ident.verificationStatus === 'VERIFIED' ? (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                )}
                <span className="font-semibold text-slate-700 dark:text-slate-300">{ident.idType}:</span>
                <span className="text-slate-900 dark:text-white font-bold">{ident.maskedValue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
