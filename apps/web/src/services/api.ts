/**
 * API Service - Base HTTP client configuration
 * 
 * This service provides the foundation for all API communication with:
 * - Axios configuration with interceptors
 * - Request/response logging and error handling
 * - Authentication token management
 * - Request retry logic for improved reliability
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiResponse, ApiError } from '@reward-system/shared';

// API configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000', 10);

/**
 * Create configured Axios instance
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for authentication and logging
  client.interceptors.request.use(
    (config) => {
      // Add authentication token if available
      const token = localStorage.getItem('sessionToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request ID for tracking
      config.headers['X-Request-ID'] = generateRequestId();

      // Log request in development
      if (import.meta.env.DEV) {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data,
        });
      }

      return config;
    },
    (error) => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and logging
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // Log response in development
      if (import.meta.env.DEV) {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: response.data,
        });
      }

      return response;
    },
    (error) => {
      // Log error in development
      if (import.meta.env.DEV) {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      }

      // Handle specific error cases
      if (error.response?.status === 401) {
        // Unauthorized - clear session and redirect to login
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      // Transform API error format
      const apiError: ApiError = error.response?.data || {
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error occurred',
          timestamp: new Date().toISOString(),
          requestId: error.config?.headers?.['X-Request-ID'] || 'unknown',
        },
      };

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create the API client instance
export const apiClient = createApiClient();

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generic API request wrapper with retry logic
 */
export async function apiRequest<T = any>(
  config: AxiosRequestConfig,
  retries: number = 2
): Promise<T> {
  try {
    const response = await apiClient.request<ApiResponse<T>>(config);
    return response.data.data as T;
  } catch (error) {
    if (retries > 0 && shouldRetry(error)) {
      console.log(`Retrying request... (${retries} attempts left)`);
      await delay(1000); // Wait 1 second before retry
      return apiRequest<T>(config, retries - 1);
    }
    throw error;
  }
}

/**
 * Determine if request should be retried
 */
function shouldRetry(error: any): boolean {
  // Retry on network errors or 5xx server errors
  return (
    !error.response ||
    error.response.status >= 500 ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'ECONNABORTED'
  );
}

/**
 * Delay utility for retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * HTTP method helpers
 */
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ method: 'GET', url, ...config }),

  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ method: 'POST', url, data, ...config }),

  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ method: 'PUT', url, data, ...config }),

  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ method: 'PATCH', url, data, ...config }),

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    apiRequest<T>({ method: 'DELETE', url, ...config }),
};

/**
 * Health check utility
 */
export async function checkApiHealth() {
  try {
    const health = await api.get('/health');
    return health;
  } catch (error) {
    console.error('API health check failed:', error);
    throw error;
  }
}

/**
 * Set authentication token
 */
export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('sessionToken', token);
    apiClient.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('sessionToken');
    delete apiClient.defaults.headers.Authorization;
  }
}

/**
 * Get current authentication token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('sessionToken');
}

/**
 * Clear authentication token
 */
export function clearAuthToken() {
  setAuthToken(null);
}