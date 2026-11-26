import { Router, type Response } from 'express';
import type { Message } from '@epiquest/shared';
import { EmailTakenError } from '../users/users.errors.ts';
import { InvalidCredentialsError, WeakPasswordError } from './auth.errors.ts';
import { requireAuth, SESSION_COOKIE } from './auth.middleware.ts';
import type { AuthService } from './auth.service.ts';
import type { AuthResult } from './auth.types.ts';

export type AuthRoutesOptions = {
  secureCookies: boolean;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function sendMessage(res: Response, status: number, code: string) {
  const body: Message = { code };
  res.status(status).json(body);
}

export function authRoutes(authService: AuthService, { secureCookies }: AuthRoutesOptions) {
  const router = Router();

  function openSession(res: Response, status: number, { user, token, expiresAt }: AuthResult) {
    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookies,
      path: '/',
      expires: expiresAt,
    });
    res.status(status).json(user);
  }

  router.post('/register', async (req, res) => {
    const { email, password, displayName, locale } = req.body ?? {};
    if (
      !isNonEmptyString(email) ||
      typeof password !== 'string' ||
      !isNonEmptyString(displayName) ||
      (locale !== undefined && !isNonEmptyString(locale))
    ) {
      sendMessage(res, 400, 'auth.invalidInput');
      return;
    }

    try {
      const result = await authService.register({ email, password, displayName, locale }, 'web');
      openSession(res, 201, result);
    } catch (error) {
      if (error instanceof EmailTakenError) {
        sendMessage(res, 409, 'auth.emailTaken');
        return;
      }
      if (error instanceof WeakPasswordError) {
        sendMessage(res, 400, 'auth.weakPassword');
        return;
      }
      throw error;
    }
  });

  router.post('/login', async (req, res) => {
    const { email, password } = req.body ?? {};
    if (!isNonEmptyString(email) || typeof password !== 'string') {
      sendMessage(res, 400, 'auth.invalidInput');
      return;
    }

    try {
      const result = await authService.login({ email, password }, 'web');
      openSession(res, 200, result);
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        sendMessage(res, 401, 'auth.invalidCredentials');
        return;
      }
      throw error;
    }
  });

  router.post('/logout', requireAuth(authService), async (_req, res) => {
    const sessionId: unknown = res.locals.sessionId;
    if (typeof sessionId === 'string') {
      await authService.logout(sessionId);
    }
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.status(204).end();
  });

  return router;
}
