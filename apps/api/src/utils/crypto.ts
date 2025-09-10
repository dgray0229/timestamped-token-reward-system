import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

const SALT_ROUNDS = 12;

export function generateNonce(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateSessionToken(userId: string): string {
  return jwt.sign(
    { userId },
    config.jwt.secret,
    { 
      expiresIn: config.jwt.expiresIn,
      issuer: 'reward-system-api',
      audience: 'reward-system-frontend',
    }
  );
}

export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

export function generateApiKey(): string {
  return `rsk_${crypto.randomBytes(32).toString('hex')}`;
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export function generateSecureId(): string {
  return crypto.randomUUID();
}

export function generateSignatureMessage(
  walletAddress: string,
  nonce: string,
  timestamp: number
): string {
  return `Welcome to Reward System!\n\nWallet: ${walletAddress}\nNonce: ${nonce}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
}

export function isValidTimestamp(timestamp: number, maxAgeMs: number = 300000): boolean {
  const now = Date.now();
  const age = now - timestamp;
  return age >= 0 && age <= maxAgeMs; // 5 minutes default
}

export function createHmacSignature(
  data: string,
  secret: string = config.jwt.secret
): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export function verifyHmacSignature(
  data: string,
  signature: string,
  secret: string = config.jwt.secret
): boolean {
  const expected = createHmacSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  );
}