/**
 * Constants - Export all constants for easy importing
 * 
 * This file exports all shared constants, providing a
 * single import point for configuration values.
 */

// API and endpoint constants
export * from './endpoints';

// Solana blockchain constants
export * from './solana';

// Validation rules and patterns
export * from './validation';

// Application-wide constants
export const APP_CONFIG = {
  NAME: 'Timestamped Token Reward System',
  VERSION: '1.0.0',
  DESCRIPTION: 'A tutorial Solana application demonstrating timestamped token rewards',
  
  // Default values
  DEFAULTS: {
    NETWORK: 'devnet' as const,
    LOCALE: 'en-US',
    CURRENCY: 'SOL',
    TIMEZONE: 'UTC',
  },
  
  // UI Configuration
  UI: {
    THEME: {
      DEFAULT: 'light' as const,
      OPTIONS: ['light', 'dark', 'system'] as const,
    },
    DEBOUNCE_DELAY: 300, // milliseconds
    ANIMATION_DURATION: 200, // milliseconds
    TOAST_DURATION: 5000, // milliseconds
  },
  
  // Feature flags
  FEATURES: {
    DARK_MODE: true,
    EXPORT_TRANSACTIONS: true,
    REAL_TIME_UPDATES: true,
    MOBILE_RESPONSIVE: true,
    ANALYTICS: false, // Disable for tutorial/demo
  },
} as const;

// Environment-specific constants
export const ENV_CONFIG = {
  DEVELOPMENT: {
    LOG_LEVEL: 'debug',
    API_TIMEOUT: 10000,
    ENABLE_DEVTOOLS: true,
  },
  PRODUCTION: {
    LOG_LEVEL: 'error',
    API_TIMEOUT: 5000,
    ENABLE_DEVTOOLS: false,
  },
  TEST: {
    LOG_LEVEL: 'silent',
    API_TIMEOUT: 1000,
    ENABLE_DEVTOOLS: false,
  },
} as const;