import cookieParser from 'cookie-parser';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import type { Db } from './db/client.ts';
import { handleError, notFound } from './http/errors.ts';
import { createOpenApiDocument, type ApiModule } from './http/openapi.ts';
import { authPaths } from './modules/auth/auth.openapi.ts';
import { authRoutes } from './modules/auth/auth.routes.ts';
import { requireAuth } from './modules/auth/auth.middleware.ts';
import { AuthService } from './modules/auth/auth.service.ts';
import { DrizzleSessionRepository } from './modules/auth/session.repository.drizzle.ts';
import { healthPaths } from './modules/health/health.openapi.ts';
import { healthRoutes } from './modules/health/health.routes.ts';
import { DrizzleUserRepository } from './modules/users/user.repository.drizzle.ts';
import { usersPaths } from './modules/users/users.openapi.ts';
import { usersRoutes } from './modules/users/users.routes.ts';
import { UsersService } from './modules/users/users.service.ts';

export type AppOptions = {
  db: Db;
  /** Dossier du site Vue construit (`apps/web/dist`). En production, le serveur le sert lui-même (ADR-0007). */
  webDir?: string;
  secureCookies?: boolean;
};

export function createApiModules({
  db,
  secureCookies = true,
}: Pick<AppOptions, 'db' | 'secureCookies'>): ApiModule[] {
  const usersService = new UsersService(new DrizzleUserRepository(db));
  const authService = new AuthService(usersService, new DrizzleSessionRepository(db));

  return [
    { prefix: '/api/health', router: healthRoutes(), paths: healthPaths },
    { prefix: '/api/auth', router: authRoutes(authService, { secureCookies }), paths: authPaths },
    {
      prefix: '/api/users',
      middlewares: [requireAuth(authService)],
      router: usersRoutes(usersService),
      paths: usersPaths,
    },
  ];
}

// Les dépendances sont injectées : les tests passent leur propre base.
export function createApp({ db, webDir, secureCookies = true }: AppOptions) {
  const modules = createApiModules({ db, secureCookies });
  const openApiDocument = createOpenApiDocument(modules);

  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  for (const { prefix, middlewares = [], router } of modules) {
    app.use(prefix, ...middlewares, router);
  }

  app.get('/api/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(undefined, { swaggerOptions: { url: '/api/openapi.json' } }),
  );

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
