'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, MapPin, Users, Wallet } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Card, Spinner, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function BranchesPage() {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/branches');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      api.post('/branches', { code, name, city, state }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setModalOpen(false);
      setCode('');
      setName('');
      setCity('');
      setState('');
    },
  });

  if (isLoading) return <Spinner />;

  const branches = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Administration / Branches"
        title="Branch Network & Governance"
        subtitle="Manage regional branch offices, officers, and localized lending hubs"
        action={
          <Button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 text-white">
            <Plus className="h-4 w-4" /> Add Branch
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((b: any) => (
          <Card key={b.id} className="p-5 space-y-4 hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl font-bold",
                  isDark ? "bg-[#060F1B] text-[#60A5FA]" : "bg-blue-50 text-[#2563EB]"
                )}>
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className={cn("font-bold leading-tight text-sm", isDark ? "text-white" : "text-slate-900")}>{b.name}</h4>
                  <span className={cn("font-mono text-xs font-semibold", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>{b.code}</span>
                </div>
              </div>
              <Badge status={b.isActive ? 'ACTIVE' : 'INACTIVE'} />
            </div>

            <div className={cn("text-xs flex items-center gap-1", isDark ? "text-slate-400" : "text-slate-500")}>
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {b.city || 'City N/A'}, {b.state || 'State N/A'}
            </div>

            <div className={cn("grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs", isDark ? "border-[#2B3566]" : "border-slate-100")}>
              <div>
                <p className="text-slate-400">Officers</p>
                <p className={cn("font-bold text-sm mt-0.5", isDark ? "text-slate-200" : "text-slate-800")}>{b._count?.users || 0}</p>
              </div>
              <div>
                <p className="text-slate-400">Borrowers</p>
                <p className={cn("font-bold text-sm mt-0.5", isDark ? "text-slate-200" : "text-slate-800")}>{b._count?.customers || 0}</p>
              </div>
              <div>
                <p className="text-slate-400">Loans</p>
                <p className={cn("font-bold text-sm mt-0.5", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>{b._count?.loans || 0}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Branch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className={cn(
            "w-full max-w-md rounded-2xl border p-6 shadow-2xl animate-fade-in space-y-4",
            isDark ? "bg-[#1E2445] border-[#2B3566] text-slate-100" : "bg-white border-slate-200 text-slate-900"
          )}>
            <div>
              <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-slate-900")}>Create New Branch Office</h3>
              <p className={cn("text-xs mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>Configure new geographic lending branch</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Branch Code</label>
                <Input placeholder="e.g. DEL02" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
              </div>
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>Branch Name</label>
                <Input placeholder="e.g. Delhi South Extension Branch" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>City</label>
                <Input placeholder="e.g. New Delhi" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className={cn("block text-xs font-semibold mb-1", isDark ? "text-slate-300" : "text-slate-700")}>State</label>
                <Input placeholder="e.g. Delhi" value={state} onChange={(e) => setState(e.target.value)} />
              </div>

              {createMutation.isError && (
                <div className={cn(
                  "rounded-xl p-3 text-xs border",
                  isDark ? "bg-rose-950/40 text-rose-400 border-rose-800/40" : "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  {apiErrorMessage(createMutation.error)}
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <Button disabled={!code.trim() || !name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()} className="flex-1 text-white">
                  {createMutation.isPending ? 'Creating...' : 'Create Branch'}
                </Button>
                <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
