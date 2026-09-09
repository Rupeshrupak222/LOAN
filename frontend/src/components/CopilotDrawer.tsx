'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import {
  Bot,
  X,
  Send,
  Sparkles,
  RefreshCw,
  User,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { RoleName } from '@/lib/roles';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const ROLE_PROMPT_SUGGESTIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    'Which loans need my attention today and why?',
    'What is the status of loan LN-26096694?',
    'Show me pending underwriting and disbursement queues',
    'Summarize current delinquency and overdue exposure',
  ],
  ADMIN: [
    'Are there any pending staff or branch approvals?',
    'Summarize platform operational queues',
    'Which loan accounts have active delinquency?',
  ],
  LOAN_OFFICER: [
    'What is the status of loan LN-26096694?',
    'Which borrowers have pending KYC documents?',
    'Show me recent application submissions',
  ],
  CREDIT_ANALYST: [
    'Which applications are awaiting credit assessment?',
    'What are the risk factors for loan LN-26096694?',
    'Summarize DTI and policy compliance across queue',
  ],
  UNDERWRITER: [
    'Which proposals are in the underwriting queue?',
    'Why is loan LN-26096694 considered low/high risk?',
    'Show applications ready for sanction decision',
  ],
  FINANCE_OFFICER: [
    'Which loans are ready for electronic fund release?',
    'Are there unverified borrower payment proofs to settle?',
    'Summarize disbursement and collection totals',
  ],
  COLLECTION_OFFICER: [
    'Which overdue loans are the most critical today?',
    'Show active collection cases with high DPD',
    'Are there any promises-to-pay (PTP) due today?',
  ],
  BRANCH_MANAGER: [
    'How is our branch loan portfolio performing?',
    'Which loans in our branch need immediate action?',
    'Summarize branch underwriting and disbursement queues',
  ],
  AUDITOR: [
    'What recent compliance or security mutations occurred?',
    'Verify audit status of loan LN-26096694',
    'Show ledger transaction trail for recent payments',
  ],
  CUSTOMER: [
    'What is my active loan status and outstanding balance?',
    'When is my next EMI due and what is the amount?',
    'How can I submit my EMI payment reference proof?',
  ],
};

export function CopilotDrawer() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.firstName || 'there'}! I am your **Adyapan AI Copilot**, powered by Google Gemini. How can I assist you with loans, underwriting, servicing, or collections today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const primaryRole = (user?.roles?.[0] || 'CUSTOMER') as RoleName;
  const suggestions = ROLE_PROMPT_SUGGESTIONS[primaryRole] || ROLE_PROMPT_SUGGESTIONS.CUSTOMER;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Keyboard shortcut Ctrl+J to toggle Copilot
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function sendMessage(textToSend?: string) {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    setInput('');
    setError(null);

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await api.post('/ai/copilot/chat', {
        message: text,
        history: historyPayload,
        currentPath: pathname,
      });

      const answer = res.data?.data?.answer || 'No response received from Copilot.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      const errMsg = apiErrorMessage(err);
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ **Unable to process request:** ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages([
      {
        role: 'assistant',
        content: `Conversation reset. How can I assist you with your ${primaryRole.toLowerCase().replace('_', ' ')} tasks?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setError(null);
  }

  // Floating portal content mounted at document.body
  const drawerPortal =
    mounted && isOpen
      ? createPortal(
          <div className="fixed inset-0 z-[99999] pointer-events-none">
            {/* Backdrop for expanded / mobile view */}
            {isExpanded && (
              <div
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs pointer-events-auto transition-opacity"
                onClick={() => setIsExpanded(false)}
              />
            )}

            {/* Floating Copilot Window */}
            <div
              className={cn(
                'fixed pointer-events-auto flex flex-col transition-all duration-200 shadow-2xl rounded-2xl border overflow-hidden',
                isDark
                  ? 'bg-[#060F1B] border-[#1E2445] text-white shadow-black/80'
                  : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/40',
                isExpanded
                  ? 'inset-3 sm:inset-4 md:inset-10'
                  : 'bottom-3 right-3 sm:bottom-5 sm:right-5 w-[calc(100vw-1.5rem)] sm:w-[450px] max-w-[450px] h-[580px] max-h-[85vh]'
              )}
            >
              {/* Header */}
              <div
                className={cn(
                  'flex items-center justify-between p-3.5 border-b select-none shrink-0',
                  isDark ? 'border-[#1E2445] bg-[#1E2445]/50' : 'border-slate-100 bg-slate-50/90'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-indigo-600 text-white shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold tracking-tight">Adyapan AI Copilot</h3>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Gemini Live
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Role: <span className="font-semibold text-slate-300">{primaryRole}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleReset}
                    title="Clear Conversation"
                    className={cn(
                      'p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer',
                      isDark ? 'hover:bg-[#1E2445]' : 'hover:bg-slate-200/60'
                    )}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    title={isExpanded ? 'Restore' : 'Maximize'}
                    className={cn(
                      'p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition cursor-pointer hidden sm:block',
                      isDark ? 'hover:bg-[#1E2445]' : 'hover:bg-slate-200/60'
                    )}
                  >
                    {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    title="Close Copilot"
                    className={cn(
                      'p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition cursor-pointer',
                      isDark ? 'hover:bg-rose-950/30' : 'hover:bg-rose-50'
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                {messages.map((m, idx) => {
                  const isAssistant = m.role === 'assistant';
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'flex gap-2.5 max-w-[92%]',
                        isAssistant ? 'self-start' : 'self-end ml-auto flex-row-reverse'
                      )}
                    >
                      <div
                        className={cn(
                          'h-6 w-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-xs',
                          isAssistant
                            ? 'bg-gradient-to-br from-[#2563EB] to-indigo-600 text-white shadow-sm'
                            : isDark
                            ? 'bg-[#1E2445] text-slate-300'
                            : 'bg-slate-200 text-slate-700'
                        )}
                      >
                        {isAssistant ? <Sparkles className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      </div>

                      <div
                        className={cn(
                          'rounded-2xl p-3 space-y-1.5 shadow-sm leading-relaxed',
                          isAssistant
                            ? isDark
                              ? 'bg-[#0f172a] border border-[#1E2445] text-slate-200'
                              : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                            : 'bg-[#2563EB] text-white font-medium'
                        )}
                      >
                        <div className="whitespace-pre-wrap font-sans text-xs break-words">
                          {m.content}
                        </div>
                        {m.timestamp && (
                          <p
                            className={cn(
                              'text-[9px] text-right font-mono',
                              isAssistant ? 'text-slate-400' : 'text-blue-100'
                            )}
                          >
                            {m.timestamp}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-2.5 text-slate-400 text-xs py-1">
                    <div className="h-6 w-6 rounded-md bg-gradient-to-br from-[#2563EB] to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles className="h-3 w-3 animate-spin" />
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[11px] text-slate-400 ml-1">Analyzing verified LMS database...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions Pills */}
              <div
                className={cn(
                  'px-3 py-2 border-t overflow-x-auto scrollbar-none flex items-center gap-1.5 shrink-0',
                  isDark ? 'border-[#1E2445] bg-[#060F1B]/60' : 'border-slate-100 bg-slate-50/50'
                )}
              >
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                    className={cn(
                      'shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer truncate max-w-[240px]',
                      isDark
                        ? 'border-[#1E2445] bg-[#1E2445]/60 text-slate-300 hover:text-white hover:border-[#2B3566]'
                        : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className={cn(
                  'p-3 border-t flex items-center gap-2 shrink-0',
                  isDark ? 'border-[#1E2445] bg-[#1E2445]/20' : 'border-slate-100 bg-white'
                )}
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Ask Copilot anything about ${primaryRole.toLowerCase().replace('_', ' ')} tasks...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                  className={cn(
                    'flex-1 h-9 px-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition',
                    isDark
                      ? 'border-[#1E2445] bg-[#1E2445]/60 text-white placeholder:text-slate-500'
                      : 'border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400'
                  )}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {/* Header Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title="Open AI Copilot (Ctrl + J)"
        className={cn(
          'relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs cursor-pointer',
          isOpen
            ? 'border-[#2563EB] bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/20'
            : isDark
            ? 'border-[#1E2445] bg-[#1E2445] text-slate-200 hover:text-white hover:border-[#2B3566]'
            : 'border-slate-200/90 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50'
        )}
      >
        <Sparkles className={cn('h-3.5 w-3.5', isOpen ? 'text-amber-300' : 'text-blue-500 animate-pulse')} />
        <span className="hidden sm:inline">AI Copilot</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-mono hidden md:inline">Ctrl+J</span>
      </button>

      {/* Rendered Floating Portal */}
      {drawerPortal}
    </>
  );
}
