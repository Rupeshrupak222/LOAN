'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Key,
  Webhook,
  DollarSign,
  Layers,
  Shield,
  Palette,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Plus,
  RotateCw,
  Trash2,
  Copy,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { usePartnerDetail } from '../hooks/usePartners';
import type { PartnerScope, PartnerEnvironment } from '../types';

interface Props {
  partnerId: string;
}

export const PartnerConfigurationStudio: React.FC<Props> = ({ partnerId }) => {
  const {
    partner,
    credentials,
    webhooks,
    payout,
    isLoading,
    createCredential,
    rotateSecret,
    revokeCredential,
    registerWebhook,
  } = usePartnerDetail(partnerId);

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PRODUCTS' | 'COMMERCIALS' | 'CREDENTIALS' | 'WEBHOOKS' | 'LIMITS' | 'BRANDING'>('PROFILE');

  // Credential creation state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyEnv, setKeyEnv] = useState<PartnerEnvironment>('SANDBOX');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Webhook creation state
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');

  if (isLoading || !partner) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    const cred = await createCredential({ name: keyName, environment: keyEnv });
    setNewlyCreatedKey(cred);
    setKeyName('');
  };

  const handleRegisterWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl) return;
    await registerWebhook({
      url: webhookUrl,
      subscribedEvents: ['application.created', 'offer.generated', 'offer.accepted', 'disbursement.completed', 'drawdown.completed'],
    });
    setShowWebhookModal(false);
    setWebhookUrl('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <Link
            href="/partners"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Partners Directory
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{partner.name}</h1>
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                partner.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}
            >
              {partner.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Partner Code: <span className="font-mono text-foreground font-semibold">{partner.code}</span> • Type:{' '}
            <span className="font-medium text-foreground">{partner.type}</span> • Tenant:{' '}
            <span className="font-mono text-muted-foreground">{partner.tenantId}</span>
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border gap-1 overflow-x-auto">
        {[
          { id: 'PROFILE', label: 'Partner Profile', icon: Building2 },
          { id: 'PRODUCTS', label: 'Allowed Products', icon: Layers },
          { id: 'COMMERCIALS', label: 'Commercial Terms', icon: DollarSign },
          { id: 'CREDENTIALS', label: 'API Credentials', icon: Key },
          { id: 'WEBHOOKS', label: 'Webhooks', icon: Webhook },
          { id: 'LIMITS', label: 'Rate Limits & Caps', icon: Sliders },
          { id: 'BRANDING', label: 'Cobranding', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. PROFILE */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground">Entity Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Company Name</span>
                <span className="font-medium text-foreground">{partner.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Partner Code</span>
                <span className="font-mono font-bold text-foreground">{partner.code}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">PAN Number</span>
                <span className="font-mono font-bold text-foreground">{partner.pan}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">GSTIN</span>
                <span className="font-mono text-foreground">{partner.gstin || 'Not Provided'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground">Contact & Compliance</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Primary Contact</span>
                <span className="font-medium text-foreground">{partner.contactPerson}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium text-foreground">{partner.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium text-foreground">{partner.phone}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">RBI Digital Lending Compliance</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> DLA Signed
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ALLOWED PRODUCTS */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Assigned Loan & Credit Products</h3>
            <span className="text-xs text-muted-foreground font-mono">
              {partner.allowedProducts.length} Products Assigned
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partner.allowedProducts.map((p) => (
              <div key={p.productId} className="p-4 rounded-xl border border-border/70 bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-foreground">{p.productName}</h4>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                    Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{p.productCode}</p>
                <div className="text-xs text-muted-foreground flex justify-between pt-2 border-t border-border/60">
                  <span>
                    Limit: ₹{(p.customMinAmount || 10000).toLocaleString('en-IN')} - ₹
                    {(p.customMaxAmount || 500000).toLocaleString('en-IN')}
                  </span>
                  <span>
                    Tenure: {p.customMinTenure || 6} - {p.customMaxTenure || 36}m
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. COMMERCIALS */}
      {activeTab === 'COMMERCIALS' && (
        <div className="bg-card p-6 rounded-2xl border border-border space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Commercial Agreement & Commission Schedule</h3>
              <p className="text-xs text-muted-foreground">Applicable revenue share and clawback parameters</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Sourcing Fee</span>
              <p className="text-xl font-bold text-foreground mt-1">
                {partner.commercialPolicy?.sourcingFeePct || 0.5}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Disbursement Commission</span>
              <p className="text-xl font-bold text-foreground mt-1">
                {partner.commercialPolicy?.disbursementCommissionPct || 1.5}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/20 border border-border">
              <span className="text-xs text-muted-foreground uppercase font-semibold">Clawback Period</span>
              <p className="text-xl font-bold text-foreground mt-1">
                {partner.commercialPolicy?.clawbackPeriodDays || 90} Days (
                {partner.commercialPolicy?.clawbackRatePct || 100}%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. CREDENTIALS */}
      {activeTab === 'CREDENTIALS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Partner API Keys & Client Credentials</h3>
              <p className="text-xs text-muted-foreground">Manage Sandbox and Production keys for embedded integrations</p>
            </div>
            <button
              onClick={() => {
                setNewlyCreatedKey(null);
                setShowKeyModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl shadow-md hover:bg-primary/95"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate API Key
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {credentials.map((cred) => (
              <div
                key={cred.id}
                className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground">{cred.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        cred.environment === 'PRODUCTION'
                          ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}
                    >
                      {cred.environment}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        cred.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {cred.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>API Key: {cred.apiKey}</span>
                    <span>•</span>
                    <span>Client ID: {cred.clientId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => rotateSecret(cred.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Rotate Secret
                  </button>
                  <button
                    onClick={() => revokeCredential(cred.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-500 text-xs font-medium hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. WEBHOOKS */}
      {activeTab === 'WEBHOOKS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">Outbound Webhook Subscriptions</h3>
              <p className="text-xs text-muted-foreground">HTTP callback endpoints receiving signed lifecycle events</p>
            </div>
            <button
              onClick={() => setShowWebhookModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Webhook
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {webhooks.map((sub) => (
              <div
                key={sub.id}
                className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">{sub.url}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Subscribed to {sub.subscribedEvents.length} events • Signing Secret:{' '}
                    <span className="font-mono">{sub.secret.substring(0, 12)}••••</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. LIMITS */}
      {activeTab === 'LIMITS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground">API Rate Limiting</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Requests Per Minute (RPM)</span>
                <span className="font-bold text-foreground">{partner.rateLimits?.requestsPerMinute || 120}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Requests Per Hour (RPH)</span>
                <span className="font-bold text-foreground">{partner.rateLimits?.requestsPerHour || 5000}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Burst Limit</span>
                <span className="font-bold text-foreground">{partner.rateLimits?.burstLimit || 30}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-foreground">Origination Caps</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Max Daily Applications</span>
                <span className="font-bold text-foreground">{partner.maxDailyApplications || 500}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/60">
                <span className="text-muted-foreground">Max Application Amount</span>
                <span className="font-bold text-foreground">
                  ₹{(partner.maxApplicationAmount || 1000000).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. BRANDING */}
      {activeTab === 'BRANDING' && (
        <div className="bg-card p-6 rounded-2xl border border-border space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-foreground">Embedded Co-Branding Settings</h3>
          <p className="text-xs text-muted-foreground">Customize headers and color accents for co-branded borrower screens</p>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <span className="text-xs text-muted-foreground">Primary Accent Color</span>
              <p className="text-base font-mono font-bold text-foreground mt-1">
                {partner.branding?.primaryColor || '#6366F1'}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-muted/20">
              <span className="text-xs text-muted-foreground">Header Text</span>
              <p className="text-base font-medium text-foreground mt-1">
                {partner.branding?.cobrandedHeader || 'Powered by Adyapan Lending OS'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold text-foreground">Generate Partner API Key</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            {!newlyCreatedKey ? (
              <form onSubmit={handleGenerateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Key Name / Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production Checkout API Key"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Environment *
                  </label>
                  <select
                    value={keyEnv}
                    onChange={(e) => setKeyEnv(e.target.value as PartnerEnvironment)}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none"
                  >
                    <option value="SANDBOX">Sandbox (Simulated)</option>
                    <option value="PRODUCTION">Production (Live)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-md">
                    Generate
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-500 font-medium">
                  ⚠️ Make sure to copy your API Secret now. You will not be able to see it again!
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-muted-foreground block mb-1">API Key</span>
                    <div className="p-2.5 bg-muted rounded-lg break-all select-all font-bold text-foreground">
                      {newlyCreatedKey.apiKey}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block mb-1">API Secret</span>
                    <div className="p-2.5 bg-muted rounded-lg break-all select-all font-bold text-primary">
                      {newlyCreatedKey.plainSecretOnce}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `API_KEY=${newlyCreatedKey.apiKey}\nAPI_SECRET=${newlyCreatedKey.plainSecretOnce}`
                    );
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="w-full py-2.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-1.5"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedKey ? 'Copied to Clipboard!' : 'Copy Credentials'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Webhook Modal */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-4 animate-scale-in">
            <h3 className="text-lg font-bold text-foreground">Register Webhook Endpoint</h3>
            <form onSubmit={handleRegisterWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  HTTPS Endpoint URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://api.partner.com/adyapan-webhooks"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 text-sm border border-border rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-md">
                  Subscribe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
