/**
 * Validation Constants - Shared validation rules
 * 
 * These constants define validation rules used across
 * frontend and backend for consistent data validation.
 */

/** User validation rules */
export const USER_VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
    ERROR_MESSAGES: {
      REQUIRED: 'Username is required',
      MIN_LENGTH: 'Username must be at least 3 characters',
      MAX_LENGTH: 'Username cannot exceed 50 characters',
      PATTERN: 'Username can only contain letters, numbers, hyphens, and underscores',
    },
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 255,
    ERROR_MESSAGES: {
      INVALID: 'Please enter a valid email address',
      MAX_LENGTH: 'Email cannot exceed 255 characters',
    },
  },
  WALLET_ADDRESS: {
    LENGTH: 44, // Base58 encoded public key length
    PATTERN: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    ERROR_MESSAGES: {
      REQUIRED: 'Wallet address is required',
      INVALID: 'Invalid Solana wallet address format',
    },
  },
} as const;

/** Transaction validation rules */
export const TRANSACTION_VALIDATION = {
  REWARD_AMOUNT: {
    MIN: 1, // Minimum 1 token unit
    MAX: 1_000_000_000_000, // Maximum 1 million tokens
    ERROR_MESSAGES: {
      REQUIRED: 'Reward amount is required',
      MIN: 'Reward amount must be positive',
      MAX: 'Reward amount exceeds maximum limit',
      INVALID: 'Invalid reward amount format',
    },
  },
  SIGNATURE: {
    LENGTH: 88, // Base58 encoded signature length
    PATTERN: /^[1-9A-HJ-NP-Za-km-z]{87,88}$/,
    ERROR_MESSAGES: {
      REQUIRED: 'Transaction signature is required',
      INVALID: 'Invalid transaction signature format',
    },
  },
  TRANSACTION_ID: {
    PATTERN: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    ERROR_MESSAGES: {
      REQUIRED: 'Transaction ID is required',
      INVALID: 'Invalid transaction ID format',
    },
  },
} as const;

/** API validation rules */
export const API_VALIDATION = {
  PAGINATION: {
    PAGE: {
      MIN: 1,
      MAX: 10000,
      DEFAULT: 1,
    },
    LIMIT: {
      MIN: 1,
      MAX: 100,
      DEFAULT: 20,
    },
  },
  REQUEST_ID: {
    PATTERN: /^[a-zA-Z0-9-_]{10,50}$/,
  },
} as const;

/** Rate limiting rules */
export const RATE_LIMITING = {
  GENERAL_API: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  REWARD_CLAIMS: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_REQUESTS: 10,
  },
  AUTH_ATTEMPTS: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5,
  },
} as const;

/** Security validation */
export const SECURITY_VALIDATION = {
  JWT: {
    EXPIRY: 24 * 60 * 60, // 24 hours in seconds
    REFRESH_EXPIRY: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  SESSION: {
    MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    IDLE_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  },
  SIGNATURE: {
    MESSAGE_TTL: 5 * 60 * 1000, // 5 minutes in milliseconds
    NONCE_LENGTH: 32,
  },
} as const;

/** Helper functions for validation */
export const VALIDATION_HELPERS = {
  /** Check if string matches wallet address pattern */
  isValidWalletAddress: (address: string): boolean => {
    return USER_VALIDATION.WALLET_ADDRESS.PATTERN.test(address) &&
           address.length === USER_VALIDATION.WALLET_ADDRESS.LENGTH;
  },
  
  /** Check if string matches transaction signature pattern */
  isValidSignature: (signature: string): boolean => {
    return TRANSACTION_VALIDATION.SIGNATURE.PATTERN.test(signature);
  },
  
  /** Check if string matches email pattern */
  isValidEmail: (email: string): boolean => {
    return USER_VALIDATION.EMAIL.PATTERN.test(email) &&
           email.length <= USER_VALIDATION.EMAIL.MAX_LENGTH;
  },
  
  /** Check if username is valid */
  isValidUsername: (username: string): boolean => {
    return username.length >= USER_VALIDATION.USERNAME.MIN_LENGTH &&
           username.length <= USER_VALIDATION.USERNAME.MAX_LENGTH &&
           USER_VALIDATION.USERNAME.PATTERN.test(username);
  },
  
  /** Sanitize pagination parameters */
  sanitizePagination: (page?: number, limit?: number) => ({
    page: Math.max(1, Math.min(page || API_VALIDATION.PAGINATION.PAGE.DEFAULT, API_VALIDATION.PAGINATION.PAGE.MAX)),
    limit: Math.max(1, Math.min(limit || API_VALIDATION.PAGINATION.LIMIT.DEFAULT, API_VALIDATION.PAGINATION.LIMIT.MAX)),
  }),
} as const;