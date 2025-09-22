/**
 * User Types - Shared across frontend, backend, and blockchain
 * 
 * These types define the core user entity that bridges traditional
 * web authentication with Solana wallet integration.
 */

export interface User {
  /** Database primary key */
  id: string;
  /** Solana wallet public key (unique identifier for blockchain) */
  wallet_address: string;
  /** Optional email for traditional auth via Supabase */
  email?: string;
  /** Display name for UI */
  username: string;
  /** Lifetime reward accumulation (bigint as string for JSON serialization) */
  total_rewards_earned: string;
  /** Last reward claim timestamp for rate limiting */
  last_claim_timestamp: Date;
  /** Account creation tracking */
  created_at: Date;
  /** Data consistency tracking */
  updated_at: Date;
  /** Last login tracking (for auth routes) */
  last_login?: Date;
}

/** User creation payload (excludes auto-generated fields) */
export interface CreateUserRequest {
  wallet_address: string;
  username: string;
  email?: string;
}

/** User profile update payload */
export interface UpdateUserRequest {
  username?: string;
  email?: string;
}

/** User authentication state */
export interface UserAuthState {
  isAuthenticated: boolean;
  user: User | null;
  session_token: string | null;
  loading: boolean;
  error: string | null;
}

/** Wallet session management */
export interface WalletSession {
  id: string;
  user_id: string;
  wallet_address: string;
  session_token: string;
  expires_at: Date;
  is_active: boolean;
  last_activity: Date;
}