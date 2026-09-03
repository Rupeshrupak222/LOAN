'use client';

import React, { useState } from 'react';
import {
  LifeBuoy,
  AlertOctagon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Send,
  Plus,
  RefreshCw,
  Search,
  MessageSquare,
  Activity,
  Layers,
} from 'lucide-react';

interface Ticket {
  id: string;
  title: string;
  category: string;
  severity: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CLIENT' | 'RESOLVED' | 'CLOSED';
  assignedTeam: string;
  responseDeadline: string;
  resolutionDeadline: string;
  isResponseBreached: boolean;
  isResolutionBreached: boolean;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  impactedService: string;
  severity: 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM' | 'P4_LOW';
  stage: string;
  ownerEmail: string;
  impactSummary: string;
  rootCause?: string;
  mitigationSteps?: string;
  startedAt: string;
}

export default function SupportSlaPage() {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'INCIDENTS' | 'SLA_METRICS'>('TICKETS');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'tkt-disb-9901',
      title: 'Disbursement IMPS transfer timeout on Cashfree gateway',
      category: 'DISBURSEMENT_FAILURE',
      severity: 'P1_CRITICAL',
      status: 'IN_PROGRESS',
      assignedTeam: 'ENGINEERING',
      responseDeadline: 'In 12 mins',
      resolutionDeadline: 'In 1h 45m',
      isResponseBreached: false,
      isResolutionBreached: false,
      createdAt: '10 mins ago',
    },
    {
      id: 'tkt-ocr-8812',
      title: 'Bank Statement OCR Parser Anomaly on Axis Bank format',
      category: 'UNDERWRITING_EXCEPTION',
      severity: 'P2_HIGH',
      status: 'RESOLVED',
      assignedTeam: 'ENGINEERING',
      responseDeadline: 'Met',
      resolutionDeadline: 'Met',
      isResponseBreached: false,
      isResolutionBreached: false,
      createdAt: '2 hours ago',
    },
    {
      id: 'tkt-conf-4409',
      title: 'Update Branch Working Hours Configuration for Pune HO',
      category: 'GENERAL_INQUIRY',
      severity: 'P3_MEDIUM',
      status: 'OPEN',
      assignedTeam: 'SUPPORT_TIER_1',
      responseDeadline: 'In 3h 20m',
      resolutionDeadline: 'In 22h',
      isResponseBreached: false,
      isResolutionBreached: false,
      createdAt: '40 mins ago',
    },
  ]);

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'inc-cri-001',
      title: 'Primary Credit Bureau CRIF Gateway Intermittent 504 Timeouts',
      impactedService: 'INTEGRATION_HUB_BUREAU',
      severity: 'P1_CRITICAL',
      stage: 'POSTMORTEM',
      ownerEmail: 'eng-oncall@adyapan.dev',
      impactSummary: '14 credit inquiry calls delayed during peak morning origination window.',
      rootCause: 'Upstream vendor maintenance window caused packet drops.',
      mitigationSteps: 'Automated circuit breaker tripped and diverted 100% traffic to secondary Experian adapter.',
      startedAt: '3 hours ago',
    },
  ]);

  const filteredTickets =
    severityFilter === 'ALL'
      ? tickets
      : tickets.filter((t) => t.severity === severityFilter);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'P1_CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'P2_HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'P3_MEDIUM':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-700/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise SLA & Support Center</h1>
            <p className="text-sm text-slate-400">Severity-Based SLA Deadlines, Incident Postmortems & MTTA/MTTR Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <span className="text-xs font-semibold text-emerald-400">99.4% Contractual SLA Compliance</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">SLA Compliance Rate</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">99.4%</p>
          <span className="text-[11px] text-slate-500">0 Critical Breaches</span>
        </div>
        <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Mean Time to Acknowledge (MTTA)</span>
          <p className="text-2xl font-bold text-indigo-400 mt-1">12 mins</p>
          <span className="text-[11px] text-slate-500">Target: &lt; 15 mins (P1)</span>
        </div>
        <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Mean Time to Resolve (MTTR)</span>
          <p className="text-2xl font-bold text-cyan-400 mt-1">68 mins</p>
          <span className="text-[11px] text-slate-500">Target: &lt; 120 mins (P1)</span>
        </div>
        <div className="p-5 bg-slate-900/40 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Active Incidents</span>
          <p className="text-2xl font-bold text-white mt-1">0 Active</p>
          <span className="text-[11px] text-emerald-400">All services operational</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'TICKETS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Support Tickets Queue ({tickets.length})
        </button>
        <button
          onClick={() => setActiveTab('INCIDENTS')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'INCIDENTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          Enterprise Incidents & Postmortems ({incidents.length})
        </button>
      </div>

      {activeTab === 'TICKETS' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            {['ALL', 'P1_CRITICAL', 'P2_HIGH', 'P3_MEDIUM', 'P4_LOW'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  severityFilter === sev
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {sev.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Ticket Table */}
          <div className="bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-4">Ticket ID & Title</th>
                  <th className="p-4">Severity</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Team</th>
                  <th className="p-4">SLA Resolution Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTickets.map((tkt) => (
                  <tr key={tkt.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-4">
                      <span className="text-xs font-mono text-indigo-400 block">{tkt.id}</span>
                      <span className="font-medium text-white text-sm">{tkt.title}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${getSeverityBadge(tkt.severity)}`}>
                        {tkt.severity.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">{tkt.category}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300">
                        {tkt.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-300 font-mono">{tkt.assignedTeam}</td>
                    <td className="p-4 text-xs font-medium text-slate-300">{tkt.resolutionDeadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'INCIDENTS' && (
        <div className="space-y-4">
          {incidents.map((inc) => (
            <div key={inc.id} className="p-6 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-rose-400">{inc.id}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getSeverityBadge(inc.severity)}`}>
                      {inc.severity}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      STAGE: {inc.stage}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{inc.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{inc.impactSummary}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-amber-400 uppercase">Root Cause Analysis</span>
                  <p className="text-xs text-slate-300 mt-1">{inc.rootCause || 'Under investigation'}</p>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 uppercase">Mitigation & Circuit Breaker</span>
                  <p className="text-xs text-slate-300 mt-1">{inc.mitigationSteps || 'Mitigation in progress'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
