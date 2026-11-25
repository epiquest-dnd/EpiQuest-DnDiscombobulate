import { Router } from 'express';
import type { Message } from '@epiquest/shared';
import type { UsersService } from './users.service.ts';

export function usersRoutes(usersService: UsersService) {
  const router = Router();

  router.get('/me', async (_req, res) => {
    const userId: unknown = res.locals.userId;
    if (typeof userId !== 'string') {
      const body: Message = { code: 'auth.unauthenticated' };
      res.status(401).json(body);
      return;
    }

    const user = await usersService.findById(userId);
    if (!user) {
      const body: Message = { code: 'users.notFound' };
      res.status(404).json(body);
      return;
    }

    res.json(user);
  });

  return router;
}
