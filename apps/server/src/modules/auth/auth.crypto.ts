import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes } from 'node:crypto';

const ARGON2_OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await verify(hash, password);
  } catch {
    return false;
  }
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
