/**
 * Shared Package - Main entry point
 * 
 * This is the main entry point for the shared package, exporting
 * all types, constants, and utilities for use across the application.
 */

// Export all types
export * from './types';

// Export all constants
export * from './constants';

// Export all utilities
export * from './utils';

// Re-export the most commonly used items for convenience
export type {
  User,
  RewardTransaction,
  TransactionStatus,
  ApiError,
  ApiResponse,
  WalletState,
  SolanaNetwork,
} from './types';

export {
  API_CONFIG,
  SOLANA_NETWORKS,
  TOKEN_CONFIG,
  VALIDATION_HELPERS,
  formatTokenAmount,
  formatWalletAddress,
  formatDate,
  validateUsername,
  validateWalletAddress,
  generateNonce,
  generateSignatureMessage,
} from './constants';

// Package metadata
export const PACKAGE_INFO = {
  name: '@reward-system/shared',
  version: '1.0.0',
  description: 'Shared TypeScript types, constants, and utilities for the Timestamped Token Reward System',
} as const;