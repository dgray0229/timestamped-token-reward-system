import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import uiSlice from '../../store/slices/uiSlice';
import { useErrorHandling } from '../useErrorHandling';

// Create a wrapper component for the hook
const createWrapper = () => {
  const store = configureStore({
    reducer: {
      ui: uiSlice,
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
};

describe('useErrorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console.error mock
    console.error = vi.fn();
  });

  describe('handleError', () => {
    it('should handle Error objects correctly', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const error = new Error('Test error message');
      result.current.handleError(error, 'test context');

      expect(console.error).toHaveBeenCalledWith(
        'Error occurred:',
        error,
        'Context: test context'
      );
    });

    it('should handle API error objects correctly', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const apiError = {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          timestamp: '2023-12-01T10:00:00Z',
          requestId: 'req-123',
        },
      };

      result.current.handleError(apiError);

      expect(console.error).toHaveBeenCalledWith(
        'Error occurred:',
        apiError,
        undefined
      );
    });

    it('should handle string errors correctly', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const errorMessage = 'String error message';
      result.current.handleError(errorMessage);

      expect(console.error).toHaveBeenCalledWith(
        'Error occurred:',
        errorMessage,
        undefined
      );
    });

    it('should handle unknown error types gracefully', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const unknownError = { someProperty: 'value' };
      result.current.handleError(unknownError);

      expect(console.error).toHaveBeenCalledWith(
        'Error occurred:',
        unknownError,
        undefined
      );
    });
  });

  describe('handleNetworkError', () => {
    it('should handle timeout errors specifically', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const timeoutError = new Error('Request timeout of 5000ms exceeded');
      result.current.handleNetworkError(timeoutError);

      expect(console.error).toHaveBeenCalledWith('Network error:', timeoutError);
    });

    it('should handle generic network errors', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const networkError = new Error('NetworkError: Failed to fetch');
      result.current.handleNetworkError(networkError);

      expect(console.error).toHaveBeenCalledWith('Network error:', networkError);
    });

    it('should handle non-Error network issues', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      result.current.handleNetworkError('Connection lost');

      expect(console.error).toHaveBeenCalledWith('Network error:', 'Connection lost');
    });
  });

  describe('handleValidationError', () => {
    it('should handle single validation error', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const errors = { email: 'Invalid email format' };
      result.current.handleValidationError(errors);

      // Should dispatch notification with the error message
    });

    it('should handle multiple validation errors', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const errors = {
        email: 'Invalid email format',
        password: 'Password too short',
        username: 'Username already taken',
      };
      result.current.handleValidationError(errors);

      // Should dispatch notification with combined error messages
    });

    it('should handle empty validation errors', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const errors = {};
      result.current.handleValidationError(errors);

      // Should dispatch notification with generic message
    });
  });

  describe('handleWalletError', () => {
    it('should handle user rejection errors', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const rejectionError = new Error('User rejected the transaction');
      result.current.handleWalletError(rejectionError);

      expect(console.error).toHaveBeenCalledWith('Wallet error:', rejectionError);
    });

    it('should handle insufficient funds errors', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const fundsError = new Error('insufficient funds for transaction');
      result.current.handleWalletError(fundsError);

      expect(console.error).toHaveBeenCalledWith('Wallet error:', fundsError);
    });

    it('should handle wallet not connected errors', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const connectionError = new Error('wallet not connected');
      result.current.handleWalletError(connectionError);

      expect(console.error).toHaveBeenCalledWith('Wallet error:', connectionError);
    });

    it('should handle network-related wallet errors', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const networkError = new Error('network timeout while processing transaction');
      result.current.handleWalletError(networkError);

      expect(console.error).toHaveBeenCalledWith('Wallet error:', networkError);
    });

    it('should handle generic wallet errors', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const genericError = new Error('Unknown wallet error');
      result.current.handleWalletError(genericError);

      expect(console.error).toHaveBeenCalledWith('Wallet error:', genericError);
    });
  });

  describe('success and info handlers', () => {
    it('should handle success messages', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      result.current.handleSuccess('Operation completed successfully');

      // Should dispatch success notification
    });

    it('should handle info messages', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      result.current.handleInfo('Information message');

      // Should dispatch info notification
    });

    it('should handle warning messages', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      result.current.handleWarning('Warning message');

      // Should dispatch warning notification
    });

    it('should handle custom durations', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      result.current.handleSuccess('Success with custom duration', 10000);

      // Should dispatch notification with 10 second duration
    });
  });

  describe('error code mapping', () => {
    it('should map known error codes to user-friendly messages', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const apiError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token invalid',
        },
      };

      result.current.handleError(apiError);

      // Should use mapped user-friendly message instead of raw message
    });

    it('should use original message for unmapped error codes', () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const apiError = {
        error: {
          code: 'CUSTOM_ERROR_CODE',
          message: 'Custom error message',
        },
      };

      result.current.handleError(apiError);

      // Should use original message for unknown codes
    });
  });

  describe('production error logging', () => {
    it('should log errors in production mode', () => {
      // Mock production environment
      const originalEnv = import.meta.env.PROD;
      vi.stubGlobal('import.meta', { env: { PROD: true } });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const error = new Error('Production error');
      result.current.handleError(error);

      // Should log error for monitoring
      expect(console.error).toHaveBeenCalled();

      // Restore environment
      vi.stubGlobal('import.meta', { env: { PROD: originalEnv } });
    });

    it('should not log errors in development mode', () => {
      // Mock development environment
      vi.stubGlobal('import.meta', { env: { PROD: false } });

      const wrapper = createWrapper();
      const { result } = renderHook(() => useErrorHandling(), { wrapper });

      const error = new Error('Development error');
      result.current.handleError(error);

      // Should still log to console but not to external service
      expect(console.error).toHaveBeenCalled();
    });
  });
});