/**
 * Solana Constants - Blockchain configuration and constants
 * 
 * These constants define Solana network settings, program IDs,
 * and blockchain-specific configuration values.
 */

import { PublicKey } from '@solana/web3.js';

/** Solana network configurations */
export const SOLANA_NETWORKS = {
  MAINNET: {
    name: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    wsUrl: 'wss://api.mainnet-beta.solana.com',
  },
  DEVNET: {
    name: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    wsUrl: 'wss://api.devnet.solana.com',
  },
  TESTNET: {
    name: 'testnet',
    rpcUrl: 'https://api.testnet.solana.com',
    wsUrl: 'wss://api.testnet.solana.com',
  },
  LOCALNET: {
    name: 'localnet',
    rpcUrl: 'http://localhost:8899',
    wsUrl: 'ws://localhost:8900',
  },
} as const;

/** Program IDs (will be updated after deployment) */
export const PROGRAM_IDS = {
  REWARD_SYSTEM: 'RewardSystemProgramIdWillBeGeneratedByAnchor',
  // Add other program IDs as needed
} as const;

/** Token constants */
export const TOKEN_CONFIG = {
  /** Token decimals (standard for Solana tokens) */
  DECIMALS: 9,
  /** Base reward amount (in smallest units) */
  BASE_REWARD_AMOUNT: 1_000_000_000, // 1 token
  /** Minimum claim interval in hours */
  MIN_CLAIM_INTERVAL_HOURS: 24,
  /** Maximum claim interval in hours */
  MAX_CLAIM_INTERVAL_HOURS: 168, // 1 week
} as const;

/** Wallet adapter configurations */
export const WALLET_ADAPTERS = {
  PHANTOM: {
    name: 'Phantom',
    url: 'https://phantom.app',
    icon: 'https://www.phantom.app/img/phantom-logo.svg',
  },
  SOLFLARE: {
    name: 'Solflare',
    url: 'https://solflare.com',
    icon: 'https://solflare.com/assets/solflare-logo.svg',
  },
  BACKPACK: {
    name: 'Backpack',
    url: 'https://backpack.app',
    icon: 'https://backpack.app/icons/backpack-icon.svg',
  },
} as const;

/** Transaction configuration */
export const TRANSACTION_CONFIG = {
  /** Default commitment level */
  COMMITMENT: 'confirmed',
  /** Transaction timeout in milliseconds */
  TIMEOUT: 30_000,
  /** Maximum retries for failed transactions */
  MAX_RETRIES: 3,
  /** Confirmation timeout in milliseconds */
  CONFIRMATION_TIMEOUT: 60_000,
} as const;

/** Account sizes (in bytes) for rent calculations */
export const ACCOUNT_SIZES = {
  /** Reward pool account size */
  REWARD_POOL: 200,
  /** User reward account size */
  USER_REWARD: 100,
} as const;

/** PDA seed constants */
export const PDA_SEEDS = {
  REWARD_POOL: 'reward_pool',
  USER_REWARD: 'user_reward',
} as const;

/** Error codes for Solana program errors */
export const SOLANA_ERROR_CODES = {
  INSUFFICIENT_FUNDS: 'InsufficientFunds',
  INVALID_SIGNATURE: 'InvalidSignature',
  ACCOUNT_NOT_FOUND: 'AccountNotFound',
  PROGRAM_ERROR: 'ProgramError',
  TRANSACTION_FAILED: 'TransactionFailed',
  NETWORK_ERROR: 'NetworkError',
  WALLET_NOT_CONNECTED: 'WalletNotConnected',
  USER_REJECTED: 'UserRejectedRequest',
} as const;

/** Helper function to get program ID as PublicKey */
export const getProgramId = (programName: keyof typeof PROGRAM_IDS): PublicKey => {
  return new PublicKey(PROGRAM_IDS[programName]);
};

/** Helper function to convert token amount to smallest units */
export const toTokenUnits = (amount: number): number => {
  return Math.floor(amount * Math.pow(10, TOKEN_CONFIG.DECIMALS));
};

/** Helper function to convert smallest units to token amount */
export const fromTokenUnits = (units: number | string): number => {
  const numUnits = typeof units === 'string' ? parseInt(units, 10) : units;
  return numUnits / Math.pow(10, TOKEN_CONFIG.DECIMALS);
};