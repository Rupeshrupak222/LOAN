'use client';

import { useState } from 'react';
import {
  X,
  Package,
  Layers,
  Percent,
  Sliders,
  ShieldCheck,
  FileCheck,
  GitBranch,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Save,
  Check,
  Receipt,
  Users,
  Lock,
} from 'lucide-react';
import { LendingProduct, UpdateProductDto } from '../types';
import { useUpdateProduct } from '../hooks/useProducts';
import { usePermission } from '@/lib/permissions';
import { Button, Badge, Input, Card } from '@/components/ui';
import { cn, formatMoney } from '@/lib/utils';

interface Props {
  product: LendingProduct;
  onClose: () => void;
}

type TabKey =
  | 'OVERVIEW'
  | 'AMOUNT_TENURE'
  | 'INTEREST'
  | 'FEES'
  | 'ELIGIBILITY'
  | 'DOCUMENTS'
  | 'CREDIT_RISK'
  | 'WORKFLOW';

export function ProductConfigModal({ product, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('OVERVIEW');
  const [formData, setFormData] = useState<LendingProduct>({ ...product });
  const [isEditing, setIsEditing] = useState(false);

  const canEdit = usePermission('product.edit');
  const updateMutation = useUpdateProduct();

  const handleSave = () => {
    updateMutation.mutate(
      {
        id: product.id,
        dto: {
          name: formData.name,
          description: formData.description,
          minAmount: formData.minAmount,
          maxAmount: formData.maxAmount,
          defaultAmount: formData.defaultAmount,
          amountIncrement: formData.amountIncrement,
          minTenureMonths: formData.minTenureMonths,
          maxTenureMonths: formData.maxTenureMonths,
          allowedTenures: formData.allowedTenures,
          interestModel: formData.interestModel,
          baseInterestRateAnnualPct: formData.baseInterestRateAnnualPct,
          mclrSpreadAnnualPct: formData.mclrSpreadAnnualPct,
          feeSchedule: formData.feeSchedule,
          eligibility: formData.eligibility,
          documents: formData.documents,
          creditPolicy: formData.creditPolicy,
          riskPolicy: formData.riskPolicy,
          approvalConfig: formData.approvalConfig,
          workflowId: formData.workflowId,
          allowedChannels: formData.allowedChannels,
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const tabs: Array<{ key: TabKey; label: string; icon: any }> = [
    { key: 'OVERVIEW', label: 'Overview', icon: Package },
    { key: 'AMOUNT_TENURE', label: 'Amount & Tenure', icon: Layers },
    { key: 'INTEREST', label: 'Interest & Pricing', icon: Percent },
    { key: 'FEES', label: 'Fee Schedule', icon: Receipt },
    { key: 'ELIGIBILITY', label: 'Eligibility Rules', icon: Users },
    { key: 'DOCUMENTS', label: 'Document Checklist', icon: FileCheck },
    { key: 'CREDIT_RISK', label: 'Credit & Risk Policy', icon: ShieldCheck },
    { key: 'WORKFLOW', label: 'Workflow & Channels', icon: GitBranch },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{formData.name}</h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  v{formData.version}
                </span>
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full border',
                    formData.status === 'ACTIVE' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                    formData.status === 'DRAFT' && 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    formData.status === 'INACTIVE' && 'bg-slate-700/30 text-slate-400 border-slate-600',
                    formData.status === 'ARCHIVED' && 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  )}
                >
                  {formData.status}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{formData.code} • Tenant: {formData.tenantId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canEdit && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs"
              >
                Edit Configuration
              </Button>
            )}
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFormData({ ...product });
                    setIsEditing(false);
                  }}
                  className="text-slate-400 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  {product.status === 'ACTIVE' ? 'Save New Version' : 'Save Changes'}
                </Button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-2 border-b border-slate-800 bg-slate-950/40 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors',
                  isCurrent
                    ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-900/60">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Product Name</label>
                  <input
                    disabled={!isEditing}
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase">Product Unique Code</label>
                  <input
                    disabled
                    type="text"
                    value={formData.code}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/40 border border-slate-700/60 rounded-lg text-sm font-mono text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Description</label>
                <textarea
                  disabled={!isEditing}
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/60">
                <div>
                  <p className="text-xs text-slate-400">Product Category</p>
                  <p className="text-sm font-bold text-white mt-0.5">{formData.productType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Lifecycle Status</p>
                  <p className="text-sm font-bold text-emerald-400 mt-0.5">{formData.status}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Tenant Scope</p>
                  <p className="text-sm font-mono text-slate-300 mt-0.5">{formData.tenantId}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AMOUNT & TENURE */}
          {activeTab === 'AMOUNT_TENURE' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-200">Lending Amount Rules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Minimum Loan Amount (₹)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.minAmount}
                    onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Maximum Loan Amount (₹)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.maxAmount}
                    onChange={(e) => setFormData({ ...formData, maxAmount: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Amount Increment Step (₹)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.amountIncrement || 1000}
                    onChange={(e) => setFormData({ ...formData, amountIncrement: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-200 pt-2 border-t border-slate-800">Tenure Schedule</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Minimum Tenure (Months)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.minTenureMonths}
                    onChange={(e) => setFormData({ ...formData, minTenureMonths: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Maximum Tenure (Months)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.maxTenureMonths}
                    onChange={(e) => setFormData({ ...formData, maxTenureMonths: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Allowed Tenures (Comma Separated)</label>
                <input
                  disabled={!isEditing}
                  type="text"
                  value={formData.allowedTenures?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      allowedTenures: e.target.value.split(',').map((v) => Number(v.trim())).filter(Boolean),
                    })
                  }
                  className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 3: INTEREST & PRICING */}
          {activeTab === 'INTEREST' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Interest Calculation Model</label>
                  <select
                    disabled={!isEditing}
                    value={formData.interestModel}
                    onChange={(e) => setFormData({ ...formData, interestModel: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  >
                    <option value="REDUCING_BALANCE">Reducing Balance (Standard Annuity)</option>
                    <option value="FIXED_FLAT">Fixed Flat Rate</option>
                    <option value="FLOATING_MCLR_LINKED">Floating (MCLR Linked)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Base Annual Interest Rate (%)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    step="0.1"
                    value={formData.baseInterestRateAnnualPct}
                    onChange={(e) => setFormData({ ...formData, baseInterestRateAnnualPct: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              {formData.interestModel === 'FLOATING_MCLR_LINKED' && (
                <div>
                  <label className="text-xs text-slate-400">MCLR Spread (% p.a.)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    step="0.1"
                    value={formData.mclrSpreadAnnualPct || 0}
                    onChange={(e) => setFormData({ ...formData, mclrSpreadAnnualPct: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FEE SCHEDULE & PENALTIES */}
          {activeTab === 'FEES' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-200">Origination Fees</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Processing Fee (%)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    step="0.1"
                    value={formData.feeSchedule.processingFeePct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, processingFeePct: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Min Processing Fee (₹)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.feeSchedule.processingFeeMinInr}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, processingFeeMinInr: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Documentation Charges (₹)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.feeSchedule.documentationChargesInr}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, documentationChargesInr: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-200 pt-2 border-t border-slate-800">
                Foreclosure & Overdue Penalties
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Foreclosure Penalty (%)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    step="0.1"
                    value={formData.feeSchedule.foreclosurePenaltyPct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, foreclosurePenaltyPct: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Lock-in Period (Months)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.feeSchedule.lockInMonths}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, lockInMonths: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Monthly Late Penalty (%)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    step="0.1"
                    value={formData.feeSchedule.latePaymentPenaltyMonthlyPct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeSchedule: { ...formData.feeSchedule, latePaymentPenaltyMonthlyPct: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ELIGIBILITY RULES */}
          {activeTab === 'ELIGIBILITY' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Min Applicant Age</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.eligibility.minAge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        eligibility: { ...formData.eligibility, minAge: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Max Applicant Age</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.eligibility.maxAge}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        eligibility: { ...formData.eligibility, maxAge: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Min Monthly Income (₹)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.eligibility.minMonthlyIncome}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        eligibility: { ...formData.eligibility, minMonthlyIncome: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Allowed Employment Types</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL'].map((emp) => {
                    const selected = formData.eligibility.allowedEmploymentTypes.includes(emp as any);
                    return (
                      <span
                        key={emp}
                        className={cn(
                          'px-3 py-1 rounded-lg text-xs font-semibold border',
                          selected
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-slate-800 text-slate-500 border-slate-700'
                        )}
                      >
                        {emp}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: DOCUMENT CHECKLIST */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Documents required for straight-through-processing (STP) and assisted loan origination.
              </p>
              <div className="space-y-2">
                {formData.documents?.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/60"
                  >
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="text-xs font-bold text-white">{doc.documentType}</p>
                        <p className="text-[11px] text-slate-400">{doc.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {doc.category}
                      </span>
                      {doc.mandatory ? (
                        <Badge variant="danger" className="text-[10px]">
                          Mandatory
                        </Badge>
                      ) : (
                        <Badge variant="default" className="text-[10px]">
                          Optional
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: CREDIT & RISK POLICY */}
          {activeTab === 'CREDIT_RISK' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-200">Credit Bureau Policy</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Min CIBIL Score</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.creditPolicy.minCibilScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        creditPolicy: { ...formData.creditPolicy, minCibilScore: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Max FOIR (%)</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.creditPolicy.maxFoirPct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        creditPolicy: { ...formData.creditPolicy, maxFoirPct: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Bureau Provider</label>
                  <input
                    disabled
                    type="text"
                    value={formData.creditPolicy.bureauProvider || 'CIBIL'}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-sm font-mono text-slate-300"
                  />
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-200 pt-2 border-t border-slate-800">
                Risk & Fraud Intelligence
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Risk Grade</label>
                  <input
                    disabled
                    type="text"
                    value={formData.riskPolicy.riskGrade}
                    className="w-full mt-1 px-3 py-2 bg-slate-800/40 border border-slate-700 rounded-lg text-sm font-mono text-slate-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Max Fraud Score Cap</label>
                  <input
                    disabled={!isEditing}
                    type="number"
                    value={formData.riskPolicy.maxFraudScore}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        riskPolicy: { ...formData.riskPolicy, maxFraudScore: Number(e.target.value) },
                      })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white"
                  />
                </div>
                <div className="flex items-center gap-3 pt-4">
                  <span className="text-xs text-slate-300">Penny Drop:</span>
                  <span className="text-xs font-bold text-emerald-400">REQUIRED</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: WORKFLOW & CHANNELS */}
          {activeTab === 'WORKFLOW' && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Assigned Workflow Definition</label>
                <div className="mt-2 p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-bold text-white font-mono">{formData.workflowId}</p>
                      <p className="text-xs text-slate-400">Standard Assisted & Digital Origination Flow</p>
                    </div>
                  </div>
                  <Badge variant="info">Bound</Badge>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase">Enabled Lending Channels</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {['DIRECT_BORROWER', 'LOAN_OFFICER', 'BRANCH', 'PARTNER', 'API'].map((ch) => {
                    const active = formData.allowedChannels?.includes(ch as any);
                    return (
                      <div
                        key={ch}
                        className={cn(
                          'p-3 rounded-lg border text-xs font-medium flex items-center gap-2',
                          active
                            ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                            : 'bg-slate-800/30 text-slate-500 border-slate-800'
                        )}
                      >
                        <CheckCircle2 className={cn('w-4 h-4', active ? 'text-blue-400' : 'text-slate-600')} />
                        {ch.replace(/_/g, ' ')}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
