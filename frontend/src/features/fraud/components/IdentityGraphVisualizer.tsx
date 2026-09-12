'use client';

import React, { useState } from 'react';
import {
  Users,
  CreditCard,
  Phone,
  Mail,
  Building2,
  Smartphone,
  Globe,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Link as LinkIcon,
} from 'lucide-react';
import { IdentityGraphCluster, EntityNodeType, FraudSignalSeverity } from '../types';

interface IdentityGraphVisualizerProps {
  cluster: IdentityGraphCluster;
}

const NODE_ICONS: Record<EntityNodeType, any> = {
  CUSTOMER: Users,
  PAN: CreditCard,
  MOBILE: Phone,
  EMAIL: Mail,
  BANK_ACCOUNT: Building2,
  DEVICE: Smartphone,
  IP: Globe,
  PARTNER: Share2,
};

const NODE_COLORS: Record<EntityNodeType, string> = {
  CUSTOMER: 'bg-blue-600 text-white border-blue-400',
  PAN: 'bg-purple-600 text-white border-purple-400',
  MOBILE: 'bg-emerald-600 text-white border-emerald-400',
  EMAIL: 'bg-cyan-600 text-white border-cyan-400',
  BANK_ACCOUNT: 'bg-amber-600 text-white border-amber-400',
  DEVICE: 'bg-rose-600 text-white border-rose-400',
  IP: 'bg-indigo-600 text-white border-indigo-400',
  PARTNER: 'bg-teal-600 text-white border-teal-400',
};

const SEVERITY_LINE_COLORS: Record<FraudSignalSeverity, string> = {
  LOW: 'stroke-slate-300 dark:stroke-slate-700',
  MEDIUM: 'stroke-amber-400',
  HIGH: 'stroke-orange-500',
  CRITICAL: 'stroke-rose-500',
};

export function IdentityGraphVisualizer({ cluster }: IdentityGraphVisualizerProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = cluster.nodes?.find((n) => n.id === selectedNodeId);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden space-y-4">
      {/* Header Banner */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Identity & Duplicate Graph Cluster
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cross-entity linkage detection across PAN, Phone, Email, Bank Account, Device, and IP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cluster.linkedCustomersCount > 0 ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {cluster.linkedCustomersCount} Linked Borrower(s)
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Clean Entity Graph
            </span>
          )}
        </div>
      </div>

      {/* Cluster Summary Alert */}
      <div className="px-6">
        <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
          <LinkIcon className="h-4 w-4 text-slate-400 shrink-0" />
          <span>{cluster.clusterSummary}</span>
        </div>
      </div>

      {/* Interactive Entity Node Graph Representation */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nodes Grid */}
        <div className="md:col-span-2 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Graph Entity Nodes ({cluster.nodes?.length || 0})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {cluster.nodes?.map((node) => {
              const Icon = NODE_ICONS[node.type] || Users;
              const colorClass = NODE_COLORS[node.type] || 'bg-slate-700 text-white';
              const isSelected = selectedNodeId === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${colorClass} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {node.label}
                      </span>
                      {node.isPrimary && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate font-mono">
                      {node.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Inspector */}
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Entity Inspector
          </span>

          {selectedNode ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Entity Type</span>
                <strong className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedNode.type}
                </strong>
              </div>

              <div>
                <span className="text-slate-400 font-medium block">Identifier Value</span>
                <code className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs block mt-0.5 break-all">
                  {selectedNode.value}
                </code>
              </div>

              {selectedNode.metadata && (
                <div>
                  <span className="text-slate-400 font-medium block">Metadata Attributes</span>
                  <pre className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto mt-0.5">
                    {JSON.stringify(selectedNode.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium block mb-1">Associated Graph Edges:</span>
                <div className="space-y-1">
                  {cluster.edges
                    ?.filter((e) => e.sourceNodeId === selectedNode.id || e.targetNodeId === selectedNode.id)
                    .map((edge) => (
                      <div
                        key={edge.id}
                        className="p-1.5 rounded bg-slate-50 dark:bg-slate-800/40 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                      >
                        • {edge.relationType} ({edge.severity} Severity)
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              Select any graph entity node to inspect cross-profile connections and metadata.
            </div>
          )}
        </div>
      </div>

      {/* Graph Edges Table */}
      <div className="px-6 pb-6">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Discovered Identity Linkages & Cross-Entity Edges ({cluster.edges?.length || 0})
        </span>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-2.5 font-bold">Source Node</th>
                <th className="px-4 py-2.5 font-bold">Relationship</th>
                <th className="px-4 py-2.5 font-bold">Target Node</th>
                <th className="px-4 py-2.5 font-bold">Severity</th>
                <th className="px-4 py-2.5 font-bold">Discovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cluster.edges?.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-800 dark:text-slate-200">{e.sourceNodeId}</td>
                  <td className="px-4 py-2.5 font-bold text-blue-600 dark:text-blue-400">{e.relationType}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-800 dark:text-slate-200">{e.targetNodeId}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        e.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-600'
                          : e.severity === 'HIGH'
                          ? 'bg-orange-500/10 text-orange-600'
                          : e.severity === 'MEDIUM'
                          ? 'bg-amber-500/10 text-amber-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-[10px]">
                    {new Date(e.discoveredAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
