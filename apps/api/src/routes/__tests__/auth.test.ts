import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import authRouter from '../auth.js';
import { mockSupabaseClient, createMockRequest, createTestUser } from '../../test/setup.js';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/auth', authRouter);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/wallet/connect', () => {
    const validConnectRequest = {
      wallet_address: 'test-wallet-address',
      signature: 'test-signature',
      message: 'Welcome to Reward System!\n\nWallet: test-wallet-address\nNonce: test-nonce\nTimestamp: 1701234567000\n\nThis request will not trigger a blockchain transaction or cost any gas fees.',
    };

    it('should successfully authenticate a valid wallet connection', async () => {
      const testUser = createTestUser();
      
      // Mock Supabase responses
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // User not found
      });

      mockSupabaseClient.from().insert().select().single.mockResolvedValueOnce({
        data: testUser,
        error: null,
      });

      mockSupabaseClient.from().insert.mockResolvedValueOnce({
        data: { id: 'session-id' },
        error: null,
      });

      const response = await request(app)
        .post('/auth/wallet/connect')
        .send(validConnectRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session_token).toBeDefined();
      expect(response.body.data.user).toEqual(expect.objectContaining({
        wallet_address: testUser.wallet_address,
      }));
    });

    it('should handle existing user login', async () => {
      const testUser = createTestUser();
      
      // Mock existing user found
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: testUser,
        error: null,
      });

      // Mock user update
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: { ...testUser, last_login: new Date().toISOString() },
        error: null,
      });

      // Mock session creation
      mockSupabaseClient.from().insert.mockResolvedValueOnce({
        data: { id: 'session-id' },
        error: null,
      });

      const response = await request(app)
        .post('/auth/wallet/connect')
        .send(validConnectRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
    });

    it('should reject invalid wallet address', async () => {
      const invalidRequest = {
        ...validConnectRequest,
        wallet_address: 'invalid-address',
      };

      const response = await request(app)
        .post('/auth/wallet/connect')
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_WALLET_ADDRESS');
    });

    it('should reject expired message timestamp', async () => {
      const expiredRequest = {
        ...validConnectRequest,
        message: 'Welcome to Reward System!\n\nWallet: test-wallet-address\nNonce: test-nonce\nTimestamp: 1000000000000\n\nThis request will not trigger a blockchain transaction or cost any gas fees.',
      };

      const response = await request(app)
        .post('/auth/wallet/connect')
        .send(expiredRequest)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_TIMESTAMP');
    });

    it('should reject wallet address mismatch', async () => {
      const mismatchRequest = {
        ...validConnectRequest,
        message: 'Welcome to Reward System!\n\nWallet: different-address\nNonce: test-nonce\nTimestamp: 1701234567000\n\nThis request will not trigger a blockchain transaction or cost any gas fees.',
      };

      const response = await request(app)
        .post('/auth/wallet/connect')
        .send(mismatchRequest)
        .expect(400);

      expect(response.body.error.code).toBe('WALLET_ADDRESS_MISMATCH');
    });

    it('should reject invalid message format', async () => {
      const invalidMessageRequest = {
        ...validConnectRequest,
        message: 'Invalid message format',
      };

      const response = await request(app)
        .post('/auth/wallet/connect')
        .send(invalidMessageRequest)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_MESSAGE_FORMAT');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' },
      });

      const response = await request(app)
        .post('/auth/wallet/connect')
        .send(validConnectRequest)
        .expect(500);

      expect(response.body.error.code).toBe('DATABASE_ERROR');
    });

    it('should handle user creation failure', async () => {
      // Mock user not found
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock user creation failure
      mockSupabaseClient.from().insert().select().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Creation failed' },
      });

      const response = await request(app)
        .post('/auth/wallet/connect')
        .send(validConnectRequest)
        .expect(500);

      expect(response.body.error.code).toBe('USER_CREATION_FAILED');
    });
  });

  describe('POST /auth/disconnect', () => {
    it('should successfully disconnect authenticated user', async () => {
      // Mock session deactivation
      mockSupabaseClient.from().update().eq.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const response = await request(app)
        .post('/auth/disconnect')
        .set('Authorization', 'Bearer test-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Successfully disconnected');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/auth/disconnect')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should handle database errors during disconnect', async () => {
      // Mock database error
      mockSupabaseClient.from().update().eq.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' },
      });

      const response = await request(app)
        .post('/auth/disconnect')
        .set('Authorization', 'Bearer test-token')
        .expect(500);

      expect(response.body.error.code).toBe('DISCONNECT_FAILED');
    });
  });

  describe('GET /auth/nonce', () => {
    it('should generate nonce for valid wallet address', async () => {
      const response = await request(app)
        .get('/auth/nonce')
        .query({ wallet_address: 'test-wallet-address' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBeDefined();
      expect(response.body.data.nonce).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should reject missing wallet address', async () => {
      const response = await request(app)
        .get('/auth/nonce')
        .expect(400);

      expect(response.body.error.code).toBe('MISSING_WALLET_ADDRESS');
    });

    it('should reject invalid wallet address', async () => {
      const response = await request(app)
        .get('/auth/nonce')
        .query({ wallet_address: 'invalid' })
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_WALLET_ADDRESS');
    });
  });

  describe('GET /auth/verify', () => {
    it('should verify valid session', async () => {
      const testUser = createTestUser();

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });

    it('should reject invalid session', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should require authentication header', async () => {
      const response = await request(app)
        .get('/auth/verify')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh valid session', async () => {
      const testUser = createTestUser();

      // Mock session update
      mockSupabaseClient.from().update().eq().eq.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session_token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
    });

    it('should handle refresh failure', async () => {
      // Mock session update failure
      mockSupabaseClient.from().update().eq().eq.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Update failed' },
      });

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.error.code).toBe('REFRESH_FAILED');
    });
  });
});