'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Key,
  Plus,
  RotateCw,
  Trash2,
  Copy,
  Check,
  Shield,
  Code,
  Terminal,
  ChevronLeft,
} from 'lucide-react';
import { usePartnerDetail } from '../hooks/usePartners';
import type { PartnerEnvironment, PartnerScope } from '../types';

export const PartnerApiCredentials: React.FC = () => {
  const { credentials, createCredential, rotateSecret, revokeCredential } = usePartnerDetail('part-demo-001');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [environment, setEnvironment] = useState<PartnerEnvironment>('SANDBOX');
  const [newKey, setNewKey] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    const cred = await createCredential({ name, environment });
    setNewKey(cred);
    setName('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <Link
            href="/partner"
            className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Partner Hub
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            API Credentials & Keys
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your API Keys and Client Secrets for embedded loan origination, credit limits, and status queries.
          </p>
        </div>

        <button
          onClick={() => {
            setNewKey(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Generate New API Key
        </button>
      </div>

      {/* Code Integration Preview */}
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">API Integration Quickstart</h3>
        </div>

        <div className="p-4 bg-muted/30 rounded-xl border border-border/80 font-mono text-xs overflow-x-auto space-y-2">
          <p className="text-muted-foreground">// Example cURL Request with Partner Headers</p>
          <p className="text-foreground">
            curl -X POST https://api.adyapan.com/api/v1/partner-applications \<br />
            &nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \<br />
            &nbsp;&nbsp;-H &quot;x-api-key: pk_live_nexus_1122334455667788&quot; \<br />
            &nbsp;&nbsp;-H &quot;x-api-secret: sk_live_demo_secret_key_67890&quot; \<br />
            &nbsp;&nbsp;-H &quot;x-idempotency-key: 8f9b3e10-47b2-11ee&quot; \<br />
            &nbsp;&nbsp;-d &apos;&#123;&quot;partnerApplicationId&quot;: &quot;APP-NEXUS-001&quot;, &quot;requestedAmount&quot;: 100000, &quot;requestedTenureMonths&quot;: 12&#125;&apos;
          </p>
        </div>
      </div>

      {/* Credentials List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Active Credentials</h3>
        <div className="grid grid-cols-1 gap-4">
          {credentials.map((cred) => (
            <div
              key={cred.id}
              className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/40 transition-all"
            >
              <div className="space-y-1.5">
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

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span>Client ID: <strong className="text-foreground">{cred.clientId}</strong></span>
                  <span>•</span>
                  <span>API Key: <strong className="text-foreground">{cred.apiKey}</strong></span>
                  <span>•</span>
                  <span>RPM Limit: {cred.rateLimits?.requestsPerMinute || 120}</span>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {cred.scopes?.slice(0, 5).map((scope) => (
                    <span key={scope} className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                      {scope}
                    </span>
                  ))}
                  {cred.scopes?.length > 5 && (
                    <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                      +{cred.scopes.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => rotateSecret(cred.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Rotate Secret
                </button>
                <button
                  onClick={() => revokeCredential(cred.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-500 text-xs font-semibold hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Key Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-lg font-bold text-foreground">Generate Partner API Key</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            {!newKey ? (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Credential Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mobile App Checkout API Key"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Environment *
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as PartnerEnvironment)}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none"
                  >
                    <option value="SANDBOX">Sandbox (Simulated)</option>
                    <option value="PRODUCTION">Production (Live)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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
                      {newKey.apiKey}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block mb-1">API Secret</span>
                    <div className="p-2.5 bg-muted rounded-lg break-all select-all font-bold text-primary">
                      {newKey.plainSecretOnce}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `API_KEY=${newKey.apiKey}\nAPI_SECRET=${newKey.plainSecretOnce}`
                    );
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-full py-2.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
