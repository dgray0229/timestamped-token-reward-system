/**
 * All Types - Consolidated type definitions
 */

// User Types
export interface User {
  id: string;
  wallet_address: string;
  email?: string;
  username: string;
  total_rewards_earned: string;
  last_claim_timestamp: Date;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface CreateUserRequest {
  wallet_address: string;
  username: string;
  email?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
}

export interface UserAuthState {
  isAuthenticated: boolean;
  user: User | null;
  session_token: string | null;
  loading: boolean;
  error: string | null;
}

export interface WalletSession {
  id: string;
  user_id: string;
  wallet_address: string;
  session_token: string;
  expires_at: Date;
  is_active: boolean;
  last_activity: Date;
}

// Transaction Types
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface RewardTransaction {
  id: string;
  user_id: string;
  transaction_signature?: string;
  reward_amount: string;
  timestamp_earned: Date;
  timestamp_claimed?: Date;
  status: TransactionStatus;
  block_number?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTransactionRequest {
  user_id: string;
  expected_amount: string;
}

export interface ConfirmTransactionRequest {
  transaction_id: string;
  signature: string;
}

export interface AvailableRewards {
  available_amount: string;
  next_claim_available_in: number;
  hours_since_last_claim: number;
  can_claim: boolean;
  reward_rate_per_hour: string;
  max_daily_reward: string;
}

export interface TransactionHistoryParams {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
}

export interface PaginatedTransactions {
  transactions: RewardTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// API Types
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}

export interface WalletConnectRequest {
  wallet_address: string;
  signature: string;
  message: string;
}

export interface WalletConnectResponse {
  success: boolean;
  user: User;
  session_token: string;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  solana_connection: boolean;
  database_connection: boolean;
  services: {
    api: boolean;
    database: boolean;
    redis: boolean;
    solana_rpc: boolean;
  };
}

export interface ClaimRewardResponse {
  transaction_id: string;
  reward_amount: string;
  message: string;
  expires_at: string;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError['error'];
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Solana Types
export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';

export interface WalletAdapter {
  name: string;
  url: string;
  icon: string;
  readyState:
    | 'Installed'
    | 'NotDetected'
    | 'Loadable'
    | 'Loading'
    | 'Unsupported';
}

export interface WalletState {
  adapter: WalletAdapter | null;
  publicKey: any | null; // Avoiding PublicKey import for simplicity
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  error: Error | null;
}

export interface RewardPoolAccount {
  authority: any; // PublicKey
  total_tokens: string;
  tokens_distributed: string;
  reward_rate_per_hour: string;
  min_claim_interval_hours: number;
  is_active: boolean;
  created_at: string;
}

export interface UserRewardAccount {
  user: any; // PublicKey
  total_earned: string;
  last_claim_timestamp: string;
  claim_count: number;
  bump: number;
}

export interface SolanaTransactionContext {
  signature: string;
  slot: number;
  blockTime: number | null;
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
  err: any | null;
}

export interface ProgramInstruction {
  name: string;
  accounts: {
    name: string;
    pubkey: any; // PublicKey
    isSigner: boolean;
    isWritable: boolean;
  }[];
  data: Buffer;
}

export interface SolanaRpcConfig {
  endpoint: string;
  network: SolanaNetwork;
  commitment: 'processed' | 'confirmed' | 'finalized';
  wsEndpoint?: string;
}

export interface TransactionContext {
  recentBlockhash: string;
  feePayer: any; // PublicKey
  lastValidBlockHeight: number;
}

export interface SignTransactionMethods {
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
  signAndSendTransaction?: (transaction: any) => Promise<{ signature: string }>;
}

export interface PDAInfo {
  address: any; // PublicKey
  bump: number;
}

// Constants that are needed by the web app
export const AUTH_ENDPOINTS = {
  WALLET_CONNECT: '/auth/wallet/connect',
  DISCONNECT: '/auth/disconnect',
  REFRESH_TOKEN: '/auth/refresh',
  VERIFY_SESSION: '/auth/verify',
} as const;

export const REWARD_ENDPOINTS = {
  AVAILABLE: '/rewards/available',
  CLAIM: '/rewards/claim',
  CONFIRM: '/rewards/confirm',
  HISTORY: '/rewards/history',
} as const;

export const USER_ENDPOINTS = {
  PROFILE: '/users/profile',
  UPDATE_PROFILE: '/users/profile',
  DELETE_ACCOUNT: '/users/account',
} as const;

export const TRANSACTION_ENDPOINTS = {
  LIST: '/transactions',
  DETAILS: '/transactions/:id',
  STATUS: '/transactions/:id/status',
  EXPORT: '/transactions/export',
} as const;

export const API_CONFIG = {
  VERSION: 'v1',
  BASE_PATH: '/api/v1',
  DEFAULT_TIMEOUT: 10000,
  DEFAULT_RETRY_ATTEMPTS: 3,
} as const;

// Utility functions that are needed
export const generateNonce = (length: number = 32): string => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateSignatureMessage = (
  walletAddress: string,
  nonce: string
): string => {
  return `Please sign this message to authenticate with your wallet.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;
};

export const formatTokenAmount = (
  amount: string | number,
  decimals: number = 9
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return (numAmount / Math.pow(10, decimals)).toFixed(6);
};

export const formatWalletAddress = (address: string): string => {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
};
