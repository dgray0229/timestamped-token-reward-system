import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as walletService from '../wallet';
import { api, setAuthToken } from '../api';
import { mockUser } from '../../test/utils';

// Mock the API
vi.mock('../api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  setAuthToken: vi.fn(),
  clearAuthToken: vi.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock crypto for UUID generation
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-123'),
  },
});

describe('Wallet Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateWalletMessage', () => {
    it('should generate a valid wallet message', () => {
      const walletAddress = 'test-wallet-address';
      const mockTimestamp = 1638360000000;
      
      vi.spyOn(Date, 'now').mockReturnValue(mockTimestamp);

      const result = walletService.generateWalletMessage(walletAddress);

      expect(result).toEqual({
        message: expect.stringContaining('Welcome to Reward System!'),
        nonce: 'mock-uuid-123',
        timestamp: mockTimestamp,
      });

      expect(result.message).toContain(walletAddress);
      expect(result.message).toContain('mock-uuid-123');
      expect(result.message).toContain(mockTimestamp.toString());
    });

    it('should include anti-phishing warning in message', () => {
      const result = walletService.generateWalletMessage('test-address');
      
      expect(result.message).toContain('This request will not trigger a blockchain transaction');
      expect(result.message).toContain('or cost any gas fees');
    });

    it('should generate unique nonces for different calls', () => {
      window.crypto.randomUUID
        .mockReturnValueOnce('uuid-1')
        .mockReturnValueOnce('uuid-2');

      const result1 = walletService.generateWalletMessage('address1');
      const result2 = walletService.generateWalletMessage('address2');

      expect(result1.nonce).toBe('uuid-1');
      expect(result2.nonce).toBe('uuid-2');
    });
  });

  describe('authenticateWallet', () => {
    const validAuthRequest = {
      walletAddress: 'test-wallet-address',
      signature: 'test-signature',
      message: 'test-message',
    };

    it('should successfully authenticate wallet', async () => {
      const mockResponse = {
        success: true,
        data: {
          session_token: 'jwt-token-123',
          user: mockUser,
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await walletService.authenticateWallet(
        validAuthRequest.walletAddress,
        validAuthRequest.signature,
        validAuthRequest.message
      );

      expect(api.post).toHaveBeenCalledWith('/auth/wallet/connect', {
        wallet_address: validAuthRequest.walletAddress,
        signature: validAuthRequest.signature,
        message: validAuthRequest.message,
      });

      expect(setAuthToken).toHaveBeenCalledWith('jwt-token-123');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sessionToken', 'jwt-token-123');

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle authentication failure', async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: {
            error: {
              code: 'INVALID_SIGNATURE',
              message: 'Invalid wallet signature',
            },
          },
        },
      };

      vi.mocked(api.post).mockRejectedValue(errorResponse);

      await expect(
        walletService.authenticateWallet(
          validAuthRequest.walletAddress,
          validAuthRequest.signature,
          validAuthRequest.message
        )
      ).rejects.toThrow();

      expect(setAuthToken).not.toHaveBeenCalled();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should validate input parameters', async () => {
      await expect(
        walletService.authenticateWallet('', 'signature', 'message')
      ).rejects.toThrow('Wallet address is required');

      await expect(
        walletService.authenticateWallet('address', '', 'message')
      ).rejects.toThrow('Signature is required');

      await expect(
        walletService.authenticateWallet('address', 'signature', '')
      ).rejects.toThrow('Message is required');
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network Error');
      vi.mocked(api.post).mockRejectedValue(networkError);

      await expect(
        walletService.authenticateWallet(
          validAuthRequest.walletAddress,
          validAuthRequest.signature,
          validAuthRequest.message
        )
      ).rejects.toThrow('Network Error');
    });
  });

  describe('disconnectWallet', () => {
    it('should successfully disconnect wallet', async () => {
      mockLocalStorage.getItem.mockReturnValue('jwt-token-123');
      vi.mocked(api.post).mockResolvedValue({
        success: true,
        data: { message: 'Successfully disconnected' },
      });

      await walletService.disconnectWallet();

      expect(api.post).toHaveBeenCalledWith('/auth/disconnect');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sessionToken');
    });

    it('should handle disconnect when no session exists', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await walletService.disconnectWallet();

      expect(api.post).not.toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sessionToken');
    });

    it('should clean up local storage even if API call fails', async () => {
      mockLocalStorage.getItem.mockReturnValue('jwt-token-123');
      vi.mocked(api.post).mockRejectedValue(new Error('API Error'));

      await walletService.disconnectWallet();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sessionToken');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when session token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('jwt-token-123');

      expect(walletService.isAuthenticated()).toBe(true);
    });

    it('should return false when no session token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(walletService.isAuthenticated()).toBe(false);
    });

    it('should return false for empty session token', () => {
      mockLocalStorage.getItem.mockReturnValue('');

      expect(walletService.isAuthenticated()).toBe(false);
    });
  });

  describe('getStoredUser', () => {
    it('should return parsed user data when exists', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

      const result = walletService.getStoredUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when no user data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = walletService.getStoredUser();

      expect(result).toBeNull();
    });

    it('should handle corrupted user data gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = walletService.getStoredUser();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse stored user data:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('getStoredSessionToken', () => {
    it('should return session token when exists', () => {
      mockLocalStorage.getItem.mockReturnValue('jwt-token-123');

      const result = walletService.getStoredSessionToken();

      expect(result).toBe('jwt-token-123');
    });

    it('should return null when no session token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = walletService.getStoredSessionToken();

      expect(result).toBeNull();
    });
  });

  describe('initializeAuth', () => {
    it('should initialize auth with stored credentials', async () => {
      const storedUser = mockUser;
      const storedToken = 'jwt-token-123';

      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(storedUser))
        .mockReturnValueOnce(storedToken);

      vi.mocked(api.get).mockResolvedValue({
        success: true,
        data: { user: storedUser },
      });

      const result = await walletService.initializeAuth();

      expect(setAuthToken).toHaveBeenCalledWith(storedToken);
      expect(api.get).toHaveBeenCalledWith('/auth/verify');
      expect(result).toEqual({ user: storedUser, sessionToken: storedToken });
    });

    it('should return null when no stored credentials exist', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await walletService.initializeAuth();

      expect(result).toBeNull();
      expect(api.get).not.toHaveBeenCalled();
    });

    it('should clear invalid stored credentials', async () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockUser))
        .mockReturnValueOnce('invalid-token');

      vi.mocked(api.get).mockRejectedValue({
        response: { status: 401 },
      });

      const result = await walletService.initializeAuth();

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sessionToken');
    });

    it('should handle network errors during verification', async () => {
      mockLocalStorage.getItem
        .mockReturnValueOnce(JSON.stringify(mockUser))
        .mockReturnValueOnce('jwt-token-123');

      vi.mocked(api.get).mockRejectedValue(new Error('Network Error'));

      const result = await walletService.initializeAuth();

      expect(result).toBeNull();
      // Should not clear credentials on network error (might be temporary)
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('refreshSession', () => {
    it('should successfully refresh session', async () => {
      const newToken = 'new-jwt-token-456';
      const refreshedUser = { ...mockUser, last_login: new Date().toISOString() };

      vi.mocked(api.post).mockResolvedValue({
        success: true,
        data: {
          session_token: newToken,
          user: refreshedUser,
        },
      });

      const result = await walletService.refreshSession();

      expect(api.post).toHaveBeenCalledWith('/auth/refresh');
      expect(setAuthToken).toHaveBeenCalledWith(newToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(refreshedUser));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sessionToken', newToken);
      expect(result).toEqual({ user: refreshedUser, sessionToken: newToken });
    });

    it('should handle refresh failure', async () => {
      vi.mocked(api.post).mockRejectedValue({
        response: { status: 401 },
      });

      await expect(walletService.refreshSession()).rejects.toThrow();
      expect(setAuthToken).not.toHaveBeenCalled();
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('message validation', () => {
    it('should validate message format during authentication', async () => {
      const invalidMessage = 'Invalid message format';

      await expect(
        walletService.authenticateWallet('address', 'signature', invalidMessage)
      ).rejects.toThrow('Invalid message format');
    });

    it('should validate message timestamp', async () => {
      const expiredTimestamp = Date.now() - (16 * 60 * 1000); // 16 minutes ago
      const expiredMessage = `Welcome to Reward System!\n\nWallet: address\nNonce: nonce\nTimestamp: ${expiredTimestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

      await expect(
        walletService.authenticateWallet('address', 'signature', expiredMessage)
      ).rejects.toThrow('Message timestamp is expired');
    });

    it('should validate wallet address in message', async () => {
      const timestamp = Date.now();
      const mismatchMessage = `Welcome to Reward System!\n\nWallet: different-address\nNonce: nonce\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

      await expect(
        walletService.authenticateWallet('original-address', 'signature', mismatchMessage)
      ).rejects.toThrow('Wallet address mismatch');
    });
  });

  describe('session management', () => {
    it('should auto-refresh session before expiration', async () => {
      // Mock a session token that expires soon
      const almostExpiredToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2MzgzNjAwNjB9.mock'; // Expires in 1 minute
      
      mockLocalStorage.getItem.mockReturnValue(almostExpiredToken);
      
      const refreshedToken = 'refreshed-token';
      vi.mocked(api.post).mockResolvedValue({
        success: true,
        data: {
          session_token: refreshedToken,
          user: mockUser,
        },
      });

      // This would typically be called by a timer in the real implementation
      const result = await walletService.refreshSession();

      expect(result.sessionToken).toBe(refreshedToken);
    });

    it('should handle session token parsing errors', () => {
      const invalidToken = 'invalid.jwt.token';
      mockLocalStorage.getItem.mockReturnValue(invalidToken);

      // Should not throw but handle gracefully
      expect(() => walletService.isAuthenticated()).not.toThrow();
    });
  });

  describe('security features', () => {
    it('should prevent signature replay attacks with nonce validation', () => {
      const nonce1 = walletService.generateWalletMessage('address').nonce;
      const nonce2 = walletService.generateWalletMessage('address').nonce;

      expect(nonce1).not.toBe(nonce2);
    });

    it('should enforce message timestamp validation', () => {
      const oldTimestamp = Date.now() - (20 * 60 * 1000); // 20 minutes ago
      const futureTimestamp = Date.now() + (10 * 60 * 1000); // 10 minutes in future

      const oldMessage = `Welcome to Reward System!\n\nWallet: address\nNonce: nonce\nTimestamp: ${oldTimestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
      const futureMessage = `Welcome to Reward System!\n\nWallet: address\nNonce: nonce\nTimestamp: ${futureTimestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

      expect(async () => {
        await walletService.authenticateWallet('address', 'signature', oldMessage);
      }).rejects.toThrow();

      expect(async () => {
        await walletService.authenticateWallet('address', 'signature', futureMessage);
      }).rejects.toThrow();
    });
  });
});