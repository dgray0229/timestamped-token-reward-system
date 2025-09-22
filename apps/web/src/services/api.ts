/**
 * API Service - Base HTTP client configuration
 *
 * This service provides the foundation for all API communication with:
 * - Axios configuration with interceptors
 * - Request/response logging and error handling
 * - Authentication token management
 * - Request retry logic for improved reliability
 * - Comprehensive error transformation and user feedback
 */

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import type { ApiError, ApiResponse } from '@reward-system/shared';

// API configuration from environment variables
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
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
    config => {
      // Add authentication token if available
      const token = localStorage.getItem('sessionToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request ID for tracking
      config.headers['X-Request-ID'] = generateRequestId();

      // Log request in development
      if (import.meta.env.DEV) {
        console.log(
          `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
          {
            headers: config.headers,
            data: config.data,
          },
        );
      }

      return config;
    },
    error => {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    },
  );

  // Response interceptor for error handling and logging
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // Log response in development
      if (import.meta.env.DEV) {
        console.log(
          `✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`,
          {
            status: response.status,
            data: response.data,
          },
        );
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // Log error in development
      if (import.meta.env.DEV) {
        console.error(
          `❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
          {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          },
        );
      }

      // Handle 401 Unauthorized with smart token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh token with circuit breaker
          const refreshResult = await refreshAuthToken();
          if (refreshResult.success && refreshResult.token) {
            // Update Authorization header and retry original request
            originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError);
        }

        // If refresh fails, clear session gracefully
        console.info('Authentication session expired - clearing local storage');
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('user');

        // Only trigger logout event if we're not already on a login page
        if (!window.location.pathname.includes('/login')) {
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
      }

      // Transform and enhance error information
      const apiError: ApiError = transformError(error);
      return Promise.reject(apiError);
    },
  );

  return client;
};

// Create the API client instance
export const apiClient = createApiClient();

/**
 * Generate unique request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Circuit breaker for token refresh to prevent infinite loops
let refreshPromise: Promise<{ success: boolean; token?: string }> | null = null;
let refreshAttempts = 0;
let lastRefreshAttempt = 0;
const MAX_REFRESH_ATTEMPTS = 3;
const REFRESH_COOLDOWN = 30000; // 30 seconds

/**
 * Refresh authentication token with circuit breaker pattern
 */
async function refreshAuthToken(): Promise<{
  success: boolean;
  token?: string;
}> {
  const now = Date.now();

  // Check cooldown period
  if (now - lastRefreshAttempt < REFRESH_COOLDOWN && refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
    console.warn('Token refresh rate limited - too many recent attempts');
    return { success: false };
  }

  // Reset attempts after cooldown
  if (now - lastRefreshAttempt > REFRESH_COOLDOWN) {
    refreshAttempts = 0;
  }

  // Return existing promise if refresh is already in progress
  if (refreshPromise) {
    return refreshPromise;
  }

  lastRefreshAttempt = now;
  refreshAttempts++;

  refreshPromise = (async () => {
    try {
      const currentToken = localStorage.getItem('sessionToken');
      if (!currentToken) {
        return { success: false };
      }

      // Make refresh request without interceptors to avoid infinite loop
      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
          timeout: API_TIMEOUT,
        },
      );

      if (response.data?.data?.session_token) {
        const newToken = response.data.data.session_token;
        localStorage.setItem('sessionToken', newToken);
        refreshAttempts = 0; // Reset on success
        return { success: true, token: newToken };
      }

      return { success: false };
    } catch (error: any) {
      console.warn('Token refresh request failed:', error?.message || error);

      // Don't retry on certain errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        refreshAttempts = MAX_REFRESH_ATTEMPTS; // Max out attempts
      }

      return { success: false };
    } finally {
      refreshPromise = null; // Clear the promise
    }
  })();

  return refreshPromise;
}

/**
 * Generic API request wrapper with retry logic
 */
export async function apiRequest<T = any>(
  config: AxiosRequestConfig,
  retries: number = 2,
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

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => apiRequest<T>({ method: 'POST', url, data, ...config }),

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => apiRequest<T>({ method: 'PUT', url, data, ...config }),

  patch: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> => apiRequest<T>({ method: 'PATCH', url, data, ...config }),

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

/**
 * Transform axios error into standardized API error format
 */
function transformError(error: AxiosError): ApiError {
  const requestId =
    (error.config?.headers?.['X-Request-ID'] as string) || 'unknown';
  const timestamp = new Date().toISOString();

  // Network/connection errors
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        error: {
          code: 'TIMEOUT_ERROR',
          message: 'Request timed out. Please try again.',
          timestamp,
          requestId,
        },
      };
    }

    if (
      error.code === 'ERR_NETWORK' ||
      error.message.includes('Network Error')
    ) {
      return {
        error: {
          code: 'NETWORK_ERROR',
          message:
            'Network connection failed. Please check your internet connection.',
          timestamp,
          requestId,
        },
      };
    }

    return {
      error: {
        code: 'CONNECTION_ERROR',
        message: 'Unable to connect to server. Please try again later.',
        timestamp,
        requestId,
      },
    };
  }

  // Server responded with error status
  const status = error.response.status;
  const responseData = error.response.data as any;

  // If server returned structured error, use it
  if (responseData?.error) {
    return responseData as ApiError;
  }

  // Generate appropriate error based on status code
  let code: string;
  let message: string;

  switch (status) {
    case 400:
      code = 'BAD_REQUEST';
      message = 'Invalid request. Please check your input.';
      break;
    case 401:
      code = 'UNAUTHORIZED';
      message = 'Authentication required. Please connect your wallet.';
      break;
    case 403:
      code = 'FORBIDDEN';
      message = 'Access denied. You do not have permission for this action.';
      break;
    case 404:
      code = 'NOT_FOUND';
      message = 'Resource not found.';
      break;
    case 409:
      code = 'CONFLICT';
      message = 'Conflict with current state. Please refresh and try again.';
      break;
    case 422:
      code = 'VALIDATION_ERROR';
      message = 'Validation failed. Please check your input.';
      break;
    case 429:
      code = 'RATE_LIMIT_EXCEEDED';
      message = 'Too many requests. Please wait a moment and try again.';
      break;
    case 500:
      code = 'INTERNAL_ERROR';
      message = 'Internal server error. Please try again later.';
      break;
    case 502:
      code = 'BAD_GATEWAY';
      message = 'Server temporarily unavailable. Please try again later.';
      break;
    case 503:
      code = 'SERVICE_UNAVAILABLE';
      message = 'Service temporarily unavailable. Please try again later.';
      break;
    case 504:
      code = 'GATEWAY_TIMEOUT';
      message = 'Request timed out. Please try again.';
      break;
    default:
      code = 'HTTP_ERROR';
      message =
        responseData?.message || error.message || `HTTP Error ${status}`;
  }

  return {
    error: {
      code,
      message,
      timestamp,
      requestId,
    },
  };
}
