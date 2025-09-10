import { PublicKey, Connection } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

// Initialize Solana connection
export const connection = new Connection(config.solana.rpcUrl, 'confirmed');

export interface SignatureVerificationResult {
  isValid: boolean;
  walletAddress: string;
  message: string;
}

export function verifyWalletSignature(
  signature: string,
  message: string,
  walletAddress: string
): SignatureVerificationResult {
  try {
    // Decode the signature from base58
    const signatureBytes = bs58.decode(signature);
    
    // Convert message to bytes
    const messageBytes = new TextEncoder().encode(message);
    
    // Convert wallet address to PublicKey
    const publicKey = new PublicKey(walletAddress);
    
    // Verify the signature
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKey.toBytes()
    );
    
    logger.info('Signature verification', {
      walletAddress,
      isValid,
      messageLength: message.length,
    });
    
    return {
      isValid,
      walletAddress,
      message,
    };
  } catch (error) {
    logger.error('Signature verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      walletAddress,
      signature: signature.substring(0, 10) + '...',
    });
    
    return {
      isValid: false,
      walletAddress,
      message,
    };
  }
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export async function getTokenBalance(
  walletAddress: string,
  tokenMintAddress?: string
): Promise<number> {
  try {
    const publicKey = new PublicKey(walletAddress);
    
    if (tokenMintAddress) {
      // Get SPL token balance
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        publicKey,
        { mint: new PublicKey(tokenMintAddress) }
      );
      
      if (tokenAccounts.value.length === 0) {
        return 0;
      }
      
      const balance = await connection.getTokenAccountBalance(
        tokenAccounts.value[0].pubkey
      );
      
      return parseFloat(balance.value.uiAmount?.toString() || '0');
    } else {
      // Get SOL balance
      const balance = await connection.getBalance(publicKey);
      return balance / 1e9; // Convert lamports to SOL
    }
  } catch (error) {
    logger.error('Failed to get token balance', {
      error: error instanceof Error ? error.message : 'Unknown error',
      walletAddress,
      tokenMintAddress,
    });
    return 0;
  }
}

export async function verifyTransactionSignature(
  signature: string
): Promise<{
  exists: boolean;
  confirmed: boolean;
  slot?: number;
  blockTime?: number;
  fee?: number;
}> {
  try {
    const transaction = await connection.getTransaction(signature, {
      commitment: 'confirmed',
    });
    
    if (!transaction) {
      return { exists: false, confirmed: false };
    }
    
    return {
      exists: true,
      confirmed: true,
      slot: transaction.slot,
      blockTime: transaction.blockTime || undefined,
      fee: transaction.meta?.fee,
    };
  } catch (error) {
    logger.error('Failed to verify transaction signature', {
      error: error instanceof Error ? error.message : 'Unknown error',
      signature,
    });
    
    return { exists: false, confirmed: false };
  }
}

export function generateTransactionMessage(
  walletAddress: string,
  amount: string,
  timestamp: number
): string {
  return `Claiming ${amount} tokens for wallet ${walletAddress} at timestamp ${timestamp}`;
}

export async function getRecentBlockhash(): Promise<string> {
  try {
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    return blockhash;
  } catch (error) {
    logger.error('Failed to get recent blockhash', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

export async function sendAndConfirmTransaction(
  transaction: any
): Promise<string> {
  try {
    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      }
    );
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    
    logger.info('Transaction confirmed', { signature });
    return signature;
  } catch (error) {
    logger.error('Failed to send transaction', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}