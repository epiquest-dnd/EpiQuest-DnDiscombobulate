import { userSchema } from '@epiquest/shared';
import type { ZodOpenApiPathsObject } from 'zod-openapi';
import { messageResponse, requiresSession } from '../../http/openapi.ts';

export const usersPaths: ZodOpenApiPathsObject = {
  '/me': {
    get: {
      tags: ['users'],
      summary: "Profil de l'utilisateur connecté",
      security: requiresSession,
      responses: {
        '200': {
          description: 'Profil, sans le hash du mot de passe.',
          content: { 'application/json': { schema: userSchema } },
        },
        '401': messageResponse('`auth.unauthenticated`.'),
        '404': messageResponse('`users.notFound`.'),
      },
    },
  },
};
