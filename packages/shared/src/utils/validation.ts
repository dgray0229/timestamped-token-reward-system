/**
 * Validation Utilities - Shared validation functions
 * 
 * These utilities provide validation functions that can be
 * used across frontend and backend for consistent validation.
 */

import { USER_VALIDATION, TRANSACTION_VALIDATION, VALIDATION_HELPERS } from '../constants/validation';
import type { CreateUserRequest, UpdateUserRequest } from '../types/User';
import type { CreateTransactionRequest, ConfirmTransactionRequest } from '../types/RewardTransaction';

/** Validation result type */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/** Field validation result */
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate username
 */
export const validateUsername = (username: string): FieldValidationResult => {
  if (!username) {
    return {
      isValid: false,
      error: USER_VALIDATION.USERNAME.ERROR_MESSAGES.REQUIRED,
    };
  }
  
  if (username.length < USER_VALIDATION.USERNAME.MIN_LENGTH) {
    return {
      isValid: false,
      error: USER_VALIDATION.USERNAME.ERROR_MESSAGES.MIN_LENGTH,
    };
  }
  
  if (username.length > USER_VALIDATION.USERNAME.MAX_LENGTH) {
    return {
      isValid: false,
      error: USER_VALIDATION.USERNAME.ERROR_MESSAGES.MAX_LENGTH,
    };
  }
  
  if (!USER_VALIDATION.USERNAME.PATTERN.test(username)) {
    return {
      isValid: false,
      error: USER_VALIDATION.USERNAME.ERROR_MESSAGES.PATTERN,
    };
  }
  
  return { isValid: true };
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): FieldValidationResult => {
  if (!email) {
    return { isValid: true }; // Email is optional
  }
  
  if (email.length > USER_VALIDATION.EMAIL.MAX_LENGTH) {
    return {
      isValid: false,
      error: USER_VALIDATION.EMAIL.ERROR_MESSAGES.MAX_LENGTH,
    };
  }
  
  if (!USER_VALIDATION.EMAIL.PATTERN.test(email)) {
    return {
      isValid: false,
      error: USER_VALIDATION.EMAIL.ERROR_MESSAGES.INVALID,
    };
  }
  
  return { isValid: true };
};

/**
 * Validate wallet address
 */
export const validateWalletAddress = (address: string): FieldValidationResult => {
  if (!address) {
    return {
      isValid: false,
      error: USER_VALIDATION.WALLET_ADDRESS.ERROR_MESSAGES.REQUIRED,
    };
  }
  
  if (!VALIDATION_HELPERS.isValidWalletAddress(address)) {
    return {
      isValid: false,
      error: USER_VALIDATION.WALLET_ADDRESS.ERROR_MESSAGES.INVALID,
    };
  }
  
  return { isValid: true };
};

/**
 * Validate transaction signature
 */
export const validateTransactionSignature = (signature: string): FieldValidationResult => {
  if (!signature) {
    return {
      isValid: false,
      error: TRANSACTION_VALIDATION.SIGNATURE.ERROR_MESSAGES.REQUIRED,
    };
  }
  
  if (!VALIDATION_HELPERS.isValidSignature(signature)) {
    return {
      isValid: false,
      error: TRANSACTION_VALIDATION.SIGNATURE.ERROR_MESSAGES.INVALID,
    };
  }
  
  return { isValid: true };
};

/**
 * Validate reward amount
 */
export const validateRewardAmount = (amount: string | number): FieldValidationResult => {
  if (!amount && amount !== 0) {
    return {
      isValid: false,
      error: TRANSACTION_VALIDATION.REWARD_AMOUNT.ERROR_MESSAGES.REQUIRED,
    };
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount < 0) {
    return {
      isValid: false,
      error: TRANSACTION_VALIDATION.REWARD_AMOUNT.ERROR_MESSAGES.INVALID,
    };
  }
  
  if (numAmount < TRANSACTION_VALIDATION.REWARD_AMOUNT.MIN) {
    return {
      isValid: false,
      error: TRANSACTION_VALIDATION.REWARD_AMOUNT.ERROR_MESSAGES.MIN,
    };
  }
  
  if (numAmount > TRANSACTION_VALIDATION.REWARD_AMOUNT.MAX) {
    return {
      isValid: false,
      error: TRANSACTION_VALIDATION.REWARD_AMOUNT.ERROR_MESSAGES.MAX,
    };
  }
  
  return { isValid: true };
};

/**
 * Validate user creation request
 */
export const validateCreateUser = (data: CreateUserRequest): ValidationResult => {
  const errors: string[] = [];
  
  const usernameResult = validateUsername(data.username);
  if (!usernameResult.isValid) {
    errors.push(usernameResult.error!);
  }
  
  const walletResult = validateWalletAddress(data.wallet_address);
  if (!walletResult.isValid) {
    errors.push(walletResult.error!);
  }
  
  if (data.email) {
    const emailResult = validateEmail(data.email);
    if (!emailResult.isValid) {
      errors.push(emailResult.error!);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate user update request
 */
export const validateUpdateUser = (data: UpdateUserRequest): ValidationResult => {
  const errors: string[] = [];
  
  if (data.username !== undefined) {
    const usernameResult = validateUsername(data.username);
    if (!usernameResult.isValid) {
      errors.push(usernameResult.error!);
    }
  }
  
  if (data.email !== undefined) {
    const emailResult = validateEmail(data.email);
    if (!emailResult.isValid) {
      errors.push(emailResult.error!);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate transaction creation request
 */
export const validateCreateTransaction = (data: CreateTransactionRequest): ValidationResult => {
  const errors: string[] = [];
  
  if (!data.user_id || !TRANSACTION_VALIDATION.TRANSACTION_ID.PATTERN.test(data.user_id)) {
    errors.push('Invalid user ID format');
  }
  
  const amountResult = validateRewardAmount(data.expected_amount);
  if (!amountResult.isValid) {
    errors.push(amountResult.error!);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate transaction confirmation request
 */
export const validateConfirmTransaction = (data: ConfirmTransactionRequest): ValidationResult => {
  const errors: string[] = [];
  
  if (!data.transaction_id || !TRANSACTION_VALIDATION.TRANSACTION_ID.PATTERN.test(data.transaction_id)) {
    errors.push(TRANSACTION_VALIDATION.TRANSACTION_ID.ERROR_MESSAGES.INVALID);
  }
  
  const signatureResult = validateTransactionSignature(data.signature);
  if (!signatureResult.isValid) {
    errors.push(signatureResult.error!);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize and validate pagination parameters
 */
export const validatePagination = (page?: number, limit?: number) => {
  const sanitized = VALIDATION_HELPERS.sanitizePagination(page, limit);
  return {
    isValid: true,
    data: sanitized,
  };
};

/**
 * Validate URL parameters
 */
export const validateUrlParams = (params: Record<string, string | undefined>): ValidationResult => {
  const errors: string[] = [];
  
  // Add specific URL parameter validations as needed
  if (params.id && !TRANSACTION_VALIDATION.TRANSACTION_ID.PATTERN.test(params.id)) {
    errors.push('Invalid ID parameter format');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generic object validation helper
 */
export const validateRequired = (obj: Record<string, any>, requiredFields: string[]): ValidationResult => {
  const errors: string[] = [];
  
  for (const field of requiredFields) {
    if (!obj[field] && obj[field] !== 0 && obj[field] !== false) {
      errors.push(`${field} is required`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};