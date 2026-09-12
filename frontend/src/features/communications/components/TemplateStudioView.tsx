'use client';

import React, { useState } from 'react';
import type {
  CommunicationChannel,
  CommunicationEventCode,
  CommunicationTemplate,
  LanguageCode,
  MessageCategory,
  TemplateStatus,
} from '../types';
import {
  FileCode,
  Plus,
  Search,
  Sparkles,
  Smartphone,
  Mail,
  MessageSquare,
  Bell,
  ShieldCheck,
  Globe,
  Tag,
  CheckCircle2,
  X,
  Play,
  Layers,
  Edit,
} from 'lucide-react';

interface Props {
  templates: CommunicationTemplate[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateTemplate: (payload: any) => Promise<void>;
  onUpdateTemplate: (id: string, payload: any) => Promise<void>;
  onPreviewTemplate: (payload: any) => Promise<{ subject?: string; body: string; missingPlaceholders: string[] }>;
}

export const TemplateStudioView: React.FC<Props> = ({
  templates,
  isLoading,
  onCreateTemplate,
  onUpdateTemplate,
  onPreviewTemplate,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedLang, setSelectedLang] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [testingTemplate, setTestingTemplate] = useState<CommunicationTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Live Test Runner State
  const [testVariables, setTestVariables] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<{ subject?: string; body: string; missingPlaceholders: string[] } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // New Template Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formEventCode, setFormEventCode] = useState<CommunicationEventCode>('WELCOME_MESSAGE');
  const [formChannel, setFormChannel] = useState<CommunicationChannel>('SMS');
  const [formLang, setFormLang] = useState<LanguageCode>('en-IN');
  const [formCategory, setFormCategory] = useState<MessageCategory>('TRANSACTIONAL');
  const [formSubject, setFormSubject] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formDltId, setFormDltId] = useState('');
  const [formSenderId, setFormSenderId] = useState('ADYAPN');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTemplates = templates.filter((t) => {
    if (selectedChannel !== 'ALL' && t.channel !== selectedChannel) return false;
    if (selectedLang !== 'ALL' && t.language !== selectedLang) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchCode = t.code.toLowerCase().includes(q);
      const matchEvt = t.eventCode.toLowerCase().includes(q);
      const matchBody = t.body.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchEvt && !matchBody) return false;
    }
    return true;
  });

  const handleOpenTestRunner = async (template: CommunicationTemplate) => {
    setTestingTemplate(template);
    // Initialize sample variables
    const initialVars: Record<string, string> = {};
    for (const v of template.variables) {
      if (v === 'customerName') initialVars[v] = 'Aarav Sharma';
      else if (v === 'amount' || v === 'offeredAmount' || v === 'disbursedAmount' || v === 'emiAmount' || v === 'amountPaid') initialVars[v] = '45,000';
      else if (v === 'loanId') initialVars[v] = 'LOAN-2026-9182';
      else if (v === 'applicationId') initialVars[v] = 'APP-84920';
      else if (v === 'dueDate' || v === 'firstEmiDate') initialVars[v] = '15-Oct-2026';
      else if (v === 'bankAccountLast4') initialVars[v] = '4892';
      else if (v === 'utrNumber') initialVars[v] = 'HDFC00192837482';
      else if (v === 'ticketNumber') initialVars[v] = 'TKT-2026-1042';
      else if (v === 'complaintNumber') initialVars[v] = 'GRV-2026-0512';
      else initialVars[v] = `[${v}]`;
    }
    setTestVariables(initialVars);

    setIsPreviewLoading(true);
    try {
      const res = await onPreviewTemplate({
        templateId: template.id,
        data: initialVars,
      });
      setPreviewResult(res);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleVariableChange = async (key: string, val: string) => {
    const updated = { ...testVariables, [key]: val };
    setTestVariables(updated);

    if (testingTemplate) {
      const res = await onPreviewTemplate({
        templateId: testingTemplate.id,
        data: updated,
      });
      setPreviewResult(res);
    }
  };

  const handleOpenCreate = () => {
    setFormName('');
    setFormCode('');
    setFormEventCode('APPLICATION_APPROVED');
    setFormChannel('SMS');
    setFormLang('en-IN');
    setFormCategory('TRANSACTIONAL');
    setFormSubject('');
    setFormBody('Congratulations {{customerName}}! Your loan of INR {{amount}} has been approved.');
    setFormDltId('DLT_11071619999999');
    setFormSenderId('ADYAPN');
    setIsCreating(true);
  };

  const handleOpenEdit = (template: CommunicationTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormCode(template.code);
    setFormEventCode(template.eventCode);
    setFormChannel(template.channel);
    setFormLang(template.language);
    setFormCategory(template.category);
    setFormSubject(template.subject || '');
    setFormBody(template.body);
    setFormDltId(template.dltTemplateId || '');
    setFormSenderId(template.dltSenderId || 'ADYAPN');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTemplate) {
        await onUpdateTemplate(editingTemplate.id, {
          name: formName,
          subject: formSubject,
          body: formBody,
          language: formLang,
          category: formCategory,
          dltTemplateId: formDltId,
          dltSenderId: formSenderId,
        });
        setEditingTemplate(null);
      } else {
        await onCreateTemplate({
          name: formName,
          code: formCode,
          eventCode: formEventCode,
          channel: formChannel,
          language: formLang,
          category: formCategory,
          subject: formSubject,
          body: formBody,
          dltTemplateId: formDltId,
          dltSenderId: formSenderId,
        });
        setIsCreating(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChannelIcon = (channel: CommunicationChannel) => {
    switch (channel) {
      case 'SMS':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-400" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-blue-400" />;
      case 'WHATSAPP':
        return <MessageSquare className="w-3.5 h-3.5 text-green-400" />;
      case 'PUSH':
      case 'IN_APP':
        return <Bell className="w-3.5 h-3.5 text-amber-400" />;
      case 'INTERNAL_NOTIFICATION':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Studio Header & Action Bar */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search templates, variables, DLT ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Channels</option>
              <option value="SMS">SMS</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="EMAIL">Email</option>
              <option value="PUSH">Push</option>
              <option value="IN_APP">In-App</option>
              <option value="INTERNAL_NOTIFICATION">Internal Staff</option>
            </select>

            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Languages</option>
              <option value="en-IN">English (en-IN)</option>
              <option value="hi-IN">Hindi (hi-IN)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
            No templates match the selected criteria.
          </div>
        ) : (
          filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition">
                      {tmpl.name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">{tmpl.code}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      v{tmpl.version}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                      {tmpl.status}
                    </span>
                  </div>
                </div>

                {/* Channel & Language */}
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-3">
                  <div className="flex items-center gap-1">
                    {getChannelIcon(tmpl.channel)}
                    <span className="font-medium text-slate-300">{tmpl.channel}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Globe className="w-3 h-3 text-slate-500" />
                    <span>{tmpl.language}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] text-amber-400/90">{tmpl.category}</span>
                  </div>
                </div>

                {/* Subject if present */}
                {tmpl.subject ? (
                  <div className="text-[11px] font-semibold text-slate-300 mb-1 truncate">
                    Subject: {tmpl.subject}
                  </div>
                ) : null}

                {/* Body Preview */}
                <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 text-xs text-slate-300 font-sans leading-relaxed line-clamp-3 mb-3">
                  {tmpl.body}
                </div>

                {/* Variables & DLT ID */}
                <div className="space-y-2 mb-4">
                  {tmpl.variables.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {tmpl.variables.map((v) => (
                        <span
                          key={v}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-indigo-300 border border-slate-700"
                        >
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {tmpl.dltTemplateId ? (
                    <div className="text-[10px] font-mono text-slate-400 truncate">
                      DLT ID: <strong className="text-slate-300">{tmpl.dltTemplateId}</strong> | Header: <strong className="text-slate-300">{tmpl.dltSenderId}</strong>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleOpenTestRunner(tmpl)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-medium text-xs rounded-lg transition"
                >
                  <Play className="w-3 h-3" />
                  Live Test Runner
                </button>
                <button
                  onClick={() => handleOpenEdit(tmpl)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                  title="Edit Template"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Live Test Runner Modal */}
      {testingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Interactive Template Sandbox: {testingTemplate.name}
                </h3>
                <span className="text-xs text-slate-400">
                  Channel: {testingTemplate.channel} | Language: {testingTemplate.language} | Version: v{testingTemplate.version}
                </span>
              </div>
              <button
                onClick={() => setTestingTemplate(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto flex-1">
              {/* Variable Inputs */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Template Placeholders
                </h4>
                {testingTemplate.variables.length === 0 ? (
                  <p className="text-xs text-slate-500">This template has no dynamic variable placeholders.</p>
                ) : (
                  testingTemplate.variables.map((v) => (
                    <div key={v}>
                      <label className="text-[11px] font-mono text-indigo-300 block mb-1">
                        {`{{${v}}}`}
                      </label>
                      <input
                        type="text"
                        value={testVariables[v] || ''}
                        onChange={(e) => handleVariableChange(v, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-sans"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Rendered Live Simulation */}
              <div className="space-y-3 flex flex-col">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Simulated Customer View
                </h4>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {previewResult?.subject ? (
                      <div className="text-xs font-bold text-white pb-2 mb-2 border-b border-slate-800">
                        Subject: {previewResult.subject}
                      </div>
                    ) : null}
                    <p className="text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {previewResult?.body || testingTemplate.body}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Target: {testingTemplate.channel}</span>
                    {previewResult?.missingPlaceholders && previewResult.missingPlaceholders.length > 0 ? (
                      <span className="text-rose-400 font-semibold">
                        ⚠️ Missing {previewResult.missingPlaceholders.length} variable(s)
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All Variables Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
              <button
                onClick={() => setTestingTemplate(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white rounded-lg transition"
              >
                Close Sandbox
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Template Modal */}
      {(isCreating || editingTemplate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleSubmitForm}
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                {editingTemplate ? `Edit Template (New Version v${editingTemplate.version + 1})` : 'Create New Template'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingTemplate(null);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Loan Sanction WhatsApp Alert"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Template Code
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTemplate}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. WA_LOAN_SANCTION_V1"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 disabled:opacity-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Channel
                  </label>
                  <select
                    disabled={!!editingTemplate}
                    value={formChannel}
                    onChange={(e) => setFormChannel(e.target.value as CommunicationChannel)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    <option value="SMS">SMS</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="EMAIL">Email</option>
                    <option value="PUSH">Push</option>
                    <option value="IN_APP">In-App</option>
                    <option value="INTERNAL_NOTIFICATION">Internal Staff</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Language
                  </label>
                  <select
                    value={formLang}
                    onChange={(e) => setFormLang(e.target.value as LanguageCode)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="en-IN">English (en-IN)</option>
                    <option value="hi-IN">Hindi (hi-IN)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MessageCategory)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    <option value="TRANSACTIONAL">TRANSACTIONAL</option>
                    <option value="COLLECTION">COLLECTION</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="SUPPORT">SUPPORT</option>
                    <option value="MARKETING">MARKETING</option>
                    <option value="REGULATORY">REGULATORY</option>
                  </select>
                </div>
              </div>

              {(formChannel === 'EMAIL' || formChannel === 'PUSH' || formChannel === 'INTERNAL_NOTIFICATION') && (
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">
                    Subject Line Template
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. Loan Application #{{applicationId}} Approved"
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Message Body (Use {'{{variable}}'} for variables)
                </label>
                <textarea
                  required
                  rows={4}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Dear {{customerName}}, your loan of INR {{amount}} has been approved."
                  className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              {formChannel === 'SMS' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      DLT Template ID (TRAI Compliance)
                    </label>
                    <input
                      type="text"
                      value={formDltId}
                      onChange={(e) => setFormDltId(e.target.value)}
                      placeholder="e.g. DLT_1107161234567890"
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-medium text-slate-400 block mb-1">
                      Sender Header (DLT)
                    </label>
                    <input
                      type="text"
                      value={formSenderId}
                      onChange={(e) => setFormSenderId(e.target.value)}
                      placeholder="e.g. ADYAPN"
                      className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-mono uppercase"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white rounded-lg transition shadow-md shadow-indigo-600/20"
              >
                {isSubmitting ? 'Saving...' : editingTemplate ? 'Publish New Version' : 'Create Template'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
