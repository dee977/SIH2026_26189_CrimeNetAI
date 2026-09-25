/**
 * CrimeNet AI API Client
 * 
 * Consumes REST APIs provided by M2 (Backend), M5 (Graph Analytics), M6 (Auth/Evidence).
 * Follows Absolute Ownership Rule: Consumes services, does not implement backend.
 * Provides resilient fallback to verified synthetic/demo data if backend services are offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  source: 'LIVE_BACKEND' | 'SYNTHETIC_FALLBACK';
  message?: string;
  error?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData?: T
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('crimenet_auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {})
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout for graph/cypher queries

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    const data = (json && typeof json === 'object' && json.success !== undefined && json.data !== undefined) 
      ? json.data 
      : json;

    return {
      success: true,
      data,
      source: 'LIVE_BACKEND'
    };
  } catch (err: any) {
    // If backend is unreachable (M2 server offline), gracefully use fallback demo data
    if (fallbackData !== undefined) {
      console.warn(`[CrimeNet API] Backend unavailable at ${endpoint}. Using synthetic demo data.`);
      return {
        success: true,
        data: fallbackData,
        source: 'SYNTHETIC_FALLBACK',
        message: 'Live backend offline. Demonstrating with verified synthetic dataset.'
      };
    }

    return {
      success: false,
      data: null as any,
      source: 'LIVE_BACKEND',
      error: err.message || 'Network request failed'
    };
  }
}
