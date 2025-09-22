/**
 * Global Error Handler
 *
 * This utility sets up global error handlers for unhandled errors and promise rejections.
 * It provides a safety net for errors that aren't caught by components or error boundaries.
 */

interface GlobalErrorData {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  timestamp: string;
  userAgent: string;
  url: string;
  userId?: string;
}

let isErrorHandlerSetup = false;

/**
 * Determine if an error should be ignored (extension/third-party errors)
 */
function shouldIgnoreError(
  message: string,
  filename?: string,
  error?: Error,
): boolean {
  const ignoredPatterns = [
    // Browser extension errors
    /chrome-extension:\/\//,
    /moz-extension:\/\//,
    /safari-extension:\/\//,
    /extension\//,

    // Common extension error messages
    /Cannot redefine property: webdriver/,
    /Failed to construct 'URL': Invalid URL/,
    /cornhusk/,
    /shared-service/,
    /content-script/,
    /A listener indicated an asynchronous response/,
    /Cannot read properties of undefined \(reading 'isCheckout'\)/,
    /Receiving end does not exist/,

    // YouTube ad blocker specific
    /YT Ad Blocker/,
    /youtube-ad-blocker/,
    /youtube-ad-skipper/,

    // Wallet extension errors
    /Wallet error/,
    /webdriver/,

    // Sentry rate limiting (we handle this separately)
    /sentry\.io.*429/,

    // React DevTools suggestions (not errors)
    /Download the React DevTools/,

    // Host validation errors from extensions
    /Host validation failed/,
    /Host is not supported/,
    /Host is not in insights whitelist/,

    // Generic extension communication errors
    /message channel closed/,
    /runtime\.lastError/,
  ];

  const errorString = `${message} ${filename} ${error?.message || ''}`;

  return ignoredPatterns.some(pattern => pattern.test(errorString));
}

export function setupGlobalErrorHandler() {
  if (isErrorHandlerSetup) return;

  // Handle unhandled JavaScript errors
  window.addEventListener('error', event => {
    // Filter out extension and third-party errors
    if (shouldIgnoreError(event.message, event.filename, event.error)) {
      return;
    }

    const errorData: GlobalErrorData = {
      message: event.message,
      stack: event.error?.stack,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Unhandled error:', errorData);

    if (import.meta.env.PROD) {
      logErrorToService('UNHANDLED_ERROR', errorData);
    }
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason;
    const message =
      reason?.message || reason?.toString() || 'Unhandled promise rejection';

    // Filter out extension and third-party promise rejections
    if (shouldIgnoreError(message, '', reason)) {
      event.preventDefault();
      return;
    }

    const errorData: GlobalErrorData = {
      message,
      stack: reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Unhandled promise rejection:', errorData);

    if (import.meta.env.PROD) {
      logErrorToService('UNHANDLED_REJECTION', errorData);
    }

    // Prevent the default browser behavior (which would log to console)
    event.preventDefault();
  });

  // Handle console errors in development
  if (import.meta.env.DEV) {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      // Call original console.error
      originalConsoleError.apply(console, args);

      // Check if this is a React error or development warning
      const message = args[0];
      if (typeof message === 'string') {
        if (
          message.includes('Warning:') ||
          message.includes('React') ||
          message.includes('componentStack')
        ) {
          // Skip React development warnings
          return;
        }
      }
    };
  }

  isErrorHandlerSetup = true;
  console.log('✅ Global error handler initialized');
}

// Rate limiting for error reporting
let errorReportCount = 0;
let errorReportWindow = Date.now();
const MAX_ERRORS_PER_MINUTE = 10;

function logErrorToService(type: string, errorData: GlobalErrorData) {
  // Rate limiting to prevent spam to error service
  const now = Date.now();
  if (now - errorReportWindow > 60000) {
    // Reset window every minute
    errorReportCount = 0;
    errorReportWindow = now;
  }

  if (errorReportCount >= MAX_ERRORS_PER_MINUTE) {
    return; // Skip reporting if rate limit exceeded
  }

  errorReportCount++;

  // In a real application, send to error tracking service
  // Example services: Sentry, LogRocket, Bugsnag, etc.

  try {
    // Example: Send to your own error logging endpoint
    fetch('/api/errors/client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        ...errorData,
      }),
    }).catch(() => {
      // Silently fail if error logging fails
      console.warn('Failed to send error to logging service');
    });
  } catch (e) {
    // Prevent infinite error loops
    console.warn('Error in error logging:', e);
  }
}

export function reportManualError(error: Error, context?: string) {
  const errorData: GlobalErrorData = {
    message: error.message,
    ...(error.stack && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  console.error('Manual error report:', error, context);

  if (import.meta.env.PROD) {
    logErrorToService('MANUAL_REPORT', {
      ...errorData,
      message: context ? `${context}: ${error.message}` : error.message,
    });
  }
}

// Performance monitoring
export function setupPerformanceMonitoring() {
  if (!('performance' in window) || !import.meta.env.PROD) return;

  // Monitor long tasks
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            console.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      console.warn('Performance monitoring not supported');
    }
  }

  // Monitor memory usage (Chrome only)
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;

      if (usage > 0.9) {
        // 90% memory usage
        console.warn('High memory usage detected:', {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          percentage: Math.round(usage * 100),
        });
      }
    }, 30000); // Check every 30 seconds
  }
}

// Network status monitoring
export function setupNetworkMonitoring() {
  if (!('navigator' in window) || !('onLine' in navigator)) return;

  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine;
    console.log('Network status:', isOnline ? 'online' : 'offline');

    if (!isOnline) {
      // Dispatch a custom event for offline handling
      window.dispatchEvent(new CustomEvent('network:offline'));
    } else {
      window.dispatchEvent(new CustomEvent('network:online'));
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Initial check
  updateOnlineStatus();
}
