'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Trash2, X, Check, Layers, AlertCircle, RefreshCw } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Button, Input } from '@/components/ui';
import { DataTable, Column } from '@/components/DataTable';
import { formatMoney, cn } from '@/lib/utils';

interface Product {
  id: string;
  code: string;
  name: string;
  productType: string;
  minAmount: string;
  maxAmount: string;
  interestRate: string;
  minTenureMonths: number;
  maxTenureMonths: number;
  isActive: boolean;
}

export default function LoanProductsPage() {
  const { isDark } = useTheme();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Form State for New Product
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    productType: 'PERSONAL',
    minAmount: 10000,
    maxAmount: 1000000,
    interestRate: 12.5,
    minTenureMonths: 6,
    maxTenureMonths: 60,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query Products
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/loan-products');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as Product[];
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/loan-products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      alert(apiErrorMessage(err));
    },
  });

  // Create Product Handler
  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (!formData.code.trim() || !formData.name.trim()) {
        throw new Error('Please enter Product Code and Product Name');
      }

      await api.post('/loan-products', {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        productType: formData.productType,
        minAmount: Number(formData.minAmount),
        maxAmount: Number(formData.maxAmount),
        interestRate: Number(formData.interestRate),
        minTenureMonths: Number(formData.minTenureMonths),
        maxTenureMonths: Number(formData.maxTenureMonths),
        isActive: true,
      });

      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setFormData({
        code: '',
        name: '',
        productType: 'PERSONAL',
        minAmount: 10000,
        maxAmount: 1000000,
        interestRate: 12.5,
        minTenureMonths: 6,
        maxTenureMonths: 60,
      });
    } catch (err: any) {
      setFormError(apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  const columns: Column<Product>[] = [
    {
      key: 'code',
      header: 'Product Code',
      render: (r) => (
        <span className={cn("font-mono font-bold text-xs", isDark ? "text-[#60A5FA]" : "text-[#2563EB]")}>
          {r.code}
        </span>
      ),
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (r) => (
        <div>
          <p className={cn("font-bold leading-tight", isDark ? "text-white" : "text-slate-900")}>
            {r.name}
          </p>
          <p className="text-[11px] text-slate-400 capitalize">{r.productType}</p>
        </div>
      ),
    },
    {
      key: 'productType',
      header: 'Category',
      render: (r) => (
        <span className={cn("text-xs font-semibold", isDark ? "text-slate-200" : "text-slate-700")}>
          {r.productType}
        </span>
      ),
    },
    {
      key: 'range',
      header: 'Sanction Range',
      render: (r) => (
        <span className={cn("font-semibold text-xs", isDark ? "text-slate-200" : "text-slate-800")}>
          {formatMoney(r.minAmount || 0)} – {formatMoney(r.maxAmount || 0)}
        </span>
      ),
    },
    {
      key: 'interestRate',
      header: 'Annual Rate',
      render: (r) => (
        <span className={cn("font-bold text-xs", isDark ? "text-white" : "text-slate-900")}>
          {r.interestRate || '0'}% p.a.
        </span>
      ),
    },
    {
      key: 'tenure',
      header: 'Tenure Limits',
      render: (r) => (
        <span className={cn("text-xs font-medium", isDark ? "text-slate-300" : "text-slate-700")}>
          {r.minTenureMonths || 0} – {r.maxTenureMonths || 0} mos
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => <Badge status={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <button
          onClick={() => setDeleteTarget(r)}
          className={cn(
            "p-1.5 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer",
            isDark ? "hover:bg-rose-950/40 text-rose-400" : "hover:bg-rose-50 text-rose-600"
          )}
          title="Delete Product"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb="Lending / Catalog"
        title="Loan Products & Policy Terms"
        subtitle="Configurable lending catalog with interest rates, tenure boundaries, and processing fees"
        action={
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Loan Product
          </Button>
        }
      />

      <DataTable
        columns={columns}
        rows={data}
        loading={isLoading}
        emptyTitle="No loan products configured"
      />

      {/* CREATE PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              "w-full max-w-lg rounded-2xl border shadow-2xl p-6 relative transition-all",
              isDark ? "bg-[#171B36] border-[#2B3566] text-white" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#2B3566]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Add New Loan Product</h3>
                  <p className="text-xs text-slate-400">Define policy terms and lending rates</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Product Code *
                  </label>
                  <Input
                    placeholder="e.g. PL, BL, HL"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Category *
                  </label>
                  <select
                    className={cn(
                      "h-9 w-full rounded-xl border px-3 text-sm shadow-sm transition-colors focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20",
                      isDark
                        ? "border-[#2B3566] bg-[#1E2445] text-slate-100"
                        : "border-slate-200 bg-white text-slate-900"
                    )}
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                  >
                    <option value="PERSONAL">PERSONAL</option>
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="VEHICLE">VEHICLE</option>
                    <option value="EDUCATION">EDUCATION</option>
                    <option value="HOME">HOME</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                  Product Name *
                </label>
                <Input
                  placeholder="e.g. Personal Express Loan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Min Amount (₹)
                  </label>
                  <Input
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) })}
                    min="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Max Amount (₹)
                  </label>
                  <Input
                    type="number"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: Number(e.target.value) })}
                    min="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Rate (% p.a.)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Min Tenure (Months)
                  </label>
                  <Input
                    type="number"
                    value={formData.minTenureMonths}
                    onChange={(e) => setFormData({ ...formData, minTenureMonths: Number(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-300">
                    Max Tenure (Months)
                  </label>
                  <Input
                    type="number"
                    value={formData.maxTenureMonths}
                    onChange={(e) => setFormData({ ...formData, maxTenureMonths: Number(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#2B3566]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? 'Creating...' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={cn(
              "w-full max-w-sm rounded-2xl border shadow-2xl p-5 relative transition-all",
              isDark ? "bg-[#171B36] border-[#2B3566] text-white" : "bg-white border-slate-200 text-slate-900"
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Delete Loan Product?</h3>
                <p className="text-xs text-slate-400">
                  Are you sure you want to delete <span className="font-semibold text-slate-200">{deleteTarget.name}</span> ({deleteTarget.code})?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
