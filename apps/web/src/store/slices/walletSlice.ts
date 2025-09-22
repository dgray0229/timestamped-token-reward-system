/**
 * Wallet Redux Slice
 * 
 * This slice manages wallet connection state and user authentication.
 * It handles:
 * - Wallet connection status and metadata
 * - User authentication state
 * - Session management
 * - Connection errors and loading states
 */

import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { User, WalletConnectResponse } from '@reward-system/shared';
import * as walletService from '../../services/wallet';

// Types for wallet state
export interface WalletState {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  
  // User authentication
  user: User | null;
  isAuthenticated: boolean;
  sessionToken: string | null;
  
  // Loading states
  isAuthenticating: boolean;
  authError: string | null;
  
  // Wallet metadata
  walletName: string | null;
  publicKey: string | null;
}

const initialState: WalletState = {
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
};

// Async thunks for wallet operations
export const authenticateWallet = createAsyncThunk(
  'wallet/authenticate',
  async (params: {
    walletAddress: string;
    signature: string;
    message: string;
  }, { rejectWithValue }) => {
    try {
      const response = await walletService.authenticateWallet(
        params.walletAddress,
        params.signature,
        params.message,
      );
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Authentication failed',
      );
    }
  },
);

export const disconnectWallet = createAsyncThunk(
  'wallet/disconnect',
  async (_, { rejectWithValue }) => {
    try {
      await walletService.disconnectWallet();
      return;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Disconnect failed',
      );
    }
  },
);

export const refreshSession = createAsyncThunk(
  'wallet/refreshSession',
  async (_, { rejectWithValue }) => {
    try {
      const response = await walletService.refreshSession();
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Session refresh failed',
      );
    }
  },
);

// Wallet slice definition
const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // Synchronous actions for immediate state updates
    setWalletConnected: (state, action: PayloadAction<{
      walletName: string;
      publicKey: string;
    }>) => {
      state.isConnected = true;
      state.isConnecting = false;
      state.connectionError = null;
      state.walletName = action.payload.walletName;
      state.publicKey = action.payload.publicKey;
    },
    
    setWalletConnecting: (state) => {
      state.isConnecting = true;
      state.connectionError = null;
    },
    
    setWalletDisconnected: (state) => {
      state.isConnected = false;
      state.isConnecting = false;
      state.connectionError = null;
      state.user = null;
      state.isAuthenticated = false;
      state.sessionToken = null;
      state.walletName = null;
      state.publicKey = null;
    },
    
    setConnectionError: (state, action: PayloadAction<string>) => {
      state.isConnecting = false;
      state.connectionError = action.payload;
    },
    
    clearErrors: (state) => {
      state.connectionError = null;
      state.authError = null;
    },
    
    // Session management
    restoreSession: (state, action: PayloadAction<{
      user: User;
      sessionToken: string;
    }>) => {
      state.user = action.payload.user;
      state.sessionToken = action.payload.sessionToken;
      state.isAuthenticated = true;
    },
  },
  
  extraReducers: (builder) => {
    // Handle authenticate wallet async thunk
    builder
      .addCase(authenticateWallet.pending, (state) => {
        state.isAuthenticating = true;
        state.authError = null;
      })
      .addCase(authenticateWallet.fulfilled, (state, action: PayloadAction<WalletConnectResponse>) => {
        state.isAuthenticating = false;
        state.user = action.payload.user;
        state.sessionToken = action.payload.session_token;
        state.isAuthenticated = true;
        state.authError = null;
      })
      .addCase(authenticateWallet.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.authError = action.payload as string;
      });
    
    // Handle disconnect wallet async thunk
    builder
      .addCase(disconnectWallet.pending, (state) => {
        // Keep current state during disconnect
      })
      .addCase(disconnectWallet.fulfilled, (state) => {
        // Clear all authentication state
        state.user = null;
        state.sessionToken = null;
        state.isAuthenticated = false;
        state.authError = null;
      })
      .addCase(disconnectWallet.rejected, (state, action) => {
        state.authError = action.payload as string;
      });
    
    // Handle refresh session async thunk
    builder
      .addCase(refreshSession.pending, (state) => {
        // Keep current state during refresh
      })
      .addCase(refreshSession.fulfilled, (state, action: PayloadAction<WalletConnectResponse>) => {
        state.user = action.payload.user;
        state.sessionToken = action.payload.session_token;
        state.isAuthenticated = true;
        state.authError = null;
      })
      .addCase(refreshSession.rejected, (state, action) => {
        // On refresh failure, clear session
        state.user = null;
        state.sessionToken = null;
        state.isAuthenticated = false;
        state.authError = action.payload as string;
      });
  },
});

// Export actions
export const {
  setWalletConnected,
  setWalletConnecting,
  setWalletDisconnected,
  setConnectionError,
  clearErrors,
  restoreSession,
} = walletSlice.actions;

// Export reducer
export default walletSlice.reducer;

// Selectors for easy state access
export const selectWallet = (state: { wallet: WalletState }) => state.wallet;
export const selectIsConnected = (state: { wallet: WalletState }) => state.wallet.isConnected;
export const selectIsAuthenticated = (state: { wallet: WalletState }) => state.wallet.isAuthenticated;
export const selectUser = (state: { wallet: WalletState }) => state.wallet.user;
export const selectPublicKey = (state: { wallet: WalletState }) => state.wallet.publicKey;
export const selectWalletName = (state: { wallet: WalletState }) => state.wallet.walletName;