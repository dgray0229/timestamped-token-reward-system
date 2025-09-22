/**
 * Rewards Redux Slice
 * 
 * This slice manages reward calculation, claiming, and related state.
 * It handles:
 * - Available reward calculations
 * - Reward claiming process
 * - User reward statistics
 * - Claiming history and status
 */

import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { AvailableRewards, ClaimRewardResponse } from '@reward-system/shared';
import * as rewardsService from '../../services/rewards';

// Types for rewards state
export interface RewardsState {
  // Available rewards
  availableRewards: AvailableRewards | null;
  isLoadingRewards: boolean;
  rewardsError: string | null;
  lastUpdated: number | null;
  
  // Claiming process
  isClaiming: boolean;
  claimError: string | null;
  pendingClaimId: string | null;
  
  // User statistics
  totalEarned: string;
  totalClaims: number;
  successRate: number;
  
  // Settings
  autoClaimEnabled: boolean;
  minClaimAmount: string;
}

const initialState: RewardsState = {
  availableRewards: null,
  isLoadingRewards: false,
  rewardsError: null,
  lastUpdated: null,
  isClaiming: false,
  claimError: null,
  pendingClaimId: null,
  totalEarned: '0',
  totalClaims: 0,
  successRate: 0,
  autoClaimEnabled: false,
  minClaimAmount: '1000000', // 1 token in smallest units
};

// Async thunks for reward operations
export const fetchAvailableRewards = createAsyncThunk(
  'rewards/fetchAvailable',
  async (_, { rejectWithValue }) => {
    try {
      const rewards = await rewardsService.getAvailableRewards();
      return rewards;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch rewards',
      );
    }
  },
);

export const claimRewards = createAsyncThunk(
  'rewards/claim',
  async (expectedAmount: string, { rejectWithValue }) => {
    try {
      const response = await rewardsService.claimRewards(expectedAmount);
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to claim rewards',
      );
    }
  },
);

export const confirmRewardClaim = createAsyncThunk(
  'rewards/confirmClaim',
  async (params: {
    transactionId: string;
    signature: string;
  }, { rejectWithValue }) => {
    try {
      const response = await rewardsService.confirmRewardClaim(
        params.transactionId,
        params.signature,
      );
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to confirm claim',
      );
    }
  },
);

export const fetchUserStats = createAsyncThunk(
  'rewards/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await rewardsService.getUserRewardStats();
      return stats;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch user stats',
      );
    }
  },
);

// Rewards slice definition
const rewardsSlice = createSlice({
  name: 'rewards',
  initialState,
  reducers: {
    // Clear errors
    clearRewardsError: (state) => {
      state.rewardsError = null;
      state.claimError = null;
    },
    
    // Update settings
    setAutoClaimEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoClaimEnabled = action.payload;
    },
    
    setMinClaimAmount: (state, action: PayloadAction<string>) => {
      state.minClaimAmount = action.payload;
    },
    
    // Reset claim state
    resetClaimState: (state) => {
      state.isClaiming = false;
      state.claimError = null;
      state.pendingClaimId = null;
    },
    
    // Set pending claim
    setPendingClaim: (state, action: PayloadAction<string>) => {
      state.pendingClaimId = action.payload;
    },
    
    // Update last refreshed timestamp
    updateLastRefreshed: (state) => {
      state.lastUpdated = Date.now();
    },
  },
  
  extraReducers: (builder) => {
    // Handle fetch available rewards
    builder
      .addCase(fetchAvailableRewards.pending, (state) => {
        state.isLoadingRewards = true;
        state.rewardsError = null;
      })
      .addCase(fetchAvailableRewards.fulfilled, (state, action: PayloadAction<AvailableRewards>) => {
        state.isLoadingRewards = false;
        state.availableRewards = action.payload;
        state.lastUpdated = Date.now();
        state.rewardsError = null;
      })
      .addCase(fetchAvailableRewards.rejected, (state, action) => {
        state.isLoadingRewards = false;
        state.rewardsError = action.payload as string;
      });
    
    // Handle claim rewards
    builder
      .addCase(claimRewards.pending, (state) => {
        state.isClaiming = true;
        state.claimError = null;
      })
      .addCase(claimRewards.fulfilled, (state, action: PayloadAction<ClaimRewardResponse>) => {
        state.isClaiming = false;
        state.pendingClaimId = action.payload.transaction_id;
        state.claimError = null;
      })
      .addCase(claimRewards.rejected, (state, action) => {
        state.isClaiming = false;
        state.claimError = action.payload as string;
      });
    
    // Handle confirm reward claim
    builder
      .addCase(confirmRewardClaim.pending, (state) => {
        // Keep current state during confirmation
      })
      .addCase(confirmRewardClaim.fulfilled, (state, action) => {
        // Reset claim state on successful confirmation
        state.pendingClaimId = null;
        state.claimError = null;
        
        // Update available rewards to zero after successful claim
        if (state.availableRewards) {
          state.availableRewards.available_amount = '0';
          state.availableRewards.next_claim_available_in = 24; // 24 hours from now
        }
        
        // Increment total claims
        state.totalClaims += 1;
      })
      .addCase(confirmRewardClaim.rejected, (state, action) => {
        state.claimError = action.payload as string;
        // Keep pending claim ID for retry
      });
    
    // Handle fetch user stats
    builder
      .addCase(fetchUserStats.pending, (state) => {
        // Keep current state during stats fetch
      })
      .addCase(fetchUserStats.fulfilled, (state, action: PayloadAction<{
        totalEarned: string;
        totalClaims: number;
        successRate: number;
      }>) => {
        state.totalEarned = action.payload.totalEarned;
        state.totalClaims = action.payload.totalClaims;
        state.successRate = action.payload.successRate;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        // Ignore stats fetch errors for now
        console.warn('Failed to fetch user stats:', action.payload);
      });
  },
});

// Export actions
export const {
  clearRewardsError,
  setAutoClaimEnabled,
  setMinClaimAmount,
  resetClaimState,
  setPendingClaim,
  updateLastRefreshed,
} = rewardsSlice.actions;

// Export reducer
export default rewardsSlice.reducer;

// Selectors for easy state access
export const selectRewards = (state: { rewards: RewardsState }) => state.rewards;
export const selectAvailableRewards = (state: { rewards: RewardsState }) => state.rewards.availableRewards;
export const selectIsLoadingRewards = (state: { rewards: RewardsState }) => state.rewards.isLoadingRewards;
export const selectIsClaiming = (state: { rewards: RewardsState }) => state.rewards.isClaiming;
export const selectPendingClaimId = (state: { rewards: RewardsState }) => state.rewards.pendingClaimId;
export const selectTotalEarned = (state: { rewards: RewardsState }) => state.rewards.totalEarned;
export const selectTotalClaims = (state: { rewards: RewardsState }) => state.rewards.totalClaims;
export const selectAutoClaimEnabled = (state: { rewards: RewardsState }) => state.rewards.autoClaimEnabled;