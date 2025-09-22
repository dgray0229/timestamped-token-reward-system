import { Router, Response } from 'express';
import { supabase } from '../config/database.js';
import logger from '../config/logger.js';
import {
  asyncHandler,
  validateRequest,
  schemas,
  AuthenticatedRequest,
  createError,
  authenticateToken,
} from '../middleware/index.js';
import { verifyTransactionSignature } from '../utils/solana.js';
import type {
  RewardTransaction,
  PaginatedTransactions,
  TransactionHistoryParams,
} from '@reward-system/shared';

const router = Router();

router.get('/',
  authenticateToken,
  validateRequest({ query: schemas.transactionHistory }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { page = 1, limit = 20, status } = req.query as TransactionHistoryParams;

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
      logger.error('Failed to fetch transactions', { error, userId });
      throw createError('Failed to fetch transaction history', 500, 'DATABASE_ERROR');
    }

    const formattedTransactions: RewardTransaction[] = (transactions || []).map(t => ({
      id: t.id,
      user_id: t.user_id,
      reward_amount: t.reward_amount,
      transaction_signature: t.transaction_signature,
      status: t.status as 'pending' | 'confirmed' | 'failed',
      timestamp_earned: new Date(t.timestamp_earned),
      timestamp_claimed: t.timestamp_claimed ? new Date(t.timestamp_claimed) : new Date(t.timestamp_earned),
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    const response: PaginatedTransactions = {
      transactions: formattedTransactions,
      pagination: {
        page: parseInt(page.toString()),
        limit: parseInt(limit.toString()),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };

    res.json({
      data: response,
      success: true,
    });
  })
);

router.get('/:id',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const { data: transaction, error } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !transaction) {
      throw createError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    const response: RewardTransaction = {
      id: transaction.id,
      user_id: transaction.user_id,
      reward_amount: transaction.reward_amount,
      transaction_signature: transaction.transaction_signature,
      status: transaction.status as 'pending' | 'confirmed' | 'failed',
      timestamp_earned: new Date(transaction.timestamp_earned),
      timestamp_claimed: transaction.timestamp_claimed ? new Date(transaction.timestamp_claimed) : new Date(transaction.timestamp_earned),
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
    };

    res.json({
      data: response,
      success: true,
    });
  })
);

router.get('/:id/status',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const { data: transaction, error } = await supabase
      .from('reward_transactions')
      .select('id, status, transaction_signature, updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !transaction) {
      throw createError('Transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    let blockNumber: string | undefined;
    let confirmations: number | undefined;

    // If transaction has a signature, verify it on-chain
    if (transaction.transaction_signature) {
      try {
        const verification = await verifyTransactionSignature(transaction.transaction_signature);
        if (verification.exists && verification.confirmed) {
          blockNumber = verification.slot?.toString();
          confirmations = verification.slot ? 100 : 0; // Simplified confirmation count
        }
      } catch (error) {
        logger.warn('Failed to verify transaction on-chain', {
          transactionId: id,
          signature: transaction.transaction_signature,
          error,
        });
      }
    }

    res.json({
      data: {
        transactionId: transaction.id,
        status: transaction.status,
        blockNumber,
        confirmations,
        lastChecked: new Date(),
      },
      success: true,
    });
  })
);

router.get('/export',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { format = 'json', page, limit, status } = req.query as any;

    let query = supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (page && limit) {
      query = query.range((page - 1) * limit, page * limit - 1);
    }

    const { data: transactions, error } = await query;

    if (error) {
      logger.error('Failed to export transactions', { error, userId });
      throw createError('Failed to export transactions', 500, 'DATABASE_ERROR');
    }

    const formattedTransactions = (transactions || []).map(t => ({
      id: t.id,
      reward_amount: t.reward_amount,
      transaction_signature: t.transaction_signature,
      status: t.status,
      timestamp_earned: t.timestamp_earned,
      timestamp_claimed: t.timestamp_claimed,
      created_at: t.created_at,
    }));

    if (format === 'csv') {
      // Convert to CSV format
      const headers = [
        'ID',
        'Amount',
        'Status',
        'Transaction Signature',
        'Timestamp Earned',
        'Timestamp Claimed',
        'Created At'
      ];

      const csvRows = [
        headers.join(','),
        ...formattedTransactions.map(t => [
          t.id,
          t.reward_amount,
          t.status,
          t.transaction_signature || '',
          t.timestamp_earned,
          t.timestamp_claimed || '',
          t.created_at
        ].join(','))
      ];

      const csvContent = csvRows.join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      res.send(csvContent);
    } else {
      // Return JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.json');
      res.json(formattedTransactions);
    }
  })
);

router.get('/search',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { q: query } = req.query as { q: string };

    if (!query || query.length < 3) {
      throw createError('Search query must be at least 3 characters', 400, 'INVALID_QUERY');
    }

    const { data: transactions, error } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .or(`transaction_signature.ilike.%${query}%,id.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Failed to search transactions', { error, userId, query });
      throw createError('Search failed', 500, 'SEARCH_ERROR');
    }

    const formattedTransactions: RewardTransaction[] = (transactions || []).map(t => ({
      id: t.id,
      user_id: t.user_id,
      reward_amount: t.reward_amount,
      transaction_signature: t.transaction_signature,
      status: t.status as 'pending' | 'confirmed' | 'failed',
      timestamp_earned: new Date(t.timestamp_earned),
      timestamp_claimed: t.timestamp_claimed ? new Date(t.timestamp_claimed) : new Date(t.timestamp_earned),
      created_at: t.created_at,
      updated_at: t.updated_at,
    }));

    res.json({
      data: {
        transactions: formattedTransactions,
        totalResults: formattedTransactions.length,
      },
      success: true,
    });
  })
);

router.get('/stats',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    const { data: transactions, error } = await supabase
      .from('reward_transactions')
      .select('reward_amount, status, timestamp_earned, timestamp_claimed')
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to fetch transaction stats', { error, userId });
      throw createError('Failed to fetch statistics', 500, 'DATABASE_ERROR');
    }

    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(t => t.status === 'confirmed').length;
    const failedTransactions = transactions.filter(t => t.status === 'failed').length;
    const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

    const confirmedTransactions = transactions.filter(t => t.status === 'confirmed');
    const totalVolume = confirmedTransactions.reduce((sum, t) => sum + parseFloat(t.reward_amount), 0);
    const averageTransactionSize = confirmedTransactions.length > 0 ? totalVolume / confirmedTransactions.length : 0;

    const sortedTransactions = confirmedTransactions.sort((a, b) => 
      new Date(a.timestamp_earned).getTime() - new Date(b.timestamp_earned).getTime()
    );
    const firstTransactionDate = sortedTransactions[0]?.timestamp_earned || null;
    const lastTransactionDate = sortedTransactions[sortedTransactions.length - 1]?.timestamp_earned || null;

    // Calculate monthly breakdown
    const monthlyBreakdown: Array<{ month: string; count: number; volume: string }> = [];
    const monthlyData: Record<string, { count: number; volume: number }> = {};

    confirmedTransactions.forEach(t => {
      const date = new Date(t.timestamp_earned);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { count: 0, volume: 0 };
      }
      
      monthlyData[monthKey].count++;
      monthlyData[monthKey].volume += parseFloat(t.reward_amount);
    });

    Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, data]) => {
        monthlyBreakdown.push({
          month,
          count: data.count,
          volume: data.volume.toFixed(2),
        });
      });

    res.json({
      data: {
        totalTransactions,
        successfulTransactions,
        failedTransactions,
        pendingTransactions,
        successRate: Math.round(successRate * 100) / 100,
        totalVolume: totalVolume.toFixed(2),
        averageTransactionSize: averageTransactionSize.toFixed(2),
        firstTransactionDate,
        lastTransactionDate,
        monthlyBreakdown,
      },
      success: true,
    });
  })
);

router.post('/:id/retry',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { id } = req.params;

    const { data: transaction, error } = await supabase
      .from('reward_transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('status', 'failed')
      .single();

    if (error || !transaction) {
      throw createError('Failed transaction not found', 404, 'TRANSACTION_NOT_FOUND');
    }

    // Create new transaction with same parameters
    const { data: newTransaction, error: insertError } = await supabase
      .from('reward_transactions')
      .insert({
        user_id: userId,
        reward_amount: transaction.reward_amount,
        status: 'pending',
        timestamp_earned: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to create retry transaction', { error: insertError, userId, originalId: id });
      throw createError('Failed to retry transaction', 500, 'RETRY_FAILED');
    }

    logger.info('Transaction retry created', {
      userId,
      originalTransactionId: id,
      newTransactionId: newTransaction.id,
    });

    res.json({
      data: {
        newTransactionId: newTransaction.id,
        status: 'pending',
        message: 'Transaction retry created successfully',
      },
      success: true,
    });
  })
);

export default router;