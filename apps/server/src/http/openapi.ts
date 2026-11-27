import type { RequestHandler, Router } from 'express';
import { messageSchema } from '@epiquest/shared';
import {
  createDocument,
  type ZodOpenApiPathsObject,
  type ZodOpenApiResponseObject,
} from 'zod-openapi';
import { SESSION_COOKIE } from '../modules/auth/auth.middleware.ts';

export type ApiModule = {
  prefix: string;
  middlewares?: RequestHandler[];
  router: Router;
  paths: ZodOpenApiPathsObject;
};

export const requiresSession: Record<string, string[]>[] = [
  { sessionCookie: [] },
  { bearerAuth: [] },
];

export function messageResponse(description: string): ZodOpenApiResponseObject {
  return { description, content: { 'application/json': { schema: messageSchema } } };
}

export function fullPath(prefix: string, path: string) {
  return path === '/' ? prefix : `${prefix}${path}`;
}

export function createOpenApiDocument(modules: ApiModule[]) {
  const paths: ZodOpenApiPathsObject = {};
  for (const { prefix, paths: modulePaths } of modules) {
    for (const [path, item] of Object.entries(modulePaths)) {
      paths[fullPath(prefix, path)] = item;
    }
  }

  return createDocument({
    openapi: '3.1.0',
    info: {
      title: 'EpiQuest API',
      version: '0.1.0',
      description:
        'Les erreurs renvoient un `Message` : un code à traduire côté client, jamais une phrase (ADR-0004).',
    },
    paths,
    components: {
      securitySchemes: {
        sessionCookie: {
          type: 'apiKey',
          in: 'cookie',
          name: SESSION_COOKIE,
          description: 'Web : cookie HttpOnly posé par `register` et `login`.',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Mobile : le même jeton, dans l’en-tête `Authorization`.',
        },
      },
    },
  });
}
