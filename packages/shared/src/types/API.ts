/**
 * API Types - Request/Response contracts
 * 
 * These types define the API contract between frontend and backend,
 * ensuring type safety across the network boundary.
 */

/** Standard API error response format */
export interface ApiError {
  error: {
    /** Error code for programmatic handling */
    code: string;
    /** Human-readable error message */
    message: string;
    /** Additional error details */
    details?: Record<string, any>;
    /** Error timestamp */
    timestamp: string;
    /** Request ID for debugging */
    requestId: string;
  };
}

/** Wallet connection request */
export interface WalletConnectRequest {
  /** Solana wallet public key */
  wallet_address: string;
  /** Signed message proving wallet ownership */
  signature: string;
  /** Original message that was signed */
  message: string;
}

/** Wallet connection response */
export interface WalletConnectResponse {
  user: import('./User').User;
  /** JWT token for authenticated requests */
  session_token: string;
}

/** Health check response */
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

/** Reward claim initiation response */
export interface ClaimRewardResponse {
  /** Database transaction ID */
  transaction_id: string;
  /** Serialized Solana transaction for frontend signing */
  solana_instruction: {
    /** Base64 encoded transaction */
    transaction: string;
    /** Transaction message for display */
    message: string;
  };
}

/** API response wrapper for consistent response format */
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError['error'];
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

/** Pagination parameters for API requests */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/** Standard pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}