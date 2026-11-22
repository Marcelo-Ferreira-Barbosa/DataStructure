import type { RequestHandler } from 'express';
import { InvalidOriginError } from '../errors';

/**
 * Defesa contra CSRF nas mutações (API.md §2.3): o cabeçalho `Origin` precisa estar presente e
 * ser igual à origem da aplicação. Ausente ou diferente → 403 INVALID_ORIGIN. (Q62 pendente.)
 */
export function requireSameOrigin(allowedOrigin: string): RequestHandler {
  return (req, _res, next) => {
    if (req.get('Origin') !== allowedOrigin) {
      next(new InvalidOriginError());
      return;
    }
    next();
  };
}
