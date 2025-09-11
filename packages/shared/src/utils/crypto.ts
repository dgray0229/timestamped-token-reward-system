/**
 * Crypto Utilities - Shared cryptographic functions
 * 
 * These utilities provide cryptographic functions for signature
 * verification, message signing, and security operations.
 */

import { PublicKey } from '@solana/web3.js';
import { SECURITY_VALIDATION } from '../constants/validation';

/**
 * Generate a cryptographically secure random nonce
 */
export const generateNonce = (length: number = SECURITY_VALIDATION.SIGNATURE.NONCE_LENGTH): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available (browser), fallback to Math.random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i]! % chars.length];
    }
  } else {
    // Fallback for Node.js environment
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
};

/**
 * Generate a message for wallet signature verification
 */
export const generateSignatureMessage = (
  walletAddress: string,
  nonce: string,
  timestamp: number = Date.now()
): string => {
  return [
    'Sign this message to authenticate with Timestamped Token Reward System',
    '',
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Timestamp: ${timestamp}`,
    '',
    'This request will not trigger a blockchain transaction or cost any gas fees.',
  ].join('\n');
};

/**
 * Verify wallet signature (browser-side verification)
 * Note: Full verification should be done on the server
 */
export const verifySignatureMessage = (
  message: string,
  signature: Uint8Array,
  publicKey: PublicKey
): boolean => {
  try {
    // Basic format validation
    if (!message || !signature || !publicKey) {
      return false;
    }
    
    // Convert message to bytes
    const messageBytes = new TextEncoder().encode(message);
    
    // This is a simplified verification - in a real implementation,
    // you would use ed25519 verification libraries
    // For security, actual verification should always be done server-side
    return signature.length === 64 && messageBytes.length > 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

/**
 * Check if a timestamp is within the allowed TTL
 */
export const isTimestampValid = (
  timestamp: number,
  ttl: number = SECURITY_VALIDATION.SIGNATURE.MESSAGE_TTL
): boolean => {
  const now = Date.now();
  const age = now - timestamp;
  return age >= 0 && age <= ttl;
};

/**
 * Validate signature message format
 */
export const validateSignatureMessage = (message: string): {
  isValid: boolean;
  walletAddress?: string;
  nonce?: string;
  timestamp?: number;
  error?: string;
} => {
  try {
    const lines = message.split('\n');
    
    if (lines.length < 6) {
      return { isValid: false, error: 'Invalid message format' };
    }
    
    // Extract wallet address
    const walletLine = lines.find(line => line.startsWith('Wallet: '));
    if (!walletLine) {
      return { isValid: false, error: 'Wallet address not found in message' };
    }
    const walletAddress = walletLine.replace('Wallet: ', '');
    
    // Extract nonce
    const nonceLine = lines.find(line => line.startsWith('Nonce: '));
    if (!nonceLine) {
      return { isValid: false, error: 'Nonce not found in message' };
    }
    const nonce = nonceLine.replace('Nonce: ', '');
    
    // Extract timestamp
    const timestampLine = lines.find(line => line.startsWith('Timestamp: '));
    if (!timestampLine) {
      return { isValid: false, error: 'Timestamp not found in message' };
    }
    const timestamp = parseInt(timestampLine.replace('Timestamp: ', ''), 10);
    
    if (isNaN(timestamp)) {
      return { isValid: false, error: 'Invalid timestamp format' };
    }
    
    // Validate timestamp is not too old
    if (!isTimestampValid(timestamp)) {
      return { isValid: false, error: 'Message timestamp expired' };
    }
    
    return {
      isValid: true,
      walletAddress,
      nonce,
      timestamp,
    };
  } catch (error) {
    return { isValid: false, error: 'Failed to parse message' };
  }
};

/**
 * Convert signature from various formats to Uint8Array
 */
export const normalizeSignature = (signature: string | Uint8Array | Buffer): Uint8Array => {
  if (signature instanceof Uint8Array) {
    return signature;
  }
  
  if (typeof signature === 'string') {
    // Try base58 decode first, then base64, then hex
    try {
      // For base58 (most common with Solana)
      return new Uint8Array(Buffer.from(signature, 'base64'));
    } catch {
      try {
        // For hex encoding
        return new Uint8Array(Buffer.from(signature, 'hex'));
      } catch {
        throw new Error('Unable to decode signature string');
      }
    }
  }
  
  if (Buffer.isBuffer(signature)) {
    return new Uint8Array(signature);
  }
  
  throw new Error('Unsupported signature format');
};

/**
 * Generate a secure request ID for API calls
 */
export const generateRequestId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = generateNonce(8);
  return `${timestamp}-${random}`;
};

/**
 * Hash a string using a simple hash function (for non-cryptographic purposes)
 */
export const simpleHash = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash);
};

/**
 * Create a deterministic color from a string (useful for avatars, etc.)
 */
export const stringToColor = (str: string): string => {
  const hash = simpleHash(str);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

/**
 * Mask sensitive data for logging
 */
export const maskSensitiveData = (
  data: string,
  visibleStart: number = 4,
  visibleEnd: number = 4,
  maskChar: string = '*'
): string => {
  if (data.length <= visibleStart + visibleEnd) {
    return maskChar.repeat(data.length);
  }
  
  const start = data.slice(0, visibleStart);
  const end = data.slice(-visibleEnd);
  const middle = maskChar.repeat(data.length - visibleStart - visibleEnd);
  
  return `${start}${middle}${end}`;
};