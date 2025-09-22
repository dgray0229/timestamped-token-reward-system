/**
 * Rewards Service - Reward calculation and claiming
 * 
 * This service handles reward-related operations:
 * - Available reward calculations
 * - Reward claiming process
 * - Transaction confirmation
 * - User reward statistics
 */

import { api } from './api';
import type {
  AvailableRewards,
  ClaimRewardResponse,
  ConfirmTransactionRequest,
  CreateTransactionRequest,
  RewardTransaction,
} from '@reward-system/shared';
import { REWARD_ENDPOINTS } from '@reward-system/shared';

/**
 * Get available rewards for current user
 */
export async function getAvailableRewards(): Promise<AvailableRewards> {
  const response = await api.get<AvailableRewards>(REWARD_ENDPOINTS.AVAILABLE);
  return response;
}

/**
 * Initiate reward claim process
 */
export async function claimRewards(expectedAmount: string): Promise<ClaimRewardResponse> {
  const request: Pick<CreateTransactionRequest, 'expected_amount'> = {
    expected_amount: expectedAmount,
  };

  const response = await api.post<ClaimRewardResponse>(
    REWARD_ENDPOINTS.CLAIM,
    request,
  );

  return response;
}

/**
 * Confirm reward claim with transaction signature
 */
export async function confirmRewardClaim(
  transactionId: string,
  signature: string,
): Promise<RewardTransaction> {
  const request: ConfirmTransactionRequest = {
    transaction_id: transactionId,
    signature,
  };

  const response = await api.post<RewardTransaction>(
    REWARD_ENDPOINTS.CONFIRM,
    request,
  );

  return response;
}

/**
 * Get user reward statistics
 */
export async function getUserRewardStats(): Promise<{
  totalEarned: string;
  totalClaims: number;
  successRate: number;
  averageClaimAmount: string;
  firstClaimDate: Date | null;
  lastClaimDate: Date | null;
}> {
  const response = await api.get('/rewards/stats');
  
  // Convert date strings to Date objects
  return {
    ...response,
    firstClaimDate: response.firstClaimDate ? new Date(response.firstClaimDate) : null,
    lastClaimDate: response.lastClaimDate ? new Date(response.lastClaimDate) : null,
  };
}

/**
 * Get reward claiming history
 */
export async function getRewardHistory(params: {
  page?: number;
  limit?: number;
  status?: 'pending' | 'confirmed' | 'failed';
} = {}): Promise<{
  rewards: RewardTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);

  const url = `${REWARD_ENDPOINTS.HISTORY}?${queryParams.toString()}`;
  const response = await api.get(url);
  
  return response;
}

/**
 * Calculate potential rewards for a given time period
 */
export async function calculatePotentialRewards(hours: number): Promise<{
  estimatedAmount: string;
  timeToNextClaim: number;
  maxDailyReward: string;
}> {
  const response = await api.get(`/rewards/calculate?hours=${hours}`);
  return response;
}

/**
 * Get reward pool information
 */
export async function getRewardPoolInfo(): Promise<{
  totalTokens: string;
  tokensDistributed: string;
  tokensRemaining: string;
  rewardRatePerHour: string;
  minClaimIntervalHours: number;
  isActive: boolean;
  participantCount: number;
}> {
  const response = await api.get('/rewards/pool');
  return response;
}

/**
 * Set reward preferences
 */
export async function setRewardPreferences(preferences: {
  autoClaimEnabled?: boolean;
  minClaimAmount?: string;
  emailNotifications?: boolean;
}): Promise<void> {
  await api.put('/rewards/preferences', preferences);
}

/**
 * Get reward preferences
 */
export async function getRewardPreferences(): Promise<{
  autoClaimEnabled: boolean;
  minClaimAmount: string;
  emailNotifications: boolean;
}> {
  const response = await api.get('/rewards/preferences');
  return response;
}

/**
 * Check if auto-claim is available
 */
export async function checkAutoClaimEligibility(): Promise<{
  eligible: boolean;
  availableAmount: string;
  reason?: string;
}> {
  const response = await api.get('/rewards/auto-claim/check');
  return response;
}

/**
 * Trigger auto-claim (if enabled and eligible)
 */
export async function triggerAutoClaim(): Promise<{
  success: boolean;
  transactionId?: string;
  amount?: string;
  message: string;
}> {
  const response = await api.post('/rewards/auto-claim/trigger');
  return response;
}

/**
 * Get leaderboard for top earners
 */
export async function getRewardLeaderboard(params: {
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all-time';
  limit?: number;
} = {}): Promise<{
  leaderboard: Array<{
    rank: number;
    walletAddress: string;
    username?: string;
    totalEarned: string;
    claimCount: number;
  }>;
  currentUserRank?: number;
  timeframe: string;
}> {
  const queryParams = new URLSearchParams();
  
  if (params.timeframe) queryParams.append('timeframe', params.timeframe);
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const url = `/rewards/leaderboard?${queryParams.toString()}`;
  const response = await api.get(url);
  
  return response;
}

/**
 * Report a reward claiming issue
 */
export async function reportRewardIssue(issue: {
  transactionId?: string;
  description: string;
  type: 'claim_failed' | 'incorrect_amount' | 'missing_reward' | 'other';
}): Promise<{
  ticketId: string;
  message: string;
}> {
  const response = await api.post('/rewards/report-issue', issue);
  return response;
}

/**
 * Subscribe to reward notifications
 */
export async function subscribeToRewardUpdates(
  callback: (update: {
    type: 'new_reward' | 'claim_processed' | 'claim_failed';
    data: any;
  }) => void,
): Promise<() => void> {
  // This would typically use WebSocket or Server-Sent Events
  // For now, we'll implement polling as a fallback
  
  let isSubscribed = true;
  let pollInterval: number;
  
  const poll = async () => {
    if (!isSubscribed) return;
    
    try {
      // Check for new rewards
      const rewards = await getAvailableRewards();
      
      // Notify if rewards are available
      if (parseFloat(rewards.available_amount) > 0) {
        callback({
          type: 'new_reward',
          data: rewards,
        });
      }
      
      // Schedule next poll
      pollInterval = window.setTimeout(poll, 60000); // Poll every minute
    } catch (error) {
      console.error('Failed to poll for reward updates:', error);
      // Retry with exponential backoff
      pollInterval = window.setTimeout(poll, 120000); // Wait 2 minutes on error
    }
  };
  
  // Start polling
  poll();
  
  // Return unsubscribe function
  return () => {
    isSubscribed = false;
    if (pollInterval) {
      clearTimeout(pollInterval);
    }
  };
}