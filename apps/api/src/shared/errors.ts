import type { ErrorCode, FieldError } from '@dss/contracts';

/** Status HTTP de cada código do catálogo (API.md §2.9). Única tabela; ninguém escolhe status à mão. */
export const STATUS_BY_CODE: { readonly [C in ErrorCode]: number } = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  INVALID_ORIGIN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REGISTRATION_FAILED: 409,
  QUOTA_EXCEEDED: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Erro de domínio/transporte esperado: tem código estável e status. Serviços e middlewares os
 * lançam; o tratador central os converte no envelope. Qualquer OUTRA exceção é bug e vira 500.
 */
export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fields?: readonly FieldError[],
  ) {
    super(message);
    this.name = 'AppError';
    this.status = STATUS_BY_CODE[code];
  }
}

export class ValidationError extends AppError {
  constructor(fields: readonly FieldError[]) {
    super('VALIDATION_FAILED', 'Dados inválidos.', fields);
  }
}

export class NotFoundError extends AppError {
  constructor() {
    super('NOT_FOUND', 'Recurso não encontrado.');
  }
}

export class MethodNotAllowedError extends AppError {
  constructor(readonly allowed: readonly string[]) {
    super('METHOD_NOT_ALLOWED', 'Método não permitido para este recurso.');
  }
}

export class InvalidOriginError extends AppError {
  constructor() {
    super('INVALID_ORIGIN', 'Origem da requisição não permitida.');
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor() {
    super('UNSUPPORTED_MEDIA_TYPE', 'O corpo deve ser JSON (application/json).');
  }
}

export class PayloadTooLargeError extends AppError {
  constructor() {
    super('PAYLOAD_TOO_LARGE', 'Corpo da requisição grande demais.');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor() {
    super('SERVICE_UNAVAILABLE', 'Serviço temporariamente indisponível.');
  }
}
