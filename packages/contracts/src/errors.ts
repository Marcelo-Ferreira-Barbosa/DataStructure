import { z } from 'zod';

/** Catálogo de códigos de erro da API (API.md §2.9). A interface escolhe a mensagem pelo código. */
export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'INVALID_CREDENTIALS',
  'INVALID_ORIGIN',
  'NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'REGISTRATION_FAILED',
  'QUOTA_EXCEEDED',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'RATE_LIMITED',
  'INTERNAL',
  'SERVICE_UNAVAILABLE',
] as const;
export const errorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** Códigos de campo em `error.fields[].code` (API.md §2.10). */
export const FIELD_ERROR_CODES = [
  'REQUIRED',
  'INVALID_TYPE',
  'INVALID_FORMAT',
  'TOO_SHORT',
  'TOO_LONG',
  'OUT_OF_RANGE',
  'NOT_ALLOWED',
  'UNSUPPORTED_VERSION',
  'NOT_REPLAYABLE',
] as const;
export const fieldErrorCodeSchema = z.enum(FIELD_ERROR_CODES);
export type FieldErrorCode = z.infer<typeof fieldErrorCodeSchema>;

export const fieldErrorSchema = z.object({
  /** Caminho do campo, por exemplo `document.operations[3].value`. */
  field: z.string(),
  code: fieldErrorCodeSchema,
  /** Parâmetros úteis à mensagem: o limite que foi violado. */
  meta: z.object({ min: z.number().optional(), max: z.number().optional() }).optional(),
});
export type FieldError = z.infer<typeof fieldErrorSchema>;

/** Envelope único de erro (API.md §2.8, ADR-0008). */
export const errorResponseSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    /** Texto curto para diagnóstico; não é a mensagem mostrada ao usuário. */
    message: z.string(),
    fields: z.array(fieldErrorSchema).optional(),
    requestId: z.string(),
  }),
});
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
