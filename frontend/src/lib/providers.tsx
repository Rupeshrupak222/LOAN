'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import axios from 'axios';
import { AuthProvider } from './auth';
import { ThemeProvider } from './theme';
import { BrandingProvider } from './branding';
import { ToastProvider } from './toast';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s cache to avoid redundant background storms during fast tab switching
            gcTime: 5 * 60 * 1000, // 5m garbage collection
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Never retry client-side errors (400, 401, 403, 404, 422)
              if (axios.isAxiosError(error) && error.response?.status) {
                const status = error.response.status;
                if (status >= 400 && status < 500) {
                  return false;
                }
              }
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false, // Do not auto-retry state-changing mutations to preserve idempotency
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <BrandingProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </BrandingProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
