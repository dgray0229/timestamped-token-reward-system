/**
 * Formatting Utilities - Shared formatting functions
 * 
 * These utilities provide consistent formatting for dates,
 * numbers, currencies, and other display values.
 */

import { fromTokenUnits, TOKEN_CONFIG } from '../constants/solana';

/** Date formatting options */
export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy, h:mm a',
  TIME_ONLY: 'h:mm a',
  ISO: 'yyyy-MM-dd',
  RELATIVE: 'relative',
} as const;

/** Number formatting options */
export const NUMBER_FORMATS = {
  DECIMAL: 'decimal',
  CURRENCY: 'currency',
  PERCENT: 'percent',
  COMPACT: 'compact',
} as const;

/**
 * Format a date using the specified format
 */
export const formatDate = (
  date: Date | string | number,
  format: keyof typeof DATE_FORMATS = 'SHORT',
  locale: string = 'en-US'
): string => {
  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  switch (format) {
    case 'SHORT':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    
    case 'LONG':
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    
    case 'TIME_ONLY':
      return dateObj.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
      });
    
    case 'ISO':
      return dateObj.toISOString().split('T')[0]!;
    
    case 'RELATIVE':
      return formatRelativeTime(dateObj);
    
    default:
      return dateObj.toLocaleDateString(locale);
  }
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export const formatRelativeTime = (date: Date | string | number, locale: string = 'en-US'): string => {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2628000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ] as const;
  
  for (const interval of intervals) {
    const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
    if (count >= 1) {
      return rtf.format(diffInSeconds < 0 ? count : -count, interval.label);
    }
  }
  
  return rtf.format(0, 'second');
};

/**
 * Format token amounts with proper decimals
 */
export const formatTokenAmount = (
  amount: string | number,
  options: {
    showSymbol?: boolean;
    symbol?: string;
    decimals?: number;
    compact?: boolean;
  } = {}
): string => {
  const {
    showSymbol = true,
    symbol = 'TOK',
    decimals = 4,
    compact = false,
  } = options;
  
  const numAmount = typeof amount === 'string' ? fromTokenUnits(amount) : amount;
  
  if (isNaN(numAmount)) {
    return '0';
  }
  
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard',
  });
  
  const formatted = formatter.format(numAmount);
  return showSymbol ? `${formatted} ${symbol}` : formatted;
};

/**
 * Format currency amounts
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format percentage values
 */
export const formatPercentage = (
  value: number,
  decimals: number = 2,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format large numbers with compact notation
 */
export const formatCompactNumber = (
  value: number,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

/**
 * Format transaction signature for display (truncated with ellipsis)
 */
export const formatTransactionSignature = (
  signature: string,
  options: { startChars?: number; endChars?: number } = {}
): string => {
  const { startChars = 8, endChars = 8 } = options;
  
  if (signature.length <= startChars + endChars) {
    return signature;
  }
  
  return `${signature.slice(0, startChars)}...${signature.slice(-endChars)}`;
};

/**
 * Format wallet address for display (truncated with ellipsis)
 */
export const formatWalletAddress = (
  address: string,
  options: { startChars?: number; endChars?: number } = {}
): string => {
  const { startChars = 6, endChars = 4 } = options;
  
  if (address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format duration in human-readable format
 */
export const formatDuration = (
  milliseconds: number,
  options: { units?: ('days' | 'hours' | 'minutes' | 'seconds')[]; short?: boolean } = {}
): string => {
  const { units = ['days', 'hours', 'minutes'], short = false } = options;
  
  const durations = {
    days: Math.floor(milliseconds / (1000 * 60 * 60 * 24)),
    hours: Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((milliseconds % (1000 * 60)) / 1000),
  };
  
  const parts: string[] = [];
  
  for (const unit of units) {
    const value = durations[unit];
    if (value > 0) {
      const label = short ? unit.charAt(0) : value === 1 ? unit.slice(0, -1) : unit;
      parts.push(`${value}${short ? '' : ' '}${label}`);
    }
  }
  
  return parts.length > 0 ? parts.join(short ? '' : ', ') : '0' + (short ? 'm' : ' minutes');
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};