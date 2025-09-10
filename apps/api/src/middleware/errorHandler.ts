import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger.js';
import type { ApiError } from '@reward-system/shared';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export function createError(
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR'
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  // Log error details
  logger.error('API Error', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      requestId,
    },
  });

  // Determine status code
  const statusCode = error.statusCode || 500;
  
  // Determine error code
  let errorCode = error.code || 'INTERNAL_ERROR';
  
  // Handle specific error types
  if (error.name === 'ValidationError') {
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    errorCode = 'UNAUTHORIZED';
  } else if (error.name === 'JsonWebTokenError') {
    errorCode = 'INVALID_TOKEN';
  }

  // Create standardized error response
  const errorResponse: ApiError = {
    error: {
      code: errorCode,
      message: error.isOperational ? error.message : 'An internal server error occurred',
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'development' && error.stack) {
    (errorResponse.error as any).stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response): void {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  logger.warn('Route not found', {
    method: req.method,
    url: req.url,
    requestId,
  });

  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}

export function asyncHandler<T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: T, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}