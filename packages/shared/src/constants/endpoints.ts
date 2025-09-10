/**
 * API Endpoints - Centralized endpoint definitions
 * 
 * This file contains all API endpoint constants to ensure
 * consistency between frontend and backend.
 */

/** Base API configuration */
export const API_CONFIG = {
  VERSION: 'v1',
  BASE_PATH: '/api/v1',
  DEFAULT_TIMEOUT: 10000, // 10 seconds
  DEFAULT_RETRY_ATTEMPTS: 3,
} as const;

/** Authentication endpoints */
export const AUTH_ENDPOINTS = {
  WALLET_CONNECT: '/auth/wallet-connect',
  DISCONNECT: '/auth/disconnect',
  REFRESH_TOKEN: '/auth/refresh',
  VERIFY_SESSION: '/auth/verify',
} as const;

/** User management endpoints */
export const USER_ENDPOINTS = {
  PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  DELETE_ACCOUNT: '/users/account',
} as const;

/** Reward system endpoints */
export const REWARD_ENDPOINTS = {
  AVAILABLE: '/rewards/available',
  CLAIM: '/rewards/claim',
  CONFIRM: '/rewards/confirm',
  HISTORY: '/rewards/history',
} as const;

/** Transaction endpoints */
export const TRANSACTION_ENDPOINTS = {
  LIST: '/transactions',
  DETAILS: '/transactions/:id',
  STATUS: '/transactions/:id/status',
  EXPORT: '/transactions/export',
} as const;

/** System endpoints */
export const SYSTEM_ENDPOINTS = {
  HEALTH: '/health',
  STATUS: '/status',
  METRICS: '/metrics',
} as const;

/** Helper function to build full endpoint URLs */
export const buildEndpoint = (endpoint: string, params?: Record<string, string | number>): string => {
  let url = `${API_CONFIG.BASE_PATH}${endpoint}`;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  
  return url;
};

/** HTTP methods */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

/** HTTP status codes */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;