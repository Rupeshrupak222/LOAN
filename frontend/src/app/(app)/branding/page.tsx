'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Palette,
  ShieldCheck,
  Building2,
  Eye,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, Button, Input, Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useBranding } from '@/lib/branding';
import { useToast } from '@/lib/toast';

export default function BrandingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const { branding: globalBranding, switchTenantBrand, previewBranding, resetPreview } = useBranding();

  const [selectedTenantId, setSelectedTenantId] = useState<string>('tenant-adyapan-default');
  const [formData, setFormData] = useState({
    institutionName: '',
    tagline: '',
    portalTitle: '',
    primaryColor: '#2563EB',
    secondaryColor: '#1D4ED8',
    accentColor: '#10B981',
    surfaceColor: '#F8FAFC',
    emailSignature: '',
  });

  // Calculate local contrast ratio against white
  const calculateContrast = (hex: string): number => {
    try {
      const cleanHex = hex.replace('#', '');
      if (!/^[0-9A-Fa-f]{6}$/.test(cleanHex)) return 1;
      const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
      const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
      const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
      const srgb = [r, g, b].map((val) =>
        val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
      );
      const lum = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
      const ratio = (1.0 + 0.05) / (lum + 0.05);
      return Math.round(ratio * 100) / 100;
    } catch {
      return 1;
    }
  };

  const contrastScore = calculateContrast(formData.primaryColor);
  const isWcagSafe = contrastScore >= 4.5;

  // 1. Fetch Branding for Selected Tenant
  const { data: brandingData, isLoading: brandingLoading } = useQuery({
    queryKey: ['branding-detail', selectedTenantId],
    queryFn: async () => (await api.get(`/branding/${selectedTenantId}`)).data.data,
  });

  // Populate form
  useEffect(() => {
    if (brandingData) {
      setFormData({
        institutionName: brandingData.institutionName || '',
        tagline: brandingData.tagline || '',
        portalTitle: brandingData.portalTitle || '',
        primaryColor: brandingData.primaryColor || '#2563EB',
        secondaryColor: brandingData.secondaryColor || '#1D4ED8',
        accentColor: brandingData.accentColor || '#10B981',
        surfaceColor: brandingData.surfaceColor || '#F8FAFC',
        emailSignature: brandingData.emailSignature || '',
      });
    }
  }, [brandingData]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.put(`/branding/${selectedTenantId}`, formData);
      return res.data?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['branding-detail', selectedTenantId] });
      queryClient.invalidateQueries({ queryKey: ['branding-active'] });
      resetPreview();
      toast.success('Branding Published', `Institutional branding for '${data.institutionName}' successfully published.`);
    },
    onError: (err: any) => {
      toast.error('Update Branding Failed', apiErrorMessage(err));
    },
  });

  const handleApplyPreview = () => {
    previewBranding({
      institutionName: formData.institutionName,
      tagline: formData.tagline,
      portalTitle: formData.portalTitle,
      primaryColor: formData.primaryColor,
      secondaryColor: formData.secondaryColor,
      accentColor: formData.accentColor,
      surfaceColor: formData.surfaceColor,
    });
  };

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    switchTenantBrand(tenantId);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb="Administration / White-Label"
        title="Institutional White-Label & Branding Engine"
        subtitle="Configure institution-specific logos, color palettes, and portal themes with automated WCAG 2.1 AA accessibility contrast enforcement"
      />

      {/* Multi-Tenant Quick Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#0E1528] border border-slate-200 dark:border-[#1E2445]">
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-4 w-4 text-blue-600" />
            Switch Active Institutional Brand (Instant Zero-Rebuild Demo)
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Switch between lender profiles to see dynamic CSS variables and layout adapt instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={selectedTenantId === 'tenant-adyapan-default' ? 'primary' : 'secondary'}
            onClick={() => handleSelectTenant('tenant-adyapan-default')}
            className="text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-[#2563EB]" />
            Adyapan Prime (Default Blue)
          </Button>

          <Button
            size="sm"
            variant={selectedTenantId === 'tenant-apex-nbfc' ? 'primary' : 'secondary'}
            onClick={() => handleSelectTenant('tenant-apex-nbfc')}
            className="text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
            Apex Capital (Royal Purple)
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4 border">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-purple-600" />
                  Institutional Theme & Palette Customizer
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tenant ID: <span className="font-mono">{selectedTenantId}</span>
                </p>
              </div>

              {/* WCAG Contrast Scorecard Badge */}
              <div
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border',
                  isWcagSafe
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300'
                )}
              >
                {isWcagSafe ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                WCAG Contrast: {contrastScore}:1 {isWcagSafe ? '(AA PASSED)' : '(CAUTION)'}
              </div>
            </div>

            {brandingLoading ? (
              <div className="p-8 text-center space-y-2">
                <Spinner />
                <p className="text-xs text-slate-400">Loading brand profile...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Institution Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Legal Institution Name *
                    </label>
                    <Input
                      value={formData.institutionName}
                      onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Portal & Navigation Header Title *
                    </label>
                    <Input
                      value={formData.portalTitle}
                      onChange={(e) => setFormData({ ...formData, portalTitle: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Institutional Tagline
                  </label>
                  <Input
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                </div>

                {/* Color Palette Customizer */}
                <div className="pt-2 border-t border-slate-100 dark:border-[#1E2445]">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3">Color System (HEX)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Primary Color */}
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Primary Brand</span>
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value.toUpperCase() })}
                          className="h-5 w-5 rounded cursor-pointer border-none"
                        />
                      </label>
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value.toUpperCase() })}
                        placeholder="#2563EB"
                        required
                      />
                    </div>

                    {/* Secondary Color */}
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Secondary</span>
                        <input
                          type="color"
                          value={formData.secondaryColor}
                          onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value.toUpperCase() })}
                          className="h-5 w-5 rounded cursor-pointer border-none"
                        />
                      </label>
                      <Input
                        value={formData.secondaryColor}
                        onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value.toUpperCase() })}
                        placeholder="#1D4ED8"
                      />
                    </div>

                    {/* Accent Color */}
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Accent Success</span>
                        <input
                          type="color"
                          value={formData.accentColor}
                          onChange={(e) => setFormData({ ...formData, accentColor: e.target.value.toUpperCase() })}
                          className="h-5 w-5 rounded cursor-pointer border-none"
                        />
                      </label>
                      <Input
                        value={formData.accentColor}
                        onChange={(e) => setFormData({ ...formData, accentColor: e.target.value.toUpperCase() })}
                        placeholder="#10B981"
                      />
                    </div>

                    {/* Surface Tint */}
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Surface Tint</span>
                        <input
                          type="color"
                          value={formData.surfaceColor}
                          onChange={(e) => setFormData({ ...formData, surfaceColor: e.target.value.toUpperCase() })}
                          className="h-5 w-5 rounded cursor-pointer border-none"
                        />
                      </label>
                      <Input
                        value={formData.surfaceColor}
                        onChange={(e) => setFormData({ ...formData, surfaceColor: e.target.value.toUpperCase() })}
                        placeholder="#F8FAFC"
                      />
                    </div>
                  </div>
                </div>

                {/* Email Signature */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Automated Communication Email Signature
                  </label>
                  <Input
                    value={formData.emailSignature}
                    onChange={(e) => setFormData({ ...formData, emailSignature: e.target.value })}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E2445]">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={resetPreview}
                    className="text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Reset Preview
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleApplyPreview}
                    className="text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" /> Test Live Preview
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate()}
                    className="text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {updateMutation.isPending ? 'Publishing...' : 'Publish Branding'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Live Component Preview Sandbox */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4 border">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-[#1E2445]">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Live Component Preview
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Sandbox</span>
            </div>

            {/* Mock Header Banner */}
            <div
              className="p-4 rounded-xl text-white space-y-1 shadow-sm transition-all"
              style={{ backgroundColor: formData.primaryColor }}
            >
              <div className="text-xs uppercase font-bold tracking-wider opacity-80">
                {formData.institutionName || 'Institution'}
              </div>
              <div className="text-sm font-bold">{formData.portalTitle || 'Lending Portal'}</div>
              <p className="text-[11px] opacity-90">{formData.tagline || 'Custom FinTech Tagline'}</p>
            </div>

            {/* Mock Buttons & Badges */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-semibold text-slate-500 block">Interactive Elements:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Primary Action
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all"
                  style={{ backgroundColor: formData.secondaryColor }}
                >
                  Secondary Action
                </button>
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white flex items-center gap-1"
                  style={{ backgroundColor: formData.accentColor }}
                >
                  <CheckCircle2 className="h-3 w-3" /> Approved
                </span>
              </div>
            </div>

            {/* Mock Loan Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Commercial Credit Line</span>
                <span className="font-bold" style={{ color: formData.primaryColor }}>
                  ₹25,00,000
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Disbursement SLA: 4 Hours with instant e-NACH</p>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full w-3/4" style={{ backgroundColor: formData.primaryColor }} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
