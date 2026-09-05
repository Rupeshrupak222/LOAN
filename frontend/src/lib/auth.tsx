'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, setAccessToken, onAuthInvalidated } from './api';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PUBLIC_PREFIXES = [
  '/',
  '/apply',
  '/login',
  '/about',
  '/contact',
  '/products',
  '/resources',
  '/forgot-password',
];

function isPublicRoute(path?: string | null): boolean {
  if (!path || path === '/') return true;
  return PUBLIC_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Restore session from token / refresh cookie on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await api.get('/auth/me');
        if (isMounted) {
          setUser(res.data.data);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    // Subscribe to auth invalidation broadcast (e.g. from 401 interceptor)
    const unsubscribe = onAuthInvalidated(() => {
      if (isMounted) {
        setUser(null);
        setLoading(false);
        // Only redirect if inside an authenticated app route
        if (pathname && !isPublicRoute(pathname)) {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [pathname, router]);

  const login = useCallback(async (identifier: string, password: string) => {
    const res = await api.post('/auth/login', { identifier, password });
    setAccessToken(res.data.data.accessToken);
    setUser(res.data.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort logout on backend
    } finally {
      setAccessToken(null);
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
