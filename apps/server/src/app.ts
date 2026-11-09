import express, { type ErrorRequestHandler } from 'express';
import type { Message } from '@epiquest/shared';

export function createApp() {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

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
