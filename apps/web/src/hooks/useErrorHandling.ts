import { useCallback } from 'react';
import { useAppDispatch } from '../store';
import { addNotification } from '../store/slices/uiSlice';

export interface ErrorDetails {
  code?: string;
  message: string;
  timestamp?: string;
  requestId?: string;
  status?: number;
}

export interface ApiError {
  error: ErrorDetails;
}

export function useErrorHandling() {
  const dispatch = useAppDispatch();

  const handleError = useCallback((error: unknown, context?: string) => {
    console.error('Error occurred:', error, context ? `Context: ${context}` : '');

    let errorMessage = 'An unexpected error occurred';
    let errorCode = 'UNKNOWN_ERROR';

    // Handle different error types
    if (error instanceof Error) {
      errorMessage = error.message;
      errorCode = error.name;
    } else if (typeof error === 'object' && error !== null) {
      // Handle API errors
      const apiError = error as ApiError;
      if (apiError.error) {
        errorMessage = apiError.error.message || errorMessage;
        errorCode = apiError.error.code || errorCode;
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    // Map error codes to user-friendly messages
    const userFriendlyMessage = getUserFriendlyMessage(errorCode, errorMessage);

    // Show notification to user
    dispatch(addNotification({
      type: 'error',
      title: 'Error',
      message: userFriendlyMessage,
      duration: 5000,
    }));

    // Log error for monitoring in production
    if (import.meta.env.PROD) {
      logErrorToService({
        code: errorCode,
        message: errorMessage,
        originalError: error,
        context: context || '',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  }, [dispatch]);

  const handleNetworkError = useCallback((error: unknown) => {
    console.error('Network error:', error);

    let message = 'Network connection failed. Please check your internet connection.';

    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        message = 'Request timed out. The server might be busy, please try again.';
      } else if (error.message.includes('NetworkError')) {
        message = 'Network error. Please check your internet connection.';
      }
    }

    dispatch(addNotification({
      type: 'error',
      title: 'Connection Error',
      message,
      duration: 5000,
    }));
  }, [dispatch]);

  const handleValidationError = useCallback((errors: Record<string, string>) => {
    const errorMessages = Object.values(errors);
    const message = errorMessages.length > 1
      ? `Please fix the following errors: ${errorMessages.join(', ')}`
      : errorMessages[0] || 'Please check your input and try again.';

    dispatch(addNotification({
      type: 'error',
      title: 'Validation Error',
      message,
      duration: 4000,
    }));
  }, [dispatch]);

  const handleWalletError = useCallback((error: unknown) => {
    console.error('Wallet error:', error);

    let message = 'Wallet operation failed. Please try again.';

    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        message = 'Transaction was cancelled by user.';
      } else if (error.message.includes('insufficient funds')) {
        message = 'Insufficient funds for this transaction.';
      } else if (error.message.includes('not connected')) {
        message = 'Please connect your wallet first.';
      } else if (error.message.includes('network')) {
        message = 'Network error. Please check your wallet\'s network settings.';
      }
    }

    dispatch(addNotification({
      type: 'error',
      title: 'Wallet Error',
      message,
      duration: 5000,
    }));
  }, [dispatch]);

  const handleSuccess = useCallback((message: string, duration = 3000) => {
    dispatch(addNotification({
      type: 'success',
      title: 'Success',
      message,
      duration,
    }));
  }, [dispatch]);

  const handleInfo = useCallback((message: string, duration = 3000) => {
    dispatch(addNotification({
      type: 'info',
      title: 'Info',
      message,
      duration,
    }));
  }, [dispatch]);

  const handleWarning = useCallback((message: string, duration = 4000) => {
    dispatch(addNotification({
      type: 'warning',
      title: 'Warning',
      message,
      duration,
    }));
  }, [dispatch]);

  return {
    handleError,
    handleNetworkError,
    handleValidationError,
    handleWalletError,
    handleSuccess,
    handleInfo,
    handleWarning,
  };
}

function getUserFriendlyMessage(code: string, originalMessage: string): string {
  const errorMap: Record<string, string> = {
    // Network errors
    'NETWORK_ERROR': 'Connection failed. Please check your internet connection.',
    'TIMEOUT_ERROR': 'Request timed out. Please try again.',
    'CONNECTION_REFUSED': 'Cannot connect to server. Please try again later.',
    
    // Authentication errors
    'UNAUTHORIZED': 'Please connect your wallet to continue.',
    'INVALID_TOKEN': 'Your session has expired. Please reconnect your wallet.',
    'WALLET_ADDRESS_MISMATCH': 'Wallet address does not match. Please reconnect.',
    'INVALID_SIGNATURE': 'Invalid wallet signature. Please try again.',
    
    // Validation errors
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'INVALID_AMOUNT': 'Please enter a valid amount.',
    'AMOUNT_MISMATCH': 'Amount mismatch. Please refresh and try again.',
    
    // Reward system errors
    'CLAIM_TOO_SOON': 'You cannot claim rewards yet. Please wait for the next claim period.',
    'NO_REWARDS_AVAILABLE': 'No rewards available to claim at this time.',
    'INSUFFICIENT_BALANCE': 'Insufficient balance for this operation.',
    
    // Server errors
    'INTERNAL_ERROR': 'Server error. Please try again later.',
    'SERVICE_UNAVAILABLE': 'Service temporarily unavailable. Please try again later.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment and try again.',
    
    // Database errors
    'DATABASE_ERROR': 'Data access error. Please try again later.',
    'TRANSACTION_NOT_FOUND': 'Transaction not found or has expired.',
    'USER_NOT_FOUND': 'User account not found. Please reconnect your wallet.',
    
    // Blockchain errors
    'TRANSACTION_FAILED': 'Blockchain transaction failed. Please try again.',
    'INSUFFICIENT_GAS': 'Insufficient gas for transaction. Please add more SOL to your wallet.',
    'BLOCK_HASH_NOT_FOUND': 'Blockchain error. Please try again.',
  };

  return errorMap[code] || originalMessage || 'An unexpected error occurred. Please try again.';
}

function logErrorToService(errorData: {
  code: string;
  message: string;
  originalError: unknown;
  context?: string;
  timestamp: string;
  userAgent: string;
  url: string;
}) {
  // In a real application, you would send this to an error tracking service
  // like Sentry, LogRocket, Bugsnag, etc.
  console.error('Production error logged:', errorData);
  
  // Example: Send to error tracking service
  // try {
  //   fetch('/api/errors', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(errorData)
  //   });
  // } catch (e) {
  //   console.error('Failed to log error to service:', e);
  // }
}