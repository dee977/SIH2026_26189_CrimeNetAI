/**
 * CrimeNet AI API Client
 */
import { supabase } from './supabaseClient';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:8000/api/v1');

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  let { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token || (typeof localStorage !== 'undefined' ? localStorage.getItem('crimenet_auth_token') : null);

  const isFormData = options.body instanceof FormData;

  let headers: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // If 401, attempt silent session refresh before reporting failure
    if (response.status === 401) {
      try {
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
        if (!refreshErr && refreshData.session?.access_token) {
          const newToken = refreshData.session.access_token;
          try { localStorage.setItem('crimenet_auth_token', newToken); } catch (_) {}
          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            useAuthStore.getState().setSession(newToken, currentUser);
          }
          headers = {
            ...headers,
            Authorization: `Bearer ${newToken}`
          };
          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
          });
        }
      } catch (refreshCatch) {
        console.warn('Silent session refresh attempt failed:', refreshCatch);
      }
    }

    if (!response.ok) {
      if (response.status === 401) {
        // Do NOT automatically call logout() which disrupts the active session.
        // Return unauthorized error gracefully for caller to handle.
        throw new Error('Unauthorized');
      } else if (response.status === 403) {
        throw new Error('Permission denied');
      } else if (response.status === 404) {
        throw new Error('Not found');
      } else if (response.status === 422) {
        throw new Error('Validation error');
      } else if (response.status >= 500) {
        throw new Error('Server error');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    const data = (json && typeof json === 'object' && json.success !== undefined && json.data !== undefined) 
      ? json.data 
      : json;

    return {
      success: true,
      data
    };
  } catch (err: any) {
    return {
      success: false,
      data: null as any,
      error: err.message || 'Network request failed'
    };
  }
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: { params?: Record<string, any>; headers?: Record<string, string>; responseType?: string }) => {
    let url = endpoint;
    if (options?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.append(k, String(v));
      });
      const qs = searchParams.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }
    return apiRequest<T>(url, { method: 'GET', headers: options?.headers });
  },
  post: <T = any>(endpoint: string, body?: any, options?: { headers?: Record<string, string> }) => {
    const isFormData = body instanceof FormData;
    return apiRequest<T>(endpoint, {
      method: 'POST',
      headers: options?.headers,
      body: isFormData ? body : (body !== undefined ? JSON.stringify(body) : undefined)
    });
  },
  delete: <T = any>(endpoint: string, options?: { headers?: Record<string, string> }) => {
    return apiRequest<T>(endpoint, { method: 'DELETE', headers: options?.headers });
  },
  put: <T = any>(endpoint: string, body?: any, options?: { headers?: Record<string, string> }) => {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      headers: options?.headers,
      body: JSON.stringify(body)
    });
  }
};
