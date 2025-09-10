/**
 * Solana Types - Blockchain-specific types and interfaces
 * 
 * These types handle Solana blockchain interactions, wallet connections,
 * and smart contract integration.
 */

import type { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';

/** Solana network configuration */
export type SolanaNetwork = 'mainnet-beta' | 'devnet' | 'testnet' | 'localnet';

/** Wallet adapter interface for multi-wallet support */
export interface WalletAdapter {
  name: string;
  url: string;
  icon: string;
  readyState: 'Installed' | 'NotDetected' | 'Loadable' | 'Loading' | 'Unsupported';
}

/** Wallet connection state */
export interface WalletState {
  /** Currently connected wallet adapter */
  adapter: WalletAdapter | null;
  /** User's public key */
  publicKey: PublicKey | null;
  /** Connection status */
  connected: boolean;
  /** Connection in progress */
  connecting: boolean;
  /** Disconnection in progress */
  disconnecting: boolean;
  /** Connection error */
  error: Error | null;
}

/** Solana program account state */
export interface RewardPoolAccount {
  /** Program authority */
  authority: PublicKey;
  /** Total tokens available for distribution */
  total_tokens: string;
  /** Tokens already distributed */
  tokens_distributed: string;
  /** Reward rate per hour */
  reward_rate_per_hour: string;
  /** Minimum hours between claims */
  min_claim_interval_hours: number;
  /** Pool active status */
  is_active: boolean;
  /** Pool creation timestamp */
  created_at: string;
}

/** User reward account (PDA) */
export interface UserRewardAccount {
  /** User's wallet address */
  user: PublicKey;
  /** Total rewards earned by user */
  total_earned: string;
  /** Last claim timestamp */
  last_claim_timestamp: string;
  /** Number of claims made */
  claim_count: number;
  /** Account bump seed */
  bump: number;
}

/** Solana transaction context */
export interface SolanaTransactionContext {
  /** Transaction signature */
  signature: string;
  /** Slot number when transaction was processed */
  slot: number;
  /** Block time */
  blockTime: number | null;
  /** Transaction confirmation status */
  confirmationStatus: 'processed' | 'confirmed' | 'finalized';
  /** Transaction errors if any */
  err: any | null;
}

/** Program instruction data */
export interface ProgramInstruction {
  /** Instruction name */
  name: string;
  /** Instruction accounts */
  accounts: {
    name: string;
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
  }[];
  /** Instruction data */
  data: Buffer;
}

/** RPC connection configuration */
export interface SolanaRpcConfig {
  /** RPC endpoint URL */
  endpoint: string;
  /** Network identifier */
  network: SolanaNetwork;
  /** Connection commitment level */
  commitment: 'processed' | 'confirmed' | 'finalized';
  /** WebSocket endpoint for subscriptions */
  wsEndpoint?: string;
}

/** Transaction building context */
export interface TransactionContext {
  /** Recent blockhash */
  recentBlockhash: string;
  /** Fee payer public key */
  feePayer: PublicKey;
  /** Last valid block height */
  lastValidBlockHeight: number;
}

/** Wallet sign transaction method */
export interface SignTransactionMethods {
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  signAndSendTransaction?: (transaction: Transaction) => Promise<{ signature: string }>;
}

/** Program derived address (PDA) info */
export interface PDAInfo {
  /** The derived public key */
  address: PublicKey;
  /** The bump seed used */
  bump: number;
}