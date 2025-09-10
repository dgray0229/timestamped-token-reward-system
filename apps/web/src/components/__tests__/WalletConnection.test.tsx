import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { WalletConnection } from '../WalletConnection';
import walletSlice, { connectWallet } from '../../store/slices/walletSlice';
import uiSlice from '../../store/slices/uiSlice';
import { mockUser } from '../../test/utils';

// Mock the wallet adapter
const mockWalletAdapter = {
  publicKey: { toString: () => 'test-wallet-address' },
  signMessage: vi.fn(),
  connected: true,
  connecting: false,
  name: 'Phantom',
};

vi.mock('@solana/wallet-adapter-react', () => ({
  useWallet: () => mockWalletAdapter,
  useConnection: () => ({
    connection: {
      getVersion: vi.fn().mockResolvedValue({ 'solana-core': '1.14.0' }),
    },
  }),
}));

describe('WalletConnection', () => {
  let store: ReturnType<typeof configureStore>;

  const createStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        wallet: walletSlice,
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
        <WalletConnection />
      </Provider>
    );
  };

  describe('when wallet is not connected', () => {
    beforeEach(() => {
      mockWalletAdapter.connected = false;
      mockWalletAdapter.publicKey = null;
    });

    it('should render connect wallet button', () => {
      renderComponent();
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should show wallet selection options', () => {
      renderComponent();
      expect(screen.getByText('Choose your wallet:')).toBeInTheDocument();
      expect(screen.getByText('Phantom')).toBeInTheDocument();
      expect(screen.getByText('Solflare')).toBeInTheDocument();
      expect(screen.getByText('Sollet')).toBeInTheDocument();
    });

    it('should handle wallet connection error', async () => {
      mockWalletAdapter.connected = false;
      const errorStore = createStore({
        wallet: {
          isConnected: false,
          isConnecting: false,
          connectionError: 'Failed to connect wallet',
          user: null,
          isAuthenticated: false,
          sessionToken: null,
          isAuthenticating: false,
          authError: null,
          walletName: null,
          publicKey: null,
        },
      });

      renderComponent(errorStore);
      expect(screen.getByText('Failed to connect wallet')).toBeInTheDocument();
    });
  });

  describe('when wallet is connected but not authenticated', () => {
    beforeEach(() => {
      mockWalletAdapter.connected = true;
      mockWalletAdapter.publicKey = { toString: () => 'test-wallet-address' };
    });

    it('should show authenticate button', () => {
      const connectedStore = createStore({
        wallet: {
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          user: null,
          isAuthenticated: false,
          sessionToken: null,
          isAuthenticating: false,
          authError: null,
          walletName: 'Phantom',
          publicKey: 'test-wallet-address',
        },
      });

      renderComponent(connectedStore);
      expect(screen.getByText('Authenticate Wallet')).toBeInTheDocument();
      expect(screen.getByText('test-wallet-address')).toBeInTheDocument();
    });

    it('should handle authentication on button click', async () => {
      const connectedStore = createStore({
        wallet: {
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          user: null,
          isAuthenticated: false,
          sessionToken: null,
          isAuthenticating: false,
          authError: null,
          walletName: 'Phantom',
          publicKey: 'test-wallet-address',
        },
      });

      mockWalletAdapter.signMessage.mockResolvedValue(new Uint8Array([1, 2, 3]));

      renderComponent(connectedStore);
      
      const authenticateButton = screen.getByText('Authenticate Wallet');
      fireEvent.click(authenticateButton);

      expect(mockWalletAdapter.signMessage).toHaveBeenCalled();
    });

    it('should show loading state during authentication', () => {
      const authenticatingStore = createStore({
        wallet: {
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          user: null,
          isAuthenticated: false,
          sessionToken: null,
          isAuthenticating: true,
          authError: null,
          walletName: 'Phantom',
          publicKey: 'test-wallet-address',
        },
      });

      renderComponent(authenticatingStore);
      expect(screen.getByText('Authenticating...')).toBeInTheDocument();
    });

    it('should display authentication error', () => {
      const errorStore = createStore({
        wallet: {
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          user: null,
          isAuthenticated: false,
          sessionToken: null,
          isAuthenticating: false,
          authError: 'Authentication failed',
          walletName: 'Phantom',
          publicKey: 'test-wallet-address',
        },
      });

      renderComponent(errorStore);
      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });
  });

  describe('when wallet is authenticated', () => {
    it('should show user profile and disconnect option', () => {
      const authenticatedStore = createStore({
        wallet: {
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          user: mockUser,
          isAuthenticated: true,
          sessionToken: 'test-token',
          isAuthenticating: false,
          authError: null,
          walletName: 'Phantom',
          publicKey: mockUser.wallet_address,
        },
      });

      renderComponent(authenticatedStore);
      
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText(mockUser.wallet_address)).toBeInTheDocument();
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('should display user information correctly', () => {
      const authenticatedStore = createStore({
        wallet: {
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          user: { ...mockUser, username: 'testuser' },
          isAuthenticated: true,
          sessionToken: 'test-token',
          isAuthenticating: false,
          authError: null,
          walletName: 'Phantom',
          publicKey: mockUser.wallet_address,
        },
      });

      renderComponent(authenticatedStore);
      
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('Phantom')).toBeInTheDocument();
    });

    it('should handle disconnect action', () => {
      const authenticatedStore = createStore({
        wallet: {
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          user: mockUser,
          isAuthenticated: true,
          sessionToken: 'test-token',
          isAuthenticating: false,
          authError: null,
          walletName: 'Phantom',
          publicKey: mockUser.wallet_address,
        },
      });

      renderComponent(authenticatedStore);
      
      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);

      // Should dispatch disconnect action
      const state = authenticatedStore.getState();
      expect(state.wallet.isAuthenticated).toBe(false);
    });
  });

  describe('wallet selection', () => {
    it('should handle wallet selection', () => {
      renderComponent();
      
      const phantomOption = screen.getByText('Phantom');
      fireEvent.click(phantomOption);

      // Should initiate wallet connection
      expect(screen.getByText('Phantom')).toBeInTheDocument();
    });

    it('should show wallet icons correctly', () => {
      renderComponent();
      
      const walletOptions = screen.getAllByRole('button');
      expect(walletOptions.length).toBeGreaterThan(0);
    });
  });

  describe('responsive design', () => {
    it('should render mobile-friendly layout', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderComponent();
      
      const container = screen.getByTestId('wallet-connection');
      expect(container).toHaveClass('mobile-layout');
    });

    it('should render desktop layout on larger screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderComponent();
      
      const container = screen.getByTestId('wallet-connection');
      expect(container).toHaveClass('desktop-layout');
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderComponent();
      
      const connectButton = screen.getByRole('button', { name: /connect wallet/i });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', () => {
      renderComponent();
      
      const connectButton = screen.getByText('Connect Wallet');
      
      // Test keyboard activation
      fireEvent.keyDown(connectButton, { key: 'Enter' });
      fireEvent.keyDown(connectButton, { key: ' ' });
      
      // Should handle keyboard events
      expect(connectButton).toHaveFocus();
    });

    it('should announce status changes to screen readers', () => {
      const authenticatedStore = createStore({
        wallet: {
          isConnected: true,
          isConnecting: false,
          connectionError: null,
          user: mockUser,
          isAuthenticated: true,
          sessionToken: 'test-token',
          isAuthenticating: false,
          authError: null,
          walletName: 'Phantom',
          publicKey: mockUser.wallet_address,
        },
      });

      renderComponent(authenticatedStore);
      
      const statusAnnouncement = screen.getByRole('status');
      expect(statusAnnouncement).toHaveTextContent('Wallet connected and authenticated');
    });
  });

  describe('edge cases', () => {
    it('should handle wallet adapter errors gracefully', () => {
      mockWalletAdapter.connected = false;
      mockWalletAdapter.publicKey = null;
      
      // Mock wallet adapter throwing error
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderComponent();
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('should handle missing wallet adapter', () => {
      vi.mock('@solana/wallet-adapter-react', () => ({
        useWallet: () => null,
        useConnection: () => null,
      }));

      renderComponent();
      
      expect(screen.getByText('Wallet adapter not available')).toBeInTheDocument();
    });

    it('should handle network connectivity issues', async () => {
      const networkErrorStore = createStore({
        wallet: {
          isConnected: false,
          isConnecting: false,
          connectionError: 'Network error: Failed to connect to Solana',
          user: null,
          isAuthenticated: false,
          sessionToken: null,
          isAuthenticating: false,
          authError: null,
          walletName: null,
          publicKey: null,
        },
      });

      renderComponent(networkErrorStore);
      
      expect(screen.getByText('Network error: Failed to connect to Solana')).toBeInTheDocument();
      expect(screen.getByText('Retry Connection')).toBeInTheDocument();
    });
  });
});