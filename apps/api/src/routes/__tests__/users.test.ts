import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import usersRouter from '../users.js';
import { mockSupabaseClient, createMockRequest, createTestUser } from '../../test/setup.js';

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/users', usersRouter);

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /users/profile', () => {
    it('should return authenticated user profile', async () => {
      const testUser = createTestUser();

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: testUser,
        error: null,
      });

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.user.wallet_address).toBe(testUser.wallet_address);
      expect(response.body.data.user.username).toBe(testUser.username);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/users/profile')
        .expect(401);

      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should handle user not found', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // No data found
      });

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Database error' },
      });

      const response = await request(app)
        .get('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.error.code).toBe('DATABASE_ERROR');
    });
  });

  describe('PUT /users/profile', () => {
    const validUpdateRequest = {
      username: 'newusername',
      email: 'newemail@example.com',
      metadata: {
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      },
    };

    it('should successfully update user profile', async () => {
      const testUser = createTestUser();
      const updatedUser = {
        ...testUser,
        ...validUpdateRequest,
        updated_at: new Date().toISOString(),
      };

      // Mock username availability check
      mockSupabaseClient.from().select().eq().neq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Username not taken
      });

      // Mock email availability check
      mockSupabaseClient.from().select().eq().neq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Email not taken
      });

      // Mock update operation
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: updatedUser,
        error: null,
      });

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(validUpdateRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(validUpdateRequest.username);
      expect(response.body.data.user.email).toBe(validUpdateRequest.email);
    });

    it('should validate username format', async () => {
      const invalidUsernameRequest = {
        username: 'invalid username!', // Contains spaces and special chars
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidUsernameRequest)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_USERNAME');
    });

    it('should validate email format', async () => {
      const invalidEmailRequest = {
        email: 'invalid-email-format',
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidEmailRequest)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_EMAIL');
    });

    it('should reject taken username', async () => {
      // Mock username already taken
      mockSupabaseClient.from().select().eq().neq().single.mockResolvedValueOnce({
        data: { id: 'other-user-id', username: 'takenusername' },
        error: null,
      });

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ username: 'takenusername' })
        .expect(409);

      expect(response.body.error.code).toBe('USERNAME_TAKEN');
    });

    it('should reject taken email', async () => {
      // Mock username check passes
      mockSupabaseClient.from().select().eq().neq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock email already taken
      mockSupabaseClient.from().select().eq().neq().single.mockResolvedValueOnce({
        data: { id: 'other-user-id', email: 'taken@example.com' },
        error: null,
      });

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ 
          username: 'newusername',
          email: 'taken@example.com' 
        })
        .expect(409);

      expect(response.body.error.code).toBe('EMAIL_TAKEN');
    });

    it('should handle partial updates', async () => {
      const partialUpdateRequest = {
        username: 'newusername',
      };

      const testUser = createTestUser();
      const updatedUser = {
        ...testUser,
        username: partialUpdateRequest.username,
        updated_at: new Date().toISOString(),
      };

      // Mock username availability check
      mockSupabaseClient.from().select().eq().neq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      // Mock update operation
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: updatedUser,
        error: null,
      });

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(partialUpdateRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(partialUpdateRequest.username);
    });

    it('should validate metadata structure', async () => {
      const invalidMetadataRequest = {
        metadata: 'invalid-metadata-string', // Should be object
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidMetadataRequest)
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_METADATA');
    });

    it('should enforce username length limits', async () => {
      const longUsernameRequest = {
        username: 'a'.repeat(51), // Too long
      };

      const response = await request(app)
        .put('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send(longUsernameRequest)
        .expect(400);

      expect(response.body.error.code).toBe('USERNAME_TOO_LONG');
    });
  });

  describe('DELETE /users/profile', () => {
    it('should successfully deactivate user account', async () => {
      const testUser = createTestUser();

      // Mock user deactivation
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: {
          ...testUser,
          is_active: false,
          deactivated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        error: null,
      });

      // Mock session cleanup
      mockSupabaseClient.from().update().eq.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const response = await request(app)
        .delete('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ confirm_deletion: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Account deactivated successfully');
    });

    it('should require deletion confirmation', async () => {
      const response = await request(app)
        .delete('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({}) // Missing confirm_deletion
        .expect(400);

      expect(response.body.error.code).toBe('DELETION_NOT_CONFIRMED');
    });

    it('should reject false confirmation', async () => {
      const response = await request(app)
        .delete('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ confirm_deletion: false })
        .expect(400);

      expect(response.body.error.code).toBe('DELETION_NOT_CONFIRMED');
    });

    it('should handle deactivation errors', async () => {
      // Mock deactivation failure
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Deactivation failed' },
      });

      const response = await request(app)
        .delete('/users/profile')
        .set('Authorization', 'Bearer valid-token')
        .send({ confirm_deletion: true })
        .expect(500);

      expect(response.body.error.code).toBe('DEACTIVATION_FAILED');
    });
  });

  describe('GET /users/sessions', () => {
    it('should return active sessions for authenticated user', async () => {
      const testUser = createTestUser();
      const mockSessions = [
        {
          id: 'session-1',
          user_id: testUser.id,
          created_at: new Date().toISOString(),
          last_accessed: new Date().toISOString(),
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0...',
          is_active: true,
        },
        {
          id: 'session-2',
          user_id: testUser.id,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          last_accessed: new Date(Date.now() - 3600000).toISOString(),
          ip_address: '192.168.1.100',
          user_agent: 'Chrome/91.0...',
          is_active: true,
        },
      ];

      mockSupabaseClient.from().select().eq().eq().order.mockResolvedValueOnce({
        data: mockSessions,
        error: null,
      });

      const response = await request(app)
        .get('/users/sessions')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toHaveLength(2);
      expect(response.body.data.sessions[0].ip_address).toBe('127.0.0.1');
    });

    it('should handle users with no active sessions', async () => {
      mockSupabaseClient.from().select().eq().eq().order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const response = await request(app)
        .get('/users/sessions')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toHaveLength(0);
    });
  });

  describe('DELETE /users/sessions/:sessionId', () => {
    it('should revoke specific session', async () => {
      const sessionId = 'session-to-revoke';

      // Mock session revocation
      mockSupabaseClient.from().update().eq().eq().eq.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const response = await request(app)
        .delete(`/users/sessions/${sessionId}`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Session revoked successfully');
    });

    it('should validate session ID format', async () => {
      const response = await request(app)
        .delete('/users/sessions/invalid-uuid')
        .set('Authorization', 'Bearer valid-token')
        .expect(400);

      expect(response.body.error.code).toBe('INVALID_SESSION_ID');
    });

    it('should handle non-existent sessions', async () => {
      // Mock session not found
      mockSupabaseClient.from().update().eq().eq().eq.mockResolvedValueOnce({
        data: {},
        error: { code: 'PGRST116' },
      });

      const response = await request(app)
        .delete('/users/sessions/non-existent-session')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });
  });

  describe('POST /users/sessions/revoke-all', () => {
    it('should revoke all sessions except current', async () => {
      const testUser = createTestUser();

      // Mock revoking all other sessions
      mockSupabaseClient.from().update().eq().neq().eq.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const response = await request(app)
        .post('/users/sessions/revoke-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('All other sessions revoked successfully');
    });

    it('should handle revocation errors', async () => {
      // Mock revocation failure
      mockSupabaseClient.from().update().eq().neq().eq.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST500', message: 'Revocation failed' },
      });

      const response = await request(app)
        .post('/users/sessions/revoke-all')
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.error.code).toBe('REVOCATION_FAILED');
    });
  });
});