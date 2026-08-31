'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Shield, Sliders, CheckCircle2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, Button, Spinner, Input } from '@/components/ui';

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as any[];
    },
  });

  if (isLoading) return <Spinner />;

  const settings = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        breadcrumb="Administration / Settings"
        title="System Parameters & Business Configuration"
        subtitle="Configure sanction approval hierarchies, payment waterfall allocations, and risk thresholds without code deployment"
      />

      <div className="grid grid-cols-1 gap-5">
        {settings.map((s: any) => (
          <SettingEditor key={s.id} setting={s} />
        ))}
      </div>
    </div>
  );
}

function SettingEditor({ setting }: { setting: any }) {
  const queryClient = useQueryClient();
  const [jsonText, setJsonText] = useState(JSON.stringify(setting.value, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (err: any) {
        throw new Error(`Invalid JSON syntax: ${err.message}`);
      }
      return api.put(`/settings/${setting.key}`, { value: parsed });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: any) => {
      setError(err.message || apiErrorMessage(err));
    },
  });

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">{setting.key}</h3>
          <p className="text-xs text-slate-400 capitalize mt-0.5">Category: {setting.category || 'General'}</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-[#10B981] bg-emerald-50 dark:bg-[#10B981]/15 border border-emerald-200 dark:border-[#10B981]/30 px-2.5 py-0.5 rounded-md">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-[#10B981]" /> Saved Successfully
          </span>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Configuration Parameter JSON</label>
        <textarea
          rows={6}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-[#2B3566] p-3 font-mono text-xs text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-[#060F1B] focus:border-[#2563EB] focus:outline-none focus:bg-white dark:focus:bg-[#060F1B]"
        />
      </div>

      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="text-xs text-white"
        >
          {saveMutation.isPending ? 'Updating...' : 'Save Configuration'}
        </Button>
      </div>
    </Card>
  );
}
