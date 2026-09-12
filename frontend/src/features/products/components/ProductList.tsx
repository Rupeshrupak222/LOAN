'use client';

import { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Layers,
  Calculator,
  Percent,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Archive,
  Power,
  Eye,
  FileCheck,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { LendingProduct, ProductType, ProductStatus, LendingChannel } from '../types';
import {
  useProducts,
  useActivateProduct,
  useDeactivateProduct,
  useArchiveProduct,
} from '../hooks/useProducts';
import { usePermission } from '@/lib/permissions';
import { Card, KpiCard, Badge, Button, Input, Spinner } from '@/components/ui';
import { formatMoney, formatDateTime, cn } from '@/lib/utils';
import { ProductConfigModal } from './ProductConfigModal';
import { CreateProductModal } from './CreateProductModal';
import { PricingSimulatorModal } from './PricingSimulatorModal';

export function ProductList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');

  const [selectedProductForView, setSelectedProductForView] = useState<LendingProduct | null>(null);
  const [selectedProductForSim, setSelectedProductForSim] = useState<LendingProduct | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Permissions
  const canCreate = usePermission('product.create');
  const canEdit = usePermission('product.edit');
  const canActivate = usePermission('product.activate');
  const canArchive = usePermission('product.archive');
  const canSimulate = usePermission('product.simulate');

  const { data: products = [], isLoading, refetch, isRefetching } = useProducts({
    productType: selectedType,
    status: selectedStatus,
    channel: selectedChannel,
    search: searchTerm,
  });

  const activateMutation = useActivateProduct();
  const deactivateMutation = useDeactivateProduct();
  const archiveMutation = useArchiveProduct();

  // Metrics
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === 'ACTIVE').length;
  const draftProducts = products.filter((p) => p.status === 'DRAFT').length;
  const avgApr =
    products.length > 0
      ? (
          products.reduce((acc, p) => acc + p.baseInterestRateAnnualPct, 0) / products.length
        ).toFixed(1)
      : '0.0';

  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ACTIVE
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            DRAFT
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Power className="w-3 h-3" />
            INACTIVE
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Archive className="w-3 h-3" />
            ARCHIVED
          </span>
        );
    }
  };

  const getTypeBadge = (type: ProductType) => {
    const map: Record<ProductType, { label: string; color: string }> = {
      PERSONAL_LOAN: { label: 'Personal Loan', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      INSTANT_PERSONAL_LOAN: { label: 'Instant Digital', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
      SALARY_LOAN: { label: 'Salary Advance', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
      BUSINESS_LOAN: { label: 'SME Business', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      EDUCATION_LOAN: { label: 'Education', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
      MERCHANT_LOAN: { label: 'Merchant Line', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      CREDIT_LINE: { label: 'Credit Line', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      BNPL: { label: 'BNPL', color: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' },
      OTHER: { label: 'Custom', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    };
    const t = map[type] || { label: type, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    return (
      <span className={cn('px-2 py-0.5 rounded text-[11px] font-medium border', t.color)}>
        {t.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            Lending Product Catalog & Engine
          </h2>
          <p className="text-sm text-slate-400">
            Configure loan products, pricing schedules, statutory KFS guidelines, and eligibility rules.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200"
          >
            <RefreshCw className={cn('w-4 h-4 mr-1.5', isRefetching && 'animate-spin')} />
            Refresh
          </Button>
          {canCreate && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 flex items-center gap-1.5 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              New Product Draft
            </Button>
          )}
        </div>
      </div>

      {/* KPI Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Configured Products"
          value={String(totalProducts)}
          icon={<Package className="w-5 h-5 text-blue-400" />}
          subtext="Total tenant portfolio"
        />
        <KpiCard
          title="Active for Origination"
          value={String(activeProducts)}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          subtext="Open for borrower intake"
        />
        <KpiCard
          title="Draft / Configuration"
          value={String(draftProducts)}
          icon={<Clock className="w-5 h-5 text-amber-400" />}
          subtext="Pending review & activation"
        />
        <KpiCard
          title="Average Base APR"
          value={`${avgApr}%`}
          icon={<Percent className="w-5 h-5 text-purple-400" />}
          subtext="Annualized portfolio base"
        />
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-900/60 border-slate-800/80 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/70 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-slate-800/70 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              <option value="PERSONAL_LOAN">Personal Loan</option>
              <option value="INSTANT_PERSONAL_LOAN">Instant Digital Loan</option>
              <option value="BUSINESS_LOAN">SME Business Loan</option>
              <option value="MERCHANT_LOAN">Merchant Line</option>
              <option value="CREDIT_LINE">Credit Line</option>
              <option value="BNPL">BNPL</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-800/70 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DRAFT">Drafts</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            {/* Channel Filter */}
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="px-3 py-2 bg-slate-800/70 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Channels</option>
              <option value="DIRECT_BORROWER">Borrower Direct</option>
              <option value="LOAN_OFFICER">Loan Officer</option>
              <option value="BRANCH">Branch Walk-In</option>
              <option value="PARTNER">Partner / DSA</option>
              <option value="API">API Integration</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Product List Grid / Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400">
          <Spinner size="lg" />
          <p className="mt-3 text-sm">Loading lending product catalog...</p>
        </div>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center bg-slate-900/40 border-slate-800/60">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No loan products found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or create a new product draft to get started.
          </p>
          {canCreate && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 bg-blue-600 hover:bg-blue-500 text-white text-sm"
            >
              Create Product Draft
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {products.map((product) => {
            const isDraft = product.status === 'DRAFT';
            const isActive = product.status === 'ACTIVE';

            return (
              <Card
                key={product.id}
                className="bg-slate-900/70 border-slate-800 hover:border-slate-700/80 transition-all duration-200 shadow-xl flex flex-col justify-between overflow-hidden relative group"
              >
                {/* Top Accent Line */}
                <div
                  className={cn(
                    'h-1 w-full',
                    isActive && 'bg-gradient-to-r from-emerald-500 to-teal-500',
                    isDraft && 'bg-gradient-to-r from-amber-500 to-orange-500',
                    product.status === 'INACTIVE' && 'bg-slate-700',
                    product.status === 'ARCHIVED' && 'bg-rose-700'
                  )}
                />

                <div className="p-5 space-y-4">
                  {/* Header: Title & Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {getTypeBadge(product.productType)}
                        {getStatusBadge(product.status)}
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                          v{product.version}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">{product.code}</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  {/* Financial Bounds Snapshot */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-center">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Amount Range</p>
                      <p className="text-xs font-bold text-slate-100 mt-0.5">
                        ₹{(product.minAmount / 1000).toFixed(0)}k - ₹{(product.maxAmount / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Tenure</p>
                      <p className="text-xs font-bold text-slate-100 mt-0.5">
                        {product.minTenureMonths} - {product.maxTenureMonths}m
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Base Rate</p>
                      <p className="text-xs font-bold text-emerald-400 mt-0.5">
                        {product.baseInterestRateAnnualPct}% p.a.
                      </p>
                    </div>
                  </div>

                  {/* Features & Policies Pill Tags */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Interest Model:</span>
                      <span className="text-slate-200 font-medium font-mono text-[11px]">
                        {product.interestModel.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Min CIBIL Bureau:</span>
                      <span className="text-slate-200 font-medium">
                        {product.creditPolicy?.minCibilScore || '650'}+
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Processing Fee:</span>
                      <span className="text-slate-200 font-medium">
                        {product.feeSchedule?.processingFeePct}% (min ₹{product.feeSchedule?.processingFeeMinInr})
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Assigned Workflow:</span>
                      <span className="text-blue-400 font-medium truncate max-w-[140px]">
                        {product.workflowId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-4 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProductForView(product)}
                    className="border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    Configure
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {canSimulate && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProductForSim(product)}
                        className="border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs flex items-center gap-1"
                        title="Simulate EMI & RBI KFS Statement"
                      >
                        <Calculator className="w-3.5 h-3.5" />
                        KFS Simulator
                      </Button>
                    )}

                    {isDraft && canActivate && (
                      <Button
                        size="sm"
                        onClick={() => activateMutation.mutate(product.id)}
                        disabled={activateMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5"
                      >
                        Activate
                      </Button>
                    )}

                    {isActive && canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deactivateMutation.mutate(product.id)}
                        disabled={deactivateMutation.isPending}
                        className="text-slate-400 hover:text-amber-400 text-xs px-2"
                        title="Deactivate for new applications"
                      >
                        Deactivate
                      </Button>
                    )}

                    {canArchive && product.status !== 'ARCHIVED' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => archiveMutation.mutate(product.id)}
                        disabled={archiveMutation.isPending}
                        className="text-slate-500 hover:text-rose-400 text-xs px-2"
                        title="Archive Product"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {selectedProductForView && (
        <ProductConfigModal
          product={selectedProductForView}
          onClose={() => setSelectedProductForView(null)}
        />
      )}

      {selectedProductForSim && (
        <PricingSimulatorModal
          product={selectedProductForSim}
          onClose={() => setSelectedProductForSim(null)}
        />
      )}

      {isCreateModalOpen && (
        <CreateProductModal onClose={() => setIsCreateModalOpen(false)} />
      )}
    </div>
  );
}
