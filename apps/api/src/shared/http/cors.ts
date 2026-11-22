import type { RequestHandler } from 'express';

const ALLOWED_METHODS = 'GET, POST, PATCH, DELETE';
const ALLOWED_HEADERS = 'Content-Type';
const PREFLIGHT_MAX_AGE_SECONDS = '600';

/**
 * CORS para o Web em outro domínio (Q98). Política mínima:
 * - UMA origem permitida (`APP_ORIGIN`), comparada por igualdade exata: nunca `*`, nunca eco de
 *   qualquer `Origin` recebido, nunca `null`.
 * - `credentials` ligado, porque a sessão futura (ADR-0009) viaja em cookie.
 * - Só os métodos e o cabeçalho que o contrato usa. `X-Request-Id` fica legível pelo front.
 * - Origem não permitida não recebe NENHUM `Access-Control-*`: o navegador bloqueia a leitura.
 *   CORS protege o leitor, não o servidor; a defesa das mutações continua sendo `requireSameOrigin`.
 */
export function cors(allowedOrigin: string): RequestHandler {
  return (req, res, next) => {
    res.vary('Origin');
    if (req.get('Origin') !== allowedOrigin) {
      next();
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'X-Request-Id');

    const isPreflight =
      req.method === 'OPTIONS' && req.get('Access-Control-Request-Method') !== undefined;
    if (isPreflight) {
      res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
      res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
      res.setHeader('Access-Control-Max-Age', PREFLIGHT_MAX_AGE_SECONDS);
      res.status(204).end();
      return;
    }
    next();
  };
}
