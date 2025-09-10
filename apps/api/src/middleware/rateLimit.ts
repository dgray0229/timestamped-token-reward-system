import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../config/index.js';
import logger from '../config/logger.js';

// General API rate limiter
const generalLimiter = new RateLimiterMemory({
  keyPrefix: 'general',
  points: config.api.rateLimit.max,
  duration: config.api.rateLimit.windowMs / 1000, // seconds
});

// Strict rate limiter for authentication endpoints
const authLimiter = new RateLimiterMemory({
  keyPrefix: 'auth',
  points: 10, // 10 attempts
  duration: 900, // 15 minutes
  blockDuration: 900, // Block for 15 minutes
});

// Very strict rate limiter for reward claiming
const claimLimiter = new RateLimiterMemory({
  keyPrefix: 'claim',
  points: 5, // 5 attempts
  duration: 3600, // 1 hour
  blockDuration: 3600, // Block for 1 hour
});

function createRateLimitMiddleware(limiter: RateLimiterMemory, name: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    
    try {
      await limiter.consume(key);
      next();
    } catch (rateLimiterRes) {
      const requestId = req.headers['x-request-id'] as string || 'unknown';
      
      logger.warn(`Rate limit exceeded: ${name}`, {
        ip: key,
        path: req.path,
        method: req.method,
        requestId,
        rateLimiterRes,
      });

      const remainingPoints = rateLimiterRes?.remainingPoints || 0;
      const msBeforeNext = rateLimiterRes?.msBeforeNext || 0;

      res.set({
        'X-RateLimit-Limit': config.api.rateLimit.max.toString(),
        'X-RateLimit-Remaining': Math.max(0, remainingPoints).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
        'Retry-After': Math.round(msBeforeNext / 1000).toString(),
      });

      res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
          timestamp: new Date().toISOString(),
          requestId,
          retryAfter: Math.round(msBeforeNext / 1000),
        },
      });
    }
  };
}

export const generalRateLimit = createRateLimitMiddleware(generalLimiter, 'general');
export const authRateLimit = createRateLimitMiddleware(authLimiter, 'auth');
export const claimRateLimit = createRateLimitMiddleware(claimLimiter, 'claim');