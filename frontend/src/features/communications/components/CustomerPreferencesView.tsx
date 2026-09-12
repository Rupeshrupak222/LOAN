'use client';

import React, { useState } from 'react';
import type {
  CommunicationChannel,
  CustomerCommunicationPreference,
  LanguageCode,
} from '../types';
import {
  Users,
  Search,
  Lock,
  Smartphone,
  Mail,
  MessageSquare,
  Bell,
  CheckCircle2,
  Globe,
  Clock,
  Save,
} from 'lucide-react';

interface Props {
  preferences: CustomerCommunicationPreference[];
  isLoading: boolean;
  onRefresh: () => void;
  onSavePreference: (customerId: string, payload: Partial<CustomerCommunicationPreference>) => Promise<void>;
}

export const CustomerPreferencesView: React.FC<Props> = ({
  preferences,
  isLoading,
  onSavePreference,
}) => {
  const [searchCustomerId, setSearchCustomerId] = useState('CUST-DEMO-001');
  const [selectedPref, setSelectedPref] = useState<CustomerCommunicationPreference | null>(
    preferences.find((p) => p.customerId === 'CUST-DEMO-001') || preferences[0] || null
  );

  const [channels, setChannels] = useState<Partial<Record<CommunicationChannel, boolean>>>({
    SMS: true,
    EMAIL: true,
    WHATSAPP: true,
    PUSH: true,
    IN_APP: true,
  });

  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [remindersOptIn, setRemindersOptIn] = useState(true);
  const [preferredLang, setPreferredLang] = useState<LanguageCode>('en-IN');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSelectCustomer = (pref: CustomerCommunicationPreference) => {
    setSelectedPref(pref);
    setSearchCustomerId(pref.customerId);
    setChannels(pref.channels || { SMS: true, EMAIL: true, WHATSAPP: true, PUSH: true, IN_APP: true });
    setMarketingOptIn(pref.categories?.MARKETING ?? false);
    setRemindersOptIn(pref.categories?.REMINDERS ?? true);
    setPreferredLang(pref.preferredLanguage || 'en-IN');
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    if (!selectedPref) return;
    setIsSaving(true);
    try {
      await onSavePreference(selectedPref.customerId, {
        preferredLanguage: preferredLang,
        channels,
        categories: {
          MARKETING: marketingOptIn,
          REMINDERS: remindersOptIn,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left List: Customer Directory */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col h-[650px]">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Customer Directory & Profiles
        </h3>

        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer ID..."
            value={searchCustomerId}
            onChange={(e) => setSearchCustomerId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          {preferences
            .filter((p) => p.customerId.toLowerCase().includes(searchCustomerId.toLowerCase()))
            .map((p) => {
              const isSelected = selectedPref?.customerId === p.customerId;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectCustomer(p)}
                  className={`w-full text-left p-3 rounded-lg border transition ${
                    isSelected
                      ? 'bg-indigo-600/10 border-indigo-500/50 text-white'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold">{p.customerId}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {p.preferredLanguage}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                    <span>SMS: {p.channels?.SMS ? '✅' : '❌'}</span>
                    <span>WA: {p.channels?.WHATSAPP ? '✅' : '❌'}</span>
                    <span>Email: {p.channels?.EMAIL ? '✅' : '❌'}</span>
                  </div>
                </button>
              );
            })}
        </div>
      </div>

      {/* Right: Preference Editor */}
      <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
        {selectedPref ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Communication Channel & Privacy Preferences
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Target Customer: {selectedPref.customerId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <select
                  value={preferredLang}
                  onChange={(e) => setPreferredLang(e.target.value as LanguageCode)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-indigo-500"
                >
                  <option value="en-IN">English (en-IN)</option>
                  <option value="hi-IN">Hindi (hi-IN)</option>
                </select>
              </div>
            </div>

            {/* Non-Bypassable Transactional Notice Banner */}
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-lg flex items-start gap-3">
              <Lock className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-300 space-y-1">
                <strong className="text-white block">RBI Fair Practices & Non-Bypassable Guardrails Active</strong>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Borrowers may toggle promotional marketing and generic reminders. Legally mandated communications (Loan Sanctions, Repayment Receipts, OTPs, Security Alerts, and Statutory Overdue Notices) are strictly non-bypassable and deliver regardless of marketing opt-outs.
                </p>
              </div>
            </div>

            {/* Channels Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Authorized Delivery Channels
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'SMS' as CommunicationChannel, label: 'SMS Notifications', icon: <Smartphone className="w-4 h-4 text-emerald-400" /> },
                  { key: 'WHATSAPP' as CommunicationChannel, label: 'WhatsApp Messenger', icon: <MessageSquare className="w-4 h-4 text-green-400" /> },
                  { key: 'EMAIL' as CommunicationChannel, label: 'Email Handoff', icon: <Mail className="w-4 h-4 text-blue-400" /> },
                  { key: 'PUSH' as CommunicationChannel, label: 'Mobile App Push (FCM)', icon: <Bell className="w-4 h-4 text-amber-400" /> },
                ].map((ch) => (
                  <div
                    key={ch.key}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      {ch.icon}
                      <span className="text-xs font-medium text-slate-200">{ch.label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={channels[ch.key] ?? true}
                        onChange={(e) => setChannels({ ...channels, [ch.key]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Level Permissions */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Category Preferences
              </h4>

              <div className="space-y-2">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-200">Marketing & Promotional Offers</div>
                    <div className="text-[11px] text-slate-400">Pre-approved limits, rate reductions, and cross-sell alerts</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={marketingOptIn}
                    onChange={(e) => setMarketingOptIn(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-slate-200">EMI & Servicing Reminders</div>
                    <div className="text-[11px] text-slate-400">Upcoming repayment reminders 3 days and 1 day prior to due date</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={remindersOptIn}
                    onChange={(e) => setRemindersOptIn(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                  />
                </div>

                <div className="p-3 bg-slate-950/50 rounded-lg border border-slate-800/60 flex items-center justify-between opacity-80">
                  <div>
                    <div className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      Transactional & Security Alerts (Mandatory)
                    </div>
                    <div className="text-[11px] text-slate-500">OTPs, Disbursements, Sanction Letters, Repayment Receipts</div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-400">ALWAYS ON</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-24 text-center text-slate-500">
            Select a customer from the left list to view and manage communication preferences.
          </div>
        )}

        {/* Footer Actions */}
        {selectedPref && (
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-6">
            <div>
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Preferences updated successfully
                </span>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-medium text-xs rounded-lg transition shadow-md shadow-indigo-600/20"
            >
              <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
              {isSaving ? 'Saving...' : 'Save Customer Preferences'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
