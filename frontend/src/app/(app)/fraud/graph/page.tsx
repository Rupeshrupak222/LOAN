'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Share2 } from 'lucide-react';
import { IdentityGraphVisualizer } from '@/features/fraud/components/IdentityGraphVisualizer';
import { IdentityGraphCluster } from '@/features/fraud/types';
import { getIdentityGraph } from '@/features/fraud/api';
import { useToast } from '@/lib/toast';

export default function IdentityGraphPage() {
  const toast = useToast();
  const [customerId, setCustomerId] = useState('cust-demo-002');
  const [loading, setLoading] = useState(false);

  const [cluster, setCluster] = useState<IdentityGraphCluster>({
    primaryCustomerId: 'cust-demo-002',
    nodes: [
      { id: 'node-cust-002', type: 'CUSTOMER', label: 'Rohan Verma', value: 'cust-demo-002', isPrimary: true, metadata: { status: 'KYC_VERIFIED' } },
      { id: 'node-pan-002', type: 'PAN', label: 'PAN Card', value: 'XYZPV9876K' },
      { id: 'node-mob-002', type: 'MOBILE', label: 'Registered Mobile', value: '+919876543211' },
      { id: 'node-email-002', type: 'EMAIL', label: 'Email', value: 'rohan.verma@example.com' },
      { id: 'node-bank-002', type: 'BANK_ACCOUNT', label: 'Disbursement Bank Account', value: 'HDFC0001928374' },
      { id: 'node-dev-002', type: 'DEVICE', label: 'Hardware Fingerprint', value: 'dev-fingerprint-002' },
      { id: 'node-ip-002', type: 'IP', label: 'Origination IP', value: '103.21.14.88' },
      { id: 'node-cust-001', type: 'CUSTOMER', label: 'Aarav Sharma (Linked)', value: 'cust-demo-001', metadata: { status: 'ACTIVE_LOAN' } },
      { id: 'node-pan-001', type: 'PAN', label: 'PAN Card (Aarav)', value: 'ABCPS1234F' },
    ],
    edges: [
      { id: 'edge-1', sourceNodeId: 'node-cust-002', targetNodeId: 'node-pan-002', relationType: 'OWNS_PAN', severity: 'LOW', discoveredAt: new Date().toISOString() },
      { id: 'edge-2', sourceNodeId: 'node-cust-002', targetNodeId: 'node-mob-002', relationType: 'REGISTERED_MOBILE', severity: 'LOW', discoveredAt: new Date().toISOString() },
      { id: 'edge-3', sourceNodeId: 'node-cust-002', targetNodeId: 'node-email-002', relationType: 'REGISTERED_EMAIL', severity: 'LOW', discoveredAt: new Date().toISOString() },
      { id: 'edge-4', sourceNodeId: 'node-cust-002', targetNodeId: 'node-bank-002', relationType: 'LINKED_BANK_ACCOUNT', severity: 'LOW', discoveredAt: new Date().toISOString() },
      { id: 'edge-5', sourceNodeId: 'node-cust-002', targetNodeId: 'node-dev-002', relationType: 'ACCESSED_VIA_DEVICE', severity: 'LOW', discoveredAt: new Date().toISOString() },
      { id: 'edge-6', sourceNodeId: 'node-cust-002', targetNodeId: 'node-ip-002', relationType: 'ORIGINATED_FROM_IP', severity: 'LOW', discoveredAt: new Date().toISOString() },
      { id: 'edge-7', sourceNodeId: 'node-cust-001', targetNodeId: 'node-bank-002', relationType: 'SHARED_BANK_ACCOUNT', severity: 'HIGH', discoveredAt: new Date().toISOString() },
      { id: 'edge-8', sourceNodeId: 'node-cust-001', targetNodeId: 'node-ip-002', relationType: 'SHARED_ORIGINATION_IP', severity: 'MEDIUM', discoveredAt: new Date().toISOString() },
    ],
    linkedCustomersCount: 1,
    linkedDevicesCount: 0,
    linkedAccountsCount: 1,
    linkedIpsCount: 1,
    clusterRiskScore: 65,
    maxSeverity: 'HIGH',
    clusterSummary: 'Cluster Alert: Linked with 1 other borrower (Aarav Sharma) via shared disbursement bank account (HDFC0001928374) and identical network IP.',
  });

  const handleSearchGraph = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId.trim()) return;

    setLoading(true);
    try {
      const res = await getIdentityGraph(customerId.trim());
      setCluster(res);
      toast.success(`Identity cluster discovered with ${res.nodes.length} nodes and ${res.edges.length} linkages.`, 'Graph Built');
    } catch (err: any) {
      toast.info('No live server graph data, maintaining visual cluster state.', 'Search Notice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/fraud" className="hover:text-rose-600 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Fraud Center
          </Link>
        </div>

        {/* Quick Customer Search */}
        <form onSubmit={handleSearchGraph} className="flex items-center gap-2 w-full max-w-sm">
          <input
            type="text"
            placeholder="Enter Customer ID / Code..."
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
          >
            {loading ? 'Building...' : 'Explore Graph'}
          </button>
        </form>
      </div>

      {/* Visualizer Component */}
      <IdentityGraphVisualizer cluster={cluster} />
    </div>
  );
}
