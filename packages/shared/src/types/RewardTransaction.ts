/**
 * Reward Transaction Types - Transaction lifecycle management
 * 
 * These types track the complete lifecycle of reward transactions
 * from initiation through blockchain confirmation.
 */

/** Transaction status enumeration */
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

/** Core reward transaction entity */
export interface RewardTransaction {
  /** Database primary key */
  id: string;
  /** Foreign key to User */
  user_id: string;
  /** Solana transaction signature for blockchain verification */
  transaction_signature: string;
  /** Amount of tokens rewarded (bigint as string) */
  reward_amount: string;
  /** When the reward period started */
  timestamp_earned: Date;
  /** When user claimed the reward */
  timestamp_claimed: Date;
  /** Blockchain transaction status */
  status: TransactionStatus;
  /** Solana slot number for finality confirmation */
  block_number: string;
}

/** Transaction creation request */
export interface CreateTransactionRequest {
  user_id: string;
  expected_amount: string;
}

/** Transaction confirmation request */
export interface ConfirmTransactionRequest {
  transaction_id: string;
  signature: string;
}

/** Available rewards calculation response */
export interface AvailableRewards {
  /** Claimable reward amount */
  available_amount: string;
  /** When next claim will be available */
  next_claim_available_at: Date;
  /** Hours elapsed since last claim */
  hours_since_last_claim: number;
}

/** Transaction history pagination */
export interface TransactionHistoryParams {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
}

/** Paginated transaction response */
export interface PaginatedTransactions {
  transactions: RewardTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}