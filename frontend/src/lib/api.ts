import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

// Timeout configurations based on operation type (in ms)
export const TIMEOUT_CONFIG = {
  DEFAULT: 15_000,   // Standard REST operations
  AI: 30_000,        // Generative AI & Decision Intelligence
  UPLOAD: 45_000,    // Document & Binary uploads
  EXPORT: 30_000,    // Large PDF / CSV reports & export bundles
  AUTH_REFRESH: 8_000 // Fast fail on token refresh
} as const;

export const api = axios.create({
  baseURL: API_URL,
  timeout: TIMEOUT_CONFIG.DEFAULT,
  withCredentials: true, // Send refresh cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
}

// Global Auth Invalidation Event listener for seamless login redirection
type AuthInvalidationListener = () => void;
const authListeners: Set<AuthInvalidationListener> = new Set();

export function onAuthInvalidated(listener: AuthInvalidationListener) {
  authListeners.add(listener);
  return () => {
    authListeners.delete(listener);
  };
}

export function notifyAuthInvalidated() {
  setAccessToken(null);
  authListeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Auth invalidation listener error:', e);
    }
  });
}

// Request Interceptor: Attach Auth, Correlation ID, and Dynamic Timeout
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Set correlation ID if not already present
  if (!config.headers['X-Correlation-ID'] && !config.headers['x-correlation-id']) {
    const randomSuffix = Math.random().toString(36).substring(2, 9);
    config.headers['X-Correlation-ID'] = `client-${Date.now()}-${randomSuffix}`;
  }

  // Assign appropriate timeout by endpoint pattern if not explicitly overridden
  if (!config.timeout || config.timeout === TIMEOUT_CONFIG.DEFAULT) {
    const url = config.url || '';
    if (url.includes('/ai/') || url.includes('intelligence') || url.includes('simulate')) {
      config.timeout = TIMEOUT_CONFIG.AI;
    } else if (url.includes('/documents/upload') || (config.data instanceof FormData)) {
      config.timeout = TIMEOUT_CONFIG.UPLOAD;
    } else if (url.includes('/reports/export') || url.includes('/export')) {
      config.timeout = TIMEOUT_CONFIG.EXPORT;
    }
  }

  // Track request start timestamp for performance observability
  (config as any).__startTime = Date.now();

  return config;
});

// Single in-flight refresh promise to prevent refresh storms
let refreshingPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        timeout: TIMEOUT_CONFIG.AUTH_REFRESH,
      }
    );
    const token = res.data?.data?.accessToken ?? null;
    setAccessToken(token);
    return token;
  } catch (err) {
    setAccessToken(null);
    return null;
  }
}

// Response Interceptor: 401 Recovery, Latency Tracking & Timeout Normalization
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Record client-side latency observability for slow responses
    const startTime = (response.config as any)?.__startTime;
    if (startTime) {
      const duration = Date.now() - startTime;
      if (duration > 4000 && process.env.NODE_ENV !== 'production') {
        console.warn(`[Slow API Request] ${response.config.method?.toUpperCase()} ${response.config.url} took ${duration}ms`);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean; __startTime?: number });

    // Client-side latency logging on error
    if (original?.__startTime) {
      const duration = Date.now() - original.__startTime;
      if (duration > 3000 && process.env.NODE_ENV !== 'production') {
        console.warn(`[Slow API Error] ${original.method?.toUpperCase()} ${original.url} failed after ${duration}ms`);
      }
    }

    // Handle 401 Unauthorized with single atomic refresh retry
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/login') && !original.url?.includes('/auth/refresh')) {
      original._retry = true;

      if (!refreshingPromise) {
        refreshingPromise = refreshAccessToken().finally(() => {
          refreshingPromise = null;
        });
      }

      const newToken = await refreshingPromise;
      if (newToken) {
        if (!original.headers) original.headers = {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } else {
        // Refresh failed: session is expired
        if (getAccessToken()) {
          notifyAuthInvalidated();
        } else {
          setAccessToken(null);
        }
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiErrorInfo {
  message: string;
  code?: string;
  statusCode?: number;
  isTimeout: boolean;
  isNetworkError: boolean;
  isAuthError: boolean;
}

/**
 * Standardized human-friendly error extractor.
 */
export function getApiErrorInfo(error: unknown): ApiErrorInfo {
  if (axios.isAxiosError(error)) {
    const isTimeout =
      error.code === 'ECONNABORTED' ||
      error.message.toLowerCase().includes('timeout') ||
      error.response?.status === 504;

    const isNetworkError =
      error.code === 'ERR_NETWORK' ||
      (!error.response && !isTimeout);

    const status = error.response?.status;
    const isAuthError = status === 401 || status === 403;

    const backendError = error.response?.data as { error?: { code?: string; message?: string; details?: any } } | undefined;
    const code = backendError?.error?.code || error.code;

    let message: string;
    if (isTimeout) {
      message = 'Request is taking longer than expected. Please try again.';
    } else if (isNetworkError) {
      message = 'Unable to reach the server. Please check your network connection.';
    } else if (backendError?.error?.message) {
      message = backendError.error.message;
    } else if (status === 401) {
      message = 'Your session has expired. Please sign in again.';
    } else if (status === 403) {
      message = 'You do not have permission to perform this action.';
    } else if (status === 404) {
      message = 'The requested resource was not found.';
    } else if (status && status >= 500) {
      message = 'A server error occurred. Please try again shortly.';
    } else {
      message = error.message || 'Something went wrong';
    }

    return {
      message,
      code,
      statusCode: status,
      isTimeout,
      isNetworkError,
      isAuthError,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      isTimeout: false,
      isNetworkError: false,
      isAuthError: false,
    };
  }

  return {
    message: 'An unexpected error occurred',
    isTimeout: false,
    isNetworkError: false,
    isAuthError: false,
  };
}

export function apiErrorMessage(error: unknown): string {
  return getApiErrorInfo(error).message;
}
