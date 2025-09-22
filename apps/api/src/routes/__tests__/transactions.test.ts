import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import transactionsRouter from '../transactions.js';
import { mockSupabaseClient, createMockRequest, createTestUser, createTestTransaction } from '../../test/setup.js';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/transactions', transactionsRouter);

describe('Transactions Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /transactions', () => {
    it('should return paginated transaction history for authenticated user', async () => {
      const testUser = createTestUser();
      const mockTransactions = [
        createTestTransaction(),
        { ...createTestTransaction(), id: 'tx-2', reward_amount: '7.75' },
      ];

      mockSupabaseClient.from().select().eq().order().range.mockResolvedValueOnce({
        data: mockTransactions,
        error: null,
        count: 15,
      });

      const response = await request(app)
        .get('/transactions')
        .query({ page: 1, limit: 10 })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.total).toBe(15);
      expect(response.body.data.pagination.pages).toBe(2);
    });

    it('should handle empty transaction history', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockResolvedValueOnce({
        data: [],
        error: null,
        count: 0,
      });

      const response = await request(app)
        .get('/transactions')
        .query({ page: 1, limit: 10 })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(0);
      expect(response.body.data.pagination.total).toBe(0);
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/transactions')
        .query({ page: 0, limit: 101 }) // Invalid page and limit
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_PAGINATION');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/transactions')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should filter transactions by status', async () => {
      const confirmedTransactions = [
        { ...createTestTransaction(), status: 'confirmed' },
      ];

      mockSupabaseClient.from().select().eq().eq().order().range.mockResolvedValueOnce({
        data: confirmedTransactions,
        error: null,
        count: 1,
      });

      const response = await request(app)
        .get('/transactions')
        .query({ page: 1, limit: 10, status: 'confirmed' })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions[0].status).toBe('confirmed');
    });

    it('should filter transactions by date range', async () => {
      const dateFilteredTransactions = [createTestTransaction()];

      mockSupabaseClient.from().select().eq().gte().lte().order().range.mockResolvedValueOnce({
        data: dateFilteredTransactions,
        error: null,
        count: 1,
      });

      const response = await request(app)
        .get('/transactions')
        .query({
          page: 1,
          limit: 10,
          start_date: '2023-12-01',
          end_date: '2023-12-31',
        })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toHaveLength(1);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select().eq().order().range.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' },
      });

      const response = await request(app)
        .get('/transactions')
        .query({ page: 1, limit: 10 })
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('GET /transactions/:id', () => {
    it('should return specific transaction details', async () => {
      const testTransaction = createTestTransaction();

      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: testTransaction,
        error: null,
      });

      const response = await request(app)
        .get(`/transactions/${testTransaction.id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.id).toBe(testTransaction.id);
      expect(response.body.data.transaction.reward_amount).toBe(testTransaction.reward_amount);
    });

    it('should return 404 for non-existent transaction', async () => {
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // No data found
      });

      const response = await request(app)
        .get('/transactions/non-existent-id')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.error.code).toBe('TRANSACTION_NOT_FOUND');
    });

    it('should prevent access to other users transactions', async () => {
      const otherUserTransaction = {
        ...createTestTransaction(),
        user_id: 'other-user-id',
      };

      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: otherUserTransaction,
        error: null,
      });

      const response = await request(app)
        .get(`/transactions/${otherUserTransaction.id}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.error.code).toBe('TRANSACTION_NOT_FOUND');
    });

    it('should validate transaction ID format', async () => {
      const response = await request(app)
        .get('/transactions/invalid-uuid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TRANSACTION_ID');
    });
  });

  describe('GET /transactions/stats', () => {
    it('should return transaction statistics for authenticated user', async () => {
      const mockStats = {
        total_transactions: 25,
        total_reward_amount: '157.50',
        confirmed_transactions: 23,
        pending_transactions: 2,
        failed_transactions: 0,
        average_reward_amount: '6.30',
        last_transaction_date: new Date().toISOString(),
      };

      // Mock aggregate query for statistics
      mockSupabaseClient.from().select().eq.mockResolvedValueOnce({
        data: [mockStats],
        error: null,
      });

      const response = await request(app)
        .get('/transactions/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_transactions).toBe(25);
      expect(response.body.data.total_amount).toBe('157.50');
      expect(response.body.data.confirmed_transactions).toBe(23);
      expect(response.body.data.success_rate).toBeDefined();
    });

    it('should handle users with no transactions', async () => {
      mockSupabaseClient.from().select().eq.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/transactions/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_transactions).toBe(0);
      expect(response.body.data.total_amount).toBe('0.00');
      expect(response.body.data.success_rate).toBe(0);
    });

    it('should calculate success rate correctly', async () => {
      const mockStats = {
        total_transactions: 20,
        confirmed_transactions: 18,
        failed_transactions: 2,
      };

      mockSupabaseClient.from().select().eq.mockResolvedValueOnce({
        data: [mockStats],
        error: null,
      });

      const response = await request(app)
        .get('/transactions/stats')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.success_rate).toBe(90); // 18/20 * 100
    });
  });

  describe('GET /transactions/export', () => {
    it('should export transactions as CSV', async () => {
      const mockTransactions = [
        createTestTransaction(),
        { ...createTestTransaction(), id: 'tx-2', reward_amount: '7.75' },
      ];

      mockSupabaseClient.from().select().eq().order.mockResolvedValueOnce({
        data: mockTransactions,
        error: null,
      });

      const response = await request(app)
        .get('/transactions/export')
        .query({ format: 'csv' })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.text).toContain('Transaction ID,Amount,Status');
    });

    it('should export transactions as JSON', async () => {
      const mockTransactions = [
        createTestTransaction(),
        { ...createTestTransaction(), id: 'tx-2', reward_amount: '7.75' },
      ];

      mockSupabaseClient.from().select().eq().order.mockResolvedValueOnce({
        data: mockTransactions,
        error: null,
      });

      const response = await request(app)
        .get('/transactions/export')
        .query({ format: 'json' })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.body.transactions).toHaveLength(2);
      expect(response.body.exported_at).toBeDefined();
    });

    it('should validate export format', async () => {
      const response = await request(app)
        .get('/transactions/export')
        .query({ format: 'invalid' })
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_FORMAT');
    });

    it('should apply date filters to export', async () => {
      const filteredTransactions = [createTestTransaction()];

      mockSupabaseClient.from().select().eq().gte().lte().order.mockResolvedValueOnce({
        data: filteredTransactions,
        error: null,
      });

      const response = await request(app)
        .get('/transactions/export')
        .query({
          format: 'json',
          start_date: '2023-12-01',
          end_date: '2023-12-31',
        })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.filters).toEqual({
        start_date: '2023-12-01',
        end_date: '2023-12-31',
      });
    });

    it('should handle empty export data', async () => {
      mockSupabaseClient.from().select().eq().order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/transactions/export')
        .query({ format: 'csv' })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.text).toContain('Transaction ID,Amount,Status');
      expect(response.text.split('\n')).toHaveLength(2); // Header + empty line
    });
  });

  describe('POST /transactions/retry', () => {
    it('should retry failed transaction', async () => {
      const failedTransaction = {
        ...createTestTransaction(),
        status: 'failed',
        transaction_signature: null,
      };

      // Mock finding failed transaction
      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: failedTransaction,
        error: null,
      });

      // Mock successful retry
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: {
          ...failedTransaction,
          status: 'confirmed',
          transaction_signature: 'new-signature',
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      const response = await request(app)
        .post('/transactions/retry')
        .send({ transaction_id: failedTransaction.id })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.transaction.status).toBe('confirmed');
      expect(response.body.data.transaction.transaction_signature).toBe('new-signature');
    });

    it('should reject retry for non-failed transactions', async () => {
      const confirmedTransaction = {
        ...createTestTransaction(),
        status: 'confirmed',
      };

      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: confirmedTransaction,
        error: null,
      });

      const response = await request(app)
        .post('/transactions/retry')
        .send({ transaction_id: confirmedTransaction.id })
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.error.code).toBe('TRANSACTION_NOT_RETRYABLE');
    });

    it('should handle retry failures', async () => {
      const failedTransaction = {
        ...createTestTransaction(),
        status: 'failed',
      };

      mockSupabaseClient.from().select().eq().eq().single.mockResolvedValueOnce({
        data: failedTransaction,
        error: null,
      });

      // Mock retry failure
      mockSupabaseClient.from().update().eq().select().single.mockRejectedValueOnce(
        new Error('Retry failed')
      );

      const response = await request(app)
        .post('/transactions/retry')
        .send({ transaction_id: failedTransaction.id })
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.error.code).toBe('RETRY_FAILED');
    });
  });
});