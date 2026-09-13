'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import {
  HelpCircle,
  ArrowLeft,
  MessageSquare,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Spinner, Card, Input } from '@/components/ui';
import { useToast } from '@/lib/toast';

const FAQS = [
  {
    q: 'How does the 3-day RBI cooling-off period work?',
    a: 'Under RBI Digital Lending Guidelines, you have 3 calendar days from the date of loan disbursement to exit the loan without any prepayment penalty by repaying the principal along with proportionate APR interest for the active days.',
  },
  {
    q: 'Can I foreclose or prepay my loan early?',
    a: 'Yes, full prepayment and partial prepayments are permitted after 3 successful EMIs with zero penalty for floating rate retail loans.',
  },
  {
    q: 'When and how will I receive my No-Objection Certificate (NOC)?',
    a: 'Upon full repayment of all dues, the loan status updates to CLOSED automatically, and your digitally signed NOC Certificate is available instantly for download from the My Loans portal.',
  },
  {
    q: 'How do I change my linked bank account for auto-debit?',
    a: 'You can submit a bank account update request through this support portal along with a cancelled cheque or bank statement. Our operations team verifies and links the new mandate within 24 hours.',
  },
];

export default function BorrowerSupportHubPage() {
  const { success, error } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const [ticketData, setTicketData] = useState({
    subject: '',
    category: 'REPAYMENT_MANDATE',
    description: '',
  });

  const [submittedTicket, setSubmittedTicket] = useState<any>(null);

  const createTicketMutation = useMutation({
    mutationFn: async (payload: typeof ticketData) => {
      const res = await api.post<{ data: any }>('/api/v1/borrower/support/tickets', payload);
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      setSubmittedTicket(data);
      success('Support Ticket Submitted', `Ticket #${data.ticketNumber} registered with 24-hour SLA resolution.`);
    },
    onError: (err: any) => {
      error('Submission Failed', err.response?.data?.message || 'Error submitting ticket');
    },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/borrower"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              Borrower Support & Grievance Redressal
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Assistance, FAQs, and statutory grievance escalation under RBI Ombudsman Scheme
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Support Ticket Form & FAQs */}
        <div className="md:col-span-2 space-y-6">
          {/* Create Ticket Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Submit Customer Assistance Request
            </h3>

            {submittedTicket ? (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Ticket #{submittedTicket.ticketNumber} Registered
                </div>
                <p className="text-slate-300">
                  {submittedTicket.message}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setTicketData({ subject: '', category: 'REPAYMENT_MANDATE', description: '' });
                  }}
                  className="rounded-xl border-slate-700 text-xs text-slate-300 mt-2"
                >
                  Create Another Request
                </Button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createTicketMutation.mutate(ticketData);
                }}
                className="space-y-4 text-xs"
              >
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Category</label>
                  <select
                    value={ticketData.category}
                    onChange={(e) => setTicketData({ ...ticketData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="REPAYMENT_MANDATE">Repayment & Auto-Debit Mandate</option>
                    <option value="NOC_CLOSURE">No-Objection Certificate (NOC) & Closure</option>
                    <option value="BANK_UPDATE">Update Disbursement Bank Account</option>
                    <option value="COOLING_OFF_EXIT">Cooling-off Period Loan Cancellation</option>
                    <option value="OTHER_GRIEVANCE">General Inquiries / Grievance</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Subject / Summary</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief description of the issue"
                    value={ticketData.subject}
                    onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Details</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details to help our team resolve your query swiftly..."
                    value={ticketData.description}
                    onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {createTicketMutation.isPending ? 'Submitting...' : 'Submit Support Ticket'}
                </Button>
              </form>
            )}
          </div>

          {/* Frequently Asked Questions */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs cursor-pointer transition-all"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <div className="flex justify-between items-center font-semibold text-white">
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                    {isOpen && <p className="text-slate-400 mt-2.5 leading-relaxed">{faq.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RBI Grievance Redressal Card */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Principal Grievance Officer</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              If your query is not resolved within 24 hours, you may escalate directly to our Nodal Grievance Redressal Officer.
            </p>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
              <div className="font-bold text-white">Ms. Sunita Sharma</div>
              <div className="text-slate-400 text-[11px]">Principal Nodal Officer (RBI Registered NBFC)</div>
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <a href="mailto:grievance.officer@adyapanlms.com" className="text-blue-400 underline">
                    grievance.officer@adyapanlms.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  <span>+91 1800 200 8899</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-800/80 pt-3">
              Compliant with the Reserve Bank - Integrated Ombudsman Scheme, 2021.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
