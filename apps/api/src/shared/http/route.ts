import type { RequestHandler, Router } from 'express';
import { MethodNotAllowedError } from '../errors';

/** Cadeia de handlers por método HTTP de uma rota. */
export interface RouteHandlers {
  get?: RequestHandler[];
  post?: RequestHandler[];
  patch?: RequestHandler[];
  delete?: RequestHandler[];
}

/**
 * Registra uma rota e responde **405** (com `Allow`) a qualquer método não declarado, em vez do
 * 404 padrão do Express (API.md §2.1: "outros métodos devolvem 405 com o envelope padrão").
 */
export function mountRoute(router: Router, path: string, handlers: RouteHandlers): void {
  const route = router.route(path);
  const allowed: string[] = [];

  if (handlers.get) {
    route.get(...handlers.get);
    allowed.push('GET', 'HEAD'); // o Express responde HEAD a partir do GET
  }
  if (handlers.post) {
    route.post(...handlers.post);
    allowed.push('POST');
  }
  if (handlers.patch) {
    route.patch(...handlers.patch);
    allowed.push('PATCH');
  }
  if (handlers.delete) {
    route.delete(...handlers.delete);
    allowed.push('DELETE');
  }

  route.all((_req, _res, next) => {
    next(new MethodNotAllowedError(allowed));
  });
}
