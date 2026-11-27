import { Router, type Response } from 'express';
import {
  loginInputSchema,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  registerInputSchema,
  type Message,
} from '@epiquest/shared';
import { EmailTakenError } from '../users/users.errors.ts';
import { InvalidCredentialsError } from './auth.errors.ts';
import { requireAuth, SESSION_COOKIE } from './auth.middleware.ts';
import type { AuthService } from './auth.service.ts';
import type { AuthResult } from './auth.types.ts';

export type AuthRoutesOptions = {
  secureCookies: boolean;
};

function sendMessage(res: Response, status: number, code: string, params?: Message['params']) {
  const body: Message = params ? { code, params } : { code };
  res.status(status).json(body);
}

type ValidationIssue = { path: PropertyKey[]; code: string };

function isOnlyPasswordLength(issues: ValidationIssue[]) {
  return issues.every(
    (issue) =>
      issue.path[0] === 'password' && (issue.code === 'too_small' || issue.code === 'too_big'),
  );
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
    const input = registerInputSchema.safeParse(req.body);
    if (!input.success) {
      if (isOnlyPasswordLength(input.error.issues)) {
        sendMessage(res, 400, 'auth.weakPassword', {
          min: PASSWORD_MIN_LENGTH,
          max: PASSWORD_MAX_LENGTH,
        });
        return;
      }
      sendMessage(res, 400, 'auth.invalidInput');
      return;
    }

    try {
      const result = await authService.register(input.data, 'web');
      openSession(res, 201, result);
    } catch (error) {
      if (error instanceof EmailTakenError) {
        sendMessage(res, 409, 'auth.emailTaken');
        return;
      }
      throw error;
    }
  });

  router.post('/login', async (req, res) => {
    const input = loginInputSchema.safeParse(req.body);
    if (!input.success) {
      sendMessage(res, 400, 'auth.invalidInput');
      return;
    }

    try {
      const result = await authService.login(input.data, 'web');
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
