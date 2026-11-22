import express, { type RequestHandler } from 'express';
import { UnsupportedMediaTypeError } from '../errors';

/** Limites de corpo (API.md §2.4). */
export const BODY_LIMIT = '16kb';

/**
 * Exige `Content-Type: application/json` quando HÁ corpo (415 caso contrário) e limita o tamanho
 * (413 pelo tratador central). É aplicado por rota, depois de a rota e o método existirem
 * (ordem de verificação, API.md §2.5).
 */
export function jsonBody(limit: string = BODY_LIMIT): RequestHandler[] {
  const requireJson: RequestHandler = (req, _res, next) => {
    // `req.is` devolve null sem corpo, false se o tipo não bate e o tipo se bate.
    if (req.is('application/json') === false) {
      next(new UnsupportedMediaTypeError());
      return;
    }
    next();
  };
  return [requireJson, express.json({ limit })];
}
