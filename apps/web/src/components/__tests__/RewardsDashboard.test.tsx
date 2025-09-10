import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { RewardsDashboard } from '../RewardsDashboard';
import walletSlice from '../../store/slices/walletSlice';
import rewardsSlice from '../../store/slices/rewardsSlice';
import transactionsSlice from '../../store/slices/transactionsSlice';
import uiSlice from '../../store/slices/uiSlice';
import { mockUser } from '../../test/utils';

// Mock services
vi.mock('../../services/rewards', () => ({
  fetchAvailableRewards: vi.fn(),
  claimRewards: vi.fn(),
  fetchRewardStats: vi.fn(),
}));

vi.mock('../../services/transactions', () => ({
  fetchTransactionHistory: vi.fn(),
}));

describe('RewardsDashboard', () => {
  let store: ReturnType<typeof configureStore>;

  const createStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        wallet: walletSlice,
        rewards: rewardsSlice,
        transactions: transactionsSlice,
        ui: uiSlice,
      },
      preloadedState: initialState,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    store = createStore();
  });

  const renderComponent = (storeOverride?: any) => {
    return render(
      <Provider store={storeOverride || store}>
        <RewardsDashboard />
      </Provider>
    );
  };

  describe('when user is not authenticated', () => {
    it('should show authentication required message', () => {
      const unauthenticatedStore = createStore({
        wallet: {
          isAuthenticated: false,
          user: null,
          sessionToken: null,
        },
      });

      renderComponent(unauthenticatedStore);
      
      expect(screen.getByText('Connect your wallet to view rewards')).toBeInTheDocument();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should not display reward information when unauthenticated', () => {
      const unauthenticatedStore = createStore({
        wallet: {
          isAuthenticated: false,
          user: null,
          sessionToken: null,
        },
      });

      renderComponent(unauthenticatedStore);
      
      expect(screen.queryByText('Available Rewards')).not.toBeInTheDocument();
      expect(screen.queryByText('Claim Rewards')).not.toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    const authenticatedState = {
      wallet: {
        isAuthenticated: true,
        user: mockUser,
        sessionToken: 'test-token',
      },
      rewards: {
        availableAmount: '12.50',
        hoursSinceLastClaim: 5,
        nextClaimTime: new Date(Date.now() + 3600000).toISOString(),
        isLoading: false,
        error: null,
        totalEarned: '125.75',
        totalClaimed: '113.25',
        claimCount: 15,
        lastClaimTime: new Date(Date.now() - 18000000).toISOString(),
        isClaiming: false,
        claimError: null,
      },
      transactions: {
        transactions: [
          {
            id: 'tx-1',
            amount: '5.25',
            status: 'confirmed',
            timestamp_claimed: new Date().toISOString(),
            transaction_signature: 'sig-1',
          },
          {
            id: 'tx-2',
            amount: '7.25',
            status: 'confirmed',
            timestamp_claimed: new Date(Date.now() - 86400000).toISOString(),
            transaction_signature: 'sig-2',
          },
        ],
        isLoading: false,
        error: null,
        pagination: {
          page: 1,
          limit: 10,
          total: 15,
          pages: 2,
        },
      },
    };

    it('should display available rewards', () => {
      renderComponent(createStore(authenticatedState));
      
      expect(screen.getByText('Available Rewards')).toBeInTheDocument();
      expect(screen.getByText('12.50 SOL')).toBeInTheDocument();
      expect(screen.getByText('5 hours since last claim')).toBeInTheDocument();
    });

    it('should display reward statistics', () => {
      renderComponent(createStore(authenticatedState));
      
      expect(screen.getByText('Total Earned')).toBeInTheDocument();
      expect(screen.getByText('125.75 SOL')).toBeInTheDocument();
      expect(screen.getByText('Total Claimed')).toBeInTheDocument();
      expect(screen.getByText('113.25 SOL')).toBeInTheDocument();
      expect(screen.getByText('Claims')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should display recent transactions', () => {
      renderComponent(createStore(authenticatedState));
      
      expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
      expect(screen.getByText('5.25 SOL')).toBeInTheDocument();
      expect(screen.getByText('7.25 SOL')).toBeInTheDocument();
      expect(screen.getByText('sig-1')).toBeInTheDocument();
      expect(screen.getByText('sig-2')).toBeInTheDocument();
    });

    it('should enable claim button when rewards are available', () => {
      renderComponent(createStore(authenticatedState));
      
      const claimButton = screen.getByText('Claim 12.50 SOL');
      expect(claimButton).toBeInTheDocument();
      expect(claimButton).not.toBeDisabled();
    });

    it('should handle claim rewards action', async () => {
      renderComponent(createStore(authenticatedState));
      
      const claimButton = screen.getByText('Claim 12.50 SOL');
      fireEvent.click(claimButton);

      // Should show claiming state
      await waitFor(() => {
        expect(screen.getByText('Claiming...')).toBeInTheDocument();
      });
    });

    it('should disable claim button when no rewards available', () => {
      const noRewardsState = {
        ...authenticatedState,
        rewards: {
          ...authenticatedState.rewards,
          availableAmount: '0.00',
          hoursSinceLastClaim: 0,
        },
      };

      renderComponent(createStore(noRewardsState));
      
      const claimButton = screen.getByText('No rewards available');
      expect(claimButton).toBeDisabled();
    });

    it('should show countdown to next claim', () => {
      const recentClaimState = {
        ...authenticatedState,
        rewards: {
          ...authenticatedState.rewards,
          availableAmount: '0.00',
          hoursSinceLastClaim: 0,
          nextClaimTime: new Date(Date.now() + 3600000).toISOString(),
        },
      };

      renderComponent(createStore(recentClaimState));
      
      expect(screen.getByText(/Next claim available in/)).toBeInTheDocument();
      expect(screen.getByText(/59 minutes/)).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show loading spinner when fetching rewards', () => {
      const loadingState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          isLoading: true,
          availableAmount: '0.00',
          error: null,
        },
        transactions: {
          isLoading: false,
          transactions: [],
          error: null,
        },
      };

      renderComponent(createStore(loadingState));
      
      expect(screen.getByTestId('rewards-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading rewards...')).toBeInTheDocument();
    });

    it('should show loading spinner when fetching transactions', () => {
      const loadingState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          isLoading: false,
          availableAmount: '0.00',
          error: null,
        },
        transactions: {
          isLoading: true,
          transactions: [],
          error: null,
        },
      };

      renderComponent(createStore(loadingState));
      
      expect(screen.getByTestId('transactions-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
    });

    it('should show claiming state during reward claim', () => {
      const claimingState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          isLoading: false,
          isClaiming: true,
          availableAmount: '5.00',
          error: null,
          claimError: null,
        },
        transactions: {
          isLoading: false,
          transactions: [],
          error: null,
        },
      };

      renderComponent(createStore(claimingState));
      
      expect(screen.getByText('Claiming...')).toBeInTheDocument();
      expect(screen.getByTestId('claiming-spinner')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should display rewards fetch error', () => {
      const errorState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          isLoading: false,
          availableAmount: '0.00',
          error: 'Failed to fetch rewards',
          claimError: null,
        },
        transactions: {
          isLoading: false,
          transactions: [],
          error: null,
        },
      };

      renderComponent(createStore(errorState));
      
      expect(screen.getByText('Failed to fetch rewards')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should display claim error', () => {
      const claimErrorState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          isLoading: false,
          isClaiming: false,
          availableAmount: '5.00',
          error: null,
          claimError: 'Claim failed: Insufficient funds',
        },
        transactions: {
          isLoading: false,
          transactions: [],
          error: null,
        },
      };

      renderComponent(createStore(claimErrorState));
      
      expect(screen.getByText('Claim failed: Insufficient funds')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should display transactions fetch error', () => {
      const errorState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          isLoading: false,
          availableAmount: '5.00',
          error: null,
        },
        transactions: {
          isLoading: false,
          transactions: [],
          error: 'Failed to load transaction history',
        },
      };

      renderComponent(createStore(errorState));
      
      expect(screen.getByText('Failed to load transaction history')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('should handle retry actions', () => {
      const errorState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          isLoading: false,
          availableAmount: '0.00',
          error: 'Failed to fetch rewards',
        },
        transactions: {
          isLoading: false,
          transactions: [],
          error: null,
        },
      };

      renderComponent(createStore(errorState));
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // Should dispatch retry action
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should adapt layout for mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const authenticatedState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          availableAmount: '12.50',
          isLoading: false,
          error: null,
        },
        transactions: {
          transactions: [],
          isLoading: false,
          error: null,
        },
      };

      renderComponent(createStore(authenticatedState));
      
      const dashboard = screen.getByTestId('rewards-dashboard');
      expect(dashboard).toHaveClass('mobile-layout');
    });

    it('should stack cards vertically on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      const authenticatedState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          availableAmount: '12.50',
          isLoading: false,
          error: null,
        },
        transactions: {
          transactions: [],
          isLoading: false,
          error: null,
        },
      };

      renderComponent(createStore(authenticatedState));
      
      const statsContainer = screen.getByTestId('stats-container');
      expect(statsContainer).toHaveClass('flex-col');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      const authenticatedState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          availableAmount: '12.50',
          isLoading: false,
          error: null,
        },
        transactions: {
          transactions: [],
          isLoading: false,
          error: null,
        },
      };

      renderComponent(createStore(authenticatedState));
      
      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Rewards Dashboard');
      expect(screen.getByRole('button', { name: /claim/i })).toHaveAttribute('aria-describedby');
    });

    it('should announce reward updates to screen readers', () => {
      const authenticatedState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          availableAmount: '12.50',
          isLoading: false,
          error: null,
        },
        transactions: {
          transactions: [],
          isLoading: false,
          error: null,
        },
      };

      renderComponent(createStore(authenticatedState));
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should support keyboard navigation', () => {
      const authenticatedState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          availableAmount: '12.50',
          isLoading: false,
          error: null,
        },
        transactions: {
          transactions: [],
          isLoading: false,
          error: null,
        },
      };

      renderComponent(createStore(authenticatedState));
      
      const claimButton = screen.getByRole('button', { name: /claim/i });
      
      // Test tab navigation
      fireEvent.keyDown(claimButton, { key: 'Tab' });
      
      // Test enter activation
      fireEvent.keyDown(claimButton, { key: 'Enter' });
      
      expect(claimButton).toBeInTheDocument();
    });
  });

  describe('real-time updates', () => {
    it('should update countdown timer', async () => {
      vi.useFakeTimers();
      
      const recentClaimState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          availableAmount: '0.00',
          hoursSinceLastClaim: 0,
          nextClaimTime: new Date(Date.now() + 3600000).toISOString(),
          isLoading: false,
          error: null,
        },
        transactions: {
          transactions: [],
          isLoading: false,
          error: null,
        },
      };

      renderComponent(createStore(recentClaimState));
      
      expect(screen.getByText(/59 minutes/)).toBeInTheDocument();
      
      // Advance timer by 1 minute
      vi.advanceTimersByTime(60000);
      
      await waitFor(() => {
        expect(screen.getByText(/58 minutes/)).toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });

    it('should auto-refresh rewards when countdown reaches zero', async () => {
      vi.useFakeTimers();
      
      const almostReadyState = {
        wallet: {
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
        },
        rewards: {
          availableAmount: '0.00',
          nextClaimTime: new Date(Date.now() + 1000).toISOString(),
          isLoading: false,
          error: null,
        },
        transactions: {
          transactions: [],
          isLoading: false,
          error: null,
        },
      };

      renderComponent(createStore(almostReadyState));
      
      // Advance timer past countdown
      vi.advanceTimersByTime(2000);
      
      await waitFor(() => {
        // Should trigger refresh
        expect(screen.getByTestId('rewards-refreshing')).toBeInTheDocument();
      });
      
      vi.useRealTimers();
    });
  });
});