import cookieParser from 'cookie-parser';
import express from 'express';
import type { Db } from './db/client.ts';
import { handleError, notFound } from './http/errors.ts';
import { authRoutes } from './modules/auth/auth.routes.ts';
import { requireAuth } from './modules/auth/auth.middleware.ts';
import { AuthService } from './modules/auth/auth.service.ts';
import { DrizzleSessionRepository } from './modules/auth/session.repository.drizzle.ts';
import { healthRoutes } from './modules/health/health.routes.ts';
import { DrizzleUserRepository } from './modules/users/user.repository.drizzle.ts';
import { usersRoutes } from './modules/users/users.routes.ts';
import { UsersService } from './modules/users/users.service.ts';

export type AppOptions = {
  db: Db;
  /** Dossier du site Vue construit (`apps/web/dist`). En production, le serveur le sert lui-même (ADR-0007). */
  webDir?: string;
  secureCookies?: boolean;
};

// Les dépendances sont injectées : les tests passent leur propre base.
export function createApp({ db, webDir, secureCookies = true }: AppOptions) {
  const usersService = new UsersService(new DrizzleUserRepository(db));
  const authService = new AuthService(usersService, new DrizzleSessionRepository(db));

  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.use('/api/health', healthRoutes());
  app.use('/api/auth', authRoutes(authService, { secureCookies }));
  app.use('/api/users', requireAuth(authService), usersRoutes(usersService));

  if (webDir) {
    app.use(express.static(webDir));
    // Le routage du site se fait côté navigateur : toute page hors de l'API renvoie index.html.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path === '/api' || req.path.startsWith('/api/')) {
        next();
        return;
      }
      res.sendFile('index.html', { root: webDir });
    });
  }

  app.use(notFound);
  app.use(handleError);

  return app;
}
