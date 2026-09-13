'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  HelpCircle,
  Plus,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  X,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { useToast } from '@/lib/toast';
import { formatDate, cn } from '@/lib/utils';
import { Button, Input, Card, Badge, Spinner } from '@/components/ui';

interface SupportTicket {
  id: string;
  ticketNo: string;
  customerId?: string;
  customerName?: string;
  subject: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  messages: { sender: string; text: string; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
}

export default function OriginationSupportPage() {
  const { isDark } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    category: 'ORIGINATION_INQUIRY',
    priority: 'MEDIUM',
    message: '',
    applicationNo: '',
  });

  // Fetch support tickets
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['support-tickets', search, statusFilter],
    queryFn: async () => {
      const res = await api.get('/support/tickets');
      const rows = res.data?.data;
      return (Array.isArray(rows) ? rows : []) as SupportTicket[];
    },
  });

  const tickets = ticketsData || [];

  // Create Ticket Mutation
  const createTicketMutation = useMutation({
    mutationFn: async () => {
      return api.post('/support/tickets', formData);
    },
    onSuccess: () => {
      toast.success('Support inquiry ticket created successfully.');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      setCreateModalOpen(false);
      setFormData({
        subject: '',
        category: 'ORIGINATION_INQUIRY',
        priority: 'MEDIUM',
        message: '',
        applicationNo: '',
      });
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err), { title: 'Failed to create inquiry' });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
              Assistance & Helpdesk
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-1">
            Origination Support & Inquiries
          </h1>
          <p className="text-xs text-slate-500">
            Raise applicant questions, document verification inquiries, and branch operational support requests.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" /> Raise Support Request
        </Button>
      </div>

      {/* Tickets List */}
      <Card className="p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        {isLoading ? (
          <div className="py-16 flex justify-center items-center">
            <Spinner />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400 space-y-2">
            <HelpCircle className="w-8 h-8 text-indigo-500 mx-auto opacity-50" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No active support requests</p>
            <p className="text-[11px] text-slate-400">Raise a support request if you require assistance with an application or customer case.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((t) => (
              <div key={t.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100">{t.subject}</span>
                    <Badge status={t.status} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Category: <span className="font-medium text-slate-700 dark:text-slate-300">{t.category}</span> • Created {formatDate(t.createdAt)}
                  </p>
                </div>

                <Button size="sm" variant="ghost" className="text-xs text-indigo-600 dark:text-indigo-400">
                  View Thread →
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Ticket Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Raise Support Inquiry</h3>
                <p className="text-xs text-slate-400">Submit an inquiry to the operations or technical team.</p>
              </div>
              <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subject *</label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="e.g. Document rejection query for App #..."
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Inquiry Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-700 dark:text-slate-200"
                >
                  <option value="ORIGINATION_INQUIRY">Origination / Intake Guidance</option>
                  <option value="KYC_VERIFICATION">KYC Document Issue</option>
                  <option value="TECHNICAL_ISSUE">Portal Technical Glitch</option>
                  <option value="POLICY_CLARIFICATION">Policy & Eligibility Question</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Application Number (Optional)</label>
                <Input
                  value={formData.applicationNo}
                  onChange={(e) => setFormData({ ...formData, applicationNo: e.target.value })}
                  placeholder="e.g. APP-2026-XXXXX"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Detailed Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  placeholder="Describe your question or issue in detail..."
                  className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button size="sm" variant="ghost" onClick={() => setCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => createTicketMutation.mutate()}
                disabled={!formData.subject || !formData.message || createTicketMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5"
              >
                {createTicketMutation.isPending ? <Spinner size="sm" /> : 'Submit Inquiry'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
