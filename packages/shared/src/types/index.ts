/**
 * Shared Types - Export all types for easy importing
 * 
 * This file exports all shared types, allowing clean imports
 * across frontend, backend, and blockchain components.
 */

// User types
export * from './User';

// Transaction types
export * from './RewardTransaction';

// API types
export * from './API';

// Solana blockchain types
export * from './Solana';

// Main exports
export type { User } from './User';
export type { RewardTransaction, TransactionStatus } from './RewardTransaction';
export type { ApiError, ApiResponse } from './API';
export type { WalletState, SolanaNetwork, RewardPoolAccount } from './Solana';