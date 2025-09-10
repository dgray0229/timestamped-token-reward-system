import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SOLANA_NETWORK = 'devnet';
process.env.SOLANA_RPC_URL = 'https://api.devnet.solana.com';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    then: jest.fn(),
    catch: jest.fn(),
  })),
  auth: {
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn(),
    })),
  },
};

// Mock Supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock Solana Web3.js
jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getVersion: jest.fn().mockResolvedValue({ 'solana-core': '1.14.0' }),
    getBalance: jest.fn().mockResolvedValue(1000000000),
    getTransaction: jest.fn().mockResolvedValue(null),
    confirmTransaction: jest.fn().mockResolvedValue({}),
    sendRawTransaction: jest.fn().mockResolvedValue('test-signature'),
    getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: 'test-blockhash' }),
  })),
  PublicKey: jest.fn().mockImplementation((key: string) => ({
    toString: () => key,
    toBase58: () => key,
    toBuffer: () => Buffer.from(key),
  })),
  clusterApiUrl: jest.fn(() => 'https://api.devnet.solana.com'),
}));

// Mock tweetnacl for signature verification
jest.mock('tweetnacl', () => ({
  sign: {
    detached: {
      verify: jest.fn().mockReturnValue(true),
    },
  },
}));

// Mock bs58 for signature decoding
jest.mock('bs58', () => ({
  decode: jest.fn().mockReturnValue(new Uint8Array(64)),
  encode: jest.fn().mockReturnValue('encoded-string'),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id' }),
}));

// Silence console logs during tests unless explicitly needed
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Test database helpers
export const createTestUser = () => ({
  id: 'test-user-id',
  wallet_address: 'test-wallet-address',
  username: 'testuser',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_login: new Date().toISOString(),
  is_active: true,
  metadata: {},
});

export const createTestTransaction = () => ({
  id: 'test-transaction-id',
  user_id: 'test-user-id',
  amount: '10.50',
  transaction_signature: 'test-signature',
  status: 'confirmed',
  timestamp_earned: new Date().toISOString(),
  timestamp_claimed: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  metadata: {},
});

export const createTestSession = () => ({
  id: 'test-session-id',
  user_id: 'test-user-id',
  session_token: 'test-session-token',
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  created_at: new Date().toISOString(),
  last_accessed: new Date().toISOString(),
  ip_address: '127.0.0.1',
  user_agent: 'test-agent',
  is_active: true,
});

// Mock request/response helpers
export const createMockRequest = (overrides = {}) => ({
  body: {},
  query: {},
  params: {},
  headers: {
    'x-request-id': 'test-request-id',
    authorization: 'Bearer test-token',
  },
  ip: '127.0.0.1',
  user: createTestUser(),
  userId: 'test-user-id',
  ...overrides,
});

export const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };
  return res;
};

export const createMockNext = () => jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Global test setup
beforeAll(async () => {
  // Any global setup needed
});

// Global test teardown
afterAll(async () => {
  // Any global cleanup needed
});

export { mockSupabaseClient };