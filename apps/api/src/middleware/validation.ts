import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import logger from '../config/logger.js';

export function validateRequest(schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate URL parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      logger.warn('Request validation failed', {
        errors,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        params: req.params,
      });

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string,
        },
      });
      return;
    }

    next();
  };
}

// Common validation schemas
export const schemas = {
  walletConnect: Joi.object({
    wallet_address: Joi.string().required().min(32).max(44),
    signature: Joi.string().required(),
    message: Joi.string().required(),
  }),

  claimReward: Joi.object({
    expected_amount: Joi.string().required().pattern(/^\d+(\.\d+)?$/),
  }),

  confirmTransaction: Joi.object({
    transaction_id: Joi.string().uuid().required(),
    signature: Joi.string().required().min(64).max(128),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  transactionHistory: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'confirmed', 'failed').optional(),
  }),

  rewardHistory: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    status: Joi.string().valid('pending', 'confirmed', 'failed').optional(),
  }),

  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
  }),

  reportIssue: Joi.object({
    transaction_id: Joi.string().uuid().optional(),
    description: Joi.string().min(10).max(1000).required(),
    type: Joi.string().valid(
      'claim_failed',
      'incorrect_amount',
      'missing_reward',
      'stuck',
      'failed',
      'incorrect_amount',
      'missing',
      'other'
    ).required(),
    expected_outcome: Joi.string().max(500).optional(),
  }),

  rewardPreferences: Joi.object({
    auto_claim_enabled: Joi.boolean().optional(),
    min_claim_amount: Joi.string().pattern(/^\d+(\.\d+)?$/).optional(),
    email_notifications: Joi.boolean().optional(),
  }),
};