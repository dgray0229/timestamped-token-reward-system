import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import rewardsRouter from '../rewards.js';
import { mockSupabaseClient, createMockRequest, createTestUser } from '../../test/setup.js';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/rewards', rewardsRouter);

describe('Rewards Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /rewards/available', () => {
    it('should return available rewards for authenticated user', async () => {
      const testUser = createTestUser();
      
      // Mock available rewards calculation
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: {
          user_id: testUser.id,
          last_claim_time: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
          total_earned: '25.50',
          total_claimed: '15.00',
        },
        error: null,
      });

      const response = await request(app)
        .get('/rewards/available')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available_amount).toBeDefined();
      expect(response.body.data.hours_since_last_claim).toBeDefined();
      expect(response.body.data.next_claim_time).toBeDefined();
    });

    it('should handle user without previous claims', async () => {
      // Mock no previous claims
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // No data found
      });

      const response = await request(app)
        .get('/rewards/available')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.available_amount).toBeDefined();
      expect(response.body.data.is_first_claim).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/rewards/available')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' },
      });

      const response = await request(app)
        .get('/rewards/available')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('POST /rewards/claim', () => {
    const validClaimRequest = {
      amount: '5.25',
      wallet_address: 'test-wallet-address',
    };

    it('should successfully claim available rewards', async () => {
      const testUser = createTestUser();

      // Mock available rewards check
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: {
          user_id: testUser.id,
          last_claim_time: new Date(Date.now() - 7200000).toISOString(),
          total_earned: '25.50',
          total_claimed: '15.00',
        },
        error: null,
      });

      // Mock transaction creation
      mockSupabaseClient.from().insert().select().single.mockResolvedValueOnce({
        data: {
          id: 'transaction-id',
          user_id: testUser.id,
          amount: validClaimRequest.amount,
          transaction_signature: 'solana-signature',
          status: 'confirmed',
          timestamp_earned: new Date().toISOString(),
          timestamp_claimed: new Date().toISOString(),
        },
        error: null,
      });

      // Mock user stats update
      mockSupabaseClient.from().update().eq().mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const response = await request(app)
        .post('/rewards/claim')
        .set('Authorization', 'Bearer valid-token')
        .send(validClaimRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction).toBeDefined();
      expect(response.body.data.new_balance).toBeDefined();
      expect(response.body.data.transaction_signature).toBeDefined();
    });

    it('should reject claim when insufficient rewards available', async () => {
      // Mock insufficient rewards
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: {
          user_id: 'test-user-id',
          last_claim_time: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          total_earned: '25.50',
          total_claimed: '25.00',
        },
        error: null,
      });

      const response = await request(app)
        .post('/rewards/claim')
        .set('Authorization', 'Bearer valid-token')
        .send({ ...validClaimRequest, amount: '10.00' })
        .expect(400);

      expect(response.body.error.code).toBe('INSUFFICIENT_REWARDS');
    });

    it('should validate claim amount format', async () => {
      const invalidAmountRequest = {
        ...validClaimRequest,
        amount: 'invalid-amount',
      };

      const response = await request(app)
        .post('/rewards/claim')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidAmountRequest)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle Solana transaction failures', async () => {
      // Mock available rewards check
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: {
          user_id: 'test-user-id',
          last_claim_time: new Date(Date.now() - 7200000).toISOString(),
          total_earned: '25.50',
          total_claimed: '15.00',
        },
        error: null,
      });

      // Mock Solana transaction failure
      mockSupabaseClient.from().insert().select().single.mockRejectedValueOnce(
        new Error('Solana transaction failed')
      );

      const response = await request(app)
        .post('/rewards/claim')
        .set('Authorization', 'Bearer valid-token')
        .send(validClaimRequest)
        .expect(500);

      expect(response.body.error.code).toBe('CLAIM_FAILED');
    });

    it('should enforce minimum claim amount', async () => {
      const smallAmountRequest = {
        ...validClaimRequest,
        amount: '0.001', // Below minimum
      };

      const response = await request(app)
        .post('/rewards/claim')
        .set('Authorization', 'Bearer valid-token')
        .send(smallAmountRequest)
        .expect(400);

      expect(response.body.error.code).toBe('AMOUNT_TOO_SMALL');
    });

    it('should enforce maximum claim amount', async () => {
      const largeAmountRequest = {
        ...validClaimRequest,
        amount: '10000.00', // Above maximum
      };

      const response = await request(app)
        .post('/rewards/claim')
        .set('Authorization', 'Bearer valid-token')
        .send(largeAmountRequest)
        .expect(400);

      expect(response.body.error.code).toBe('AMOUNT_TOO_LARGE');
    });
  });

  describe('GET /rewards/stats', () => {
    it('should return user reward statistics', async () => {
      const testUser = createTestUser();

      // Mock user stats
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: {
          user_id: testUser.id,
          total_earned: '125.75',
          total_claimed: '100.50',
          claim_count: 15,
          last_claim_time: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      // Mock recent transactions
      mockSupabaseClient.from().select().eq().order().limit.mockResolvedValueOnce({
        data: [
          {
            id: 'tx-1',
            amount: '5.25',
            timestamp_claimed: new Date().toISOString(),
            status: 'confirmed',
          },
          {
            id: 'tx-2',
            amount: '3.50',
            timestamp_claimed: new Date(Date.now() - 86400000).toISOString(),
            status: 'confirmed',
          },
        ],
        error: null,
      });

      const response = await request(app)
        .get('/rewards/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_earned).toBe('125.75');
      expect(response.body.data.total_claimed).toBe('100.50');
      expect(response.body.data.available_balance).toBe('25.25');
      expect(response.body.data.claim_count).toBe(15);
      expect(response.body.data.recent_claims).toHaveLength(2);
    });

    it('should handle users with no statistics', async () => {
      // Mock no stats found
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabaseClient.from().select().eq().order().limit.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/rewards/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_earned).toBe('0.00');
      expect(response.body.data.total_claimed).toBe('0.00');
      expect(response.body.data.claim_count).toBe(0);
    });
  });

  describe('GET /rewards/history', () => {
    it('should return paginated reward history', async () => {
      const mockTransactions = [
        {
          id: 'tx-1',
          amount: '5.25',
          transaction_signature: 'sig-1',
          status: 'confirmed',
          timestamp_earned: new Date().toISOString(),
          timestamp_claimed: new Date().toISOString(),
        },
        {
          id: 'tx-2',
          amount: '3.50',
          transaction_signature: 'sig-2',
          status: 'confirmed',
          timestamp_earned: new Date(Date.now() - 86400000).toISOString(),
          timestamp_claimed: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      mockSupabaseClient.from().select().eq().order().range.mockResolvedValueOnce({
        data: mockTransactions,
        error: null,
        count: 25,
      });

      const response = await request(app)
        .get('/rewards/history')
        .query({ page: 1, limit: 10 })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.total).toBe(25);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/rewards/history')
        .query({ page: 0, limit: -1 }) // Invalid pagination
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PAGINATION');
    });

    it('should handle empty history', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      const response = await request(app)
        .get('/rewards/history')
        .query({ page: 1, limit: 10 })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });
  });
});