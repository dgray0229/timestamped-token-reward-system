import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import walletSlice, { 
  connectWallet, 
  disconnectWallet, 
  clearError,
  selectWalletState 
} from '../walletSlice';
import * as walletService from '../../../services/wallet';
import { mockUser } from '../../../test/utils';

// Mock the wallet service
vi.mock('../../../services/wallet', () => ({
  authenticateWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  generateWalletMessage: vi.fn(),
  isAuthenticated: vi.fn(),
  getStoredUser: vi.fn(),
  initializeAuth: vi.fn(),
}));

describe('walletSlice', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        wallet: walletSlice,
      },
    });
  });

  describe('initial state', () => {
    it('should return the initial state', () => {
      const state = store.getState().wallet;
      expect(state).toEqual({
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
      });
    });
  });

  describe('synchronous actions', () => {
    it('should handle clearError', () => {
      // First set an error
      store.dispatch({
        type: 'wallet/connectWallet/rejected',
        error: { message: 'Test error' },
      });

      // Then clear it
      store.dispatch(clearError());

      const state = store.getState().wallet;
      expect(state.authError).toBeNull();
      expect(state.connectionError).toBeNull();
    });

    it('should handle disconnectWallet', () => {
      // First set authenticated state
      store.dispatch({
        type: 'wallet/connectWallet/fulfilled',
        payload: {
          success: true,
          session_token: 'test-token',
          user: mockUser,
        },
      });

      // Then disconnect
      store.dispatch(disconnectWallet());

      const state = store.getState().wallet;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.sessionToken).toBeNull();
      expect(state.isConnected).toBe(false);
    });
  });

  describe('connectWallet async thunk', () => {
    const mockSignMessage = vi.fn();

    beforeEach(() => {
      mockSignMessage.mockClear();
    });

    it('should handle successful wallet connection', async () => {
      const mockResponse = {
        success: true,
        session_token: 'test-token',
        user: mockUser,
      };

      vi.mocked(walletService.generateWalletMessage).mockReturnValue({
        message: 'test message',
        nonce: 'test-nonce',
        timestamp: Date.now(),
      });

      mockSignMessage.mockResolvedValue(new Uint8Array([1, 2, 3]));

      vi.mocked(walletService.authenticateWallet).mockResolvedValue(mockResponse);

      const action = connectWallet({
        walletAddress: mockUser.wallet_address,
        signMessage: mockSignMessage,
      });

      await store.dispatch(action);

      const state = store.getState().wallet;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.sessionToken).toBe('test-token');
      expect(state.isAuthenticating).toBe(false);
      expect(state.authError).toBeNull();
    });

    it('should handle wallet connection failure', async () => {
      const errorMessage = 'Authentication failed';
      
      vi.mocked(walletService.generateWalletMessage).mockReturnValue({
        message: 'test message',
        nonce: 'test-nonce',
        timestamp: Date.now(),
      });

      mockSignMessage.mockResolvedValue(new Uint8Array([1, 2, 3]));

      vi.mocked(walletService.authenticateWallet).mockRejectedValue(
        new Error(errorMessage)
      );

      const action = connectWallet({
        walletAddress: mockUser.wallet_address,
        signMessage: mockSignMessage,
      });

      await store.dispatch(action);

      const state = store.getState().wallet;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.sessionToken).toBeNull();
      expect(state.isAuthenticating).toBe(false);
      expect(state.authError).toBe(errorMessage);
    });

    it('should handle signature rejection', async () => {
      vi.mocked(walletService.generateWalletMessage).mockReturnValue({
        message: 'test message',
        nonce: 'test-nonce',
        timestamp: Date.now(),
      });

      mockSignMessage.mockRejectedValue(new Error('User rejected the request'));

      const action = connectWallet({
        walletAddress: mockUser.wallet_address,
        signMessage: mockSignMessage,
      });

      await store.dispatch(action);

      const state = store.getState().wallet;
      expect(state.isAuthenticated).toBe(false);
      expect(state.authError).toBe('User rejected the request');
    });

    it('should set loading state during authentication', () => {
      const action = connectWallet({
        walletAddress: mockUser.wallet_address,
        signMessage: mockSignMessage,
      });

      store.dispatch(action);

      const state = store.getState().wallet;
      expect(state.isAuthenticating).toBe(true);
      expect(state.authError).toBeNull();
    });
  });

  describe('selectors', () => {
    it('should select wallet state correctly', () => {
      const mockState = {
        wallet: {
          isConnected: true,
          isAuthenticated: true,
          user: mockUser,
          sessionToken: 'test-token',
          isConnecting: false,
          isAuthenticating: false,
          authError: null,
          connectionError: null,
          walletName: 'Phantom',
          publicKey: mockUser.wallet_address,
        },
      };

      const selectedState = selectWalletState(mockState as any);
      expect(selectedState).toEqual(mockState.wallet);
    });
  });

  describe('edge cases', () => {
    it('should handle empty wallet address', async () => {
      const action = connectWallet({
        walletAddress: '',
        signMessage: mockSignMessage,
      });

      await store.dispatch(action);

      const state = store.getState().wallet;
      expect(state.isAuthenticated).toBe(false);
      expect(state.authError).toBeTruthy();
    });

    it('should handle network errors during authentication', async () => {
      vi.mocked(walletService.generateWalletMessage).mockReturnValue({
        message: 'test message',
        nonce: 'test-nonce',
        timestamp: Date.now(),
      });

      mockSignMessage.mockResolvedValue(new Uint8Array([1, 2, 3]));

      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';
      
      vi.mocked(walletService.authenticateWallet).mockRejectedValue(networkError);

      const action = connectWallet({
        walletAddress: mockUser.wallet_address,
        signMessage: mockSignMessage,
      });

      await store.dispatch(action);

      const state = store.getState().wallet;
      expect(state.authError).toBe('Network Error');
    });

    it('should maintain state consistency during multiple connection attempts', async () => {
      // First connection attempt
      const action1 = connectWallet({
        walletAddress: mockUser.wallet_address,
        signMessage: mockSignMessage,
      });

      // Second connection attempt before first completes
      const action2 = connectWallet({
        walletAddress: 'different-address',
        signMessage: mockSignMessage,
      });

      await Promise.all([
        store.dispatch(action1),
        store.dispatch(action2),
      ]);

      const state = store.getState().wallet;
      // Should not be in connecting state after both complete
      expect(state.isAuthenticating).toBe(false);
    });
  });
});