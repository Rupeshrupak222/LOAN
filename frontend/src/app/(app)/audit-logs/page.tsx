'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  FileCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast';
import { PageHeader } from '@/components/PageHeader';
import { DataTable, Column } from '@/components/DataTable';
import { Badge, Input, Card, Button, Spinner } from '@/components/ui';
import { formatDate, cn } from '@/lib/utils';

interface AuditRow {
  id: string;
  user: string;
  userEmail?: string;
  role?: string;
  action: string;
  entity: string;
  entityId?: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt: string;
}

interface EvidenceTimelineItem {
  nodeId: string;
  stepName: string;
  actor: string;
  role: string;
  timestamp: string;
  evidenceHash: string;
  details: string;
}

interface EvidencePackage {
  packageId: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  generatedAt: string;
  generatedBy: string;
  integrityVerified: boolean;
  totalEventsCount: number;
  timeline: EvidenceTimelineItem[];
  supportingEvidence: Array<{ type: string; id: string; title: string; timestamp: string }>;
  aiSummaryAdvisory: string;
}

export default function AuditLogsPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  // Modals
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [targetEntityId, setTargetEntityId] = useState('APP-DEMO-001');
  const [targetEntityType, setTargetEntityType] = useState<'APPLICATION' | 'LOAN' | 'CUSTOMER'>('APPLICATION');
  const [evidencePackage, setEvidencePackage] = useState<EvidencePackage | null>(null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'JSON' | 'CSV'>('CSV');
  const [exportedData, setExportedData] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-logs', search, entityFilter],
    queryFn: async () => {
      const res = await api.get('/audit', {
        params: {
          search: search || undefined,
          entity: entityFilter || undefined,
        },
      });
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as AuditRow[];
    },
  });

  // Generate Evidence Package Mutation
  const generatePkgMutation = useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: string; entityId: string }) => {
      const res = await api.get(`/audit/evidence-package/${entityType}/${entityId}`);
      return res.data?.data as EvidencePackage;
    },
    onSuccess: (pkg) => {
      setEvidencePackage(pkg);
      setShowEvidenceModal(true);
      toast.success('Evidence Package Compiled', 'Cryptographic evidence audit trail generated.');
    },
    onError: (err: any) => {
      toast.error('Evidence Generation Failed', apiErrorMessage(err));
    },
  });

  // Export Audit Mutation
  const exportMutation = useMutation({
    mutationFn: async (format: 'JSON' | 'CSV') => {
      const res = await api.post('/audit/export', { format });
      return res.data?.data;
    },
    onSuccess: (data) => {
      setExportedData(data.data);
      toast.success('Audit Log Exported', 'Export file ready for download.');
    },
    onError: (err: any) => {
      toast.error('Export Failed', apiErrorMessage(err));
    },
  });

  const columns: Column<AuditRow>[] = [
    {
      key: 'action',
      header: 'Action / Event',
      render: (r) => (
        <span className="font-mono text-xs font-bold text-[#2563EB] dark:text-[#60A5FA] bg-blue-50 dark:bg-[#2563EB]/20 border border-blue-200 dark:border-[#2B3566] px-2 py-0.5 rounded">
          {r.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (r) => (
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {r.entity} {r.entityId ? `(#${r.entityId.slice(0, 8)})` : ''}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Performed By',
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight text-xs">{r.user || 'System'}</p>
          <p className="text-[10px] text-slate-400 font-mono">{r.role || 'SYSTEM'}</p>
        </div>
      ),
    },
    {
      key: 'newValue',
      header: 'Event Payload / Changes',
      render: (r) => (
        <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-300 max-w-xs truncate bg-slate-50 dark:bg-[#060F1B] p-1 rounded border border-slate-100 dark:border-[#2B3566]">
          {r.newValue ? JSON.stringify(r.newValue) : '-'}
        </pre>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (r) => <span className="text-xs text-slate-500 dark:text-slate-400">{r.createdAt ? formatDate(r.createdAt) : '-'}</span>,
    },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const entType = r.entity === 'Loan' ? 'LOAN' : r.entity === 'Customer' ? 'CUSTOMER' : 'APPLICATION';
            const entId = r.entityId || 'APP-DEMO-001';
            setTargetEntityType(entType as any);
            setTargetEntityId(entId);
            generatePkgMutation.mutate({ entityType: entType, entityId: entId });
          }}
          className="text-[10px] h-6 px-2 flex items-center gap-1 cursor-pointer"
        >
          <FileCheck className="h-3 w-3" />
          Evidence
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Administration / Compliance"
        title="Immutable Audit Trail & Evidence Framework"
        subtitle="Cryptographic SHA-256 hash-chained ledger capturing all loan sanctions, underwriting proofs, disbursements, and policy transitions"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowExportModal(true);
                setExportedData(null);
              }}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Export Audit Trail
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                generatePkgMutation.mutate({
                  entityType: targetEntityType,
                  entityId: targetEntityId,
                });
              }}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="h-3.5 w-3.5" />
              Generate Evidence Package
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <Input
            placeholder="Search action, entity, or officer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs"
          />
        </div>
        <div className="w-48">
          <Input
            placeholder="Filter by entity (e.g. Loan, Application)..."
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full text-xs"
          />
        </div>
      </div>

      <Card className="overflow-hidden border">
        <DataTable columns={columns} rows={data || []} loading={isLoading} emptyTitle="No audit records found." />
      </Card>

      {/* EVIDENCE PACKAGE MODAL */}
      {showEvidenceModal && evidencePackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  Evidence Package #{evidencePackage.packageId}
                </h3>
                <p className="text-xs text-slate-400">
                  Entity: {evidencePackage.entityType} #{evidencePackage.entityId}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5',
                    evidencePackage.integrityVerified
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  )}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {evidencePackage.integrityVerified ? 'SHA-256 HASH CHAIN VERIFIED' : 'INTEGRITY MISMATCH'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Advisory AI Summary Banner */}
            <div className="p-3.5 bg-purple-50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-900/40 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                <Sparkles className="h-3.5 w-3.5" />
                Advisory Evidence Audit Summary
              </div>
              <p className="text-xs text-purple-800 dark:text-purple-300/90 leading-relaxed">
                {evidencePackage.aiSummaryAdvisory}
              </p>
            </div>

            {/* Chronological Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Decision & Execution Timeline ({evidencePackage.timeline.length} Events)
              </h4>

              <div className="space-y-2">
                {evidencePackage.timeline.map((item, idx) => (
                  <div
                    key={item.nodeId}
                    className="p-3 rounded-xl border border-slate-200 dark:border-[#1E2445] bg-slate-50/50 dark:bg-slate-900/30 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900 dark:text-white">
                        {idx + 1}. {item.stepName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400">{item.details}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                      <span>Actor: {item.actor} ({item.role})</span>
                      <span className="truncate max-w-xs text-blue-600 dark:text-blue-400">
                        Hash: {item.evidenceHash.slice(0, 16)}...
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supporting Statutory Evidence Refs */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Supporting Statutory Evidence References
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {evidencePackage.supportingEvidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-[#1E2445] bg-white dark:bg-slate-900 text-xs space-y-1"
                  >
                    <span className="font-bold text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono">
                      {ev.type}
                    </span>
                    <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">{ev.title}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{ev.id}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowEvidenceModal(false)}>
                Close Evidence Package
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT AUDIT TRAIL MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1528] p-6 shadow-dropdown space-y-4 border border-slate-200 dark:border-[#1E2445]">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="h-4 w-4 text-blue-600" />
                Controlled Audit Trail Export
              </h3>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-300">
                <ShieldCheck className="h-3.5 w-3.5 inline mr-1" />
                <strong>DPDP Privacy Guarantee:</strong> All exported records automatically mask PAN, Aadhaar, Bank Account numbers, and secret credentials.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Export Format
                </label>
                <div className="flex items-center gap-4">
                  {(['CSV', 'JSON'] as const).map((fmt) => (
                    <label key={fmt} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="exportFormat"
                        value={fmt}
                        checked={exportFormat === fmt}
                        onChange={() => setExportFormat(fmt)}
                      />
                      <span>{fmt} Format</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                disabled={exportMutation.isPending}
                onClick={() => exportMutation.mutate(exportFormat)}
                className="w-full mt-2 cursor-pointer"
              >
                {exportMutation.isPending ? 'Generating Export...' : `Export as ${exportFormat}`}
              </Button>

              {exportedData && (
                <div className="space-y-2 pt-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Export Preview:</span>
                  <div className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] max-h-48 overflow-y-auto whitespace-pre">
                    {exportedData}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowExportModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
