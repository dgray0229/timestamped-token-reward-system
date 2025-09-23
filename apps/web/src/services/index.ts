/**
 * Services - Export all service modules
 * 
 * This file provides a central export point for all API services,
 * making imports cleaner throughout the application.
 */

// Export API client and utilities
export * from './api';

// Export individual service modules
export * as walletService from './wallet';
export * as rewardsService from './rewards';
export * as transactionsService from './transactions';
export * as userService from './user';

// Export specific commonly used functions for convenience
export {
  // Wallet service
  authenticateWallet,
  disconnectWallet,
  generateWalletMessage,
  isAuthenticated,
  getStoredUser,
  initializeAuth,
  setupWalletEventListeners,
} from './wallet';

export {
  // Rewards service
  getAvailableRewards,
  claimRewards,
  confirmRewardClaim,
  getUserRewardStats,
  getRewardHistory,
  subscribeToRewardUpdates,
} from './rewards';

export {
  // Transactions service
  getTransactionHistory,
  getTransactionDetails,
  checkTransactionStatus,
  exportTransactions,
  subscribeToTransactionUpdates,
} from './transactions';

export {
  // User service
  getUserProfile,
  updateUserProfile,
  getUserPreferences,
  updateUserPreferences,
  getUserStats,
  exportUserData,
  deleteUserAccount,
} from './user';

export {
  // API utilities
  checkApiHealth,
  setAuthToken,
  getAuthToken,
  clearAuthToken,
} from './api';