import { z } from 'zod';
import type { ZodOpenApiPathsObject } from 'zod-openapi';

export const healthPaths: ZodOpenApiPathsObject = {
  '/': {
    get: {
      tags: ['health'],
      summary: 'Vérifier que le serveur répond',
      responses: {
        '200': {
          description: 'Serveur en marche.',
          content: { 'application/json': { schema: z.object({ status: z.literal('ok') }) } },
        },
      },
    },
  },
};
