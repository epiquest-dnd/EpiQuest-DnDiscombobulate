import type { RequestHandler } from 'express';
import type { AuthService } from './auth.service.ts';

export const SESSION_COOKIE = 'session';

export function requireAuth(_authService: AuthService): RequestHandler {
  return () => {
    throw new Error('Not implemented');
  };
}
