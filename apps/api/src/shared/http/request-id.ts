import { randomUUID } from 'node:crypto';
import type { RequestHandler, Response } from 'express';

/**
 * Identifica cada requisição (API.md §2.1). O valor é SEMPRE gerado aqui: um `X-Request-Id`
 * vindo do cliente é ignorado, para ninguém forjar identificadores nem injetar texto no log.
 */
export function requestId(): RequestHandler {
  return (_req, res, next) => {
    const id = randomUUID();
    res.locals['requestId'] = id;
    res.setHeader('X-Request-Id', id);
    next();
  };
}

export function getRequestId(res: Response): string {
  const id: unknown = res.locals['requestId'];
  return typeof id === 'string' ? id : 'unknown';
}
