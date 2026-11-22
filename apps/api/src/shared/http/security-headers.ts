import type { RequestHandler } from 'express';
import helmet from 'helmet';

/**
 * Cabeçalhos de segurança (helmet, padrões) e `Cache-Control: no-store`: as respostas da API
 * podem conter dados do usuário e não devem ser guardadas por navegador nem por intermediários.
 *
 * CORS fica em `cors.ts` (Q98: Web e API em domínios separados).
 */
export function securityHeaders(): RequestHandler[] {
  return [
    helmet(),
    (_req, res, next) => {
      res.setHeader('Cache-Control', 'no-store');
      next();
    },
  ];
}
