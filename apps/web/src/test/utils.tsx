import React, { PropsWithChildren } from 'react';
import { RenderOptions, render } from '@testing-library/react';
import { PreloadedState, configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Import your store and reducers
import { AppStore, RootState } from '../store';
import walletSlice from '../store/slices/walletSlice';
import rewardsSlice from '../store/slices/rewardsSlice';
import transactionsSlice from '../store/slices/transactionsSlice';
import uiSlice from '../store/slices/uiSlice';

// This type interface extends the default options for render from RTL
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: PreloadedState<RootState>;
  store?: AppStore;
}

const defaultPreloadedState: RootState = {
  wallet: {
    isConnected: false,
    isConnecting: false,
    connectionError: null,
    user: null,
    isAuthenticated: false,
    sessionToken: null,
    isAuthenticating: false,
    authError: null,
    walletName: null,
    publicKey: null,
  },
  rewards: {
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
    minClaimAmount: '1000000',
  },
  transactions: {
    transactions: [],
    totalTransactions: 0,
    currentPage: 1,
    totalPages: 1,
    isLoading: false,
    error: null,
    statusFilter: '',
    searchQuery: '',
    selectedTransaction: null,
    isLoadingDetails: false,
    detailsError: null,
    isExporting: false,
    exportError: null,
    pendingTransactions: [],
    lastUpdateTime: null,
  },
  ui: {
    theme: 'system',
    sidebarCollapsed: false,
    modals: {},
    notifications: [],
    loadingStates: {},
    activeTab: 'overview',
    breadcrumbs: [],
    compactMode: false,
    animationsEnabled: true,
    connectionStatus: {
      api: 'connected',
      solana: 'connected',
      wallet: 'connected',
    },
  },
};

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = defaultPreloadedState,
    // Automatically create a store instance if no store was passed in
    store = configureStore({
      reducer: {
        wallet: walletSlice,
        rewards: rewardsSlice,
        transactions: transactionsSlice,
        ui: uiSlice,
      },
      preloadedState,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
): ReturnType<typeof render> & { store: any } {
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return (
      <Provider store={store}>
        <BrowserRouter>{children}</BrowserRouter>
      </Provider>
    );
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Create a mock store with custom initial state
export function createMockStore(initialState: Partial<RootState> = {}) {
  return configureStore({
    reducer: {
      wallet: walletSlice,
      rewards: rewardsSlice,
      transactions: transactionsSlice,
      ui: uiSlice,
    },
    preloadedState: {
      ...defaultPreloadedState,
      ...initialState,
    } as PreloadedState<RootState>,
  });
}

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  wallet_address: '1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T',
  username: 'testuser',
  email: 'test@example.com',
  created_at: '2023-01-01T00:00:00Z',
  last_login: '2023-12-01T10:00:00Z',
};

export const mockRewardTransaction = {
  id: 'test-transaction-id',
  user_id: 'test-user-id',
  amount: '10.50',
  transaction_signature: 'test-signature-123',
  status: 'confirmed' as const,
  timestamp_earned: new Date('2023-12-01T10:00:00Z'),
  timestamp_claimed: new Date('2023-12-01T10:05:00Z'),
  created_at: '2023-12-01T10:00:00Z',
  updated_at: '2023-12-01T10:05:00Z',
};

export const mockAvailableRewards = {
  available_amount: '5.25',
  hours_since_last_claim: 25,
  next_claim_available_in: 0,
  can_claim: true,
  reward_rate_per_hour: '0.1',
  max_daily_reward: '2.4',
};

export const mockApiError = {
  error: {
    code: 'TEST_ERROR',
    message: 'This is a test error',
    timestamp: '2023-12-01T10:00:00Z',
    requestId: 'test-request-id',
  },
};

// Helper to mock API responses
export function mockApiResponse<T>(data: T, success = true) {
  return {
    data: success ? { data, success: true } : { error: data, success: false },
  };
}

// Helper to wait for async operations
export const waitFor = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Custom matchers
export const customMatchers = {
  toHaveNotification: (received: any, type: string, message?: string) => {
    const notifications = received.getState().ui.notifications;
    const hasNotification = notifications.some(
      (n: any) => n.type === type && (!message || n.message.includes(message))
    );

    return {
      message: () =>
        `Expected store to ${hasNotification ? 'not ' : ''}have notification of type "${type}"${
          message ? ` with message containing "${message}"` : ''
        }`,
      pass: hasNotification,
    };
  },
};

// Mock wallet functions
export const mockWalletFunctions = {
  signMessage: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  disconnect: vi.fn().mockResolvedValue(undefined),
  connect: vi.fn().mockResolvedValue(undefined),
};

// Mock Solana PublicKey
export const mockPublicKey = {
  toString: () => '1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T',
  toBase58: () => '1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T',
  toBuffer: () => new Uint8Array([116, 101, 115, 116]),
};

// Test IDs for easier element selection
export const testIds = {
  walletConnection: 'wallet-connection',
  rewardsDashboard: 'rewards-dashboard',
  claimButton: 'claim-button',
  transactionList: 'transaction-list',
  errorBoundary: 'error-boundary',
  toast: 'toast-notification',
} as const;
