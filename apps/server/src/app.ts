import express, { type ErrorRequestHandler } from 'express';
import type { Message } from '@epiquest/shared';

export interface AppOptions {
  /** Dossier du site Vue construit (`apps/web/dist`). En production, le serveur le sert lui-même (ADR-0007). */
  webDir?: string;
}

export function createApp({ webDir }: AppOptions = {}) {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

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

  app.use((_req, res) => {
    const body: Message = { code: 'server.notFound' };
    res.status(404).json(body);
  });

  const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    const body: Message = { code: 'server.internalError' };
    res.status(500).json(body);
  };
  app.use(handleError);

  return app;
}
