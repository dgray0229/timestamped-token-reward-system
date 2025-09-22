/**
 * Wallet Service - Wallet authentication and management
 *
 * This service handles wallet-based authentication with:
 * - Wallet signature verification
 * - User session management
 * - Authentication state persistence
 * - Integration with Solana wallet adapters
 */

import { api, setAuthToken } from './api';
import type {
  User,
  WalletConnectRequest,
  WalletConnectResponse,
} from '@reward-system/shared';
import {
  AUTH_ENDPOINTS,
  generateNonce,
  generateSignatureMessage,
} from '@reward-system/shared';

/**
 * Authenticate user with wallet signature
 */
export async function authenticateWallet(
  walletAddress: string,
  signature: string,
  message: string
): Promise<WalletConnectResponse> {
  const request: WalletConnectRequest = {
    wallet_address: walletAddress,
    signature,
    message,
  };

  const response = await api.post<WalletConnectResponse>(
    AUTH_ENDPOINTS.WALLET_CONNECT,
    request
  );

  // Store authentication data
  if (response.session_token) {
    setAuthToken(response.session_token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  return response;
}

/**
 * Generate message for wallet signing
 */
export function generateWalletMessage(walletAddress: string): {
  message: string;
  nonce: string;
  timestamp: number;
} {
  const nonce = generateNonce();
  const timestamp = Date.now();
  const message = generateSignatureMessage(walletAddress, nonce, timestamp);

  return { message, nonce, timestamp };
}

/**
 * Disconnect wallet and clear session
 */
export async function disconnectWallet(): Promise<void> {
  try {
    await api.post(AUTH_ENDPOINTS.DISCONNECT);
  } catch (error) {
    // Continue with local cleanup even if API call fails
    console.warn('Failed to disconnect from server:', error);
  } finally {
    // Clear local authentication data
    setAuthToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('sessionToken');
  }
}

/**
 * Refresh authentication session
 */
export async function refreshSession(): Promise<WalletConnectResponse> {
  const response = await api.post<WalletConnectResponse>(
    AUTH_ENDPOINTS.REFRESH_TOKEN
  );

  // Update stored authentication data
  if (response.session_token) {
    setAuthToken(response.session_token);
    localStorage.setItem('user', JSON.stringify(response.user));
  }

  return response;
}

/**
 * Verify current session is valid
 */
export async function verifySession(): Promise<{
  valid: boolean;
  user?: User;
}> {
  try {
    const response = await api.get<{ user: User }>(
      AUTH_ENDPOINTS.VERIFY_SESSION
    );
    return { valid: true, user: response.user };
  } catch (error) {
    return { valid: false };
  }
}

/**
 * Get stored user data
 */
export function getStoredUser(): User | null {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Failed to parse stored user data:', error);
    return null;
  }
}

/**
 * Get stored session token
 */
export function getStoredSessionToken(): string | null {
  return localStorage.getItem('sessionToken');
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  const token = getStoredSessionToken();
  const user = getStoredUser();
  return !!(token && user);
}

/**
 * Initialize authentication on app startup
 */
export async function initializeAuth(): Promise<{
  isAuthenticated: boolean;
  user: User | null;
}> {
  const token = getStoredSessionToken();
  const user = getStoredUser();

  if (!token || !user) {
    return { isAuthenticated: false, user: null };
  }

  try {
    // Verify session is still valid
    const sessionCheck = await verifySession();

    if (sessionCheck.valid && sessionCheck.user) {
      // Update stored user data in case it changed
      localStorage.setItem('user', JSON.stringify(sessionCheck.user));
      return { isAuthenticated: true, user: sessionCheck.user };
    } else {
      // Clear invalid session
      await disconnectWallet();
      return { isAuthenticated: false, user: null };
    }
  } catch (error) {
    console.error('Failed to verify session on startup:', error);
    // Clear potentially invalid session
    await disconnectWallet();
    return { isAuthenticated: false, user: null };
  }
}

/**
 * Update user profile information
 */
export async function updateUserProfile(updates: {
  username?: string;
  email?: string;
}): Promise<User> {
  const response = await api.put<User>('/users/profile', updates);

  // Update stored user data
  localStorage.setItem('user', JSON.stringify(response));

  return response;
}

/**
 * Delete user account
 */
export async function deleteUserAccount(): Promise<void> {
  await api.delete('/users/account');

  // Clear all local data after successful deletion
  await disconnectWallet();
}

/**
 * Listen for wallet disconnection events
 */
export function setupWalletEventListeners() {
  // Listen for custom logout events
  window.addEventListener('auth:logout', () => {
    disconnectWallet();
  });

  // Listen for storage changes (multi-tab support)
  window.addEventListener('storage', event => {
    if (event.key === 'sessionToken' && !event.newValue) {
      // Token was cleared in another tab
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  });

  // Listen for beforeunload to cleanup
  window.addEventListener('beforeunload', () => {
    // Don't clear session on page reload, only on actual navigation away
    // The session will be verified on next startup
  });
}

/**
 * Export user data for download
 */
export async function exportUserData(): Promise<Blob> {
  const response = await api.get('/users/export', {
    responseType: 'blob',
  });

  return response;
}
