import { loginInputSchema, registerInputSchema, userSchema } from '@epiquest/shared';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { messageResponse, requiresSession } from '../../http/openapi.ts';

const sessionOpened = {
  content: { 'application/json': { schema: userSchema } },
  headers: {
    'Set-Cookie': {
      description: 'Cookie `session` HttpOnly, SameSite=Lax, Secure, valable 7 jours.',
      schema: { type: 'string' as const },
    },
  },
};

export const authPaths: ZodOpenApiPathsObject = {
  '/register': {
    post: {
      tags: ['auth'],
      summary: 'Créer un compte et ouvrir une session',
      requestBody: { content: { 'application/json': { schema: registerInputSchema } } },
      responses: {
        '201': { description: 'Compte créé, session ouverte.', ...sessionOpened },
        '400': messageResponse(
          '`auth.invalidInput`, ou `auth.weakPassword` avec `params: { min, max }`.',
        ),
        '409': messageResponse('`auth.emailTaken`.'),
      },
    },
  },
  '/login': {
    post: {
      tags: ['auth'],
      summary: 'Ouvrir une session',
      requestBody: { content: { 'application/json': { schema: loginInputSchema } } },
      responses: {
        '200': { description: 'Session ouverte.', ...sessionOpened },
        '400': messageResponse('`auth.invalidInput`.'),
        '401': messageResponse(
          '`auth.invalidCredentials` : email inconnu ou mauvais mot de passe, sans distinction.',
        ),
      },
    },
  },
  '/logout': {
    post: {
      tags: ['auth'],
      summary: 'Fermer la session courante',
      security: requiresSession,
      responses: {
        '204': { description: 'Session révoquée, cookie effacé.' },
        '401': messageResponse('`auth.unauthenticated`.'),
      },
    },
  },
};
