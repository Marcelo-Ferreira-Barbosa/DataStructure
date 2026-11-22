import type { ErrorResponse } from '@dss/contracts';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import {
  AppError,
  MethodNotAllowedError,
  NotFoundError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  ValidationError,
} from '../errors';
import type { Logger } from '../logger';
import { getRequestId } from './request-id';

/** Qualquer rota que não casou: 404 JSON com o envelope padrão (nunca HTML). */
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError());
};

/** Erros do leitor de corpo (`express.json`) trazem `type`; viram erros do catálogo. */
function fromBodyParser(error: unknown): AppError | null {
  if (typeof error !== 'object' || error === null || !('type' in error)) return null;
  switch (error.type) {
    case 'entity.too.large':
      return new PayloadTooLargeError();
    case 'entity.parse.failed':
    case 'entity.verify.failed':
    case 'request.aborted':
    case 'request.size.invalid':
      return new ValidationError([]);
    case 'encoding.unsupported':
    case 'charset.unsupported':
      return new UnsupportedMediaTypeError();
    default:
      return null;
  }
}

/**
 * Tratador central (ADR-0008): TODO erro passa por aqui e sai no envelope único. Erros esperados
 * (`AppError`) mantêm código e status. Qualquer outra exceção é bug: vira 500 `INTERNAL` com
 * mensagem fixa; o detalhe (nome, mensagem, pilha fora de produção) vai SÓ para o log, junto do
 * `requestId`, e nunca para o cliente (RNF-034).
 */
export function errorHandler(
  logger: Logger,
  options: { production: boolean },
): ErrorRequestHandler {
  return (error: unknown, _req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    const known = error instanceof AppError ? error : fromBodyParser(error);
    const requestId = getRequestId(res);

    if (known === null) {
      const detail = error instanceof Error ? error : new Error('exceção desconhecida');
      logger.error('unhandled_error', {
        requestId,
        errorName: detail.name,
        errorMessage: detail.message,
        ...(options.production ? {} : { stack: detail.stack }),
      });
    }

    const appError = known ?? new AppError('INTERNAL', 'Erro interno.');
    if (appError instanceof MethodNotAllowedError) {
      res.setHeader('Allow', appError.allowed.join(', '));
    }

    const body: ErrorResponse = {
      error: {
        code: appError.code,
        message: appError.message,
        ...(appError.fields && appError.fields.length > 0 ? { fields: [...appError.fields] } : {}),
        requestId,
      },
    };
    res.status(appError.status).json(body);
  };
}
