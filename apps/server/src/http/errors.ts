import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { Message } from '@epiquest/shared';

// Le serveur renvoie des codes, jamais des phrases (ADR-0004).

export const notFound: RequestHandler = (_req, res) => {
  const body: Message = { code: 'server.notFound' };
  res.status(404).json(body);
};

export const handleError: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  const body: Message = { code: 'server.internalError' };
  res.status(500).json(body);
};
