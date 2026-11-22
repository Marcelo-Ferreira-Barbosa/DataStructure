import type { RequestHandler } from 'express';
import type { Logger } from '../logger';
import { getRequestId } from './request-id';

/** Uma linha por requisição, ao terminar: método, caminho SEM consulta, status e duração. */
export function requestLogger(logger: Logger): RequestHandler {
  return (req, res, next) => {
    const started = process.hrtime.bigint();
    res.on('finish', () => {
      logger.info('request', {
        requestId: getRequestId(res),
        method: req.method,
        // Sem query string: ela pode carregar dados do usuário.
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        durationMs: Math.round(Number(process.hrtime.bigint() - started) / 1e6),
      });
    });
    next();
  };
}
