'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { LogoMark } from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md animate-fade-in space-y-6">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={52} />
          <h1 className="mt-3 text-xl font-bold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            Enter your corporate email address to receive password recovery instructions.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-card space-y-5">
          {submitted ? (
            <div className="space-y-4 text-center py-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recovery Instructions Sent</h3>
                <p className="text-xs text-slate-500 mt-1">
                  If an account exists for <strong className="text-slate-800">{email}</strong>, you will receive an authentication link shortly.
                </p>
              </div>
              <Link href="/login" className="block pt-2">
                <Button variant="secondary" className="w-full text-xs">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email Address</label>
                <Input
                  type="email"
                  placeholder="name@adyapan.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full py-2.5 text-xs font-bold" disabled={!email.trim()}>
                Send Password Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secured by Adyapan FinTech Core</span>
        </div>
      </div>
    </div>
  );
}
