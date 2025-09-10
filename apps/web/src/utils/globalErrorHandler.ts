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

export function setupGlobalErrorHandler() {
  if (isErrorHandlerSetup) return;

  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
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
  window.addEventListener('unhandledrejection', (event) => {
    const errorData: GlobalErrorData = {
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
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
        if (message.includes('Warning:') || 
            message.includes('React') ||
            message.includes('componentStack')) {
          // Skip React development warnings
          return;
        }
      }
    };
  }

  isErrorHandlerSetup = true;
  console.log('✅ Global error handler initialized');
}

function logErrorToService(type: string, errorData: GlobalErrorData) {
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
    stack: error.stack,
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
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) { // Tasks longer than 50ms
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
      
      if (usage > 0.9) { // 90% memory usage
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