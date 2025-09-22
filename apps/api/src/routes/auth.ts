import { Router, Response } from 'express';
import { supabase } from '../config/database.js';
import logger from '../config/logger.js';
import {
  asyncHandler,
  validateRequest,
  schemas,
  authRateLimit,
  AuthenticatedRequest,
  createError,
  authenticateToken,
} from '../middleware/index.js';
import {
  verifyWalletSignature,
  isValidSolanaAddress,
  generateSessionToken,
  generateNonce,
  generateSignatureMessage,
  isValidTimestamp,
} from '../utils/index.js';
import type {
  WalletConnectRequest,
  WalletConnectResponse,
  User,
} from '@reward-system/shared';

const router = Router();

router.post(
  '/wallet/connect',
  authRateLimit,
  validateRequest({ body: schemas.walletConnect }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { wallet_address, signature, message }: WalletConnectRequest =
      req.body;

    // Validate wallet address format
    if (!isValidSolanaAddress(wallet_address)) {
      throw createError(
        'Invalid Solana wallet address',
        400,
        'INVALID_WALLET_ADDRESS'
      );
    }

    // Parse and validate message components
    const messageLines = message.split('\n');
    const walletLine = messageLines.find(line => line.startsWith('Wallet:'));
    const nonceLine = messageLines.find(line => line.startsWith('Nonce:'));
    const timestampLine = messageLines.find(line =>
      line.startsWith('Timestamp:')
    );

    if (!walletLine || !nonceLine || !timestampLine) {
      throw createError(
        'Invalid message format',
        400,
        'INVALID_MESSAGE_FORMAT'
      );
    }

    const messageWallet = walletLine.split('Wallet: ')[1];
    const messageTimestamp = parseInt(timestampLine.split('Timestamp: ')[1]);

    // Verify wallet address matches
    if (messageWallet !== wallet_address) {
      throw createError(
        'Wallet address mismatch',
        400,
        'WALLET_ADDRESS_MISMATCH'
      );
    }

    // Verify timestamp is recent (5 minutes)
    if (!isValidTimestamp(messageTimestamp, 300000)) {
      throw createError(
        'Message timestamp is expired or invalid',
        400,
        'INVALID_TIMESTAMP'
      );
    }

    // Verify signature
    const verificationResult = verifyWalletSignature(
      signature,
      message,
      wallet_address
    );
    if (!verificationResult.isValid) {
      logger.error('Wallet signature verification failed', {
        walletAddress: wallet_address,
        messagePreview: message.substring(0, 100) + '...',
        signaturePreview: signature.substring(0, 20) + '...',
      });
      throw createError('Invalid signature', 401, 'INVALID_SIGNATURE');
    }

    // Check if user exists
    let { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', wallet_address)
      .single();

    let user: User;

    if (userError && userError.code !== 'PGRST116') {
      logger.error('Database error checking user', { error: userError });
      throw createError('Database error', 500, 'DATABASE_ERROR');
    }

    if (!existingUser) {
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          wallet_address,
          username: `user_${wallet_address.slice(0, 8)}`,
          total_rewards_earned: '0',
          last_claim_timestamp: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Failed to create user', { error: insertError });
        throw createError(
          'Failed to create user account',
          500,
          'USER_CREATION_FAILED'
        );
      }

      user = newUser;
      logger.info('New user created', {
        userId: user.id,
        walletAddress: wallet_address,
      });
    } else {
      // Use existing user
      user = existingUser;
      logger.info('User logged in', {
        userId: user.id,
        walletAddress: wallet_address,
      });
    }

    // Generate session token
    const sessionToken = generateSessionToken(user.id);

    // Store session in database
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        wallet_address: user.wallet_address,
        session_token: sessionToken,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days
        is_active: true,
        last_activity: new Date().toISOString(),
      });

    if (sessionError) {
      logger.error('Failed to create session', { error: sessionError });
      throw createError(
        'Failed to create session',
        500,
        'SESSION_CREATION_FAILED'
      );
    }

    const response: WalletConnectResponse = {
      success: true,
      session_token: sessionToken,
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        username: user.username,
        email: user.email,
        created_at: new Date(user.created_at),
        total_rewards_earned: user.total_rewards_earned,
        last_claim_timestamp: new Date(user.last_claim_timestamp),
        updated_at: new Date(user.updated_at),
      },
    };

    res.json({
      data: response,
      success: true,
    });
  })
);

router.post(
  '/disconnect',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    // Deactivate all sessions for this user
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to deactivate sessions', { error, userId });
      throw createError('Failed to disconnect', 500, 'DISCONNECT_FAILED');
    }

    logger.info('User disconnected', { userId });

    res.json({
      data: { message: 'Successfully disconnected' },
      success: true,
    });
  })
);

router.post(
  '/refresh',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    // Generate new session token
    const sessionToken = generateSessionToken(user.id);

    // Update session in database
    const { error } = await supabase
      .from('user_sessions')
      .update({
        session_token: sessionToken,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        last_activity: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      logger.error('Failed to refresh session', { error, userId: user.id });
      throw createError('Failed to refresh session', 500, 'REFRESH_FAILED');
    }

    const response: WalletConnectResponse = {
      success: true,
      session_token: sessionToken,
      user: {
        id: user.id,
        wallet_address: user.wallet_address,
        username: user.username,
        email: user.email,
        created_at: new Date(user.created_at),
        total_rewards_earned: user.total_rewards_earned,
        last_claim_timestamp: new Date(user.last_claim_timestamp),
        updated_at: new Date(user.updated_at),
      },
    };

    res.json({
      data: response,
      success: true,
    });
  })
);

router.get(
  '/verify',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    res.json({
      data: {
        user: {
          id: user.id,
          wallet_address: user.wallet_address,
          username: user.username,
          email: user.email,
          created_at: new Date(user.created_at),
          total_rewards_earned: user.total_rewards_earned,
          last_claim_timestamp: new Date(user.last_claim_timestamp),
          updated_at: new Date(user.updated_at),
        },
      },
      success: true,
    });
  })
);

router.get(
  '/nonce',
  authRateLimit,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { wallet_address } = req.query;

    if (!wallet_address || typeof wallet_address !== 'string') {
      throw createError(
        'Wallet address is required',
        400,
        'MISSING_WALLET_ADDRESS'
      );
    }

    if (!isValidSolanaAddress(wallet_address)) {
      throw createError(
        'Invalid Solana wallet address',
        400,
        'INVALID_WALLET_ADDRESS'
      );
    }

    const nonce = generateNonce();
    const timestamp = Date.now();
    const message = generateSignatureMessage(wallet_address, nonce, timestamp);

    res.json({
      data: {
        message,
        nonce,
        timestamp,
      },
      success: true,
    });
  })
);

export default router;
