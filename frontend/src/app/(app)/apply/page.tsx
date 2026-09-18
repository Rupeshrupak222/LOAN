'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui';

export default function ApplyRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/borrower/apply');
  }, [router]);

  return (
    <div className="py-24 text-center">
      <Spinner />
      <p className="text-xs text-slate-400 mt-2">Redirecting to Digital Application Portal...</p>
    </div>
  );
}

