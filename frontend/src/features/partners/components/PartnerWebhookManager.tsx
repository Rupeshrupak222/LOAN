'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Webhook,
  Plus,
  Send,
  RotateCw,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Code,
  ChevronLeft,
} from 'lucide-react';
import { usePartnerDetail, usePartnerPortal } from '../hooks/usePartners';

export const PartnerWebhookManager: React.FC = () => {
  const { webhooks, registerWebhook } = usePartnerDetail('part-demo-001');
  const { deliveries, triggerTestPing, replayDelivery } = usePartnerPortal();
  const [showModal, setShowModal] = useState(false);
  const [url, setUrl] = useState('');
  const [testSent, setTestSent] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    await registerWebhook({
      url,
      subscribedEvents: [
        'application.created',
        'application.submitted',
        'decision.completed',
        'offer.generated',
        'offer.accepted',
        'disbursement.completed',
        'drawdown.completed',
      ],
    });
    setShowModal(false);
    setUrl('');
  };

  const handleTestPing = async () => {
    await triggerTestPing();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
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
            Webhooks & Event Deliveries
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Subscribe your server to real-time HMAC-SHA256 signed lending lifecycle events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestPing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-primary" />
            {testSent ? 'Ping Dispatched!' : 'Send Test Ping'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md hover:bg-primary/95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Webhook Endpoint
          </button>
        </div>
      </div>

      {/* Signature Verification Guide */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          HMAC-SHA256 Signature Verification
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Every webhook includes the header <code className="font-mono text-primary">x-adyapan-signature: t=&lt;timestamp&gt;,v1=&lt;hex_hmac&gt;</code>. Compute SHA256 of <code className="font-mono">&lt;timestamp&gt;.&lt;payload_json&gt;</code> with your endpoint secret to verify authenticity.
        </p>
      </div>

      {/* Endpoints List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-foreground">Configured Endpoints</h3>
        <div className="grid grid-cols-1 gap-4">
          {webhooks.map((sub) => (
            <div
              key={sub.id}
              className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/40 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-foreground">{sub.url}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                    {sub.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Subscribed to {sub.subscribedEvents.length} events • HMAC Secret:{' '}
                  <span className="font-mono font-bold text-foreground">{sub.secret.substring(0, 14)}••••</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deliveries Log */}
      <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h3 className="text-base font-bold text-foreground">Recent Event Delivery Logs</h3>
          <span className="text-xs text-muted-foreground font-mono">{deliveries.length} Deliveries Logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground uppercase border-b border-border/60">
              <tr>
                <th className="py-2.5">Event ID & Type</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5">Attempts</th>
                <th className="py-2.5">Response Code</th>
                <th className="py-2.5">Timestamp</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 font-mono">
              {deliveries.slice(0, 10).map((del) => (
                <tr key={del.id} className="hover:bg-muted/20">
                  <td className="py-3 font-bold text-foreground">
                    <div>{del.eventType}</div>
                    <div className="text-muted-foreground font-normal">{del.eventId}</div>
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        del.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      }`}
                    >
                      {del.status}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{del.attempts} / {del.maxAttempts}</td>
                  <td className="py-3 font-bold text-foreground">{del.responseStatusCode || 200} OK</td>
                  <td className="py-3 text-muted-foreground">{new Date(del.createdAt).toLocaleTimeString()}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => replayDelivery(del.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-medium hover:bg-muted"
                    >
                      <RotateCw className="w-3 h-3" />
                      Replay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Webhook Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-4 animate-scale-in">
            <h3 className="text-lg font-bold text-foreground">Add Webhook Endpoint</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  HTTPS Endpoint URL *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://api.partner.com/adyapan-webhooks"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none"
                />
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
