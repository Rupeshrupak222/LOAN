'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building,
  Plus,
  Search,
  Filter,
  Shield,
  Key,
  Webhook,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  PauseCircle,
  XCircle,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { usePartners } from '../hooks/usePartners';
import type { PartnerEntity, PartnerType, PartnerStatus } from '../types';

export const PartnerList: React.FC = () => {
  const { partners, isLoading, updateStatus, registerPartner } = usePartners();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);

  // New partner form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'FINTECH' as PartnerType,
    email: '',
    phone: '',
    pan: '',
    gstin: '',
    contactPerson: '',
  });

  const filteredPartners = partners.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // KPI calculations
  const totalActive = partners.filter((p) => p.status === 'ACTIVE').length;
  const totalSuspended = partners.filter((p) => p.status === 'SUSPENDED').length;
  const totalDisbursed = partners.reduce((acc, p) => acc + (p.totalDisbursedVolume || 0), 0);
  const totalCredentials = partners.reduce((acc, p) => acc + (p.credentialsCount || 0), 0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.pan) return;
    await registerPartner(formData);
    setShowModal(false);
    setFormData({
      name: '',
      code: '',
      type: 'FINTECH',
      email: '',
      phone: '',
      pan: '',
      gstin: '',
      contactPerson: '',
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
              LSP & Embedded Sourcing
            </span>
            <span className="text-xs text-muted-foreground font-mono">Phase 8 Platform</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Partner & LSP Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage embedded fintech partners, LSPs, distribution channels, API credentials, and commercial agreements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-md hover:bg-primary/95 hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Onboard New Partner
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Partners</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{totalActive}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
            <span className="text-emerald-500 font-semibold">{partners.length} total</span> registered partners
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sourced Volume</p>
              <h3 className="text-2xl font-black text-foreground mt-1">
                ₹{(totalDisbursed / 100000).toFixed(1)}L
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Cumulatively disbursed via partners</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">API Keys Active</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{totalCredentials}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
              <Key className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Sandbox & Production credentials</p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suspended Partners</p>
              <h3 className="text-2xl font-black text-foreground mt-1">{totalSuspended}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <PauseCircle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Temporarily gated from new originations</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border/70 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search partner name, code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-muted/40 border border-border/80 rounded-xl focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-muted/40 border border-border/80 rounded-xl focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="FINTECH">Fintech</option>
            <option value="LSP">LSP</option>
            <option value="BANK">Bank</option>
            <option value="NBFC">NBFC</option>
            <option value="MERCHANT_PLATFORM">Merchant Platform</option>
            <option value="DSA">DSA</option>
          </select>
        </div>
      </div>

      {/* Partners Table */}
      <div className="rounded-2xl border border-border/70 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold text-muted-foreground uppercase border-b border-border/60">
              <tr>
                <th className="px-6 py-4">Partner Name & Code</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Allowed Products</th>
                <th className="px-6 py-4">API Creds</th>
                <th className="px-6 py-4">Sourced Volume</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredPartners.map((partner) => (
                <tr key={partner.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary">
                        {partner.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/partners/${partner.id}`}
                          className="font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          {partner.name}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-xs text-muted-foreground">{partner.code}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{partner.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground border border-border/80">
                      {partner.type}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        partner.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : partner.status === 'SUSPENDED'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {partner.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">
                        {partner.allowedProducts.filter((p) => p.isActive).length}
                      </span>
                      <span>products active</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
                      <Key className="w-3.5 h-3.5 text-primary" />
                      <span>{partner.credentialsCount || 0} active</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-semibold text-foreground">
                    ₹{(partner.totalDisbursedVolume || 0).toLocaleString('en-IN')}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          updateStatus({
                            id: partner.id,
                            status: partner.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                          })
                        }
                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border hover:bg-muted/80 transition-colors"
                      >
                        {partner.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>

                      <Link
                        href={`/partners/${partner.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"
                      >
                        Configure
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <h3 className="text-xl font-bold text-foreground">Onboard New Partner</h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                  Partner / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Embedded Fintech Ltd"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Partner Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ACME_PAY"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Partner Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PartnerType })}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none"
                  >
                    <option value="FINTECH">Fintech</option>
                    <option value="LSP">LSP</option>
                    <option value="BANK">Bank</option>
                    <option value="NBFC">NBFC</option>
                    <option value="MERCHANT_PLATFORM">Merchant Platform</option>
                    <option value="EMBEDDED_FINANCE">Embedded Finance</option>
                    <option value="API_PARTNER">API Partner</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="partners@acme.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+919876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Company PAN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="27ABCDE1234F1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 text-sm bg-muted/40 border border-border rounded-xl focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium border border-border rounded-xl hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shadow-md"
                >
                  Onboard Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
