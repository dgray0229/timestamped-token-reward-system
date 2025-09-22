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
import type { User } from '@reward-system/shared';

const router = Router();

router.get('/profile',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    res.json({
      data: {
        id: user.id,
        wallet_address: user.wallet_address,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
        last_login: user.last_login,
      },
      success: true,
    });
  })
);

router.put('/profile',
  authenticateToken,
  validateRequest({ body: schemas.updateProfile }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { username, email } = req.body;

    const updates: Partial<User> = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;

    if (Object.keys(updates).length === 0) {
      throw createError('No valid fields to update', 400, 'NO_UPDATES');
    }

    // Check if username is already taken (if provided)
    if (username) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', userId)
        .single();

      if (existingUser) {
        throw createError('Username is already taken', 400, 'USERNAME_TAKEN');
      }
    }

    // Check if email is already taken (if provided)
    if (email) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        throw createError('Email is already taken', 400, 'EMAIL_TAKEN');
      }
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update user profile', { error, userId, updates });
      throw createError('Failed to update profile', 500, 'UPDATE_FAILED');
    }

    logger.info('User profile updated', { userId, updates });

    res.json({
      data: {
        id: updatedUser.id,
        wallet_address: updatedUser.wallet_address,
        username: updatedUser.username,
        email: updatedUser.email,
        created_at: updatedUser.created_at,
        last_login: updatedUser.last_login,
      },
      success: true,
    });
  })
);

router.get('/preferences',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    const { data: preferences, error } = await supabase
      .from('reward_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Failed to fetch user preferences', { error, userId });
      throw createError('Failed to fetch preferences', 500, 'DATABASE_ERROR');
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      auto_claim_enabled: false,
      min_claim_amount: '0.1',
      email_notifications: false,
    };

    res.json({
      data: preferences ? {
        autoClaimEnabled: preferences.auto_claim_enabled,
        minClaimAmount: preferences.min_claim_amount,
        emailNotifications: preferences.email_notifications,
      } : defaultPreferences,
      success: true,
    });
  })
);

router.put('/preferences',
  authenticateToken,
  validateRequest({ body: schemas.rewardPreferences }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { auto_claim_enabled, min_claim_amount, email_notifications } = req.body;

    const updates: any = {};
    if (auto_claim_enabled !== undefined) updates.auto_claim_enabled = auto_claim_enabled;
    if (min_claim_amount !== undefined) updates.min_claim_amount = min_claim_amount;
    if (email_notifications !== undefined) updates.email_notifications = email_notifications;

    if (Object.keys(updates).length === 0) {
      throw createError('No valid preferences to update', 400, 'NO_UPDATES');
    }

    // Upsert preferences
    const { data: preferences, error } = await supabase
      .from('reward_preferences')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to update user preferences', { error, userId, updates });
      throw createError('Failed to update preferences', 500, 'UPDATE_FAILED');
    }

    logger.info('User preferences updated', { userId, updates });

    res.json({
      data: {
        autoClaimEnabled: preferences.auto_claim_enabled,
        minClaimAmount: preferences.min_claim_amount,
        emailNotifications: preferences.email_notifications,
      },
      success: true,
    });
  })
);

router.get('/stats',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    // Get user statistics
    const { data: transactions, error: transactionError } = await supabase
      .from('reward_transactions')
      .select('reward_amount, status, timestamp_earned, timestamp_claimed')
      .eq('user_id', userId);

    if (transactionError) {
      logger.error('Failed to fetch user stats', { error: transactionError, userId });
      throw createError('Failed to fetch user statistics', 500, 'DATABASE_ERROR');
    }

    const totalTransactions = transactions.length;
    const confirmedTransactions = transactions.filter(t => t.status === 'confirmed');
    const totalEarned = confirmedTransactions.reduce((sum, t) => sum + parseFloat(t.reward_amount), 0);
    const successRate = totalTransactions > 0 ? (confirmedTransactions.length / totalTransactions) * 100 : 0;

    const sortedTransactions = confirmedTransactions.sort((a, b) => 
      new Date(a.timestamp_earned).getTime() - new Date(b.timestamp_earned).getTime()
    );

    res.json({
      data: {
        totalEarned: totalEarned.toFixed(2),
        totalTransactions,
        successfulTransactions: confirmedTransactions.length,
        successRate: Math.round(successRate * 100) / 100,
        joinDate: req.user!.created_at,
        lastActivity: req.user!.last_login,
        firstReward: sortedTransactions[0]?.timestamp_earned || null,
        lastReward: sortedTransactions[sortedTransactions.length - 1]?.timestamp_earned || null,
      },
      success: true,
    });
  })
);

router.post('/report-issue',
  authenticateToken,
  validateRequest({ body: schemas.reportIssue }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const { transaction_id, description, type, expected_outcome } = req.body;

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        transaction_id,
        type,
        description,
        status: 'open',
        priority: 'medium',
        metadata: expected_outcome ? { expected_outcome } : null,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create support ticket', { error, userId });
      throw createError('Failed to report issue', 500, 'TICKET_CREATION_FAILED');
    }

    logger.info('Support ticket created', {
      userId,
      ticketId: ticket.id,
      type,
      transactionId: transaction_id,
    });

    res.json({
      data: {
        ticketId: ticket.id,
        message: 'Issue reported successfully. Our support team will review it shortly.',
      },
      success: true,
    });
  })
);

router.get('/tickets',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch support tickets', { error, userId });
      throw createError('Failed to fetch support tickets', 500, 'DATABASE_ERROR');
    }

    res.json({
      data: tickets || [],
      success: true,
    });
  })
);

router.get('/export',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    // Get all user data
    const [userResult, transactionsResult, preferencesResult, ticketsResult] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('reward_transactions').select('*').eq('user_id', userId),
      supabase.from('reward_preferences').select('*').eq('user_id', userId).single(),
      supabase.from('support_tickets').select('*').eq('user_id', userId),
    ]);

    const exportData = {
      user: userResult.data,
      transactions: transactionsResult.data || [],
      preferences: preferencesResult.data,
      supportTickets: ticketsResult.data || [],
      exportedAt: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(exportData, null, 2);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=user-data-export.json');
    res.send(jsonContent);

    logger.info('User data exported', { userId });
  })
);

router.delete('/account',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;

    // Delete user data in correct order (respecting foreign key constraints)
    const deleteOperations = [
      supabase.from('support_tickets').delete().eq('user_id', userId),
      supabase.from('reward_preferences').delete().eq('user_id', userId),
      supabase.from('reward_transactions').delete().eq('user_id', userId),
      supabase.from('user_sessions').delete().eq('user_id', userId),
      supabase.from('users').delete().eq('id', userId),
    ];

    try {
      for (const operation of deleteOperations) {
        const { error } = await operation;
        if (error) {
          throw error;
        }
      }

      logger.info('User account deleted', { userId });

      res.json({
        data: { message: 'Account deleted successfully' },
        success: true,
      });
    } catch (error) {
      logger.error('Failed to delete user account', { error, userId });
      throw createError('Failed to delete account', 500, 'DELETION_FAILED');
    }
  })
);

export default router;