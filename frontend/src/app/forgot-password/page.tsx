'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { LogoMark } from '@/components/Logo';

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={52} />
          <h1 className="mt-3 text-xl font-bold text-slate-900">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your email and we will send reset instructions.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-card">
          {submitted ? (
            <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 ring-1 ring-inset ring-emerald-600/10">
              If an account exists for that email, reset instructions have been sent.
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <Input type="email" placeholder="you@example.com" required />
              <Button type="submit" className="w-full">
                Send reset link
              </Button>
            </form>
          )}
          <div className="mt-4 text-center">
            <a href="/login" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Back to login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
