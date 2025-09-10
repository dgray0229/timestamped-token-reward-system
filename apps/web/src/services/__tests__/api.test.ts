import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { api, setAuthToken, clearAuthToken } from '../api';
import { ApiError } from '../api';

describe('API Service', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    // Clear any existing auth tokens
    clearAuthToken();
  });

  afterEach(() => {
    mockAxios.restore();
  });

  describe('axios instance configuration', () => {
    it('should have correct base URL', () => {
      expect(api.defaults.baseURL).toBe(import.meta.env.VITE_API_URL || 'http://localhost:3001/api');
    });

    it('should have correct default headers', () => {
      expect(api.defaults.headers.common['Content-Type']).toBe('application/json');
    });

    it('should have request timeout configured', () => {
      expect(api.defaults.timeout).toBe(10000);
    });
  });

  describe('authentication token management', () => {
    it('should set authorization header when token is provided', () => {
      const token = 'test-jwt-token';
      setAuthToken(token);
      
      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${token}`);
    });

    it('should clear authorization header when token is cleared', () => {
      setAuthToken('test-token');
      clearAuthToken();
      
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should handle null token gracefully', () => {
      setAuthToken(null);
      
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('should handle empty string token gracefully', () => {
      setAuthToken('');
      
      expect(api.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });

  describe('request interceptor', () => {
    it('should add request ID to headers', async () => {
      mockAxios.onGet('/test').reply(200, { success: true });

      await api.get('/test');

      const request = mockAxios.history.get[0];
      expect(request.headers['x-request-id']).toBeDefined();
      expect(request.headers['x-request-id']).toMatch(/^[a-f0-9-]{36}$/); // UUID format
    });

    it('should preserve existing request ID if provided', async () => {
      const existingRequestId = 'existing-request-id';
      mockAxios.onGet('/test').reply(200, { success: true });

      await api.get('/test', {
        headers: {
          'x-request-id': existingRequestId,
        },
      });

      const request = mockAxios.history.get[0];
      expect(request.headers['x-request-id']).toBe(existingRequestId);
    });

    it('should add timestamp to requests', async () => {
      mockAxios.onGet('/test').reply(200, { success: true });

      const beforeRequest = Date.now();
      await api.get('/test');
      const afterRequest = Date.now();

      const request = mockAxios.history.get[0];
      const timestamp = parseInt(request.headers['x-timestamp']);
      
      expect(timestamp).toBeGreaterThanOrEqual(beforeRequest);
      expect(timestamp).toBeLessThanOrEqual(afterRequest);
    });
  });

  describe('response interceptor', () => {
    it('should return response data directly for successful requests', async () => {
      const responseData = { success: true, data: { message: 'test' } };
      mockAxios.onGet('/test').reply(200, responseData);

      const result = await api.get('/test');
      expect(result).toEqual(responseData);
    });

    it('should handle successful responses with different status codes', async () => {
      const responseData = { success: true, data: { created: true } };
      mockAxios.onPost('/test').reply(201, responseData);

      const result = await api.post('/test', {});
      expect(result).toEqual(responseData);
    });
  });

  describe('error handling', () => {
    it('should throw ApiError for 400 Bad Request', async () => {
      const errorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: { field: 'email' },
        },
      };
      mockAxios.onGet('/test').reply(400, errorResponse);

      await expect(api.get('/test')).rejects.toThrow(ApiError);
      
      try {
        await api.get('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.message).toBe('Invalid input data');
        expect(error.details).toEqual({ field: 'email' });
        expect(error.status).toBe(400);
      }
    });

    it('should throw ApiError for 401 Unauthorized', async () => {
      const errorResponse = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid authentication token',
        },
      };
      mockAxios.onGet('/protected').reply(401, errorResponse);

      await expect(api.get('/protected')).rejects.toThrow(ApiError);
      
      try {
        await api.get('/protected');
      } catch (error) {
        expect(error.code).toBe('UNAUTHORIZED');
        expect(error.status).toBe(401);
      }
    });

    it('should throw ApiError for 403 Forbidden', async () => {
      const errorResponse = {
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      };
      mockAxios.onGet('/admin').reply(403, errorResponse);

      await expect(api.get('/admin')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError for 404 Not Found', async () => {
      const errorResponse = {
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      };
      mockAxios.onGet('/nonexistent').reply(404, errorResponse);

      await expect(api.get('/nonexistent')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError for 500 Internal Server Error', async () => {
      const errorResponse = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      };
      mockAxios.onGet('/error').reply(500, errorResponse);

      await expect(api.get('/error')).rejects.toThrow(ApiError);
    });

    it('should handle network errors', async () => {
      mockAxios.onGet('/test').networkError();

      await expect(api.get('/test')).rejects.toThrow(ApiError);
      
      try {
        await api.get('/test');
      } catch (error) {
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.message).toBe('Network Error');
      }
    });

    it('should handle timeout errors', async () => {
      mockAxios.onGet('/test').timeout();

      await expect(api.get('/test')).rejects.toThrow(ApiError);
      
      try {
        await api.get('/test');
      } catch (error) {
        expect(error.code).toBe('TIMEOUT_ERROR');
        expect(error.message).toBe('timeout of 10000ms exceeded');
      }
    });

    it('should handle errors without response data', async () => {
      mockAxios.onGet('/test').reply(500);

      await expect(api.get('/test')).rejects.toThrow(ApiError);
      
      try {
        await api.get('/test');
      } catch (error) {
        expect(error.code).toBe('UNKNOWN_ERROR');
        expect(error.message).toBe('An unknown error occurred');
        expect(error.status).toBe(500);
      }
    });

    it('should handle malformed error responses', async () => {
      mockAxios.onGet('/test').reply(400, 'Invalid JSON');

      await expect(api.get('/test')).rejects.toThrow(ApiError);
      
      try {
        await api.get('/test');
      } catch (error) {
        expect(error.code).toBe('PARSE_ERROR');
        expect(error.status).toBe(400);
      }
    });
  });

  describe('retry logic', () => {
    it('should retry failed requests up to 3 times', async () => {
      mockAxios
        .onGet('/test')
        .replyOnce(500)
        .onGet('/test')
        .replyOnce(500)
        .onGet('/test')
        .reply(200, { success: true });

      const result = await api.get('/test');
      
      expect(result).toEqual({ success: true });
      expect(mockAxios.history.get).toHaveLength(3);
    });

    it('should not retry non-retryable errors (4xx)', async () => {
      mockAxios.onGet('/test').reply(400, {
        error: { code: 'BAD_REQUEST', message: 'Invalid request' },
      });

      await expect(api.get('/test')).rejects.toThrow(ApiError);
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('should apply exponential backoff between retries', async () => {
      vi.useFakeTimers();
      
      mockAxios
        .onGet('/test')
        .replyOnce(500)
        .onGet('/test')
        .replyOnce(500)
        .onGet('/test')
        .reply(200, { success: true });

      const requestPromise = api.get('/test');
      
      // Fast-forward through retry delays
      vi.advanceTimersByTime(1000); // First retry delay
      vi.advanceTimersByTime(2000); // Second retry delay
      
      const result = await requestPromise;
      expect(result).toEqual({ success: true });
      
      vi.useRealTimers();
    });

    it('should give up after maximum retries', async () => {
      mockAxios.onGet('/test').reply(500, {
        error: { code: 'SERVER_ERROR', message: 'Server error' },
      });

      await expect(api.get('/test')).rejects.toThrow(ApiError);
      expect(mockAxios.history.get).toHaveLength(4); // Original + 3 retries
    });
  });

  describe('request cancellation', () => {
    it('should support request cancellation', async () => {
      const controller = new AbortController();
      
      mockAxios.onGet('/test').reply(() => {
        // Simulate slow response
        return new Promise((resolve) => {
          setTimeout(() => resolve([200, { success: true }]), 1000);
        });
      });

      const requestPromise = api.get('/test', {
        signal: controller.signal,
      });

      // Cancel the request
      controller.abort();

      await expect(requestPromise).rejects.toThrow('canceled');
    });
  });

  describe('request deduplication', () => {
    it('should deduplicate identical concurrent requests', async () => {
      mockAxios.onGet('/test').reply(200, { success: true });

      // Make multiple identical requests concurrently
      const requests = [
        api.get('/test'),
        api.get('/test'),
        api.get('/test'),
      ];

      const results = await Promise.all(requests);
      
      // All should return the same result
      results.forEach(result => {
        expect(result).toEqual({ success: true });
      });

      // But only one actual request should have been made
      expect(mockAxios.history.get).toHaveLength(1);
    });

    it('should not deduplicate requests with different parameters', async () => {
      mockAxios.onGet('/test').reply(200, { success: true });

      await Promise.all([
        api.get('/test', { params: { page: 1 } }),
        api.get('/test', { params: { page: 2 } }),
      ]);

      expect(mockAxios.history.get).toHaveLength(2);
    });
  });

  describe('response caching', () => {
    it('should cache GET responses for a short period', async () => {
      mockAxios.onGet('/cached').reply(200, { data: 'cached-data' });

      // Make the same request twice quickly
      const result1 = await api.get('/cached');
      const result2 = await api.get('/cached');

      expect(result1).toEqual(result2);
      expect(mockAxios.history.get).toHaveLength(1); // Only one actual request
    });

    it('should not cache non-GET requests', async () => {
      mockAxios.onPost('/test').reply(200, { success: true });

      await api.post('/test', {});
      await api.post('/test', {});

      expect(mockAxios.history.post).toHaveLength(2);
    });

    it('should not cache responses with cache-control: no-cache', async () => {
      mockAxios.onGet('/no-cache').reply(200, { data: 'fresh-data' }, {
        'cache-control': 'no-cache',
      });

      await api.get('/no-cache');
      await api.get('/no-cache');

      expect(mockAxios.history.get).toHaveLength(2);
    });
  });
});