import { Router, Response } from 'express';
import { supabase } from '../config/database.js';
import { config } from '../config/index.js';
import logger from '../config/logger.js';
import {
  asyncHandler,
  validateRequest,
  schemas,
  claimRateLimit,
  AuthenticatedRequest,
  createError,
  authenticateToken,
} from '../middleware/index.js';
import type {
  AvailableRewards,
  ClaimRewardResponse,
  RewardTransaction,
  CreateTransactionRequest,
  ConfirmTransactionRequest,
} from '@reward-system/shared';

const router = Router();

router.get('/available',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    // Get user's last claim timestamp
    const { data: lastTransaction, error: transactionError } = await supabase
      .from('reward_transactions')
      .select('timestamp_claimed')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('timestamp_claimed', { ascending: false })
      .limit(1)
      .single();

    if (transactionError && transactionError.code !== 'PGRST116') {
      logger.error('Failed to fetch last transaction', { error: transactionError, userId });
      throw createError('Failed to fetch reward data', 500, 'DATABASE_ERROR');
    }

    const now = new Date();
    const lastClaimTime = lastTransaction?.timestamp_claimed 
      ? new Date(lastTransaction.timestamp_claimed)
      : new Date(req.user!.created_at); // Use registration time if no claims

    const hoursSinceLastClaim = Math.floor((now.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60));
    const minIntervalHours = config.rewards.minClaimIntervalHours;
    
    // Check if user can claim rewards
    const canClaim = hoursSinceLastClaim >= minIntervalHours;
    const nextClaimAvailableIn = Math.max(0, minIntervalHours - hoursSinceLastClaim);

    // Calculate available reward amount
    let availableAmount = '0';
    if (canClaim) {
      const rewardHours = Math.min(hoursSinceLastClaim, 24); // Cap at 24 hours
      const calculatedAmount = rewardHours * config.rewards.rewardRatePerHour;
      availableAmount = Math.min(calculatedAmount, config.rewards.maxDailyReward).toFixed(2);
    }

    const response: AvailableRewards = {
      available_amount: availableAmount,
      hours_since_last_claim: hoursSinceLastClaim,
      next_claim_available_in: nextClaimAvailableIn,
      can_claim: canClaim,
      reward_rate_per_hour: config.rewards.rewardRatePerHour.toString(),
      max_daily_reward: config.rewards.maxDailyReward.toString(),
    };

    res.json({
      data: response,
      success: true,
    });
  })
);

router.post('/claim',
  authenticateToken,
  claimRateLimit,
  validateRequest({ body: schemas.claimReward }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { expected_amount }: Pick<CreateTransactionRequest, 'expected_amount'> = req.body;

    // Verify expected amount is valid
    const expectedAmountNum = parseFloat(expected_amount);
    if (isNaN(expectedAmountNum) || expectedAmountNum <= 0) {
      throw createError('Invalid expected amount', 400, 'INVALID_AMOUNT');
    }

    // Get available rewards to verify claim
    const { data: lastTransaction } = await supabase
      .from('reward_transactions')
      .select('timestamp_claimed')
      .eq('user_id', userId)
      .eq('status', 'confirmed')
      .order('timestamp_claimed', { ascending: false })
      .limit(1)
      .single();

    const now = new Date();
    const lastClaimTime = lastTransaction?.timestamp_claimed 
      ? new Date(lastTransaction.timestamp_claimed)
      : new Date(req.user!.created_at);

    const hoursSinceLastClaim = Math.floor((now.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60));
    const minIntervalHours = config.rewards.minClaimIntervalHours;

    if (hoursSinceLastClaim < minIntervalHours) {
      throw createError(
        `Cannot claim rewards yet. Wait ${minIntervalHours - hoursSinceLastClaim} more hours.`,
        400,
        'CLAIM_TOO_SOON'
      );
    }

    // Calculate actual available amount
    const rewardHours = Math.min(hoursSinceLastClaim, 24);
    const calculatedAmount = rewardHours * config.rewards.rewardRatePerHour;
    const actualAmount = Math.min(calculatedAmount, config.rewards.maxDailyReward);

    // Verify expected amount matches calculated (with small tolerance)
    if (Math.abs(expectedAmountNum - actualAmount) > 0.01) {
      throw createError(
        `Amount mismatch. Expected: ${expected_amount}, Calculated: ${actualAmount.toFixed(2)}`,
        400,
        'AMOUNT_MISMATCH'
      );
    }

    // Create pending transaction record
    const { data: transaction, error: insertError } = await supabase
      .from('reward_transactions')
      .insert({
        user_id: userId,
        amount: actualAmount.toFixed(2),
        status: 'pending',
        timestamp_earned: now.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create transaction', { error: insertError, userId });
      throw createError('Failed to create claim transaction', 500, 'TRANSACTION_CREATION_FAILED');
    }

    logger.info('Reward claim initiated', {
      userId,
      transactionId: transaction.id,
      amount: actualAmount,
    });

    const response: ClaimRewardResponse = {
      transaction_id: transaction.id,
      amount: transaction.amount,
      message: 'Reward claim initiated. Please sign the transaction to complete the claim.',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
    };

    res.json({
      data: response,
      success: true,
    });
  })
);

router.post('/confirm',
  authenticateToken,
  validateRequest({ body: schemas.confirmTransaction }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { transaction_id, signature }: ConfirmTransactionRequest = req.body;

    // Get the pending transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('id', transaction_id)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !transaction) {
      throw createError('Transaction not found or already processed', 404, 'TRANSACTION_NOT_FOUND');
    }

    // Check if transaction has expired (10 minutes)
    const createdAt = new Date(transaction.created_at);
    const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);
    
    if (new Date() > expiresAt) {
      // Mark transaction as failed
      await supabase
        .from('reward_transactions')
        .update({ status: 'failed' })
        .eq('id', transaction_id);

      throw createError('Transaction has expired', 400, 'TRANSACTION_EXPIRED');
    }

    // TODO: Verify the Solana transaction signature
    // For now, we'll just confirm the transaction
    // In a real implementation, you would:
    // 1. Verify the signature on Solana blockchain
    // 2. Check the transaction contains the correct amount
    // 3. Verify it was sent to the correct address

    // Update transaction with signature and mark as confirmed
    const { data: confirmedTransaction, error: updateError } = await supabase
      .from('reward_transactions')
      .update({
        transaction_signature: signature,
        status: 'confirmed',
        timestamp_claimed: new Date().toISOString(),
      })
      .eq('id', transaction_id)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to confirm transaction', { error: updateError, transactionId: transaction_id });
      throw createError('Failed to confirm transaction', 500, 'CONFIRMATION_FAILED');
    }

    logger.info('Reward claim confirmed', {
      userId,
      transactionId: transaction_id,
      signature,
      amount: confirmedTransaction.amount,
    });

    const response: RewardTransaction = {
      id: confirmedTransaction.id,
      user_id: confirmedTransaction.user_id,
      amount: confirmedTransaction.amount,
      transaction_signature: confirmedTransaction.transaction_signature,
      status: confirmedTransaction.status as 'pending' | 'confirmed' | 'failed',
      timestamp_earned: new Date(confirmedTransaction.timestamp_earned),
      timestamp_claimed: new Date(confirmedTransaction.timestamp_claimed!),
      created_at: confirmedTransaction.created_at,
      updated_at: confirmedTransaction.updated_at,
    };

    res.json({
      data: response,
      success: true,
    });
  })
);

router.get('/stats',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    // Get user reward statistics
    const { data: transactions, error } = await supabase
      .from('reward_transactions')
      .select('amount, status, timestamp_claimed')
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to fetch reward stats', { error, userId });
      throw createError('Failed to fetch statistics', 500, 'DATABASE_ERROR');
    }

    const confirmedTransactions = transactions.filter(t => t.status === 'confirmed');
    const totalEarned = confirmedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalClaims = confirmedTransactions.length;
    const successRate = transactions.length > 0 ? (totalClaims / transactions.length) * 100 : 0;
    const averageClaimAmount = totalClaims > 0 ? totalEarned / totalClaims : 0;

    const firstClaim = confirmedTransactions
      .sort((a, b) => new Date(a.timestamp_claimed!).getTime() - new Date(b.timestamp_claimed!).getTime())[0];
    const lastClaim = confirmedTransactions
      .sort((a, b) => new Date(b.timestamp_claimed!).getTime() - new Date(a.timestamp_claimed!).getTime())[0];

    res.json({
      data: {
        totalEarned: totalEarned.toFixed(2),
        totalClaims,
        successRate: Math.round(successRate * 100) / 100,
        averageClaimAmount: averageClaimAmount.toFixed(2),
        firstClaimDate: firstClaim?.timestamp_claimed || null,
        lastClaimDate: lastClaim?.timestamp_claimed || null,
      },
      success: true,
    });
  })
);

router.get('/history',
  authenticateToken,
  validateRequest({ query: schemas.rewardHistory }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { page = 1, limit = 20, status } = req.query as any;

    let query = supabase
      .from('reward_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: transactions, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      logger.error('Failed to fetch reward history', { error, userId });
      throw createError('Failed to fetch reward history', 500, 'DATABASE_ERROR');
    }

    const formattedTransactions: RewardTransaction[] = (transactions || []).map(t => ({
      id: t.id,
      user_id: t.user_id,
      amount: t.amount,
      transaction_signature: t.transaction_signature,
      status: t.status as 'pending' | 'confirmed' | 'failed',
      timestamp_earned: new Date(t.timestamp_earned),
      timestamp_claimed: t.timestamp_claimed ? new Date(t.timestamp_claimed) : new Date(t.timestamp_earned),
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    res.json({
      data: {
        rewards: formattedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      },
      success: true,
    });
  })
);

export default router;