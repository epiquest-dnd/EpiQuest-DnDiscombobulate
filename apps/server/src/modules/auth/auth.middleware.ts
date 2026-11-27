import type { Request, RequestHandler } from 'express';
import type { Message } from '@epiquest/shared';
import type { AuthService } from './auth.service.ts';

export const SESSION_COOKIE = 'session';

const BEARER_PREFIX = /^Bearer\s+/i;

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && BEARER_PREFIX.test(header)) {
    const token = header.replace(BEARER_PREFIX, '').trim();
    return token === '' ? null : token;
  }

  const cookie: unknown = req.cookies?.[SESSION_COOKIE];
  return typeof cookie === 'string' && cookie !== '' ? cookie : null;
}

export function requireAuth(authService: AuthService): RequestHandler {
  return async (req, res, next) => {
    const token = readToken(req);
    const session = token ? await authService.authenticate(token) : null;
    if (!session) {
      const body: Message = { code: 'auth.unauthenticated' };
      res.status(401).json(body);
      return;
    }

    res.locals.sessionId = session.sessionId;
    res.locals.userId = session.userId;
    next();
  };
}
